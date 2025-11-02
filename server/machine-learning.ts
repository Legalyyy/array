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
      return this.machineData!;
    } catch (error) {
      console.log('Machine.json not found or corrupted, creating new one...');
      this.machineData = {
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0',
          description: 'Dynamic learning system for the bot'
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

    // Extract facts from the conversation
    const facts = await this.extractFacts(userId, username, userMessage, guildId);
    
    // Update machine.json user facts
    if (!this.machineData!.user_facts[userId]) {
      this.machineData!.user_facts[userId] = { username };
    }

    // Track conversation topics
    const topics = this.extractTopics(userMessage);
    for (const topic of topics) {
      if (!this.machineData!.conversation_patterns.common_topics[topic]) {
        this.machineData!.conversation_patterns.common_topics[topic] = 0;
      }
      this.machineData!.conversation_patterns.common_topics[topic]++;
    }

    // Keep recent topics limited
    this.machineData!.temporal_data.recent_topics.unshift(userMessage.substring(0, 100));
    this.machineData!.temporal_data.recent_topics = 
      this.machineData!.temporal_data.recent_topics.slice(0, 50);

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

    // Pattern: "I am from [location]" or "I'm from [location]"
    const locationMatch = lowerMessage.match(/(?:i am|i'm|im)\s+from\s+([a-zA-Z\s]+)/i);
    if (locationMatch) {
      facts.push({
        userId,
        username,
        factType: 'location',
        factKey: 'country',
        factValue: locationMatch[1].trim(),
        learnedFrom: message,
        guildId,
        confidence: 1
      });
    }

    // Pattern: "I trade [instrument]" or "I'm trading [instrument]"
    const tradingMatch = lowerMessage.match(/(?:i|i'm|im)\s+(?:trade|trading)\s+([a-zA-Z0-9\s]+)/i);
    if (tradingMatch) {
      facts.push({
        userId,
        username,
        factType: 'trading',
        factKey: 'trades',
        factValue: tradingMatch[1].trim(),
        learnedFrom: message,
        guildId,
        confidence: 1
      });
    }

    // Pattern: "My [thing] is [value]" or "I prefer [thing]"
    const preferenceMatch = lowerMessage.match(/(?:my|i prefer|i like)\s+([a-zA-Z\s]+)\s+(?:is|are|to be)\s+([a-zA-Z0-9\s]+)/i);
    if (preferenceMatch) {
      facts.push({
        userId,
        username,
        factType: 'preference',
        factKey: preferenceMatch[1].trim(),
        factValue: preferenceMatch[2].trim(),
        learnedFrom: message,
        guildId,
        confidence: 1
      });
    }

    return facts;
  }

  extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    const tradingTerms = ['trade', 'trading', 'stock', 'crypto', 'forex', 'futures', 'options', 'spy', 'btc'];
    const analysisTerms = ['orderflow', 'stdv', 'analysis', 'chart', 'candle', 'pattern'];
    
    for (const term of [...tradingTerms, ...analysisTerms]) {
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

    // Keep only last 200 events
    this.machineData!.server_events = this.machineData!.server_events.slice(0, 200);

    await this.saveMachineData();
  }

  async getUserContext(userId: string): Promise<string> {
    const facts = await storage.getLearnedFactsByUser(userId);
    
    if (facts.length === 0) return '';

    let context = `\nWhat I know about this user:\n`;
    for (const fact of facts) {
      context += `- ${fact.factKey}: ${fact.factValue} (confidence: ${fact.confidence})\n`;
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
        
        return true;
      }
    }

    return false;
  }

  getResponseVariations(): string[] {
    return [
      "conversational",
      "technical",
      "casual",
      "supportive",
      "analytical",
      "concise"
    ];
  }
}

export const machineLearning = new MachineLearning();
