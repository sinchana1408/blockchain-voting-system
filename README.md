#  BlockChain Voting System

A decentralized, full-stack blockchain voting platform featuring **SHA-256 Proof-of-Work consensus**, **zero-knowledge verifiable voter receipts**, **real-time WebSocket ledger synchronization**, and **cryptographic tamper auditing**.

---

##  Key Features

- **Decentralized Cryptographic Ledger:** Blocks linked by SHA-256 hashes and verified with Proof-of-Work difficulty nonces.
- **Zero-Knowledge Voter Receipts:** Every cast ballot generates an auditable cryptographic receipt key (`VCT-...`) allowing voters to verify on-chain inclusion without revealing ballot secrecy.
- **Public Ballot Verifier:** Search the ledger by Receipt ID or digital signature to verify exact Block # confirmation.
- **Live Real-Time Synchronization:** Powered by **Socket.IO WebSockets** — votes, mined blocks, and tallies update instantly across all connected screens.
- **Dynamic Candidate Governance:** Add or remove candidates on the fly with customized symbols, manifesto agendas, and party affiliations.
- **Adversarial Security & Tamper Lab:** Interactive security audit to simulate data modification attacks and demonstrate instant consensus failure detection.
- **Self-Healing Chain Tool:** Re-computes consensus nonces across the chain to demonstrate distributed ledger recovery.

---

##  Technology Stack

- **Frontend:** React 18, Socket.IO Client, Vanilla CSS Design System, Plus Jakarta Sans, JetBrains Mono
- **Backend:** Node.js, Express, Socket.IO, MySQL (`mysql2/promise`), JWT, BcryptJS, Crypto (SHA-256)
- **Database:** MySQL (Persistent storage for blocks, mempool, candidates, and voters)

---

##  Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/) running locally on port `3306`

### 2. Database Setup
Create a MySQL database named `blockchain_voting`:
```sql
CREATE DATABASE blockchain_voting;
```

### 3. Environment Variables
Create a `.env` file in the `backend/` folder (or copy from `.env.example`):
```env
PORT=5000
JWT_SECRET=super_secret_blockchain_jwt_key_2026
MINING_DIFFICULTY=2

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=blockchain_voting
DB_PORT=3306
```

### 4. Installation
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 5. Running Locally
From the root directory:
```bash
npm run dev
```
- **Web App:** http://localhost:3000
- **API Server:** http://localhost:5000

---

## 📄 License
MIT License
