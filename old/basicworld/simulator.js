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
			console.log(gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
			initShaders();
			initBuffers();
			initTexture();
			loadWorld();

			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.enable(gl.DEPTH_TEST); // TODO: Make this more efficent by doing it javascript-side
			
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

	//shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	//gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
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
	xImage.src = "stone.png";
}

function handleLoadedTexture(texture) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
	
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var currentlyPressedKeys = {};

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

var pitch = 0;
var pitchRate = 0;

var yaw = 0;
var yawRate = 0;

var xPos = 0;
var yPos = 0.4;
var zPos = 0;

var forwardSpeed = 0;
var sideSpeed = 0;
var verticalSpeed = 0;

function handleKeys() {
	if (currentlyPressedKeys[38]) {
		// Up arrow
		pitchRate = 0.1;
	} else if (currentlyPressedKeys[40]) {
		// Down arrow
		pitchRate = -0.1;
	} else {
		pitchRate = 0;
	}

	if (currentlyPressedKeys[37]) {
		// Left cursor key
		yawRate = 0.1;
	} else if (currentlyPressedKeys[39]) {
		// Right cursor key
		yawRate = -0.1;
	} else {
		yawRate = 0;
	}

	if (currentlyPressedKeys[87]) {
		// W
		forwardSpeed = 0.003;
	} else if (currentlyPressedKeys[83]) {
		// S
		forwardSpeed = -0.003;
	} else {
		forwardSpeed = 0;
	}
	
	if (currentlyPressedKeys[65]) {
		// A
		sideSpeed = -0.003;
	} else if (currentlyPressedKeys[68]) {
		// D
		sideSpeed = 0.003;
	} else {
		sideSpeed = 0;
	}
	if (currentlyPressedKeys[32]) {
		// Spacebar
		verticalSpeed = 0.003;
	} else if (currentlyPressedKeys[16]) {
		// Shift
		verticalSpeed = -0.003;
	} else {
		verticalSpeed = 0;
	}
		
}

var stars = [];
function initWorldObjects() {
	var numStars = 30;

	for (var i=0; i < numStars; i++) {
		stars.push(new Star((i / numStars) * 10.0, i / numStars));
	}
}

function drawScene() {
	if(gl != null) {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		if (worldVertexTextureCoordBuffer == null || worldVertexPositionBuffer == null) {
			return;
		}
		// View angle, ratio, something, view distance
		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 500.0, pMatrix);
		mat4.identity(mvMatrix);
		mat4.rotate(mvMatrix, degToRad(-pitch), [1, 0, 0]);
		mat4.rotate(mvMatrix, degToRad(-yaw), [0, 1, 0]);
		mat4.translate(mvMatrix, [-xPos, -yPos, -zPos]);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);
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

// ------------------------ WORLD ----------------------- //
var worldVertexPositionBuffer = null;
var worldVertexTextureCoordBuffer = null;
function handleLoadedWorld(data) {
	var lines = data.split("\n");
	var vertexCount = 0;
	var vertexPositions = [];
	var vertexTextureCoords = [];
	for (var i in lines) {
		var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
		if (vals.length == 5 && vals[0] != "//") {
			// It is a line describing a vertex; get X, Y and Z first
			vertexPositions.push(parseFloat(vals[0]));
			vertexPositions.push(parseFloat(vals[1]));
			vertexPositions.push(parseFloat(vals[2]));

			// And then the texture coords
			vertexTextureCoords.push(parseFloat(vals[3]));
			vertexTextureCoords.push(parseFloat(vals[4]));

			vertexCount += 1;
		}
	}

	worldVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
	worldVertexPositionBuffer.itemSize = 3;
	worldVertexPositionBuffer.numItems = vertexCount;

	worldVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
	worldVertexTextureCoordBuffer.itemSize = 2;
	worldVertexTextureCoordBuffer.numItems = vertexCount;

	document.getElementById("canvas_overlay").textContent = "";
}

function loadWorld() {
	var request = new XMLHttpRequest();
	//request.open("GET", "Small Tropical Island.obj");
	//request.open("GET", "lowpolymountains.obj");
	request.open("GET", "world.txt");
	request.onreadystatechange = function() {
		if (request.readyState == 4) {
			handleLoadedWorld(request.responseText);
			/*var mesh = new OBJ.Mesh(request.responseText);
			OBJ.initMeshBuffers(gl, mesh);
			
			worldVertexPositionBuffer = mesh.vertexBuffer;
			gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
			worldVertexPositionBuffer.itemSize = mesh.vertexBuffer.itemSize;
			worldVertexPositionBuffer.numItems = mesh.vertexBuffer.numItems;

			// it's possible that the mesh doesn't contain
			// any texture coordinates (e.g. suzanne.obj in the development branch).
			// in this case, the texture vertexAttribArray will need to be disabled
			// before the call to drawElements
			if(!mesh.textures.length){
				gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
			} else {
				// if the texture vertexAttribArray has been previously
				// disabled, then it needs to be re-enabled
				gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
				
				worldVertexTextureCoordBuffer = mesh.textureBuffer;
				gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
				worldVertexTextureCoordBuffer.itemSize = mesh.textureBuffer.itemSize;
				worldVertexTextureCoordBuffer.numItems = mesh.textureBuffer.numItems;
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

			//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
			//gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			
			document.getElementById("canvas_overlay").textContent = "Loading textures..";
			
			
			
			document.getElementById("canvas_overlay").textContent = "";*/
		}
	}
	request.send();
}
// --------------------- ANIMATIONS --------------------- //


var lastTime = 0;
// Used to make us "jog" up and down as we move forward.
var joggingAngle = 0;

function animate() {
	var timeNow = new Date().getTime();
	
	var elapsed = timeNow - lastTime;
	
	yaw += yawRate * elapsed;
	pitch += pitchRate * elapsed;
	pitch = Math.max(-90, pitch);
	pitch = Math.min(90, pitch);
	
	xPos -= Math.sin(degToRad(yaw)) * forwardSpeed * elapsed;
	zPos -= Math.cos(degToRad(yaw)) * forwardSpeed * elapsed;
	xPos -= Math.sin(degToRad(yaw - 90)) * sideSpeed * elapsed;
	zPos -= Math.cos(degToRad(yaw - 90)) * sideSpeed * elapsed;
	
	if(forwardSpeed != 0 || sideSpeed != 0) {
		joggingAngle += elapsed * 0.6;  // 0.6 "fiddle factor"
		yPos += Math.sin(degToRad(joggingAngle)) / 100;
	}
	yPos += verticalSpeed * elapsed;
	
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