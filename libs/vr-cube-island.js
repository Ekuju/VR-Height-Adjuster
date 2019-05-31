// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

class VRCubeIsland {
    constructor(gl, texture, width, depth) {
        this._gl = gl;
        this._statsMat = mat4.create();
        this._texture = texture;
        this._width = null;
        this._depth = null;
        this._indexCount = null;

        this._program = new WGLUProgram(gl);
        this._program.attachShaderSource(VRCubeIsland.VERTEX_SHADER, gl.VERTEX_SHADER);
        this._program.attachShaderSource(VRCubeIsland.FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        this._program.bindAttribLocation({
            position: 0,
            texCoord: 1,
            normal: 2,
        });
        this._program.link();

        this._vertBuffer = gl.createBuffer();
        this._indexBuffer = gl.createBuffer();

        this.resize(width, depth);
    }

    render(projectionMat, modelViewMat, stats) {
        this._program.use();

        this._gl.uniformMatrix4fv(this._program.uniform.projectionMat, false, projectionMat);
        this._gl.uniformMatrix4fv(this._program.uniform.modelViewMat, false, modelViewMat);

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        this._gl.enableVertexAttribArray(this._program.attrib.position);
        this._gl.enableVertexAttribArray(this._program.attrib.texCoord);
        this._gl.enableVertexAttribArray(this._program.attrib.normal);

        this._gl.vertexAttribPointer(this._program.attrib.position, 3, this._gl.FLOAT, false, 32, 0);
        this._gl.vertexAttribPointer(this._program.attrib.texCoord, 2, this._gl.FLOAT, false, 32, 12);
        this._gl.vertexAttribPointer(this._program.attrib.normal, 3, this._gl.FLOAT, false, 32, 20);


        this._gl.activeTexture(this._gl.TEXTURE0);
        this._gl.uniform1i(this._program.uniform.diffuse, 0);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);

        this._gl.drawElements(this._gl.TRIANGLES, this._indexCount, this._gl.UNSIGNED_SHORT, 0);

        if (stats) {
            // To ensure that the FPS counter is visible in VR mode we have to
            // render it as part of the scene.
            mat4.fromTranslation(this._statsMat, [0, 1.5, -this._depth * 0.5]);
            mat4.scale(this._statsMat, this._statsMat, [0.5, 0.5, 0.5]);
            mat4.rotateX(this._statsMat, this._statsMat, -0.75);
            mat4.multiply(this._statsMat, modelViewMat, this._statsMat);
            stats.render(projectionMat, this._statsMat);
        }
    }

