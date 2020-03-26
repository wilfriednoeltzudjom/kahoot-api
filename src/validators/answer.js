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

const createQuestion = [
  body('title')
    .isString()
    .not()
    .isEmpty()
];
