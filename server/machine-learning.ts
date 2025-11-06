import fs from 'fs/promises';
import path from 'path';
import { storage } from './storage';
import type { InsertLearnedFact } from '@shared/schema';

interface MachineData {
  metadata: {
    created: string;
    version: string;
    description: string;
  };
  user_facts: Record<string, Record<string, any>>;
  server_events: Array<{
    type: string;
    timestamp: string;
    data: any;
  }>;
  conversation_patterns: {
    common_topics: Record<string, number>;
    response_styles: string[];
  };
  learned_relationships: Record<string, string[]>;
  temporal_data: {
    recent_topics: string[];
    trending_discussions: string[];
  };
}

const MACHINE_JSON_PATH = path.join(process.cwd(), 'server', 'machine.json');

export class MachineLearning {
  private machineData: MachineData | null = null;

  async loadMachineData(): Promise<MachineData> {
    try {
      const data = await fs.readFile(MACHINE_JSON_PATH, 'utf-8');
      this.machineData = JSON.parse(data);
      console.log(`📚 Loaded machine.json with ${Object.keys(this.machineData!.user_facts).length} users`);
      return this.machineData!;
    } catch (error) {
      console.log('Machine.json not found, creating new one...');
      this.machineData = {
        metadata: {
          created: new Date().toISOString(),
          version: '2.0.0',
          description: 'Advanced learning system - tracks users, conversations, and patterns'
        },
        user_facts: {},
        server_events: [],
        conversation_patterns: {
          common_topics: {},
          response_styles: []
        },
        learned_relationships: {},
        temporal_data: {
          recent_topics: [],
          trending_discussions: []
        }
      };
      await this.saveMachineData();
      return this.machineData;
    }
  }

  async saveMachineData(): Promise<void> {
    if (!this.machineData) return;
    await fs.writeFile(
      MACHINE_JSON_PATH,
      JSON.stringify(this.machineData, null, 2),
      'utf-8'
    );
    console.log(`💾 Saved machine.json`);
  }

  async learnFromConversation(
    userId: string,
    username: string,
    userMessage: string,
    botResponse: string,
    guildId: string
  ): Promise<void> {
    if (!this.machineData) {
      await this.loadMachineData();
    }

    // Extract facts from the conversation - EXPANDED
    const facts = await this.extractFacts(userId, username, userMessage, guildId);
    
    // Update machine.json user facts
    if (!this.machineData!.user_facts[userId]) {
      this.machineData!.user_facts[userId] = { 
        username,
        firstSeen: new Date().toISOString(),
        messageCount: 0
      };
    }

    // Increment message count
    this.machineData!.user_facts[userId].messageCount = 
      (this.machineData!.user_facts[userId].messageCount || 0) + 1;
    this.machineData!.user_facts[userId].lastSeen = new Date().toISOString();

    // Track conversation topics - IMPROVED
    const topics = this.extractTopics(userMessage);
    for (const topic of topics) {
      if (!this.machineData!.conversation_patterns.common_topics[topic]) {
        this.machineData!.conversation_patterns.common_topics[topic] = 0;
      }
      this.machineData!.conversation_patterns.common_topics[topic]++;
    }

    // Keep recent topics limited
    if (userMessage.trim().length > 3) {
      this.machineData!.temporal_data.recent_topics.unshift(userMessage.substring(0, 150));
      this.machineData!.temporal_data.recent_topics = 
        this.machineData!.temporal_data.recent_topics.slice(0, 100);
    }

    // Save to database
    for (const fact of facts) {
      try {
        await storage.addOrUpdateLearnedFact(fact);
        
        // Also update machine.json
        if (!this.machineData!.user_facts[userId][fact.factKey]) {
          this.machineData!.user_facts[userId][fact.factKey] = fact.factValue;
        }
      } catch (error) {
        console.error('Error saving learned fact:', error);
      }
    }

    await this.saveMachineData();
  }

