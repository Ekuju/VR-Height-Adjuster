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
                window.getStandingViewMatrix(VRGraphics._viewMat, VRGraphics._frameData.leftViewMatrix);
                window.renderSceneView(VRGraphics._frameData.leftProjectionMatrix, VRGraphics._viewMat, VRGraphics._frameData.pose);

                VRGraphics._gl.viewport(VRGraphics._webGLCanvas.width * 0.5, 0, VRGraphics._webGLCanvas.width * 0.5, VRGraphics._webGLCanvas.height);
                window.getStandingViewMatrix(VRGraphics._viewMat, VRGraphics._frameData.rightViewMatrix);
                window.renderSceneView(VRGraphics._frameData.rightProjectionMatrix, VRGraphics._viewMat, VRGraphics._frameData.pose);

                VRGraphics._vrDisplay.submitFrame();
            } else {
                VRGraphics._gl.viewport(0, 0, VRGraphics._webGLCanvas.width, VRGraphics._webGLCanvas.height);
                mat4.perspective(VRGraphics._projectionMat, Math.PI * 0.4, VRGraphics._webGLCanvas.width / VRGraphics._webGLCanvas.height, 0.1, 1024.0);
                window.getStandingViewMatrix(VRGraphics._viewMat, VRGraphics._frameData.leftViewMatrix);
                window.renderSceneView(VRGraphics._projectionMat, VRGraphics._viewMat, VRGraphics._frameData.pose);
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
        const texture = textureLoader.loadTexture("assets/textures/cube-sea.png");

        // If the VRDisplay doesn't have stageParameters we won't know
        // how big the users play space. Construct a scene around a
        // default space size like 2 meters by 2 meters as a placeholder.
        VRGraphics._cubeIsland = new VRCubeIsland(VRGraphics._gl, texture, 4, 4);

        const enablePerformanceMonitoring = WGLUUrl.getBool('enablePerformanceMonitoring', false);
        VRGraphics._stats = new WGLUStats(VRGraphics._gl, enablePerformanceMonitoring);
        VRGraphics._debugGeom = new WGLUDebugGeometry(VRGraphics._gl);

        // Wait until we have a WebGL context to resize and start rendering.
        window.addEventListener('resize', VRGraphics.onResize, false);
        VRGraphics.onResize();

        window.requestAnimationFrame(VRGraphics.loop);
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
        VRGraphics._webGLCanvas.addEventListener("click", onClick, false);

        if (navigator.getVRDisplays) {
            VRGraphics.frameData = new VRFrameData();

            navigator.getVRDisplays().then(function (displays) {
                if (displays.length > 0) {
                    VRGraphics._vrDisplay = displays[displays.length - 1];
                    VRGraphics._vrDisplay.depthNear = 0.1;
                    VRGraphics._vrDisplay.depthFar = 1024.0;

                    VRGraphics.initWebGL(VRGraphics._vrDisplay.capabilities.hasExternalDisplay);

                    window.updateStage();

                    VRSamplesUtil.addButton("Reset Pose", "R", null, () => {
                        VRGraphics._vrDisplay.resetPose();
                    });

                    if (VRGraphics._vrDisplay.capabilities.canPresent)
                        VRGraphics.vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "assets/icons/cardboard64.png", window.onVRRequestPresent);

                    // For the benefit of automated testing. Safe to ignore.
                    if (VRGraphics._vrDisplay.capabilities.canPresent && WGLUUrl.getBool('canvasClickPresents', false))
                        VRGraphics._webGLCanvas.addEventListener("click", window.onVRRequestPresent, false);

                    window.addEventListener('vrdisplaypresentchange', window.onVRPresentChange, false);
                    window.addEventListener('vrdisplayactivate', window.onVRRequestPresent, false);
                    window.addEventListener('vrdisplaydeactivate', window.onVRExitPresent, false);
                } else {
                    VRGraphics.initWebGL(false);
                    VRSamplesUtil.addInfo("WebVR supported, but no VRDisplays found.", 3000);
                }
            });
        } else if (navigator.getVRDevices) {
            VRGraphics.initWebGL(false);
            VRSamplesUtil.addError("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
        } else {
            VRGraphics.initWebGL(false);
            VRSamplesUtil.addError("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
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