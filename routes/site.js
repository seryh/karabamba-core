module.exports = function(app, libs, appInfo) {
	var util = require('util'),
        apiController = require(appInfo.controllersDir+'/api')(),
	    fs = require('fs');

	var isController = function(controllerName) {
		return fs.existsSync(appInfo.controllersDir + '/' + controllerName+'.js')
	},
	notFound = function(res) {
	    res.render('404', {
	        title: '404'
	    });
    },
    printTitle = function(res, title) {
        res.render('404', {
            title: title
        });
    };

    app.post('/api', function(req, res, next) {
		/*
        if (req.session.hasOwnProperty('user') == false) {
            res.json(apiController.genError({id: 1}, '-32600', 'access denied'));
            return false;
        }

        if (req.session.user.group != 'admin') {
            res.json(apiController.genError({id: 1}, '-32600', 'access denied'));
            return false;
        }*/
        apiController.handler(req, res, next);
    });

	app.all('*', function(req, res, next) {
		var socket = null;
		for (var userKey in process.wsObserver.wsUsers) {
			var user = process.wsObserver.wsUsers[userKey];
			if ( user.sessionID === req.sessionID ) {
				socket = user.socket;
			}
		}
		req.socket = socket;
		next();
		/*
		if (/^\/public/ig.test(req.path) || /^\/auth/ig.test(req.path)) {
			next();	
		} else {
			if (req.session.hasOwnProperty('user')) {
				next();	
			} else {
				res.redirect('/auth');
			}
		}*/
	});

    app.get('/', function(req, res, next){
        if (!isController('index')) {
            notFound(res);
            return
        }

        var controller = require(appInfo.controllersDir + '/index');
        if (typeof controller['index'] == 'undefined') {
            notFound(res);
            return
        }

        controller.index({
            'req':req,
            'res':res,
            'next':next,
            'app':app,
            'type':'get'
        });
    });

    app.post('/:controller/:postaction', function(req, res, next){
		if (!isController(req.params.controller)) {
            notFound(res);
            return
        }
		var controller = require(appInfo.controllersDir + '/' + req.params.controller);
		if (typeof controller[req.params.postaction] == 'undefined') {
            notFound(res);
            return
        }

		controller[req.params.postaction]({
			'req':req, 
			'res':res, 
			'next':next, 
			'app':app,
			'type':'post'
		});
    });

	app.get('/:controller/:action', function(req, res, next){
		if (!isController(req.params.controller)) {
            notFound(res);
            return
        }

		var controller = require(appInfo.controllersDir + '/' + req.params.controller);
		if (typeof controller[req.params.action] == 'undefined') {
            notFound(res);
            return
        }

		controller[req.params.action]({
			'req':req, 
			'res':res, 
			'next':next, 
			'app':app,
			'type':'get'
		});
	});

	app.get('/:controller', function(req, res, next){
		if (!isController(req.params.controller)) {
            notFound(res);
            return
        }
		var controller = require(appInfo.controllersDir + '/' + req.params.controller);
		if (typeof controller['index'] == 'undefined') {
            notFound(res);
            return
        }

		controller.index({
			'req':req, 
			'res':res, 
			'next':next, 
			'app':app,
			'type':'get'
		});
	});

};
