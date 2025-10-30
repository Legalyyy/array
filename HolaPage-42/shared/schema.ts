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

// Trade recaps table - now with image support
export const tradeRecaps = pgTable("trade_recaps", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  notes: text("notes").notNull(),
  pnl: text("pnl").notNull(),
  imageUrl: text("image_url"), // Optional image URL
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

// Server settings - for channel configurations
export const serverSettings = pgTable("server_settings", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  bibleChannelId: text("bible_channel_id"), // Channel for daily bible verses
  newsChannelId: text("news_channel_id"), // Channel for trading news
  vcTriggerChannelId: text("vc_trigger_channel_id"), // Voice channel that triggers temp VC creation
  vcCategoryId: text("vc_category_id"), // Category where temp VCs are created
  requestRequiredRoleId: text("request_required_role_id"), // Required role to use /request command
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Temporary voice channels - tracks VC created by users
export const tempVoiceChannels = pgTable("temp_voice_channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
  guildId: text("guild_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export type ServerSettings = typeof serverSettings.$inferSelect;
export type InsertServerSettings = z.infer<typeof insertServerSettingsSchema>;
export const insertServerSettingsSchema = createInsertSchema(serverSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TempVoiceChannel = typeof tempVoiceChannels.$inferSelect;
export type InsertTempVoiceChannel = z.infer<typeof insertTempVoiceChannelSchema>;
export const insertTempVoiceChannelSchema = createInsertSchema(tempVoiceChannels).omit({
  id: true,
  createdAt: true,
});
