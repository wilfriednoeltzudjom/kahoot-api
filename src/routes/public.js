const express = require('express');

const publicService = require('../services/public');

const validationHandler = require('../middlewares/validation-handler');

const { checkGamePin, checkUsername } = require('../validators/public');

const router = express.Router();

router.get(
  '/pin-verification',
  checkGamePin(),
  validationHandler,
  (req, res, next) => {
    publicService
      .checkGamePin(req.query)
      .then(gameSession => res.json(gameSession))
      .catch(error => next(error));
  }
);

router.get(
  '/username-verification',
  checkUsername(),
  validationHandler,
  (req, res, next) => {
    publicService
      .checkUsername(req.query)
      .then(game => res.json(game))
      .catch(error => next(error));
  }
);

module.exports = router;
