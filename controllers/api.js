module.exports = function() {

    var jsonRpc = require('../modules/jsonRpc'),
        extend = require('extend'),
        sessions = require('../models/sessions');

    jsonRpc.reg('setSessionToSocket', function (params, respond, ext) {

        if (ext.providerType == 'socket') {

            ext.socket.user.initSession(params.session, function(err, sessionInfo) {
                respond({ result: sessionInfo });
            });

        } else {
            respond({ error: 'this method support only socket provider' });
        }
    });

    jsonRpc.reg('getSession', function(params, respond, ext){
        if (ext.socket) {
            respond({ result: {session : ext.socket.user.getSession()} });
        } else {
            respond({ error: 'socket undefined' });
        }
    });

    jsonRpc.reg('getUserInfo', function(params, respond, ext){
        var session;

        if (ext.req) {
            session = ext.req.session;
        } else if (ext.socket) {
            session = ext.socket.user.getSession();
        }

        if (session.hasOwnProperty('user') == false) {
            respond({ result: {user: null} });
            return false;
        }
        respond({ result: {user: session.user} });
    });

    jsonRpc.reg('addToSession', function(params, respond, ext){
        if (ext.socket) {
            extend(ext.socket.user.session, params);
            respond({ result: {session : ext.socket.user.getSession()} });
        } else {
            respond({ error: 'socket undefined' });
        }
    });

    jsonRpc.reg('login', function(params, respond, ext){

    });

    jsonRpc.reg('logout', function(params, respond, ext){

    });

    return jsonRpc;
};
