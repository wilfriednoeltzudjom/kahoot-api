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
  generate({ isCorrect = false, position = 0 }) {
    return {
      title: faker.lorem.sentence(20),
      isCorrect,
      position
    };
  },

  generateMany({ size = 2 }) {
    const answers = [];
    for (let i = 0; i < size; i += 1) {
      answers.push(this.generate({ position: i + 1 }));
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
    let answers = this.generateMany({ size });

    answers = answers.map(
      answer =>
        new Answer({
          ...answer,
          question
        })
    );
    await Answer.insertMany(answers);

    return answers.map(answer => answer._id);
  }
};

module.exports = { Answer, AnswerFactory };
