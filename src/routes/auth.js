const express = require('express');
const passport = require('passport');

const authService = require('../services/auth');

const jwtUtils = require('../utils/jwt');

const router = express.Router();

router.post('/signup', (req, res, next) => {
  authService
    .signUp(req.body)
    .then(() => res.json({ message: 'You have been successfully registered' }))
    .catch(error => next(error));
});

router.post('/signin', (req, res, next) => {
  return passport.authenticate(
    'signin',
    { session: false },
    (error, user, _info) => {
      if (error) throw error;

      req.login(user, { session: false }, err => {
        if (err) throw err;

        const payload = {
          uuid: user.uuid
        };

        const token = jwtUtils.sign(payload);
        res.status(200).json({ token });
      });
    }
  )(req, res, next);
});

module.exports = router;
