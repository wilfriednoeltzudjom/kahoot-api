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

// Middlewares
const loggingHandler = require('./middlewares/logging-handler');
const errorHandler = require('./middlewares/error-handler');

// Helpers
const logger = require('./helpers/logger');

// Connect to mongodb
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    if (NODE_ENV !== 'test') logger.info('Successfully connect to mongodb');
  })
  .catch(err => logger.error(`Unable to connect to mongoDB : ${err.message}`));

// Initalize app
const app = express();

if (NODE_ENV !== 'test') app.use(loggingHandler);

// Setup common middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Define routes
app.use('/api/v1/auth', authRouter);

// Error handler
app.use(errorHandler);

// Start server
const { PORT } = process.env;
app.listen(PORT, () => {
  if (NODE_ENV !== 'test') logger.info(`Server started on port ${PORT}`);
});

module.exports = app;
