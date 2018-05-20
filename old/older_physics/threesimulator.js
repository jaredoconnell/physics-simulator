var scene, sceneHUD, camera, cameraHUD, renderer, simulator;
var cube;

var pitchObject, yawObject;
var PI_2 = Math.PI / 2;
var PI_1000 = Math.PI / 1000;

function init() {
	HUDText = "Loading..";
	
	loadSettings();
	
	simulator = document.getElementById("simulator");
	
    scene = new THREE.Scene();

	// camera
	camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 10000 );
	initializeCamera();
	
	// Lights
	var sunLight = new THREE.SpotLight(0xFFE8D4, 1);
	var ambLight = new THREE.AmbientLight( 0xc9d1ff, 0.3);

	// set its position
	sunLight.position.x = 0;
	sunLight.position.y = 800;
	sunLight.position.z = 0;


	// add to the scene
	scene.add(sunLight);
	scene.add(ambLight);
	
	// Light bulb
	var objLoader = new THREE.OBJLoader();
	objLoader.setPath('');
	objLoader.load( 'light.obj', function ( object ) {

		object.position.y = 750;
		object.position.z = -100;
		object.rotation.x = (1.2/2) * Math.PI;
		object.scale.set(0.03,0.03,0.03)
		scene.add( object );
		HUDText = "";

	}, function(xhr){console.log("Light " + Math.round(xhr.loaded / xhr.total * 100) + '% loaded')},
		function(xhr){console.error("Error loading the light")});
	
	loadWorld();
	
	// Renderer
	renderer = new THREE.WebGLRenderer({canvas: document.getElementById("simulator-canvas")});
	renderer.setClearColor(0x5c98f9);
	resizeRenderer();
	renderer.autoClear = false; // Needed for the two things rendering.
	
	initializeHUD();
	initializeControls();
	
	startLoop();
	loadFPSStats();
}

function loadWorld() {	
	var loader = new THREE.TextureLoader();
	loader.load('images/rocktexture.jpg', function ( texture ) {
		texture.wrapS = THREE.RepeatWrapping; 
		texture.wrapT = THREE.RepeatWrapping;
		var geometry = new THREE.CubeGeometry(800, 800, 800, 800);
		var material = new THREE.MeshPhongMaterial({map: texture, overdraw: 0.5, shininess: 30});
		cube = new THREE.Mesh(geometry, material);
		cube.position.y = 400;
		cube.material.side = THREE.DoubleSide;
		cube.rotation.z = Math.PI / 2;
		cube.rotation.x = Math.PI / 2;
		scene.add(cube);
	});
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
	// Canvas resolution
	renderer.setSize(simulator.clientWidth, simulator.clientHeight);
	renderer.setPixelRatio(resolutionScaleOfCanvas);

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	if(hudCanvas !== undefined) {
		hudCanvas.width = simulator.clientWidth;
		hudCanvas.height = simulator.clientHeight;
		
		calculateHUDPositions();
	}
	controlsChanged = true;
}

var lastTime = new Date().getTime();
var joggingAngle = 0;
var frameIndex = 0;

