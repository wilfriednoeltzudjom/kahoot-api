const joi = require('joi');

const { Answer, answerValidator } = require('../models/answer');
const { Question } = require('../models/question');

const createAnswer = async (questionId, params) => {
  await joi.validate(params, answerValidator);

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
  await joi.validate(
    params,
    joi.object().keys({
      title: joi.string(),
      isCorrect: joi.boolean()
    })
  );

  const answer = await getAnswer(answerId);

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
