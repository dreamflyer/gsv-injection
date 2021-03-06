import utils = require("./utils");
import mathUtils = require("./mathUtils");

var decompose = require("mat4-decompose");

var drawDebugger: utils.Debugger = new utils.Debugger();

export class Mesh {
    textureURI: string;
    
    vertices: number[];
    indices: number[];
    uvMap: number[];
    
    texture: any;
    
    verticesBuffer: any;
    indicesBuffer: any;
    uvMapBuffer: any;

    rotation: number = 0;
    translation: {x: number, y: number, z: number} = {
        x: 0,
        y: 0,
        z: 0
    };
    
    private initialized: boolean = false;
    
    constructor(private getHeading: () => number) {
        
    }
    
    init(gl, oldWebGl): void {
        if(this.initialized) {
            return;
        }
        
        this.initBuffers(gl, oldWebGl);
        
        var texture = oldWebGl.createTexture();
        
        var image = new Image();
        
        image.onload = () => {
            this.handleTextureLoaded(image, texture, gl, oldWebGl);
        }
        
        image.src = this.textureURI;
        
        this.initialized = true;
    }
    
    private handleTextureLoaded(image, texture, gl, oldWebGl): void {
        oldWebGl.bindTexture(gl.TEXTURE_2D, texture);
        
        oldWebGl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        oldWebGl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        oldWebGl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        
        oldWebGl.generateMipmap(gl.TEXTURE_2D);
        
        oldWebGl.bindTexture(gl.TEXTURE_2D, null);
        
        this.texture = texture;
    }
    
    private initBuffers(gl, oldWebGl, bindAttributes?: boolean) {
        this.verticesBuffer = oldWebGl.createBuffer();
        
        oldWebGl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        oldWebGl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        
        if(bindAttributes) {
            oldWebGl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }
        
        this.uvMapBuffer = oldWebGl.createBuffer();
        
        oldWebGl.bindBuffer(gl.ARRAY_BUFFER, this.uvMapBuffer);
        oldWebGl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvMap), gl.STATIC_DRAW);
        
        if(bindAttributes) {
            oldWebGl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
        }
        
        this.indicesBuffer = oldWebGl.createBuffer();
        
        oldWebGl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        oldWebGl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    }
    
    private applyTransformation(initialMatrix) {
        var matrices: number[][] = [];

        var matrixRotation: any = getMatrixRotation(initialMatrix);

        var headingDelta = Math.PI + matrixRotation.heading + mathUtils.toRad(this.getHeading());
        
        matrices.push(mathUtils.zRotation(this.rotation));

        matrices.push(mathUtils.xRotation(-matrixRotation.pitch));
        
        matrices.push(mathUtils.translation(this.translation.x, this.translation.y, this.translation.z));
        
        matrices.push(mathUtils.zRotation(headingDelta));
        
        matrices.push(initialMatrix);
        
        return new Float32Array(mathUtils.multiplyMatrices(matrices));
    }
    
    draw(gl: any, oldWebGl: any, uniforms: Uniforms) {
        oldWebGl.disableVertexAttribArray(0);
        oldWebGl.disableVertexAttribArray(1);
        
        oldWebGl.enableVertexAttribArray(0);
        oldWebGl.enableVertexAttribArray(1);

        this.initBuffers(gl, oldWebGl, true);

        oldWebGl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        oldWebGl.uniform4fv(uniforms.uniform4fv.location, [5, 5, 0, 0]);
        oldWebGl.uniform1f(uniforms.uniform1f.location, 1);

        if(uniforms.uniformMatrix4fv) {
            oldWebGl.uniformMatrix4fv(uniforms.uniformMatrix4fv.location, uniforms.uniformMatrix4fv.transpose, this.applyTransformation(uniforms.uniformMatrix4fv.value));
        }
        
        oldWebGl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

function getMatrixRotation(matrix: number[]): {heading: number, pitch: number} {
    var translation = [0, 0, 0];
    var scale = [0, 0, 0];
    var skew = [0, 0, 0];
    var perspective = [0, 0, 0, 0];
    var quaternion = [0, 0, 0, 0];

    decompose(mathUtils.transpose(matrix), translation, scale, skew, perspective, quaternion);

    drawDebugger.setValue('translation', translation);
    drawDebugger.setValue('scale', scale);

    drawDebugger.setValue('perspective', perspective);

    drawDebugger.setValue('quaternion', quaternion);
    
    return getQaternionRotation(quaternion);
}

function getQaternionRotation(quaternion: number[]): {heading: number, pitch: number} {
    var q = quaternion;
    
    var ysqr = q[1] * q[1];
    
    var t0 = 2.0 * (q[3] * q[0] + q[1] * q[2]);
    var t1 = 1.0 - 2.0 * (q[0] * q[0] + ysqr);
    
    var roll = Math.atan2(t0, t1);
    
    var t2 = 2.0 * (q[3] * q[1] - q[2] * q[0]);
    
    t2 = t2 > 1.0 ? 1.0 : t2;
    t2 = t2 < -1.0 ? -1.0 : t2;
    
    var pitch =  Math.asin(t2);

    drawDebugger.setValue('pitch', pitch);
    drawDebugger.setValue('roll', roll);

    var t3 = 2.0 * (q[3] * q[2] + q[0] * q[1]);
    var t4 = 1.0 - 2.0 * (q[1] * q[1] + q[2] * q[2]);
    
    return {heading: Math.atan2(t3, t4), pitch: pitch};
}

export class Uniforms {
    uniform4fv: {
        location: any,
        value: any
    }

    uniform1f: {
        location: any,
        value: any
    }

    uniformMatrix4fv: {
        location: any,
        transpose: boolean,
        value: number[]
    }
}

export var activeMeshes: Mesh[] = [];

function drawScene(gl, oldWebGl, uniforms: Uniforms): void {
    activeMeshes.forEach((mesh: Mesh) => {
        if(!mesh.texture) {
            mesh.init(gl, oldWebGl);
            
            return;
        }
        
        mesh.draw(gl, oldWebGl, uniforms);
    });
}

export function init(canvasContainer: any): void {
    utils.setup(drawScene, (gl) => {
        if(gl.canvasContainer === false) {
            return false;
        }
        
        if(gl.canvasContainer === canvasContainer) {
            return true;
        }

        if(isContainerOf(canvasContainer, gl.canvas)) {
            gl.canvasContainer = canvasContainer;
            
            return true;
        }
        
        if(gl.canvas && !gl.canvas.parentElement) {
            return false;
        }
        
        gl.canvasContainer = false;
        
        return false;
    });
}

function isContainerOf(container: HTMLElement, element: HTMLElement): boolean {
    var current = element;

    while(current) {
        if(container === current) {
            return true;
        }

        current = current.parentElement;
    }

    return false;
}

export function addMesh(mesh: Mesh): void {
    activeMeshes.push(mesh);
}

export function removeMesh(mesh: Mesh): void {
    var filteredMeshes: Mesh[] = [];
    
    activeMeshes.forEach((activeMesh: Mesh) => {
        if(activeMesh === mesh) {
            return;
        }

        filteredMeshes.push(activeMesh);
    });

    activeMeshes = filteredMeshes;
}

export function setDebugAcceptor(acceptor: {accept: (name: string, value: any) => void}) {
    drawDebugger.setValueAcceptor(acceptor);
}