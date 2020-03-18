const appRootPath = require('app-root-path');
const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.File({
      filename: `${appRootPath}/logs/logs.log`,
      json: true,
      maxsize: 5242880,
      maxFiles: 5,
      colorize: true
    }),
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true
    })
  ]
});

module.exports = logger;
