/**
 * Created by Trent on 5/28/2019.
 */

'use strict';

class VRGraphics {
    static render(t) {
        VRGraphics._stats.begin();

        VRGraphics._gl.clear(VRGraphics._gl.COLOR_BUFFER_BIT | VRGraphics._gl.DEPTH_BUFFER_BIT);

        if (VRGraphics._vrDisplay) {
            VRGraphics._vrDisplay.getFrameData(VRGraphics._frameData);

            if (VRGraphics._vrDisplay.isPresenting) {
                VRGraphics._gl.viewport(0, 0, VRGraphics._webGLCanvas.width * 0.5, VRGraphics._webGLCanvas.height);
                VRGraphics.getStandingViewMatrix(VRGraphics._viewMat, VRGraphics._frameData.leftViewMatrix);
                VRGraphics.renderSceneView(VRGraphics._frameData.leftProjectionMatrix, VRGraphics._viewMat, VRGraphics._frameData.pose);

                VRGraphics._gl.viewport(VRGraphics._webGLCanvas.width * 0.5, 0, VRGraphics._webGLCanvas.width * 0.5, VRGraphics._webGLCanvas.height);
                VRGraphics.getStandingViewMatrix(VRGraphics._viewMat, VRGraphics._frameData.rightViewMatrix);
                VRGraphics.renderSceneView(VRGraphics._frameData.rightProjectionMatrix, VRGraphics._viewMat, VRGraphics._frameData.pose);

                VRGraphics._vrDisplay.submitFrame();
            } else {
                VRGraphics._gl.viewport(0, 0, VRGraphics._webGLCanvas.width, VRGraphics._webGLCanvas.height);
                mat4.perspective(VRGraphics._projectionMat, Math.PI * 0.4, VRGraphics._webGLCanvas.width / VRGraphics._webGLCanvas.height, 0.1, 1024.0);
                VRGraphics.getStandingViewMatrix(VRGraphics._viewMat, VRGraphics._frameData.leftViewMatrix);
                VRGraphics.renderSceneView(VRGraphics._projectionMat, VRGraphics._viewMat, VRGraphics._frameData.pose);
                VRGraphics._stats.renderOrtho();
            }
        } else {
            // No VRDisplay found.
            VRGraphics._gl.viewport(0, 0, VRGraphics._webGLCanvas.width, VRGraphics._webGLCanvas.height);
            mat4.perspective(VRGraphics._projectionMat, Math.PI*0.4, VRGraphics._webGLCanvas.width / VRGraphics._webGLCanvas.height, 0.1, 1024.0);
            mat4.identity(VRGraphics._viewMat);
            mat4.translate(VRGraphics._viewMat, VRGraphics._viewMat, [0, -VRGraphics.PLAYER_HEIGHT, 0]);
            VRGraphics._cubeIsland.render(VRGraphics._projectionMat, VRGraphics._viewMat, VRGraphics._stats);

            VRGraphics._stats.renderOrtho();
        }
=======
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
>>>>>>> d1efe3a1fd86a9d669c183dc69505defb7daa6d1

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

<<<<<<< HEAD
    static getStandingViewMatrix(out, view) {
        if (VRGraphics._vrDisplay.stageParameters) {
            // If the headset provides stageParameters use the
            // sittingToStandingTransform to transform the view matrix into a
            // space where the floor in the center of the users play space is the
            // origin.
            mat4.invert(out, VRGraphics._vrDisplay.stageParameters.sittingToStandingTransform);
            mat4.multiply(out, view, out);
        } else {
            // Otherwise you'll want to translate the view to compensate for the
            // scene floor being at Y=0. Ideally this should match the user's
            // height (you may want to make it configurable). For this demo we'll
            // just assume all human beings are 1.65 meters (~5.4ft) tall.
            mat4.identity(out);
            mat4.translate(out, out, [0, VRGraphics.PLAYER_HEIGHT, 0]);
            mat4.invert(out, out);
            mat4.multiply(out, view, out);
        }
    }

    static renderSceneView(projection, view, pose) {
        VRGraphics._cubeIsland.render(projection, view, VRGraphics._stats);

        // For fun, draw a blue cube where the players head would have been if
        // we weren't taking the stageParameters into account. It'll start in
        // the center of the floor.
        let orientation = pose.orientation;
        let position = pose.position;
        if (!orientation) {
            orientation = [0, 0, 0, 1];
        }
        if (!position) {
            position = [0, 0, 0];
        }
        VRGraphics._debugGeom.bind(projection, view);
        VRGraphics._debugGeom.drawCube(orientation, position, 0.2, [0, 0, 1, 1]);
    }

    static updateStage() {
        if (VRGraphics._vrDisplay) {
            if (VRGraphics._vrDisplay.stageParameters &&
                VRGraphics._vrDisplay.stageParameters.sizeX > 0 &&
                VRGraphics._vrDisplay.stageParameters.sizeZ > 0) {
                // If we have stageParameters with a valid size use that to resize
                // our scene to match the users available space more closely. The
                // check for size > 0 is necessary because some devices, like the
                // Oculus Rift, can give you a standing space coordinate but don't
                // have a configured play area. These devices will return a stage
                // size of 0.
                VRGraphics._cubeIsland.resize(VRGraphics._vrDisplay.stageParameters.sizeX, VRGraphics._vrDisplay.stageParameters.sizeZ);
            } else {
                if (VRGraphics._vrDisplay.stageParameters) {
                    VRSamplesUtil.addInfo('VRDisplay reported stageParameters, but stage size was 0. Using default size.', 3000);
                } else {
                    VRSamplesUtil.addInfo('VRDisplay did not report stageParameters', 3000);
                }
            }
        }
    }

    static onVRPresentChange() {
        VRGraphics.onResize();

        if (VRGraphics._vrDisplay.isPresenting) {
            if (VRGraphics._vrDisplay.capabilities.hasExternalDisplay) {
                VRSamplesUtil.removeButton(VRGraphics._vrPresentButton);
                VRGraphics._vrPresentButton = VRSamplesUtil.addButton("Exit VR", "E", "assets/icons/cardboard64.png", VRGraphics.onVRExitPresent);
            }
        } else {
            if (VRGraphics._vrDisplay.capabilities.hasExternalDisplay) {
                VRSamplesUtil.removeButton(VRGraphics._vrPresentButton);
                VRGraphics._vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "assets/icons/cardboard64.png", VRGraphics.onVRRequestPresent);
            }
        }

        VRGraphics.updateStage();
    }

