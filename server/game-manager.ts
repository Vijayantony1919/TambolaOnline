import { WebSocket } from 'ws';
import { storage } from './storage';
import type { GameRoom, GamePlayer } from '@shared/schema';

interface GameSession {
  roomCode: string;
  interval?: NodeJS.Timeout;
  players: Map<string, WebSocket>; // sessionId -> WebSocket
}

export class GameManager {
  private sessions: Map<string, GameSession> = new Map(); // roomCode -> GameSession

  async createRoom(hostSessionId: string, hostName: string, ws: WebSocket): Promise<string> {
    const roomCode = this.generateRoomCode();
    
    const room = await storage.createGameRoom({
      roomCode,
      hostId: hostSessionId,
      status: 'lobby',
      mode: 'friends',
      currentNumber: null,
      calledNumbers: [],
      callIntervalMs: 4000,
    });

    // Add host as player
    const ticketData = this.generateTicket();
    await storage.addPlayerToRoom({
      roomId: room.id,
      sessionId: hostSessionId,
      name: hostName,
      isBot: false,
      isHost: true,
      ticketData,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}`,
    });

    // Create game session
    this.sessions.set(roomCode, {
      roomCode,
      players: new Map([[hostSessionId, ws]]),
    });

    return roomCode;
  }

  async createSoloRoom(hostSessionId: string, hostName: string, ws: WebSocket): Promise<string> {
    const roomCode = this.generateRoomCode();
    
    const room = await storage.createGameRoom({
      roomCode,
      hostId: hostSessionId,
      status: 'lobby',
      mode: 'solo',
      currentNumber: null,
      calledNumbers: [],
      callIntervalMs: 4000,
    });

    // Add host as player
    const ticketData = this.generateTicket();
    await storage.addPlayerToRoom({
      roomId: room.id,
      sessionId: hostSessionId,
      name: hostName,
      isBot: false,
      isHost: true,
      ticketData,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}`,
    });

    // Add 2 bots
    const botNames = ['Lucky Bot', 'Clever Bot'];
    for (const botName of botNames) {
      const botTicketData = this.generateTicket();
      await storage.addPlayerToRoom({
        roomId: room.id,
        sessionId: `bot-${Date.now()}-${Math.random()}`,
        name: botName,
        isBot: true,
        isHost: false,
        ticketData: botTicketData,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${botName}`,
      });
    }

    // Create game session
    this.sessions.set(roomCode, {
      roomCode,
      players: new Map([[hostSessionId, ws]]),
    });

    return roomCode;
  }

  async joinRoom(roomCode: string, sessionId: string, playerName: string, ws: WebSocket): Promise<boolean> {
    const room = await storage.getGameRoom(roomCode);
    if (!room || room.status !== 'lobby') {
      return false;
    }

    const ticketData = this.generateTicket();
    await storage.addPlayerToRoom({
      roomId: room.id,
      sessionId,
      name: playerName,
      isBot: false,
      isHost: false,
      ticketData,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName}`,
    });

    const session = this.sessions.get(roomCode);
    if (session) {
      session.players.set(sessionId, ws);
    } else {
      this.sessions.set(roomCode, {
        roomCode,
        players: new Map([[sessionId, ws]]),
      });
    }

    // Broadcast to all players
    await this.broadcastGameState(roomCode);
    return true;
  }

  async startGame(roomCode: string): Promise<void> {
    const room = await storage.getGameRoom(roomCode);
    if (!room) return;

    await storage.updateGameRoom(roomCode, { status: 'countdown' });
    await this.broadcastGameState(roomCode);

    // Countdown then start
    setTimeout(async () => {
      await storage.updateGameRoom(roomCode, { status: 'running' });
      await this.broadcastGameState(roomCode);
      this.startGameLoop(roomCode);
    }, 3000);
  }

