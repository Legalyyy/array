import {
  conversations,
  tradeRecaps,
  accessRequests,
  botKnowledge,
  serverSettings,
  tempVoiceChannels,
  type Conversation,
  type InsertConversation,
  type TradeRecap,
  type InsertTradeRecap,
  type AccessRequest,
  type InsertAccessRequest,
  type BotKnowledge,
  type InsertBotKnowledge,
  type ServerSettings,
  type InsertServerSettings,
  type TempVoiceChannel,
  type InsertTempVoiceChannel,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Conversations
  addConversation(conversation: InsertConversation): Promise<Conversation>;
  getRecentConversations(limit: number): Promise<Conversation[]>;
  
  // Trade Recaps
  addTradeRecap(recap: InsertTradeRecap): Promise<TradeRecap>;
  getTradeRecapsByUser(userId: string): Promise<TradeRecap[]>;
  
  // Access Requests
  addAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequests(status?: string): Promise<AccessRequest[]>;
  
  // Bot Knowledge
  addOrUpdateKnowledge(knowledge: InsertBotKnowledge): Promise<BotKnowledge>;
  getKnowledge(key: string): Promise<BotKnowledge | undefined>;
  getAllKnowledge(): Promise<BotKnowledge[]>;
  
  // Server Settings
  getServerSettings(guildId: string): Promise<ServerSettings | undefined>;
  updateServerSettings(guildId: string, settings: Partial<InsertServerSettings>): Promise<ServerSettings>;
  
  // Temp Voice Channels
  addTempVoiceChannel(channel: InsertTempVoiceChannel): Promise<TempVoiceChannel>;
  getTempVoiceChannel(channelId: string): Promise<TempVoiceChannel | undefined>;
  deleteTempVoiceChannel(channelId: string): Promise<void>;
  getAllTempVoiceChannels(): Promise<TempVoiceChannel[]>;
}

export class DatabaseStorage implements IStorage {
  // Conversations
  async addConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return result;
  }

  async getRecentConversations(limit: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.timestamp))
      .limit(limit);
  }

  // Trade Recaps
  async addTradeRecap(recap: InsertTradeRecap): Promise<TradeRecap> {
    const [result] = await db
      .insert(tradeRecaps)
      .values(recap)
      .returning();
    return result;
  }

  async getTradeRecapsByUser(userId: string): Promise<TradeRecap[]> {
    return await db
      .select()
      .from(tradeRecaps)
      .where(eq(tradeRecaps.userId, userId))
      .orderBy(desc(tradeRecaps.createdAt));
  }

  // Access Requests
  async addAccessRequest(request: InsertAccessRequest): Promise<AccessRequest> {
    const [result] = await db
      .insert(accessRequests)
      .values(request)
      .returning();
    return result;
  }

  async getAccessRequests(status?: string): Promise<AccessRequest[]> {
    if (status) {
      return await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.status, status))
        .orderBy(desc(accessRequests.createdAt));
    }
    return await db
      .select()
      .from(accessRequests)
      .orderBy(desc(accessRequests.createdAt));
  }

  // Bot Knowledge
  async addOrUpdateKnowledge(knowledge: InsertBotKnowledge): Promise<BotKnowledge> {
    const existing = await this.getKnowledge(knowledge.key);
    
    if (existing) {
      const [updated] = await db
        .update(botKnowledge)
        .set({
          value: knowledge.value,
          addedBy: knowledge.addedBy,
          updatedAt: new Date(),
        })
        .where(eq(botKnowledge.key, knowledge.key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(botKnowledge)
        .values(knowledge)
        .returning();
      return created;
    }
  }

  async getKnowledge(key: string): Promise<BotKnowledge | undefined> {
    const [result] = await db
      .select()
      .from(botKnowledge)
      .where(eq(botKnowledge.key, key));
    return result || undefined;
  }

  async getAllKnowledge(): Promise<BotKnowledge[]> {
    return await db.select().from(botKnowledge);
  }

  // Server Settings
  async getServerSettings(guildId: string): Promise<ServerSettings | undefined> {
    const [result] = await db
      .select()
      .from(serverSettings)
      .where(eq(serverSettings.guildId, guildId));
    return result || undefined;
  }

  async updateServerSettings(guildId: string, settings: Partial<InsertServerSettings>): Promise<ServerSettings> {
    const existing = await this.getServerSettings(guildId);
    
    if (existing) {
      const [updated] = await db
        .update(serverSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(serverSettings.guildId, guildId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(serverSettings)
        .values({ guildId, ...settings })
        .returning();
      return created;
    }
  }

  // Temp Voice Channels
  async addTempVoiceChannel(channel: InsertTempVoiceChannel): Promise<TempVoiceChannel> {
    const [result] = await db
      .insert(tempVoiceChannels)
      .values(channel)
      .returning();
    return result;
  }

  async getTempVoiceChannel(channelId: string): Promise<TempVoiceChannel | undefined> {
    const [result] = await db
      .select()
      .from(tempVoiceChannels)
      .where(eq(tempVoiceChannels.channelId, channelId));
    return result || undefined;
  }

  async deleteTempVoiceChannel(channelId: string): Promise<void> {
    await db
      .delete(tempVoiceChannels)
      .where(eq(tempVoiceChannels.channelId, channelId));
  }

  async getAllTempVoiceChannels(): Promise<TempVoiceChannel[]> {
    return await db.select().from(tempVoiceChannels);
  }
}

export const storage = new DatabaseStorage();
