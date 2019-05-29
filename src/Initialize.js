/**
 * Created by Trent on 5/28/2019.
 */

'use strict';

window.onload = () => {
    var vrPresentButton = null;

    // ===================================================
    // WebGL scene setup. This code is not WebVR specific.
    // ===================================================


    // ================================
    // WebVR-specific code begins here.
    // ================================
    window.updateStage= () => {
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
                    VRSamplesUtil.addInfo("VRDisplay reported stageParameters, but stage size was 0. Using default size.", 3000);
                } else {
                    VRSamplesUtil.addInfo("VRDisplay did not report stageParameters", 3000);
                }
            }
        }
    };

    window.onVRRequestPresent = () => {
        VRGraphics._vrDisplay.requestPresent([{ source: VRGraphics._webGLCanvas }]).then(function () {
        }, function (err) {
            var errMsg = "requestPresent failed.";
            if (err && err.message) {
                errMsg += "<br/>" + err.message
            }
            VRSamplesUtil.addError(errMsg, 2000);
        });
    };

    window.onVRExitPresent = () => {
        if (!VRGraphics._vrDisplay.isPresenting)
            return;

        VRGraphics._vrDisplay.exitPresent().then(function () {
        }, function () {
            VRSamplesUtil.addError("exitPresent failed.", 2000);
        });
    };

    window.onVRPresentChange = () => {
        VRGraphics.onResize();

        if (VRGraphics._vrDisplay.isPresenting) {
            if (VRGraphics._vrDisplay.capabilities.hasExternalDisplay) {
                VRSamplesUtil.removeButton(vrPresentButton);
                vrPresentButton = VRSamplesUtil.addButton("Exit VR", "E", "assets/icons/cardboard64.png", onVRExitPresent);
            }
        } else {
            if (VRGraphics._vrDisplay.capabilities.hasExternalDisplay) {
                VRSamplesUtil.removeButton(vrPresentButton);
                vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "assets/icons/cardboard64.png", onVRRequestPresent);
            }
        }
        updateStage();
    };

    if (navigator.getVRDisplays) {
        VRGraphics._frameData = new VRFrameData();

        navigator.getVRDisplays().then(function (displays) {
            if (displays.length > 0) {
                VRGraphics._vrDisplay = displays[displays.length - 1];
                VRGraphics._vrDisplay.depthNear = 0.1;
                VRGraphics._vrDisplay.depthFar = 1024.0;

                VRGraphics.initWebGL(VRGraphics._vrDisplay.capabilities.hasExternalDisplay);

                updateStage();

                VRSamplesUtil.addButton("Reset Pose", "R", null, function () { VRGraphics._vrDisplay.resetPose(); });

                if (VRGraphics._vrDisplay.capabilities.canPresent)
                    vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "assets/icons/cardboard64.png", onVRRequestPresent);

                // For the benefit of automated testing. Safe to ignore.
                if (VRGraphics._vrDisplay.capabilities.canPresent && WGLUUrl.getBool('canvasClickPresents', false))
                    VRGraphics._webGLCanvas.addEventListener("click", onVRRequestPresent, false);

                window.addEventListener('vrdisplaypresentchange', onVRPresentChange, false);
                window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
                window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
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

    window.onClick = () => {
        // Reset the background color to a random value
        VRGraphics._gl.clearColor(
            Math.random() * 0.5,
            Math.random() * 0.5,
            Math.random() * 0.5, 1.0);
    };

    // Get a matrix for the pose that takes into account the stageParameters
    // if we have them, and otherwise adjusts the position to ensure we're
    // not stuck in the floor.
    window.getStandingViewMatrix = (out, view) => {
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
    };

    window.renderSceneView = (projection, view, pose) => {
        VRGraphics._cubeIsland.render(projection, view, VRGraphics._stats);

        // For fun, draw a blue cube where the players head would have been if
        // we weren't taking the stageParameters into account. It'll start in
        // the center of the floor.
        var orientation = pose.orientation;
        var position = pose.position;
        if (!orientation) { orientation = [0, 0, 0, 1]; }
        if (!position) { position = [0, 0, 0]; }
        VRGraphics._debugGeom.bind(projection, view);
        VRGraphics._debugGeom.drawCube(orientation, position, 0.2, [0, 0, 1, 1]);
    };

    VRGraphics.initialize();
};