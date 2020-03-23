const Joi = require('joi');

const { Question, questionValidator } = require('../models/question');
const { Answer } = require('../models/answer');
const { Game } = require('../models/game');

const { BadRequestError } = require('../utils/errors');

const checkAnswers = (answers = []) => {
  let correctAnswers = 0;
  for (let i = 0; i < answers.length; i += 1) {
    if (answers[i].isCorrect) correctAnswers += 1;
  }

  if (correctAnswers === 0)
    throw new BadRequestError('There should be at leat 1 correct answer');
};

const getQuestion = async questionId => {
  const question = await Question.findById(questionId).populate('answers');
  return question;
};

const createQuestion = async (gameId, params, image) => {
  await Joi.validate(params, questionValidator);

  const { answers, ...details } = params;

  checkAnswers(answers);

  const question = new Question({
    ...details,
    game: gameId
  });

  const answersArray = answers.map(
    answer =>
      new Answer({
        ...answer,
        question: question._id
      })
  );

  Object.assign(question, {
    answers: answersArray.map(answer => answer._id)
  });
  if (image) Object.assign(question, image);

  await question.save();
  await Answer.insertMany(answersArray);
  await Game.updateOne(
    {
      _id: gameId
    },
    { $push: { questions: question._id } }
  );

  return getQuestion(question._id);
};

const getQuestions = gameId => {
  return Question.find({
    game: gameId
  });
};

const updateQuestion = async (questionId, params, image) => {
  const question = await getQuestion(questionId);

  await Joi.validate(
    params,
    Joi.object().keys({
      title: Joi.string(),
      image: Joi.string(),
      points: Joi.number()
        .min(100)
        .max(1000)
        .error(() => ({
          message: 'Points must be between 100 and 1000'
        })),
      time: Joi.number()
        .min(10)
        .error(() => ({
          message: 'Time must be at least 10s'
        }))
    })
  );

  Object.assign(question, params);
  if (image) Object.assign(question, image);
  await question.save();

  return question;
};

const deleteQuestion = async ({ gameId, questionId }) => {
  await Game.updateOne(
    {
      _id: gameId
    },
    { $pull: { questions: questionId } }
  );
  await Answer.deleteMany({
    question: questionId
  });
  await Question.deleteOne({ _id: questionId });
};

module.exports = {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion
};
