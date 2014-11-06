/**
 * Created by gigimon on 11/4/14.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionsSchema = new Schema({
    login  :  { type: String }
    , password   :  { type: String }
    , name   :  { type: String }
    , email  :  { type: String }
});

module.exports = mongoose.model('users', sessionsSchema);
