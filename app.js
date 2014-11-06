var express = require('express'),
    d = require('domain').create(),
    load = require('express-load'),
    app = express(),
    extend = require('extend'),
    util = require('util'),
    MongoStore = require('connect-mongo')(express),
    mongoose = require('mongoose'),
    libs = {
        'load':load,
        'mongoose':mongoose,
        'wsObserver':null,
        'util':util
    }, 
    appInfo = {
        'appDir': __dirname,
        'controllersDir': __dirname + '/controllers',
        'modelsDir': __dirname + '/models',
        'modulesDir': __dirname + '/modules'
    };

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

process.stdin.on('data', function(data) {
  if (data == 'exit\n') process.exit();
});

load('config').into(app);

app.info = require('./package.json');

app.users = app.config.users; //todo: херня, выпилить, пока нужна только для тестиррования работы с сессиями

app.config = (process.env.NODE_ENV == 'development') ? app.config.develop : app.config.production;

function mongoAuth(user, pass, onConnect) {
    onConnect = onConnect || function() {};

    mongoose.connect(util.format('mongodb://%s/%s', app.config.mongo.host, app.config.mongo.db), {
        server: { poolSize: 5 },
        user: user,
        pass: pass
    });

    var db = mongoose.connection;

    db.on('error', function(err){
        if (err.code == 18) { // auth fails, если пароль не подошел то пробуем без пароля
            mongoAuth(null, null);
        } else {              // если монга лежит то попробуем позже
            setTimeout(function(){
                throw new Error('mongo down, Hello forever');
            }, 15000);
        }
    });

    db.once('open', function callback () {
        onConnect();
    });

    return mongoose;
}


function appWithHandleErrors() {

    libs.wsObserver = require(appInfo.modulesDir + '/wsObserver.js');
    libs.wsObserver.start(extend({}, app.config, {
        onWSUsersChanges : function(wsUsers) { // не уверен что этот кусок кода должен быть тут, но красивого места пока не нашел
            for (var userKey in wsUsers) {
                var user = wsUsers[userKey];
                user.socket.emit('runScopeMethod', {
                    controllerName: 'navbarController',
                    methodName: 'setOnlineCount',
                    argument: Object.keys(wsUsers).length
                });
            }
        }
    }));

    app.configure('development', function(){
        app.use('/public', express.static('public'));
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function(){
        var oneYear = 31557600000;
        app.use('/public', express.static('public', { maxAge: oneYear }));
        app.use(express.errorHandler({ dumpExceptions: false, showStack: false }));
    });

    app.configure(function(){
        app.set('view engine', 'ejs');
        app.set('views', __dirname + '/views');
        app.set('appInfo', appInfo);
        app.set('libs', libs);
        app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
            if (0 == req.url.indexOf('/api')) {
                req.rawBody = '';
                req.setEncoding('utf8');
                req.on('data', function(chunk) {
                    req.rawBody += chunk;
                });
                req.on('end', function() {
                    next();
                });
            } else {
                express.bodyParser()(req, res, next);
            }

        });

        app.use(express.cookieParser());

        app.use(express.session({
            secret: "alexina",
            maxAge  : new Date(Date.now() + 3600000), //3600000 = 1 Hour
            store: new MongoStore({
                db: mongoose.connection.db
            }),
            cookie: {
                httpOnly: false,
                maxAge: new Date(Date.now() + 3600000)
            }
        }));
        app.use(express.methodOverride());
        app.use(app.router);

    });

    load('routes').into(app, libs, appInfo);

    process.config = app.config;
    process.wsObserver = libs.wsObserver;

    app.listen(app.config.port);
}

d.on('error', function(er) {
    console.log('->',er.stack);
    process.exit(1);
});

mongoAuth(app.config.mongo.username, app.config.mongo.password, function() {
    d.run(appWithHandleErrors);
});



console.log('Web server as running with %s mode on server: %s:%s', process.env.NODE_ENV, '127.0.0.1', app.config.port);