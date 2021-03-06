// Designed by Jared O'Connell
// Can be viewed online at https://www.shadowxcraft.net/school/ username: asd, password: learningstudios

'use strict';

//scene, sunLight, ambLight, camera, octree
var sceneHUD, cameraHUD, renderer, simulator;
var cube;
var particleSystem, particleOptions;
var basicRaycaster = new THREE.Raycaster();

var pitchObject, yawObject; // For camera angle
var PI_2 = Math.PI / 2;

// For physics
var physicsMargin = 0.05;

// For the currentWorld
var currentWorld, worlds = [], sky;


function init() {
	HUDText = "Loading..";
	
	setPositionEquation();
	
	simulator = document.getElementById("simulator");
	
	initPhysics();
		
	//loadThreeWorld();
	currentWorld = new World(/*`{"0":{"0":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-1,0,2,3,4],"-5":{"y":0},"-4":{"y":2,"connectedX":-3},"-1":{"y":0,"connectedZ":-4}},"1":{"0":{"y":0},"1":{"y":0,"connectedZ":1,"connectedX":-2},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-1,0,1,2,3,4],"-5":{"y":0},"-4":{"y":1},"-1":{"y":0,"connectedZ":-4}},"2":{"0":{"y":0},"1":{"y":0},"4":{"y":1,"connectedZ":1},"zValues":[-5,-4,-2,-1,0,1,4],"-5":{"y":0},"-4":{"y":2},"-2":{"y":0,"connectedZ":-4},"-1":{"y":0}},"3":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-3,-2,-1,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"4":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-3,-2,-1,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"xValues":[-5,-4,-3,-2,-1,0,1,2,3,4],"-5":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-3,-2,-1,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"-4":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-3,-2,-1,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":20}},"-3":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-3,-2,-1,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"-2":{"0":{"y":0},"1":{"y":1},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-3,-2,-1,0,1,2,3,4],"-5":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"-1":{"0":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-5,-4,-3,-2,-1,0,2,3,4],"-5":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}}}`/*`{"0":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":2,"connectedX":-3},"-1":{"y":0,"connectedZ":-4}},"1":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":1},"-1":{"y":0,"connectedZ":-4}},"2":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":2},"-2":{"y":0,"connectedZ":-4},"-1":{"y":0}},"3":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"4":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"xValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"-4":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":20}},"-3":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"y":0},"-4":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"-2":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}},"-1":{"0":{"y":0},"1":{"y":0},"2":{"y":0},"3":{"y":0},"4":{"y":0},"zValues":[-1,-2,-3,-4,-5,0,1,2,3,4],"-5":{"y":0},"-3":{"y":0},"-2":{"y":0},"-1":{"y":0}}}`*/);
	worlds.push(currentWorld);
	
	// Renderer
	renderer = new THREE.WebGLRenderer({canvas: document.getElementById("simulator-canvas")});
	renderer.setClearColor(0x5c98f9);
	resizeRenderer();
	renderer.autoClear = false; // Needed for the two things rendering.
	// Shadows
	renderer.shadowMap.enabled = true;
	renderer.shadowMapSoft = true;

	renderer.shadowCameraNear = 3;
	renderer.shadowCameraFar = currentWorld.camera.far;
	renderer.shadowCameraFov = 50;

	//renderer.shadowMapBias = 0.0039;
	renderer.shadowMapDarkness = 0.5;
	
	loadSettings();	 // Should this be lower?

	HUDText = "";

	initializeHUD();
	initializeControls();

	visualizationManager = new VisualizationManager();

	startLoop();
	loadFPSStats();
	loadLatex();
	
	initWebsockets();
	initPackets();
}


function initPhysics() {
	Ammo();
}

// Latex, for the formatted equations. 
function loadLatex() {
	var elements = document.getElementsByClassName("render-latex");
	var length = elements.length;2
	for(var i = 0; i < length; i++) {
		katex.render(elements[i].innerHTML, elements[i], {throwOnError: false});
	}
}

// For when the user resizes the window (or changes orientation)
function resizeRenderer() {
	// Canvas resolution
	renderer.setSize(simulator.clientWidth, simulator.clientHeight);
	renderer.setPixelRatio(resolutionScaleOfCanvas);

	currentWorld.camera.aspect = simulator.clientWidth / simulator.clientHeight;
	currentWorld.camera.updateProjectionMatrix();
	
	if(hudCanvas !== undefined) {
		hudCanvas.width = simulator.clientWidth;
		hudCanvas.height = simulator.clientHeight;
		
		calculateHUDPositions();
	}
	controlsChanged = true;
}

var lastRealTime = Date.now(), time = 0, timeRate = 1;
var joggingAngle = 0;
var frameIndex = 0;

function animateThree() {
	if(renderer && currentWorld) {
		var timeNow = Date.now();
		
		var elapsed = timeNow - lastRealTime;
		elapsed = Math.min(1000, elapsed) / 1000; // Converts to seconds
		
		time += elapsed * timeRate;
		
		if(elapsed * timeRate !== 0) {
			currentWorld.physicsWorld.stepSimulation( (elapsed * timeRate), 10 );
			//console.log("Collisions: " + currentWorld.physicsWorld.getNumCollisionObjects());
			
			updateCollisions();
			
			// The actual physics update.
			var length = currentWorld.projectiles.length;
			for(var i = 0; i < length; i++) {
				currentWorld.projectiles[i].update(time, elapsed * timeRate, collided, false);
			}
			
			// To keep it up to date after all of the updates.
			currentWorld.octree.rebuild();
	
			// Updates the panel on the user interface that displays projectile details.
			if(physicsPanel)
				physicsPanel.update(Date.now() - timeNow, 30);
		}
		
		var selectedProjectile = visualizationManager.getSelectedProjectile();
		if(lookAtSelected && selectedProjectile) {
			// Uses math to look at the projectile
			var dx = selectedProjectile.mesh.position.x - currentWorld.yawObject.position.x;
			var dy = selectedProjectile.mesh.position.y - currentWorld.yawObject.position.y;
			var dz = selectedProjectile.mesh.position.z - currentWorld.yawObject.position.z;
			var xzd = Math.sqrt(dx * dx + dz * dz);

			currentWorld.yawObject.rotation.y = -Math.atan2(dz, dx) - PI_2;
			currentWorld.pitchObject.rotation.x = PI_2 - Math.atan2(xzd, dy);
		} else if(yawRate != 0 || pitchRate != 0) {
			// Move based on player controls.
			currentWorld.yawObject.rotation.y += yawRate * elapsed;
			currentWorld.pitchObject.rotation.x += pitchRate * elapsed;

			currentWorld.pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, currentWorld.pitchObject.rotation.x ) );
		}

		updateControls(elapsed);

		var collided = [];

		if(visualizationManager !== undefined)
			visualizationManager.update(elapsed * timeRate);

		if(particleSystem !== undefined) {
			particleSystem.update(time);
		}

		lastRealTime = timeNow;


		renderer.render( currentWorld.scene, currentWorld.camera );
		updateHUD();
	}
}

function updateCollisions() {
	if(currentWorld.pauseOnCollision) {
		var i, offset,
			dp = currentWorld.physicsWorld.getDispatcher(),
			num = dp.getNumManifolds(),
			manifold, num_contacts, j, pt,
			_collided = false;

		//collisionreport[1] = 0; // how many collisions we're reporting on

		for ( i = 0; i < num; i++ ) {
			manifold = dp.getManifoldByIndexInternal( i );

			num_contacts = manifold.getNumContacts();
			if ( num_contacts === 0 ) {
				continue;
			}

			for ( j = 0; j < num_contacts; j++ ) {
				pt = manifold.getContactPoint( j );
				//if ( pt.getDistance() < 0 ) {
					//offset = 2 + (collisionreport[1]++) * COLLISIONREPORT_ITEMSIZE;
					//collisionreport[ offset ] = _objects_ammo[ manifold.getBody0() ];
					//collisionreport[ offset + 1 ] = _objects_ammo[ manifold.getBody1() ];

					var _vector = pt.get_m_normalWorldOnB();
					//collisionreport[ offset + 2 ] = _vector.x();
					//collisionreport[ offset + 3 ] = _vector.y();
					//collisionreport[ offset + 4 ] = _vector.z();
					console.log("Collision: ");
					console.log(_vector);
					timeRate = 0;
					break;
				//}
			}
		}
	}
}

function sortNumber(a,b) {
    return a - b;
}

var defaultSize = 40;
var defaultY = 0;
var minY = -100;

class World {	
	constructor(oldJSON) {
		
		this.projectiles = [];
		this.projectilesByID = {};
		this.faceToVertexData = new Map();
		this.pauseOnCollision = false;
		this.pauseAtPeak = false;
		
		// Creates or reads the basic outline of the currentWorld ground
		if(oldJSON && oldJSON != "") {
			// Use the old one
			this.data = JSON.parse(oldJSON);
		} else {
			
			this.data = new Object();
			this.data.xValues = [];
			// Construct a new one
			for(let x = -Math.floor(defaultSize / 2); x < Math.ceil(defaultSize / 2); x++ ) {
				// Let it know about the new x-value
				this.data.xValues.push(x);
				let zData = new Object();
				this.data[x] = zData;
				zData.zValues = [];
				
				for(let z = -Math.floor(defaultSize / 2); z < Math.ceil(defaultSize / 2); z++) {
					zData.zValues.push(z);
					
					let tileObject = new Object();
					tileObject.y = defaultY;
					
					zData[z] = tileObject;
				}
			}
		}
		this.createPhysicsWorld();
		this.initializeOctrees();
		//this.addMinBoundry();
		this.renderVertices();
		this.createScene();
		this.initializeCamera();
		
		reloadSettings();
	}
	
	
	initializeCamera() {
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 5e5);
		
		this.camera.rotation.set( 0, 0, 0 );

		this.pitchObject = new THREE.Object3D();
		this.pitchObject.add( this.camera );

		this.yawObject = new THREE.Object3D();
		this.yawObject.position.y = 1.8;
		this.yawObject.add( this.pitchObject );
		
		//yawObject.translateY();
		this.yawObject.translateZ(5);
		
