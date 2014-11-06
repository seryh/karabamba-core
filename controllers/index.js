module.exports.index = function(data) {

	var appLibs = data.app.get('libs'),
        appInfo = data.app.get('appInfo'),
        url = require('url'),
        async = require('async');

    var urlObj =  url.parse(data.req.protocol + "://" +data.req.get('host')) ;

    //data.req.socket сокет (с сессией) доступен и в екшенах

    data.res.render('index', {
        'title': 'karabamba',
        'wsHost': urlObj.hostname+':'+data.app.config.wsPort
    });

};
