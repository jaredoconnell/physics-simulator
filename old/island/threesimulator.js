var scene, camera, renderer, simulator;
var geometry, material, mesh;

var pitchObject, yawObject;
var PI_2 = Math.PI / 2;

function init() {
	simulator = document.getElementById("simulator");
	
    scene = new THREE.Scene();

	// Camera
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

	// World
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setPath(window.location.href);
	var url = "Small_Tropical_Island.mtl";
	mtlLoader.load( url, function( materials ) {

		materials.preload();

		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials( materials );
		objLoader.setPath('');
		objLoader.load( 'Small Tropical Island.obj', function ( object ) {

			object.position.y = 0;
			object.castShadow = true;
			object.receiveShadow = true;
			scene.add( object );

		}, null, null);

	});
	
	// Lights
	const sunLight = new THREE.DirectionalLight(0xFFE8D4, 1);
	const hemiLight = new THREE.HemisphereLight( 0xc9d1ff, 0xffffff, 0.3);

	// set its position
	sunLight.position.x = -1200;
	sunLight.position.y = 300;
	sunLight.position.z = 120;


	// add to the scene
	scene.add(sunLight);
	scene.add(hemiLight);
	
	// Renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x5c98f9);
	resizeRenderer()
	
	initializeCamera();
	
	//loadSkybox("dawnmountain");
	
	simulator.appendChild( renderer.domElement );

	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
}

function loadSkybox(name) {
	var imagePrefix = "images/" + name + "-";
	var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
	var imageSuffix = ".png";
	   
	var materialArray = [];
	for (var i = 0; i < 6; i++)
		materialArray.push( new THREE.MeshBasicMaterial({
	   map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
	   side: THREE.BackSide
	}));
	  
	var skyGeometry = new THREE.CubeGeometry( 500, 500, 500 );
	var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
	skyBox.rotation.x += Math.PI / 2;
	scene.add( skyBox );
}


function initializeCamera() {
	camera.rotation.set( 0, 0, 0 );

	pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );
	
	yawObject.translateY(10);
	yawObject.translateZ(5);
	
	scene.add(yawObject);
}

function resizeRenderer() {
	var simulatorDiv = document.getElementById("simulator");
	// Canvas resolution
	renderer.setSize(simulatorDiv.clientWidth, simulatorDiv.clientHeight);
	renderer.setPixelRatio(resolutionScaleOfCanvas);
}

var lastTime = new Date().getTime();
var joggingAngle = 0;

function animateThree() {
	if(renderer != null) {
		var timeNow = new Date().getTime();
		
		var elapsed = timeNow - lastTime;
		
		if(yawRate != 0 || pitchRate != 0) {
			yawObject.rotation.y += yawRate;
			pitchObject.rotation.x += pitchRate;

			pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
		}
		
		if(forwardSpeed != 0) {
			yawObject.translateZ(- forwardSpeed * elapsed);
		}
		if(sideSpeed != 0) {
			yawObject.translateX(sideSpeed * elapsed);
		}
		
		if(forwardSpeed != 0 || sideSpeed != 0) {
			joggingAngle += elapsed * 0.6;  // 0.6 "fiddle factor"
			yawObject.translateY(Math.sin(degToRad(joggingAngle)) / 100);
		}
		if(verticalSpeed != 0) {
			yawObject.translateY(verticalSpeed * elapsed);
		}
		
		lastTime = timeNow;
	

		renderer.render( scene, camera );
	}
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// CONTROLS
var currentlyPressedKeys = {};

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

var pitchRate = 0;
var pitch = 0;

var yawRate = 0;
var yaw = 0;

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
		forwardSpeed = 0.03;
	} else if (currentlyPressedKeys[83]) {
		// S
		forwardSpeed = -0.03;
	} else {
		forwardSpeed = 0;
	}
	
	if (currentlyPressedKeys[65]) {
		// A
		sideSpeed = -0.03;
	} else if (currentlyPressedKeys[68]) {
		// D
		sideSpeed = 0.03;
	} else {
		sideSpeed = 0;
	}
	if (currentlyPressedKeys[32]) {
		// Spacebar
		verticalSpeed = 0.03;
	} else if (currentlyPressedKeys[16]) {
		// Shift
		verticalSpeed = -0.03;
	} else {
		verticalSpeed = 0;
	}
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
	animateThree();
	handleKeys();
	framesSinceLastCheck++;
});