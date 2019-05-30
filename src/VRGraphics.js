/**
 * Created by Trent on 5/28/2019.
 */

'use strict';

class VRGraphics {
    static render() {
        VRGraphics.handleController(VRGraphics._controller1);
        VRGraphics.handleController(VRGraphics._controller2);

        const delta = VRGraphics._clock.getDelta() * 0.8;
        const range = 3 - VRGraphics.RADIUS;
        // for (let i = 0; i < VRGraphics._room.children.length; i++) {
        //     const object = VRGraphics._room.children[i];
        //     object.position.x += object.userData.velocity.x * delta;
        //     object.position.y += object.userData.velocity.y * delta;
        //     object.position.z += object.userData.velocity.z * delta;
        //
        //     if (object.position.x < -range || object.position.x > range) {
        //         object.position.x = THREE.Math.clamp(object.position.x, -range, range);
        //         object.userData.velocity.x = -object.userData.velocity.x;
        //     }
        //
        //     if (object.position.y < VRGraphics.RADIUS || object.position.y > 6) {
        //         object.position.y = Math.max(object.position.y, VRGraphics.RADIUS);
        //         object.userData.velocity.x *= 0.98;
        //         object.userData.velocity.y = -object.userData.velocity.y * 0.8;
        //         object.userData.velocity.z *= 0.98;
        //     }
        //
        //     if (object.position.z < -range || object.position.z > range) {
        //         object.position.z = THREE.Math.clamp(object.position.z, -range, range);
        //         object.userData.velocity.z = -object.userData.velocity.z;
        //     }
        //
        //     for (let j = i + 1; j < VRGraphics._room.children.length; j++) {
        //         const object2 = VRGraphics._room.children[j];
        //         VRGraphics._normal.copy(object.position).sub(object2.position);
        //         const distance = VRGraphics._normal.length();
        //         if (distance < 2 * VRGraphics.RADIUS) {
        //             VRGraphics._normal.multiplyScalar(0.5 * distance - VRGraphics.RADIUS);
        //             object.position.sub(VRGraphics._normal);
        //             object2.position.add(VRGraphics._normal);
        //             VRGraphics._normal.normalize();
        //             VRGraphics._relativeVelocity.copy(object.userData.velocity).sub(object2.userData.velocity);
        //             VRGraphics._normal = VRGraphics._normal.multiplyScalar(VRGraphics._relativeVelocity.dot(VRGraphics._normal));
        //             object.userData.velocity.sub(VRGraphics._normal);
        //             object2.userData.velocity.add(VRGraphics._normal);
        //         }
        //     }
        //     object.userData.velocity.y -= 9.8 * delta;
        // }

        VRGraphics._renderer.render(VRGraphics._scene, VRGraphics._camera);
    }

    static loop() {
        VRGraphics._renderer.setAnimationLoop(VRGraphics.render);
    }

    static loadScene(path, offset, scale, callback) {
        VRGraphics._loader.load(path, gltf => {
            console.log('Loaded GLTF model. ' + path);
            gltf.scene.position.x = -offset[0];
            gltf.scene.position.y = -offset[1];
            gltf.scene.position.z = -offset[2];
            gltf.scene.scale.x = scale[0];
            gltf.scene.scale.y = scale[1];
            gltf.scene.scale.z = scale[2];
            VRGraphics._scene.add(gltf.scene);

            if (callback) {
                callback();
            }
        }, xhr => {
            console.log('Loading GLTF model. ' + path + '. ' + (xhr.loaded / xhr.total) + '%');
        }, error => {
            console.error('Could not load GLTF model. ' + path + '. ', error);
        });
    }

    static handleController(controller) {
        let test = new THREE.Vector3(0, 0, 1);
        test.applyQuaternion(controller.quaternion);
        if (controller.userData.isSelecting) {
            VRGraphics._scene.position.x += test.x * 10;
            VRGraphics._scene.position.y += test.y * 10;
            VRGraphics._scene.position.z += test.z * 10;
        }
        // if (controller.userData.isSelecting) {
        //     const object = VRGraphics._room.children[VRGraphics._count++];
        //     object.position.copy(controller.position);
        //     object.userData.velocity.x = (Math.random() - 0.5) * 3;
        //     object.userData.velocity.y = (Math.random() - 0.5) * 3;
        //     object.userData.velocity.z = (Math.random() - 9);
        //     object.userData.velocity.applyQuaternion(controller.quaternion);
        //     if (VRGraphics._count === VRGraphics._room.children.length) {
        //         VRGraphics._count = 0;
        //     }
        // }
    }

