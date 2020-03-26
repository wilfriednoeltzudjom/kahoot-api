const mongoose = require('mongoose');
const uuid = require('uuid');

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
  imageId: String,
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

module.exports = { Question, QuestionFactory };
