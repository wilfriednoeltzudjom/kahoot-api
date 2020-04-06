const { body, param } = require('express-validator');

const checkParentsIds = () => [
  param('gameId')
    .exists()
    .isMongoId(),
  param('questionId')
    .exists()
    .isMongoId()
];

const checkId = () => [
  param('questionId')
    .exists()
    .isMongoId()
];

const createAnswer = [
  body('title')
    .isString()
    .not()
    .isEmpty()
    .withMessage('Title is required'),
  body('isCorrect').isBoolean(),
  body('position')
    .isInt({
      min: 1,
      max: 4
    })
    .withMessage('Position is required and must be between 1 and 4'),
  checkParentsIds()[0]
];

const updateAnswer = [
  body('title')
    .isString()
    .optional(),
  body('isCorrect')
    .isBoolean()
    .optional(),
  body('position')
    .isInt({ min: 1, max: 4 })
    .optional(),
  checkParentsIds()[0],
  checkId()[0]
];

const deleteAnswer = checkId();

module.exports = {
  createAnswer,
  updateAnswer,
  deleteAnswer
};
