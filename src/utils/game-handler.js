const { Player } = require('../models/player');
const { Game } = require('../models/game');
const { Question } = require('../models/question');
const { GameSession } = require('../models/game-session');

const { gameSessionStatuses } = require('./enums');

const logger = require('../helpers/logger');

class GameHandler {
  constructor() {
    this.gamesMap = new Map();
    this.questionsMap = new Map();
    this.currentQuestionsMap = new Map();
    this.timersMap = new Map();
    this.gamePinsMap = new Map();
    this.gameSessionsMap = new Map();
  }

  async playGame(gamePin, socketId) {
    const game = await Game.findOne({ pin: gamePin });
    const questions = await Question.find({ game: game._id }).populate({
      path: 'answers',
      sort: { position: 1 }
    });
    const gameSession = new GameSession({ game: game._id });
    await gameSession.save();
    console.log(gameSession);

    this.gamesMap.set(gamePin, game);
    this.questionsMap.set(gamePin, questions);
    this.currentQuestionsMap.set(gamePin, 0);
    this.gamePinsMap.set(socketId, gamePin);
    this.gameSessionsMap.set(gamePin, gameSession);
  }

  async startGame(gamePin) {
    const gameSession = this.gameSessionsMap.get(gamePin);
    gameSession.status = gameSessionStatuses.RUNNING;
    this.gameSessionsMap.set(gamePin, gameSession);
    await gameSession.save();

    return this.gamesMap.get(gamePin);
  }

  nextQuestion(gamePin) {
    const currentQuestionIndex = this.currentQuestionsMap.get(gamePin);
    const questions = this.questionsMap.get(gamePin);

    if (currentQuestionIndex >= questions.length) return {};

    const currentQuestion = questions[currentQuestionIndex];
    this.currentQuestionsMap.set(gamePin, currentQuestionIndex + 1);

    return {
      currentQuestion,
      currentIndex: currentQuestionIndex + 1,
      totalCount: questions.length
    };
  }

  async joinPlayer(gamePin, { username, sessionId }) {
    const result = { success: false, message: '', player: {} };

    const gameSession = this.gameSessionsMap.get(gamePin);
    if (!gameSession) {
      result.message = 'This game is currently closed';
      return result;
    }

    const existingPlayerWithUsername = await Player.findOne({
      gameSession: gameSession._id,
      username
    });
    if (existingPlayerWithUsername) {
      result.message = 'Username already taken';
      return result;
    }

    const player = new Player({
      username,
      sessionId,
      gameSession: gameSession._id
    });
    await player.save();
    console.log(player);

    // update local game object
    gameSession.players.push(player._id);
    this.gameSessionsMap.set(gamePin, gameSession);

    result.success = true;
    result.player = player;
    return result;
  }

  async hasAllPlayersAnswered(gamePin, questionId) {
    const gameSession = this.gameSessionsMap.get(gamePin);
    const playersCount = gameSession.players.length;

    const playersWhoAnsweredCount = await Player.countDocuments({
      gameSession: gameSession._id,
      playerAnswers: {
        $elemMatch: {
          question: questionId
        }
      }
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

    const updatedPlayer = await Player.findById(player._id).populate([
      { path: 'playerAnswers.answer' },
      { path: 'playerAnswers.question' }
    ]);

    return {
      question: currentQuestion,
      currentIndex: this.currentQuestionsMap.get(gamePin),
      totalCount: questions.length,
      player: updatedPlayer
    };
  }

  async endGame(gamePin, socketId) {
    const gameSession = this.gameSessionsMap.get(gamePin);
    if (gameSession) {
      gameSession.status = gameSessionStatuses.ENDED;
      await gameSession.save();

      this.gamesMap.delete(gamePin);
      this.questionsMap.delete(gamePin);
      this.currentQuestionsMap.delete(gamePin);
      this.gamePinsMap.delete(socketId);
      this.gameSessionsMap.delete(gamePin);
    }
  }

  async playerList(gamePin) {
    const gameSession = this.gameSessionsMap.get(gamePin);
    const players = gameSession
      ? await Player.find({ gameSession: gameSession._id }).populate([
          { path: 'playerAnswers.answer' },
          { path: 'playerAnswers.question' }
        ])
      : [];

    return players.length > 0
      ? players.sort((a, b) => a.totalScore - b.totalScore).reverse()
      : players;
  }

  async getPlayer(sessionId) {
    return Player.findOne({ sessionId }).populate({
      path: 'gameSession',
      populate: {
        path: 'game',
        select: 'pin'
      }
    });
  }

  addTimer(questionId, timer) {
    this.timersMap.set(questionId, timer);
  }

  clearTimer(questionId) {
    const timer = this.timersMap.get(questionId);
    if (timer) {
      clearTimeout(timer);
      logger.info(`timer cleared for questionId ${questionId}`);
    }
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
