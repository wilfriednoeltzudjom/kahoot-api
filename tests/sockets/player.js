const io = require('socket.io-client');
const inquirer = require('inquirer');

const logger = require('../../src/helpers/logger');
const faker = require('../../src/helpers/faker');

const { Question } = require('../../src/models/question');
const { Game } = require('../../src/models/game');

const dbHandler = require('../helpers/db-handler');

async function connect() {
  return io.connect('http://localhost:4000/players', {
    forceNew: true
  });
}

function joinPlayer(socket, gamePin) {
  const username = faker.random.alphaNumeric(8);
  socket.emit('player-join', { gamePin, username });
}

async function playerAsnwer(socket, gamePin) {
  try {
    const game = await Game.findOne({ pin: gamePin });
    const questions = await Question.find({ game: game._id }).populate(
      'answers'
    );

    // choose question
    const questionsChoices = questions.map(question => ({
      name: question.title,
      value: question._id
    }));
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'questionId',
          message: 'Choose a question: ',
          choices: questionsChoices
        }
      ])
      .then(({ questionId }) => {
        const { answers, time, points } = questions.find(
          question => question._id === questionId
        );

        const answersChoices = answers.map(answer => ({
          name: `${answer.title} -> ${answer.isCorrect}`,
          value: answer._id
        }));

        inquirer
          .prompt([
            {
              type: 'list',
              name: 'answerId',
              message: 'Choose an answer: ',
              choices: answersChoices
            }
          ])
          .then(({ answerId }) => {
            console.log(`time -> ${time}, points -> ${points}`);
            const responseTime = time - 1;
            socket.emit('player-answer', {
              gamePin,
              questionId,
              answerId,
              responseTime
            });
          });
      });
  } catch (error) {
    logger.error(error.message);
  }
}

function disconnect(socket) {
  setTimeout(() => {
    socket.disconnect();
  }, 3 * 1000);
}

function run(gamePin) {
  dbHandler
    .connect()
    .then(() => {
      connect()
        .then(socket => {
          logger.info('init player socket');

          socket.on('question-intro', ({ question }) => {
            logger.info(
              `receive question introduction for ${question._id} of time ${question.time}s`
            );
          });

          socket.on('question-start', ({ question }) => {
            logger.info(`starting question ${question._id}`);
          });

          socket.on('question-end', ({ question }) => {
            logger.info(`ending question ${question._id}`);
          });

          socket.on('player-list', ({ players }) => {
            logger.info(`received players of length ${players.length}`);
          });

          joinPlayer(socket, gamePin);

          setTimeout(async () => {
            await playerAsnwer(socket, gamePin);
          }, 500);

          // disconnect
          // disconnect();
        })
        .catch(error => logger.error(error.message));
    })
    .catch(error => logger.error(error.message));
}

inquirer
  .prompt([
    {
      type: 'input',
      name: 'gamePin',
      message: 'Enter game pin: '
    }
  ])
  .then(({ gamePin }) => {
    run(gamePin);
  });
