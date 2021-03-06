var ds = require('../ds')
  , error = require('../error')
  , bcrypt = require('bcrypt')
  , create
  , read;

var validateEmail = function (address) {
  if (address.indexOf('@') === -1) {
    return false;
  }
  if (address.indexOf('.') === -1) {
    return false;
  }
  return true;
};

var findById = function (id, callback) {
  ds.findById('User', id, callback);
};

var findByEmail = function (email, callback) {
  ds.findByAttribute('User', 'email', email, callback);
};

var updateUser = function (id, user, callback) {
  ds.update('User', id, user, callback);
};

exports.create = create = function (user, callback) {
  // confirm the email is valid
  if (!validateEmail(user.email)) {
    return callback(error.invalidEmailError, null);
  }
  // confirm the the length of the password is valid
  if (user.password.new.length < 4 || user.password.new.length > 34) {
    return callback(error.invalidPasswordLengthError, null);
  }
  // check for existing account.
  findByEmail(user.email, function (err, u) {
    if (!err) {
      // no error indicates that an entity was found
      return callback(error.emailInUseError, null);
    }
    // no entity so lets create one
    // encrypt the password using bcrypt
    bcrypt.hash(user.password.new, 12, function (err, hash) {
      if (err) {
        return callback(err, null);
      }
      user.passwordHash = hash;
      // strip plain text password.
      user.password.new = '';
      user.password.current = '';
      user.password.isSet = true;
      // Save the user object.
      ds.create('User', user, function (err, u)  {
        return callback(err, user);
      });
    });
  });
};

exports.read = function (id, callback) {
  ds.findById('User', id, callback);
};

exports.update = function (id, user, callback) {

  // check for existing account.
  findById(id, function (err, u) {

    if (err) {
      // An error indicates that an entity was not found
      return callback(error.notFoundError, null);
    }
    // updated entity
    updateUser(id, user, callback);
  });
};

exports.authenticate = function (email, pass, callback) {

  findByEmail(email, function (err, user) {
    if (err) {
      callback(err, false);
    } else {
      bcrypt.compare(user.passwordHash, pass, function (err, res) {
        if (res) {
          callback(null, user);
        } else {
          callback(error.invalidPasswordError, null);
        }
      });
    }
  });
};