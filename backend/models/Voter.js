export class Voter {
  constructor(id, voterId, passwordHash, hasVoted = false) {
    this.id = id;
    this.voterId = voterId;
    this.passwordHash = passwordHash;
    this.hasVoted = hasVoted;
  }
}