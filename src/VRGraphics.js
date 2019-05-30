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
            VRGraphics._player1.render(VRGraphics._projectionMat, VRGraphics._viewMat);

            VRGraphics._stats.renderOrtho();
        }

        VRGraphics._stats.end();
    }

    static loop(t) {
        if (VRGraphics._vrDisplay) {
            VRGraphics._vrDisplay.requestAnimationFrame(VRGraphics.loop);
        } else {
            window.requestAnimationFrame(VRGraphics.loop);
        }

        VRGraphics.render(t);
    }

    static initWebGL(preserveDrawingBuffer) {
        const glAttribs = {
            alpha: false,
            preserveDrawingBuffer: preserveDrawingBuffer
        };
        const useWebGL2 = WGLUUrl.getBool('webgl2', false);
        const contextTypes = useWebGL2 ? ['webgl2'] : ['webgl', 'experimental-webgl'];
        for (let i in contextTypes) {
            VRGraphics._gl = VRGraphics._webGLCanvas.getContext(contextTypes[i], glAttribs);
            if (VRGraphics._gl) {
                break;
            }
        }
        if (!VRGraphics._gl) {
            const webGLType = (useWebGL2 ? 'WebGL 2' : 'WebGL');
            VRSamplesUtil.addError('Your browser does not support ' + webGLType + '.');
            return;
        }
        VRGraphics._gl.clearColor(0.1, 0.2, 0.3, 1.0);
        VRGraphics._gl.enable(VRGraphics._gl.DEPTH_TEST);
        VRGraphics._gl.enable(VRGraphics._gl.CULL_FACE);

        const textureLoader = new WGLUTextureLoader(VRGraphics._gl);
        const texture = textureLoader.loadTexture('assets/textures/cube-sea.png');

        // If the VRDisplay doesn't have stageParameters we won't know
        // how big the users play space. Construct a scene around a
        // default space size like 2 meters by 2 meters as a placeholder.
        VRGraphics._cubeIsland = new VRCubeIsland(VRGraphics._gl, texture, 4, 4);
        VRGraphics._player1 = new OBJModel(VRGraphics._gl, '', 4, 4);

        const enablePerformanceMonitoring = WGLUUrl.getBool('enablePerformanceMonitoring', false);
        VRGraphics._stats = new WGLUStats(VRGraphics._gl, enablePerformanceMonitoring);
        VRGraphics._debugGeom = new WGLUDebugGeometry(VRGraphics._gl);

        // Wait until we have a WebGL context to resize and start rendering.
        window.addEventListener('resize', VRGraphics.onResize, false);
        VRGraphics.onResize();

        window.requestAnimationFrame(VRGraphics.loop);
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
                VRGraphics._player1.resize(VRGraphics._vrDisplay.stageParameters.sizeX, VRGraphics._vrDisplay.stageParameters.sizeZ);
            } else {
                if (VRGraphics._vrDisplay.stageParameters) {
                    VRSamplesUtil.addInfo('VRDisplay reported stageParameters, but stage size was 0. Using default size.', 3000);
                } else {
                    VRSamplesUtil.addInfo('VRDisplay did not report stageParameters', 3000);
                }
            }
        }
    }

    static onVRRequestPresent() {
        VRGraphics._vrDisplay.requestPresent([{source: VRGraphics._webGLCanvas}]).then(() => {}, err => {
            let errMsg = 'requestPresent failed.';
            if (err && err.message) {
                errMsg += '<br/>' + err.message;
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

    static onVRPresentChange() {
        VRGraphics.onResize();

        if (VRGraphics._vrDisplay.isPresenting) {
            if (VRGraphics._vrDisplay.capabilities.hasExternalDisplay) {
                VRSamplesUtil.removeButton(VRGraphics._vrPresentButton);
                VRGraphics._vrPresentButton = VRSamplesUtil.addButton('Exit VR', 'E', 'assets/icons/cardboard64.png', VRGraphics.onVRExitPresent);
            }
        } else {
            if (VRGraphics._vrDisplay.capabilities.hasExternalDisplay) {
                VRSamplesUtil.removeButton(VRGraphics._vrPresentButton);
                VRGraphics._vrPresentButton = VRSamplesUtil.addButton('Enter VR', 'E', 'assets/icons/cardboard64.png', VRGraphics.onVRRequestPresent);
            }
        }

        VRGraphics.updateStage();
    }

    static onClick() {
        // Reset the background color to a random value
        VRGraphics._gl.clearColor(
            Math.random() * 0.5,
            Math.random() * 0.5,
            Math.random() * 0.5,
            1.0);
    }

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
        VRGraphics._player1.render(projection, view);

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

                    if (VRGraphics._vrDisplay.capabilities.canPresent) {
                        VRGraphics._vrPresentButton = VRSamplesUtil.addButton('Enter VR', 'E', 'assets/icons/cardboard64.png', VRGraphics.onVRRequestPresent);
                    }

                    // For the benefit of automated testing. Safe to ignore.
                    if (VRGraphics._vrDisplay.capabilities.canPresent && WGLUUrl.getBool('canvasClickPresents', false)) {
                        VRGraphics._webGLCanvas.addEventListener('click', VRGraphics.onVRRequestPresent, false);
                    }

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

VRGraphics._player1 = null;