const express = require('express');

const gameService = require('../services/game');

const questionRouter = require('./questions');

const uploadHandler = require('../middlewares/upload-handler');

const router = express.Router();

router.post('/', uploadHandler, (req, res, next) => {
  gameService
    .createGame(req.user, req.body, req.downloadUrl)
    .then(game => res.json(game))
    .catch(error => next(error));
});

router.get('/', (req, res, next) => {
  gameService
    .getGames(req.user._id)
    .then(games => res.json(games))
    .catch(error => next(error));
});

router.get('/:gameId', (req, res, next) => {
  gameService
    .getGame(req.params.gameId)
    .then(game => res.json(game))
    .catch(error => next(error));
});

router.put('/:gameId', uploadHandler, (req, res, next) => {
  gameService
    .updateGame(req.params.gameId, req.body, req.downloadUrl)
    .then(game => res.json(game))
    .catch(error => next(error));
});

router.delete('/:gameId', (req, res, next) => {
  gameService
    .deleteGame(req.params.gameId)
    .then(() =>
      res.json({
        message: `Game ${req.params.gameId} successfully deleted`
      })
    )
    .catch(error => next(error));
});

router.use('/:gameId/questions', questionRouter);

module.exports = router;
