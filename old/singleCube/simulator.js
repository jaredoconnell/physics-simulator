// http://learningwebgl.com/blog/?p=370

function getStyle(name) {
	return document.getElementById(name).style;
}

function openCloseNav() {
	var button = document.getElementById("panel_button");
	if(button.innerHTML.indexOf("Close") >= 0) {
		closeNav();
		button.innerHTML = button.innerHTML.replace("Close", "Open");
	} else {
		openNav();
		button.innerHTML = button.innerHTML.replace("Open", "Close");
	}
}

var sidePanelWidth = "280px";
// The scale, relative to the actual display width, that the canvas will render at.
// Anything more than 1 is pointless. 
// TODO: Make it so when the device is lagging, lower this then call resizeCanvas again.
var resolutionScaleOfCanvas = 1.0;

/* Opens the right-oriented nav.*/
function openNav() {
	var sidePanelStyle = getStyle("side_panel");
	var sidePanelContentStyle = getStyle("panel_content");
	var panelButtonStyle = getStyle("panel_button");
	sidePanelContentStyle.width = sidePanelWidth;
	sidePanelStyle.left = "-" + sidePanelWidth;
	panelButtonStyle.right = sidePanelWidth;
}

/* Opens the left-oriented nav.*/
function closeNav() {
	var sidePanelStyle = getStyle("side_panel");
	var sidePanelContentStyle = getStyle("panel_content");
	var panelButtonStyle = getStyle("panel_button");
	sidePanelContentStyle.width = "1px";
	sidePanelStyle.left = "1px";
	panelButtonStyle.right = "0px";
}

/* Resizes the canvas to fit into place. */
function resizeCanvas() {
	var canvas = document.getElementById("main_canvas");
	var simulatorDiv = document.getElementById("simulator");
	// Canvas resolution
	canvas.width = simulatorDiv.clientWidth * resolutionScaleOfCanvas;
	canvas.height = simulatorDiv.clientHeight * resolutionScaleOfCanvas;
	// Canvas width
	canvas.style.width = simulatorDiv.clientWidth + "px";
	canvas.style.height = simulatorDiv.clientHeight + "px";
	
	if(gl != null) {
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}
	console.log("Resized at scale " + resolutionScaleOfCanvas);
}

function webGLStart() {
	console.log("WebGL starting");
		var canvas = document.getElementById("main_canvas");
		initGL(canvas);
		if(gl) {
			initShaders();
			initBuffers();
			initTexture();
			initWorldObjects();

			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			//gl.enable(gl.DEPTH_TEST); // TODO: Make this more efficent by doing it javascript-side
			
			document.onkeydown = handleKeyDown;
			document.onkeyup = handleKeyUp;
		} else {
			alert("Your browser does not support WebGL");
			// TODO: Draw this onto the canvas.
		}
}