  async extractFacts(
    userId: string,
    username: string,
    message: string,
    guildId: string
  ): Promise<InsertLearnedFact[]> {
    const facts: InsertLearnedFact[] = [];
    const lowerMessage = message.toLowerCase();

    // 1. Location facts - EXPANDED
    const locationPatterns = [
      /(?:i am|i'm|im|yo soy|soy)\s+from\s+([a-zA-Z\s]+)/i,
      /(?:i live|i'm living|im living|vivo)\s+(?:in|en)\s+([a-zA-Z\s]+)/i,
      /(?:my|mi)\s+(?:country|pais|ciudad|city)\s+(?:is|es)\s+([a-zA-Z\s]+)/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        facts.push({
          userId,
          username,
          factType: 'location',
          factKey: 'location',
          factValue: match[1].trim(),
          learnedFrom: message,
          guildId,
          confidence: 1
        });
        break;
      }
    }

    // 2. Trading facts - EXPANDED
    const tradingPatterns = [
      /(?:i|i'm|im|yo)\s+(?:trade|trading|opero)\s+([a-zA-Z0-9\s]+)/i,
      /(?:my|mi)\s+(?:main|principal)\s+(?:instrument|instrumento)\s+(?:is|es)\s+([a-zA-Z0-9\s]+)/i,
      /(?:i|i'm|im)\s+(?:a|un|una)\s+([a-zA-Z]+)\s+trader/i,
    ];
    
    for (const pattern of tradingPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        facts.push({
          userId,
          username,
          factType: 'trading',
          factKey: 'trades',
          factValue: match[1].trim(),
          learnedFrom: message,
          guildId,
          confidence: 1
        });
        break;
      }
    }

    // 3. Preference facts - EXPANDED
    const preferencePatterns = [
      /(?:my|mi)\s+favorite\s+([a-zA-Z\s]+)\s+(?:is|are|es|son)\s+([a-zA-Z0-9\s]+)/i,
      /(?:i prefer|prefiero|i like|me gusta)\s+([a-zA-Z0-9\s]+)/i,
    ];
    
    for (const pattern of preferencePatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const key = match[1] ? match[1].trim() : 'preference';
        const value = match[2] || match[1];
        facts.push({
          userId,
          username,
          factType: 'preference',
          factKey: key,
          factValue: value.trim(),
          learnedFrom: message,
          guildId,
          confidence: 1
        });
      }
    }

    // 4. NEW: Experience level
    const experienceMatch = lowerMessage.match(/(?:been trading|trading for|llevo operando)\s+(?:for\s+)?([0-9]+)\s+(year|years|month|months|año|años|mes|meses)/i);
    if (experienceMatch) {
      facts.push({
        userId,
        username,
        factType: 'experience',
        factKey: 'trading_experience',
        factValue: `${experienceMatch[1]} ${experienceMatch[2]}`,
        learnedFrom: message,
        guildId,
        confidence: 1
      });
    }

    // 5. NEW: Goals and aspirations
    const goalPatterns = [
      /(?:i want to|quiero|my goal is|mi meta es)\s+([^.!?]+)/i,
      /(?:trying to|intentando)\s+([^.!?]+)/i,
    ];
    
    for (const pattern of goalPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        facts.push({
          userId,
          username,
          factType: 'goal',
          factKey: 'goal',
          factValue: match[1].trim(),
          learnedFrom: message,
          guildId,
          confidence: 0.8
        });
        break;
      }
    }

    // 6. NEW: Hobbies and interests
    const hobbyPatterns = [
      /(?:i love|i enjoy|me encanta|disfruto)\s+([^.!?]+)/i,
      /(?:i'm into|estoy en|me gusta)\s+([^.!?]+)/i,
    ];
    
    for (const pattern of hobbyPatterns) {
      const match = lowerMessage.match(pattern);
      if (match && !lowerMessage.includes('trading')) {
        facts.push({
          userId,
          username,
          factType: 'interest',
          factKey: 'hobby',
          factValue: match[1].trim(),
          learnedFrom: message,
          guildId,
          confidence: 0.7
        });
        break;
      }
    }

    // 7. NEW: Time zone indicators
    const timeMatch = lowerMessage.match(/(?:it's|its|es|son)\s+(\d{1,2})\s*(?:am|pm|h)/i);
    if (timeMatch) {
      facts.push({
        userId,
        username,
        factType: 'timezone',
        factKey: 'local_time_mentioned',
        factValue: timeMatch[1],
        learnedFrom: message,
        guildId,
        confidence: 0.5
      });
    }

    return facts;
  }

  extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Trading terms - EXPANDED
    const tradingTerms = [
      'trade', 'trading', 'stock', 'stocks', 'crypto', 'bitcoin', 'btc', 'eth',
      'forex', 'futures', 'options', 'spy', 'qqq', 'calls', 'puts',
      'orderflow', 'stdv', 'analysis', 'chart', 'candle', 'pattern',
      'scalping', 'swing', 'day trading', 'investing', 'portfolio',
      'bull', 'bear', 'breakout', 'support', 'resistance'
    ];
    
    // General topics - NEW
    const generalTerms = [
      'gaming', 'music', 'anime', 'movies', 'sports', 'food',
      'coding', 'programming', 'design', 'art', 'fitness',
      'travel', 'school', 'work', 'life', 'meme', 'funny'
    ];
    
    const allTerms = [...tradingTerms, ...generalTerms];
    
    for (const term of allTerms) {
      if (lowerMessage.includes(term)) {
        topics.push(term);
      }
    }

    return topics;
  }

  async recordServerEvent(eventType: string, eventData: any): Promise<void> {
    if (!this.machineData) {
      await this.loadMachineData();
    }

    this.machineData!.server_events.unshift({
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData
    });

    // Keep only last 500 events
    this.machineData!.server_events = this.machineData!.server_events.slice(0, 500);

    await this.saveMachineData();
  }

  async getUserContext(userId: string): Promise<string> {
    const facts = await storage.getLearnedFactsByUser(userId);
    
    if (facts.length === 0) return '';

    let context = `\n📋 What I know about this user:\n`;
    for (const fact of facts) {
      context += `- ${fact.factKey}: ${fact.factValue}\n`;
    }

    return context;
  }

  async forgetFact(userId: string, factDescription: string): Promise<boolean> {
    // Ensure machine.json is loaded before mutation
    if (!this.machineData) {
      await this.loadMachineData();
    }

    // Parse the forget command
    // e.g., "olvida que juan es de mexico" -> factKey could be "country" or related
    
    const facts = await storage.getLearnedFactsByUser(userId);
    const lowerDesc = factDescription.toLowerCase();

    for (const fact of facts) {
      if (
        lowerDesc.includes(fact.factKey.toLowerCase()) ||
        lowerDesc.includes(fact.factValue.toLowerCase())
      ) {
        await storage.deleteLearnedFact(userId, fact.factKey);
        
        // Also remove from machine.json
        if (this.machineData && this.machineData.user_facts[userId]) {
          delete this.machineData.user_facts[userId][fact.factKey];
          await this.saveMachineData();
        }
        
        console.log(`🗑️ Forgot fact: ${fact.factKey} = ${fact.factValue} for user ${userId}`);
        return true;
      }
    }

    return false;
  }

  getResponseVariations(): string[] {
    return [
      "witty",
      "chill",
      "hyped",
      "analytical",
      "storytelling",
      "motivational",
      "sarcastic",
      "thoughtful",
      "energetic",
      "laid-back"
    ];
  }
}

export const machineLearning = new MachineLearning();
