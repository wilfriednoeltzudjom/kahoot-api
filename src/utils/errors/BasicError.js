class BasicError extends Error {
  constructor(message, id = 'UNKOWN_ERROR', status = 500) {
    super(message);

    this.id = id;

    this.status = status;

    this.name = id;
  }

  toString() {
    return `${this.name}: [${this.status}] ${this.message}`;
  }
}

module.exports = BasicError;
