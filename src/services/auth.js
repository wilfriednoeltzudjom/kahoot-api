const bcrypt = require('bcryptjs');

const { User } = require('../models/user');

const { BadRequestError } = require('../utils/errors');

const signUp = async params => {
  const { username, password } = params;

  if (!username) throw new BadRequestError('Username is required');

  if (!username.match(/^[a-zA-Z0-9]{5,}$/))
    throw new BadRequestError(
      'Username should be composed of letters or/and numbers and have a length of 5 characters'
    );

  const existingUser = await User.findOne({ username });
  if (existingUser)
    throw new BadRequestError(`Username ${username} is already assigned`);

  const hash = await bcrypt.hash(password, 10);
  const user = new User({
    ...params,
    password: hash
  });

  return user.save();
};

module.exports = {
  signUp
};
