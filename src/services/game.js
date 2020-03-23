const Joi = require('joi');

const { Game, gameValidator } = require('../models/game');

const questionService = require('./question');

const { BadRequestError } = require('../utils/errors');

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

const createGame = async (user, params, cover) => {
  await Joi.validate(params, gameValidator);

  const game = new Game({
    ...params,
    user: user._id,
    pin: generateGamePin(user)
  });
  if (cover) Object.assign(game, cover);
  await game.save();

  return game;
};

const getGames = async userId => {
  return Game.find({
    user: userId
  }).populate(populateParams);
};

const getGame = async gameId => {
  const game = await Game.findById(gameId).populate(populateParams);
  return game;
};

const updateGame = async (gameId, params, cover) => {
  const game = await getGame(gameId);

  if (!params) throw new BadRequestError('There is no updates required');

  await Joi.validate(
    params,
    Joi.object().keys({
      title: Joi.string(),
      description: Joi.string()
    })
  );

  Object.assign(game, params);
  if (cover) Object.assign(game, cover);
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
