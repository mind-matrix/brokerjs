(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["BrokerDemoLibrary"] = factory();
	else
		root["BrokerDemoLibrary"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
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
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/assets/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./public/app.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../index.js":
/*!*******************!*\
  !*** ../index.js ***!
  \*******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const uniqid = __webpack_require__(/*! uniqid */ "../node_modules/uniqid/index.js");

class BrokeredConnection {
    constructor(connection, brokerCallback = () => {}) {
        this.id = uniqid();
        this.brokered = true;
        this.connection = connection;
        this.brokerCallback = brokerCallback;
        this.onopenCallbacks = [];
        this.onmessageCallbacks = [];
        this.oncloseCallbacks = [];
        this.connection.onopen = () => {
            for(var i=0; i < this.onopenCallbacks.length; i++)
                this.onopenCallbacks[i]();
        };
        this.connection.onmessage = (message) => {
            var msg = JSON.parse(message.data);
            if(msg.t === 0)
                this.brokerCallback(msg.d);
            else {
                for(var i=0; i < this.onmessageCallbacks.length; i++)
                    this.onmessageCallbacks[i](msg.d);
            }
        };
        this.connection.onclose = () => {
            for(var i=0; i < this.oncloseCallbacks.length; i++)
                this.oncloseCallbacks[i]();
        };
    }
    on(event, callback) {
        if(event === 'open')
            this.onopenCallbacks.push(callback);
        else if(event === 'message')
            this.onmessageCallbacks.push(callback);
        else if(event === 'close')
            this.oncloseCallbacks.push(callback);
    }
    send(message) {
        this.connection.send(JSON.stringify({
            t: 1,
            d: message
        }));
    }
    sendBrokerMessage(data) {
        this.connection.send(JSON.stringify({
            t: 0,
            d: data
        }))
    }
}

module.exports = class Broker {
    constructor(models) {
        this.models = {};
        this.subscribers = {};
        for(var key in models) {
            this.subscribers[key] = [];
            var eventListener = (path, value) => {
                var obj = {};
                var ob = obj;
                for(var i=0; i < path.length - 1; i++) {
                    ob[path[i]] = {};
                    ob = ob[path[i]];
                }
                ob[path[path.length - 1]] = value;
                obj = Broker.removeHolders(JSON.parse(JSON.stringify(obj)));
                var key = path[0];
                if(this.subscribers.hasOwnProperty(key))
                    for(var subscriber of this.subscribers[key])
                        subscriber.sendBrokerMessage(obj);
            };
            Broker.createObserver(this.models, key, models[key], eventListener, [key]);
        }
    }
    static removeHolders(object) {
        for(var key in object) {
            var k = key.substr(1);
            if(typeof object[key] === 'object')
                object[key] = Broker.removeHolders(object[key]);
            if(key.startsWith('_') && object.hasOwnProperty(k)) {
                object[k] = object[key];
                delete object[key];
            }
        }
        return object;
    }
    static createObserver(variable, key, data, listener, pathway) {
        if(typeof data === 'object') {
            var xt = {};
            for(var k in data) {
                Broker.createObserver(xt, k, data[k], listener, pathway.concat(k));
            }
            data = xt;
        }
        
        variable['_' + key] = data;

        Object.defineProperty(variable, key, {
            enumerable: true,
            get: function () { return this['_' + key]; },
            set: function (x) {
                if(typeof x === 'object' && x !== null) {
                    var xt = {};
                    for(var k in x)
                        Broker.createObserver(xt, k, x[k], listener, pathway.concat(k));
                    this['_' + key] = xt;
                }
                else
                    this['_' + key] = x;
                listener(pathway, this['_' + key]);
            }
        });
    }
    set(data, model) {
        for(var key in data) {
            if(model.hasOwnProperty(key)) {
                if(typeof data[key] === 'object')
                    this.set(data[key], model[key]);
                else
                    model[key] = data[key];
            }
        }
    }
    createFrom(connection) {
        return new BrokeredConnection(connection, (data) => {
            this.set(data, this.models);
        });
    }
    subscribe(connection, modelName) {
        var brokered_connection;
        if(!connection.brokered) {
            brokered_connection = new BrokeredConnection(connection, (data) => {
                this.set(data, this.models);
            });
        }
        else
            brokered_connection = connection;
        this.subscribers[modelName].push(brokered_connection);
        return brokered_connection;
    }
    unsubscribe(brokered_connection, modelName) {
        this.subscribers[modelName] = this.subscribers[modelName].filter((conn) => conn.id !== brokered_connection.id);
    }
}

/***/ }),

/***/ "../node_modules/isomorphic-ws/browser.js":
/*!************************************************!*\
  !*** ../node_modules/isomorphic-ws/browser.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {// https://github.com/maxogden/websocket-stream/blob/48dc3ddf943e5ada668c31ccd94e9186f02fafbd/ws-fallback.js

var ws = null

if (typeof WebSocket !== 'undefined') {
  ws = WebSocket
} else if (typeof MozWebSocket !== 'undefined') {
  ws = MozWebSocket
} else if (typeof global !== 'undefined') {
  ws = global.WebSocket || global.MozWebSocket
} else if (typeof window !== 'undefined') {
  ws = window.WebSocket || window.MozWebSocket
} else if (typeof self !== 'undefined') {
  ws = self.WebSocket || self.MozWebSocket
}

module.exports = ws

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "../node_modules/process/browser.js":
/*!******************************************!*\
  !*** ../node_modules/process/browser.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ "../node_modules/uniqid/index.js":
/*!***************************************!*\
  !*** ../node_modules/uniqid/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/* 
(The MIT License)
Copyright (c) 2014 Halász Ádám <mail@adamhalasz.com>
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

//  Unique Hexatridecimal ID Generator
// ================================================

//  Dependencies
// ================================================
var pid = process && process.pid ? process.pid.toString(36) : '' ;
var address = '';
if(false){ var i, mac, networkInterfaces; } 

//  Exports
// ================================================
module.exports = module.exports.default = function(prefix){ return (prefix || '') + address + pid + now().toString(36); }
module.exports.process = function(prefix){ return (prefix || '') + pid + now().toString(36); }
module.exports.time    = function(prefix){ return (prefix || '') + now().toString(36); }

//  Helpers
// ================================================
function now(){
    var time = Date.now();
    var last = now.last || time;
    return now.last = time > last ? time : last + 1;
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../process/browser.js */ "../node_modules/process/browser.js")))

/***/ }),

/***/ "../node_modules/webpack/buildin/global.js":
/*!*************************************************!*\
  !*** ../node_modules/webpack/buildin/global.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./public/app.js":
/*!***********************!*\
  !*** ./public/app.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const WebSocket = __webpack_require__(/*! isomorphic-ws */ "../node_modules/isomorphic-ws/browser.js");
const Broker = __webpack_require__(/*! ../../index */ "../index.js");

var model = {
    serverTime: Date.now(),
    message: ''
};

var broker = new Broker(model);

var ws = new WebSocket('ws://localhost:8080');

var bws = broker.createFrom(ws);

document.getElementById('send').addEventListener('click', (e) => {
    var message = document.getElementById('message').value;
    if(message.trim() !== '') {
        bws.send(message);
    }
});

setInterval(() => {
    if(broker.models.message.trim() !== '')
        document.getElementById('messageDisplay').textContent = broker.models.message;
});

/***/ })

/******/ });
});
//# sourceMappingURL=bundle.js.map