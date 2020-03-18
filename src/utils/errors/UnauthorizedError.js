const BasicError = require('./BasicError');

class UnauthorizedError extends BasicError {
  constructor(message = 'Access Unauthorized.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

module.exports = UnauthorizedError;