function animateThree() {
	if(renderer != null) {
		var timeNow = new Date().getTime();
		
		var elapsed = timeNow - lastTime;
		elapsed = Math.min(1000, elapsed);
		
		if(yawRate != 0 || pitchRate != 0) {
			yawObject.rotation.y += yawRate * elapsed;
			pitchObject.rotation.x += pitchRate * elapsed;

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
		
		var collided = [];
		var speed;
		 if(document.getElementById("checkBox").checked)
			 speed = 1
		 else
			 speed = 60;
		
		var length = projectiles.length;
		for(var i = 0; i < length; i++) {
			projectiles[i].update(elapsed/speed, collided);
		}
		
		lastTime = timeNow;
	

		renderer.render( scene, camera );
		updateHUD();
	}
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// -------------------------------------------------------- //
// -------------------------- HUD ------------------------- //
// -------------------------------------------------------- //
var HUDText = null;
var hudCanvas, controlsChanged = false;

function initializeHUD() {
	
	// HUD will be a 2d canvas.
	hudCanvas = document.getElementById('hud-canvas');
	
	// Oversampling for better quality.
	hudCanvas.width = simulator.clientWidth;
	hudCanvas.height = simulator.clientHeight;
	
	hudContext = hudCanvas.getContext('2d');
	hudContext.shadowColor = "black";
	hudContext.textAlign = 'center';
	
	calculateHUDPositions();
}

function calculateHUDPositions() {
	posTouchCenter = new THREE.Vector2(simulator.clientWidth / 6, simulator.clientHeight * 11 / 16);
	dirTouchCenter = new THREE.Vector2(simulator.clientWidth * (5 / 6), simulator.clientHeight * (11 / 16));
	vertTouchCenter = new THREE.Vector2(simulator.clientWidth * (1/2), simulator.clientHeight * (11 / 16));
	maxDistance = Math.min(simulator.clientWidth / 7, simulator.clientHeight / 6);
	controlsChanged = true;
}

function updateHUD() {
	if(HUDText !== null) {
		console.log(HUDText);
		hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height/3);
		
		hudContext.font = "Normal " + (hudCanvas.height / 6) + "px Arial"; // TODO: Handle on resize
		hudContext.fillStyle = "white";
		hudContext.shadowBlur = 8;
		hudContext.shadowOffsetX = 3; 
		hudContext.shadowOffsetY = 3; 

		hudContext.fillText(HUDText, hudCanvas.width / 2, hudCanvas.height/4, hudCanvas.width);
		HUDText = null;
		
		hudContext.shadowOffsetX = 0;
		hudContext.shadowOffsetY = 0;
		hudContext.shadowBlur = 0;
		hudContext.shadowColor = "rgba(0,0,0,0)"
	}
	
	if(controlsChanged) {
		https://www.w3schools.com/tags/canvas_drawimage.asp
		
		
		hudContext.clearRect(0, hudCanvas.height/3, hudCanvas.width, hudCanvas.height * 2 / 3);
		if(isTouch) {
			drawCircle(posTouchCenter.x, posTouchCenter.y, "rgba(0, 180, 0, 0.3)", maxDistance, 2);
			drawCircle(dirTouchCenter.x, dirTouchCenter.y, "rgba(0, 180, 0, 0.3)", maxDistance, 2);
			hudContext.beginPath();
			hudContext.moveTo(vertTouchCenter.x, vertTouchCenter.y - maxDistance);
			hudContext.lineTo(vertTouchCenter.x, vertTouchCenter.y + maxDistance);
			hudContext.stroke();
		}
		
		if(positionTouch) {
			var x = positionTouch.clientX;
			var y = Math.max(hudCanvas.height/3 + 52, positionTouch.clientY - hudCanvas.offsetTop);
			drawCircle(x, y, "rgba(0, 255, 0, 1)", 40, 10);
			
			hudContext.beginPath();
			hudContext.moveTo(posTouchCenter.x, posTouchCenter.y);
			hudContext.lineTo(x, y);
			hudContext.stroke();
		}
		if(directionTouch) {
			var x = directionTouch.clientX;
			var y = Math.max(hudCanvas.height/3 + 52, directionTouch.clientY - hudCanvas.offsetTop);

			drawCircle(x, y, "rgba(0, 255, 0, 1)", 40, 10);

			hudContext.beginPath();
			hudContext.moveTo(dirTouchCenter.x, dirTouchCenter.y);
			hudContext.lineTo(x, y);
			hudContext.stroke();
		}
		if(vertTouch) {
			var x = vertTouchCenter.x;
			var y = Math.max(hudCanvas.height/3 + 52, vertTouch.clientY - hudCanvas.offsetTop);
			
			drawCircle(x, y, "rgba(0, 255, 0, 1)", 40, 10);
		}
		
		controlsChanged = false;
	}

}

// -------------------------------------------------------- //
// ----------------------- CONTROLS ----------------------- //
// -------------------------------------------------------- //
var currentlyPressedKeys = {}; // An object that stores currently pressed keys

var positionTouch, directionTouch, vertTouch;
var posTouchCenter, dirTouchCenter, vertTouchCenter, maxDistance;

var isTouch = false;
var switchedToFullScreen = false;

var touchControls;
var keyboardControls;

// You need to initialize the HUD first.
function initializeControls() {
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	
	document.body.addEventListener("touchstart", handleStart, false);
	document.body.addEventListener("touchend", handleEnd, false);
	document.body.addEventListener("touchcancel", handleEnd, false);
	document.body.addEventListener("touchmove", handleMove, { passive: false });
	
	document.body.addEventListener("click", ensureFullScreenOnTouch, false);
	document.body.addEventListener("fullscreenchange", resizeRenderer, false);
}

// Touch
function ensureFullScreenOnTouch() {
	/*if(isTouch) {
		switchedToFullScreen = true;
		// On touch device
		if (document.body.requestFullscreen) {
			document.body.requestFullscreen()
		} else if (document.body.webkitRequestFullscreen) {
			document.body.webkitRequestFullscreen();
		} else if (document.body) {
			document.body.mozRequestFullScreen();
		} else if (document.body.msRequestFullscreen) {
			document.body.msRequestFullscreen();
		}
	}*/
}

function handleStart(e) {
	if(!isTouch) {
		isTouch = true;
		controlsChanged = true;
	}
	
	var touches = e.changedTouches;
	var length = touches.length;
	for (var i = 0; i < length; i++) {
		var touchPosition = new THREE.Vector2(touches[i].clientX, touches[i].clientY - hudCanvas.offsetTop);
		if(positionTouch === undefined && touchPosition.distanceTo(posTouchCenter) <= maxDistance) {
			positionTouch = touches[i];
			controlsChanged = true;
		} else if (directionTouch === undefined && touchPosition.distanceTo(dirTouchCenter) <= maxDistance) {
			directionTouch = touches[i];
			controlsChanged = true;
		} else if (vertTouch === undefined && touchPosition.distanceTo(vertTouchCenter) <= maxDistance) {
			vertTouch = touches[i];
			controlsChanged = true;
		}
	}
}

function handleEnd(e) {	
	var touches = e.changedTouches;
	var length = touches.length;
	for (var i = 0; i < length; i++) {
		if(positionTouch && touches[i].identifier === positionTouch.identifier) {
			positionTouch = undefined;
			controlsChanged = true;
		} else if (directionTouch && touches[i].identifier === directionTouch.identifier) {
			directionTouch = undefined;
			controlsChanged = true;
		} else if (vertTouch && touches[i].identifier === vertTouch.identifier) {
			vertTouch = undefined;
			controlsChanged = true;
		}
	}
}

function handleMove(e) {
	var touches = e.changedTouches;
	var length = touches.length;
	for (var i = 0; i < length; i++) {
		if(positionTouch && touches[i].identifier === positionTouch.identifier) {
			positionTouch = touches[i];
			controlsChanged = true;
		} else if(directionTouch && touches[i].identifier === directionTouch.identifier) {
			directionTouch = touches[i]; 
			controlsChanged = true;
		} else if(vertTouch && touches[i].identifier === vertTouch.identifier) {
			vertTouch = touches[i]; 
			controlsChanged = true;
		}
	}
	e.preventDefault();
}

function drawCircle(x, y, style, radius, strokeWidth) {
	hudContext.beginPath();
	hudContext.arc(x, y, radius, 0, 2 * Math.PI, false);
	hudContext.lineWidth = strokeWidth;
	hudContext.strokeStyle = style;
	hudContext.stroke();
	
}

window.addEventListener('click', function (evt) {
	if (evt.detail === 3) {
		launchProjectile();
	}
});

// Keys
function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
	if(currentlyPressedKeys[81]) {
		launchProjectile();
	}
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
		pitchRate = PI_1000;
	} else if (currentlyPressedKeys[40]) {
		// Down arrow
		pitchRate = -PI_1000;
	} else if (directionTouch) {
		pitchRate = (-PI_1000 / 2) * getPercentage(directionTouch.clientY - dirTouchCenter.y - hudCanvas.offsetTop, maxDistance);
	} else {
		pitchRate = 0;
	}

	if (currentlyPressedKeys[37]) {
		// Left cursor key
		yawRate = PI_1000;
	} else if (currentlyPressedKeys[39]) {
		// Right cursor key
		yawRate = -PI_1000;
	} else if (directionTouch) {
		yawRate = (-PI_1000 / 2) * getPercentage(directionTouch.clientX - dirTouchCenter.x, maxDistance);
	} else {
		yawRate = 0;
	}

	if (currentlyPressedKeys[87]) {
		// W
		forwardSpeed = 0.1;
	} else if (currentlyPressedKeys[83]) {
		// S
		forwardSpeed = -0.1;
	} else if (positionTouch) {
		forwardSpeed = -0.1 * getPercentage(positionTouch.clientY - posTouchCenter.y - hudCanvas.offsetTop, maxDistance);
	} else {
		forwardSpeed = 0;
	}
	
	if (currentlyPressedKeys[65]) {
		// A
		sideSpeed = -0.1;
	} else if (currentlyPressedKeys[68]) {
		// D
		sideSpeed = 0.1;
	} else if (positionTouch) {
		sideSpeed = 0.1 * getPercentage(positionTouch.clientX - posTouchCenter.x, maxDistance);
	} else {
		sideSpeed = 0;
	}
	if (currentlyPressedKeys[32]) {
		// Spacebar
		verticalSpeed = 0.1;
	} else if (currentlyPressedKeys[16]) {
		// Shift
		verticalSpeed = -0.1;
	} else if (vertTouch) {
		verticalSpeed = -0.1 * getPercentage(vertTouch.clientY - vertTouchCenter.y - hudCanvas.offsetTop, maxDistance);
	} else {
		verticalSpeed = 0;
	}
}

