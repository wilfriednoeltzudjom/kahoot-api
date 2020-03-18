const mongoose = require('mongoose');
const uuid = require('uuid');

const faker = require('../helpers/faker');

const { Schema } = mongoose;

const userSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  uuid: {
    type: String,
    default: uuid.v1()
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
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Factory
const UserFactory = {
  defaultFields() {
    return {
      lastName: faker.name.lastName(),
      firstName: faker.name.firstName(),
      password: faker.internet.password()
    };
  },

  generate() {
    return {
      ...this.defaultFields(),
      username: faker.random.alphaNumeric(8)
    };
  },

  generateWithInvalidUsername() {
    return {
      ...this.defaultFields(),
      username: faker.random.alphaNumeric(2)
    };
  },

  async create() {
    const user = new User(this.generate());
    await user.save();

    return user;
  }
};

module.exports = { User, UserFactory };
