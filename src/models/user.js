const mongoose = require('mongoose');
const uuid = require('uuid');
const Joi = require('joi');

const faker = require('../helpers/faker');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    uuid: {
      type: String,
      default: () => uuid.v1()
    },
    lastName: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true,
      minlength: 5
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Validator
const userValidator = Joi.object().keys({
  username: Joi.string()
    .regex(/^[a-zA-Z0-9]{5,}$/)
    .required()
    .error(() => ({
      message:
        'Username is required and must be at least 5 characters with only letters and numbers'
    })),
  lastName: Joi.string()
    .required()
    .error(() => ({
      message: 'Lastname is required'
    })),
  firstName: Joi.string()
    .required()
    .error(() => ({
      message: 'Firstname is required'
    })),
  password: Joi.string()
    .required()
    .error(() => ({
      message: 'Password is required'
    }))
});

// Factory
const UserFactory = {
  generate({
    skipUsername = false,
    skipLastName = false,
    skipFirstName = false,
    skipPassword = false,
    usernameLength = 8
  }) {
    const user = {};

    if (!skipUsername)
      user.username = faker.random.alphaNumeric(usernameLength);
    if (!skipLastName) user.lastName = faker.name.lastName();
    if (!skipFirstName) user.firstName = faker.name.firstName();
    if (!skipPassword) user.password = faker.random.word(1);

    return user;
  },

  async create() {
    const user = new User(this.generate({}));
    await user.save();

    return user;
  }
};

module.exports = { User, userValidator, UserFactory };
