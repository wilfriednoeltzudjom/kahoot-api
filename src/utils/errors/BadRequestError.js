const BasicError = require('./BasicError');

class BadRequestError extends BasicError {
  constructor(message) {
    super(message, 'BAD_REQUEST', 400);
  }
}

module.exports = BadRequestError;