    static onResize() {
        VRGraphics._camera.aspect = window.innerWidth / window.innerHeight;
        VRGraphics._camera.updateProjectionMatrix();
        VRGraphics._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    static initialize() {
        VRGraphics._scene = new THREE.Scene();
        VRGraphics._scene.background = new THREE.Color(0x505050);
        VRGraphics._camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 10, 100000);

        // VRGraphics._room = new THREE.LineSegments(
        //     new THREE.BoxLineGeometry(6, 6, 6, 10, 10, 10),
        //     new THREE.LineBasicMaterial({color: 0x808080})
        // );
        // VRGraphics._room.geometry.translate(0, 3, 0);
        // VRGraphics._scene.add(VRGraphics._room);

        const light = new THREE.HemisphereLight(0xffffff, 0x444444);
        light.position.set(1, 1, 1);
        VRGraphics._scene.add(light);

        const sphereGemoetry = new THREE.IcosahedronBufferGeometry(VRGraphics.RADIUS, 2);
        for (let i = 0; i < 200; i++) {
            const object = new THREE.Mesh(sphereGemoetry, new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff}));
            object.position.x = Math.random() * 4 - 2;
            object.position.y = Math.random() * 4;
            object.position.z = Math.random() * 4 - 2;
            object.userData.velocity = new THREE.Vector3();
            object.userData.velocity.x = Math.random() * 0.01 - 0.005;
            object.userData.velocity.y = Math.random() * 0.01 - 0.005;
            object.userData.velocity.z = Math.random() * 0.01 - 0.005;
            // VRGraphics._room.add(object);
        }

        VRGraphics._renderer = new THREE.WebGLRenderer({antialias: true});
        VRGraphics._renderer.setPixelRatio(window.devicePixelRatio);
        VRGraphics._renderer.setSize(window.innerWidth, window.innerHeight);
        VRGraphics._renderer.vr.enabled = true;
        document.body.appendChild(VRGraphics._renderer.domElement);
        document.body.appendChild(WEBVR.createButton(VRGraphics._renderer));

        function onSelectStart() {
            this.userData.isSelecting = true;
        }

        function onSelectEnd() {
            this.userData.isSelecting = false;
        }

        VRGraphics._controller1 = VRGraphics._renderer.vr.getController(0);
        VRGraphics._controller1.addEventListener('selectstart', onSelectStart);
        VRGraphics._controller1.addEventListener('selectend', onSelectEnd);
        VRGraphics._scene.add(VRGraphics._controller1);
        VRGraphics._controller2 = VRGraphics._renderer.vr.getController(1);
        VRGraphics._controller2.addEventListener('selectstart', onSelectStart);
        VRGraphics._controller2.addEventListener('selectend', onSelectEnd);
        VRGraphics._scene.add(VRGraphics._controller2);

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
        geometry.addAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));
        var material = new THREE.LineBasicMaterial({vertexColors: true, blending: THREE.AdditiveBlending});
        VRGraphics._controller1.add(new THREE.Line(geometry, material));
        VRGraphics._controller2.add(new THREE.Line(geometry, material));
        window.addEventListener('resize', VRGraphics.onResize, false);

        VRGraphics.loadScene('https://threejsfundamentals.org/threejs/resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf', [0, 0, 0], [100, 100, 100], VRGraphics.loop);

        // VRGraphics.loop();
    }
}

VRGraphics.RADIUS = 0.08;

VRGraphics._scene = null;
VRGraphics._camera = null;
VRGraphics._room = null;
VRGraphics._renderer = null;
VRGraphics._controller1 = null;
VRGraphics._controller2 = null;
VRGraphics._controls = null;

VRGraphics._count = 0;
VRGraphics._clock = new THREE.Clock();
VRGraphics._normal = new THREE.Vector3();
VRGraphics._relativeVelocity = new THREE.Vector3();
VRGraphics._loader = new THREE.GLTFLoader();