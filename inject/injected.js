import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.114.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.114.0/examples/jsm/loaders/GLTFLoader.js';

var currentSpeed = 0.05;
var showHideToggle = true;
var zoomiesLabelElement = document.getElementById("zoomiesLabel");
var roboLabelElement = document.getElementById("roboLabel");
var chungusModeToggle = true;
var defaultCatScale = worldConfig.myCat.catModel.children[0].scale;

var idleRotateInterval;
var translateInterval;
var roboCatInterval;
var ratPos = { x: 0, y: 0, z: 0 };

var mixers = [];
var clock = new THREE.Clock();

// Remove top background for increased visibility
var topbar = document.getElementById("topbar");
topbar.style = "background: rgb(0 0 0 / 0%);"

setBackground();

document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
        flyUp();
    }
    if (event.code === "ShiftLeft") {
        flyDown();
    }
    if (event.key === "q") {
        superSpeedUp();
    }
    if (event.key === "e") {
        superSpeedDown();
    }
});

window.enableRoboCat = enableRoboCat;
function enableRoboCat() {
    roboLabelElement.innerHTML = 'ROBOCAT (X):';
    // start rat pos check interval
    roboCatInterval = setInterval(function () {
        var newPos = { ...rat.getPosition() };

        if (ratPos.x !== newPos.x && ratPos.z !== newPos.z) {
            //console.log('new position detected: (' + ratPos.x + ',' + ratPos.y + ',' + ratPos.z + ') // (' + newPos.x + ',' + newPos.y + ',' + newPos.z + ')');
            if (translateInterval != undefined) {
                clearInterval(translateInterval);
            }
            ratPos = newPos;
            moveTowardsCoin();
        }
    }, 8000);
}

window.disableRoboCat = disableRoboCat;
function disableRoboCat() {
    roboLabelElement.innerHTML = 'ROBOCAT (O):';
    clearInterval(roboCatInterval);
    clearInterval(translateInterval);
    clearInterval(idleRotateInterval);
}

window.RotateTowards = RotateTowards;
function RotateTowards(cat1, cat2) {
    // Get world positions
    const pos1 = new THREE.Vector3();
    cat1.getWorldPosition(pos1);

    const pos2 = new THREE.Vector3();
    cat2.getWorldPosition(pos2);

    // Calculate the direction vector
    const direction = new THREE.Vector3().subVectors(pos2, pos1).normalize();

    // Create a look-at quaternion
    const up = new THREE.Vector3(0, 0, 1);  // Z-up axis
    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);

    // Apply the quaternion to the cat
    cat1.object.quaternion.copy(targetQuaternion);
}

window.moveTowardsCoin = moveTowardsCoin;
function moveTowardsCoin() {
    //worldConfig.myCat.setPosition(
    //    worldConfig.rat.getPosition().x,
    //    worldConfig.rat.getPosition().y,
    //    worldConfig.rat.getPosition().z
    //);
    if (idleRotateInterval != undefined) {
        clearInterval(idleRotateInterval);
    }
    RotateTowards(myCat, rat);
    translateInterval = setInterval(function () {

        if (getDistance(myCat.getWorldPosition(), rat.getWorldPosition()) > 1) {
            myCat.translateZ(worldConfig.maxCatVelocity + 0.05);
        } else {
            clearInterval(translateInterval);
            idleRotate();
        }
    }, 1000 / 100);
}

window.idleRotate = idleRotate;
function idleRotate() {
    idleRotateInterval = setInterval(function () {
        worldConfig.myCat.rotateY(worldConfig.catRotationSpeed);
    }, 1000 / 100);
}

window.becomeRat = becomeRat;
function becomeRat() {
    worldConfig.myCat = worldConfig.rat;
}

window.toggleCatVis = toggleCatVis;
function toggleCatVis() {
    showHideToggle = !showHideToggle;
    worldConfig.otherCats.forEach((x) => (x.catModel.visible = showHideToggle));

    setFog();
}

window.superSpeedDown = superSpeedDown;
function superSpeedDown() {
    currentSpeed = currentSpeed - 0.05;
    zoomiesLabelElement.innerHTML = "Zoomies (" + currentSpeed + "):";
    worldConfig.maxCatVelocity = worldConfig.maxCatVelocity - 0.05;
    worldConfig.myCat.rockSpeed = worldConfig.myCat.rockSpeed - 0.25;
    //worldConfig.catRotationSpeed = worldConfig.catRotationSpeed - 0.05;
}

window.superSpeedUp = superSpeedUp;
function superSpeedUp() {
    currentSpeed = currentSpeed + 0.05;
    zoomiesLabelElement.innerHTML = "Zoomies (" + currentSpeed + "):";
    worldConfig.maxCatVelocity = worldConfig.maxCatVelocity + 0.05;
    worldConfig.myCat.rockSpeed = worldConfig.myCat.rockSpeed + 0.25;
    //worldConfig.catRotationSpeed = worldConfig.catRotationSpeed + 0.05;
}

