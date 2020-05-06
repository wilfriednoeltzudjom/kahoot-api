const { query } = require('express-validator');

const checkGamePin = () => [
  query('gamePin')
    .isString()
    .not()
    .isEmpty()
];

const checkUsername = () => [
  query('gameSessionUUID')
    .isString()
    .not()
    .isEmpty(),
  query('username')
    .isString()
    .not()
    .isEmpty()
];

module.exports = { checkGamePin, checkUsername };