		this.scene.add(this.yawObject);
	}
	
	createScene() {
		this.scene = new THREE.Scene();
		this.scene.add(this.mesh);
		this.loadLights();
		this.loadSky();
	}
	
	
	loadSky() {
		this.sky = new THREE.Sky();
		this.sky.scale.setScalar( 450000 );
		// add it to the scene
		this.scene.add( this.sky );

		this.updateSky();
	}

	updateSky(one = -0.08, two = 0.299) {
		var distance = 400000;

		var uniforms = this.sky.material.uniforms;
		uniforms.turbidity.value = 9;
		uniforms.rayleigh.value = 2;
		uniforms.luminance.value = 1.05;
		uniforms.mieCoefficient.value = 0.004;
		uniforms.mieDirectionalG.value = 0.8;
		var theta = Math.PI * ( one - 0.5 );
		var phi = 2 * Math.PI * ( two - 0.5 );
		var position = new THREE.Vector3();
		position.x = distance * Math.cos( phi );
		position.y = distance * Math.sin( phi ) * Math.sin( theta );
		position.z = distance * Math.sin( phi ) * Math.cos( theta );
		uniforms.sunPosition.value.copy( position );
		uniforms.ambientLightColor = 0x3f7b9d;
	}
	
	loadLights() {
		// Lights
		//var sunLight = new THREE.SpotLight(0xFFE8D4, 1.5, 200, PI_2, 0.5, 1);
		this.sunLight = new THREE.DirectionalLight(0xFFE8D4, 0.6);
		this.ambLight = new THREE.AmbientLight( 0xf0f5ff, 0.5);

		//var cameraHelper = new THREE.CameraHelper( sunLight.shadow.camera )
		
		// set its position
		this.sunLight.position.x = 25;
		this.sunLight.position.y = 70;
		this.sunLight.position.z = 18;
		this.sunLight.castShadow = true;
		this.sunLight.distance = 20;
		//sunLight.target.position.x = 12;
		//sunLight.target.position.z = 17;
		//scene.add( sunLight.target );
		//sunLight.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(60, 1, 1, 2500));
		this.sunLight.shadow.mapSize.width = 1024;
		this.sunLight.shadow.mapSize.height = 1024;
		
		this.sunLight.shadow.camera.left = -20;
		this.sunLight.shadow.camera.right = 20;
		this.sunLight.shadow.camera.top = 20;
		this.sunLight.shadow.camera.bottom = -20;
		this.sunLight.shadow.camera.zoom = 1;
		this.sunLight.shadow.camera.updateProjectionMatrix();
		this.sunLight.shadow.bias = -0.0003;
		
		// add to the scene
		this.scene.add(this.sunLight);
		this.scene.add(this.ambLight);
		//scene.add(cameraHelper);
	}
		
	// octree, for efficient projectile retrieval.
	initializeOctrees() {
		this.octree = new THREE.Octree({
			radius: 40, // optional, default = 1, octree will grow and shrink as needed
			undeferred: false, // optional, default = false, octree will defer insertion until you call octree.update();
			depthMax: Infinity, // optional, default = Infinity, infinite depth
			objectsThreshold: 8, // optional, default = 8
			overlapPct: 0.15, // optional, default = 0.15 (15%), this helps sort objects that overlap nodes
			//scene: scene // optional, pass scene as parameter only if you wish to visualize octree
		});
	}
	
	removeFromData(x, z) {
		if(this.data.xValues.indexOf(x) >= 0) {
			let xRowOfZData = this.data[x];
			let index = xRowOfZData.zValues.indexOf(z);
			if(index >= 0) {
				xRowOfZData.zValues.splice(index, 1);
				xRowOfZData[z] = undefined;
			}
		}
	}

	updateHeight(x, y, z) {
		if(this.data.xValues.indexOf(x) >= 0) {
			let xRowOfZData = this.data[x];
			
			if(xRowOfZData.zValues.indexOf(z) >= 0) {
				xRowOfZData[z].y = y;
			}
		}
	}

	renderVertices() {
		
		this.vertexMap = new Object(); // Maps tile objects to vertex and faces.
		this.geometry = new THREE.Geometry();
		
		// Implements it in Three.js
		// In this algorithm, it creates the vertex data for each location, and adds extra faces BEHIND it.
		// The only case where it does not add anything is when two adjacent faces are at the same height.
		// If the adjacent faces are not at the same height, it adds two vertical faces.
		// If the platform is attached to another, it creates a slope.
		if (this.data && this.data.xValues) {
			this.data.xValues.sort(sortNumber);
			for(let x of this.data.xValues) {
				let xRowOfZData = this.data[x];
				let xRowOfZVertexData = new Object();
				this.vertexMap[x] = xRowOfZVertexData;
				
				if(xRowOfZData && xRowOfZData.zValues) {
					xRowOfZData.zValues.sort(sortNumber);
					for(let z of xRowOfZData.zValues) {
						let tileObject = xRowOfZData[z];
						if(tileObject) {
							xRowOfZVertexData[z] = new VertexData(x, z, this, 0, 0, false, tileObject);
						}
					}
				}
			}
		}
		
		this.geometry.computeFaceNormals();
		//this.geometry.computeVertexNormals();
		this.material = new THREE.MeshPhongMaterial();
		this.material.transparent = false;
		this.material.vertexColors = THREE.FaceColors;
		this.material.shininess = 65;
		this.material.side = THREE.DoubleSide;
		this.mesh = new THREE.Mesh(this.geometry, this.material);		
		this.mesh.receiveShadow = true;		
		this.mesh.castShadow = true;
	}
	
	addMinBoundry() {
		var shape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 0)
		
		shape.setMargin(0.0001);
		var localInertia = new Ammo.btVector3( 0, 0, 0 );
		var mass = 0;
		shape.calculateLocalInertia( mass, localInertia );
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(0,minY,0));
		var motionState = new Ammo.btDefaultMotionState( transform );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia, 0, 0, 0, 0, 1 );
		var body = new Ammo.btRigidBody( rbInfo );
		body.setRestitution(1);

		this.physicsWorld.addRigidBody(body);
	}
	
	createPhysicsWorld() {
		// Physics engine
		this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		this.dispatcher = new Ammo.btCollisionDispatcher( this.collisionConfiguration );
		this.broadphase = new Ammo.btDbvtBroadphase();
		this.solver = new Ammo.btSequentialImpulseConstraintSolver();
		this.physicsWorld = new Ammo.btDiscreteDynamicsWorld( this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration );
		this.physicsWorld.setGravity( new Ammo.btVector3( 0, -9.81, 0 ) );
		this.transformAux1 = new Ammo.btTransform();
	}
}

var flatColor = new THREE.Color(0x505454);
var generic = new THREE.Color(0x8996A0);
var generic2 = new THREE.Color(0x8E9BA5);


class VertexData {

	/**
	 * Stores data about the vertexes, as well as the
	 * connection info, the connections, and more.
	 *
	 * If a second tile is passed in, the mode changes
	 * from a flat tile to a connecting tile.
	 * 
	 * x: The x-coordinate of the top-left (min-x min-z) corner.
	 * z: The z-coordinate of the top-left (min-x min-z) corner.
	 * world: The world that the tile is in
	 * tile: The tile's stored information.
	 * xSlope: How much it is sloping in the x dir
	 * zSlope: How much it is sloping in the z dir
	 */
	constructor(x, z, world, xSlope, zSlope, connected, yData) {
		this.x = x;
		this.z = z;
		this.world = world;
		this.xSlope = xSlope;
		this.zSlope = zSlope;
		this.isSelected = false;
		this.connected = connected;
		
		if(!connected) {
			this.topLeftY = yData.y;
			this.connectedX = yData.connectedX;
			this.connectedZ = yData.connectedZ;
		} else {
			this.topLeftY = yData;
		}

		this.createVerticies();

		this.createMainFace();
		
		this.updateXConnections();
		this.updateZConnections();

		// Physics
		this.addRigidBody();

	}
	
	setRemoteX(rmt) {
		this.remoteX = rmt;

	}
	setRemoteZ(rmt) {
		this.remoteX = rmt;
	}
	
	// TODO: Make it so that the tile is lighter when in contact with the sphere.
	setSelected(selected) {
		this.isSelected = selected;
		if(selected) {
			this.face1.color.setHex(0xffffff);
		} else {
			console.log("Setting color to");
			console.log(this.color);
			this.face1.color.set(this.color);
		}
		currentWorld.mesh.geometry.colorsNeedUpdate = true;
	}
	
	addRigidBody() {
		var verticalExpansion = 0.005;
		var horizontalExpansion = 0.01;
		
		if(!this.connected) {
			this.shape = new Ammo.btBoxShape( new Ammo.btVector3(0.5 + horizontalExpansion * 2, Math.abs(this.topLeftY - minY) + verticalExpansion, 0.5 + horizontalExpansion * 2) );
		} else {
			this.shape = new Ammo.btConvexHullShape();
			this.shape.addPoint(new Ammo.btVector3(0, this.topLeft.y, 0), false);
			this.shape.addPoint(new Ammo.btVector3(1, this.topRight.y, 0), false);
			this.shape.addPoint(new Ammo.btVector3(0, this.bottomLeft.y, 1), false);
			this.shape.addPoint(new Ammo.btVector3(1, this.bottomRight.y, 1), false);
			this.shape.addPoint(new Ammo.btVector3(0, -100, 0), false);
			this.shape.addPoint(new Ammo.btVector3(1, -100, 0), false);
			this.shape.addPoint(new Ammo.btVector3(0, -100, 1), false);
			this.shape.addPoint(new Ammo.btVector3(1, -100, 1), true);
		}

		this.shape.setMargin(0.0001);
		var localInertia = new Ammo.btVector3( 0, 0, 0 );
		var mass = 0;
		this.shape.calculateLocalInertia( mass, localInertia );
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(!this.connected ? new Ammo.btVector3( this.x + 0.5 + horizontalExpansion, minY, this.z + 0.5 + horizontalExpansion) : new Ammo.btVector3(this.topLeft.x, 0, this.topLeft.z));
		var motionState = new Ammo.btDefaultMotionState( transform );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, this.shape, localInertia, 0, 0, 0, 0, 1 );
		this.body = new Ammo.btRigidBody( rbInfo );
		this.body.setRestitution(1);

