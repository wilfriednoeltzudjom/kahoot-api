const express = require('express');

const questionService = require('../services/question');

const uploadHandler = require('../middlewares/upload-handler');

const answerRouter = require('./answers');

const router = express.Router({ mergeParams: true });

router.post('/', uploadHandler, (req, res, next) => {
  questionService
    .createQuestion(req.params.gameId, req.body, req.downloadUrl)
    .then(question => res.json(question))
    .catch(error => next(error));
});

router.put('/:questionId', uploadHandler, (req, res, next) => {
  questionService
    .updateQuestion(req.params.questionId, req.body, req.downloadUrl)
    .then(question => res.json(question))
    .catch(error => next(error));
});

router.delete('/:questionId', (req, res, next) => {
  questionService
    .deleteQuestion(req.params)
    .then(() =>
      res.json({
        message: `Question ${req.params.questionId} successfully deleted`
      })
    )
    .catch(error => next(error));
});

router.use(':/questionId/answers', answerRouter);

module.exports = router;
