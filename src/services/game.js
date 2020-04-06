const { Game } = require('../models/game');

const questionService = require('./question');

const { deleteImage } = require('../helpers/cloudinary');

const populateParams = [
  {
    path: 'questions',
    populate: 'answers'
  },
  {
    path: 'players'
  }
];

const generateGamePin = user => {
  const username = user.username.toUpperCase();
  const timestamp = String(Date.now());
  const pin = [];

  for (let i = 0; i < 8; i += 1) {
    if (i % 2 === 0) {
      pin.push(timestamp[Math.floor(Math.random() * timestamp.length)]);
    } else {
      pin.push(username[Math.floor(Math.random() * username.length)]);
    }
  }

  return pin.join('');
};

const createGame = async (user, params, { cover, coverId } = {}) => {
  const game = new Game({
    ...params,
    user: user._id,
    pin: generateGamePin(user)
  });
  if (cover) Object.assign(game, { cover, coverId });
  await game.save();

  return game;
};

const getGames = async userId =>
  Game.find({ user: userId }).populate(populateParams);

const getGame = async gameId => Game.findById(gameId).populate(populateParams);

const updateGame = async (gameId, params, { cover, coverId } = {}) => {
  const game = await getGame(gameId);

  Object.assign(game, params);
  if (cover) {
    if (game.coverId) await deleteImage(game.coverId);
    Object.assign(game, { cover, coverId });
  }
  await game.save();

  return game;
};

const addQuestionToGame = async (gameId, questionId) => {
  await Game.updateOne(
    {
      _id: gameId
    },
    { $push: { questions: questionId } }
  );
};

const deleteGame = async gameId => {
  const game = await getGame(gameId);

  // Delete questions and answers
  const questions = await questionService.getQuestions(gameId);
  if (questions.length > 0) {
    const promises = [];
    questions.forEach(question => {
      promises.push(
        questionService.deleteQuestion({ gameId, questionId: question._id })
      );
    });

    await Promise.all(promises);
  }

  // Delete game
  if (game.coverId) await deleteImage(game.coverId);
  await Game.deleteOne({ _id: gameId });
};

module.exports = {
  createGame,
  getGames,
  getGame,
  updateGame,
  addQuestionToGame,
  deleteGame
};
