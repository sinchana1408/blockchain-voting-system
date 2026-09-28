import { calculateBlockHash } from '../utils/cryptoUtils.js';

export class Block {
  constructor(index, timestamp, votes, previousHash = '', nonce = 0, hash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.votes = votes;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = hash || this.computeHash();
  }

  computeHash() {
    return calculateBlockHash(this.index, this.previousHash, this.timestamp, this.votes, this.nonce);
  }

  mineBlock(difficulty) {
    const targetPrefix = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== targetPrefix) {
      this.nonce++;
      this.hash = this.computeHash();
    }
  }
}