    static onVRRequestPresent() {
        VRGraphics._vrDisplay.requestPresent([{ source: VRGraphics._webGLCanvas }]).then(() => {}, (err) => {
            let errMsg = 'requestPresent failed.';
            if (err && err.message) {
                errMsg += '<br/>' + err.message
            }
            VRSamplesUtil.addError(errMsg, 2000);
        });
    }

    static onVRExitPresent() {
        if (!VRGraphics._vrDisplay.isPresenting) {
            return;
        }

        VRGraphics._vrDisplay.exitPresent().then(() => {}, () => {
            VRSamplesUtil.addError('exitPresent failed.', 2000);
        });
    }

    static onResize() {
        if (VRGraphics._vrDisplay && VRGraphics._vrDisplay.isPresenting) {
            const leftEye = VRGraphics._vrDisplay.getEyeParameters('left');
            const rightEye = VRGraphics._vrDisplay.getEyeParameters('right');

            VRGraphics._webGLCanvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
            VRGraphics._webGLCanvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
        } else {
            VRGraphics._webGLCanvas.width = VRGraphics._webGLCanvas.offsetWidth * window.devicePixelRatio;
            VRGraphics._webGLCanvas.height = VRGraphics._webGLCanvas.offsetHeight * window.devicePixelRatio;
        }
    }

    static getGL() {
        return VRGraphics._gl;
    }

    static onClick() {
        // Reset the background color to a random value
        VRGraphics.getGL().clearColor(
            Math.random() * 0.5,
            Math.random() * 0.5,
            Math.random() * 0.5, 1.0);
    }

    static initialize() {
        VRGraphics._webGLCanvas = document.getElementById('webgl-canvas');
        VRGraphics._webGLCanvas.addEventListener('click', VRGraphics.onClick, false);

        if (navigator.getVRDisplays) {
            VRGraphics._frameData = new VRFrameData();

            navigator.getVRDisplays().then(displays => {
                if (displays.length > 0) {
                    VRGraphics._vrDisplay = displays[displays.length - 1];
                    VRGraphics._vrDisplay.depthNear = 0.1;
                    VRGraphics._vrDisplay.depthFar = 1024.0;

                    VRGraphics.initWebGL(VRGraphics._vrDisplay.capabilities.hasExternalDisplay);

                    VRGraphics.updateStage();

                    VRSamplesUtil.addButton('Reset Pose', 'R', null, () => {
                        VRGraphics._vrDisplay.resetPose();
                    });

                    if (VRGraphics._vrDisplay.capabilities.canPresent)
                        VRGraphics._vrPresentButton = VRSamplesUtil.addButton('Enter VR', 'E', 'assets/icons/cardboard64.png', VRGraphics.onVRRequestPresent);

                    // For the benefit of automated testing. Safe to ignore.
                    if (VRGraphics._vrDisplay.capabilities.canPresent && WGLUUrl.getBool('canvasClickPresents', false))
                        VRGraphics._webGLCanvas.addEventListener('click', VRGraphics.onVRRequestPresent, false);

                    window.addEventListener('vrdisplaypresentchange', VRGraphics.onVRPresentChange, false);
                    window.addEventListener('vrdisplayactivate', VRGraphics.onVRRequestPresent, false);
                    window.addEventListener('vrdisplaydeactivate', VRGraphics.onVRExitPresent, false);
                } else {
                    VRGraphics.initWebGL(false);
                    VRSamplesUtil.addInfo('WebVR supported, but no VRDisplays found.', 3000);
                }
            });
        } else if (navigator.getVRDevices) {
            VRGraphics.initWebGL(false);
            VRSamplesUtil.addError('Your browser supports WebVR but not the latest version. See <a href=\'http://webvr.info\'>webvr.info</a> for more info.');
        } else {
            VRGraphics.initWebGL(false);
            VRSamplesUtil.addError('Your browser does not support WebVR. See <a href=\'http://webvr.info\'>webvr.info</a> for assistance.');
        }
    }
}

VRGraphics.PLAYER_HEIGHT = 1.8;

VRGraphics._vrDisplay = null;
VRGraphics._frameData = null;
VRGraphics._webGLCanvas = null;
VRGraphics._gl = null;
VRGraphics._stats = null;
VRGraphics._cubeIsland = null;
VRGraphics._debugGeom = null;
VRGraphics._viewMat = mat4.create();
VRGraphics._projectionMat = mat4.create();
VRGraphics._vrPresentButton = null;
=======
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
>>>>>>> d1efe3a1fd86a9d669c183dc69505defb7daa6d1