		this.world.physicsWorld.addRigidBody(this.body);

	}
	
	canConnectTo(tile) {
		// TODO: Handle too close ones.
		if(this.connected || this.x < tile.x || this.z < tile.z || tile.connected || tile.remoteX || tile.remoteZ) {
			return false;
		}
		if(this.x == tile.x) {
			if(this.connectedZ) {
				return false; // already connected
			}
			let Zs = this.world.vertexMap[this.x];
			if(Zs) {
				for(let zDiff = -1; zDiff > tile.z - this.z; zDiff--) { // Between the two tiles
					let testTile = Zs[this.z + zDiff];
					if(testTile) { // check existing
						if(testTile.connected || testTile.connectedToZ) {
							return false;
						}
					}
				}
			}
		} else if (this.z == tile.z) {
			if(this.connectedX) {
				return false; // already connected
			}
			for(let xDiff = -1; xDiff > tile.x - this.x; xDiff--) { // Between the two tiles
				if(this.world.vertexMap[this.x + xDiff] && this.world.vertexMap[this.x + xDiff][this.z]) { // Update existing
					let testTile = this.world.vertexMap[this.x + xDiff][this.z];
					if(testTile.connected || testTile.connectedToX) {
						return false;
					}
				}
			}
		} else {
			return false;
		}
		return true;
	}
	
	connectTo(tile) {
		if(this.canConnectTo(tile)) {
			if(tile.x == this.x) {
				// Updates the data
				this.world.data[this.x][this.z].connectedZ = tile.z
				
				// Updates the rendered data
				this.connectedZ = tile.z;
				this.updateHeight(); // The update connects it
			} else if (tile.z == this.z) {
				// Updates the data
				this.world.data[this.x][this.z].connectedX = tile.x
				
				// Updates the rendered data
				this.connectedX = tile.x;
				this.updateHeight(); // The update connects it
			} else {
				return false;
			}
			return true;
		} else {
			return false;
		}
	}
	
	// updateNearby is for when changes are being
	// made after the world is constructed.
	updateXConnections() {
		if(this.connectedX && this.connectedX < this.x) {
			this.updateXRemoteConnections();
		} else {
			this.updateXWalls();
		}
	}

	// updateNearby is for when changes are being
	// made after the world is constructed.
	updateZConnections() {
		if(this.connectedZ && this.connectedZ < this.z) {
			this.updateZRemoteConnections();
		} else {
			this.updateZWalls();
		}
	}
	
	
	updateXRemoteConnections() {
		// Creates a connecting platform in the x dir.
		let remoteTile = this.world.vertexMap[this.connectedX][this.z];
		if(remoteTile) {
			remoteTile.setRemoteX(this);
			let xSlope = (this.topLeftY - remoteTile.topLeftY) / (this.x - this.connectedX - 1)
			let y = this.topLeftY;
			for(let xDiff = -1; xDiff > this.connectedX - this.x; xDiff--) { // Between the two tiles
				y -= xSlope;
				if(this.world.vertexMap[this.x + xDiff][this.z]) { // Update existing
					let existing = this.world.vertexMap[this.x + xDiff][this.z];
					existing.topLeftY = y;
					existing.connected = true;
					existing.xSlope = xSlope;
					existing.connectedX = this.x;
					existing.updateHeight();
					
					this.world.removeFromData(this.x + xDiff, this.z);
				} else {
					this.world.vertexMap[this.x + xDiff][this.z] = new VertexData(this.x + xDiff, this.z, this.world, xSlope, 0, true, y);
				}
				
				// Refreshes the connections for the one in FRONT of
				// it if this one has a slope, becuase that would mean
				// that this one didn't exist when it ran this method.
				let adjVertex = this.world.vertexMap[this.x + xDiff][this.z + 1];
				if(adjVertex) {
					adjVertex.updateZConnections();
				}
			}
		}
	}

	updateXWalls() {
		// Create a wall in the x dir
		let Zz = this.world.vertexMap[this.x - 1];
		if(Zz) {
			let adjacent = Zz[this.z];
			let faces = this.world.geometry.faces;

			if (adjacent && (adjacent.topLeftY != this.topLeftY || adjacent.zSlope != this.zSlope)) {
				if(!this.wallFace1x && !this.wallFace2x) {
					this.wallFace1x = new THREE.Face3( adjacent.topRightIndex, adjacent.bottomRightIndex, this.topLeftIndex);
					this.wallFace2x = new THREE.Face3( this.bottomLeftIndex, this.topLeftIndex, adjacent.bottomRightIndex);
					this.wallFace1x.color = flatColor;
					this.wallFace2x.color = flatColor;
					faces.push(this.wallFace1x);
					faces.push(this.wallFace2x);
					this.world.geometry.verticesNeedUpdate = true;
				}
			} else {
				if(this.wallFace1x) {
					var index = faces.indexOf(this.wallFace1x);
					if (index > -1) {
					  faces.splice(index, 1);
					}
					this.wallFace1x = undefined;
				}
				if(this.wallFace2x) {
					var index = faces.indexOf(this.wallFace2x);
					if (index > -1) {
					  faces.splice(index, 1);
					}
					this.wallFace2x = undefined;
				}
				this.world.geometry.verticesNeedUpdate = true;
			}
		}
	}

	updateZRemoteConnections() {
		// Creates a connecting platform in the y dir.
		let Zs = this.world.vertexMap[this.x];
		if(Zs) {
			let remoteTile = Zs[this.connectedZ];
			if(remoteTile) {
				remoteTile.setRemoteZ(this);

				let zSlope = (this.topLeftY - remoteTile.topLeftY) / (this.z - this.connectedZ - 1);

				let y = this.topLeftY;
				for(let zDiff = -1; zDiff > this.connectedZ - this.z; zDiff--) { // Between the two tiles
					y -= zSlope;
					let existing = Zs[this.z + zDiff];
					if(existing) { // Update existing
						existing.topLeftY = y;
						existing.connected = true;
						existing.zSlope = zSlope;
						existing.connectedZ = this.z;
						existing.updateHeight();
						this.world.removeFromData(this.x, this.z + zDiff);
					} else {
						Zs[this.z + zDiff] = new VertexData(this.x, this.z + zDiff, this.world, 0, zSlope, true, y);
					}
					// Refreshes the connections for the one in FRONT of
					// it if this one has a slope, becuase that would mean
					// that this one didn't exist when it ran this method.
					let Zs2 = this.world.vertexMap[this.x + 1];
					if(Zs2) {
						let adjVertex = Zs2[this.z + zDiff];
						if(adjVertex) {
							adjVertex.updateXConnections();
						}
					}
				}
			}
		}
	}
	
	updateZWalls() {
		// Create a wall in the y dir
		let Zz = this.world.vertexMap[this.x];
		if(Zz) {
			let adjacent = Zz[this.z - 1];
			let faces = this.world.geometry.faces;
			// The thing after the 'or' is to make it so that a panel on the floor
			// that is connected to something else will have a wall as well.
			if (adjacent && (adjacent.topLeftY != this.topLeftY || adjacent.xSlope != this.xSlope)) {
				if(!this.wallFace1z && !this.wallFace2z) {
					this.wallFace1z = new THREE.Face3( this.topLeftIndex, adjacent.bottomRightIndex, adjacent.bottomLeftIndex);
					this.wallFace2z = new THREE.Face3( adjacent.bottomRightIndex, this.topLeftIndex, this.topRightIndex);
					this.wallFace1z.color = flatColor;
					this.wallFace2z.color = flatColor;
					faces.push(this.wallFace1z);
					faces.push(this.wallFace2z);
					this.world.geometry.verticesNeedUpdate = true;					
				}
			} else {
				if(this.wallFace1z) {
					var index = faces.indexOf(this.wallFace1z);
					if (index > -1) {
					  faces.splice(index, 1);
					}
					this.wallFace1z = undefined;
				}
				if(this.wallFace2z) {
					var index = faces.indexOf(this.wallFace2z);
					if (index > -1) {
					  faces.splice(index, 1);
					}
					this.wallFace2z = undefined;
				}
				this.world.geometry.verticesNeedUpdate = true;
			}
		}
	}

	createMainFace() {
		this.world.geometry.vertices.push(this.topLeft);
		this.world.geometry.vertices.push(this.topRight);
		this.world.geometry.vertices.push(this.bottomLeft);
		this.world.geometry.vertices.push(this.bottomRight);
									
		// Both triangles to make the square
		this.face1 = new THREE.Face3( this.bottomLeftIndex, this.topRightIndex, this.topLeftIndex);
		this.face2 = new THREE.Face3( this.bottomRightIndex, this.topRightIndex, this.bottomLeftIndex);
		this.world.faceToVertexData.set(this.face1, this);
		this.world.faceToVertexData.set(this.face2, this);
		
		this.updateColor();
		
		this.world.geometry.faces.push(this.face1);
		this.world.geometry.faces.push(this.face2);
	}
	
	updateColor() {
		var newColor;
		if(this.xSlope != 0) {
			newColor = getColor(this.xSlope);
		} else if (this.zSlope != 0) {
			newColor = getColor(this.zSlope);
		} else if (this.connected) {
			newColor = flatColor;
		} else {
			if((this.z % 2 == 0 && this.x % 2 != 0) || (this.z % 2 != 0 && this.x % 2 == 0)) {
				newColor = generic;
			} else {
				newColor = generic2;
			}
		}
		if(this.color) {
			// Update
			this.face1.color.set(newColor);
			this.face2.color.set(newColor);
			this.world.mesh.geometry.colorsNeedUpdate = true;
		} else {
			// First time setting
			let colorCopy = new THREE.Color(newColor);
			this.face1.color = colorCopy;
			this.face2.color = colorCopy;
		}
		this.color = newColor;
	}
	
	/**
	 * For a non-angled it will read the new topLeftY and update
	 * the vertices then call this method for all connected angled ones.
	 * For an angled it will read the new topLeftY and the slopes to update the vertices.
	 *
	 * In both cases, it will then update the flatColor.
	 */
	updateHeight() {
		console.log("Updating height");

		this.topLeft.y = this.topLeftY;
		this.topRight.y = this.topLeftY + this.xSlope;
		this.bottomLeft.y = this.topLeftY + this.zSlope;
		this.bottomRight.y = this.topLeftY + (this.zSlope == 0 ? this.xSlope : this.zSlope);
		
		this.world.mesh.geometry.verticesNeedUpdate = true;
		this.world.physicsWorld.removeRigidBody(this.body);
		this.addRigidBody();
		this.updateXConnections(true);
		this.updateZConnections(true);
		if(!this.connected){ 
			this.world.updateHeight(this.x, this.topLeftY, this.z);

			if (this.remoteZ) {
				this.remoteZ.updateZConnections();
			} else {
				let adjVertex = this.world.vertexMap[this.x][this.z + 1];
				if(adjVertex) {
					adjVertex.updateZConnections();
				}
			}
			
			if (this.remoteX) {
				this.remoteX.updateXConnections();
			} else {
				let adjVertex = this.world.vertexMap[this.x + 1][this.z];
				if(adjVertex) {
					adjVertex.updateXConnections();
				}
			}
		}

		this.updateColor();
		// Needed because the face element was added.
		this.world.mesh.geometry.elementsNeedUpdate = true;
	}
	
	/* Important note: The verticies created are going to be
	 * redundant whenever the tiles are level next to each other
	 * OR are connected. However, this is needed to allow
	 * connected tiles to be disconnected (since the separate
	 * verticies would need to be used since they are independent
	 * now, and would be connected by two faces, making a vertical wall)
	 */
	createVerticies() {
		let numVerticies = this.world.geometry.vertices.length;
		this.topLeftIndex = numVerticies;
		this.topLeft = new THREE.Vector3(this.x, this.topLeftY, this.z);
		this.topRightIndex = numVerticies + 1;
		this.topRight = new THREE.Vector3(this.x + 1, this.topLeftY + this.xSlope, this.z);
		this.bottomLeftIndex = numVerticies + 2;
		this.bottomLeft = new THREE.Vector3(this.x, this.topLeftY + this.zSlope, this.z + 1);
		this.bottomRightIndex = numVerticies + 3;
		this.bottomRight = new THREE.Vector3(this.x + 1, this.topLeftY + (this.zSlope == 0 ? this.xSlope : this.zSlope), this.z + 1);
	}
	
	toString() {
		return "(" + this.x + ", " + this.z + ")";
	}
}

