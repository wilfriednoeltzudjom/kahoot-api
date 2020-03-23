const bcrypt = require('bcryptjs');
const Joi = require('joi');

const { User, userValidator } = require('../models/user');

const { BadRequestError } = require('../utils/errors');

const signUp = async params => {
  await Joi.validate(params, userValidator);

  const { username, password } = params;

  const existingUser = await User.findOne({ username });
  if (existingUser)
    throw new BadRequestError(`Username ${username} already exists`);

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
