module.exports.index = function(data) {

	var appLibs = data.app.get('libs'),
        appInfo = data.app.get('appInfo'),
        url = require('url'),
        async = require('async');

    var urlObj =  url.parse(data.req.protocol + "://" +data.req.get('host')) ;

    //data.req.ext.socket сокет (с сессией) доступен и в екшенах
    // (при первом запросе недоступен, так как сессия еще не назначилась к сокету)

    data.res.render('index', {
        'title': 'karabamba',
        'wsHost': urlObj.hostname+':'+data.app.config.wsPort
    });

};
