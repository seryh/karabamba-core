/**
 * Created by gigimon on 11/4/14.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
      email      :  { type: String } // email == login
    , password   :  { type: String }
    , roles      :  { type: String }
    , picFile    :  { type: String } // avatar file path
    , name       :  { type: String }
});

module.exports = mongoose.model('users', userSchema);
