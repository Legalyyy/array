import {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  Message,
  PermissionsBitField,
} from "discord.js";
import { generateBotResponse } from "./gemini";
import { storage } from "./storage";

// Create Discord client
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Commands
const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available bot commands"),
  
  new SlashCommandBuilder()
    .setName("recap")
    .setDescription("Record your trade with P&L and notes"),
  
  new SlashCommandBuilder()
    .setName("myrecaps")
    .setDescription("View your trade recaps"),
  
  new SlashCommandBuilder()
    .setName("recaps")
    .setDescription("View recaps from a specific user")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user whose recaps you want to view")
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName("access")
    .setDescription("Request access to exclusive content"),
  
  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Send a custom embed (Admin only)")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
];

// Admin user IDs who can execute admin commands via chat
const ADMIN_USER_IDS = ["404315406111604747"];

// Register commands
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Discord bot logged in as ${c.user.tag}`);
  
  // Set bot presence/status
  c.user.setPresence({
    activities: [{
      name: "escape",
      type: 1, // Streaming
      url: "https://twitch.tv/trading"
    }],
    status: "online"
  });
  
  // Register slash commands globally
  try {
    await c.application?.commands.set(commands);
    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
});

// Handle messages (mentions and replies)
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  try {
    // Check if bot was mentioned or if message is a reply to bot
    const botMentioned = message.mentions.has(client.user!.id);
    const isReplyToBot = message.reference?.messageId ? 
      (await message.channel.messages.fetch(message.reference.messageId)).author.id === client.user!.id : false;
    
    console.log(`📨 Message from ${message.author.username}: "${message.content}"`);
    console.log(`   Bot mentioned: ${botMentioned}, Is reply to bot: ${isReplyToBot}`);
    
    if (botMentioned || isReplyToBot) {
      console.log(`   ✅ Processing message from ${message.author.username}`);
      
      try {
        console.log(`   → Sending typing indicator...`);
        if ('sendTyping' in message.channel) {
          await message.channel.sendTyping();
        }
        console.log(`   ✓ Typing indicator sent`);
      } catch (e) {
        console.error(`   ✗ Failed to send typing:`, e);
      }
      
      console.log(`   → Cleaning message...`);
      const userMessage = message.content.replace(/<@!?\d+>/g, "").trim();
      console.log(`   ✓ Cleaned message: "${userMessage}"`);
      
      console.log(`   → Checking admin status...`);
      const isAdmin = ADMIN_USER_IDS.includes(message.author.id) || 
                      (message.member?.permissions.has(PermissionsBitField.Flags.Administrator) ?? false);
      console.log(`   ✓ User ${message.author.id} is admin: ${isAdmin}`);
      
      // Check for admin commands FIRST (only for the owner)
      if (isAdmin && message.guild) {
        console.log(`   → Checking for admin commands...`);
        try {
          const handled = await handleAdminCommand(message, userMessage);
          if (handled) {
            console.log(`   ✅ Admin command handled successfully`);
            return;
          }
          console.log(`   ✓ No admin command matched`);
        } catch (cmdError) {
          console.error(`   ✗ Error in admin command handler:`, cmdError);
        }
      }
      
      // If not a command, respond with AI
      console.log(`   → Generating AI response...`);
      try {
        const response = await generateBotResponse(
          message.author.id,
          message.author.username,
          userMessage,
          message.channelId,
          message.guildId || "DM"
        );
        
        console.log(`   ✓ AI response generated: "${response.substring(0, 50)}..."`);
        console.log(`   → Sending reply...`);
        
        await message.reply(response);
        console.log(`   ✅ Reply sent successfully!`);
      } catch (aiError) {
        console.error(`   ✗ Error generating/sending AI response:`, aiError);
        throw aiError;
      }
    }
  } catch (error) {
    console.error("❌ Error processing message:", error);
    try {
      await message.reply("Tuve un problema procesando eso. ¿Puedes intentar de nuevo?");
    } catch (replyError) {
      console.error("❌ Failed to send error reply:", replyError);
    }
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
  } else if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction);
  }
});

async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;
  
  try {
    switch (commandName) {
      case "help":
        await handleHelpCommand(interaction);
        break;
      case "recap":
        await handleRecapCommand(interaction);
        break;
      case "myrecaps":
        await handleMyRecapsCommand(interaction);
        break;
      case "recaps":
        await handleUserRecapsCommand(interaction);
        break;
      case "access":
        await handleAccessCommand(interaction);
        break;
      case "embed":
        await handleEmbedCommand(interaction);
        break;
    }
  } catch (error) {
    console.error(`Error handling /${commandName}:`, error);
    await interaction.reply({ content: "Something went wrong processing that command.", ephemeral: true });
  }
}

async function handleHelpCommand(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x2B5BBA)
    .setTitle("🤖 Bot Commands")
    .setDescription("Here's everything I can do:")
    .addFields(
      { name: "/help", value: "Show this command list" },
      { name: "/recap", value: "Record a trade with P&L and notes" },
      { name: "/myrecaps", value: "View all your trade recaps" },
      { name: "/recaps @user", value: "View another user's trade recaps" },
      { name: "/access", value: "Request access to exclusive content" },
      { name: "/embed", value: "Send a custom embed (Admin only)" },
      { name: "Mention me", value: "Tag me or reply to my messages to chat!" }
    )
    .setFooter({ text: "Trading community bot powered by AI" })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}

async function handleRecapCommand(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("recap_modal")
    .setTitle("Record Your Trade");
  
  const notesInput = new TextInputBuilder()
    .setCustomId("notes")
    .setLabel("Trade Notes")
    .setPlaceholder("Describe your trade setup, strategy, lessons learned...")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);
  
  const pnlInput = new TextInputBuilder()
    .setCustomId("pnl")
    .setLabel("P&L")
    .setPlaceholder("e.g., +$500 or -$200")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(pnlInput)
  );
  
  await interaction.showModal(modal);
}

async function handleMyRecapsCommand(interaction: ChatInputCommandInteraction) {
  const recaps = await storage.getTradeRecapsByUser(interaction.user.id);
  
  if (recaps.length === 0) {
    await interaction.reply({ 
      content: "You haven't recorded any trades yet. Use `/recap` to add one!",
      ephemeral: true
    });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x2B5BBA)
    .setTitle(`📊 ${interaction.user.username}'s Trade Recaps`)
    .setDescription(`Total trades: ${recaps.length}`)
    .setTimestamp();
  
  // Show most recent 10 recaps
  recaps.slice(0, 10).forEach((recap, index) => {
    embed.addFields({
      name: `Trade #${recaps.length - index} - ${recap.pnl}`,
      value: `${recap.notes.substring(0, 200)}${recap.notes.length > 200 ? '...' : ''}\n*${new Date(recap.createdAt).toLocaleDateString()}*`
    });
  });
  
  if (recaps.length > 10) {
    embed.setFooter({ text: `Showing 10 most recent out of ${recaps.length} total trades` });
  }
  
  await interaction.reply({ embeds: [embed] });
}

