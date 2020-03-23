const express = require('express');

const answerService = require('../services/answer');

const router = express.Router();

router.post('/', (req, res, next) => {
  answerService
    .createAnswer(req.params.questionId, req.body)
    .then(answer => res.json(answer))
    .catch(error => next(error));
});

router.put('/:answerId', (req, res, next) => {
  answerService
    .updateAnswer(req.params.answerId, req.body)
    .then(answer => res.json(answer))
    .catch(error => next(error));
});

router.delete('/:answerId', (req, res, next) => {
  answerService
    .deleteAnswer(req.params)
    .then(() =>
      res.json({
        message: `Answer ${req.params.answerId} successfully deleted`
      })
    )
    .catch(error => next(error));
});

module.exports = router;