window.flyUp = flyUp;
function flyUp() {
    worldConfig.myCat.setPosition(
        worldConfig.myCat.getPosition().x,
        worldConfig.myCat.getPosition().y + 1,
        worldConfig.myCat.getPosition().z
    );
}

window.flyDown = flyDown;
function flyDown() {
    worldConfig.myCat.setPosition(
        worldConfig.myCat.getPosition().x,
        worldConfig.myCat.getPosition().y - 1,
        worldConfig.myCat.getPosition().z
    );
}

window.chungusMode = chungusMode;
function chungusMode() {
    if (chungusModeToggle) {
        setCatModelScale(worldConfig.myCat.catModel.children[0], 1, 1, 1);

        worldConfig.otherCats.forEach((x) =>
            setCatModelScale(x.catModel.children[0], 1, 1, 1)
        );

        setCatModelScale(worldConfig.rat.catModel.children[0], 100, 100, 100);
        worldConfig.cameraDistance = 20; // Setting this too high causes the camera to bug out.
    } else {
        setCatModelScale(worldConfig.myCat.catModel.children[0], 0.1, 0.1, 0.1);

        worldConfig.otherCats.forEach((x) =>
            setCatModelScale(x.catModel.children[0], 0.1, 0.1, 0.1)
        );

        setCatModelScale(worldConfig.rat.catModel.children[0], 1, 1, 1);
    }
    chungusModeToggle = !chungusModeToggle;
}

window.setCatModelScale = setCatModelScale;
function setCatModelScale(catModelChild, x, y, z) {
    catModelChild.scale.x = x;
    catModelChild.scale.y = y;
    catModelChild.scale.z = z;
}

window.newSpawnsRat = newSpawnsRat;
function newSpawnsRat() {
    worldConfig.catObject = worldConfig.ratObject;
}

window.getDistance = getDistance;
function getDistance(posA, posB) {
    return Math.sqrt(
        (posB.x - posA.x) ** 2 +
        (posB.y - posA.y) ** 2 +
        (posB.z - posA.z) ** 2
    );
}

function setFog() {
    myCat.object.parent.fog = new THREE.Fog(0x000000, 3, 10);
}

function setBackground() {
    const customBGElement = document.getElementById('custombg');
    const bgPath = customBGElement.dataset.path;

    //Wallpaper background
    //const textureLoader = new THREE.TextureLoader();
    //const texture = textureLoader.load(
    //    bgPath,
    //    () => {
    //        texture.mapping = THREE.EquirectangularReflectionMapping;
    //        texture.colorSpace = THREE.SRGBColorSpace;
    //        myCat.object.parent.background = texture;
    //    });

    //Skybox
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        bgPath,
        bgPath,
        bgPath,
        bgPath,
        bgPath,
        bgPath,
    ]);
    myCat.object.parent.background = texture;
}

// Events

function connectAnother() {
    document.getElementById("clientCount").innerHTML = "connecting";
    document.getElementById("clientCount").classList = "connecting";
    websocket = new WebSocket("wss://worlds.twotwelve.uk/ws");
    websocket.binaryType = "arraybuffer";
    websocket.addEventListener("message", websocketEventListener2);
}

function loadRat(loader, position) {
    const oiiaElement = document.getElementById('oiia');
    const oiiaPath = oiiaElement.dataset.path;
    loader.load(
        // "dingus the cat" (https://skfb.ly/oAtMJ) by bean(alwayshasbean) is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
        // "Oiiaioooooiai Cat" (https://skfb.ly/prRXD) by Zhuier is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
        oiiaPath,
        function (gltf) {
            const model = gltf.scene;
            worldConfig.myCat.object.add(model)
            model.position.x = position.x;
            model.position.y = position.y;
            model.position.z = position.z;

            // Animation
            var mixer = new THREE.AnimationMixer(gltf.scene)
            var action = mixer.clipAction(gltf.animations[0]);
            action.play();
            mixers.push(mixer);
        }
    );

}

window.newCat = newCat;
function newCat() {
    const loader = new THREE.ObjectLoader();
    loader.load(
        "assets/models/arrow.json",
        function (object) {
            object.visible = true;
            object.children[0].material.color = { r: 0.8, g: 0.2, b: 0.8 };
            worldConfig.myCat.object.add(object);
            setInterval(() => {
                object.visible = true;
                object.rotateY(1);
            }, 1000 / 30)
        }
    );

    const loader2 = new GLTFLoader();
    loadRat(loader2, { x: 1, y: 1, z: -1 });
    loadRat(loader2, { x: 1, y: 1, z: 1 });
    loadRat(loader2, { x: -1, y: 1, z: 1 });
    loadRat(loader2, { x: -1, y: 1, z: -1 });

    animate();

    // Imprison the rat in a magic cylinder
    //loader.load(
    //    "assets/models/ratprison.json",
    //    function (object) {
    //        worldConfig.myCat.object.add(object)
    //        object.position.z = 2;
    //    }
    //)

    //worldConfig.myCat = new Cat(
    //    "",
    //    new THREE.Vector3(
    //        Math.random() * 25 - 12.5, 0,
    //        Math.random() * 25 - 12.5
    //    ),
    //    new THREE.Vector4(),
    //    worldConfig.catObject
    //);
    //worldConfig.myCat.addToScene(myCat.object.parent);
}

