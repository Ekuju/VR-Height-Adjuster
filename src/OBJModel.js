// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

class OBJModel {
    constructor(gl, path, position, scale) {
        this._gl = gl;
        this._path = path;
        this._position = position;
        this._scale = scale * 0.95;
        this._indexCount = null;

        this._program = new WGLUProgram(gl);
        this._program.attachShaderSource(OBJModel.VERTEX_SHADER, gl.VERTEX_SHADER);
        this._program.attachShaderSource(OBJModel.FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        this._program.bindAttribLocation({
            position: 0,
            normal: 1,
        });
        this._program.link();

        this._vertBuffer = gl.createBuffer();
        this._indexBuffer = gl.createBuffer();

        const xhr = new XMLHttpRequest();
        xhr.open('GET', path);
        xhr.onload = () => {
            const lines = String(xhr.response).split('\n');
            this.load(lines);
        };
        xhr.send();
    }

    render(projectionMat, modelViewMat) {
        this._program.use();

        this._gl.uniformMatrix4fv(this._program.uniform.projectionMat, false, projectionMat);
        this._gl.uniformMatrix4fv(this._program.uniform.modelViewMat, false, modelViewMat);

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        this._gl.enableVertexAttribArray(this._program.attrib.position);
        this._gl.enableVertexAttribArray(this._program.attrib.normal);

        // stride is 4 * index count stride (6 for OBJModel)
        this._gl.vertexAttribPointer(this._program.attrib.position, 3, this._gl.FLOAT, false, 24, 0);
        this._gl.vertexAttribPointer(this._program.attrib.normal, 3, this._gl.FLOAT, false, 24, 12);

        this._gl.drawElements(this._gl.TRIANGLES, this._indexCount, this._gl.UNSIGNED_SHORT, 0);
    }

    load(lines) {
        const buffer = [];
        const faces = [];
        const vertices = [null, null, null]; // obj is off by 1
        const normals = [null, null, null];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineParts = line.split(' ');

            switch (lineParts[0]) {
                case 'v': {
                    vertices.push(
                        lineParts[1] * this._scale + this._position[0],
                        lineParts[2] * this._scale + this._position[1],
                        lineParts[3] * this._scale + this._position[2]);
                } break;

                case 'vn': {
                    normals.push(lineParts[1], lineParts[2], lineParts[3]);
                } break;

                case 'f': {
                    for (let a = 1; a < lineParts.length; a++) {
                        lineParts[a] = lineParts[a].split('/');
                    }

                    faces.push(buffer.length / 6);
                    for (let a = 0; a < 3; a++) {
                        const verticesIndex = lineParts[1][0] * 3 + a;
                        buffer.push(vertices[verticesIndex]);
                    }
                    for (let a = 0; a < 3; a++) {
                        const normalIndex = lineParts[1][2] * 3 + a;
                        buffer.push(normals[normalIndex]);
                    }

                    faces.push(buffer.length / 6);
                    for (let a = 0; a < 3; a++) {
                        const verticesIndex = lineParts[2][0] * 3 + a;
                        buffer.push(vertices[verticesIndex]);
                    }
                    for (let a = 0; a < 3; a++) {
                        const normalIndex = lineParts[2][2] * 3 + a;
                        buffer.push(normals[normalIndex]);
                    }

                    faces.push(buffer.length / 6);
                    for (let a = 0; a < 3; a++) {
                        const verticesIndex = lineParts[3][0] * 3 + a;
                        buffer.push(vertices[verticesIndex]);
                    }
                    for (let a = 0; a < 3; a++) {
                        const normalIndex = lineParts[3][2] * 3 + a;
                        buffer.push(normals[normalIndex]);
                    }
                } break;
            }
        }

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(buffer), this._gl.STATIC_DRAW);

        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), this._gl.STATIC_DRAW);

        this._indexCount = faces.length;
    }

    // resize(width, depth) {
    //     this._width = width;
    //     this._depth = depth;
    //
    //     const cubeVerts = [];
    //     const cubeIndices = [];
    //
    //     // Build a single box.
    //     const appendBox = (left, bottom, back, right, top, front) => {
    //         // Bottom
    //         let idx = cubeVerts.length / 6.0;
    //         cubeIndices.push(idx, idx + 1, idx + 2);
    //         cubeIndices.push(idx, idx + 2, idx + 3);
    //
    //         cubeVerts.push(left, bottom, back, 0.0, -1.0, 0.0);
    //         cubeVerts.push(right, bottom, back, 0.0, -1.0, 0.0);
    //         cubeVerts.push(right, bottom, front, 0.0, -1.0, 0.0);
    //         cubeVerts.push(left, bottom, front, 0.0, -1.0, 0.0);
    //
    //         // Top
    //         idx = cubeVerts.length / 6.0;
    //         cubeIndices.push(idx, idx + 2, idx + 1);
    //         cubeIndices.push(idx, idx + 3, idx + 2);
    //
    //         cubeVerts.push(left, top, back, 0.0, 1.0, 0.0);
    //         cubeVerts.push(right, top, back, 0.0, 1.0, 0.0);
    //         cubeVerts.push(right, top, front, 0.0, 1.0, 0.0);
    //         cubeVerts.push(left, top, front, 0.0, 1.0, 0.0);
    //
    //         // Left
    //         idx = cubeVerts.length / 6.0;
    //         cubeIndices.push(idx, idx + 2, idx + 1);
    //         cubeIndices.push(idx, idx + 3, idx + 2);
    //
    //         cubeVerts.push(left, bottom, back, -1.0, 0.0, 0.0);
    //         cubeVerts.push(left, top, back, -1.0, 0.0, 0.0);
    //         cubeVerts.push(left, top, front,  -1.0, 0.0, 0.0);
    //         cubeVerts.push(left, bottom, front, -1.0, 0.0, 0.0);
    //
    //         // Right
    //         idx = cubeVerts.length / 6.0;
    //         cubeIndices.push(idx, idx + 1, idx + 2);
    //         cubeIndices.push(idx, idx + 2, idx + 3);
    //
    //         cubeVerts.push(right, bottom, back, 1.0, 0.0, 0.0);
    //         cubeVerts.push(right, top, back, 1.0, 0.0, 0.0);
    //         cubeVerts.push(right, top, front, 1.0, 0.0, 0.0);
    //         cubeVerts.push(right, bottom, front, 1.0, 0.0, 0.0);
    //
    //         // Back
    //         idx = cubeVerts.length / 6.0;
    //         cubeIndices.push(idx, idx + 2, idx + 1);
    //         cubeIndices.push(idx, idx + 3, idx + 2);
    //
    //         cubeVerts.push(left, bottom, back, 0.0, 0.0, -1.0);
    //         cubeVerts.push(right, bottom, back, 0.0, 0.0, -1.0);
    //         cubeVerts.push(right, top, back, 0.0, 0.0, -1.0);
    //         cubeVerts.push(left, top, back, 0.0, 0.0, -1.0);
    //
    //         // Front
    //         idx = cubeVerts.length / 6.0;
    //         cubeIndices.push(idx, idx + 1, idx + 2);
    //         cubeIndices.push(idx, idx + 2, idx + 3);
    //
    //         cubeVerts.push(left, bottom, front, 0.0, 0.0, 1.0);
    //         cubeVerts.push(right, bottom, front, 0.0, 0.0, 1.0);
    //         cubeVerts.push(right, top, front, 0.0, 0.0, 1.0);
    //         cubeVerts.push(left, top, front, 0.0, 0.0, 1.0);
    //     };
    //
    //     // Appends a cube with the given centerpoint and size.
    //     const appendCube = (x, y, z, size) => {
    //         const halfSize = size * 0.5;
    //         // x += Math.random() * 10 - 5;
    //         // z += Math.random() * 10 - 5;
    //         // y += Math.random() * 2;
    //         y += 1;
    //         appendBox(
    //             x - halfSize,
    //             y - halfSize,
    //             z - halfSize,
    //             x + halfSize,
    //             y + halfSize,
    //             z + halfSize);
    //     };
    //
    //     // Main "island", covers where the user can safely stand. Top of the cube
    //     // (the ground the user stands on) should be at Y=0 to align with users
    //     // floor. X=0 and Z=0 should be at the center of the users play space.
    //     appendBox(-width * 0.5, -width, -depth * 0.5, width * 0.5, 0, depth * 0.5);
    //
    //     // A sprinkling of other cubes to make things more visually interesting.
    //     appendCube(1.1, 0.3, (-depth * 0.5) - 0.8, 0.5);
    //     appendCube(-0.5, 1.0, (-depth * 0.5) - 0.9, 0.75);
    //     appendCube(0.6, 1.5, (-depth * 0.5) - 0.6, 0.4);
    //     appendCube(-1.0, 0.5, (-depth * 0.5) - 0.5, 0.2);
    //
    //     appendCube((-width * 0.5) - 0.8, 0.3, -1.1, 0.5);
    //     appendCube((-width * 0.5) - 0.9, 1.0, 0.5, 0.75);
    //     appendCube((-width * 0.5) - 0.6, 1.5, -0.6, 0.4);
    //     appendCube((-width * 0.5) - 0.5, 0.5, 1.0, 0.2);
    //
    //     appendCube((width * 0.5) + 0.8, 0.3, 1.1, 0.5);
    //     appendCube((width * 0.5) + 0.9, 1.0, -0.5, 0.75);
    //     appendCube((width * 0.5) + 0.6, 1.5, 0.6, 0.4);
    //     appendCube((width * 0.5) + 0.5, 0.5, -1.0, 0.2);
    //
    //     appendCube(1.1, 1.4, (depth * 0.5) + 0.8, 0.5);
    //     appendCube(-0.5, 1.0, (depth * 0.5) + 0.9, 0.75);
    //     appendCube(0.6, 0.4, (depth * 0.5) + 0.6, 0.4);
    //
    //
    //     this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertBuffer);
    //     this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(cubeVerts), this._gl.STATIC_DRAW);
    //
    //     this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    //     this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), this._gl.STATIC_DRAW);
    //
    //     this._indexCount = cubeIndices.length;
    // }
}

OBJModel.VERTEX_SHADER = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "attribute vec3 position;",
    "attribute vec3 normal;",
    "varying vec3 vLight;",

    "const vec3 lightDir = vec3(0.75, 0.5, 1.0);",
    "const vec3 ambientColor = vec3(0.5, 0.5, 0.5);",
    "const vec3 lightColor = vec3(0.75, 0.75, 0.75);",

    "void main() {",
    "  float lightFactor = dot(normalize(lightDir), normal);",
    "  vLight = ambientColor + (lightColor * lightFactor);",
    "  gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );",
    "}",
].join('\n');

OBJModel.FRAGMENT_SHADER = [
    "precision mediump float;",
    "varying vec3 vLight;",

    "void main() {",
    "  gl_FragColor = vec4(vLight, 1.0);",
    "}",
].join('\n');
