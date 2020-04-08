const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Stacktracey = require('stacktracey');

const GameHandler = require('./utils/game-handler');

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
    logger.info('successfully connect to mongodb');
  })
  .catch(err => logger.error(`unable to connect to mongoDB : ${err.message}`));

// Logging middleware
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
server.listen(PORT, () => {
  if (NODE_ENV !== 'production') console.clear();
  logger.info(`server started on port ${PORT}`);
});

// Socket handler
const hosts = io.of('/hosts');
const players = io.of('/players');

const gameHandler = new GameHandler();

function notifyAll(gamePin, message) {
  hosts.to(gamePin).emit('notification', { message });
  players.to(gamePin).emit('notification', { message });
}

function sendNextQuestion(gamePin, nextQuestion, timeout = 0) {
  // send question intro after
  setTimeout(() => {
    hosts.to(gamePin).emit('question-intro', { question: nextQuestion });
    players.to(gamePin).emit('question-intro', { question: nextQuestion });

    // start question after 4s
    setTimeout(() => {
      hosts.to(gamePin).emit('question-start', { question: nextQuestion });
      players.to(gamePin).emit('question-start', { question: nextQuestion });

      // end question after time is up
      const { time } = nextQuestion;
      const timer = setTimeout(() => {
        hosts.to(gamePin).emit('question-end', { question: nextQuestion });
        players.to(gamePin).emit('question-end', { question: nextQuestion });
      }, time * 1000);
      gameHandler.addTimer(nextQuestion._id, timer);
    }, 4 * 1000);
  }, timeout);
}

async function sendPlayerList(gamePin) {
  const playerList = await gameHandler.playerList(gamePin);

  if (playerList.length > 0) {
    hosts.to(gamePin).emit('player-list', { players: playerList });
    players.to(gamePin).emit('player-list', { players: playerList });
  } else {
    logger.info(`empty player list for game -> ${gamePin}`);
  }
}

function sendGameEnd(gamePin) {
  hosts.to(gamePin).emit('game-end', { pin: gamePin });
  players.to(gamePin).emit('game-end', { pin: gamePin });
}

function logStack(error) {
  const stack = new Stacktracey(error.stack);
  logger.error(JSON.stringify({ stack: stack[0] }));
}

hosts.on('connection', socket => {
  socket.on('game-play', async ({ gamePin }) => {
    try {
      await gameHandler.playGame(gamePin, socket.id);
      socket.join(gamePin);
      logger.info(`socket ${socket.id} has join game ${gamePin}`);
    } catch (error) {
      logger.error(`unable to setup a new game -> ${error.message}`);
      logStack(error);
    }
  });

  socket.on('game-start', ({ gamePin }) => {
    const game = gameHandler.startGame(gamePin);
    socket.emit('game-start', { game });

    // send question intro
    const nextQuestion = gameHandler.nextQuestion(gamePin);
    sendNextQuestion(gamePin, nextQuestion, 4 * 1000);
  });

  socket.on('question-next', async ({ gamePin }) => {
    const nextQuestion = gameHandler.nextQuestion(gamePin);
    if (!nextQuestion) {
      try {
        await sendPlayerList(gamePin);
        sendGameEnd();
        await gameHandler.endGame(gamePin, socket.id);
      } catch (error) {
        logger.error(
          `unable to save game after last question -> ${error.message}`
        );
        logStack(error);
      }
      return;
    }

    sendNextQuestion(gamePin, nextQuestion);
  });

  socket.on('game-end', async ({ gamePin }) => {
    try {
      await sendPlayerList(gamePin);
      sendGameEnd();
      await gameHandler.endGame(gamePin, socket.id);
    } catch (error) {
      logger.error(
        `unable to save game after end game request -> ${error.message}`
      );
      logStack(error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const gamePin = gameHandler.getGamePin(socket.id);

      await sendPlayerList(gamePin);
      sendGameEnd();
      await gameHandler.endGame(gamePin, socket.id);

      logger.info(`host ${socket.id} has left`);
    } catch (error) {
      logger.error(`unable to save game after disconnect -> ${error.message}`);
      logStack(error);
    }
  });
});

players.on('connection', socket => {
  socket.on('player-join', async ({ gamePin, username }) => {
    try {
      logger.info(`player ${username} attemps to join game ${gamePin}`);
      const result = await gameHandler.joinPlayer(gamePin, {
        username,
        sessionId: socket.id
      });

      if (!result.success) {
        socket.emit('player-join-error', { error: result.message });
        return;
      }

      socket.join(gamePin);
      logger.info(`socket ${socket.id} has join game ${gamePin}`);

      setTimeout(() => {
        sendPlayerList(gamePin);
      }, 50);
    } catch (error) {
      logger.error(`unable to join player -> ${error.message}`);
      logStack(error);
    }
  });

  socket.on(
    'player-answer',
    async ({ gamePin, questionId, answerId, responseTime }) => {
      try {
        const { question, player } = await gameHandler.playerAnswer(
          gamePin,
          socket.id,
          {
            questionId,
            answerId,
            responseTime
          }
        );

        logger.info(`player ${player.username} answered at ${question._id}`);

        setTimeout(async () => {
          await sendPlayerList(gamePin);

          const hasAllPlayersAnswered = await gameHandler.hasAllPlayersAnswered(
            gamePin,
            questionId
          );
          if (hasAllPlayersAnswered) {
            // clearing timer
            gameHandler.clearTimer(questionId);

            // send question end
            setTimeout(() => {
              hosts.to(gamePin).emit('question-end', { question });
              players.to(gamePin).emit('question-end', { question });
            }, 50);
          }
        }, 50);
      } catch (error) {
        logger.error(`unable to proceed player answer -> ${error.message}`);
        logStack(error);
      }
    }
  );

  socket.on('disconnect', async () => {
    logger.info(`player ${socket.id} has left`);
    try {
      const player = await gameHandler.getPlayer(socket.id);
      notifyAll(player.game.pin, `player ${player.username} has left the game`);
    } catch (error) {
      logger.error(`unable to disconnect player -> ${error.message}`);
      logStack(error);
    }
  });
});

module.exports = app;
