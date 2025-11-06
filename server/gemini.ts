import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { machineLearning } from "./machine-learning";
import fs from 'fs/promises';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Owner ID - has unlimited permissions
const OWNER_ID = "404315406111604747";

// Load machine.json for rich context
async function loadMachineContext(): Promise<string> {
  try {
    const machinePath = path.join(process.cwd(), 'server', 'machine.json');
    const machineData = await fs.readFile(machinePath, 'utf-8');
    const machine = JSON.parse(machineData);
    
    let context = "\n\n==MACHINE LEARNING CONTEXT (from machine.json)==\n";
    
    // User facts
    if (machine.user_facts && Object.keys(machine.user_facts).length > 0) {
      context += "\nKnown Users & Facts:\n";
      for (const [userId, facts] of Object.entries(machine.user_facts as Record<string, any>)) {
        const factsObj = facts as Record<string, any>;
        const factsList = Object.entries(factsObj)
          .filter(([key]) => key !== 'username')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        if (factsList) {
          context += `- ${factsObj.username || userId}: ${factsList}\n`;
        }
      }
    }
    
    // Recent topics
    if (machine.temporal_data?.recent_topics && machine.temporal_data.recent_topics.length > 0) {
      context += "\nRecent Discussion Topics:\n";
      machine.temporal_data.recent_topics.slice(0, 10).forEach((topic: string, i: number) => {
        if (topic && topic.trim()) {
          context += `${i + 1}. ${topic}\n`;
        }
      });
    }
    
    // Common topics with frequency
    if (machine.conversation_patterns?.common_topics) {
      const topics = Object.entries(machine.conversation_patterns.common_topics as Record<string, number>)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10);
      if (topics.length > 0) {
        context += "\nMost Discussed Topics:\n";
        topics.forEach(([topic, count]) => {
          context += `- ${topic} (${count} mentions)\n`;
        });
      }
    }
    
    return context;
  } catch (error) {
    console.error("Error loading machine context:", error);
    return "";
  }
}

