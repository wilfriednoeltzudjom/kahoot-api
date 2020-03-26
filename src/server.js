const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Initialize environment
dotenv.config({ path: path.join(__dirname, '/config', 'default.env') });

const { NODE_ENV } = process.env;
if (NODE_ENV === 'development') {
  dotenv.config({ path: path.join(__dirname, '/config', 'development.env') });
} else if (NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '/config', 'test.env') });
}

// Third party libaries
require('./helpers/passport');

// Routes
const authRouter = require('./routes/auth');
const gameRouter = require('./routes/games');
const playerRouter = require('./routes/players');
const dbRouter = require('./routes/db');

// Middlewares
const loggingHandler = require('./middlewares/logging-handler');
const errorHandler = require('./middlewares/error-handler');
const authHandler = require('./middlewares/auth-handler');

// Helpers
const logger = require('./helpers/logger');

// Connect to mongodb
mongoose
  .connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    logger.info('Successfully connect to mongodb');
  })
  .catch(err => logger.error(`Unable to connect to mongoDB : ${err.message}`));

// Initalize app
const app = express();

app.use(loggingHandler);

// Setup common middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Define routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/games', authHandler, gameRouter);
app.use('/api/v1/players', authHandler, playerRouter);

// Test routes only
if (NODE_ENV === 'test') app.use('/api/v1/db', dbRouter);

// Error handler
app.use(errorHandler);

// Start server
const { PORT } = process.env;
app.listen(PORT, () => {
  if (NODE_ENV !== 'production') console.clear();
  logger.info(`Server started on port ${PORT}`);
});

module.exports = app;