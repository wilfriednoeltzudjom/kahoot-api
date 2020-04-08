const { Player } = require('../models/player');
const { Game } = require('../models/game');
const { Question } = require('../models/question');

class GameHandler {
  constructor() {
    this.gamesMap = new Map();
    this.questionsMap = new Map();
    this.currentQuestionsMap = new Map();
    this.timersMap = new Map();
    this.gamePinsMap = new Map();
  }

  async playGame(gamePin, socketId) {
    const game = await Game.findOne({ pin: gamePin });
    const questions = await Question.find({ game: game._id }).populate(
      'answers'
    );
    this.gamesMap.set(gamePin, game);
    this.questionsMap.set(gamePin, questions);
    this.currentQuestionsMap.set(gamePin, 0);
    this.gamePinsMap.set(socketId, gamePin);
  }

  startGame(gamePin) {
    const game = this.gamesMap.get(gamePin);
    game.status = 'started';
    this.gamesMap.set(gamePin, game);

    return game;
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
    const result = { success: false, message: '' };

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
    return result;
  }

  async hasAllPlayersAnswered(gamePin, questionId) {
    const game = this.gamesMap.get(gamePin);
    const playersCount = game.players.length;

    const playersWhoAnsweredCount = await Player.countDocuments({
      answers: { question: questionId }
    });

    return playersCount === playersWhoAnsweredCount;
  }

  async playerAnswer(
    gamePin,
    sessionId,
    { questionId, answerId, responseTime }
  ) {
    const questions = this.questionsMap.get(gamePin);
    const currentQuestion = questions.find(
      question => question._id.toString() === questionId
    );
    const chosenAnswer = currentQuestion.answers.find(
      answer => answer._id.toString() === answerId
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

      const { totalScore } = player;
      player.totalScore = totalScore + playerAnswer.points;
    }
    player.playerAnswers.push(playerAnswer);
    await player.save();

    return { question: currentQuestion, player: player };
  }

  async endGame(gamePin, socketId) {
    const game = this.gamesMap.get(gamePin);
    game.status = 'ended';
    await game.save();

    this.gamesMap.delete(gamePin);
    this.questionsMap.delete(gamePin);
    this.currentQuestionsMap.delete(gamePin);
    this.gamePinsMap.delete(socketId);
  }

  async playerList(gamePin) {
    const game = this.gamesMap.get(gamePin);
    const players = await Player.find({ game: game._id }).populate([
      { path: 'answers.answer' },
      { path: 'answers.question' }
    ]);

    return players;
  }

  async getPlayer(sessionId) {
    return Player.findOne({ sessionId }).populate('game');
  }

  addTimer(questionId, timer) {
    this.timersMap.set(questionId, timer);
  }

  clearTimer(questionId) {
    const timer = this.timersMap.get(questionId);
    if (timer) clearTimeout(timer);
    this.timersMap.delete(questionId);
  }

  getGamePin(socketId) {
    return this.gamePinsMap.get(socketId);
  }

  getHostSocketId(gamePin) {
    let socketId;
    this.gamePinsMap.forEach((value, key) => {
      if (value === gamePin) socketId = key;
    });
    return socketId;
  }
}

module.exports = GameHandler;
