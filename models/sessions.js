var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionsSchema = new Schema({
    _id         :  { type: String }
    , session   :  { type: String }
    , expires   :  { type: Date }
});

var sessions = mongoose.model('sessions', sessionsSchema);

sessions._sessionSave = function(sessionID, sessionData, cb) {
    this.findById(sessionID, function (err, sess) {
        cb = cb || function(){};
        if (!err && Boolean(sessionData) && Boolean(sess)) {
            sess.session = JSON.stringify(sessionData);
            sess.save(function (err) {
                cb(err);
                if (err) console.log('sessions save::', err);
            });
        }
    });
};

module.exports = sessions;