async function handleUserRecapsCommand(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser("user", true);
  const recaps = await storage.getTradeRecapsByUser(targetUser.id);
  
  if (recaps.length === 0) {
    await interaction.reply({ 
      content: `${targetUser.username} hasn't recorded any trades yet.`,
      ephemeral: true
    });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x2B5BBA)
    .setTitle(`📊 ${targetUser.username}'s Trade Recaps`)
    .setDescription(`Total trades: ${recaps.length}`)
    .setTimestamp();
  
  recaps.slice(0, 10).forEach((recap, index) => {
    embed.addFields({
      name: `Trade #${recaps.length - index} - ${recap.pnl}`,
      value: `${recap.notes.substring(0, 200)}${recap.notes.length > 200 ? '...' : ''}\n*${new Date(recap.createdAt).toLocaleDateString()}*`
    });
  });
  
  if (recaps.length > 10) {
    embed.setFooter({ text: `Showing 10 most recent out of ${recaps.length} total trades` });
  }
  
  await interaction.reply({ embeds: [embed] });
}

async function handleAccessCommand(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("access_modal")
    .setTitle("Request Access");
  
  const experienceInput = new TextInputBuilder()
    .setCustomId("experience")
    .setLabel("How long have you been trading?")
    .setPlaceholder("e.g., 2 years, 6 months, just starting...")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  
  const profitableInput = new TextInputBuilder()
    .setCustomId("profitable")
    .setLabel("Do you consider yourself profitable?")
    .setPlaceholder("Yes/No and briefly explain...")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  
  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Why do you want access?")
    .setPlaceholder("What are you hoping to gain from the exclusive content?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);
  
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(experienceInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(profitableInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
  );
  
  await interaction.showModal(modal);
}

async function handleEmbedCommand(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("embed_modal")
    .setTitle("Create Custom Embed");
  
  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Embed Title")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  
  const descInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Embed Description")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);
  
  const colorInput = new TextInputBuilder()
    .setCustomId("color")
    .setLabel("Color (hex code, e.g., #2B5BBA)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  
  const footerInput = new TextInputBuilder()
    .setCustomId("footer")
    .setLabel("Footer Text")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  
  const imageInput = new TextInputBuilder()
    .setCustomId("image")
    .setLabel("Image URL")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
  );
  
  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  const { customId } = interaction;
  
  try {
    if (customId === "recap_modal") {
      const notes = interaction.fields.getTextInputValue("notes");
      const pnl = interaction.fields.getTextInputValue("pnl");
      
      await storage.addTradeRecap({
        userId: interaction.user.id,
        username: interaction.user.username,
        notes,
        pnl,
      });
      
      const embed = new EmbedBuilder()
        .setColor(pnl.startsWith("+") || pnl.startsWith("$") && !pnl.includes("-") ? 0x10B981 : 0xEF4444)
        .setTitle("📊 Trade Recap Saved")
        .addFields(
          { name: "P&L", value: pnl },
          { name: "Notes", value: notes }
        )
        .setFooter({ text: `Trader: ${interaction.user.username}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } 
    else if (customId === "access_modal") {
      const experience = interaction.fields.getTextInputValue("experience");
      const profitable = interaction.fields.getTextInputValue("profitable");
      const reason = interaction.fields.getTextInputValue("reason");
      
      await storage.addAccessRequest({
        userId: interaction.user.id,
        username: interaction.user.username,
        tradingExperience: experience,
        isProfitable: profitable,
        reason,
      });
      
      await interaction.reply({ 
        content: "✅ Access request submitted! The admin team will review it soon.",
        ephemeral: true
      });
      
      // Notify in the channel (non-ephemeral) 
      const embed = new EmbedBuilder()
        .setColor(0x2B5BBA)
        .setTitle("🔑 New Access Request")
        .setDescription(`${interaction.user.username} has requested access to exclusive content.`)
        .addFields(
          { name: "Trading Experience", value: experience },
          { name: "Profitable?", value: profitable },
          { name: "Reason", value: reason }
        )
        .setTimestamp();
      
      await interaction.followUp({ embeds: [embed] });
    }
    else if (customId === "embed_modal") {
      const title = interaction.fields.getTextInputValue("title");
      const description = interaction.fields.getTextInputValue("description");
      const colorHex = interaction.fields.getTextInputValue("color") || "#2B5BBA";
      const footer = interaction.fields.getTextInputValue("footer");
      const imageUrl = interaction.fields.getTextInputValue("image");
      
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(parseInt(colorHex.replace("#", ""), 16))
        .setTimestamp();
      
      if (footer) embed.setFooter({ text: footer });
      if (imageUrl) embed.setImage(imageUrl);
      
      await interaction.reply({ content: "✅ Embed created successfully!" , ephemeral: true });
      if (interaction.channel && 'send' in interaction.channel) {
        await interaction.channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error("Error handling modal submit:", error);
    await interaction.reply({ content: "Something went wrong processing your submission.", ephemeral: true });
  }
}

// Store pending confirmations
const pendingConfirmations = new Map<string, { action: string; data: any; expires: number }>();

// Handle admin commands via natural language with AI intent detection
async function handleAdminCommand(message: Message, userMessage: string): Promise<boolean> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for confirmation responses first
  if (lowerMessage === 'confirmar' || lowerMessage === 'si' || lowerMessage === 'sí' || lowerMessage === 'yes') {
    const pending = pendingConfirmations.get(message.author.id);
    if (pending && pending.expires > Date.now()) {
      pendingConfirmations.delete(message.author.id);
      
      if (pending.action === 'delete_channel') {
        try {
          await message.reply(`✅ Deleting this channel in 3 seconds...`);
          setTimeout(async () => {
            if ('delete' in message.channel) {
              await message.channel.delete(`Deleted by ${message.author.username} via bot command`);
            }
          }, 3000);
          return true;
        } catch (error) {
          console.error("Error deleting channel:", error);
          await message.reply(`❌ Error deleting channel.`);
          return true;
        }
      }
    } else {
      await message.reply(`⏰ No pending action to confirm or it expired.`);
      return true;
    }
  }
  
  if (lowerMessage === 'cancelar' || lowerMessage === 'no') {
    const pending = pendingConfirmations.get(message.author.id);
    if (pending) {
      pendingConfirmations.delete(message.author.id);
      await message.reply(`❌ Action cancelled.`);
      return true;
    }
  }
  
  // 1. DELETE/CLEAR MESSAGES - Ultra flexible patterns
  if (/(?:delete|clear|remove|borrar|eliminar|purge|clean|wipe)/i.test(lowerMessage) && 
      /(?:messages?|mensajes?|msg|chat|all|everything|todo|sent|enviado|i'?ve sent|he enviado)/i.test(lowerMessage)) {
    
    console.log(`   🔥 DETECTED: Clear messages command`);
    
    // Try to find a number in the message
    const numberMatch = userMessage.match(/(\d+)/);
    let amount = numberMatch ? parseInt(numberMatch[1]) : 100; // Default to 100 if no number
    
    // If they say "all" or "everything", fetch and delete maximum
    if (/(?:all|everything|todo|todos)/i.test(lowerMessage)) {
      amount = 100; // Discord API limit
    }
    
    console.log(`   → Will delete ${amount} messages...`);
    
    if ('bulkDelete' in message.channel) {
      try {
        const deleted = await message.channel.bulkDelete(Math.min(amount, 100), true);
        const reply = await message.channel.send(`✅ Cleared ${deleted.size} messages`);
        console.log(`   ✅ EXECUTED: Deleted ${deleted.size} messages`);
        setTimeout(() => reply.delete().catch(() => {}), 3000);
        return true;
      } catch (error) {
        console.error("   ❌ Error deleting messages:", error);
        await message.reply(`❌ Error deleting messages. Make sure I have Manage Messages permission.`);
        return true;
      }
    } else {
      console.log(`   ❌ Channel doesn't support bulkDelete`);
    }
  }
  
  // 2. CREATE CHANNEL - Spanish and English, with category support
  if (/(?:crea|create|make|add|añade|agrega).*(?:canal|channel)/i.test(lowerMessage)) {
    // Extract channel name - very flexible patterns
    const channelNameMatch = 
      userMessage.match(/(?:canal|channel)\s+(?:llamado|named|called|de nombre)\s+["]?([a-zA-Z0-9-_]+)["]?/i) ||
      userMessage.match(/(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_]+)["]?/i) ||
      userMessage.match(/(?:canal|channel)\s+["]?([a-zA-Z0-9-_]+)["]?/i);
    
    // Extract category ID if provided
    const categoryMatch = userMessage.match(/(?:categoria|category|en)\s+["]?(\d{15,20})["]?/i);
    
    if (channelNameMatch && message.guild) {
      const channelName = channelNameMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
      const categoryId = categoryMatch ? categoryMatch[1] : undefined;
      
      try {
        const newChannel = await message.guild.channels.create({
          name: channelName,
          parent: categoryId,
          reason: `Created by ${message.author.username} via bot command`
        });
        await message.reply(`✅ Channel created: ${newChannel}`);
        return true;
      } catch (error) {
        console.error("Error creating channel:", error);
        await message.reply(`❌ Failed to create channel. Check permissions and category ID.`);
        return true;
      }
    }
  }
  
  // 3. DELETE CHANNEL
  if (/(?:delete|remove|borrar|eliminar).*(?:canal|channel|this channel|este canal)/i.test(lowerMessage) &&
      !/message/i.test(lowerMessage)) {
    if ('delete' in message.channel) {
      pendingConfirmations.set(message.author.id, {
        action: 'delete_channel',
        data: { channelId: message.channel.id },
        expires: Date.now() + 30000
      });
      
      await message.reply(`⚠️ **CONFIRMATION REQUIRED**\nAre you sure you want to delete this channel?\nRespond with **"confirmar"** or **"cancelar"**\n*(Expires in 30 seconds)*`);
      return true;
    }
  }
  
  // 4. CREATE ROLE
  if (/(?:crea|create|make|add).*(?:rol|role)/i.test(lowerMessage)) {
    const roleNameMatch = 
      userMessage.match(/(?:rol|role)\s+(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_\s]+)["]?/i) ||
      userMessage.match(/(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_\s]+)["]?/i);
    
    if (roleNameMatch && message.guild) {
      const roleName = roleNameMatch[1].trim();
      try {
        const role = await message.guild.roles.create({
          name: roleName,
          reason: `Created by ${message.author.username} via bot command`
        });
        await message.reply(`✅ Role created: **${roleName}**`);
        return true;
      } catch (error) {
        console.error("Error creating role:", error);
        await message.reply(`❌ Failed to create role. Check permissions.`);
        return true;
      }
    }
  }
  
  // 5. DELETE ROLE
  if (/(?:delete|remove|borrar|eliminar).*(?:rol|role)/i.test(lowerMessage)) {
    const roleNameMatch = 
      userMessage.match(/(?:rol|role)\s+(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_\s]+)["]?/i) ||
      userMessage.match(/(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_\s]+)["]?/i);
    
    if (roleNameMatch && message.guild) {
      const roleName = roleNameMatch[1].trim();
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      
      if (role) {
        try {
          await role.delete(`Deleted by ${message.author.username} via bot command`);
          await message.reply(`✅ Role deleted: **${roleName}**`);
          return true;
        } catch (error) {
          console.error("Error deleting role:", error);
          await message.reply(`❌ Failed to delete role.`);
          return true;
        }
      } else {
        await message.reply(`❌ Role **${roleName}** not found.`);
        return true;
      }
    }
  }
  
  // 6. BAN USER
  if (/ban/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.ban({ reason: `Banned by ${message.author.username} via bot command` });
        await message.reply(`✅ Banned **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error banning user:", error);
        await message.reply(`❌ Failed to ban user.`);
        return true;
      }
    }
  }
  
  // 7. KICK USER
  if (/kick/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.kick(`Kicked by ${message.author.username} via bot command`);
        await message.reply(`✅ Kicked **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error kicking user:", error);
        await message.reply(`❌ Failed to kick user.`);
        return true;
      }
    }
  }
  
  return false;
}

// Login to Discord
export async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  
  if (!token) {
    console.error("❌ DISCORD_BOT_TOKEN is not set!");
    return;
  }
  
  try {
    await client.login(token);
  } catch (error) {
    console.error("❌ Failed to start Discord bot:", error);
  }
}
