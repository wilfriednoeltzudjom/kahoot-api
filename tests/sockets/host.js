const io = require('socket.io-client');

const { UserFactory } = require('../../src/models/user');
const { GameFactory } = require('../../src/models/game');
const { QuestionFactory } = require('../../src/models/question');

const logger = require('../../src/helpers/logger');

const dbHandler = require('../helpers/db-handler');

let currentGame;

async function initGame() {
  const user = await UserFactory.create();
  currentGame = await GameFactory.create({ user: user._id });
  await QuestionFactory.createMany({
    game: currentGame._id,
    size: 3
  });
}

async function connect() {
  await initGame();
  return io.connect('http://localhost:4000/hosts', {
    forceNew: true
  });
}

function playGame(socket) {
  socket.emit('game-play', { gamePin: currentGame.pin });
}

function startGame(socket) {
  setTimeout(() => {
    socket.emit('game-start', { gamePin: currentGame.pin });
  }, 1000);
}

// function disconnect(socket) {
//   setTimeout(() => {
//     socket.disconnect();
//   }, 3 * 1000);
// }

function run() {
  dbHandler
    .connect()
    .then(() => {
      connect()
        .then(socket => {
          logger.info('init host socket');

          socket.on('connect', () => {
            socket.on('game-start', ({ game }) => {
              logger.info(`game ${game.pin} has started`);
            });

            socket.on('question-intro', ({ question }) => {
              logger.info(
                `receive question introduction for question ${question._id} of time ${question.time}s`
              );
            });

            socket.on('question-start', ({ question }) => {
              logger.info(`starting question ${question._id}`);
            });

            socket.on('question-end', ({ question }) => {
              logger.info(`ending question ${question._id}`);
            });

            socket.on('player-list', ({ players }) => {
              if (players.length > 0) {
                console.log(players[0]);
              }
              logger.info(`received players of length ${players.length}`);
            });

            socket.on('notification', ({ message }) => {
              logger.info(`new message -> ${message}`);
            });
          });

          playGame(socket);

          startGame(socket);

          // disconnect();
        })
        .catch(error => logger.error(error.message));
    })
    .catch(error => logger.error(error.message));
}

run();