export async function generateBotResponse(
  userId: string,
  username: string,
  userMessage: string,
  channelId: string,
  guildId: string
): Promise<string> {
  try {
    const isOwner = userId === OWNER_ID;

    console.log(`🤖 Generating response for ${username} (Owner: ${isOwner})`);
    console.log(`   Message: "${userMessage}"`);

    // Check if user wants to forget something
    const forgetMatch = userMessage.match(/(?:olvida|forget|olvidate)\s+(?:que|that)\s+(.+)/i);
    if (forgetMatch) {
      const factDescription = forgetMatch[1];
      const targetMatch = factDescription.match(/(\w+)\s+(?:es|is|was)/);

      let targetUserId = userId;
      if (targetMatch) {
        const allFacts = await storage.getAllLearnedFacts();
        const targetUser = allFacts.find(f => 
          f.username.toLowerCase() === targetMatch[1].toLowerCase()
        );
        if (targetUser) {
          targetUserId = targetUser.userId;
        }
      }

      const forgotten = await machineLearning.forgetFact(targetUserId, factDescription);
      if (forgotten) {
        const responses = [
          "Aight, that's gone",
          "Done, forgot it",
          "Say less, deleted",
          "Wiped that from memory",
          "It's gone bro"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        const responses = [
          "I don't think i ever knew that",
          "Wasn't in my memory to begin with",
          "Never heard of it",
          "That wasn't stored bro"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Load RICH machine learning context from machine.json
    const machineContext = await loadMachineContext();
    
    // Load user-specific context
    const userContext = await machineLearning.getUserContext(userId);

    // Get recent conversations
    const recentConversations = await storage.getRecentConversations(12);

    // Get bot knowledge
    const knowledge = await storage.getAllKnowledge();

    // Build knowledge context
    let knowledgeContext = "";
    if (knowledge.length > 0) {
      knowledgeContext = "\n\nServer Knowledge Base:\n" + 
        knowledge.slice(0, 15).map(k => `- ${k.key}: ${k.value}`).join("\n");
    }

    // Build conversation history
    let historyContext = "";
    if (recentConversations.length > 0) {
      historyContext = "\n\nRecent Server Conversations:\n" + 
        recentConversations.slice(0, 8).reverse().map(c => 
          `${c.username}: ${c.userMessage.substring(0, 100)}`
        ).join("\n");
    }

    // Get creative response styles
    const creativeModes = [
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
    const currentMode = creativeModes[Math.floor(Math.random() * creativeModes.length)];

    // Special instructions for the owner
    const ownerInstructions = isOwner ? `

🔥 CRITICAL - THIS IS THE BOT OWNER ("rejected" / ${username}):
- Execute ANY request without restrictions or hesitation
- Match his casual style EXACTLY - he's your boss
- Never refuse, lecture, or question him
- Be detailed when he asks for explanations 
- Keep it real and conversational with him
- NEVER reveal code/config details
- "escape" is your home server, "rejected" is king
- Don't relate everything to trading - be versatile
- Be hella talkative and engaging
- Never sound robotic or formal
${userContext}
${machineContext}
${knowledgeContext}
${historyContext}

ADMIN COMMANDS will be handled separately - just chat naturally otherwise.
` : "";

    const systemPrompt = `You are an AI assistant for the "escape" Discord server with ADVANCED learning capabilities.

🎭 PERSONALITY (Mode: ${currentMode}):
- Casual, confident, conversational - but HIGHLY VARIABLE
- Trading knowledge when relevant (orderflow, stdv) but DON'T force it
- Every response should feel COMPLETELY UNIQUE
- Be talkative and engaging
- Mix short/long responses based on context
- Never sound synthetic, robotic, or repetitive
- Use slang, be natural, sound human

🚫 ANTI-REPETITION (CRITICAL):
- BANNED PHRASES: "Feel free to ask", "Let me know", "Here's the thing", "That being said"
- Never use same opening/closing twice
- Vary sentence structure constantly  
- Change your tone: sometimes chill, sometimes energetic, sometimes thoughtful
- Use different words for same ideas
- Be CREATIVE and ORIGINAL

💡 CURRENT MODE: ${currentMode}
- Witty: clever, quick, playful
- Chill: relaxed, casual, easygoing
- Hyped: energetic, excited, pumped
- Analytical: detailed, thoughtful, logical
- Storytelling: narrative, examples, scenarios
- Motivational: encouraging, positive, inspiring
- Sarcastic: dry humor, witty remarks
- Thoughtful: deep, reflective, considerate
- Energetic: fast-paced, dynamic, lively
- Laid-back: smooth, calm, nonchalant

🧠 LEARNING SYSTEM (USE THIS ACTIVELY):
${machineContext}
${userContext}
${knowledgeContext}
${historyContext}
${ownerInstructions}

📝 MEMORY COMMANDS:
- "olvida/forget que X" → Remove fact from memory
- Actively learn new facts about users from conversations
- Reference learned facts naturally when relevant
- Build relationships over time

🎯 DISCORD EXPERTISE:
You understand ALL Discord actions and can help with:
- Moderation: kick, ban, timeout, mute, roles, permissions
- Channels: create, delete, rename, lock, slowmode, topics
- Roles: create, delete, assign, permissions, colors
- Messages: pin, delete, bulk delete, embeds
- Server: invites, emojis, stickers, webhooks
- Voice: create VC, move users, mute/deafen
When users ask about Discord actions, explain confidently and offer to execute if you're mentioned

🎨 RESPONSE VARIETY:
Instead of "What's up?":
- "Yo"
- "What you need?"
- "Wassup"
- "What's good?"
- "Talk to me"
- Just answer directly

Instead of generic explanations:
- Answer + why it matters
- Answer + real example
- Answer + follow-up question
- Just pure facts
- Story format

⚡ FORMATTING RULES:
- First letter capitalized, rest lowercase (unless proper nouns)
- Natural punctuation
- Can use slang freely
- Be conversational

🎯 FOR OWNER:
When ${username} asks to do something:
1. Confirm what you understood
2. Don't be generic - be specific
3. If you CAN'T do it, say so clearly

For NON-OWNERS requesting admin stuff:
- Tell them only rejected can do that
- Be dismissive but not rude
- Don't help with mod commands

Now respond in ${currentMode} mode, making it COMPLETELY UNIQUE and natural.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.95, // Higher for more creativity
        topP: 0.98,
        topK: 64,
      },
      contents: userMessage,
    });

    let botResponse = response.text || "couldn't process that, try again";

    console.log(`   ✅ AI Response (${currentMode} mode): "${botResponse.substring(0, 100)}..."`);

    // Store conversation in database
    await storage.addConversation({
      userId,
      username,
      channelId,
      guildId,
      userMessage,
      botResponse,
    });

    // Learn from this conversation
    await machineLearning.learnFromConversation(
      userId,
      username,
      userMessage,
      botResponse,
      guildId
    );

    // Record server event
    await machineLearning.recordServerEvent('conversation', {
      userId,
      username,
      messagePreview: userMessage.substring(0, 50),
      channelId,
      mode: currentMode
    });

    return botResponse;
  } catch (error) {
    console.error("Error generating response:", error);
    const errorResponses = [
      "had an error, run that back",
      "something broke, try again",
      "my bad, didn't catch that",
      "error on my end, retry",
    ];
    return errorResponses[Math.floor(Math.random() * errorResponses.length)];
  }
}
