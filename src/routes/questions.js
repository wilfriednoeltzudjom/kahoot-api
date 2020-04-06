const express = require('express');

const questionService = require('../services/question');

const uploadHandler = require('../middlewares/upload-handler');
const resourceHandler = require('../middlewares/resources-handler');
const validationHandler = require('../middlewares/validation-handler');

const {
  createQuestion,
  updateQuestion,
  deleteQuestion
} = require('../validators/question');

const answerRouter = require('./answers');

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  uploadHandler,
  createQuestion(),
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    questionService
      .createQuestion(req.params.gameId, req.body, {
        image: req.downloadUrl,
        imageId: req.downloadId
      })
      .then(question => res.json(question))
      .catch(error => next(error));
  }
);

router.put(
  '/:questionId',
  uploadHandler,
  updateQuestion(),
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
      res.status(400).json({
        message: 'There is no updates required'
      });
      return;
    }

    questionService
      .updateQuestion(req.params.questionId, req.body, {
        image: req.downloadUrl,
        imageId: req.downloadId
      })
      .then(question => res.json(question))
      .catch(error => next(error));
  }
);

router.delete(
  '/:questionId',
  deleteQuestion(),
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    questionService
      .deleteQuestion(req.params)
      .then(() =>
        res.json({
          message: `Question ${req.params.questionId} successfully deleted`
        })
      )
      .catch(error => next(error));
  }
);

router.use(':/questionId/answers', answerRouter);

module.exports = router;
