const mongoose = require('mongoose');
const uuid = require('uuid');

const faker = require('../helpers/faker');

const { Schema } = mongoose;

const answerSchema = new Schema({
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
  isCorrect: {
    type: Boolean,
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }
});

const Answer = mongoose.models.Answer || mongoose.model('Answer', answerSchema);

// Factory
const AnswerFactory = {
  generate({ isCorrect = false }) {
    return {
      title: faker.lorem.sentence(20),
      isCorrect
    };
  },

  generateMany({ size = 2 }) {
    const answers = [];
    for (let i = 0; i < size; i += 1) {
      answers.push(this.generate({}));
    }
    answers[0].isCorrect = true;

    return answers;
  },

  async create({ isCorrect, question }) {
    const answer = new Answer(...this.generate({ isCorrect }), question);
    await answer.save();

    return answer;
  },

  async createMany({ size = 2, question }) {
    const answers = this.generateMany({ size });

    return Answer.insertMany(
      answers.map(answer => ({
        ...answer,
        question
      }))
    );
  }
};

module.exports = { Answer, AnswerFactory };
