// server.js (ESM)
import 'dotenv/config'; // Load env vars BEFORE other imports
import express from 'express';
// import dotenv from 'dotenv'; // Removed manual config call
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDb from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import systemRoutes from './routes/systemRoutes.js';   // ← public read-only state
import adminRoutes from './routes/adminRoutes.js';     // ← admin toggle
import userUpdateRoutes from "./routes/userUpdateRoutes.js";
import uploadRoutes from './routes/uploadRoutes.js';

import { initBroadcastThread } from './utils/initBroadcastThread.js';
import { attachSocketAuth } from './middleware/authSocket.js';
import { registerSockets } from './sockets/index.js';
import { loadSystemState, getSystemState } from './utils/systemState.js'; // ← kill switch cache

// dotenv.config(); // Loaded at top

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: '*', // tighten to your client origin if desired
    credentials: true,
  })
);
// Serve uploaded files statically
app.use('/uploads', express.static('public/uploads'));

// REST Routes
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/system', systemRoutes); // GET /state (auth required)
app.use('/api/admin', adminRoutes);   // GET/PUT /system (admin only)
app.use('/api/upload', uploadRoutes); // New upload endpoint
app.use("/api/users", userUpdateRoutes);

async function start() {
  try {
    // 1) DB
    await connectDb();
    console.log('[db] connected');

    // 2) Ensure single broadcast thread and keep its _id
    const broadcastThreadId = await initBroadcastThread();
    console.log('[seed] broadcast thread is ready:', String(broadcastThreadId));

    // 3) Load system state (kill switch) into cache
    await loadSystemState();
    console.log('[system] state:', getSystemState());

    // 4) HTTP + Socket.IO
    const server = createServer(app);
    const io = new Server(server, {
      cors: { origin: '*', credentials: true },
      transports: ['websocket', 'polling'],
    });

    // 5) Socket auth + initial state emit + handlers
    attachSocketAuth(io);

    // On every connection, immediately send current system state
    io.on('connection', (socket) => {
      socket.emit('system:state', getSystemState());
    });

    // Register app sockets (presence, chat, broadcast, calls)
    registerSockets(io, { broadcastThreadId });

    // 6) Expose to app (optional, handy in routes/controllers)
    app.set('io', io);
    app.set('broadcastThreadId', broadcastThreadId);

    // 7) Start
    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

start();

export default app;
