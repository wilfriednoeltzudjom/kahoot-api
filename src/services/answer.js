const Joi = require('joi');

const { Answer, answerValidator } = require('../models/answer');
const { Question } = require('../models/question');

const { BadRequestError } = require('../utils/errors');

const createAnswer = async (questionId, params) => {
  await Joi.validate(params, answerValidator);

  const answer = new Answer({
    ...params,
    question: questionId
  });

  await answer.save();
  await Question.updateOne(
    {
      _id: questionId
    },
    { $push: { answers: answer._id } }
  );

  return answer;
};

const getAnswer = async answerId => {
  const answer = Answer.findById(answerId);
  return answer;
};

const updateAnswer = async (answerId, params) => {
  const answer = await getAnswer(answerId);

  if (!params) throw new BadRequestError('There is no updates required');

  await Joi.validate(
    params,
    Joi.object().keys({
      title: Joi.string(),
      isCorrect: Joi.boolean()
    })
  );

  Object.assign(answer, params);
  await answer.save();

  return answer;
};

const deleteAnswer = async ({ questionId, answerId }) => {
  await Question.updateOne(
    {
      _id: questionId
    },
    { $pull: { answers: answerId } }
  );
  await Answer.deleteOne({ _id: answerId });
};

module.exports = {
  createAnswer,
  updateAnswer,
  deleteAnswer
};
