import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and } from 'drizzle-orm';
import * as schema from '@shared/schema';
import type { GameRoom, InsertGameRoom, GamePlayer, InsertGamePlayer } from '@shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export interface IStorage {
  // Game Room Operations
  createGameRoom(room: InsertGameRoom): Promise<GameRoom>;
  getGameRoom(roomCode: string): Promise<GameRoom | undefined>;
  updateGameRoom(roomCode: string, updates: Partial<GameRoom>): Promise<GameRoom | undefined>;
  deleteGameRoom(roomCode: string): Promise<void>;
  
  // Player Operations
  addPlayerToRoom(player: InsertGamePlayer): Promise<GamePlayer>;
  getPlayersInRoom(roomId: string): Promise<GamePlayer[]>;
  updatePlayer(playerId: string, updates: Partial<GamePlayer>): Promise<GamePlayer | undefined>;
  removePlayerFromRoom(playerId: string): Promise<void>;
  removePlayerBySession(sessionId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createGameRoom(room: InsertGameRoom): Promise<GameRoom> {
    const [newRoom] = await db.insert(schema.gameRooms).values({
      ...room,
      calledNumbers: room.calledNumbers || [],
    } as any).returning();
    return newRoom;
  }

  async getGameRoom(roomCode: string): Promise<GameRoom | undefined> {
    const [room] = await db
      .select()
      .from(schema.gameRooms)
      .where(eq(schema.gameRooms.roomCode, roomCode))
      .limit(1);
    return room;
  }

  async updateGameRoom(roomCode: string, updates: Partial<GameRoom>): Promise<GameRoom | undefined> {
    const [updated] = await db
      .update(schema.gameRooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.gameRooms.roomCode, roomCode))
      .returning();
    return updated;
  }

  async deleteGameRoom(roomCode: string): Promise<void> {
    await db.delete(schema.gameRooms).where(eq(schema.gameRooms.roomCode, roomCode));
  }

  async addPlayerToRoom(player: InsertGamePlayer): Promise<GamePlayer> {
    const [newPlayer] = await db.insert(schema.gamePlayers).values(player).returning();
    return newPlayer;
  }

  async getPlayersInRoom(roomId: string): Promise<GamePlayer[]> {
    return await db
      .select()
      .from(schema.gamePlayers)
      .where(eq(schema.gamePlayers.roomId, roomId));
  }

  async updatePlayer(playerId: string, updates: Partial<GamePlayer>): Promise<GamePlayer | undefined> {
    const [updated] = await db
      .update(schema.gamePlayers)
      .set(updates)
      .where(eq(schema.gamePlayers.id, playerId))
      .returning();
    return updated;
  }

  async removePlayerFromRoom(playerId: string): Promise<void> {
    await db.delete(schema.gamePlayers).where(eq(schema.gamePlayers.id, playerId));
  }

  async removePlayerBySession(sessionId: string): Promise<void> {
    await db.delete(schema.gamePlayers).where(eq(schema.gamePlayers.sessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();
