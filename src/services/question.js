const { Question } = require('../models/question');
const { Answer } = require('../models/answer');
const { Game } = require('../models/game');

const { deleteImage } = require('../helpers/cloudinary');

const { BadRequestError } = require('../utils/errors');

const answerService = require('./answer');

const checkDuplicatePositionsInAnswers = (answers = [], index) => {
  if (index < answers.length - 1) {
    const currentPosition = answers[index].position;
    const duplicatePosition = answers.find(
      (answer, i) => i !== index && answer.position === currentPosition
    );
    if (duplicatePosition)
      throw new BadRequestError(
        'There is a duplicate postion in your answers array'
      );

    checkDuplicatePositionsInAnswers(answers, index + 1);
  }
};

const checkAnswers = (answers = []) => {
  console.log(JSON.stringify(answers));
  const correctAnswer = !!answers.find(answer => answer.isCorrect);
  if (!correctAnswer)
    throw new BadRequestError('There should be at least 1 correct answer');

  checkDuplicatePositionsInAnswers(answers, 0);
};

const getQuestion = async questionId => {
  const question = await Question.findById(questionId).populate('answers');
  return question;
};

const createQuestion = async (gameId, params, { image, imageId } = {}) => {
  const { answers, ...details } = Object.assign(params, {
    answers: params.answers.map(answer => JSON.parse(answer))
  });

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
  if (image) Object.assign(question, { image, imageId });

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

const getQuestions = gameId => Question.find({ game: gameId });

const updateQuestion = async (questionId, params, { image, imageId } = {}) => {
  const question = await Question.findById(questionId);

  const { answers, ...updates } = Object.assign(params, {
    answers: params.answers.map(answer => JSON.parse(answer))
  });

  // update answers
  const updateTasks = answers.map(answer => {
    const { _id, ...answerUpdates } = answer;
    return answerService.updateAnswer(_id, answerUpdates);
  });
  await Promise.all(updateTasks);

  Object.assign(question, updates);
  if (image) {
    if (question.imageId) await deleteImage(question.imageId);
    Object.assign(question, { image, imageId });
  }

  if (params.image === '') {
    if (params.imageId) await deleteImage(params.imageId);
  }

  await question.save();

  return getQuestion(questionId);
};

const deleteQuestion = async ({ gameId, questionId }) => {
  const question = await getQuestion(questionId);

  await Game.updateOne(
    {
      _id: gameId
    },
    { $pull: { questions: questionId } }
  );
  await Answer.deleteMany({
    question: questionId
  });

  // Delete question
  if (question.imageId) await deleteImage(question.imageId);
  await Question.deleteOne({ _id: questionId });
};

module.exports = {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion
};
