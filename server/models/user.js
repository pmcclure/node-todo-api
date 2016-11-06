var mongoose = require('mongoose');

var User = mongoose.model('User', {
    email: {
        type: String,
        requried: true,
        trim: true,
        minlength: 1
    }
});

module.exports = {User};