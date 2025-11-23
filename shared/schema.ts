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
  welcomeRoleId: text("welcome_role_id"), // Role to assign when new members join
  welcomeMessage: text("welcome_message"), // DM message to send to new members
  lastBibleSent: timestamp("last_bible_sent"), // Last time bible verse was sent
  logsChannelId: text("logs_channel_id"), // Channel for comprehensive server logs
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

// Learned facts - dynamic facts the bot learns from conversations
export const learnedFacts = pgTable("learned_facts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // user this fact is about
  username: text("username").notNull(),
  factType: text("fact_type").notNull(), // e.g., "location", "preference", "skill", "opinion"
  factKey: text("fact_key").notNull(), // e.g., "country", "favorite_stock", "trading_style"
  factValue: text("fact_value").notNull(), // e.g., "Mexico", "SPY", "day trading"
  confidence: integer("confidence").notNull().default(1), // how many times this fact was mentioned
  learnedFrom: text("learned_from").notNull(), // context where it was learned
  guildId: text("guild_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Access codes - unique codes for web login
export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // XXX-XXX format
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"), // Discord avatar URL
  roles: text("roles").array(), // User's Discord role IDs
  hasRequiredRole: boolean("has_required_role").notNull().default(false), // Has server booster role
  isUsed: boolean("is_used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(), // Code expiration (24 hours)
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Profile customizations - store user profile settings
export const profileCustomizations = pgTable("profile_customizations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  backgroundImage: text("background_image"),
  backgroundColor: text("background_color"),
  backgroundGradient: text("background_gradient"),
  overlayColor: text("overlay_color"),
  overlayOpacity: integer("overlay_opacity"),
  backgroundBlur: integer("background_blur"),
  nameFont: text("name_font"),
  nameFontSize: text("name_font_size"),
  nameColor: text("name_color"),
  nameGradient: text("name_gradient"),
  nameGlowColor: text("name_glow_color"),
  nameAnimation: text("name_animation"),
  galleryDisplay: text("gallery_display"),
  avatarGlowColor: text("avatar_glow_color"),
  avatarGlowEnabled: boolean("avatar_glow_enabled").notNull().default(true),
  profileEffect: text("profile_effect"),
  profileIntro: text("profile_intro"),
  showPnl: boolean("show_pnl").notNull().default(true),
  showNotes: boolean("show_notes").notNull().default(true),
  isProfilePublic: boolean("is_profile_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Welcomed members - tracks users who received welcome role and DM
export const welcomedMembers = pgTable("welcomed_members", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  welcomedAt: timestamp("welcomed_at").defaultNow().notNull(),
});

// Scheduled messages (Rigor system) - for recurring messages
export const scheduledMessages = pgTable("scheduled_messages", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  message: text("message").notNull(),
  intervalMinutes: integer("interval_minutes").notNull(), // How often to send (in minutes)
  lastSentAt: timestamp("last_sent_at"),
  createdBy: text("created_by").notNull(), // User ID who created it
  createdByUsername: text("created_by_username").notNull(),
  isActive: boolean("is_active").notNull().default(true),
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

export type LearnedFact = typeof learnedFacts.$inferSelect;
export type InsertLearnedFact = z.infer<typeof insertLearnedFactSchema>;
export const insertLearnedFactSchema = createInsertSchema(learnedFacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AccessCode = typeof accessCodes.$inferSelect;
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({
  id: true,
  createdAt: true,
  isUsed: true,
  usedAt: true,
});

export type ProfileCustomization = typeof profileCustomizations.$inferSelect;
export type InsertProfileCustomization = z.infer<typeof insertProfileCustomizationSchema>;
export const insertProfileCustomizationSchema = createInsertSchema(profileCustomizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WelcomedMember = typeof welcomedMembers.$inferSelect;
export type InsertWelcomedMember = z.infer<typeof insertWelcomedMemberSchema>;
export const insertWelcomedMemberSchema = createInsertSchema(welcomedMembers).omit({
  id: true,
  welcomedAt: true,
});

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = z.infer<typeof insertScheduledMessageSchema>;
export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSentAt: true,
});
