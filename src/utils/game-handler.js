const { Player } = require('../models/player');
const { Game } = require('../models/game');
const { Question } = require('../models/question');

class GameHandler {
  constructor() {
    this.gamesMap = new Map();
    this.questionsMap = new Map();
    this.currentQuestionsMap = new Map();
  }

  async playGame(gamePin) {
    const game = await Game.findOne({ gamePin });
    const questions = await Question.find({ game: game._id }).populate(
      'answers'
    );
    this.gamesMap.set(gamePin, game);
    this.questionsMap.set(gamePin, questions);
    this.currentQuestionsMap.set(gamePin, 0);
  }

  startGame(gamePin) {
    const game = this.gamesMap.get(gamePin);
    game.status = 'started';
    this.gamesMap.set(gamePin, game);
  }

  nextQuestion(gamePin) {
    let nextQuestionIndex = -1;

    const currentQuestion = this.currentQuestionsMap.get(gamePin);
    const questions = this.questionsMap.get(gamePin);
    if (currentQuestion < questions.length - 1) {
      nextQuestionIndex = currentQuestion + 1;
      this.currentQuestionsMap.set(gamePin, nextQuestionIndex);
    }

    const nextQuestion =
      nextQuestionIndex !== -1 ? questions[nextQuestionIndex] : null;

    return nextQuestion;
  }

  async joinPlayer(gamePin, { username, sessionId }) {
    const result = { success: false, message: '', pin: '' };

    const game = this.gamesMap.get(gamePin);
    if (!game) {
      result.message = 'This game is currently closed';
      return result;
    }

    const existingPlayerWithUsername = await Player.findOne({
      game: game._id,
      username
    });
    if (existingPlayerWithUsername) {
      result.message = 'Username already taken';
      return result;
    }

    const player = new Player({ username, sessionId, game: game._id });
    await player.save();

    // update local game object
    game.players.push(player._id);
    this.gamesMap.set(gamePin, game);

    result.success = true;
    result.pin = game.gamePin;
    return result;
  }

  async playerAnswer(
    gamePin,
    sessionId,
    { questionId, answerId, responseTime }
  ) {
    const questions = this.questionsMap.get(gamePin);
    const currentQuestion = questions.find(
      question => question._id === questionId
    );
    const chosenAnswer = currentQuestion.answers.find(
      answer => answer._id === answerId
    );

    const player = await Player.findOne({ sessionId });
    const playerAnswer = {
      question: questionId,
      answer: answerId,
      responseTime,
      points: 0
    };
    if (chosenAnswer.isCorrect) {
      const { points, time } = currentQuestion;
      const bonus = Math.floor((1 - responseTime / time / 2) * points);
      playerAnswer.points = points + bonus;
    }
    player.answers.push(playerAnswer);
    await player.save();
  }

  async endGame(gamePin) {
    const game = this.gamesMap.get(gamePin);
    game.status = 'ended';
    await game.save();

    this.gamesMap.delete(gamePin);
    this.questionsMap.delete(gamePin);
    this.currentQuestionsMap.delete(gamePin);
  }

  async getPlayers(gamePin) {
    const game = this.gamesMap.get(gamePin);
    const players = await Player.find({ game: game._id }).populate([
      { path: 'answers.answer' },
      { path: 'answers.question' }
    ]);

    return players;
  }
}

module.exports = GameHandler;
