import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { GameManager } from "./game-manager";
import { wsMessageSchema } from "@shared/schema";
import { log } from "./index";

const gameManager = new GameManager();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const sessionId = Math.random().toString(36).substring(7);
    log(`WebSocket connected: ${sessionId}`, 'websocket');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const parsed = wsMessageSchema.parse(message);

        switch (parsed.type) {
          case 'create_room': {
            const roomCode = await gameManager.createRoom(sessionId, parsed.playerName, ws);
            ws.send(JSON.stringify({ type: 'room_created', roomCode }));
            await gameManager.broadcastGameState(roomCode);
            log(`Room created: ${roomCode}`, 'game');
            break;
          }

          case 'join_room': {
            const success = await gameManager.joinRoom(parsed.roomCode, sessionId, parsed.playerName, ws);
            if (success) {
              ws.send(JSON.stringify({ type: 'room_joined', roomCode: parsed.roomCode }));
              log(`Player joined room: ${parsed.roomCode}`, 'game');
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Room not found or already started' }));
            }
            break;
          }

          case 'start_game': {
            await gameManager.startGame(parsed.roomCode);
            log(`Game started: ${parsed.roomCode}`, 'game');
            break;
          }

          case 'mark_cell': {
            await gameManager.markCell(
              parsed.roomCode,
              parsed.playerId,
              parsed.ticketIndex,
              parsed.rowIndex,
              parsed.colIndex
            );
            break;
          }
        }
      } catch (error) {
        log(`WebSocket error: ${error}`, 'websocket');
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', async () => {
      log(`WebSocket disconnected: ${sessionId}`, 'websocket');
      await gameManager.handleDisconnect(sessionId);
    });

    ws.on('error', (error) => {
      log(`WebSocket error: ${error}`, 'websocket');
    });
  });

  // API Routes for room info (optional REST endpoints)
  app.get('/api/room/:code', async (req, res) => {
    const room = await storage.getGameRoom(req.params.code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const players = await storage.getPlayersInRoom(room.id);
    res.json({ room, players });
  });

  return httpServer;
}
