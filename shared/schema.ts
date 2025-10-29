import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Conversations table - stores all bot interactions for learning
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  channelId: text("channel_id").notNull(),
  guildId: text("guild_id").notNull(),
  userMessage: text("user_message").notNull(),
  botResponse: text("bot_response").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Trade recaps table
export const tradeRecaps = pgTable("trade_recaps", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  notes: text("notes").notNull(),
  pnl: text("pnl").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Access requests table
export const accessRequests = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  tradingExperience: text("trading_experience").notNull(),
  isProfitable: text("is_profitable").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bot knowledge - custom facts and learnings
export const botKnowledge = pgTable("bot_knowledge", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., "wong_means", "server_topic"
  value: text("value").notNull(),
  addedBy: text("added_by").notNull(), // user who added this
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  timestamp: true,
});

export type TradeRecap = typeof tradeRecaps.$inferSelect;
export type InsertTradeRecap = z.infer<typeof insertTradeRecapSchema>;
export const insertTradeRecapSchema = createInsertSchema(tradeRecaps).omit({
  id: true,
  createdAt: true,
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type BotKnowledge = typeof botKnowledge.$inferSelect;
export type InsertBotKnowledge = z.infer<typeof insertBotKnowledgeSchema>;
export const insertBotKnowledgeSchema = createInsertSchema(botKnowledge).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
