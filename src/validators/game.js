const { body, param } = require('express-validator');

const checkId = () => [
  param('gameId')
    .exists()
    .isMongoId()
];

const createGame = () => [
  body('title')
    .isString()
    .withMessage('Title is required')
    .not()
    .isEmpty(),
  body('description')
    .isString()
    .optional()
];

const updateGame = () => [
  body('title')
    .isString()
    .optional(),
  body('description')
    .isString()
    .optional(),
  checkId()[0]
];

const getGame = () => checkId();

const deleteGame = () => checkId();

module.exports = {
  createGame,
  updateGame,
  getGame,
  deleteGame
};
