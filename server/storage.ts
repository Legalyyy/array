import {
  conversations,
  tradeRecaps,
  accessRequests,
  botKnowledge,
  type Conversation,
  type InsertConversation,
  type TradeRecap,
  type InsertTradeRecap,
  type AccessRequest,
  type InsertAccessRequest,
  type BotKnowledge,
  type InsertBotKnowledge,
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
}

export const storage = new DatabaseStorage();
