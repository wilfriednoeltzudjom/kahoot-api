const express = require('express');

const answerService = require('../services/answer');

const resourceHandler = require('../middlewares/resources-handler');
const validationHandler = require('../middlewares/validation-handler');

const {
  createAnswer,
  updateAnswer,
  deleteAnswer
} = require('../validators/answer');

const router = express.Router();

router.post(
  '/',
  createAnswer,
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    answerService
      .createAnswer(req.params.questionId, req.body)
      .then(answer => res.json(answer))
      .catch(error => next(error));
  }
);

router.put(
  '/:answerId',
  updateAnswer,
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    answerService
      .updateAnswer(req.params.answerId, req.body)
      .then(answer => res.json(answer))
      .catch(error => next(error));
  }
);

router.delete(
  '/:answerId',
  deleteAnswer,
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    answerService
      .deleteAnswer(req.params)
      .then(() =>
        res.json({
          message: `Answer ${req.params.answerId} successfully deleted`
        })
      )
      .catch(error => next(error));
  }
);

module.exports = router;
