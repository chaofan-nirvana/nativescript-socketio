"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var socketio_common_1 = require("./socketio.common");
var SocketIO = (function (_super) {
    __extends(SocketIO, _super);
    function SocketIO() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.call(this) || this;
        var opts = {};
        var urlComponent;
        var count;
        var connectParams = {};
        switch (args.length) {
            case 2:
                urlComponent = NSURLComponents.alloc().initWithString(args[0]);
                var obj_1 = args[1];
                var keys = Object.keys(obj_1);
                count = urlComponent.queryItems ? urlComponent.queryItems.count : 0;
                for (var i = 0; i < count; i++) {
                    var component = urlComponent.queryItems.objectAtIndex(i);
                    var componentObj = {};
                    componentObj[component.name] = component.value;
                    Object.assign(connectParams, componentObj);
                }
                keys.forEach(function (key) {
                    var _a;
                    if (key === 'query') {
                        var query = obj_1[key];
                        if (typeof query === 'object') {
                            var queryKeys = Object.keys(query);
                            for (var _i = 0, queryKeys_1 = queryKeys; _i < queryKeys_1.length; _i++) {
                                var queryKey = queryKeys_1[_i];
                                var value = query[queryKey];
                                Object.assign(connectParams, (_a = {},
                                    _a[queryKey] = value,
                                    _a));
                            }
                        }
                        else if (typeof query === 'string') {
                            if (query.startsWith('?')) {
                                query = query.replace('?', '');
                            }
                            var optionsQuery = query
                                .split('&')
                                .map(function (p) { return p.split('='); })
                                .reduce(function (obj, pair) {
                                var _a;
                                var _b = pair.map(decodeURIComponent), key = _b[0], value = _b[1];
                                return (__assign({}, obj, (_a = {}, _a[key] = value, _a)));
                            }, {});
                            Object.assign(connectParams, optionsQuery);
                        }
                    }
                    else if (key === 'debug' && obj_1[key]) {
                        opts['log'] = true;
                    }
                    else {
                        opts[key] = serialize(obj_1[key]);
                    }
                });
                if (opts.connectParams === null) {
                    delete opts.connectParams;
                }
                Object.assign(opts, { connectParams: connectParams });
                _this.manager = SocketManager.alloc().initWithSocketURLConfig(NSURL.URLWithString(args[0]), opts);
                _this.socket = _this.manager.defaultSocket;
                break;
            case 3:
                var s = args.pop();
                _this.manager = s.manager;
                _this.socket = s;
                break;
            default:
                urlComponent = NSURLComponents.alloc().initWithString(args[0]);
                count = urlComponent.queryItems ? urlComponent.queryItems.count : 0;
                for (var i = 0; i < count; i++) {
                    var component = urlComponent.queryItems.objectAtIndex(i);
                    var componentObj = {};
                    componentObj[component.name] = component.value;
                    Object.assign(connectParams, componentObj);
                }
                if (urlComponent.queryItems) {
                    Object.assign(opts, {
                        connectParams: connectParams
                    });
                }
                _this.manager = SocketManager.alloc().initWithSocketURLConfig(NSURL.URLWithString(args[0]), opts);
                _this.socket = _this.manager.defaultSocket;
                break;
        }
        return _this;
    }
    SocketIO.prototype.connect = function () {
        if (!this.connected) {
            this.socket.connect();
        }
    };
    SocketIO.prototype.disconnect = function () {
        this.socket.disconnect();
    };
    Object.defineProperty(SocketIO.prototype, "connected", {
        get: function () {
            return this.socket.status === SocketIOStatus.Connected;
        },
        enumerable: true,
        configurable: true
    });
    SocketIO.prototype.on = function (event, callback) {
        this.socket.onCallback(event, function (data, ack) {
            var d = deserialize(data);
            if (Array.isArray(d)) {
                data = d[0];
            }
            else {
                data = d;
            }
            if (ack) {
                callback(data, ack);
            }
            else {
                callback(data);
            }
        });
    };
    SocketIO.prototype.once = function (event, callback) {
        this.socket.onceCallback(event, function (data, ack) {
            var d = deserialize(data);
            if (Array.isArray(d)) {
                data = d[0];
            }
            else {
                data = d;
            }
            if (ack) {
                callback(data, ack);
            }
            else {
                callback(data);
            }
        });
    };
    SocketIO.prototype.off = function (event) {
        this.socket.off(event);
    };
    SocketIO.prototype.emit = function (event) {
        var payload = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            payload[_i - 1] = arguments[_i];
        }
        if (!event) {
            return console.error('Emit Failed: No Event argument');
        }
        var ack = payload.pop();
        if (ack && typeof ack !== 'function') {
            payload.push(ack);
            ack = null;
        }
        var final = payload.map(serialize);
        if (ack) {
            var _ack = function (args) {
                ack.apply(null, deserialize(args));
            };
            var e = this.socket.emitWithAckWith(event, final);
            if (e) {
                e.timingOutAfterCallback(0, _ack);
            }
        }
        else {
            this.socket.emitWith(event, final);
        }
    };
    SocketIO.prototype.joinNamespace = function (nsp) {
        return new SocketIO(null, null, this.manager.socketForNamespace(nsp));
    };
    SocketIO.prototype.leaveNamespace = function () {
        this.socket.leaveNamespace();
    };
    return SocketIO;
}(socketio_common_1.Common));
exports.SocketIO = SocketIO;
function serialize(data) {
    switch (typeof data) {
        case 'string':
        case 'boolean':
        case 'number': {
            return data;
        }
        case 'object': {
            if (data instanceof Date) {
                return data.toJSON();
            }
            if (!data) {
                return NSNull.new();
            }
            if (Array.isArray(data)) {
                return NSArray.arrayWithArray(data.map(serialize));
            }
            var node_1 = {};
            Object.keys(data).forEach(function (key) {
                var value = data[key];
                node_1[key] = serialize(value);
            });
            return NSDictionary.dictionaryWithDictionary(node_1);
        }
        default:
            return NSNull.new();
    }
}
exports.serialize = serialize;
function deserialize(data) {
    if (data instanceof NSNull) {
        return null;
    }
    if (data instanceof NSArray) {
        var array = [];
        for (var i = 0, n = data.count; i < n; i++) {
            array[i] = deserialize(data.objectAtIndex(i));
        }
        return array;
    }
    if (data instanceof NSDictionary) {
        var dict = {};
        for (var i = 0, n = data.allKeys.count; i < n; i++) {
            var key = data.allKeys.objectAtIndex(i);
            dict[key] = deserialize(data.objectForKey(key));
        }
        return dict;
    }
    return data;
}
exports.deserialize = deserialize;
function connect(uri, options) {
    var socketio = new SocketIO(uri, options || {});
    socketio.connect();
    return socketio;
}
exports.connect = connect;
//# sourceMappingURL=socketio.ios.js.map