function getPercentage(relativeCoordinate, maxDistance) {
	var noEffectDist = maxDistance / 4;
	return Math.sign(relativeCoordinate) * Math.min(Math.max((Math.abs(relativeCoordinate) - noEffectDist), 0) / (maxDistance - noEffectDist), 1);
}

// ----------------------------------------------------------- //
// ------------------------ Settings ------------------------- //
// ----------------------------------------------------------- //
var settings = [];

function Setting(title, functionToCall) {
	var options = [];
	
	var Option = function(title, functionCallData, enabled = false) {
		this.title = title;
		this.functionCallData = functionCallData;
		this.enabled = enabled;
	}
	
	this.title = title;
	this.functionToCall = functionToCall;
	this.addOption = function(title, functionCallData, enabled = false) {
		var newOption = new Option(title, functionCallData, enabled);
		if(enabled) {
			this.functionToCall(newOption.functionCallData);
		}
		options.push(newOption);
	}
	
	this.getOptions = function() {
		return options;
	}
	
	this.getOption = function(name) {
		var length = options.length;
		for(var i = 0; i < length; i++) {
			if(name == options[i].title)
				return options[i];
		}
		return null;
	}
}

function getSetting(name) {
	var length = settings.length;
	for(var i = 0; i < length; i++) {
		if(settings[i].title === name) {
			return settings[i];
		}
	}
	return null;
}

