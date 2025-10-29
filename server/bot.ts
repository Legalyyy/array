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

// Handle admin commands via natural language
async function handleAdminCommand(message: Message, userMessage: string): Promise<boolean> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for confirmation responses first
  if (lowerMessage === 'confirmar' || lowerMessage === 'si' || lowerMessage === 'sí' || lowerMessage === 'yes') {
    const pending = pendingConfirmations.get(message.author.id);
    if (pending && pending.expires > Date.now()) {
      pendingConfirmations.delete(message.author.id);
      
      if (pending.action === 'delete_channel') {
        try {
          await message.reply(`✅ Eliminando este canal en 3 segundos...`);
          setTimeout(async () => {
            if ('delete' in message.channel) {
              await message.channel.delete(`Deleted by ${message.author.username} via bot command`);
            }
          }, 3000);
          return true;
        } catch (error) {
          console.error("Error deleting channel:", error);
          await message.reply(`❌ Error al eliminar el canal.`);
          return true;
        }
      }
    } else {
      await message.reply(`⏰ No hay ninguna acción pendiente de confirmar o expiró.`);
      return true;
    }
  }
  
  if (lowerMessage === 'cancelar' || lowerMessage === 'no') {
    const pending = pendingConfirmations.get(message.author.id);
    if (pending) {
      pendingConfirmations.delete(message.author.id);
      await message.reply(`❌ Acción cancelada.`);
      return true;
    }
  }
  
  // Delete messages command - must explicitly say "mensajes" or "messages" with a number
  if ((lowerMessage.includes("borrar") || lowerMessage.includes("eliminar") || lowerMessage.includes("delete") || lowerMessage.includes("clear") || lowerMessage.includes("purge")) && 
      (lowerMessage.includes("mensaje") || lowerMessage.includes("message"))) {
    const numberMatch = userMessage.match(/(\d+)/);
    if (numberMatch && 'bulkDelete' in message.channel) {
      const amount = parseInt(numberMatch[1]);
      if (amount > 0 && amount <= 100) {
        try {
          const deleted = await message.channel.bulkDelete(amount, true);
          const reply = await message.channel.send(`✅ Eliminé ${deleted.size} mensajes`);
          setTimeout(() => reply.delete().catch(() => {}), 3000);
          return true;
        } catch (error) {
          console.error("Error deleting messages:", error);
          await message.reply(`❌ Error al eliminar mensajes. Asegúrate de que tenga permisos de Manage Messages.`);
          return true;
        }
      } else {
        await message.reply(`❌ Especifica un número entre 1 y 100.`);
        return true;
      }
    }
  }
  
  // Delete channel command - requires explicit "canal" or "channel" keyword AND confirmation
  if ((lowerMessage.includes("borrar") || lowerMessage.includes("eliminar") || lowerMessage.includes("delete") || lowerMessage.includes("remove")) && 
      (lowerMessage.includes("canal") || lowerMessage.includes("channel")) &&
      !lowerMessage.includes("mensaje") && !lowerMessage.includes("message")) {
    if ('delete' in message.channel) {
      // Ask for confirmation
      pendingConfirmations.set(message.author.id, {
        action: 'delete_channel',
        data: { channelId: message.channel.id },
        expires: Date.now() + 30000 // 30 seconds to confirm
      });
      
      await message.reply(`⚠️ **CONFIRMACIÓN REQUERIDA**\n¿Estás seguro de que quieres eliminar este canal?\nResponde con **"confirmar"** o **"cancelar"**\n*(Esta confirmación expira en 30 segundos)*`);
      return true;
    }
  }
  
  // Create channel command - "create a channel called general"
  if ((lowerMessage.includes("create") || lowerMessage.includes("make")) && 
      lowerMessage.includes("channel")) {
    const channelNameMatch = userMessage.match(/(?:channel (?:called|named) |channel ")([^"]+)"/i) || 
                            userMessage.match(/(?:called|named) ([\w-]+)/i);
    
    if (channelNameMatch && message.guild) {
      const channelName = channelNameMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
      try {
        const newChannel = await message.guild.channels.create({
          name: channelName,
          reason: `Created by ${message.author.username} via bot command`
        });
        await message.reply(`✅ Created channel ${newChannel}`);
        return true;
      } catch (error) {
        console.error("Error creating channel:", error);
        await message.reply(`❌ Failed to create channel. Make sure I have Manage Channels permission.`);
        return true;
      }
    }
  }
  
  // Create role command
  if (lowerMessage.includes("create a role") || lowerMessage.includes("make a role")) {
    const roleNameMatch = userMessage.match(/(?:role (?:called|named) |role ")([^"]+)"/i) || 
                         userMessage.match(/(?:called|named) (\w+)/i);
    
    if (roleNameMatch && message.guild) {
      const roleName = roleNameMatch[1].trim();
      try {
        const role = await message.guild.roles.create({
          name: roleName,
          reason: `Created by ${message.author.username} via bot command`
        });
        await message.reply(`✅ Created role **${roleName}**`);
        return true;
      } catch (error) {
        console.error("Error creating role:", error);
        await message.reply(`❌ Failed to create role. Make sure I have Manage Roles permission.`);
        return true;
      }
    }
  }
  
  // Delete role command
  if (lowerMessage.includes("delete role") || lowerMessage.includes("remove role")) {
    const roleNameMatch = userMessage.match(/(?:role (?:called|named) |role ")([^"]+)"/i) || 
                         userMessage.match(/(?:called|named) (\w+)/i);
    
    if (roleNameMatch && message.guild) {
      const roleName = roleNameMatch[1].trim();
      try {
        const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (role) {
          await role.delete(`Deleted by ${message.author.username} via bot command`);
          await message.reply(`✅ Deleted role **${roleName}**`);
        } else {
          await message.reply(`❌ Role **${roleName}** not found.`);
        }
        return true;
      } catch (error) {
        console.error("Error deleting role:", error);
        await message.reply(`❌ Failed to delete role.`);
        return true;
      }
    }
  }
  
  // Ban user command
  if (lowerMessage.includes("ban") && (lowerMessage.includes("<@") || lowerMessage.includes("user"))) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.ban({ reason: `Banned by ${message.author.username} via bot command` });
        await message.reply(`✅ Banned **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error banning user:", error);
        await message.reply(`❌ Failed to ban user. Make sure I have Ban Members permission.`);
        return true;
      }
    }
  }
  
  // Kick user command
  if (lowerMessage.includes("kick") && message.mentions.users.size > 0) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.kick(`Kicked by ${message.author.username} via bot command`);
        await message.reply(`✅ Kicked **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error kicking user:", error);
        await message.reply(`❌ Failed to kick user. Make sure I have Kick Members permission.`);
        return true;
      }
    }
  }
  
  // Restrict channel to role
  if ((lowerMessage.includes("make") || lowerMessage.includes("set")) && 
      lowerMessage.includes("channel") && 
      lowerMessage.includes("only") && 
      lowerMessage.includes("role")) {
    const roleNameMatch = userMessage.match(/role (\w+)/i);
    if (roleNameMatch && message.guild && 'permissionOverwrites' in message.channel) {
      const roleName = roleNameMatch[1].trim();
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      
      if (role) {
        try {
          await message.channel.permissionOverwrites.set([
            {
              id: message.guild.id,
              deny: [PermissionsBitField.Flags.SendMessages]
            },
            {
              id: role.id,
              allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]
            }
          ]);
          await message.reply(`✅ This channel can now only be used by members with the **${roleName}** role.`);
          return true;
        } catch (error) {
          console.error("Error setting channel permissions:", error);
          await message.reply(`❌ Failed to set channel permissions. Make sure I have Manage Channels permission.`);
          return true;
        }
      } else {
        await message.reply(`❌ Role **${roleName}** not found.`);
        return true;
      }
    }
  }
  
  return false;
}

// Login to Discord
export async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  
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
