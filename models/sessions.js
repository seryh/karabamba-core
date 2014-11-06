var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionsSchema = new Schema({
    _id  :  { type: String }
    , session   :  { type: String }
    , expires  :  { type: Date }
});

module.exports = mongoose.model('sessions', sessionsSchema);