function updateSetting(settingName, optionName) {
	var setting = getSetting(settingName);
	if(setting == null) {
		console.log("Unknown setting");
	} else {
		var option = setting.getOption(optionName);
		if(option == null) {
			console.log("Unknown option");
		} else if (option.enabled) {
			console.log("Option already selected");
		} else {
			setting.functionToCall(option.functionCallData);
			var options = setting.getOptions();
			var length = options.length;
			for(var i = 0; i < length; i++) {
				if(options[i].enabled)
					options[i].enabled = false;
			}
			option.enabled = true;
		}
	}
}

function setPowerSaverMode(newValue) {
	if(newValue == true) {
		tickMod = 2;
	} else {
		tickMod = 1;
	}
}

function loadSettings() {
	var newSetting = new Setting("Power-saver mode", setPowerSaverMode);
	newSetting.addOption("Enabled", true, true);
	newSetting.addOption("Disabled", false);
	settings.push(newSetting);
}

// ----------------------------------------------------------- //
// ----------------------- PROJECTILES ----------------------- //
// ----------------------------------------------------------- //

var projectiles = [];

function Projectile(posX, posY, posZ, mass, radius) {
	var geometry = new THREE.SphereGeometry( radius, 40, 40);
	var material = new THREE.MeshPhongMaterial( {color: 0xff69b4, wireframe: false} );
	this.mesh = new THREE.Mesh( geometry, material );
	this.mesh.position.x = posX;
	this.mesh.position.y = posY;
	this.mesh.position.z = posZ;
	
	// Constant
	this.radius = radius;
    this.mass = mass;
    this.inverseMass = 1.0 / mass;
	this.inertia = (2.0 / 5.0) * mass * radius * radius; // Solid sphere's inertia
    this.inverseInertia = 1.0 / this.inertia;
	
	// State
	// primary
	this.getPosition = function() {
		return this.mesh.position;
	}
	
	this.getRotation = function() {
		return this.mesh.rotation;
	}
	
	
	this.orientationQuaternion = new THREE.Quaternion(0,0,0,0);

	// secondary
	this.velocity = new THREE.Vector3(0,0,0);
	this.spinQuaternion = new THREE.Quaternion(0,0,0,0);
	this.angularVelocity = new THREE.Vector3(0,0,0);
	
	this.Derivative = function Derivative(velocity, acceleration, spin, angularAcceleration) {
		this.velocity = velocity;	///< velocity is the derivative of position.
		this.acceleration = acceleration;	///< force in the derivative of momentum.
		this.spin = spin;		///< spin is the derivative of the orientation quaternion.
		this.angularAcceleration = angularAcceleration;	///< torque is the derivative of angular momentum.
	}

    this.recalculate = function() {
		// Skip on occasion if CPU cycles are tight.
        this.orientationQuaternion.normalize();
		
       this.spinQuaternion = new THREE.Quaternion(0, this.angularVelocity.x *0.5, this.angularVelocity.y *0.5, this.angularVelocity.z*0.5).multiply(this.orientationQuaternion);
		this.getRotation().setFromQuaternion(this.orientationQuaternion);
    }
	
	this.getTorque = function() {
		return new THREE.Vector3(1 - this.angularVelocity.x * 0.1, 0 - this.angularVelocity.y * 0.1, 0 - this.angularVelocity.z * 0.1);
	}
	
	// Here is how to find velocity at a povar.
	// vpovar = vlinear + vangular cross (p - x)
	
	// Evaluates the derivative (I think)
	this.evaluate = function(elapsedTime) {
		var accerationOfGravity = new THREE.Vector3(0, -0.001, 0);
		return new this.Derivative(this.velocity.clone(), accerationOfGravity, this.spinQuaternion, new THREE.Quaternion(0,0,0,0));
	}
	
	this.varegrate = function(elapsedTime) {
		var derivatives = this.evaluate(elapsedTime);

		this.velocity.add(derivatives.acceleration.multiplyScalar(elapsedTime));

		this.getPosition().add(derivatives.velocity.multiplyScalar(elapsedTime));
		this.orientationQuaternion.w += derivatives.spin.w * elapsedTime;
		this.orientationQuaternion.x += derivatives.spin.x * elapsedTime;
		this.orientationQuaternion.y += derivatives.spin.y * elapsedTime;
		this.orientationQuaternion.z += derivatives.spin.z * elapsedTime;
		this.angularVelocity.w += derivatives.angularAcceleration.w * elapsedTime;
		this.angularVelocity.x += derivatives.angularAcceleration.x * elapsedTime;
		this.angularVelocity.y += derivatives.angularAcceleration.y * elapsedTime;
		this.angularVelocity.z += derivatives.angularAcceleration.z * elapsedTime;

		this.recalculate();
	}

	this.update = function(elapsedTime, collided) {
		var originalPosition = this.getPosition().clone();
		this.varegrate(elapsedTime);
		
		// TODO: Instead of varegrating then doing collision detection on each item,
		// do it immediatly after moving it, while still having access to the vector that moved it.
		// This will allow it to find the exact collision location (by subtracting how far varo the item it is) 
		
		// Collision detection
		var thisCollided = false;
		var length = projectiles.length;
		for(var i = 0; i < length; i++) {
			var otherProjectile = projectiles[i];
			if(otherProjectile != this && otherProjectile) {
				// Normalized vector from this projectile to the other.
				var between = new THREE.Vector3(this.mesh.position.x - otherProjectile.mesh.position.x, this.mesh.position.y - otherProjectile.mesh.position.y, this.mesh.position.z - otherProjectile.mesh.position.z);

				var lengthSquared = between.lengthSq();
				var totalRadii = this.radius + otherProjectile.radius;
				
				if(totalRadii * totalRadii > lengthSquared) {
					thisCollided = true;
					collided.push(otherProjectile);
										
					var collisionOffsetA = between.clone().multiplyScalar(-0.5);
					var collisionOffsetB = between.clone().multiplyScalar(0.5);
					var normal = between.clone().multiplyScalar(-1);
					var velocityA = this.velocity.clone();
					var velocityB = otherProjectile.velocity.clone();
					var angVelocityAInitial = this.angularVelocity.clone();
					var angVelocityBInitial = otherProjectile.angularVelocity.clone();
					
					var povarOfCollision = otherProjectile.mesh.position.clone();
					povarOfCollision.add(collisionOffsetB);
					
					
					collisionResponce(0.8, this.mass, otherProjectile.mass, collisionOffsetA, collisionOffsetB, normal, velocityA, velocityB, angVelocityAInitial, angVelocityBInitial);
					
					this.velocity = velocityA;
					this.angularVelocity = angVelocityAInitial;
					otherProjectile.velocity = velocityB;
					otherProjectile.angularVelocity = angVelocityBInitial;
				}
			}
		}
		
		if(thisCollided) {
			collided.push(this);
			this.mesh.position.x = originalPosition.x;
			this.mesh.position.y = originalPosition.y;
			this.mesh.position.z = originalPosition.z;
		}
		
		// Collision detection with the box
		if(this.getPosition().y - this.radius < 0) {
			if(Math.abs(this.velocity.y) < 0.05) {
				this.getPosition().y = this.radius; // Stay on ground
				this.velocity.y = 0;
			} else {
				this.velocity.y = Math.abs(this.velocity.y);
				this.velocity.y *= 0.99;
			}
		} else if (this.getPosition().y + this.radius > 800) {
			this.velocity.y *= -0.99;
			this.mesh.position.y = Math.sign(this.getPosition().y) * (795 - this.radius);
		}

		if(Math.abs(this.getPosition().x) + this.radius > 400) {
			this.velocity.x *= -0.99;
			this.getPosition().x = Math.sign(this.getPosition().x) * (395 - this.radius);
		}
		if(Math.abs(this.getPosition().z) + this.radius > 400) {
			this.velocity.z *= -0.99;
			this.getPosition().z = Math.sign(this.getPosition().z) * (395 - this.radius);
		}
		
	}
	
}

