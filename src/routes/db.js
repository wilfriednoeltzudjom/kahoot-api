const express = require('express');

const dbService = require('../services/db');

const router = express.Router();

router.get('/clear', (req, res, next) => {
  dbService
    .clearDatabase()
    .then(() =>
      res.json({
        message: 'Database successfully dropped'
      })
    )
    .catch(error => next(error));
});

module.exports = router;
