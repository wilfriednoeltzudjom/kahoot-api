const mongoose = require('mongoose');
const uuid = require('uuid');

const faker = require('../helpers/faker');

const { Schema } = mongoose;

const playerAnswerSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  uuid: {
    type: String,
    default: uuid.v1()
  },
  responseTime: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: {
    type: Schema.Types.ObjectId,
    ref: 'Answer',
    required: true
  }
});

const playerSchema = new Schema({
  joinedAt: {
    type: Date,
    default: Date.now
  },
  uuid: {
    type: String,
    default: uuid.v1()
  },
  username: {
    type: String,
    required: true
  },
  totalScore: {
    type: Number,
    default: 0
  },
  position: {
    type: Number,
    default: 0
  },
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  playerAnswers: [playerAnswerSchema]
});

const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);

// Factory
const PlayerFactory = {
  generate({ skipUsername = false }) {
    return !skipUsername
      ? {
          username: faker.random.alphaNumeric(8)
        }
      : {};
  },

  async create({ game }) {
    const player = new Player({
      ...this.generate({}),
      game
    });
    await player.save();

    return player;
  },

  generatePlayerAnswer() {
    return {
      responseTime: faker.random.number(10000),
      points: faker.random.number(10000)
    };
  }
};

module.exports = { Player, PlayerFactory };
