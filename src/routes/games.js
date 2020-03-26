const express = require('express');

const gameService = require('../services/game');

const questionRouter = require('./questions');

const uploadHandler = require('../middlewares/upload-handler');
const resourceHandler = require('../middlewares/resources-handler');
const validationHandler = require('../middlewares/validation-handler');

const {
  createGame,
  updateGame,
  getGame,
  deleteGame
} = require('../validators/game');

const router = express.Router();

router.post(
  '/',
  uploadHandler,
  createGame(),
  validationHandler,
  (req, res, next) => {
    gameService
      .createGame(req.user, req.body, {
        cover: req.downloadUrl,
        coverId: req.downloadId
      })
      .then(game => res.json(game))
      .catch(error => next(error));
  }
);

router.get('/', (req, res, next) => {
  gameService
    .getGames(req.user._id)
    .then(games => res.json(games))
    .catch(error => next(error));
});

router.get(
  '/:gameId',
  getGame(),
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    gameService
      .getGame(req.params.gameId)
      .then(game => res.json(game))
      .catch(error => next(error));
  }
);

router.put(
  '/:gameId',
  uploadHandler,
  updateGame(),
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    if (Object.keys(req.body).length === 0 && !req.downloadUrl) {
      res.status(400).json({
        message: 'There is no updates required'
      });
      return;
    }

    gameService
      .updateGame(req.params.gameId, req.body, {
        cover: req.downloadUrl,
        coverId: req.downloadId
      })
      .then(game => res.json(game))
      .catch(error => next(error));
  }
);

router.delete(
  '/:gameId',
  deleteGame(),
  validationHandler,
  resourceHandler,
  (req, res, next) => {
    gameService
      .deleteGame(req.params.gameId)
      .then(() =>
        res.json({
          message: `Game ${req.params.gameId} successfully deleted`
        })
      )
      .catch(error => next(error));
  }
);

router.use('/:gameId/questions', questionRouter);

module.exports = router;
