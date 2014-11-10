var extend = require('extend'),
    _ = require('underscore'),
    sessions = require('../models/sessions');

var wsUser = function(data) {
    data = extend({}, {
        'id': null,
        'socket': null,
        'relationsIDs': [],
        'sessionID': null,
        'session': null,
        'socketType': 'webSocket'
    }, data);

    var self = this,
        _session = data.session;

    self.id = data.id;
    self.socket = data.socket;
    self.relationsIDs = data.relationsIDs;
    self.sessionID = data.sessionID;

    self.socketType = data.socketType;

    self.findForSession = function(wsUsers, onFind) {
        onFind = onFind || function() {};
        if (Boolean(self.sessionID))
            for (var userKey in wsUsers) {
                var user = wsUsers[userKey];
                if ( user.sessionID === self.sessionID && user.id !== self.id) {
                    onFind(user);
                    break;
                }
            }
    };

    // смотрим, не открыто ли унас уже соединения с этим пользователем,
    // todo:
    // помним что соединение может присутствовать в массиве но быть уже протухшим и оно будет автоматически
    // удалено в дальнейшем
    self.initSession = function(sessionID, cb) {
        cb = cb || function() {};
        var isUser = false,
            wsUsers = process.wsObserver.wsUsers; // хз как красиво избавится от этого глобала в этом коде
        self.sessionID = sessionID;
        self.findForSession(wsUsers, function onFind($user) {
            self.sessionID = $user.sessionID;
            self.setSession($user.getSession());

            /*связь между соединениями*/
            self.relationsIDs = _.flatten([$user.id, $user.relationsIDs]);

            $user.relationsIDs.forEach(function(id) {
                if ( Boolean(wsUsers[id]) ) {
                    wsUsers[id].relationsIDs.push(self.id);
                }
            });

            $user.relationsIDs.push(self.id);

            cb(null, {session : $user.getSession(), sessionID : $user.sessionID});
            isUser = true;
        });

        if (isUser === false) {
            sessions.find({"_id" : sessionID}, function (err, docs) {

                if (err) {
                    cb(err, null);
                    return false;
                }
                if (!Boolean(docs[0].session)) {
                    console.log('wsObserver initSession error, session undefined::',docs);
                    cb('wsObserver initSession error, session undefined', null);
                    return false;
                }

                self.setSession( JSON.parse(docs[0].session) );
                cb(null, {session : self.getSession(), sessionID : sessionID});
            });
        }
        //console.log('--> initSession::\n',process.wsObserver.wsUsers);
    };

    self.getRelationsSockets = function() {
        var wsUsers = process.wsObserver.wsUsers,
            sockets = [];
        self.relationsIDs.forEach(function (userKey) {
            if ( Boolean(wsUsers[userKey]) ) sockets.push(wsUsers[userKey]);
        });
        return sockets;
    };

    self._setSessionPrivate = function(newSession) {
        _session = newSession;
    };

    self.extSession = function(ext) {
        _session = extend({}, _session, ext);
        sessions._sessionSave(self.sessionID, _session);

        self.getRelationsSockets().forEach(function (socket) {
            socket._setSessionPrivate(_session);
        });

        return _session;
    };

    self.getSession = function() {
        return _session;
    };

    self.setSession = function(newSession) {
        //todo: при зименении сессии нужно помнить что могут быть несколько подключений см relationsIDs
        _session = newSession;
        sessions._sessionSave(self.sessionID, _session);

        self.getRelationsSockets().forEach(function (socket) {
            socket._setSessionPrivate(_session);
        });
        return _session;
    };

    return this;
};

wsObserver = function () {
    var self = this;
    self.io = null;
    self.wsUsers = {};
    self.jsonRpc = null;
    self.options = null;

    var _initClient = function (socket) {
        self.wsUsers[socket.id] = new wsUser( {
            'id': socket.id,
            'socket': socket
        } );

        socket.user = self.wsUsers[socket.id];
        self.options.onWSUsersChanges(self.wsUsers);
    };

    var _initEvents = function(socket) {

        socket.on('jsonRPC', function (jsonRPCQuery) {
            self.jsonRpc.wsHandler(jsonRPCQuery, socket);
        });

        socket.on('disconnect', function () {
            sessions._sessionSave(socket.user.sessionID, socket.user.session);

            delete self.wsUsers[socket.id];
            self.options.onWSUsersChanges(self.wsUsers);
        });
    };

    self.start = function (opt) {
        opt = extend({}, {
            wsPort: 4040,
            onWSUsersChanges: function() {},
            listeners: []
        }, opt);
        self.options = opt;
        self.jsonRpc = require('../controllers/api.js')();
        opt.listeners.push(_initClient, _initEvents);
        self.io = require('socket.io')();
        self.io.on('connection', self.listener);
        self.io.listen(opt.wsPort);
        console.log('wsObserver as running with %s mode on server: %s:%s',process.env.NODE_ENV, '127.0.0.1', opt.wsPort);
    };

    self.listener  = function(socket) {
        /*
         * возможность добавлять сколько удодно доп функций слушающих подключение
         */
        self.options.listeners.forEach(function (listenerFn) {
            listenerFn(socket);
        });

    };

};

module.exports = new wsObserver();
