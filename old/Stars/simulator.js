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
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
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

var starVertexPositionBuffer;
var starVertexTextureCoordBuffer;
function initBuffers() {
	starVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
	vertices = [
		-1.0, -1.0,  0.0,
		 1.0, -1.0,  0.0,
		-1.0,  1.0,  0.0,
		 1.0,  1.0,  0.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	starVertexPositionBuffer.itemSize = 3;
	starVertexPositionBuffer.numItems = 4;
	starVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
	var textureCoords = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
	starVertexTextureCoordBuffer.itemSize = 2;
	starVertexTextureCoordBuffer.numItems = 4;
}


var texture;

function initTexture() {
	var xImage = new Image();

	var loadingTexture = gl.createTexture();
	loadingTexture.image = xImage;
	texture = loadingTexture;

	xImage.onload = function() {
		handleLoadedTexture(texture)
	}
	xImage.src = "star.gif";
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

var tilt = 90;
var spin = 0;

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
	if (currentlyPressedKeys[38]) {
		// Up cursor key
		tilt += 2;
	}
	if (currentlyPressedKeys[40]) {
		// Down cursor key
		tilt -= 2;
	}
}

var stars = [];
function initWorldObjects() {
	var numStars = 1000;

	for (var i=0; i < numStars; i++) {
		stars.push(new Star((i / numStars) * 20.0, i / numStars));
	}
}

function drawScene() {
	if(gl != null) {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		mat4.perspective(camAngle, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
		mat4.identity(mvMatrix);
		
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.enable(gl.BLEND);
		
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [0.0, 0.0, -30]);
		mat4.rotate(mvMatrix, degToRad(tilt), [1.0, 0.0, 0.0]);
		
		var twinkle = document.getElementById("twinkle").checked;
		for (var i in stars) {
			stars[i].draw(tilt, spin, twinkle);
			spin += 0.1;
		}
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

// ------------------------ STARS ----------------------- //
function drawStar() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, starVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, starVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, starVertexPositionBuffer.numItems);
}

function Star(startingDistance, rotationSpeed) {
	this.angle = 0;
	this.dist = startingDistance;
	this.rotationSpeed = rotationSpeed;

	// Set the colors to a starting value.
	this.randomiseColors();
}

Star.prototype.draw = function(tilt, spin, twinkle) {
    mvPushMatrix();
	
	// Move to the star's position
	mat4.rotate(mvMatrix, degToRad(this.angle), [0.0, 1.0, 0.0]);
	mat4.translate(mvMatrix, [this.dist, 0.0, 0.0]);
	
	// Rotate back so that the star is facing the viewer
	mat4.rotate(mvMatrix, degToRad(-this.angle), [0.0, 1.0, 0.0]);
	mat4.rotate(mvMatrix, degToRad(-tilt), [1.0, 0.0, 0.0]);
	
	if (twinkle) {
		// Draw a non-rotating star in the alternate "twinkling" color
		gl.uniform3f(shaderProgram.colorUniform, this.twinkleR, this.twinkleG, this.twinkleB);
		drawStar();
	}

	// All stars spin around the Z axis at the same rate
	mat4.rotate(mvMatrix, degToRad(spin), [0.0, 0.0, 1.0]);

	// Draw the star in its main color
	gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
	drawStar();
	mvPopMatrix();
};

var effectiveFPMS = 60 / 1000;
Star.prototype.animate = function(elapsedTime) {
	this.angle += this.rotationSpeed * effectiveFPMS * elapsedTime;
	
	// Decrease the distance, resetting the star to the outside of
	// the spiral if it's at the center.
	this.dist -= 0.01 * effectiveFPMS * elapsedTime;
	if (this.dist < 0.0) {
		this.dist += 20.0;
		this.randomiseColors();
	}
};

Star.prototype.randomiseColors = function() {
	// Give the star a random color
	this.r = Math.random();
	this.g = Math.random();
	this.b = Math.random();

	// When the star is twinkling, we draw it twice, once
	// in the color below (not spinning) and then once in the
	// main color defined above.
	this.twinkleR = Math.random();
	this.twinkleG = Math.random();
	this.twinkleB = Math.random();
};

// --------------------- ANIMATIONS --------------------- //


var lastTime = 0;
function animate() {
	var timeNow = new Date().getTime();
	if (lastTime != 0) {
		var elapsed = timeNow - lastTime;
		
		for (var i in stars) {
			stars[i].animate(elapsed);
		}
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