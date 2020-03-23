const { User } = require('../models/user');

const { UnauthorizedError, ResourceNotFoundError } = require('../utils/errors');
const jwtUtils = require('../utils/jwt');

const throwUnauthorizeError = () => {
  throw new UnauthorizedError('You are not allowed to access this resource');
};

const authHandler = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) throwUnauthorizeError();
  if (!jwtUtils.verify(token)) throwUnauthorizeError();

  const payload = jwtUtils.decode(token);
  if (!payload || !payload.uuid) throwUnauthorizeError();

  const user = await User.findOne({ uuid: payload.uuid });
  if (!user)
    throw new ResourceNotFoundError(`User ${payload.uuid} was not found`);

  req.user = user;

  next();
};

module.exports = authHandler;
