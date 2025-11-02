import {
  conversations,
  tradeRecaps,
  accessRequests,
  botKnowledge,
  serverSettings,
  tempVoiceChannels,
  learnedFacts,
  accessCodes,
  profileCustomizations,
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
  type LearnedFact,
  type InsertLearnedFact,
  type AccessCode,
  type InsertAccessCode,
  type ProfileCustomization,
  type InsertProfileCustomization,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // Conversations
  addConversation(conversation: InsertConversation): Promise<Conversation>;
  getRecentConversations(limit: number): Promise<Conversation[]>;
  
  // Trade Recaps
  addTradeRecap(recap: InsertTradeRecap): Promise<TradeRecap>;
  getTradeRecapsByUser(userId: string): Promise<TradeRecap[]>;
  getTradeRecapsByUsername(username: string): Promise<TradeRecap[]>;
  getTradeRecapById(id: number): Promise<TradeRecap | undefined>;
  deleteTradeRecap(id: number): Promise<void>;
  
  // Access Requests
  addAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequests(status?: string): Promise<AccessRequest[]>;
  
  // Bot Knowledge
  addOrUpdateKnowledge(knowledge: InsertBotKnowledge): Promise<BotKnowledge>;
  getKnowledge(key: string): Promise<BotKnowledge | undefined>;
  getAllKnowledge(): Promise<BotKnowledge[]>;
  deleteKnowledge(key: string): Promise<void>;
  
  // Server Settings
  getServerSettings(guildId: string): Promise<ServerSettings | undefined>;
  updateServerSettings(guildId: string, settings: Partial<InsertServerSettings>): Promise<ServerSettings>;
  
  // Temp Voice Channels
  addTempVoiceChannel(channel: InsertTempVoiceChannel): Promise<TempVoiceChannel>;
  getTempVoiceChannel(channelId: string): Promise<TempVoiceChannel | undefined>;
  deleteTempVoiceChannel(channelId: string): Promise<void>;
  getAllTempVoiceChannels(): Promise<TempVoiceChannel[]>;
  
  // Learned Facts
  addOrUpdateLearnedFact(fact: InsertLearnedFact): Promise<LearnedFact>;
  getLearnedFactsByUser(userId: string): Promise<LearnedFact[]>;
  getLearnedFactByKey(userId: string, factKey: string): Promise<LearnedFact | undefined>;
  deleteLearnedFact(userId: string, factKey: string): Promise<void>;
  getAllLearnedFacts(): Promise<LearnedFact[]>;
  
  // Access Codes
  createAccessCode(accessCode: InsertAccessCode): Promise<AccessCode>;
  getAccessCodeByCode(code: string): Promise<AccessCode | undefined>;
  getAccessCodeByUserId(userId: string): Promise<AccessCode | undefined>;
  getAllAccessCodes(): Promise<AccessCode[]>;
  markCodeAsUsed(code: string): Promise<AccessCode | undefined>;
  deleteExpiredCodes(): Promise<void>;
  deleteAccessCodeByUserId(userId: string): Promise<void>;
  
  // Profile Customizations
  getProfileCustomization(userId: string): Promise<ProfileCustomization | undefined>;
  saveProfileCustomization(customization: InsertProfileCustomization): Promise<ProfileCustomization>;
  deleteProfileCustomization(userId: string): Promise<void>;
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

  async getTradeRecapsByUsername(username: string): Promise<TradeRecap[]> {
    return await db
      .select()
      .from(tradeRecaps)
      .where(sql`LOWER(${tradeRecaps.username}) = LOWER(${username})`)
      .orderBy(desc(tradeRecaps.createdAt));
  }

  async getTradeRecapById(id: number): Promise<TradeRecap | undefined> {
    const [result] = await db
      .select()
      .from(tradeRecaps)
      .where(eq(tradeRecaps.id, id));
    return result || undefined;
  }

  async deleteTradeRecap(id: number): Promise<void> {
    await db
      .delete(tradeRecaps)
      .where(eq(tradeRecaps.id, id));
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

  async deleteKnowledge(key: string): Promise<void> {
    await db.delete(botKnowledge).where(eq(botKnowledge.key, key));
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

  // Learned Facts
  async addOrUpdateLearnedFact(fact: InsertLearnedFact): Promise<LearnedFact> {
    const existing = await this.getLearnedFactByKey(fact.userId, fact.factKey);
    
    if (existing) {
      // Update existing fact and increase confidence
      const [updated] = await db
        .update(learnedFacts)
        .set({
          factValue: fact.factValue,
          confidence: existing.confidence + 1,
          learnedFrom: fact.learnedFrom,
          updatedAt: new Date(),
        })
        .where(and(
          eq(learnedFacts.userId, fact.userId),
          eq(learnedFacts.factKey, fact.factKey)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(learnedFacts)
        .values(fact)
        .returning();
      return created;
    }
  }

  async getLearnedFactsByUser(userId: string): Promise<LearnedFact[]> {
    return await db
      .select()
      .from(learnedFacts)
      .where(eq(learnedFacts.userId, userId))
      .orderBy(desc(learnedFacts.confidence));
  }

  async getLearnedFactByKey(userId: string, factKey: string): Promise<LearnedFact | undefined> {
    const [result] = await db
      .select()
      .from(learnedFacts)
      .where(and(
        eq(learnedFacts.userId, userId),
        eq(learnedFacts.factKey, factKey)
      ));
    return result || undefined;
  }

  async deleteLearnedFact(userId: string, factKey: string): Promise<void> {
    await db
      .delete(learnedFacts)
      .where(and(
        eq(learnedFacts.userId, userId),
        eq(learnedFacts.factKey, factKey)
      ));
  }

  async getAllLearnedFacts(): Promise<LearnedFact[]> {
    return await db
      .select()
      .from(learnedFacts)
      .orderBy(desc(learnedFacts.confidence))
      .limit(100);
  }

  // Access Codes
  async createAccessCode(accessCode: InsertAccessCode): Promise<AccessCode> {
    const [result] = await db
      .insert(accessCodes)
      .values(accessCode)
      .returning();
    return result;
  }

  async getAccessCodeByCode(code: string): Promise<AccessCode | undefined> {
    const [result] = await db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.code, code));
    return result || undefined;
  }

  async getAccessCodeByUserId(userId: string): Promise<AccessCode | undefined> {
    const [result] = await db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.userId, userId))
      .orderBy(desc(accessCodes.createdAt))
      .limit(1);
    return result || undefined;
  }

  async getAllAccessCodes(): Promise<AccessCode[]> {
    return await db
      .select()
      .from(accessCodes)
      .orderBy(desc(accessCodes.createdAt));
  }

  async markCodeAsUsed(code: string): Promise<AccessCode | undefined> {
    const [result] = await db
      .update(accessCodes)
      .set({
        isUsed: true,
        usedAt: new Date(),
      })
      .where(eq(accessCodes.code, code))
      .returning();
    return result || undefined;
  }

  async deleteExpiredCodes(): Promise<void> {
    await db
      .delete(accessCodes)
      .where(lt(accessCodes.expiresAt, new Date()));
  }

  async deleteAccessCodeByUserId(userId: string): Promise<void> {
    await db
      .delete(accessCodes)
      .where(eq(accessCodes.userId, userId));
  }

  // Profile Customizations
  async getProfileCustomization(userId: string): Promise<ProfileCustomization | undefined> {
    const [result] = await db
      .select()
      .from(profileCustomizations)
      .where(eq(profileCustomizations.userId, userId));
    return result || undefined;
  }

  async saveProfileCustomization(customization: InsertProfileCustomization): Promise<ProfileCustomization> {
    const existing = await this.getProfileCustomization(customization.userId);
    
    if (existing) {
      const [updated] = await db
        .update(profileCustomizations)
        .set({
          ...customization,
          updatedAt: new Date(),
        })
        .where(eq(profileCustomizations.userId, customization.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(profileCustomizations)
        .values(customization)
        .returning();
      return created;
    }
  }

  async deleteProfileCustomization(userId: string): Promise<void> {
    await db
      .delete(profileCustomizations)
      .where(eq(profileCustomizations.userId, userId));
  }
}

export const storage = new DatabaseStorage();
