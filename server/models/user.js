const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

//Model Schema
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        requried: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email address'
        }
    },
    password: {
        type: String,
        require: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

//Instance methods for single user
//Arrow function not used because we need .this functionality 
UserSchema.methods.generateAuthToken = function () {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET).toString();

    user.tokens.push({ access, token });

    return user.save().then(() => {
        return token;
    })

}

//Another instance method that deletes auth token on logout
UserSchema.methods.removeToken = function (token) {
    var user = this;

    return user.update({
        //$pull is a mongoose method that lets you remove an item from an array
        $pull: {
            tokens: {token}
        }
    })
    
}

//Return the users data back to them when successfully using POST method. Only include the _id and email as we don't want to send back the token and password etc
//This overrides an existing mongoose method for the User model. It's what exactly gets sent back when a mongoose model is converted into a JSON value
//http://stackoverflow.com/questions/11160955/how-to-exclude-some-fields-from-the-document
UserSchema.methods.toJSON = function () {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

//Model method (not instance), used to find user when an auth token is received. 
UserSchema.statics.findByToken = function (token) {
    var User = this;
    var decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }
    catch (e) {
        return Promise.reject();
    }

    //quotes need because . used
    return User.findOne({
        _id: decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
}

//Another model method to find a user by email/username and password
UserSchema.statics.findByCredentials = function (email, password) {
    var User = this;

    return User.findOne({email}).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        //using this promise format because bcrypt only has callback support, not promises
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res){
                    resolve(user);
                }
                else {
                    reject();
                }
            });
        });

    });
};

//middleware to hash the password before saving it to database
UserSchema.pre('save', function (next) {
    var user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            })
        })
    }
    else {
        next();
    }

});

var User = mongoose.model('User', UserSchema);

module.exports = { User };