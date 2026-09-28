import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { initDB } from './database.js';
import { Blockchain } from './models/Blockchain.js';
import authRoutes from './routes/authRoutes.js';
import blockchainRoutes from './routes/blockchainRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/voter', voteRoutes); // Fallback alias
app.use('/api/admin', adminRoutes);

export const blockchain = new Blockchain();

// Real-time WebSocket broadcasting utility
export function broadcast(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

io.on('connection', (socket) => {
  console.log('⚡ Client connected to blockchain websocket feed:', socket.id);
  socket.on('disconnect', () => {
    // client disconnected
  });
});

async function start() {
  try {
    await initDB();
    await blockchain.initialize();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Real-time Blockchain Voting Node active on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
  }
}

start();