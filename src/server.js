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
const userRouter = require('./routes/users');
const dbRouter = require('./routes/db');
const publicRouter = require('./routes/public');

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
app.use('/api/v1/users', authHandler, userRouter);
app.use('/api/v1/public', publicRouter);

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

async function sendPlayerList(gamePin) {
  const playerList = await gameHandler.playerList(gamePin);

  if (playerList.length > 0) {
    hosts.to(gamePin).emit('player-list', { players: playerList });
    players.to(gamePin).emit('player-list', { players: playerList });
  } else {
    logger.info(`empty player list for game -> ${gamePin}`);
  }
}

function sendNextQuestion(gamePin, data, timeout = 0) {
  // send question intro after
  setTimeout(() => {
    hosts.to(gamePin).emit('question-intro', { data });
    players.to(gamePin).emit('question-intro', { data });

    // start question after 4s
    setTimeout(() => {
      hosts.to(gamePin).emit('question-start', { data });
      players.to(gamePin).emit('question-start', { data });

      // end question after time is up
      const { time } = data.currentQuestion;
      const timer = setTimeout(async () => {
        await sendPlayerList(gamePin);

        hosts.to(gamePin).emit('question-end', { data });
        players.to(gamePin).emit('question-end', { data });
      }, (time + 1) * 1000);
      gameHandler.addTimer(data.currentQuestion._id.toString(), timer);
    }, 4 * 1000);
  }, timeout);
}

function sendGameEnd(gamePin) {
  hosts.to(gamePin).emit('game-end', { pin: gamePin });
  players.to(gamePin).emit('game-end', { pin: gamePin });
  logger.info(`game ${gamePin} ended`);
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

  socket.on('game-start', async ({ gamePin }) => {
    const game = await gameHandler.startGame(gamePin);
    socket.emit('game-start', { game });

    // send question intro
    const data = gameHandler.nextQuestion(gamePin);
    sendNextQuestion(gamePin, data, 4 * 1000);
  });

  socket.on('question-next', async ({ gamePin }) => {
    const data = gameHandler.nextQuestion(gamePin);
    if (!data.currentQuestion) {
      try {
        await sendPlayerList(gamePin);
        sendGameEnd(gamePin);
        await gameHandler.endGame(gamePin, socket.id);
      } catch (error) {
        logger.error(
          `unable to save game after last question -> ${error.message}`
        );
        logStack(error);
      }
      return;
    }

    sendNextQuestion(gamePin, data);
  });

  socket.on('game-end', async ({ gamePin }) => {
    try {
      await sendPlayerList(gamePin);
      sendGameEnd(gamePin);
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

      if (gamePin) {
        await sendPlayerList(gamePin);
        sendGameEnd(gamePin);
        await gameHandler.endGame(gamePin, socket.id);
      }

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
        socket.emit('player', { player: result.player });
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
        const {
          question,
          currentIndex,
          totalCount,
          player
        } = await gameHandler.playerAnswer(gamePin, socket.id, {
          questionId,
          answerId,
          responseTime
        });

        logger.info(`player ${player.username} answered at ${question._id}`);

        setTimeout(async () => {
          await sendPlayerList(gamePin);
          // update player
          socket.emit('player', { player });

          const hasAllPlayersAnswered = await gameHandler.hasAllPlayersAnswered(
            gamePin,
            questionId
          );
          if (hasAllPlayersAnswered) {
            // clearing timer
            logger.info(`clearing timer for question id ${questionId}`);
            gameHandler.clearTimer(questionId);

            // send question end
            setTimeout(() => {
              hosts.to(gamePin).emit('question-end', {
                data: { currentQuestion: question, currentIndex, totalCount }
              });
              players.to(gamePin).emit('question-end', {
                data: { currentQuestion: question, currentIndex, totalCount }
              });
            }, 50);
          } else {
            socket.emit('question-lobby', {
              data: { currentQuestion: question, currentIndex, totalCount }
            });
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
      if (player) {
        notifyAll(
          player.gameSession.game.pin,
          `player ${player.username} has left the game`
        );
      } else {
        logger.error(`player not found for socket id ${socket.id}`);
      }
    } catch (error) {
      logger.error(`unable to disconnect player -> ${error.message}`);
      logStack(error);
    }
  });
});

module.exports = app;
