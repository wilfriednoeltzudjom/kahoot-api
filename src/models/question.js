const mongoose = require('mongoose');
const uuid = require('uuid');

const faker = require('../helpers/faker');

const { AnswerFactory } = require('./answer');

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    uuid: {
      type: String,
      default: () => uuid.v1()
    },
    title: {
      type: String,
      required: true
    },
    image: String,
    imageId: String,
    points: {
      type: Number,
      required: true,
      min: 0,
      max: 2000
    },
    time: {
      type: Number,
      required: true,
      min: 5
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
  },
  {
    timestamps: true
  }
);

const Question =
  mongoose.models.Question || mongoose.model('Question', questionSchema);

// Factory
const QuestionFactory = {
  generate({ skipTitle = false, skipPoints = false, skipTime = false } = {}) {
    const question = {
      image: faker.image.imageUrl()
    };

    if (!skipTitle) question.title = faker.random.words(20);
    if (!skipPoints) question.points = faker.random.number(2000);
    if (!skipTime) question.time = faker.random.number(5) + 5;

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
  },

  async createAnswers(question) {
    const answers = await AnswerFactory.createMany({
      question: question._id
    });
    Object.assign(question, { answers });
    return answers;
  },

  async createMany({ game, size = 2 }) {
    let questions = [];
    for (let i = 0; i < size; i += 1) {
      questions.push(this.generate());
    }

    questions = questions.map(
      question =>
        new Question({
          ...question,
          game
        })
    );

    const promises = [];
    for (let i = 0; i < questions.length; i += 1) {
      promises.push(this.createAnswers(questions[i]));
    }
    await Promise.all(promises);

    await Question.insertMany(questions);

    return questions;
  }
};

module.exports = { Question, QuestionFactory };