function launchProjectile() {
	var projectile = new Projectile(yawObject.position.x, yawObject.position.y, yawObject.position.z, 1, 50);
	projectiles.push(projectile);
	projectile.velocity.x = -Math.sin(yawObject.rotation.y) * 0.2;
	projectile.velocity.z = -Math.cos(yawObject.rotation.y) * 0.2;
	projectile.velocity.y = Math.sin(pitchObject.rotation.x);
	scene.add( projectile.mesh );
}

	/**
	 * This function calulates the velocities after a 3D collision vaf, vbf, waf and wbf from information about the colliding bodies
	 * @param double r coefficient of restitution which depends on the nature of the two colliding materials
	 * @param double bodyAMass total mass of body a
	 * @param double bodyBMass total mass of body b
	 * @param matrix bodyAInertia inertia tensor for body a in absolute coordinates (if this is known in local body coordinates it must
	 * 				 be converted before this is called).
	 * @param matrix bodyBInertia inertia tensor for body b in absolute coordinates (if this is known in local body coordinates it must
	 * 				 be converted before this is called).
	 * @param vector collisionOffsetA position of collision povar relative to centre of mass of body a in absolute coordinates (if this is
	 * 				 known in local body coordinates it must be converted before this is called).
	 * @param vector collisionOffsetB position of collision povar relative to centre of mass of body b in absolute coordinates (if this is
	 * 				 known in local body coordinates it must be converted before this is called).
	 * @param vector normal normal to collision povar, the line along which the impulse acts.
	 * @param vector velocityA velocity of centre of mass on object a
	 * @param vector velocityB velocity of centre of mass on object b
	 * @param vector angVelocityAInitial initial angular velocity of object a
	 * @param vector angVelocityBInitial initial angular velocity of object b
	 * @param vector velocityAFinal final velocity of centre of mass on object a
	 * @param vector velocityBFinal final velocity of centre of mass on object a
	 * @param vector angVelocityAFinal final angular velocity of object a
	 * @param vector angVelocityBFinal final angular velocity of object b
	*/
	function collisionResponce(r, bodyAMass, bodyBMass, /*bodyAvareria, bodyBInertia,*/ collisionOffsetA, collisionOffsetB, normal,
		velocityA, velocityB, angVelocityAInitial, angVelocityBInitial) {

		normal.normalize();
	  
		var /*Scalar*/ x1 = normal.dot(velocityA);
		var /*Vector*/ v1x = normal.clone().multiplyScalar(x1);
		var /*Vector*/ v1y = velocityA.clone().sub(v1x);

		normal.multiplyScalar(-1);
		var /*Scalar*/ x2 = normal.dot(velocityB);
		var v2x = normal.clone().multiplyScalar(x2);
		var v2y = velocityB.clone().sub(v2x);

		var velocityAFinal = v1x.clone().multiplyScalar((bodyAMass-bodyBMass)/(bodyAMass+bodyBMass)).add(v2x.clone().multiplyScalar((2*bodyBMass)/(bodyAMass+bodyBMass))).add(v1y);
		
		var velocityBFinal = v1x.clone().multiplyScalar((2*bodyAMass)/(bodyAMass+bodyBMass)).add(v2x.clone().multiplyScalar((bodyBMass-bodyAMass)/(bodyAMass+bodyBMass))).add(v2y);
		
		var inelasticVelocity = velocityAFinal.clone().multiplyScalar(bodyAMass).add(velocityBFinal.multiplyScalar(bodyBMass)).divideScalar(bodyAMass + bodyBMass);
		
		if(r != 1) {
			velocityAFinal.multiplyScalar(r).add(inelasticVelocity.clone().multiplyScalar(1 - r));
			velocityBFinal.multiplyScalar(r).add(inelasticVelocity.clone().multiplyScalar(1 - r));
		}
		
		velocityA.x = velocityAFinal.x;
		velocityA.y = velocityAFinal.y;
		velocityA.z = velocityAFinal.z;
		velocityB.x = velocityBFinal.x;
		velocityB.y = velocityBFinal.y;
		velocityB.z = velocityBFinal.z;
	}


// --------------------------------------------------- //

var stats, customPanel;

function loadFPSStats() {
	var script = document.createElement('script');
    script.onload = function() {
        stats = new Stats();
		customPanel = stats.addPanel( new Stats.Panel( 'Spheres', '#ff8', '#221' ) );
		stats.showPanel( 0 )
		simulator.appendChild( stats.dom );
		stats.dom.style.position = "relative";
    };
    script.src = '//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';
    document.head.appendChild(script);
}

var tickMod = 1;

function startLoop() {
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
		alert("Your browser does not support RequestAnimationFrame! This simulator will not perform at optimal performance, and will use up more resources when you are using another tab.");
		onEachFrame = function(callback) {
			setvarerval(callback, 1000 / 60);
		}
	}

	window.onEachFrame = onEachFrame;
	var tickID = 0;
	
	window.onEachFrame(function() {
		if(tickID++ % tickMod == 0) {
		
			if(stats) {
				stats.begin();
			}
			animateThree();
			handleKeys();
			
			if(stats) {
				stats.end();
				customPanel.update(projectiles.length, 100);
			}
		}
	});
};