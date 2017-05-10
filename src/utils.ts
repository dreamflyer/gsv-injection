/// <reference path="../typings/main.d.ts" />
var oldWebGl: any = {};

var lastCalls: any[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var desiredCases: any[][] = [];

desiredCases.push([
    'uniform1f',
    'drawElements',
    'uniform4fv',
    'bindTexture',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer'
]);

desiredCases.push([
    'uniform1f',
    'drawElements',
    'uniform1f',
    'uniform4fv',
    'bindTexture',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer'
]);

desiredCases.push([
    'drawElements',
    'uniform4fv',
    'bindTexture',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer'
]);

desiredCases.push([
    'drawElements',
    'uniform1f',
    'uniform4fv',
    'bindTexture',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer',
    'vertexAttribPointer',
    'bindBuffer'
]);

function methodCalled(methodName): void {
    lastCalls.unshift(methodName);
    lastCalls.pop();
}

function getOldWebgl(glInstance): any {
    var result: any = new Object(oldWebGl);

    result.glInstance = glInstance;

    return result;
}

function isDesiredCase(): boolean {
    for(var i = 0; i < desiredCases.length; i++) {
        if(isDesiredSingleCase(desiredCases[i])) {
            return true;
        }
    }

    return false;
}

function isDesiredSingleCase(desiredCase): boolean {
    for(var i = 0; i < desiredCase.length; i++) {
        if(desiredCase[i] !== lastCalls[i]) {
            return false;
        }
    }

    return true;
}

function webGlInject(methodName, injectionBody, isGlEnabled): void {
    var oldMethod = WebGLRenderingContext.prototype[methodName];

    register(methodName);

    WebGLRenderingContext.prototype[methodName] = function() {
        if(!isGlEnabled(this)) {
            return oldMethod.apply(this, arguments);
        }
        
        var newArgumens = [oldMethod, this, []];

        for(var i = 0; i < arguments.length; i++) {
            newArgumens[2].push(arguments[i]);
        }

        return injectionBody.apply(null, newArgumens);
    }
}

function register(methodName): void {
    var field = WebGLRenderingContext.prototype[methodName];

    oldWebGl[methodName] = function(a, b, c, d, e, f, g, h, Ii, Jj, Kk) {
        var filteredArgs = [];

        var i;

        for(i = arguments.length - 1; i >= 0; i--) {
            if(arguments[i] !== undefined) {
                break;
            }
        }

        var count = i + 1;

        for(i = 0; i < count; i++) {
            filteredArgs.push(arguments[i]);
        }

        return field.apply(this.glInstance, filteredArgs);
    };
}

function glMethodsList(): string[] {
    var result: string[] = [];

    Object.keys(WebGLRenderingContext.prototype).forEach(methodName => {
        var field;

        try {
            var field = WebGLRenderingContext.prototype[methodName];
        } catch(exception) {

        }

        var isMethod = field && field.toString && field && field.toString().indexOf("function") === 0;

        if(isMethod) {
            result.push(methodName);
        }
    });

    return result;
}

var lastTexture;
var lastUniform4fv;
var lastUniform1f;
var preLastUniform1f;
var lastProgram;
var lastMatrices = [];

function findLastMatrix4fv(): any[] {
    for(var i = 0; i < lastMatrices.length; i++) {
        if(lastMatrices[i].program === lastProgram) {
            return lastMatrices[i].matrix;
        }
    }

    return null;
}

export function setup(callback: (webGl, oldWebGl, uniforms) => void, isGlEnabled: (gl) => boolean): void {
    var methods = glMethodsList();

    methods.forEach(methodName => {
        webGlInject(methodName + "", (oldMethod, gl, args) => {
            if(!gl.oldWebGl) {
                gl.oldWebGl = getOldWebgl(gl);
            }
            
            //console.log(methodName);
            
            if(methodName === "useProgram") {
                lastProgram = args[0];
            }
            
            if(methodName === 'uniformMatrix4fv') {
                var lastUniformMatrix4fv = [args[0], args[1], args[2]];

                var container;

                for(var i = 0; i < lastMatrices.length; i++) {
                    var currentContainer = lastMatrices[i];

                    if(currentContainer.program === lastProgram) {
                        container = currentContainer;

                        break;
                    }
                }

                if(!container) {
                    container = {
                        program: lastProgram
                    }

                    lastMatrices.push(container);
                }

                container.matrix = lastUniformMatrix4fv;
            }

            if(methodName === 'bindTexture') {
                lastTexture = args[1];
            }

            if(methodName === 'uniform4fv') {
                lastUniform4fv = [args[0], args[1]];
            }

            if(methodName === 'uniform1f') {
                preLastUniform1f = lastUniform1f;
                lastUniform1f = [args[0], args[1]];
            }

            if(methodName === 'disableVertexAttribArray' && isDesiredCase()) {
                var uniformMatrix4fv = findLastMatrix4fv();
                
                callback(gl, gl.oldWebGl , {
                    uniform4fv: {
                        location: lastUniform4fv[0],
                        value: lastUniform4fv[1]
                    },

                    uniform1f: {
                        location: preLastUniform1f[0],
                        value: preLastUniform1f[1]
                    },

                    uniformMatrix4fv: uniformMatrix4fv ? {
                        location: uniformMatrix4fv[0],
                        transpose: uniformMatrix4fv[1],
                        value: uniformMatrix4fv[2]
                    } : null
                });

                gl.oldWebGl.uniform1f(lastUniform1f[0], lastUniform1f[1]);
                
                if(uniformMatrix4fv) {
                    gl.oldWebGl.uniformMatrix4fv(uniformMatrix4fv[0], uniformMatrix4fv[1], uniformMatrix4fv[2]);
                }

                gl.oldWebGl .bindTexture(gl.TEXTURE_2D, lastTexture);
            }

            var result = oldMethod.apply(gl, args);

            methodCalled(methodName);

            return result;
        }, isGlEnabled);
    });
}

export class Debugger {
    private acceptor: {accept: (name: string, value: any) => void};
    
    setValueAcceptor(acceptor: {accept: (name: string, value: any) => void}) {
        this.acceptor = acceptor;
    }
    
    setValue(name: string, value: any) {
        if(!this.acceptor) {
            return;
        }
        
        this.acceptor.accept(name, value);
    }
}