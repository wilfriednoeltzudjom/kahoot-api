const { Game } = require('../models/game');
const { Question } = require('../models/question');
const { Answer } = require('../models/answer');

const { ResourceNotFoundError } = require('../utils/errors');

const resourcesHandler = async (req, res, next) => {
  const { gameId, questionId, answerId } = req.params;

  if (gameId) {
    const game = await Game.findById(gameId);
    if (!game) throw new ResourceNotFoundError(`Game ${gameId} was not found`);
  }
  if (questionId) {
    const question = await Question.findById(questionId);
    if (!question)
      throw new ResourceNotFoundError(`Question ${questionId} not found`);
  }
  if (answerId) {
    const answer = await Answer.findById(answerId);
    if (!answer)
      throw new ResourceNotFoundError(`Answer ${answerId} was not found`);
  }

  next();
};

module.exports = resourcesHandler;
