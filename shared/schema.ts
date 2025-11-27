import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameRooms = pgTable("game_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomCode: varchar("room_code", { length: 4 }).notNull().unique(),
  hostId: varchar("host_id").notNull(),
  status: varchar("status").notNull().default('lobby'), // lobby, countdown, running, paused, ended
  mode: varchar("mode").notNull().default('friends'), // solo, friends
  currentNumber: integer("current_number"),
  calledNumbers: jsonb("called_numbers").$type<number[]>().notNull().default([]),
  callIntervalMs: integer("call_interval_ms").notNull().default(4000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const gamePlayers = pgTable("game_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => gameRooms.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id").notNull(), // Socket/client session
  name: varchar("name").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  isHost: boolean("is_host").notNull().default(false),
  ticketData: jsonb("ticket_data").notNull(), // Store full ticket structure
  avatar: varchar("avatar"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertGameRoomSchema = createInsertSchema(gameRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).omit({
  id: true,
  joinedAt: true,
});

export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameRoom = z.infer<typeof insertGameRoomSchema>;
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join_room'),
    roomCode: z.string(),
    playerName: z.string(),
  }),
  z.object({
    type: z.literal('create_room'),
    playerName: z.string(),
  }),
  z.object({
    type: z.literal('create_solo_room'),
    playerName: z.string(),
  }),
  z.object({
    type: z.literal('start_game'),
    roomCode: z.string(),
  }),
  z.object({
    type: z.literal('mark_cell'),
    roomCode: z.string(),
    playerId: z.string(),
    ticketIndex: z.number(),
    rowIndex: z.number(),
    colIndex: z.number(),
  }),
  z.object({
    type: z.literal('game_tick'),
    roomCode: z.string(),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
