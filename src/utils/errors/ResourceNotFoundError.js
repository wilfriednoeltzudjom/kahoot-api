const BasicError = require('./BasicError');

class ResourceNotFoundError extends BasicError {
  constructor(message) {
    super(message, 'RESSOURCE_NOT_FOUND', 404);
  }
}

module.exports = ResourceNotFoundError;