  private startGameLoop(roomCode: string): void {
    const session = this.sessions.get(roomCode);
    if (!session) return;

    const startLoop = async () => {
      const room = await storage.getGameRoom(roomCode);
      if (!room) return;

      session.interval = setInterval(async () => {
        const currentRoom = await storage.getGameRoom(roomCode);
        if (!currentRoom || currentRoom.status !== 'running') {
          this.stopGameLoop(roomCode);
          return;
        }

        const available = Array.from({ length: 90 }, (_, i) => i + 1).filter(
          n => !(currentRoom.calledNumbers as number[]).includes(n)
        );

        if (available.length === 0) {
          await storage.updateGameRoom(roomCode, { status: 'ended' });
          await this.broadcastGameState(roomCode);
          this.stopGameLoop(roomCode);
          return;
        }

        const nextNum = available[Math.floor(Math.random() * available.length)];
        const updatedCalled = [nextNum, ...(currentRoom.calledNumbers as number[])];

        await storage.updateGameRoom(roomCode, {
          currentNumber: nextNum,
          calledNumbers: updatedCalled as any,
        });

        await this.broadcastGameState(roomCode);
      }, room.callIntervalMs);
    };

    startLoop();
  }

  private stopGameLoop(roomCode: string): void {
    const session = this.sessions.get(roomCode);
    if (session?.interval) {
      clearInterval(session.interval);
      session.interval = undefined;
    }
  }

  async markCell(roomCode: string, playerId: string, ticketIndex: number, rowIndex: number, colIndex: number): Promise<void> {
    const players = await storage.getPlayersInRoom(roomCode);
    const player = players.find(p => p.id === playerId);
    
    if (!player) return;

    const ticketData = player.ticketData as any;
    const ticket = ticketData[ticketIndex];
    
    if (ticket && ticket[rowIndex] && ticket[rowIndex][colIndex]) {
      ticket[rowIndex][colIndex].marked = !ticket[rowIndex][colIndex].marked;
    }

    await storage.updatePlayer(playerId, { ticketData });
    await this.broadcastGameState(roomCode);
  }

  async broadcastGameState(roomCode: string): Promise<void> {
    const room = await storage.getGameRoom(roomCode);
    if (!room) return;

    const players = await storage.getPlayersInRoom(room.id);
    const session = this.sessions.get(roomCode);
    
    if (!session) return;

    const gameState = {
      type: 'game_state',
      room,
      players,
    };

    const message = JSON.stringify(gameState);
    session.players.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  async handleDisconnect(sessionId: string): Promise<void> {
    await storage.removePlayerBySession(sessionId);
    
    // Find and remove from session
    const entries = Array.from(this.sessions.entries());
    for (const [roomCode, session] of entries) {
      if (session.players.has(sessionId)) {
        session.players.delete(sessionId);
        await this.broadcastGameState(roomCode);
        
        // Clean up empty rooms
        if (session.players.size === 0) {
          this.stopGameLoop(roomCode);
          this.sessions.delete(roomCode);
          await storage.deleteGameRoom(roomCode);
        }
      }
    }
  }

  private generateRoomCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private generateTicket(): any {
    const COL_RANGES = [
      { min: 1, max: 9 },
      { min: 10, max: 19 },
      { min: 20, max: 29 },
      { min: 30, max: 39 },
      { min: 40, max: 49 },
      { min: 50, max: 59 },
      { min: 60, max: 69 },
      { min: 70, max: 79 },
      { min: 80, max: 90 },
    ];

    const ticket = [
      Array(9).fill(null),
      Array(9).fill(null),
      Array(9).fill(null),
    ];

    const usedNumbers = new Set<number>();

    for (let r = 0; r < 3; r++) {
      const cols = new Set<number>();
      while (cols.size < 5) {
        cols.add(Math.floor(Math.random() * 9));
      }
      
      const sortedCols = Array.from(cols).sort((a, b) => a - b);

      for (const c of sortedCols) {
        const range = COL_RANGES[c];
        let num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        
        let attempts = 0;
        while (usedNumbers.has(num) && attempts < 100) {
          num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
          attempts++;
        }
        
        usedNumbers.add(num);
        ticket[r][c] = { 
          number: num, 
          marked: false, 
          id: `cell-${r}-${c}-${Math.random().toString(36).substr(2, 9)}` 
        };
      }
    }

    // Sort columns
    for (let c = 0; c < 9; c++) {
      const colNums: number[] = [];
      const colIndices: number[] = [];

      for (let r = 0; r < 3; r++) {
        if (ticket[r][c] !== null) {
          colNums.push(ticket[r][c].number);
          colIndices.push(r);
        }
      }

      colNums.sort((a, b) => a - b);

      colIndices.forEach((r, i) => {
        if (ticket[r][c]) {
          ticket[r][c].number = colNums[i];
        }
      });
    }

    return [ticket]; // Return as array of tickets
  }
}
