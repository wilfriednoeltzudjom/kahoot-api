const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const bcrypt = require('bcryptjs');

const { User } = require('../models/user');

const { BadRequestError, ResourceNotFoundError } = require('../utils/errors');

passport.use(
  'signin',
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      const user = await User.findOne({ username });
      if (!user) done(new ResourceNotFoundError('Username not found'));

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) done(new BadRequestError('Incorrect password'));

      return done(null, user);
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      secretOrKey: process.env.PUBLIC_KEY,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    (payload, done) => {
      User.findOne({ uuid: payload.uuid }, (error, user) => {
        done(error, user);
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (error, user) => {
    done(error, user);
  });
});
