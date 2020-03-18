const morgan = require('morgan');
const logger = require('../helpers/logger');

logger.stream = {
  write: message => logger.info(message.substring(0, message.lastIndexOf('\n')))
};

module.exports = morgan('combined', { stream: logger.stream });
