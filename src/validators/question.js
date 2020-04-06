const { body, param } = require('express-validator');

const checkParentIds = () => [
  param('gameId')
    .exists()
    .isMongoId()
];

const checkId = () => [
  param('questionId')
    .exists()
    .isMongoId()
];

const createQuestion = () => [
  body('title')
    .isString()
    .not()
    .isEmpty()
    .withMessage('Title is required'),
  body('points')
    .isInt({
      min: 0,
      max: 2000
    })
    .withMessage('Points must be between 100 and 1000'),
  body('time')
    .isInt({
      min: 5
    })
    .withMessage('Time must be at least 5s'),
  body('answers')
    .isArray({
      min: 2,
      max: 4
    })
    .withMessage('You need to provide at least 2 answers'),
  body('answers.*.title')
    .isString()
    .not()
    .isEmpty(),
  body('answers.*.isCorrect')
    .isBoolean()
    .optional(),
  body('answers.*.position').isInt(),
  checkParentIds()[0]
];

const updateQuestion = () => [
  body('title')
    .isString()
    .not()
    .isEmpty()
    .optional(),
  body('points')
    .isInt({
      min: 100,
      max: 2000
    })
    .optional(),
  body('time')
    .isInt({
      min: 10
    })
    .optional(),
  checkParentIds()[0],
  checkId()[0]
];

const deleteQuestion = () => checkId();

module.exports = { createQuestion, updateQuestion, deleteQuestion };
