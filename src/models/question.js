const mongoose = require('mongoose');
const uuid = require('uuid');
const Joi = require('joi');

const { answerValidator } = require('./answer');

const faker = require('../helpers/faker');

const { Schema } = mongoose;

const questionSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  uuid: {
    type: String,
    default: uuid.v1()
  },
  title: {
    type: String,
    required: true
  },
  image: String,
  points: {
    type: Number,
    required: true
  },
  time: {
    type: Number,
    required: true
  },
  answers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Answer'
    }
  ],
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  }
});

const Question =
  mongoose.models.Question || mongoose.model('Question', questionSchema);

// Validator
const questionValidator = Joi.object().keys({
  title: Joi.string()
    .required()
    .error(() => ({
      message: 'Title is required'
    })),
  points: Joi.number()
    .min(100)
    .max(1000)
    .required()
    .error(() => ({
      message: 'Points must be between 100 and 1000'
    })),
  time: Joi.number()
    .min(10)
    .required()
    .error(() => ({
      message: 'Time must be at least 10s'
    })),
  answers: Joi.array()
    .items(answerValidator)
    .min(2)
    .required()
    .error(() => ({
      message: 'There should be at least 2 answers'
    }))
});

// Factory
const QuestionFactory = {
  generate({ skipTitle = false, skipPoints = false, skipTime = false }) {
    const question = {
      image: faker.image.imageUrl()
    };

    if (!skipTitle) question.title = faker.random.words(20);
    if (!skipPoints) question.points = faker.random.number(10000);
    if (!skipTime) question.time = faker.random.number(10000);

    return question;
  },

  async create({ game, answers }) {
    const question = new Question({
      ...this.generate({}),
      answers,
      game
    });
    await question.save();

    return question;
  }
};

module.exports = { Question, questionValidator, QuestionFactory };
