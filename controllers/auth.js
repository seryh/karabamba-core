
module.exports.index = function(data) {
    data.res.render('auth', {
        'title': 'karabamba'
    });
};

module.exports.login = function(data) {
    if (data.type == 'post' && data.req.body.hasOwnProperty('login') && data.req.body.hasOwnProperty('password')) {
        if (data.req.body.login in data.app.users) {
            var crypto = require('crypto');
            var hash = crypto.createHash('md5').update(data.req.body.password).digest("hex");

            if (hash == crypto.createHash('md5').update(data.app.users[data.req.body.login].password).digest("hex")) {

                data.req.session.user = JSON.parse( JSON.stringify(data.app.users[data.req.body.login]) );
                delete data.req.session.user.password;
                data.req.session.cookie.maxAge = 14 * 24 * 3600000; //2 weeks
                //data.req.session.cookie.maxAge = 60*1000; //60*1000 minute
                data.res.redirect('/');

            } else {
                data.res.redirect('/auth?fail');
            }
        } else {
            data.res.redirect('/auth?fail');
        }
    } else {
        data.res.redirect('/auth');
    }
};

module.exports.logout = function(data) {
    delete data.req.session.user;
    data.res.redirect('/auth');
};