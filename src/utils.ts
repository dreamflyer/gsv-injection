/// <reference path="../typings/main.d.ts" />
var webGl: any;

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

function methodCalled(methodName): void {
    lastCalls.unshift(methodName);
    lastCalls.pop();
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

function webGlInject(methodName, injectionBody): void {
    var oldMethod = WebGLRenderingContext.prototype[methodName];

    register(methodName);

    WebGLRenderingContext.prototype[methodName] = function() {
        webGl = this;

        var newArgumens = [oldMethod, webGl, []];

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

        return field.apply(webGl, filteredArgs);
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

export function setup(canvas, callback: (webGl, oldWebGl, uniforms) => void): void {
    var methods = glMethodsList();

    methods.forEach(methodName => {
        webGlInject(methodName + "", (oldMethod, gl, args) => {
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
                callback(gl, oldWebGl, {
                    uniform4fv: {
                        location: lastUniform4fv[0],
                        value: lastUniform4fv[1]
                    },

                    uniform1f: {
                        location: preLastUniform1f[0],
                        value: preLastUniform1f[1]
                    }
                });
                
                oldWebGl.uniform1f(lastUniform1f[0], lastUniform1f[1]);
                oldWebGl.bindTexture(gl.TEXTURE_2D, lastTexture);
            }

            var result = oldMethod.apply(gl, args);

            methodCalled(methodName);

            return result;
        });
    });
}