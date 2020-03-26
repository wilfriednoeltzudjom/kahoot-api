const { Question } = require('../models/question');
const { Answer } = require('../models/answer');
const { Game } = require('../models/game');

const { BadRequestError } = require('../utils/errors');

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
  const correctAnswer = !!answers.find(answer => answer.isCorrect);
  if (!correctAnswer)
    throw new BadRequestError('There should be at leat 1 correct answer');

  checkDuplicatePositionsInAnswers(answers, 0);
};

const getQuestion = async questionId => {
  const question = await Question.findById(questionId).populate('answers');
  return question;
};

const createQuestion = async (gameId, params, image) => {
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
