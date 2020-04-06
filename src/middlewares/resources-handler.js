const { Game } = require('../models/game');
const { Question } = require('../models/question');
const { Answer } = require('../models/answer');

const resourcesHandler = async (req, res, next) => {
  const { gameId, questionId, answerId } = req.params;
  if (gameId) {
    const game = await Game.findById(gameId);
    if (!game)
      return res.status(404).json({
        message: `Game ${gameId} was not found`
      });
  }
  if (questionId) {
    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({
        message: `Question ${questionId} not found`
      });
  }
  if (answerId) {
    const answer = await Answer.findById(answerId);
    if (!answer)
      return res.status(404).json({
        message: `Answer ${answerId} was not found`
      });
  }

  return next();
};

module.exports = resourcesHandler;