var gl = null;
function initGL(canvas) {
	try {
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch(e) {}
	if (!gl) {
		alert("Could not initialise WebGL");
	}
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
// Buffers
var cubeVertexPositionBuffer;
var cubeVertexIndexBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexNormalBuffer;

var shaderProgram;

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

// Shaders are used so the GPU does more of the work, increasing performance. 
function initShaders() {
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}
	gl.useProgram(shaderProgram);
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
	shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
	shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
	shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
	gl.uniform1f(shaderProgram.alphaUniform, 1);
}


function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}
	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3)
			str += k.textContent;
		k = k.nextSibling;
	}
	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}
	gl.shaderSource(shader, str);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function initBuffers() {	
	// Cube
	
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	vertices = [
		// Front face
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,
		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,
		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		1.0,  1.0,  1.0,
		1.0,  1.0, -1.0,

		// Bottom face
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,
			// Right face
		1.0, -1.0, -1.0,
		1.0,  1.0, -1.0,
		1.0,  1.0,  1.0,
		1.0, -1.0,  1.0,
		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 24;

	cubeVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	var textureCoords = [
	  // Front face
	  0.0, 0.0,
	  1.0, 0.0,
	  1.0, 1.0,
	  0.0, 1.0,

	  // Back face
	  1.0, 0.0,
	  1.0, 1.0,
	  0.0, 1.0,
	  0.0, 0.0,

	  // Top face
	  0.0, 1.0,
	  0.0, 0.0,
	  1.0, 0.0,
	  1.0, 1.0,

	  // Bottom face
	  1.0, 1.0,
	  0.0, 1.0,
	  0.0, 0.0,
	  1.0, 0.0,

	// Right face
	  1.0, 0.0,
	  1.0, 1.0,
	  0.0, 1.0,
	  0.0, 0.0,

	  // Left face
	  0.0, 0.0,
	  1.0, 0.0,
	  1.0, 1.0,
	  0.0, 1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
	cubeVertexTextureCoordBuffer.itemSize = 2;
	cubeVertexTextureCoordBuffer.numItems = 24;
	
	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	var cubeVertexIndices = [
	  0, 1, 2,   0, 2, 3,	// Front face
	  4, 5, 6,   4, 6, 7,	// Back face
	  8, 9, 10,  8, 10, 11,  // Top face
	  12, 13, 14,12, 14, 15, // Bottom face
	  16, 17, 18,16, 18, 19, // Right face
	  20, 21, 22,20, 22, 23  // Left face
	]
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = 36;
	
	cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    var vertexNormals = [
      // Front face
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,

      // Back face
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,

      // Top face
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,

      // Bottom face
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,

      // Right face
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,

      // Left face
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = 24;
}

var crateTexture;

function initTexture() {
	var xImage = new Image();

	var texture = gl.createTexture();
	texture.image = xImage;
	crateTexture = texture;

	xImage.onload = function() {
		handleLoadedTexture(crateTexture)
	}
	xImage.src = "x.png";
}

function handleLoadedTexture(texture) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
	
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var xRot = 0;
var xSpeed = 0;

var yRot = 0;
var ySpeed = 0;

var camAngle = 45;

var currentlyPressedKeys = {};

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
	if (currentlyPressedKeys[33]) {
		// Page Up
		camAngle -= 1;
	}
	if (currentlyPressedKeys[34]) {
		// Page Down
		camAngle += 1;
	}
	if (currentlyPressedKeys[37]) {
		// Left cursor key
		ySpeed -= 1;
	}
	if (currentlyPressedKeys[39]) {
		// Right cursor key
		ySpeed += 1;
	}
	if (currentlyPressedKeys[38]) {
		// Up cursor key
		xSpeed -= 1;
	}
	if (currentlyPressedKeys[40]) {
		// Down cursor key
		xSpeed += 1;
	}
}

function drawScene() {
	if(gl != null) {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		mat4.perspective(camAngle, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
		mat4.identity(mvMatrix);
	
		// Cube
		mvPushMatrix();
		mat4.translate(mvMatrix, [0.0, 0.0, -5]);

		mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
		mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
		//mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]);
		
		// Tell WebGL to use cube buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		// For lighting
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		// For texture
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		// Texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, crateTexture);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
		
		var blending = document.getElementById("blending").checked;
		if (blending) {
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
			gl.enable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);
			gl.uniform1f(shaderProgram.alphaUniform, parseFloat(document.getElementById("alpha").value));
		} else {
			gl.disable(gl.BLEND);
			gl.enable(gl.DEPTH_TEST);
		}
		
		
		var useLighting = document.getElementById("lighting").checked;
		gl.uniform1i(shaderProgram.useLightingUniform, useLighting);
		
		if (lighting) {
            gl.uniform3f(
                shaderProgram.ambientColorUniform,
                parseFloat(document.getElementById("ambientR").value),
                parseFloat(document.getElementById("ambientG").value),
                parseFloat(document.getElementById("ambientB").value)
            );
            var lightingDirection = [
                parseFloat(document.getElementById("lightDirectionX").value),
                parseFloat(document.getElementById("lightDirectionY").value),
                parseFloat(document.getElementById("lightDirectionZ").value)
            ];
            var adjustedLD = vec3.create();
            vec3.normalize(lightingDirection, adjustedLD);
            vec3.scale(adjustedLD, -1);
            gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
            gl.uniform3f(
                shaderProgram.directionalColorUniform,
                parseFloat(document.getElementById("directionalR").value),
                parseFloat(document.getElementById("directionalG").value),
                parseFloat(document.getElementById("directionalB").value)
            );
        }

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
		setMatrixUniforms();
		gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		mvPopMatrix();
	}
}

function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	
	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

// --------------------- ANIMATIONS --------------------- //


var lastTime = 0;
function animate() {
	var timeNow = new Date().getTime();
	if (lastTime != 0) {
		var elapsed = timeNow - lastTime;
		xRot += (xSpeed * elapsed) / 1000.0;
		yRot += (ySpeed * elapsed) / 1000.0;
	}
	lastTime = timeNow;
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

function tick() {
	drawScene();
	animate();
	handleKeys();

	framesSinceLastCheck++;
}
 
(function() {
	var onEachFrame;
	if(window.requestAnimationFrame) {
		onEachFrame = function(callback) {
			var _callback = function() { callback(); requestAnimationFrame(_callback); }
			_callback();
		};
	} else if (window.webkitRequestAnimationFrame) {
		onEachFrame = function(callback) {
		var _callback = function() { callback(); webkitRequestAnimationFrame(_callback); }
		_callback();
		};
	} else if (window.mozRequestAnimationFrame) {
		onEachFrame = function(callback) {
		var _callback = function() { callback(); mozRequestAnimationFrame(_callback); }
		_callback();
		};
	} else {
		alert("Your browser does not support RequestAnimationFrame! This simulator will will not perform at optimal performance, and will use up more resources when you are using another tab.");
		onEachFrame = function(callback) {
			setInterval(callback, 1000 / 60);
		}
	}

	window.onEachFrame = onEachFrame;
})();

window.onEachFrame(function() {
	tick();
});

// FPS counter
var timeOfLastCheck;
var framesSinceLastCheck;
var ticksAtGoodFrameRate = 0;

(function(){
	// TODO: Make rezise smarter if possible (If it can be determined which component is causing the lag).
    var newTime = Date.now();
	var timeSinceLastCheck = newTime - timeOfLastCheck;

	if(timeSinceLastCheck === 0)
		timeSinceLastCheck = 1;
	else if(timeSinceLastCheck < 0)
		throw "Invalid time";
	
	var FPS = ((framesSinceLastCheck / timeSinceLastCheck) * 1000).toFixed(3);
	var FPSH1 = document.getElementById("FPS");
	var canvas = document.getElementById("main_canvas");
	if(FPSH1 != null) {
		FPSH1.innerHTML = ("FPS: " + FPS + "\n at " + canvas.width + "x" + canvas.height);
	}
	
	/*if(FPS < 30) {
		if(resolutionScaleOfCanvas > 0.5) {
			resolutionScaleOfCanvas -= 0.1;
			resizeCanvas();
		}
		ticksAtGoodFrameRate = 0;
	} else if (FPS > 50 && resolutionScaleOfCanvas < 1.0) {
		ticksAtGoodFrameRate++;
		
		if(ticksAtGoodFrameRate > 10) {
			resolutionScaleOfCanvas = Math.min(resolutionScaleOfCanvas + 0.1, 1);
			resizeCanvas();
			ticksAtGoodFrameRate = 0;
		}
	}*/

	timeOfLastCheck = newTime;
	framesSinceLastCheck = 0;
    setTimeout(arguments.callee, 250);
})();