function getColor(slope) {
	let opp = Math.abs(slope);
	let adj = 1;
	let angle = Math.atan(opp/adj);
	console.log("OPP: " + opp + ", ADJ: " + adj + ", ANGLE %: " + (angle / (Math.PI / 2)));
	return new THREE.Color(hslToHex(angle / (Math.PI / 2), 1, 0.5));
}
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {number}          The hex representation
 */
function hslToHex(h, s, l){
	var r, g, b;

	if (s == 0){
		r = g = b = l; // achromatic
	} else {
		var hue2rgb = function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	
	console.log(r * 255 + " " + g * 255 + " " + b * 255);

	return 256 * 256 * Math.round(r * 255) + 256 * Math.round(g * 255) + Math.round(b * 255);
}

function updateControls(elapsed) {
	if(currentWorld) {
		// Controls
		if(forwardSpeed !== 0) {
			currentWorld.yawObject.translateZ(- forwardSpeed * elapsed);
		}
		if(sideSpeed !== 0) {
			currentWorld.yawObject.translateX(sideSpeed * elapsed);
		}
		
		if(forwardSpeed !== 0 || sideSpeed !== 0) {
			joggingAngle += elapsed * 600;  // "fiddle factor"
			currentWorld.yawObject.translateY(Math.sin(degToRad(joggingAngle))/ 100);
		}
		if(verticalSpeed !== 0) {
			currentWorld.yawObject.translateY(verticalSpeed * elapsed);
		}
	}
}

function toggleTime() {
	if(timeRate == 0) {
		timeRate = 1;
	} else {
		timeRate = 0;
	}
}

function slowTimeToggle() {
	if(timeRate == 1) {
		timeRate = 0.1;
	} else {
		timeRate = 1;
	}
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// -------------------------------------------------------- //
// -------------------------- HUD ------------------------- //
// -------------------------------------------------------- //
var HUDText = null;
var hudCanvas, hudContext, controlsChanged = false;

function initializeHUD() {
	
	// HUD will be a 2d canvas.
	hudCanvas = document.getElementById('hud-canvas');
	
	// Oversampling for better quality.
	hudCanvas.width = simulator.clientWidth;
	hudCanvas.height = simulator.clientHeight;
	
	hudContext = hudCanvas.getContext('2d');
	hudContext.shadowColor = "wall";
	hudContext.textAlign = 'center';
	
	calculateHUDPositions();
}

function calculateHUDPositions() {
	posTouchCenter = new THREE.Vector2(simulator.clientWidth / 6, simulator.clientHeight * 11 / 16);
	dirTouchCenter = new THREE.Vector2(simulator.clientWidth * (5 / 6), simulator.clientHeight * (11 / 16));
	vertTouchCenter = new THREE.Vector2(simulator.clientWidth * (1/2), simulator.clientHeight * (11 / 16));
	maxTouchDistance = Math.min(simulator.clientWidth / 7, simulator.clientHeight / 6);
	controlsChanged = true;
}

function updateHUD() {
	if(HUDText !== null) {
		console.log(HUDText);
		hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height/3);
		
		hudContext.font = "Normal " + (hudCanvas.height / 6) + "px Arial";
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
			drawCircle(posTouchCenter, "rgba(0, 180, 0, 0.3)", maxTouchDistance, 2);
			drawCircle(dirTouchCenter, "rgba(0, 180, 0, 0.3)", maxTouchDistance, 2);
			
			// The line that signifies vertical movement.
			hudContext.beginPath();
			hudContext.moveTo(vertTouchCenter.x, vertTouchCenter.y - maxTouchDistance);
			hudContext.lineTo(vertTouchCenter.x, vertTouchCenter.y + maxTouchDistance);
			hudContext.stroke();
		}
		
		if(positionTouch) {
			console.log(positionTouch);
			var currentTouchPos = new THREE.Vector2(positionTouch.clientX, positionTouch.clientY).sub(posTouchCenter);
			var dist = Math.min(currentTouchPos.length(), maxTouchDistance);
			currentTouchPos.normalize().multiplyScalar(dist);
			currentTouchPos.add(posTouchCenter);
			
			drawCircle(currentTouchPos, "rgba(0, 255, 0, 1)", 40, 10);
			
			hudContext.beginPath();
			hudContext.moveTo(posTouchCenter.x, posTouchCenter.y);
			hudContext.lineTo(currentTouchPos.x, currentTouchPos.y);
			hudContext.stroke();
		}
		if(directionTouch) {
			var currentTouchPos = new THREE.Vector2(directionTouch.clientX, directionTouch.clientY - hudCanvas.offsetTop).sub(dirTouchCenter);
			var dist = Math.min(currentTouchPos.length(), maxTouchDistance);
			currentTouchPos.normalize().multiplyScalar(dist);
			currentTouchPos.add(dirTouchCenter);

			drawCircle(currentTouchPos, "rgba(0, 255, 0, 1)", 40, 10);

			hudContext.beginPath();
			hudContext.moveTo(dirTouchCenter.x, dirTouchCenter.y);
			hudContext.lineTo(currentTouchPos.x, currentTouchPos.y);
			hudContext.stroke();
		}
		if(vertTouch) {
			var currentTouchPos = new THREE.Vector2(vertTouchCenter.x, vertTouch.clientY - hudCanvas.offsetTop).sub(vertTouchCenter);
			
			var dist = Math.min(currentTouchPos.length(), maxTouchDistance);
			currentTouchPos.normalize().multiplyScalar(dist);
			currentTouchPos.add(vertTouchCenter);
			
			drawCircle(currentTouchPos, "rgba(0, 255, 0, 1)", 40, 10);
		}
		
		controlsChanged = false;
	}

}

// -------------------------------------------------------- //
// ----------------------- CONTROLS ----------------------- //
// -------------------------------------------------------- //
var currentlyPressedKeys = {}; // An object that stores currently pressed keys

var positionTouch, directionTouch, vertTouch, mousePosition = new THREE.Vector2();
var posTouchCenter, dirTouchCenter, vertTouchCenter, maxTouchDistance;

var isTouch = false;
var switchedToFullScreen = false;

var lookAtSelected = true;
var maxDistance = 30; // meters

var touchControls;
var keyboardControls;

var raycaster = new THREE.Raycaster();
raycaster.linePrecision = 100;

// You need to initialize the HUD first.
function initializeControls() {
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	
	document.body.addEventListener("touchstart", handleStart, false);
	document.body.addEventListener("touchend", handleEnd, false);
	document.body.addEventListener("touchcancel", handleEnd, false);
	document.body.addEventListener("touchmove", handleMove, { passive: false });

	document.body.addEventListener("click", handleClick, false);
	document.body.addEventListener("fullscreenchange", resizeRenderer, false);
}

function handleClick(event) {
	if(event.target.nodeName === "CANVAS" && currentWorld) {
		event.preventDefault();
		var found = false;
		var target = event.target;
		
		// Gets the positions relative to the center, with a range of -1 to 1
		mousePosition.x = ( (event.clientX - target.offsetLeft) / target.clientWidth ) * 2 - 1;
		mousePosition.y = - ( (event.clientY - target.offsetTop) / target.clientHeight ) * 2 + 1;

		search: // Check exact point on desktop, check around it on mobile.
		for (var radius = 0; isTouch ? radius < 0.25 /* 25% of the width*/ : radius == 0; radius+= 0.015) {
			for(var angle = 0; radius == 0 ? angle == 0 : angle < 2 * Math.PI;
					angle+= Math.PI / Math.round(radius * 150 + 1)) {
				var checkLocation = new THREE.Vector2(mousePosition.x + radius * Math.cos(angle)
					, mousePosition.y + radius * Math.sin(angle));

				raycaster.setFromCamera( checkLocation, currentWorld.camera );
				
				var octreeObjects = currentWorld.octree.search( raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction );
				var intersections = raycaster.intersectOctreeObjects( octreeObjects );
				
				if(intersections.length > 0) {
					found = true;
					var projectile = currentWorld.projectilesByID[intersections[0].object.uuid];
					if(visualizationManager !== null) {
						if(projectile !== null ) {
							visualizationManager.selectProjectile(projectile);
						} else {
							visualizationManager.deselectProjectile();
						}
					}
					break search; // Don't want to go wider.
				} else if(visualizationManager !== null) {
					visualizationManager.deselectProjectile();
				}
			}
		}
		
		if(!found) {
			basicRaycaster.setFromCamera(mousePosition, currentWorld.camera);
			var result = basicRaycaster.intersectObject ( currentWorld.mesh, false);
			if(result.length > 0) {
				
				var vertexData = currentWorld.faceToVertexData.get(result[0].face);
				if(vertexData) {
					visualizationManager.selectTileUIUpdate(vertexData);
				} else {
					visualizationManager.deSelectTileUIUpdate();
				}
			} else {
				visualizationManager.deSelectTileUIUpdate();
			}
		} else {
			visualizationManager.deSelectTileUIUpdate();
		}
	}
}

function isTouchDevice(){
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch(e) {
    return false;
  }
}

