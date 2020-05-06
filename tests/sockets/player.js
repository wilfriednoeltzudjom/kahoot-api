const io = require('socket.io-client');
const inquirer = require('inquirer');

const logger = require('../../src/helpers/logger');
const faker = require('../../src/helpers/faker');

const { Question } = require('../../src/models/question');
const { Game } = require('../../src/models/game');

const dbHandler = require('../helpers/db-handler');

async function connect() {
  return io.connect('http://localhost:5000/players', {
    forceNew: true
  });
}

function joinPlayer(socket, gamePin) {
  const username = faker.random.alphaNumeric(8);
  socket.emit('player-join', { gamePin, username });
}

async function playerAsnwer(socket, gamePin) {
  try {
    console.log(gamePin);
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

async function chooseAnswer(socket, gamePin, question) {
  const { answers, time, points } = question;

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
        questionId: question._id,
        answerId,
        responseTime
      });
    });
}

function run(gamePin) {
  dbHandler
    .connect()
    .then(() => {
      connect()
        .then(socket => {
          logger.info('init player socket');

          socket.on('question-intro', ({ data }) => {
            logger.info(`question intro for ${data.currentQuestion.title}`);
          });

          socket.on('question-start', ({ data }) => {
            const { currentQuestion } = data;
            if (currentQuestion) {
              chooseAnswer(socket, gamePin, currentQuestion);
            }
          });

          socket.on('question-end', ({ data }) => {
            logger.info(`question end for ${data.currentQuestion.title}`);
          });

          socket.on('player-list', ({ players }) => {
            logger.info(`received players of length ${players.length}`);
          });

          joinPlayer(socket, gamePin);

          // setTimeout(async () => {
          //   await playerAsnwer(socket, gamePin);
          // }, 500);
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
