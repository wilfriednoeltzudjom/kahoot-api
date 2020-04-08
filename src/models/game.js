const mongoose = require('mongoose');
const uuid = require('uuid');

const faker = require('../helpers/faker');

const { Schema } = mongoose;

const gameSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  uuid: {
    type: String,
    default: () => uuid.v1()
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  pin: {
    type: String,
    required: true,
    unique: true
  },
  cover: {
    type: String
  },
  coverId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'ended'],
    default: 'pending'
  },
  players: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Player'
    }
  ],
  questions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Question'
    }
  ],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);

// Factory
const GameFactory = {
  generate({ skipTitle = false }) {
    const game = {
      description: faker.lorem.words(20),
      pin: faker.random.alphaNumeric(8)
    };

    if (!skipTitle) game.title = faker.random.words(20);

    return game;
  },

  async create({ user }) {
    const game = new Game({
      ...this.generate({}),
      user
    });
    await game.save();

    return game;
  }
};

module.exports = { Game, GameFactory };