    resize(width, depth) {
        this._width = width;
        this._depth = depth;

        const cubeVerts = [];
        const cubeIndices = [];

        // Build a single box.
        const appendBox = (left, bottom, back, right, top, front) => {
            // Bottom
            let idx = cubeVerts.length / 8.0;
            cubeIndices.push(idx, idx + 1, idx + 2);
            cubeIndices.push(idx, idx + 2, idx + 3);

            cubeVerts.push(left, bottom, back, 0.0, 1.0, 0.0, -1.0, 0.0);
            cubeVerts.push(right, bottom, back, 1.0, 1.0, 0.0, -1.0, 0.0);
            cubeVerts.push(right, bottom, front, 1.0, 0.0, 0.0, -1.0, 0.0);
            cubeVerts.push(left, bottom, front, 0.0, 0.0, 0.0, -1.0, 0.0);

            // Top
            idx = cubeVerts.length / 8.0;
            cubeIndices.push(idx, idx + 2, idx + 1);
            cubeIndices.push(idx, idx + 3, idx + 2);

            cubeVerts.push(left, top, back, 0.0, 0.0, 0.0, 1.0, 0.0);
            cubeVerts.push(right, top, back, 1.0, 0.0, 0.0, 1.0, 0.0);
            cubeVerts.push(right, top, front, 1.0, 1.0, 0.0, 1.0, 0.0);
            cubeVerts.push(left, top, front, 0.0, 1.0, 0.0, 1.0, 0.0);

            // Left
            idx = cubeVerts.length / 8.0;
            cubeIndices.push(idx, idx + 2, idx + 1);
            cubeIndices.push(idx, idx + 3, idx + 2);

            cubeVerts.push(left, bottom, back, 0.0, 1.0, -1.0, 0.0, 0.0);
            cubeVerts.push(left, top, back, 0.0, 0.0, -1.0, 0.0, 0.0);
            cubeVerts.push(left, top, front, 1.0, 0.0, -1.0, 0.0, 0.0);
            cubeVerts.push(left, bottom, front, 1.0, 1.0, -1.0, 0.0, 0.0);

            // Right
            idx = cubeVerts.length / 8.0;
            cubeIndices.push(idx, idx + 1, idx + 2);
            cubeIndices.push(idx, idx + 2, idx + 3);

            cubeVerts.push(right, bottom, back, 1.0, 1.0, 1.0, 0.0, 0.0);
            cubeVerts.push(right, top, back, 1.0, 0.0, 1.0, 0.0, 0.0);
            cubeVerts.push(right, top, front, 0.0, 0.0, 1.0, 0.0, 0.0);
            cubeVerts.push(right, bottom, front, 0.0, 1.0, 1.0, 0.0, 0.0);

            // Back
            idx = cubeVerts.length / 8.0;
            cubeIndices.push(idx, idx + 2, idx + 1);
            cubeIndices.push(idx, idx + 3, idx + 2);

            cubeVerts.push(left, bottom, back, 1.0, 1.0, 0.0, 0.0, -1.0);
            cubeVerts.push(right, bottom, back, 0.0, 1.0, 0.0, 0.0, -1.0);
            cubeVerts.push(right, top, back, 0.0, 0.0, 0.0, 0.0, -1.0);
            cubeVerts.push(left, top, back, 1.0, 0.0, 0.0, 0.0, -1.0);

            // Front
            idx = cubeVerts.length / 8.0;
            cubeIndices.push(idx, idx + 1, idx + 2);
            cubeIndices.push(idx, idx + 2, idx + 3);

            cubeVerts.push(left, bottom, front, 0.0, 1.0, 0.0, 0.0, 1.0);
            cubeVerts.push(right, bottom, front, 1.0, 1.0, 0.0, 0.0, 1.0);
            cubeVerts.push(right, top, front, 1.0, 0.0, 0.0, 0.0, 1.0);
            cubeVerts.push(left, top, front, 0.0, 0.0, 0.0, 0.0, 1.0);
        };

        // Appends a cube with the given centerpoint and size.
        const appendCube = (x, y, z, size) => {
            const halfSize = size * 0.5;
            appendBox(
                x - halfSize,
                y - halfSize,
                z - halfSize,
                x + halfSize,
                y + halfSize,
                z + halfSize);
        };

        // Main "island", covers where the user can safely stand. Top of the cube
        // (the ground the user stands on) should be at Y=0 to align with users
        // floor. X=0 and Z=0 should be at the center of the users play space.
        appendBox(-width * 0.5, -width, -depth * 0.5, width * 0.5, 0, depth * 0.5);

        // A sprinkling of other cubes to make things more visually interesting.
        appendCube(1.1, 0.3, (-depth * 0.5) - 0.8, 0.5);
        appendCube(-0.5, 1.0, (-depth * 0.5) - 0.9, 0.75);
        appendCube(0.6, 1.5, (-depth * 0.5) - 0.6, 0.4);
        appendCube(-1.0, 0.5, (-depth * 0.5) - 0.5, 0.2);

        appendCube((-width * 0.5) - 0.8, 0.3, -1.1, 0.5);
        appendCube((-width * 0.5) - 0.9, 1.0, 0.5, 0.75);
        appendCube((-width * 0.5) - 0.6, 1.5, -0.6, 0.4);
        appendCube((-width * 0.5) - 0.5, 0.5, 1.0, 0.2);

        appendCube((width * 0.5) + 0.8, 0.3, 1.1, 0.5);
        appendCube((width * 0.5) + 0.9, 1.0, -0.5, 0.75);
        appendCube((width * 0.5) + 0.6, 1.5, 0.6, 0.4);
        appendCube((width * 0.5) + 0.5, 0.5, -1.0, 0.2);

        appendCube(1.1, 1.4, (depth * 0.5) + 0.8, 0.5);
        appendCube(-0.5, 1.0, (depth * 0.5) + 0.9, 0.75);
        appendCube(0.6, 0.4, (depth * 0.5) + 0.6, 0.4);


        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(cubeVerts), this._gl.STATIC_DRAW);

        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), this._gl.STATIC_DRAW);

        this._indexCount = cubeIndices.length;
    }
}

VRCubeIsland.VERTEX_SHADER = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "attribute vec3 position;",
    "attribute vec2 texCoord;",
    "attribute vec3 normal;",
    "varying vec2 vTexCoord;",
    "varying vec3 vLight;",

    "const vec3 lightDir = vec3(0.75, 0.5, 1.0);",
    "const vec3 ambientColor = vec3(0.5, 0.5, 0.5);",
    "const vec3 lightColor = vec3(0.75, 0.75, 0.75);",

    "void main() {",
    "  float lightFactor = max(dot(normalize(lightDir), normal), 0.0);",
    "  vLight = ambientColor + (lightColor * lightFactor);",
    "  vTexCoord = texCoord;",
    "  gl_Position = projectionMat * modelViewMat * vec4(position, 1.0);",
    "}",
].join('\n');

VRCubeIsland.FRAGMENT_SHADER = [
    "precision mediump float;",
    "uniform sampler2D diffuse;",
    "varying vec2 vTexCoord;",
    "varying vec3 vLight;",

    "void main() {",
    "  gl_FragColor = vec4(vLight, 1.0) * texture2D(diffuse, vTexCoord);",
    "}",
].join('\n');
