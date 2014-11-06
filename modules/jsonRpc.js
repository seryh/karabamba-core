var jsonRpc = function() {
    var _self = this,
        async = require('async'),
        Validator = require('jsonschema').Validator,
        _methods = {},
        _rpcErrors = {
            '-32700': {
                'message':'Parse error'
            },
            '-32600': {
                'message':'Invalid Request'
            },
            '-32601': {
                'message':'Method not found'
            },
            '-32602': {
                'message':'Invalid params'
            },
            '-32603': {
                'message':'Internal error'
            },
            '-32000': {
                'message':'Server error'
            }
        },
        _rpcSchema = {
            "id": "/rpcSchema",
            "type": "object",
            "properties": {
                "jsonrpc": {"required": true, "type": "string"},
                "method": {"required": true, "type": "string"},
                "id": {"required": true, "type": "integer"},
                "params": {"required": true}
            }
        };

    _self.validator = new Validator();

    function extend(target) {
        var sources = [].slice.call(arguments, 1);
        sources.forEach(function (source) {
            for (var prop in source) {
                target[prop] = source[prop];
            }
        });
        return target;
    }

    var _isParseError = function(rpcReq, res) {
        var validResponse = _self.validator.validate(rpcReq, _rpcSchema);
        if (validResponse.errors.length) {
            var dataError = [];
            validResponse.errors.forEach(function(error) {
                dataError.push(error.stack);
            });
            res.json(_genError(rpcReq, '-32700', dataError));
            return false;
        }

        if (typeof _methods[rpcReq.method] != 'function') {
            res.json(_genError(rpcReq, '-32601'));
            return false;
        }
        return true;

    }, _isParseErrorWS = function(rpcReq, socket) {
        var validResponse = _self.validator.validate(rpcReq, _rpcSchema);
        if (validResponse.errors.length) {
            var dataError = [];
            validResponse.errors.forEach(function(error) {
                dataError.push(error.stack);
            });
            socket.emit('jsonRPCResponse',_genError(rpcReq, '-32700', dataError));
            return false;
        }

        if (typeof _methods[rpcReq.method] != 'function') {
            socket.emit('jsonRPCResponse',_genError(rpcReq, '-32601'));
            return false;
        }
        return true;

    };

    var _genError = function(rpcReq, code, data) {
        data = data || false;
        return {"jsonrpc":"2.0",
                "error":{
                    "code":code,
                    "message":_rpcErrors[code].message,
                    "data": data
                },
               "id":rpcReq.id || 1};
    }, _genResult = function(rpcReq, result) {
        return extend({},{jsonrpc: "2.0", id: rpcReq.id},result);
    };

    _self.genError = _genError;

    _self.reg = function(method, callback) {
        _methods[method] = callback;
    };

    function rawBody(req, res, next, cbEnd) {
        req.setEncoding('utf8');
        var rawBody = '';
        req.on('data', function(chunk) {
            rawBody += chunk;
        });
        req.on('end', function(){
            cbEnd(rawBody);
        });
    }

    _self.wsHandler = function(rpcReq, socket) {
        var _respond = function(result) {
                socket.emit('jsonRPCResponse',_genResult(rpcReq, result));
            };

        try {
            rpcReq = JSON.parse(rpcReq);

        } catch (e) {

            socket.emit('jsonRPCResponse',_genError({id: -1},'-32700', e.message));
            return;
        }

        if (typeof rpcReq.length == "number") {
            var parse = function(rpcReq, callback) {
                _methods[rpcReq.method](rpcReq.params, function(result){
                    callback(null, _genResult(rpcReq, result));
                }, {
                    providerType: 'socket',
                    socket: socket,
                    req: null
                });
            };
            async.map(rpcReq, parse, function(err, results){
                socket.emit('jsonRPCResponse',results);
            });
            return;
        }

        if (_isParseErrorWS(rpcReq, socket)) {

            _methods[rpcReq.method](rpcReq.params, _respond, {
                providerType: 'socket',
                socket: socket,
                req: null
            });
        }

    };

    _self.handler = function(req, res, next) {
        var rpcReq = false,
            _respond = function(result) {
                res.json(_genResult(rpcReq, result));
            };

        try {

            req.body = JSON.parse(req.rawBody);

        } catch (e) {

            res.json(_genError({id: 1},'-32700', e.message));
            return;
        }

        var socket = null;
        for (var userKey in process.wsObserver.wsUsers) {
            var user = process.wsObserver.wsUsers[userKey];
            if ( user.sessionID === req.sessionID ) {
                socket = user.socket;
            }
        }
        if (typeof req.body.length == "number") {
            var parse = function(rpcReq, callback) {
                _methods[rpcReq.method](rpcReq.params, function(result){
                    callback(null, _genResult(rpcReq, result));
                }, {
                    providerType: 'http',
                    socket: socket,
                    req: req
                });
            };
            async.map(req.body, parse, function(err, results){
                res.json(results);
            });
            return;
        }
        rpcReq = req.body;
        if (_isParseError(rpcReq, res)) {

            _methods[rpcReq.method](rpcReq.params, _respond, {
                providerType: 'http',
                socket: socket,
                req: req
            });
        }
    };

    return _self;
};

module.exports = new jsonRpc();