function touchScroll(id){
  if( isTouchDevice() ){ //if touch events exist...
    var el = document.getElementById(id);
    var scrollStartPosX = 0;
    var scrollStartPosY = 0;

    document.getElementById(id).addEventListener("touchstart", function(event){
      scrollStartPosY = this.scrollTop + event.touches[0].pageY;
      scrollStartPosX = this.scrollLeft + event.touches[0].pageX;
      //event.preventDefault();
    }, false);

    document.getElementById(id).addEventListener("touchmove", function(event){
      this.scrollTop = scrollStartPosY - event.touches[0].pageY;
      this.scrollLeft = scrollStartPosX - event.touches[0].pageX;
      //event.preventDefault();
    },false);
  }
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
		if(positionTouch === undefined && touchPosition.distanceTo(posTouchCenter) <= maxTouchDistance) {
			positionTouch = touches[i];
			controlsChanged = true;
		} else if (directionTouch === undefined && touchPosition.distanceTo(dirTouchCenter) <= maxTouchDistance) {
			directionTouch = touches[i];
			controlsChanged = true;
		} else if (vertTouch === undefined && touchPosition.distanceTo(vertTouchCenter) <= maxTouchDistance) {
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
	
	var body = document.documentElement;
	if (body.requestFullscreen) {
	  body.requestFullscreen();
	} else if (body.webkitrequestFullscreen) {
	  body.webkitrequestFullscreen();
	} else if (body.mozrequestFullscreen) {
	  body.mozrequestFullscreen();
	} else if (body.msrequestFullscreen) {
	  body.msrequestFullscreen();
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

function drawCircle(position, style, radius, strokeWidth) {
	hudContext.beginPath();
	hudContext.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
	hudContext.lineWidth = strokeWidth;
	hudContext.strokeStyle = style;
	hudContext.stroke();
}

// Keys
function handleKeyDown(event) {
	if(event.target == document.body && !currentlyPressedKeys[event.keyCode] && !event.ctrlKey) {
		currentlyPressedKeys[event.keyCode] = Date.now();
		if(currentlyPressedKeys[76]) { // l
			visualizationManager.launchProjectile();
		} else if (currentlyPressedKeys[79]) { // o
			visualizationManager.setLaunchSettingsFromCam();
		} else if (currentlyPressedKeys[84]) { // t
			toggleTime();
		} else if (currentlyPressedKeys[82]) { // r
			slowTimeToggle();
		} else if (currentlyPressedKeys[27]) { // Escape
			closePopup();
		}
	}
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = 0;
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
		pitchRate = Math.PI * getSpeed(currentlyPressedKeys[38]);
	} else if (currentlyPressedKeys[40]) {
		// Down arrow
		pitchRate = -Math.PI * getSpeed(currentlyPressedKeys[40]);
	} else if (directionTouch) {
		pitchRate = (-PI_2) * getPercentage(directionTouch.clientY - dirTouchCenter.y - hudCanvas.offsetTop, maxTouchDistance);
	} else {
		pitchRate = 0;
	}

	if (currentlyPressedKeys[37]) {
		// Left cursor key
		yawRate = Math.PI * getSpeed(currentlyPressedKeys[37]);
	} else if (currentlyPressedKeys[39]) {
		// Right cursor key
		yawRate = -Math.PI * getSpeed(currentlyPressedKeys[39]);
	} else if (directionTouch) {
		yawRate = (-PI_2) * getPercentage(directionTouch.clientX - dirTouchCenter.x, maxTouchDistance);
	} else {
		yawRate = 0;
	}

	if (currentlyPressedKeys[87]) {
		// W
		forwardSpeed = 5 * getSpeed(currentlyPressedKeys[87]);
	} else if (currentlyPressedKeys[83]) {
		// S
		forwardSpeed = -5 * getSpeed(currentlyPressedKeys[83]);
	} else if (positionTouch) {
		forwardSpeed = -5 * getPercentage(positionTouch.clientY - posTouchCenter.y - hudCanvas.offsetTop, maxTouchDistance);
	} else {
		forwardSpeed = 0;
	}
	
	if (currentlyPressedKeys[65]) {
		// A
		sideSpeed = -5 * getSpeed(currentlyPressedKeys[65]);
	} else if (currentlyPressedKeys[68]) {
		// D
		sideSpeed = 5 * getSpeed(currentlyPressedKeys[68]);
	} else if (positionTouch) {
		sideSpeed = 5 * getPercentage(positionTouch.clientX - posTouchCenter.x, maxTouchDistance);
	} else {
		sideSpeed = 0;
	}
	if (currentlyPressedKeys[32]) {
		// Spacebar
		verticalSpeed = 5 * getSpeed(currentlyPressedKeys[32]);
	} else if (currentlyPressedKeys[16]) {
		// Shift
		verticalSpeed = -5 * getSpeed(currentlyPressedKeys[16]);
	} else if (vertTouch) {
		verticalSpeed = -5 * getPercentage(vertTouch.clientY - vertTouchCenter.y - hudCanvas.offsetTop, maxTouchDistance);
	} else {
		verticalSpeed = 0;
	}
}
function getSpeed(ms) {
	let temp = Math.max(0.05, Math.min(1, (Date.now() - ms)/200));
	return temp;
}

function getPercentage(relativeCoordinate, maxTouchDistance) {
	var noEffectDist = maxTouchDistance / 4;
	return Math.sign(relativeCoordinate) * Math.min(Math.max((Math.abs(relativeCoordinate) - noEffectDist), 0) / (maxTouchDistance - noEffectDist), 1);
}

// ----------------------------------------------------------- //
// ------------------------ Settings ------------------------- //
// ----------------------------------------------------------- //
var settings = [];

function Setting(title, functionToCall) {
	var options = [];
	
	var Option = function(title, functionCallData, enabled) {
		if(enabled === undefined) {
			enabled = false;
		}
		
		this.title = title;
		this.functionCallData = functionCallData;
		this.enabled = enabled;
	}
	
	this.title = title;
	this.functionToCall = functionToCall;
	this.addOption = function(title, functionCallData, enabled) {
		if(enabled === undefined) {
			enabled = false;
		}
		
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

function setCollisionDetectionEnabled(newValue) {
	collisionDetectionEnabled = newValue;
}

function setLookAtSelected(value) {
	lookAtSelected = value;
}

function setScale(scale) {
	resolutionScaleOfCanvas = scale;

	resizeRenderer();
}

function setParticleSystem(enable) {
	if(!particleSystem && enable) {
		particleSystem = new THREE.GPUParticleSystem( {
			maxParticles: 50000
		} );
		
		particleOptions = {
			position: new THREE.Vector3(),
			positionRandomness: .3,
			velocity: new THREE.Vector3(),
			velocityRandomness: 0,
			color: 0xba720d,
			colorRandomness: .2,
			turbulence: 0.01,
			lifetime: 1,
			size: 4,
			sizeRandomness: 2
		};
		
		currentWorld.scene.add(particleSystem);
	} else if (particleSystem && !enable) {
		currentWorld.scene.remove(particleSystem);
		particleSystem = undefined;
	}
}

function setShadowQuality(quality) {
	if(quality != 0) {
		renderer.shadowMap.enabled = true;
		currentWorld.sunLight.shadow.mapSize.height = quality;
		currentWorld.sunLight.shadow.mapSize.width = quality;
		renderer.shadowMap.autoUpdate = true;
	} else {
		renderer.shadowMap.enabled = false;
		renderer.clearTarget( currentWorld.sunLight.shadow.map );
		renderer.shadowMap.autoUpdate = false;
	}
}

// Re-calls the functionToCall for each enabled setting option.
function reloadSettings() {
	for(var setting of settings) {
		options:
		for(var option of setting.getOptions()) {
			if(option.enabled) {
				setting.functionToCall(option.functionCallData);
				break options;
			}
		}
	}
}

function loadSettings() {
	var psSetting = new Setting("Power-saver mode", setPowerSaverMode);
	psSetting.addOption("Enabled", true, true);
	psSetting.addOption("Disabled", false);
	settings.push(psSetting);
	
	var cdSetting = new Setting("Collision detection", setCollisionDetectionEnabled);
	cdSetting.addOption("Enabled", true, true);
	cdSetting.addOption("Disabled", false);
	settings.push(cdSetting);
	
	var lookAtSetting = new Setting("Look at selected projectile", setLookAtSelected);
	lookAtSetting.addOption("Enabled", true, true);
	lookAtSetting.addOption("Disabled", false);
	settings.push(lookAtSetting);
	
	var downsampleSetting = new Setting("Quality", setScale);
	downsampleSetting.addOption("High", 2.0);
	downsampleSetting.addOption("Normal", 1.0, true);
	downsampleSetting.addOption("Low", 0.5);
	settings.push(downsampleSetting);
	
	var shadowQualitySetting = new Setting("Shadow Quality", setShadowQuality);
	shadowQualitySetting.addOption("off", 0);
	shadowQualitySetting.addOption("Low", 1024, true);
	shadowQualitySetting.addOption("Medium", 2048);
	shadowQualitySetting.addOption("High", 4096);
	shadowQualitySetting.addOption("Ultra", 8192);
	settings.push(shadowQualitySetting);

	var particlesSetting = new Setting("Particles", setParticleSystem);
	particlesSetting.addOption("Enabled", true, true);
	particlesSetting.addOption("Disabled", false);
	settings.push(particlesSetting);
}

// ----------------------------------------------------------- //
// ----------------------- PROJECTILES ----------------------- //
// ----------------------------------------------------------- //

// ----------------------------------------------------------------- //
// TODO: Take several forces into consideration, like normal force.  //
// This will fix the ground issues.                                  //
// ----------------------------------------------------------------- //

var collisionDetectionEnabled = true;

var c = new M.Context();
c.a = M("a", c);
c.r = M("r", c);
c.v = M("v", c);

var defaultPositionEquation = "r + (v * t) + ( 1/2 )(a * t ^ 2)";
var positionEquation;
var velocityEquation;
var positionEquationCompiled;
var velocityEquationCompiled;

function setPositionEquation(equationString) {
}

/**
 * Converts a 3D vector into a string
 */
function vectorToString(vector) {
	return "(" + (Math.round( vector.x * 10) / 10).toFixed(1) + ", " + (Math.round( vector.y * 10) / 10).toFixed(1) + ", " + (Math.round( vector.z * 10) / 10).toFixed(1) + ")";
}

var textureLoader = new THREE.TextureLoader();
var rockTexture = textureLoader.load( 'textures/groundgrassrootsseamless_spec.jpg' );


function Projectile(initialPosition, initialVelocity, mass, radius, time, resistation, friction, linearDamping) {
	console.log("Created sphere with radius " + radius + " and initial time " + time);
	
	
	// THREE.js
	this.geometry = new THREE.SphereGeometry( radius, 20, 20);
	this.material = new THREE.MeshPhongMaterial( {color: Math.floor(Math.random()*16777215), wireframe: false, transparent: true, map: rockTexture} );
	this.mesh = new THREE.Mesh( this.geometry, this.material);
	
	currentWorld.projectilesByID[this.mesh.uuid] = this;
	
	this.mesh.position.x = initialPosition.x;
	this.mesh.position.y = initialPosition.y;
	this.mesh.position.z = initialPosition.z;
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;
	
	// AMMO.js

	var shape = new Ammo.btSphereShape( radius );
	shape.setMargin( physicsMargin );
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	shape.calculateLocalInertia( mass, localInertia );
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	var pos = this.mesh.position;
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	var motionState = new Ammo.btDefaultMotionState( transform );
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia, linearDamping, 0, friction, 0, resistation);
	var body = new Ammo.btRigidBody( rbInfo );
	body.setLinearVelocity(new Ammo.btVector3( initialVelocity.x, initialVelocity.y, initialVelocity.z ));
	this.physicsBody = body;
	currentWorld.physicsWorld.addRigidBody( body );
	body.setCcdMotionThreshold(0.01)
	body.setCcdSweptSphereRadius(radius)		
	body.setRestitution(resistation);
	// FINAL/CURRENT variables
	// Updated as often as needed.
	var position = this.mesh.position; // Update every tick
	this.getPosition = function() { return position; }

	var velocity = new THREE.Vector3(0,0,0); // Update Every tick
	this.getVelocity = function() { return velocity; }
	
	var acceleration = new THREE.Vector3(0,-9.8,0); // Update every time a new force is applied
	this.getAcceleration = function() { return acceleration; }
	
	// INITIAL variables
	var initialPosition = initialPosition.clone(); // Updated when initial acceleration or initial elocity changes
	this.getInitialPosition = function() { return initialPosition; }
	
	if(initialVelocity === undefined) { initialVelocity = new THREE.Vector3(0,0,0); }
	this.getInitialVelocity = function() { return initialVelocity; }
	
	var initialTime = time;
	this.getInitialTime = function() { return initialTime; }


	// OTHER
	this.getRotation = function() { return this.mesh.rotation; }
	this.orientationQuaternion = new THREE.Quaternion(0,0,0,0);
	this.spinQuaternion = new THREE.Quaternion(0,0,0,0);
	this.angularVelocity = new THREE.Vector3(0,0,0);
	
	this.getRadius = function() { return radius }
	
	this.number = currentWorld.projectiles.length + 1;
	currentWorld.projectiles.push(this);
	
	currentWorld.scene.add(this.mesh);
	currentWorld.octree.add(this.mesh);
	currentWorld.octree.update();
	
	this.calulateForces = function() {

	}

	this.update = function(currentTime, elapsed, collided, isSecondCall) {
		
		//velocity.set(ammoVelocity.x(), ammoVelocity.y(), ammoVelocity.z());
		
		var objPhys = this.physicsBody;
		var ms = objPhys.getMotionState();		

		if (ms) {		
			ms.getWorldTransform( currentWorld.transformAux1 );		
			var p = currentWorld.transformAux1.getOrigin();		
			var q = currentWorld.transformAux1.getRotation();		
			this.mesh.position.set( p.x(), p.y(), p.z() );		
			this.mesh.quaternion.set( q.x(), q.y(), q.z(), q.w() );		
			var ammoVelocity = this.physicsBody.getLinearVelocity();
			if(this.pauseAtPeak && (Math.sign(velocity.x) !== Math.sign(ammoVelocity.x()) || Math.sign(velocity.z) !== Math.sign(ammoVelocity.z()) || Math.sign(velocity.y) !== Math.sign(ammoVelocity.y()))) {
				timeRate = 0;
			}
			velocity.set(ammoVelocity.x(), ammoVelocity.y(), ammoVelocity.z());		
		}
	}
	
	this.wallCollision = function(x, y, z, timeOfLastFrame, timeSinceInitial) {
		
		collided = true;
		
		// Spawns particles to make collisions clear
		if(particleSystem) {
			particleOptions.position.x = (x == null ? position.x : x);
			particleOptions.position.y = (y == null ? position.y : y);
			particleOptions.position.z = (z == null ? position.z : z);
			for(var i = 0; i < 300; i++) {
				particleOptions.velocity.x = Math.random() * (x == null ? 2 - 1 : -0.4 * Math.sign(x));
				particleOptions.velocity.y = Math.random() * (y == null ? 2 - 1 : -0.4 * Math.sign(y));
				particleOptions.velocity.z = Math.random() * (z == null ? 2 - 1 : -0.4 * Math.sign(z));
				particleSystem.spawnParticle(particleOptions);
			}
		}
	}
	
	this.updateIVariables = function(relativeTimeOfCollision) {
	}
}

// ----------------------------------------------------------- //
// ----------------- WebSockets and Accounts ----------------- //
// ----------------------------------------------------------- //


// For authentication
var profile; // This is an object
var profileTypes; // Array

// For websockets
var socketConn, wsLocation, authToken, attemptingToLogin; // Please don't store passwords here.

// For packets
var packetFunctions = {};

function initPackets() {
	packetFunctions["roles_response"] = onRolesResponse;
	packetFunctions["login_response"] = onLogin;
}

function onRolesResponse(data) {
	profileTypes = data;
}


function initWebsockets() {
	wsLocation = "ws://" + window.location.hostname + (window.location.port.length > 0 ? (":" + window.location.port) : "") + "/socketserver";
	openWebsockets();
	setInterval(updateNetwork, 1000);
}

function openWebsockets() {
	if(wsLocation) {
		socketConn = new WebSocket(wsLocation);
		socketConn.onerror = onWebsocketError;
		socketConn.onmessage = onMessageReceived;
		socketConn.onopen = onConnectionOpened;
		attemptingToLogin = true;
	}
}

function onWebsocketError(event) {
	console.log("Error with websocket.");
}

function onMessageReceived(event) {
	console.log("Message received! " + event.data);
	let packet = JSON.parse(event.data);
	let id = packet.id;
	if(id) {
		let func = packetFunctions[id];
		if(func) {
			func(packet.data);
		}
	}
}

function onConnectionOpened(event) {
	console.log("Connection opened!");
	console.log(event);
	initAccounts();
	attemptingToLogin = false;
}

var wsTick = 0; // One per second
function updateNetwork() {
	wsTick++;
	if(socketConn != null && socketConn.readyState == 1 && wsTick % 30 == 0) {
		sendPacket("keepalive", {});
	}
	if (socketConn == null || socketConn.readyState > 1) {
		openWebsockets();
	}
}

function sendPacket(packetName, data) {
	if (socketConn) {
		var packet = JSON.stringify({id: packetName, data: data, token: authToken});
		socketConn.send(packet);
		return true;
	} else { 
		return false;
	}
}


// Accounts
function initAccounts() {
	// Do POST request - Will be in format:
	// Request: { "username":"<username>", "password":"password", "login_token":"<token>"}
	// Response: { "username":"<username>", "token":"token", "role":"teacher/student"}
	// Display username
	
	// Get roles
	sendPacket("get_roles", {});
}

function login(username, password, register) {
	sendPacket((register ? "register" : "login"), {username: username, password: password});
}

function onLogin(data) {
	if(data.success) {
		document.getElementById("login-register").style.display = "none";
		document.getElementById("profile-name").innerText = data.profile_json.username;
		displayProfileDOMs(true);
	} else {
		accountDropdownMessage(data.message);
	}
}

// COOKIES

function setCookie(cname, cvalue, expires) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
	if(expires && expires.length() > 0) {
		expires = "expires=" + expires + ";";
	}
    document.cookie = cname + "=" + cvalue + ";" + expires + "path=/";
}

// Credit to W3Schools
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// ----------------------------------------------------------- //
// ---------------------- User Interface --------------------- //
// ----------------------------------------------------------- //

// The scale, relative to the actual display width, that the canvas will render at.
// Anything more than 1 is pointless. 
var resolutionScaleOfCanvas = 1; // Barely improved performance below 1. Increase to 2 for high quality.

/* Popups and Dropdowns */

/**
 * On calling of this function, a popup will display on screen, and 
 *
 * @param title: A string of the name of the title of the window.
 */
function openPopup(title) {
	var overlayContainer = document.getElementById("overlay-popup-container");
	var titleDivs = overlayContainer.getElementsByClassName("popup-title");
	var contentDivs = overlayContainer.getElementsByClassName("popup-content");
	var index = title.indexOf(".html");
	var visibleTitle = title.charAt(0).toUpperCase() + title.substring(1, index == -1 ? title.length : index);
	
	for(var i = 0; i < titleDivs.length; i++) {
		titleDivs[i].innerHTML = visibleTitle;
	}
	
	var contentHTML;

	if(title.toLowerCase() === "settings") {
		contentHTML = getSettingsHTML();
	} else if(title.endsWith("html")) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", title, false);
		xmlhttp.send();
		if(xmlhttp.status == 200) {
			contentHTML = xmlhttp.responseText;
		} else {
			contentHTML = "Count not load popup. Status: " + xmlhttp.statusText;
		}
	} else {
		contentHTML = "Unknown popup";
	}
	
	for(var i = 0; i < contentDivs.length; i++) {
		contentDivs[i].innerHTML = contentHTML;
	}
	overlayContainer.style.display = "inherit";
	setTimeout( function() {
		if(overlayContainer.style.display === "inherit") {
			overlayContainer.style.opacity = "1";
		}
	}, 5);
	
	document.getElementById("simulator").style.filter = "blur(4px)";
}

// For backwards compatibility
if(!String.prototype.endsWith) {
	String.prototype.endsWith = function(pattern) {
	  var d = this.length - pattern.length;
	  return d >= 0 && this.lastIndexOf(pattern) === d;
	};
}

var settingsPerCol = 1;

function getSettingsHTML() {
	var html = '';
	
	if(settings) {
		var i = 0;
		for(; i < settings.length; i++) {
			
			var setting = settings[i];
			var options = setting.getOptions();
			var optionsLength = options.length;
			
			if(i % settingsPerCol == 0) {
				if(i != 0) {
					html+= '</div>';
				}
				html+= '\n<div class="panel-section">';
			}
			html+= '<form>\n<div class="setting">';
			html+= '<div class="setting-title">' + setting.title + '</div>';
			for(var j = 0; j < optionsLength; j++) {
				var option = options[j];
				
				html+= '<input type="radio" id="setting-' + i + '-' + setting.title + '-' + option.title + '" name="' + setting.title + '" value="' + option.functionCallData + '"' + (option.enabled ? "checked" : "") + ' onclick=\'updateSetting("' + setting.title + '", "' + option.title + '")\'> <label for="setting-' + i + '-' + setting.title + '-' + option.title + '">' + option.title + '</label>';
			}
			html+= '</div>\n</form>\n';
		}
		if(i % settingsPerCol == 1 && settings.length > 0) {
			html+= '</div>';
		}
	} else {
		html = '<h2>Settings not loaded.</h2>';
	}
	
	return html;
}

function closePopup() {
	var overlayContainer = document.getElementById("overlay-popup-container");
	var titleDivs = overlayContainer.getElementsByClassName("popup-title");
	for(var i = 0; i < titleDivs.length; i++) {
		titleDivs[i].innerHTML = "";
	}

	overlayContainer.style.opacity = "0";
	document.getElementById("simulator").style.filter = "none";
	
	if(overlayContainer.style.display !== "none") {
		setTimeout( function() {
			if(overlayContainer.style.opacity === "0") {
				overlayContainer.style.display = "none";
			}
		}, 200);
	}
}

function toggleDropdown(dropDownName, elementToBeUnder) {
	var dropDown = document.getElementById(dropDownName);
	if(dropDown) {
		if(getComputedStyle(dropDown).display !== "none") { // is currently visible
			
		} else {
			// Make sure display block goes before all of the other stuff
			dropDown.style.display = "block";
			
			var pointerX = elementToBeUnder.offsetLeft + elementToBeUnder.offsetWidth / 2;
			var pointerY = elementToBeUnder.offsetTop + elementToBeUnder.offsetHeight;
			var maxX = document.body.clientWidth - dropDown.clientWidth;
			
			var windowX = pointerX - dropDown.offsetWidth / 2;
			
			windowX = Math.min(windowX, maxX - 10);
			windowX = Math.max(windowX, 10);
			dropDown.style.left = windowX + "px";
			dropDown.style.top = pointerY + "px";
			var arrows = dropDown.getElementsByClassName("dropdown-arrow");
			
			for(var i = 0; i < arrows.length; i++) {
				arrows[i].style.left = (pointerX - windowX - arrows[i].offsetWidth / 2) + "px";
			}
			
			setTimeout( function() {
				if(dropDown.style.display === "block") { // Makes sure it is the same
					dropDown.classList.add("dropdown-visible");
				}
			}, 5);
		}
	}
}

function closeDropdown(dropDown) {
	dropDown.classList.remove("dropdown-visible");	
	setTimeout( function() {
		if(!dropDown.classList.contains("dropdown-visible")) { // Makes sure it is the same
			dropDown.style.display = "none";
		}
	}, 250);
}

function closeAllDropdowns() {
	var dropdowns = document.getElementsByClassName("dropdown");
	for (var i = 0; i < dropdowns.length; i++) {
		var openDropdown = dropdowns[i];
		if (openDropdown.classList.contains('dropdown-visible')) {
			closeDropdown(openDropdown);
		}
	}
}

function openSidePage(index, clickedElement) {
	// Open the page and close all others
	var sidePages = document.getElementById('side-pages');
	for(var i = 0; i < sidePages.children.length; i++) {
		if(i == index) {
			sidePages.children[i].style.display = "block";
		} else {
			sidePages.children[i].style.display = null;
		}
	}
	
	// Update the class on the item so that it shows selected.
	if (clickedElement) { // If they clicked on it.
		var icons = document.getElementById('icons');
		var divWithIcons = icons.firstElementChild;
		
		for(var i = 0; i < divWithIcons.children.length; i++) {
			var icon = divWithIcons.children[i].firstElementChild;
			if(icon == clickedElement) {
				icon.classList.add("selected-icon");
			} else {
				icon.classList.remove("selected-icon");
			}
		}
	}
}

function loginForm(register) {
	var username = document.getElementById("username-input").value;
	var password = document.getElementById("password-input").value;
	
	if (username.length < 6) {
		accountDropdownMessage("Username too short.");
	} else if (password.length < 6) {
		accountDropdownMessage("Password too short.");
	} else if (socketConn.readyState != 1) {
		accountDropdownMessage("Connection error.");
	} else {
		login(username, password, register);
	}	
}

function accountDropdownMessage(message) {
	// If not selected, make it selected so it drops down.
	document.getElementById("login-details").innerText = message;
	
	toggleDropdown("accounts", document.getElementById("account-dropdown"));
}

function displayProfileDOMs(display) {
	var elements = document.getElementsByClassName("when-logged-in");
	for(var i = 0; i < elements.length; i++) {
		elements[i].style.display = display ? "initial" : "none !important";
	}
}

window.addEventListener("resize", closeAllDropdowns);

document.addEventListener("click", function(e) {
	var element = document.getElementById('overlay-popup-container');
	if(element !== undefined && element.style.display !== "none") {
		if (e.target.className == "sidepanel-closebutton") {
			closeNav();
		} else if (e.target === element || e.target.className == "popup-closebutton") {
			closePopup();
		}
	}
	
	if(e.target && !getParentElement(e.target, "dropdown")) {
		closeAllDropdowns();
	}
	
	if(e.target) {
		var parentElement = getParentElement(e.target, "panel-section-toggle");
		if(parentElement) {
			var next = parentElement.nextElementSibling;
			if(next) {
				// Found. Now close all others.
				var allSections = document.getElementsByClassName("panel-section-toggle"), length = allSections.length;
				for(var i = 0; i < length; i++) {
					if(allSections[i] !== parentElement) {
						allSections[i].nextElementSibling.style.display = "none";
					}
				}
				
				if(next.style.display === "none") {
					next.style.display = "block";
				} else {
					next.style.display = "none";
				}
			}
		}
	}
});

function getParentElement(element, className) {
	while(element != undefined) {
		if(element.className && element.className.split(" ").indexOf(className) !== -1) {
			return element;
		}

		element = element.parentElement;
	}
	return null;
}

// --------------------------------------------------- //
// ------------------ Visualizations ----------------- //
// --------------------------------------------------- //

var visualizationManager;

function VisualizationManager() {
	var glowMaterial, glowProjectile, selectedProjectile, selectedTile, isConnectingTiles = false;
	var initialParametersArrow, accelerationArrow, velocityArrow;
	var initialParamsColor = 0x00ff00, accelerationColor = 0x991010, velocityColor = 0x00dcff;
	var headLength = 0.6;
	
	// Loads the texture.
	loadSelectionGlowTexture();
	
	this.getSelectedProjectile = function() { return selectedProjectile }
	
	this.update = function(elapsed) {
		updateSidePanel();
		if(selectedProjectile) {
			updateSelectionMarker();
			updateArrows();
		}
	}
	
	this.deselectProjectile = function() {
		if(glowProjectile) {
			currentWorld.scene.remove(glowProjectile);
		}
		selectedProjectile = null;
		document.getElementById("projectile-data").className = "";
		document.getElementById("projectile-launcher").className = "visible";
		
		this.disableAllArrows();
	}
	
	this.selectProjectile = function(projectile) {
		if(glowProjectile) {
			// Old one
			currentWorld.scene.remove(glowProjectile);
		}
		
		// Creates the glowing sphere
		var geometry = new THREE.SphereGeometry(projectile.getRadius() * 1.5, 20, 20);
		
		glowMaterial.uniforms.viewVector.value = new THREE.Vector3().subVectors( currentWorld.yawObject.position, projectile.getPosition() );
		glowProjectile = new THREE.Mesh( geometry, glowMaterial);
		
		glowProjectile.position.copy(projectile.getPosition());
		currentWorld.scene.add( glowProjectile );
		
		selectedProjectile = projectile;
		document.getElementById("projectile-data").className = "visible";
		document.getElementById("projectile-launcher").className = "";
		
		document.getElementById("arrows-enabled").checked = false;
	}
	
	this.updateAngle = function() {
		let speed = parseFloat(document.getElementById('launch-speed').value);
		let yaw = degToRad(parseFloat(document.getElementById('launch-velocity-yaw').value));
		let pitch = degToRad(parseFloat(document.getElementById('launch-velocity-pitch').value));
		
		if(!isNaN(speed) && !isNaN(yaw) && !isNaN(pitch)) {
			let x = Math.cos(yaw) * speed * Math.cos(pitch);
			let y = speed * Math.sin(pitch);
			let z = Math.sin(yaw) * speed * Math.cos(pitch);

			x = Math.round(x * 10000) / 10000
			y = Math.round(y * 10000) / 10000
			z = Math.round(z * 10000) / 10000

			document.getElementById('launch-velocity-x').value = x;
			document.getElementById('launch-velocity-y').value = y;
			document.getElementById('launch-velocity-z').value = z;
		}

		
	}
	
	this.launchProjectile = function() {

		var initialVelocity = new THREE.Vector3();
		var initialPosition = new THREE.Vector3();
		
		initialVelocity.x = parseFloat(document.getElementById("launch-velocity-x").value);
		initialVelocity.y = parseFloat(document.getElementById("launch-velocity-y").value);
		initialVelocity.z = parseFloat(document.getElementById("launch-velocity-z").value);
		initialPosition.x = parseFloat(document.getElementById("launch-position-x").value);
		initialPosition.y = parseFloat(document.getElementById("launch-position-y").value);
		initialPosition.z = parseFloat(document.getElementById("launch-position-z").value);
		var radius = parseFloat(document.getElementById("launch-radius").value);
		var mass = parseFloat(document.getElementById("launch-mass").value);
		var friction = parseFloat(document.getElementById("launch-friction").value);
		var elasticity = parseFloat(document.getElementById("launch-elasticity").value);
		var resistAir = document.getElementById("launch-resist-air").checked;

		var projectile = new Projectile(initialPosition, initialVelocity, mass, radius, time, elasticity, friction, resistAir ? 0.4 : 0);
		projectile.pauseAtPeak =  document.getElementById("pause-at-peak-toggle").checked;
		
		if(visualizationManager !== null) {
			visualizationManager.selectProjectile(projectile);
		}
	}
	
	function loadSelectionGlowTexture() {
		glowMaterial = new THREE.ShaderMaterial( 
		{
			uniforms: 
			{ 
				"c":   { type: "f", value: 0.2 },
				"p":   { type: "f", value: 3 },
				glowColor: { type: "c", value: new THREE.Color(0xffee00) },
				viewVector: { type: "v3", value: new THREE.Vector3(0,0,0) }
			},
			vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
			fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
			side: THREE.BackSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		}
		);
	}
	
	function updateSelectionMarker() {
		glowProjectile.position.copy(selectedProjectile.getPosition());
		glowMaterial.uniforms.viewVector.value = new THREE.Vector3().subVectors( currentWorld.yawObject.position, selectedProjectile.getPosition() );
	}
	
	
	function updateSidePanel() {
		if(selectedProjectile) {
			document.getElementById("position-value").innerHTML = vectorToString(selectedProjectile.getPosition());
			document.getElementById("initial-position-value").innerHTML = vectorToString(selectedProjectile.getInitialPosition());
			document.getElementById("velocity-value").innerHTML = vectorToString(selectedProjectile.getVelocity());
			document.getElementById("initial-position-dist-value").innerHTML = Math.round(1000 * selectedProjectile.getInitialPosition().clone().sub(selectedProjectile.getPosition()).length()) / 1000;
		
			document.getElementById("initial-velocity-value").innerHTML = vectorToString(selectedProjectile.getInitialVelocity());
			/*document.getElementById("acceleration-value").innerHTML = vectorToString(selectedProjectile.getAcceleration());*/
		/*	document.getElementById("delta-time-value").innerHTML = (Math.round( (time - selectedProjectile.getInitialTime()) * 1000) / 1000).toFixed(3);*/
		}
		
		document.getElementById("camera-position-value").innerHTML = vectorToString(currentWorld.yawObject.position);
	}
	
	this.setLaunchSettingsFromCam = function() {
		document.getElementById("launch-velocity-x").value = Math.round(-Math.sin(currentWorld.yawObject.rotation.y) * 5 * 10000)/10000;
		document.getElementById("launch-velocity-y").value = Math.round(Math.sin(currentWorld.pitchObject.rotation.x) * 9.81 * 10000)/10000;
		document.getElementById("launch-velocity-z").value = Math.round(-Math.cos(currentWorld.yawObject.rotation.y) * 5 * 10000)/10000;
		document.getElementById("launch-position-x").value = Math.round(currentWorld.yawObject.position.x * 10000)/10000;
		document.getElementById("launch-position-y").value = Math.round(currentWorld.yawObject.position.y * 10000)/10000;
		document.getElementById("launch-position-z").value = Math.round(currentWorld.yawObject.position.z * 10000)/10000;
	}
	this.setLaunchSettingsFromCam(); // Run it.

	// Tile selection
	this.selectTileUIUpdate = function(tile) {
		if(isConnectingTiles) {
			this.initiateConnection();
			if(selectedTile && tile && selectedTile != tile) {
				// Set swap == true if the selected tile has a greater x/z value
				let swap = (tile.x == selectedTile.x && selectedTile.z > tile.z
					|| tile.z == selectedTile.z && selectedTile.x > tile.x);
					
				if((!swap && tile.connectTo(selectedTile)) || (swap && selectedTile.connectTo(tile))) {
					// Valid two tiles. Already connected in the if statement.
					this.deSelectTileUIUpdate();
				} else {
					alert("Invalid connection! They must both be flat tiles in the same "
						+ "row or column (x or z) without anything in between that would conflict.");
				}
			} else {
				alert("Invalid tile(s)");
			}
		} else {
			this.deSelectTileUIUpdate();
			document.getElementById("tile-info").className = "visible";
			document.getElementById("tile-info-none").className = "";
			document.getElementById("tile-id").innerText = tile.toString();
			document.getElementById("tile-type").innerText =
				!tile.connected ? "Flat" : "Connecting";
			
			let allConnectionInfo = document.getElementById("tile-connection-info");
			allConnectionInfo.style.display = "block";

			let heightEdit = document.getElementById("height-edit");
			if(!tile.connected) {
				heightEdit.style.display = "block";
				heightEdit.firstElementChild.min = minY;
				heightEdit.firstElementChild.value = tile.topLeftY;
			} else {
				heightEdit.style.display = "none";
			}

			let tileConnector = document.getElementById("tile-connector");
			if((!tile.connectedX || !tile.connectedZ) && !tile.connected) {
				tileConnector.style.display = "block";
			} else {
				tileConnector.style.display = "";
			}
			
			var connectedToByX = document.getElementById("tile-connected-to-by-x");
			if(tile.remoteX && !tile.connected) {
				connectedToByX.style.display = "block";
				document.getElementById("tile-connected-to-by-value-x").innerText = tile.remoteX.toString();
			} else {
				connectedToByX.style.display = "";
			}
			var connectedToByZ = document.getElementById("tile-connected-to-by-z");
			if(tile.remoteZ && !tile.connected) {
				connectedToByZ.style.display = "block";
				document.getElementById("tile-connected-to-by-value-z").innerText = tile.remoteZ.toString();
			} else {
				connectedToByZ.style.display = "";
			}
			
			var connectedToX = document.getElementById("tile-connected-to-x");
			if(tile.connectedX && !tile.connected) {
				document.getElementById("tile-connected-to-value-x").innerText = "(" + tile.connectedX + ", " + tile.z + ")";
				connectedToX.style.display = "block";
			} else {
				connectedToX.style.display = "";
			}
			var connectedToZ = document.getElementById("tile-connected-to-z");
			if(tile.connectedZ && !tile.connected) {
				document.getElementById("tile-connected-to-value-z").innerText = "(" + tile.x + ", " + tile.connectedZ + ")";
				connectedToZ.style.display = "block";
			} else {
				connectedToZ.style.display = "";
			}			
			selectedTile = tile;
			selectedTile.setSelected(true);
		}
	}
	
	this.deSelectTileUIUpdate = function() {
		document.getElementById("tile-info").className = "";
		document.getElementById("tile-info-none").className = "visible";
		if(selectedTile) {
			console.log(selectedTile.x + ", " + selectedTile.z);
			selectedTile.setSelected(false);
			selectedTile = undefined;
		}
		
		let allConnectionInfo = document.getElementById("tile-connection-info");
		allConnectionInfo.style.display = "";
	}
	
	this.initiateConnection = function() {
		isConnectingTiles = !isConnectingTiles;
		let button = document.getElementById("connection-selector")
		if(isConnectingTiles) {
			button.innerText = "Click on a valid tile!";
		} else {
			button.innerText = "Select Tile";
		}
	}
	
	this.getSelectedTile = function() {
		return selectedTile;
	}
	
	// Arrows
	
	function updateArrows() {
		if(initialParametersArrow) {
			var initialPosition = selectedProjectile.getInitialPosition();
			
			if(initialParametersArrow.line.scale.y + headLength !== selectedProjectile.getInitialVelocity().length()) {
				initialParametersArrow.setLength(selectedProjectile.getInitialVelocity().length(), headLength, headLength * 0.5);
			}
			initialParametersArrow.setDirection(selectedProjectile.getInitialVelocity().clone().normalize());
			if(!initialParametersArrow.position.equals(initialPosition)) {
				initialParametersArrow.position.x = initialPosition.x;
				initialParametersArrow.position.y = initialPosition.y;
				initialParametersArrow.position.z = initialPosition.z;
			}
		}
		
		if(velocityArrow) {
			var position = selectedProjectile.getPosition();
			if(!velocityArrow.position.equals(position)) {
				velocityArrow.position.x = position.x;
				velocityArrow.position.y = position.y;
				velocityArrow.position.z = position.z;
			}
			velocityArrow.setDirection(selectedProjectile.getVelocity().clone().normalize());
			velocityArrow.setLength(selectedProjectile.getVelocity().length(), headLength, headLength * 0.5);
		}
		
		if(accelerationArrow) {
			var position = selectedProjectile.getPosition();
			if(!accelerationArrow.position.equals(position)) {
				accelerationArrow.position.x = position.x;
				accelerationArrow.position.y = position.y;
				accelerationArrow.position.z = position.z;
			}
			
			if(accelerationArrow.line.scale.y + headLength !== selectedProjectile.getAcceleration().length()) {
				accelerationArrow.setLength(selectedProjectile.getAcceleration().length(), headLength, headLength * 0.5);
				accelerationArrow.setDirection(selectedProjectile.getAcceleration().clone().normalize(), headLength, headLength * 0.5);
			}
		}
	}
	
	this.enableInitialParamsArrow = function() {
		if(!initialParametersArrow && selectedProjectile) {
			document.getElementById("initial-position-value").parentElement.style.border = "1px solid #" + intToRGB(initialParamsColor);
			document.getElementById("initial-velocity-value").parentElement.style.border = "1px solid #" + intToRGB(initialParamsColor);
			initialParametersArrow = new THREE.ArrowHelper(selectedProjectile.getInitialVelocity().clone().normalize(), selectedProjectile.getInitialPosition(), selectedProjectile.getInitialVelocity().length(), initialParamsColor);
			currentWorld.scene.add(initialParametersArrow);
		}
	}
	
	this.disableInitialParamsArrow = function() {
		if(initialParametersArrow) {
			document.getElementById("initial-position-value").parentElement.style.border = "none";
			document.getElementById("initial-velocity-value").parentElement.style.border = "none";
			scene.remove(initialParametersArrow);
			
			initialParametersArrow = null;
		}
	}
	this.enableVelocityArrow = function() {
		if(!velocityArrow && selectedProjectile) {
			document.getElementById("velocity-value").parentElement.style.border = "1px solid #" + intToRGB(velocityColor);
			velocityArrow = new THREE.ArrowHelper(selectedProjectile.getVelocity().clone().normalize(), selectedProjectile.getPosition(), selectedProjectile.getVelocity().length(), velocityColor);
			scene.add(velocityArrow);
		}
	}
	
	this.disableVelocityArrow = function() {
		if(velocityArrow) {
			document.getElementById("velocity-value").parentElement.style.border = "none";

			scene.remove(velocityArrow);
			
			velocityArrow = null;
		}
	}
	
	this.enableAccelerationArrow = function() {
		if(!accelerationArrow && selectedProjectile) {
			document.getElementById("acceleration-value").parentElement.style.border = "1px solid #" + intToRGB(accelerationColor);
			accelerationArrow = new THREE.ArrowHelper(selectedProjectile.getAcceleration().clone().normalize(), selectedProjectile.getPosition(), selectedProjectile.getAcceleration().length(), accelerationColor);
			currentWorld.scene.add(accelerationArrow);
		}
	}
	
	this.disableAccelerationArrow = function() {
		if(accelerationArrow) {
			document.getElementById("acceleration-value").parentElement.style.border = "none";

			currentWorld.scene.remove(accelerationArrow);
			
			accelerationArrow = null;
		}
	}
	
	this.enableAllArrows = function() {
		this.enableAccelerationArrow();
		this.enableVelocityArrow();
		this.enableInitialParamsArrow();
	}
	
	this.disableAllArrows = function() {
		this.disableAccelerationArrow();
		this.disableVelocityArrow();
		this.disableInitialParamsArrow();
	}
	
	function intToRGB(i){
		var c = (i & 0x00FFFFFF)
			.toString(16)
			.toUpperCase();

		return "00000".substring(0, 6 - c.length) + c;
	}
}

// --------------------------------------------------- //
// ---------------- Other Rendering ------------------ //
// --------------------------------------------------- //

var stats, spheresPanel, physicsPanel;

function loadFPSStats() {
	var script = document.createElement('script');
    script.onload = function() {
        stats = new Stats();
		spheresPanel = stats.addPanel( new Stats.Panel( 'Spheres', '#ff8', '#221' ) );
		physicsPanel = stats.addPanel( new Stats.Panel( 'PhysicsTime', '#fff', '#292e30' ) );
		stats.showPanel( 0 )
		simulator.appendChild( stats.dom );
		stats.dom.style.position = "relative";
    };
    script.src = 'js/stats.min.js';
    document.head.appendChild(script);
}

var tickMod = 1;

function startLoop() {
	//console.log(velocityEquation.toString());
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
			//try {
				handleKeys();
				animateThree();
			//} catch(error) {
			//	alert("An error occured, things may not work correctly.\nIf this is not resolved by clicking 'okay', contact the developer.\n\nError message: " + error.message + "\nMore details in the console");
			//	console.error(error.stack);
			//}
			
			if(stats) {
				stats.end();
				spheresPanel.update(currentWorld.projectiles.length, 100);
			}
		}
	});
};
