var GSVInjection =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/// <reference path="../typings/main.d.ts" />
	var utils = __webpack_require__(1);
	var Mesh = (function () {
	    function Mesh() {
	        this.initialized = false;
	    }
	    Mesh.prototype.init = function (gl, oldWebGl) {
	        var _this = this;
	        if (this.initialized) {
	            return;
	        }
	        this.initBuffers(gl, oldWebGl);
	        var texture = oldWebGl.createTexture();
	        var image = new Image();
	        image.onload = function () {
	            _this.handleTextureLoaded(image, texture, gl, oldWebGl);
	        };
	        image.src = this.textureURI;
	        this.initialized = true;
	    };
	    Mesh.prototype.handleTextureLoaded = function (image, texture, gl, oldWebGl) {
	        oldWebGl.bindTexture(gl.TEXTURE_2D, texture);
	        oldWebGl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	        oldWebGl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	        oldWebGl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	        oldWebGl.generateMipmap(gl.TEXTURE_2D);
	        oldWebGl.bindTexture(gl.TEXTURE_2D, null);
	        this.texture = texture;
	    };
	    Mesh.prototype.initBuffers = function (gl, oldWebGl, bindAttributes) {
	        this.verticesBuffer = oldWebGl.createBuffer();
	        oldWebGl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
	        oldWebGl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
	        if (bindAttributes) {
	            oldWebGl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
	        }
	        this.uvMapBuffer = oldWebGl.createBuffer();
	        oldWebGl.bindBuffer(gl.ARRAY_BUFFER, this.uvMapBuffer);
	        oldWebGl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvMap), gl.STATIC_DRAW);
	        if (bindAttributes) {
	            oldWebGl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	        }
	        this.indicesBuffer = oldWebGl.createBuffer();
	        oldWebGl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
	        oldWebGl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
	    };
	    Mesh.prototype.draw = function (gl, oldWebGl, uniforms) {
	        oldWebGl.disableVertexAttribArray(0);
	        oldWebGl.disableVertexAttribArray(1);
	        oldWebGl.enableVertexAttribArray(0);
	        oldWebGl.enableVertexAttribArray(1);
	        this.initBuffers(gl, oldWebGl, true);
	        oldWebGl.bindTexture(gl.TEXTURE_2D, this.texture);
	        oldWebGl.uniform4fv(uniforms.uniform4fv.location, uniforms.uniform4fv.value);
	        oldWebGl.uniform1f(uniforms.uniform1f.location, 1);
	        oldWebGl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	    };
	    return Mesh;
	}());
	exports.Mesh = Mesh;
	var Uniforms = (function () {
	    function Uniforms() {
	    }
	    return Uniforms;
	}());
	exports.Uniforms = Uniforms;
	var activeMeshes = [];
	function drawScene(gl, oldWebGl, uniforms) {
	    activeMeshes.forEach(function (mesh) {
	        if (!mesh.texture) {
	            mesh.init(gl, oldWebGl);
	            return;
	        }
	        mesh.draw(gl, oldWebGl, uniforms);
	    });
	}
	function init() {
	    utils.setup(null, drawScene);
	}
	function addMesh(mesh) {
	    activeMeshes.push(mesh);
	}
	exports.addMesh = addMesh;
	function removeMesh(mesh) {
	    var filteredMeshes = [];
	    activeMeshes.forEach(function (activeMesh) {
	        if (activeMesh === mesh) {
	            return;
	        }
	        filteredMeshes.push(activeMesh);
	    });
	    activeMeshes = filteredMeshes;
	}
	exports.removeMesh = removeMesh;
	init();
	//# sourceMappingURL=index.js.map

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/// <reference path="../typings/main.d.ts" />
	var webGl;
	var oldWebGl = {};
	var lastCalls = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var desiredCases = [];
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
	function methodCalled(methodName) {
	    lastCalls.unshift(methodName);
	    lastCalls.pop();
	}
	function isDesiredCase() {
	    for (var i = 0; i < desiredCases.length; i++) {
	        if (isDesiredSingleCase(desiredCases[i])) {
	            return true;
	        }
	    }
	    return false;
	}
	function isDesiredSingleCase(desiredCase) {
	    for (var i = 0; i < desiredCase.length; i++) {
	        if (desiredCase[i] !== lastCalls[i]) {
	            return false;
	        }
	    }
	    return true;
	}
	function webGlInject(methodName, injectionBody) {
	    var oldMethod = WebGLRenderingContext.prototype[methodName];
	    register(methodName);
	    WebGLRenderingContext.prototype[methodName] = function () {
	        webGl = this;
	        var newArgumens = [oldMethod, webGl, []];
	        for (var i = 0; i < arguments.length; i++) {
	            newArgumens[2].push(arguments[i]);
	        }
	        return injectionBody.apply(null, newArgumens);
	    };
	}
	function register(methodName) {
	    var field = WebGLRenderingContext.prototype[methodName];
	    oldWebGl[methodName] = function (a, b, c, d, e, f, g, h, Ii, Jj, Kk) {
	        var filteredArgs = [];
	        var i;
	        for (i = arguments.length - 1; i >= 0; i--) {
	            if (arguments[i] !== undefined) {
	                break;
	            }
	        }
	        var count = i + 1;
	        for (i = 0; i < count; i++) {
	            filteredArgs.push(arguments[i]);
	        }
	        return field.apply(webGl, filteredArgs);
	    };
	}
	function glMethodsList() {
	    var result = [];
	    Object.keys(WebGLRenderingContext.prototype).forEach(function (methodName) {
	        var field;
	        try {
	            var field = WebGLRenderingContext.prototype[methodName];
	        }
	        catch (exception) {
	        }
	        var isMethod = field && field.toString && field && field.toString().indexOf("function") === 0;
	        if (isMethod) {
	            result.push(methodName);
	        }
	    });
	    return result;
	}
	var lastTexture;
	var lastUniform4fv;
	var lastUniform1f;
	var preLastUniform1f;
	function setup(canvas, callback) {
	    var methods = glMethodsList();
	    methods.forEach(function (methodName) {
	        webGlInject(methodName + "", function (oldMethod, gl, args) {
	            if (methodName === 'bindTexture') {
	                lastTexture = args[1];
	            }
	            if (methodName === 'uniform4fv') {
	                lastUniform4fv = [args[0], args[1]];
	            }
	            if (methodName === 'uniform1f') {
	                preLastUniform1f = lastUniform1f;
	                lastUniform1f = [args[0], args[1]];
	            }
	            if (methodName === 'disableVertexAttribArray' && isDesiredCase()) {
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
	exports.setup = setup;
	//# sourceMappingURL=utils.js.map

/***/ }
/******/ ])