class Cat {
    constructor(name, position, rotation, catObject) {
        this.object = new THREE.Group()
        // Create a local copy of the cat object & set its position
        this.catModel = catObject.clone(true)
        this.object.position.add(position)

        // Set the cat model as a child of the cat object
        // This is so we can independently rotate it for wobbling
        this.object.add(this.catModel)

        // TODO: set cat rotation

        // Create the label sprite for this cat
        this.labelSprite = new SpriteText(name, 0.5)

        // Give it a background for visibility
        this.labelSprite.backgroundColor = 'rgba(0,0,0,0.2)'
        this.labelSprite.translateY(1.5)
        this.labelSprite.fontFace = window.isWindows ? "'Twemoji Country Flags', 'Pixelated MS Sans Serif'" : "'Pixelated MS Sans Serif'"

        this.object.add(this.labelSprite)

        // Keep track of the latest event processed for this cat
        this.latestEvent = 0
        this.rockSpeed = 0.75;
        this.rockThreshold = THREE.MathUtils.degToRad(10);
        this.rockSpeedMultiplier = 1;

        // The last time this cat moved, set to infinity to wobble immediately
        this.lastMoved = Math.inf

        // The last time a message was received about this cat
        this.lastMessage = Date.now()
    }

    addToScene(scene) {
        scene.add(this.object)
    }

    removeFromScene(scene) {
        scene.remove(this.object)
    }

    translateZ(distance) {
        this.object.translateZ(distance)
    }

    rotateY(degrees) {
        this.object.rotateY(degrees)
    }

    getWorldPosition(destination) {
        return this.object.getWorldPosition(destination)
    }

    getQuaternion() {
        return this.object.quaternion
    }

    getPosition() {
        return this.object.position
    }

    getChunkID(chunkSize) {
        return [Math.round(this.object.position.x / chunkSize),
        Math.round(this.object.position.y / chunkSize),
        Math.round(this.object.position.z / chunkSize)]
    }

    updateLastMoved(time) {
        this.lastMoved = time
    }

    animate(currentTime, delta, log) {
        let timeSinceLastMove = currentTime - this.lastMoved
        if (Math.abs(timeSinceLastMove) <= 0.5) {
            this.catModel.rotation.z = 0;
            return
        }

        let currentZ = this.catModel.rotation.z;
        if (currentZ > this.rockThreshold) {
            this.rockSpeedMultiplier = -1;
        } else if (currentZ < -this.rockThreshold) {
            this.rockSpeedMultiplier = 1;
        }

        this.catModel.rotateZ(
            THREE.MathUtils.clamp(this.rockSpeed * delta * this.rockSpeedMultiplier, -this.rockThreshold, this.rockThreshold)
        );
    }

    setPosition(x, y, z, t) {
        if (t < this.latestEvent) return
        this.latestEvent = t
        this.object.position.set(x, y, z)
    }

    setQuaternion(x, y, z, w, t) {
        if (t < this.latestEvent) return
        this.latestEvent = t
        this.object.quaternion.set(x, y, z, w)
    }

    setName(newName) {
        this.labelSprite.text = newName
    }

    setUUID(uuid) {
        this.uuid = uuid
    }

    getRelativePositionOfCamera(camera) {
        var catWorldPosition = new THREE.Vector3()
        this.getWorldPosition(catWorldPosition)
        var currentRelativeCameraPosition = new THREE.Vector3()
        camera.getWorldPosition(currentRelativeCameraPosition)
        currentRelativeCameraPosition.sub(catWorldPosition)
        return currentRelativeCameraPosition
    }
}

const websocketEventListener2 = (event) => {
    console.log(event);

    // Wait until we have our own cat before creating anyone else's
    if (worldConfig.myCat === undefined) {
        return;
    }

    // If the event payload is an ArrayBuffer then use MessagePack, else the
    // server is still using json so fallback
    var eventPayload;
    if (event.data instanceof ArrayBuffer) {
        eventPayload = MessagePack.decode(event.data);
    } else {
        eventPayload = JSON.parse(event.data);
    }
    if (!eventPayload) {
        console.log("Malformed event data:", event.data);
        return;
    }
    console.log(eventPayload.type);
    switch (eventPayload.type) {
        case "target":
            console.log('new rat?');
        //// Update the targetToken we'll give to the server if we get close enough
        //worldConfig.targetToken = eventPayload.token;

        //// Make the rat visible
        //worldConfig.rat.object.visible = true;

        //// There will be a new rat in 30s
        //worldConfig.timeUntilNextTarget = 30;

        //// Update the rat's position
        //worldConfig.rat.setPosition(
        //    eventPayload.worldPosition[0],
        //    eventPayload.worldPosition[1],
        //    eventPayload.worldPosition[2]
        //);

        //// Reset the rat's name
        //worldConfig.rat.setName("Rat (30s)");
    }
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta(); // Get delta time only once per frame
    // Update all animation mixers
    mixers.forEach(mixer => {
        mixer.update(deltaTime);
    });
}