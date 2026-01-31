import express from 'express';
import matchRouter from './routes/matches.js';
import { createWebSocketServer } from './ws/server.js';
import { createServer } from 'http';

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = createServer(app);

app.use(express.json());

app.use('/matches', matchRouter);

const { broadcastMatchCreated } =  createWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocket server is running on ${baseUrl.replace('http://', 'ws://')}/ws`);
});
