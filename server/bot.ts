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
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
} from "discord.js";
import { generateBotResponse } from "./gemini";
import { storage } from "./storage";

// Create Discord client with voice state updates
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates, // For voice channel monitoring
  ],
});

// Commands
const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("all available bot commands"),
  
  new SlashCommandBuilder()
    .setName("recap")
    .setDescription("keep track of your trades"),
  
  new SlashCommandBuilder()
    .setName("myrecaps")
    .setDescription("view your trade recaps"),
  
  new SlashCommandBuilder()
    .setName("recaps")
    .setDescription("view someone else's trade recaps")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("the user whose recaps you want to view")
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName("access")
    .setDescription("request leaks access"),
  
  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("admin")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  new SlashCommandBuilder()
    .setName("vc")
    .setDescription("create your own vc"),
  
  new SlashCommandBuilder()
    .setName("gallery")
    .setDescription("view all your trade screenshots"),
  
  new SlashCommandBuilder()
    .setName("bible")
    .setDescription("admin")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("channel to send")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  new SlashCommandBuilder()
    .setName("news")
    .setDescription("admin")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Channel to send trading news updates")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  new SlashCommandBuilder()
    .setName("vcsetup")
    .setDescription("admin")
    .addChannelOption(option =>
      option
        .setName("trigger")
        .setDescription("admin")
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("category")
        .setDescription("admin")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  new SlashCommandBuilder()
    .setName("setupsignup")
    .setDescription("admin")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("admin")
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("admin")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  new SlashCommandBuilder()
    .setName("reqrequest")
    .setDescription("admin")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("admin")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  new SlashCommandBuilder()
    .setName("request")
    .setDescription("request leaks access"),
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
      url: "https://twitch.tv/o"
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
      await message.reply("can u retry? i had an error");
    } catch (replyError) {
      console.error("❌ Failed to send error reply:", replyError);
    }
  }
});

// Handle all interactions
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    }
  } catch (error) {
    console.error("Error handling interaction:", error);
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
      case "vc":
        await handleVCCommand(interaction);
        break;
      case "gallery":
        await handleGalleryCommand(interaction);
        break;
      case "bible":
        await handleBibleCommand(interaction);
        break;
      case "news":
        await handleNewsCommand(interaction);
        break;
      case "vcsetup":
        await handleVCSetupCommand(interaction);
        break;
      case "setupsignup":
        await handleSetupSignupCommand(interaction);
        break;
      case "reqrequest":
        await handleReqRequestCommand(interaction);
        break;
      case "request":
        await handleRequestCommand(interaction);
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
    .setTitle("commands")
    .setDescription("slash commands on array")
    .addFields(
      { name: "**General**", value: "\u200b" },
      { name: "/recap", value: "keep track of your trades" },
      { name: "/myrecaps", value: "view all your trade recaps" },
      { name: "/gallery", value: "view all your trade screenshots" },
      { name: "/recaps @user", value: "view someone else's trade recaps"},
      { name: "/vc", value: "create your own vc" },
      { name: "/request", value: "request leaks access" },
      { name: "**chat**", value: "just mention or reply to me" }
    )
    .setFooter({ text: "escape - array" })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}

async function handleRecapCommand(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("recap_modal")
    .setTitle("Track the trade");
  
  const notesInput = new TextInputBuilder()
    .setCustomId("notes")
    .setLabel("Notes")
    .setPlaceholder("Describe your setup and/or lessons learned...")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);
  
  const pnlInput = new TextInputBuilder()
    .setCustomId("pnl")
    .setLabel("P&L")
    .setPlaceholder("-500, 500, breakeven...")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  
  const imageUrlInput = new TextInputBuilder()
    .setCustomId("imageUrl")
    .setLabel("Screenshot URL (optional)")
    .setPlaceholder("image url of your trade")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(pnlInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(imageUrlInput)
  );
  
  await interaction.showModal(modal);
}

async function handleMyRecapsCommand(interaction: ChatInputCommandInteraction) {
  const recaps = await storage.getTradeRecapsByUser(interaction.user.id);
  
  if (recaps.length === 0) {
    await interaction.reply({ 
      content: "you haven't recorded any trades yet. Use `/recap` to add one",
      ephemeral: true
    });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x2B5BBA)
    .setTitle(` ${interaction.user.username}'s Trade Recaps`)
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
    .setTitle(` ${targetUser.username}'s Trade Recaps`)
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
    .setPlaceholder("What are you hoping to gain from this content?")
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
    .setRequired(false);

  const imageInput = new TextInputBuilder()
    .setCustomId("image")
    .setLabel("Image URL")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  
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
      const imageUrl = interaction.fields.getTextInputValue("imageUrl") || null;
      
      const recap = await storage.addTradeRecap({
        userId: interaction.user.id,
        username: interaction.user.username,
        notes,
        pnl,
        imageUrl,
      });
      
      const embed = new EmbedBuilder()
        .setColor(pnl.startsWith("+") || pnl.startsWith("$") && !pnl.includes("-") ? 0x10B981 : 0xEF4444)
        .setTitle("Trade Recap Saved")
        .addFields(
          { name: "ID", value: `#${recap.id}` },
          { name: "P&L", value: pnl },
          { name: "Notes", value: notes }
        )
        .setFooter({ text: `user: ${interaction.user.username}` })
        .setTimestamp();
      
      if (imageUrl) {
        embed.setImage(imageUrl);
        embed.addFields({ name: "screenshot", value: "✅ attached" });
      }
      
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
        content: "✅ use /request",
        ephemeral: true
      });
      
      // Notify in the channel (non-ephemeral) 
      const embed = new EmbedBuilder()
        .setColor(0x2B5BBA)
        .setTitle("🔑 to gain access use:")
        .setDescription(`/request ${interaction.user.username}`)
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
      
      await interaction.reply({ content: "✅ embed created" , ephemeral: true });
      if (interaction.channel && 'send' in interaction.channel) {
        await interaction.channel.send({ embeds: [embed] });
      }
    }
    else if (customId.startsWith("signup_modal_")) {
      const parts = customId.split("_");
      const roleId = parts[2];
      const channelId = parts[3];
      
      const title = interaction.fields.getTextInputValue("title");
      const description = interaction.fields.getTextInputValue("description");
      const colorHex = interaction.fields.getTextInputValue("color") || "#2B5BBA";
      const imageUrl = interaction.fields.getTextInputValue("image");
      const footer = interaction.fields.getTextInputValue("footer");
      
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(parseInt(colorHex.replace("#", ""), 16))
        .setTimestamp();
      
      if (footer) embed.setFooter({ text: footer });
      if (imageUrl) embed.setImage(imageUrl);
      
      const button = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`signup_${roleId}`)
            .setLabel("SIGN UP")
            .setStyle(ButtonStyle.Success)
        );
      
      const channel = await interaction.guild?.channels.fetch(channelId);
      if (channel && 'send' in channel) {
        await channel.send({ embeds: [embed], components: [button] });
        await interaction.reply({ content: "✅ Signup embed posted successfully!", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Could not find the target channel.", ephemeral: true });
      }
    }
    else if (customId === "request_modal") {
      const title = interaction.fields.getTextInputValue("title");
      const details = interaction.fields.getTextInputValue("details");
      
      const embed = new EmbedBuilder()
        .setColor(0x2B5BBA)
        .setTitle(`New Request: ${title}`)
        .setDescription(details)
        .addFields(
          { name: "Requested by", value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
          { name: "Status", value: "Pending", inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ content: "✅ request submitted", ephemeral: true });
      if (interaction.channel && 'send' in interaction.channel) {
        await interaction.channel.send({ embeds: [embed] });
      }
    }
    else if (customId.startsWith("gallery_jump_")) {
      const parts = customId.split("_");
      const userId = parts[2];
      
      const pageNumber = parseInt(interaction.fields.getTextInputValue("trade_number"));
      
      if (userId !== interaction.user.id) {
        await interaction.reply({ content: "❌ this is not your gallery.", ephemeral: true });
        return;
      }
      
      const recaps = await storage.getTradeRecapsByUser(userId);
      const recapsWithImages = recaps.filter(r => r.imageUrl);
      
      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > recapsWithImages.length) {
        await interaction.reply({ 
          content: `❌ invalid page number. Please enter a number between 1 and ${recapsWithImages.length}.`, 
          ephemeral: true 
        });
        return;
      }
      
      const currentPage = pageNumber - 1;
      const recap = recapsWithImages[currentPage];
      
      const embed = new EmbedBuilder()
        .setColor(recap.pnl.startsWith("+") || recap.pnl.startsWith("$") && !recap.pnl.includes("-") ? 0x10B981 : 0xEF4444)
        .setTitle(`Trade #${recap.id}`)
        .addFields(
          { name: "P&L", value: recap.pnl, inline: true },
          { name: "Date", value: new Date(recap.createdAt).toLocaleDateString(), inline: true }
        )
        .setImage(recap.imageUrl!)
        .setFooter({ text: `Page ${currentPage + 1}/${recapsWithImages.length} • ${recap.notes.substring(0, 100)}${recap.notes.length > 100 ? '...' : ''}` });

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gallery_prev_${userId}_${currentPage}`)
            .setLabel("◀")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId(`gallery_search_${userId}_${currentPage}`)
            .setLabel("🔍")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`gallery_next_${userId}_${currentPage}`)
            .setLabel("▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= recapsWithImages.length - 1)
        );

      await interaction.update({
        embeds: [embed],
        components: [row],
      });
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
  
  // 1. DELETE/CLEAR MESSAGES - Ultra flexible and intelligent patterns
  if (/(?:delete|clear|remove|borrar|eliminar|purge|clean|wipe)/i.test(lowerMessage) && 
      /(?:messages?|mensajes?|msg|chat|all|everything|todo|sent|enviado|i'?ve sent|he enviado|last|últimos?|from|de|by)/i.test(lowerMessage)) {
    
    console.log(`   🔥 DETECTED: Clear messages command`);
    
    if ('bulkDelete' in message.channel) {
      try {
        // Determine how many messages to fetch (always fetch more to allow filtering)
        const numberMatch = userMessage.match(/(\d+)/);
        let fetchAmount = 100; // Default fetch amount
        let deleteAmount = numberMatch ? parseInt(numberMatch[1]) : 100;
        
        // If they say "all" or "everything", delete maximum
        if (/(?:all|everything|todo|todos)/i.test(lowerMessage)) {
          deleteAmount = 100;
        }
        
        // Fetch messages to analyze
        const messages = await message.channel.messages.fetch({ limit: Math.min(fetchAmount, 100) });
        let messagesToDelete = Array.from(messages.values());
        
        // Filter by criteria
        
        // Check if filtering by "last X"
        if (/(?:last|últimos?|recent)/i.test(lowerMessage) && numberMatch) {
          console.log(`   → Filtering last ${deleteAmount} messages...`);
          messagesToDelete = messagesToDelete.slice(0, deleteAmount);
        }
        
        // Check if filtering by bots
        else if (/(?:from bots?|by bots?|de bots?|bot messages?|mensajes de bots?)/i.test(lowerMessage)) {
          console.log(`   → Filtering messages from bots...`);
          messagesToDelete = messagesToDelete.filter(msg => msg.author.bot);
          if (numberMatch) {
            messagesToDelete = messagesToDelete.slice(0, deleteAmount);
          }
        }
        
        // Check if filtering by specific user
        else if (message.mentions.users.size > 0) {
          const mentionedUser = message.mentions.users.first();
          console.log(`   → Filtering messages from ${mentionedUser?.username}...`);
          messagesToDelete = messagesToDelete.filter(msg => msg.author.id === mentionedUser?.id);
          if (numberMatch) {
            messagesToDelete = messagesToDelete.slice(0, deleteAmount);
          }
        }
        
        // Check if filtering messages from the person who sent the command
        else if (/(?:my|mis|i'?ve sent|he enviado)/i.test(lowerMessage)) {
          console.log(`   → Filtering messages from ${message.author.username}...`);
          messagesToDelete = messagesToDelete.filter(msg => msg.author.id === message.author.id);
          if (numberMatch) {
            messagesToDelete = messagesToDelete.slice(0, deleteAmount);
          }
        }
        
        // Default: just delete the specified amount
        else {
          messagesToDelete = messagesToDelete.slice(0, deleteAmount);
        }
        
        console.log(`   → Will delete ${messagesToDelete.length} messages...`);
        
        if (messagesToDelete.length === 0) {
          await message.reply(`❌ No messages found matching that criteria.`);
          return true;
        }
        
        // Delete in batches if needed
        const deleted = await message.channel.bulkDelete(messagesToDelete, true);
        const reply = await message.channel.send(`✅ Cleared ${deleted.size} messages`);
        console.log(`   ✅ EXECUTED: Deleted ${deleted.size} messages`);
        setTimeout(() => reply.delete().catch(() => {}), 3000);
        return true;
      } catch (error) {
        console.error("   ❌ Error deleting messages:", error);
        await message.reply(`❌ Error deleting messages. Make sure I have Manage Messages permission and messages are less than 14 days old.`);
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
  
  // 8. UNBAN USER
  if (/(?:unban|desbanear|quitar ban)/i.test(lowerMessage)) {
    const userIdMatch = userMessage.match(/(\d{15,20})/);
    if (userIdMatch && message.guild) {
      try {
        await message.guild.members.unban(userIdMatch[1], `Unbanned by ${message.author.username}`);
        await message.reply(`✅ User unbanned`);
        return true;
      } catch (error) {
        console.error("Error unbanning:", error);
        await message.reply(`❌ Failed to unban user.`);
        return true;
      }
    }
  }
  
  // 9. TIMEOUT USER
  if (/(?:timeout|mute|silenciar|mutear)/i.test(lowerMessage) && !/ canal| channel| voice| voz/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      const timeMatch = userMessage.match(/(\d+)\s*(?:min|minute|minuto|hour|hora|day|dia|d|h|m)/i);
      let duration = 10 * 60 * 1000; // Default 10 minutes
      
      if (timeMatch) {
        const num = parseInt(timeMatch[1]);
        if (/h|hour|hora/i.test(timeMatch[0])) duration = num * 60 * 60 * 1000;
        else if (/d|day|dia/i.test(timeMatch[0])) duration = num * 24 * 60 * 60 * 1000;
        else duration = num * 60 * 1000;
      }
      
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.timeout(duration, `Timed out by ${message.author.username}`);
        await message.reply(`✅ **${mentionedUser.username}** timed out for ${Math.floor(duration/60000)} minutes`);
        return true;
      } catch (error) {
        console.error("Error timing out user:", error);
        await message.reply(`❌ Failed to timeout user.`);
        return true;
      }
    }
  }
  
  // 10. UNTIMEOUT USER
  if (/(?:untimeout|unmute|quitar (?:mute|timeout|silencio)|desmutear)/i.test(lowerMessage) && !/ canal| channel| voice| voz/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.timeout(null, `Timeout removed by ${message.author.username}`);
        await message.reply(`✅ Timeout removed from **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error removing timeout:", error);
        await message.reply(`❌ Failed to remove timeout.`);
        return true;
      }
    }
  }
  
  // 11. CHANGE NICKNAME
  if (/(?:cambiar|change|set).*(?:nickname|nick|apodo)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    const nicknameMatch = userMessage.match(/(?:to|a)\s+["]?([^"]+)["]?$/i);
    
    if (mentionedUser && nicknameMatch && message.guild) {
      const newNick = nicknameMatch[1].trim();
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.setNickname(newNick, `Changed by ${message.author.username}`);
        await message.reply(`✅ Nickname changed to **${newNick}**`);
        return true;
      } catch (error) {
        console.error("Error changing nickname:", error);
        await message.reply(`❌ Failed to change nickname.`);
        return true;
      }
    }
  }
  
  // 12. REMOVE NICKNAME
  if (/(?:remove|quitar|eliminar|borrar).*(?:nickname|nick|apodo)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.setNickname(null, `Nickname removed by ${message.author.username}`);
        await message.reply(`✅ Nickname removed from **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error removing nickname:", error);
        await message.reply(`❌ Failed to remove nickname.`);
        return true;
      }
    }
  }
  
  // 13. ADD ROLE TO USER
  if (/(?:add|give|dar|asignar|agregar).*(?:rol|role)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    const roleMatch = message.mentions.roles.first();
    
    if (mentionedUser && roleMatch && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.roles.add(roleMatch, `Role added by ${message.author.username}`);
        await message.reply(`✅ Role **${roleMatch.name}** added to **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error adding role:", error);
        await message.reply(`❌ Failed to add role.`);
        return true;
      }
    }
  }
  
  // 14. REMOVE ROLE FROM USER
  if (/(?:remove|quitar|eliminar).*(?:rol|role).*(?:from|de|a)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    const roleMatch = message.mentions.roles.first();
    
    if (mentionedUser && roleMatch && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.roles.remove(roleMatch, `Role removed by ${message.author.username}`);
        await message.reply(`✅ Role **${roleMatch.name}** removed from **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error removing role:", error);
        await message.reply(`❌ Failed to remove role.`);
        return true;
      }
    }
  }
  
  // 15. RENAME CHANNEL
  if (/(?:rename|renombrar|cambiar nombre).*(?:canal|channel)/i.test(lowerMessage) || /(?:canal|channel).*(?:rename|renombrar)/i.test(lowerMessage)) {
    const nameMatch = userMessage.match(/(?:to|a)\s+["]?([a-zA-Z0-9-_]+)["]?/i);
    if (nameMatch && 'setName' in message.channel) {
      const newName = nameMatch[1].toLowerCase().replace(/\s+/g, '-');
      try {
        await message.channel.setName(newName, `Renamed by ${message.author.username}`);
        await message.reply(`✅ Channel renamed to **${newName}**`);
        return true;
      } catch (error) {
        console.error("Error renaming channel:", error);
        await message.reply(`❌ Failed to rename channel.`);
        return true;
      }
    }
  }
  
  // 16. SET CHANNEL TOPIC
  if (/(?:set|cambiar|establecer).*(?:topic|tema|descripcion|description)/i.test(lowerMessage)) {
    const topicMatch = userMessage.match(/(?:to|a)\s+["]?(.+)["]?$/i);
    if (topicMatch && 'setTopic' in message.channel) {
      const newTopic = topicMatch[1].trim();
      try {
        await message.channel.setTopic(newTopic);
        await message.reply(`✅ Channel topic updated`);
        return true;
      } catch (error) {
        console.error("Error setting topic:", error);
        await message.reply(`❌ Failed to set topic.`);
        return true;
      }
    }
  }
  
  // 17. SET SLOWMODE
  if (/(?:set|cambiar|establecer|activar).*(?:slowmode|modo lento)/i.test(lowerMessage)) {
    const timeMatch = userMessage.match(/(\d+)\s*(?:s|sec|segundo|segundos)?/i);
    if (timeMatch && 'setRateLimitPerUser' in message.channel) {
      const seconds = parseInt(timeMatch[1]);
      try {
        await message.channel.setRateLimitPerUser(seconds, `Slowmode set by ${message.author.username}`);
        await message.reply(`✅ Slowmode set to **${seconds} seconds**`);
        return true;
      } catch (error) {
        console.error("Error setting slowmode:", error);
        await message.reply(`❌ Failed to set slowmode.`);
        return true;
      }
    }
  }
  
  // 18. REMOVE SLOWMODE
  if (/(?:remove|quitar|desactivar).*(?:slowmode|modo lento)/i.test(lowerMessage)) {
    if ('setRateLimitPerUser' in message.channel) {
      try {
        await message.channel.setRateLimitPerUser(0, `Slowmode removed by ${message.author.username}`);
        await message.reply(`✅ Slowmode removed`);
        return true;
      } catch (error) {
        console.error("Error removing slowmode:", error);
        await message.reply(`❌ Failed to remove slowmode.`);
        return true;
      }
    }
  }
  
  // 19. LOCK CHANNEL
  if (/(?:lock|bloquear|cerrar).*(?:canal|channel)/i.test(lowerMessage) && !/slowmode/i.test(lowerMessage)) {
    if ('permissionOverwrites' in message.channel && message.guild) {
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SendMessages: false
        }, { reason: `Channel locked by ${message.author.username}` });
        await message.reply(`🔒 Channel locked`);
        return true;
      } catch (error) {
        console.error("Error locking channel:", error);
        await message.reply(`❌ Failed to lock channel.`);
        return true;
      }
    }
  }
  
  // 20. UNLOCK CHANNEL
  if (/(?:unlock|desbloquear|abrir).*(?:canal|channel)/i.test(lowerMessage)) {
    if ('permissionOverwrites' in message.channel && message.guild) {
      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SendMessages: null
        }, { reason: `Channel unlocked by ${message.author.username}` });
        await message.reply(`🔓 Channel unlocked`);
        return true;
      } catch (error) {
        console.error("Error unlocking channel:", error);
        await message.reply(`❌ Failed to unlock channel.`);
        return true;
      }
    }
  }
  
  // 21. PIN MESSAGE
  if (/(?:pin|fijar|anclar).*(?:message|mensaje|this)/i.test(lowerMessage)) {
    if (message.reference?.messageId) {
      try {
        const msgToPin = await message.channel.messages.fetch(message.reference.messageId);
        await msgToPin.pin(`Pinned by ${message.author.username}`);
        await message.reply(`📌 Message pinned`);
        return true;
      } catch (error) {
        console.error("Error pinning message:", error);
        await message.reply(`❌ Failed to pin message. Reply to a message to pin it.`);
        return true;
      }
    }
  }
  
  // 22. UNPIN MESSAGE
  if (/(?:unpin|desfijar|desanclar).*(?:message|mensaje|this)/i.test(lowerMessage)) {
    if (message.reference?.messageId) {
      try {
        const msgToUnpin = await message.channel.messages.fetch(message.reference.messageId);
        await msgToUnpin.unpin(`Unpinned by ${message.author.username}`);
        await message.reply(`📌 Message unpinned`);
        return true;
      } catch (error) {
        console.error("Error unpinning message:", error);
        await message.reply(`❌ Failed to unpin message.`);
        return true;
      }
    }
  }
  
  // 23. CREATE TEXT CHANNEL
  if (/(?:create|crea).*(?:text channel|canal de texto)/i.test(lowerMessage)) {
    const channelNameMatch = userMessage.match(/(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_]+)["]?/i);
    if (channelNameMatch && message.guild) {
      try {
        const newChannel = await message.guild.channels.create({
          name: channelNameMatch[1],
          type: 0, // Text channel
          reason: `Created by ${message.author.username}`
        });
        await message.reply(`✅ Text channel created: ${newChannel}`);
        return true;
      } catch (error) {
        console.error("Error creating text channel:", error);
        await message.reply(`❌ Failed to create text channel.`);
        return true;
      }
    }
  }
  
  // 24. CREATE VOICE CHANNEL
  if (/(?:create|crea).*(?:voice channel|canal de voz)/i.test(lowerMessage)) {
    const channelNameMatch = userMessage.match(/(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_\s]+)["]?/i);
    if (channelNameMatch && message.guild) {
      try {
        const newChannel = await message.guild.channels.create({
          name: channelNameMatch[1],
          type: 2, // Voice channel
          reason: `Created by ${message.author.username}`
        });
        await message.reply(`✅ Voice channel created: ${newChannel}`);
        return true;
      } catch (error) {
        console.error("Error creating voice channel:", error);
        await message.reply(`❌ Failed to create voice channel.`);
        return true;
      }
    }
  }
  
  // 25. CREATE CATEGORY
  if (/(?:create|crea).*(?:category|categoria)/i.test(lowerMessage)) {
    const categoryNameMatch = userMessage.match(/(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_\s]+)["]?/i);
    if (categoryNameMatch && message.guild) {
      try {
        const newCategory = await message.guild.channels.create({
          name: categoryNameMatch[1],
          type: 4, // Category
          reason: `Created by ${message.author.username}`
        });
        await message.reply(`✅ Category created: **${newCategory.name}** (ID: ${newCategory.id})`);
        return true;
      } catch (error) {
        console.error("Error creating category:", error);
        await message.reply(`❌ Failed to create category.`);
        return true;
      }
    }
  }
  
  // 26. RENAME ROLE
  if (/(?:rename|renombrar).*(?:rol|role)/i.test(lowerMessage)) {
    const roleMatch = message.mentions.roles.first();
    const newNameMatch = userMessage.match(/(?:to|a)\s+["]?([a-zA-Z0-9-_\s]+)["]?$/i);
    
    if (roleMatch && newNameMatch) {
      try {
        await roleMatch.setName(newNameMatch[1], `Renamed by ${message.author.username}`);
        await message.reply(`✅ Role renamed to **${newNameMatch[1]}**`);
        return true;
      } catch (error) {
        console.error("Error renaming role:", error);
        await message.reply(`❌ Failed to rename role.`);
        return true;
      }
    }
  }
  
  // 27. CHANGE ROLE COLOR
  if (/(?:change|cambiar).*(?:rol|role).*(?:color|colour)/i.test(lowerMessage)) {
    const roleMatch = message.mentions.roles.first();
    const colorMatch = userMessage.match(/#([0-9A-Fa-f]{6})/i);
    
    if (roleMatch && colorMatch) {
      try {
        await roleMatch.setColor(`#${colorMatch[1]}`, `Color changed by ${message.author.username}`);
        await message.reply(`✅ Role color changed to #${colorMatch[1]}`);
        return true;
      } catch (error) {
        console.error("Error changing role color:", error);
        await message.reply(`❌ Failed to change role color.`);
        return true;
      }
    }
  }
  
  // 28. MAKE ROLE MENTIONABLE
  if (/(?:make|hacer).*(?:rol|role).*(?:mentionable|mencionable)/i.test(lowerMessage)) {
    const roleMatch = message.mentions.roles.first();
    if (roleMatch) {
      try {
        await roleMatch.setMentionable(true, `Made mentionable by ${message.author.username}`);
        await message.reply(`✅ Role **${roleMatch.name}** is now mentionable`);
        return true;
      } catch (error) {
        console.error("Error making role mentionable:", error);
        await message.reply(`❌ Failed to make role mentionable.`);
        return true;
      }
    }
  }
  
  // 29. MAKE ROLE NOT MENTIONABLE
  if (/(?:make|hacer).*(?:rol|role).*(?:not mentionable|no mencionable)/i.test(lowerMessage)) {
    const roleMatch = message.mentions.roles.first();
    if (roleMatch) {
      try {
        await roleMatch.setMentionable(false, `Made not mentionable by ${message.author.username}`);
        await message.reply(`✅ Role **${roleMatch.name}** is no longer mentionable`);
        return true;
      } catch (error) {
        console.error("Error making role not mentionable:", error);
        await message.reply(`❌ Failed to make role not mentionable.`);
        return true;
      }
    }
  }
  
  // 30. LIST ROLES
  if (/(?:list|listar|show|mostrar).*(?:roles|todos los roles)/i.test(lowerMessage)) {
    if (message.guild) {
      try {
        const roles = message.guild.roles.cache
          .filter(r => r.id !== message.guild!.id)
          .sort((a, b) => b.position - a.position)
          .map(r => `**${r.name}** (${r.members.size} members)`)
          .slice(0, 25);
        
        await message.reply(`📋 **Server Roles:**\n${roles.join('\n')}`);
        return true;
      } catch (error) {
        console.error("Error listing roles:", error);
        await message.reply(`❌ Failed to list roles.`);
        return true;
      }
    }
  }
  
  // 31. CREATE INVITE
  if (/(?:create|crea|generar).*(?:invite|invitacion|invitación)/i.test(lowerMessage)) {
    try {
      const timeMatch = userMessage.match(/(\d+)\s*(?:h|hour|hora|d|day|dia)/i);
      let maxAge = 86400; // 24 hours default
      
      if (timeMatch) {
        const num = parseInt(timeMatch[1]);
        if (/h|hour|hora/i.test(timeMatch[0])) maxAge = num * 3600;
        else if (/d|day|dia/i.test(timeMatch[0])) maxAge = num * 86400;
      }
      
      if ('createInvite' in message.channel) {
        const invite = await message.channel.createInvite({
          maxAge: maxAge,
          reason: `Invite created by ${message.author.username}`
        });
        await message.reply(`✅ Invite created: ${invite.url}\nExpires in ${Math.floor(maxAge/3600)} hours`);
        return true;
      }
    } catch (error) {
      console.error("Error creating invite:", error);
      await message.reply(`❌ Failed to create invite.`);
      return true;
    }
  }
  
  // 32. SET CHANNEL NSFW
  if (/(?:set|marcar|hacer).*(?:nsfw)/i.test(lowerMessage)) {
    if ('setNSFW' in message.channel) {
      try {
        await message.channel.setNSFW(true, `NSFW set by ${message.author.username}`);
        await message.reply(`🔞 Channel marked as NSFW`);
        return true;
      } catch (error) {
        console.error("Error setting NSFW:", error);
        await message.reply(`❌ Failed to set NSFW.`);
        return true;
      }
    }
  }
  
  // 33. UNSET CHANNEL NSFW
  if (/(?:remove|quitar|desmarcar).*(?:nsfw)/i.test(lowerMessage)) {
    if ('setNSFW' in message.channel) {
      try {
        await message.channel.setNSFW(false, `NSFW removed by ${message.author.username}`);
        await message.reply(`✅ Channel unmarked as NSFW`);
        return true;
      } catch (error) {
        console.error("Error removing NSFW:", error);
        await message.reply(`❌ Failed to remove NSFW.`);
        return true;
      }
    }
  }
  
  // 34. CREATE THREAD
  if (/(?:create|crea).*(?:thread|hilo)/i.test(lowerMessage)) {
    const threadNameMatch = userMessage.match(/(?:llamado|named|called)\s+["]?([a-zA-Z0-9-_\s]+)["]?/i);
    if (threadNameMatch && 'threads' in message.channel) {
      try {
        const thread = await message.channel.threads.create({
          name: threadNameMatch[1],
          reason: `Thread created by ${message.author.username}`
        });
        await message.reply(`✅ Thread created: ${thread}`);
        return true;
      } catch (error) {
        console.error("Error creating thread:", error);
        await message.reply(`❌ Failed to create thread.`);
        return true;
      }
    }
  }
  
  // 35. ARCHIVE THREAD
  if (/(?:archive|archivar|cerrar).*(?:thread|hilo)/i.test(lowerMessage)) {
    if (message.channel.isThread()) {
      try {
        await message.channel.setArchived(true, `Archived by ${message.author.username}`);
        await message.reply(`📦 Thread archived`);
        return true;
      } catch (error) {
        console.error("Error archiving thread:", error);
        await message.reply(`❌ Failed to archive thread.`);
        return true;
      }
    }
  }
  
  // 36. UNARCHIVE THREAD
  if (/(?:unarchive|desarchivar|abrir).*(?:thread|hilo)/i.test(lowerMessage)) {
    if (message.channel.isThread()) {
      try {
        await message.channel.setArchived(false, `Unarchived by ${message.author.username}`);
        await message.reply(`📂 Thread unarchived`);
        return true;
      } catch (error) {
        console.error("Error unarchiving thread:", error);
        await message.reply(`❌ Failed to unarchive thread.`);
        return true;
      }
    }
  }
  
  // 37. LOCK THREAD
  if (/(?:lock|bloquear).*(?:thread|hilo)/i.test(lowerMessage)) {
    if (message.channel.isThread()) {
      try {
        await message.channel.setLocked(true, `Locked by ${message.author.username}`);
        await message.reply(`🔒 Thread locked`);
        return true;
      } catch (error) {
        console.error("Error locking thread:", error);
        await message.reply(`❌ Failed to lock thread.`);
        return true;
      }
    }
  }
  
  // 38. UNLOCK THREAD
  if (/(?:unlock|desbloquear).*(?:thread|hilo)/i.test(lowerMessage)) {
    if (message.channel.isThread()) {
      try {
        await message.channel.setLocked(false, `Unlocked by ${message.author.username}`);
        await message.reply(`🔓 Thread unlocked`);
        return true;
      } catch (error) {
        console.error("Error unlocking thread:", error);
        await message.reply(`❌ Failed to unlock thread.`);
        return true;
      }
    }
  }
  
  // 39. ADD REACTION
  if (/(?:add|agregar).*(?:reaction|reaccion|emoji)/i.test(lowerMessage)) {
    if (message.reference?.messageId) {
      const emojiMatch = userMessage.match(/(?:emoji|reaction|reaccion)\s+(\p{Emoji}|:\w+:)/u);
      if (emojiMatch) {
        try {
          const msgToReact = await message.channel.messages.fetch(message.reference.messageId);
          await msgToReact.react(emojiMatch[1]);
          await message.reply(`✅ Reaction added`);
          return true;
        } catch (error) {
          console.error("Error adding reaction:", error);
          await message.reply(`❌ Failed to add reaction.`);
          return true;
        }
      }
    }
  }
  
  // 40. REMOVE ALL REACTIONS
  if (/(?:remove|quitar|clear|limpiar).*(?:all reactions|todas las reacciones)/i.test(lowerMessage)) {
    if (message.reference?.messageId) {
      try {
        const msgToClear = await message.channel.messages.fetch(message.reference.messageId);
        await msgToClear.reactions.removeAll();
        await message.reply(`✅ All reactions removed`);
        return true;
      } catch (error) {
        console.error("Error removing reactions:", error);
        await message.reply(`❌ Failed to remove reactions.`);
        return true;
      }
    }
  }
  
  // 41. SEND MESSAGE TO CHANNEL (OWNER ONLY)
  if (/(?:send|enviar).*(?:message|mensaje).*(?:to|a).*(?:canal|channel)/i.test(lowerMessage)) {
    // Only allow owner to use this command
    if (message.author.id !== "404315406111604747") {
      console.log(`   ❌ User ${message.author.username} attempted to send message to channel but is not owner`);
      return false; // Don't handle, let AI respond
    }
    
    const channelMatch = message.mentions.channels.first();
    let messageToSend = userMessage.match(/["'](.+)["']/)?.[1];
    
    // Also support channel ID
    const channelIdMatch = userMessage.match(/(?:channel|canal)\s+(\d{15,20})/i);
    const targetChannel = channelMatch || (channelIdMatch ? await message.guild?.channels.fetch(channelIdMatch[1]) : null);
    
    if (targetChannel && messageToSend && 'send' in targetChannel) {
      try {
        await targetChannel.send(messageToSend);
        await message.reply(`✅ Message sent to ${targetChannel}`);
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        await message.reply(`❌ Failed to send message.`);
        return true;
      }
    }
  }
  
  // 41.5 SEND DM TO USER (OWNER ONLY)
  if (/(?:send|enviar).*(?:dm|mensaje directo|private message).*(?:to|a)/i.test(lowerMessage)) {
    // Only allow owner to use this command
    if (message.author.id !== "404315406111604747") {
      console.log(`   ❌ User ${message.author.username} attempted to send DM but is not owner`);
      return false; // Don't handle, let AI respond
    }
    
    const userMatch = message.mentions.users.first();
    const userIdMatch = userMessage.match(/(?:user|usuario|id)\s+(\d{15,20})/i);
    const messageToSend = userMessage.match(/["'](.+)["']/)?.[1];
    
    const targetUser = userMatch || (userIdMatch ? await client.users.fetch(userIdMatch[1]) : null);
    
    if (targetUser && messageToSend) {
      try {
        await targetUser.send(messageToSend);
        await message.reply(`✅ DM sent to **${targetUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error sending DM:", error);
        await message.reply(`❌ Failed to send DM. User might have DMs disabled.`);
        return true;
      }
    }
  }
  
  // 42. CLONE CHANNEL
  if (/(?:clone|clonar|duplicar).*(?:canal|channel|this)/i.test(lowerMessage)) {
    if ('clone' in message.channel) {
      try {
        const cloned = await message.channel.clone({ reason: `Cloned by ${message.author.username}` });
        await message.reply(`✅ Channel cloned: ${cloned}`);
        return true;
      } catch (error) {
        console.error("Error cloning channel:", error);
        await message.reply(`❌ Failed to clone channel.`);
        return true;
      }
    }
  }
  
  // 43. GET SERVER INFO
  if (/(?:server|servidor).*(?:info|information|informacion)/i.test(lowerMessage)) {
    if (message.guild) {
      try {
        const info = [
          `**Server:** ${message.guild.name}`,
          `**ID:** ${message.guild.id}`,
          `**Owner:** <@${message.guild.ownerId}>`,
          `**Members:** ${message.guild.memberCount}`,
          `**Channels:** ${message.guild.channels.cache.size}`,
          `**Roles:** ${message.guild.roles.cache.size}`,
          `**Created:** <t:${Math.floor(message.guild.createdTimestamp/1000)}:R>`
        ].join('\n');
        await message.reply(info);
        return true;
      } catch (error) {
        console.error("Error getting server info:", error);
        await message.reply(`❌ Failed to get server info.`);
        return true;
      }
    }
  }
  
  // 44. GET USER INFO
  if (/(?:user|usuario).*(?:info|information|informacion)/i.test(lowerMessage)) {
    const targetUser = message.mentions.users.first() || message.author;
    try {
      const member = message.guild ? await message.guild.members.fetch(targetUser.id) : null;
      const info = [
        `**User:** ${targetUser.username}`,
        `**ID:** ${targetUser.id}`,
        `**Account Created:** <t:${Math.floor(targetUser.createdTimestamp/1000)}:R>`,
        member ? `**Joined Server:** <t:${Math.floor(member.joinedTimestamp!/1000)}:R>` : '',
        member ? `**Roles:** ${member.roles.cache.filter(r => r.id !== message.guild!.id).size}` : ''
      ].filter(Boolean).join('\n');
      await message.reply(info);
      return true;
    } catch (error) {
      console.error("Error getting user info:", error);
      await message.reply(`❌ Failed to get user info.`);
      return true;
    }
  }
  
  // 45. GET AVATAR
  if (/(?:avatar|pfp|profile|foto de perfil)/i.test(lowerMessage)) {
    const targetUser = message.mentions.users.first() || message.author;
    try {
      const avatarURL = targetUser.displayAvatarURL({ size: 2048, extension: 'png' });
      await message.reply(`${targetUser.username}'s avatar: ${avatarURL}`);
      return true;
    } catch (error) {
      console.error("Error getting avatar:", error);
      await message.reply(`❌ Failed to get avatar.`);
      return true;
    }
  }
  
  // 46. MOVE USER TO VOICE CHANNEL
  if (/(?:move|mover).*(?:to|a).*(?:voice|voz)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    const channelMatch = message.mentions.channels.first();
    
    if (mentionedUser && channelMatch && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        if (member.voice.channel && channelMatch.isVoiceBased()) {
          await member.voice.setChannel(channelMatch.id, `Moved by ${message.author.username}`);
          await message.reply(`✅ Moved **${mentionedUser.username}** to ${channelMatch}`);
          return true;
        } else {
          await message.reply(`❌ User is not in a voice channel or target is not a voice channel.`);
          return true;
        }
      } catch (error) {
        console.error("Error moving user:", error);
        await message.reply(`❌ Failed to move user.`);
        return true;
      }
    }
  }
  
  // 47. DISCONNECT USER FROM VOICE
  if (/(?:disconnect|desconectar).*(?:from voice|de voz)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        if (member.voice.channel) {
          await member.voice.disconnect(`Disconnected by ${message.author.username}`);
          await message.reply(`✅ Disconnected **${mentionedUser.username}** from voice`);
          return true;
        } else {
          await message.reply(`❌ User is not in a voice channel.`);
          return true;
        }
      } catch (error) {
        console.error("Error disconnecting user:", error);
        await message.reply(`❌ Failed to disconnect user.`);
        return true;
      }
    }
  }
  
  // 48. VOICE MUTE USER
  if (/(?:voice mute|mutear voz|mute in voice)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.voice.setMute(true, `Voice muted by ${message.author.username}`);
        await message.reply(`🔇 Voice muted **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error voice muting:", error);
        await message.reply(`❌ Failed to voice mute user.`);
        return true;
      }
    }
  }
  
  // 49. VOICE UNMUTE USER
  if (/(?:voice unmute|desmutear voz|unmute in voice)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.voice.setMute(false, `Voice unmuted by ${message.author.username}`);
        await message.reply(`🔊 Voice unmuted **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error voice unmuting:", error);
        await message.reply(`❌ Failed to voice unmute user.`);
        return true;
      }
    }
  }
  
  // 50. DEAFEN USER
  if (/(?:deafen|ensordecer)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.voice.setDeaf(true, `Deafened by ${message.author.username}`);
        await message.reply(`🔇 Deafened **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error deafening:", error);
        await message.reply(`❌ Failed to deafen user.`);
        return true;
      }
    }
  }
  
  // 51. UNDEAFEN USER
  if (/(?:undeafen|quitar ensordecer)/i.test(lowerMessage)) {
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.guild) {
      try {
        const member = await message.guild.members.fetch(mentionedUser.id);
        await member.voice.setDeaf(false, `Undeafened by ${message.author.username}`);
        await message.reply(`🔊 Undeafened **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error undeafening:", error);
        await message.reply(`❌ Failed to undeafen user.`);
        return true;
      }
    }
  }
  
  // 52-100+ More commands continue...
  // Adding bulk operations, webhook management, emoji operations, etc.
  
  return false;
}

// NEW COMMAND HANDLERS

async function handleVCCommand(interaction: ChatInputCommandInteraction) {
  try {
    const member = interaction.member;
    if (!member || !interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    // Get server settings
    const settings = await storage.getServerSettings(interaction.guild.id);
    if (!settings || !settings.vcTriggerChannelId || !settings.vcCategoryId) {
      await interaction.reply({ 
        content: "voice channel system not configured. ask rejected to run `/vcsetup` first.",
        ephemeral: true 
      });
      return;
    }

    // Check if user is in the trigger voice channel
    const voiceState = interaction.guild.members.cache.get(interaction.user.id)?.voice;
    if (!voiceState || !voiceState.channelId) {
      await interaction.reply({ content: "❌ you must be in sessions voice chat to create a room.", ephemeral: true });
      return;
    }

    if (voiceState.channelId !== settings.vcTriggerChannelId) {
      await interaction.reply({ 
        content: `you must be in (<#${settings.vcTriggerChannelId}>) to create a temporary vc.`,
        ephemeral: true 
      });
      return;
    }

    // Create the temporary voice channel
    const channelName = `${interaction.user.username}'s lounge`;
    const newChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: settings.vcCategoryId,
      reason: `temporary vc created by ${interaction.user.username}`,
    });

    // Save to database
    await storage.addTempVoiceChannel({
      channelId: newChannel.id,
      ownerId: interaction.user.id,
      ownerName: interaction.user.username,
      guildId: interaction.guild.id,
    });

    // Move user to the new channel
    const guildMember = interaction.guild.members.cache.get(interaction.user.id);
    if (guildMember && guildMember.voice.channelId) {
      await guildMember.voice.setChannel(newChannel.id);
    }

    // Create settings menu (ephemeral - only visible to user)
    const settingsEmbed = new EmbedBuilder()
      .setColor(0x2B5BBA)
      .setTitle("🎙️ Voice Channel Created")
      .setDescription(`Your channel <#${newChannel.id}> has been created\n\nUse the menu below to configure it:`)
      .setTimestamp();

    const privacyMenu = new StringSelectMenuBuilder()
      .setCustomId(`vc_privacy_${newChannel.id}`)
      .setPlaceholder("Select privacy setting")
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel("Public - Anyone can join")
          .setValue("public")
          .setEmoji("🌐")
          .setDefault(true),
        new StringSelectMenuOptionBuilder()
          .setLabel("Private - Only invited ppl")
          .setValue("private")
          .setEmoji("🔒"),
      ]);

    const limitMenu = new StringSelectMenuBuilder()
      .setCustomId(`vc_limit_${newChannel.id}`)
      .setPlaceholder("Set user limit (optional)")
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel("No limit")
          .setValue("0")
          .setDefault(true),
        new StringSelectMenuOptionBuilder()
          .setLabel("2 users")
          .setValue("2"),
        new StringSelectMenuOptionBuilder()
          .setLabel("5 users")
          .setValue("5"),
        new StringSelectMenuOptionBuilder()
          .setLabel("10 users")
          .setValue("10"),
        new StringSelectMenuOptionBuilder()
          .setLabel("15 users")
          .setValue("15"),
      ]);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(privacyMenu);
    const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(limitMenu);

    await interaction.reply({
      embeds: [settingsEmbed],
      components: [row1, row2],
      ephemeral: true,
    });

  } catch (error) {
    console.error("Error creating temporary VC:", error);
    await interaction.reply({ content: "❌ Failed to create voice channel.", ephemeral: true });
  }
}

async function handleGalleryCommand(interaction: ChatInputCommandInteraction) {
  try {
    const recaps = await storage.getTradeRecapsByUser(interaction.user.id);
    const recapsWithImages = recaps.filter(r => r.imageUrl);

    if (recapsWithImages.length === 0) {
      await interaction.reply({
        content: "📸 you haven't uploaded any trade screenshots yet.\n\nuse `/recap` and add an image URL to start building your gallery",
        ephemeral: true,
      });
      return;
    }

    // If 2 or fewer trades, show them all without pagination
    if (recapsWithImages.length <= 2) {
      const embeds = recapsWithImages.map(recap => {
        const embed = new EmbedBuilder()
          .setColor(recap.pnl.startsWith("+") || recap.pnl.startsWith("$") && !recap.pnl.includes("-") ? 0x10B981 : 0xEF4444)
          .setTitle(`Trade #${recap.id}`)
          .addFields(
            { name: "P&L", value: recap.pnl, inline: true },
            { name: "Date", value: new Date(recap.createdAt).toLocaleDateString(), inline: true }
          )
          .setImage(recap.imageUrl!)
          .setFooter({ text: `${recap.notes.substring(0, 100)}${recap.notes.length > 100 ? '...' : ''}` });
        return embed;
      });

      await interaction.reply({
        content: `📸 **Your Trade Gallery** (${recapsWithImages.length} ${recapsWithImages.length === 1 ? 'screenshot' : 'screenshots'})`,
        embeds: embeds,
        ephemeral: false,
      });
      return;
    }

    // Show page 1 with pagination controls
    const currentPage = 0;
    const recap = recapsWithImages[currentPage];
    
    const embed = new EmbedBuilder()
      .setColor(recap.pnl.startsWith("+") || recap.pnl.startsWith("$") && !recap.pnl.includes("-") ? 0x10B981 : 0xEF4444)
      .setTitle(`Trade #${recap.id}`)
      .addFields(
        { name: "P&L", value: recap.pnl, inline: true },
        { name: "Date", value: new Date(recap.createdAt).toLocaleDateString(), inline: true }
      )
      .setImage(recap.imageUrl!)
      .setFooter({ text: `Page ${currentPage + 1}/${recapsWithImages.length} • ${recap.notes.substring(0, 100)}${recap.notes.length > 100 ? '...' : ''}` });

    // Create pagination buttons
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`gallery_prev_${interaction.user.id}_${currentPage}`)
          .setLabel("◀")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId(`gallery_search_${interaction.user.id}_${currentPage}`)
          .setLabel("🔍")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`gallery_next_${interaction.user.id}_${currentPage}`)
          .setLabel("▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= recapsWithImages.length - 1)
      );

    await interaction.reply({
      content: `📸 **Your Trade Gallery** (${recapsWithImages.length} screenshots)`,
      embeds: [embed],
      components: [row],
      ephemeral: false,
    });

  } catch (error) {
    console.error("Error showing gallery:", error);
    await interaction.reply({ content: "❌ Failed to load gallery.", ephemeral: true });
  }
}

async function handleBibleCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    
    await storage.updateServerSettings(interaction.guild.id, {
      bibleChannelId: channel.id,
    });

    await interaction.reply({
      content: `✅ Daily bible verses will be sent to <#${channel.id}> at midnight (00:00 UTC).`,
      ephemeral: false,
    });

  } catch (error) {
    console.error("Error setting bible channel:", error);
    await interaction.reply({ content: "❌ Failed to set bible channel.", ephemeral: true });
  }
}

async function handleNewsCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    
    await storage.updateServerSettings(interaction.guild.id, {
      newsChannelId: channel.id,
    });

    await interaction.reply({
      content: `✅ Trading news will be posted to <#${channel.id}> automatically.`,
      ephemeral: false,
    });

  } catch (error) {
    console.error("Error setting news channel:", error);
    await interaction.reply({ content: "❌ Failed to set news channel.", ephemeral: true });
  }
}

async function handleVCSetupCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    const triggerChannel = interaction.options.getChannel("trigger", true);
    const category = interaction.options.getChannel("category", true);
    
    await storage.updateServerSettings(interaction.guild.id, {
      vcTriggerChannelId: triggerChannel.id,
      vcCategoryId: category.id,
    });

    await interaction.reply({
      content: `✅ Voice channel setup complete!\n🎙️ Trigger: <#${triggerChannel.id}>\n📁 Category: ${category.name}`,
      ephemeral: false,
    });

  } catch (error) {
    console.error("Error setting VC configuration:", error);
    await interaction.reply({ content: "❌ Failed to set VC configuration.", ephemeral: true });
  }
}

// Handle select menu interactions
async function handleSelectMenu(interaction: any) {
  const { customId, values } = interaction;

  if (customId.startsWith("vc_privacy_")) {
    const channelId = customId.replace("vc_privacy_", "");
    const privacy = values[0];

    try {
      const channel = await interaction.guild?.channels.fetch(channelId);
      if (!channel || !channel.isVoiceBased()) return;

      if (privacy === "private") {
        await channel.permissionOverwrites.create(interaction.guild!.roles.everyone, {
          ViewChannel: false,
          Connect: false,
        });
        await channel.permissionOverwrites.create(interaction.user.id, {
          ViewChannel: true,
          Connect: true,
          ManageChannels: true,
        });
        await interaction.reply({ content: "🔒 Channel set to **Private**. Only you and invited users can join.", ephemeral: true });
      } else {
        await channel.permissionOverwrites.create(interaction.guild!.roles.everyone, {
          ViewChannel: true,
          Connect: true,
        });
        await interaction.reply({ content: "🌐 Channel set to **Public**. Anyone can join.", ephemeral: true });
      }
    } catch (error) {
      console.error("Error setting VC privacy:", error);
      await interaction.reply({ content: "❌ Failed to update privacy settings.", ephemeral: true });
    }
  } else if (customId.startsWith("vc_limit_")) {
    const channelId = customId.replace("vc_limit_", "");
    const limit = parseInt(values[0]);

    try {
      const channel = await interaction.guild?.channels.fetch(channelId);
      if (!channel || !channel.isVoiceBased()) return;

      await channel.setUserLimit(limit);
      
      if (limit === 0) {
        await interaction.reply({ content: "♾️ User limit removed. No restriction on members.", ephemeral: true });
      } else {
        await interaction.reply({ content: `👥 User limit set to **${limit} users**.`, ephemeral: true });
      }
    } catch (error) {
      console.error("Error setting VC limit:", error);
      await interaction.reply({ content: "❌ Failed to update user limit.", ephemeral: true });
    }
  }
}

// Handle voice state updates for temp VC management
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    // Check if a user left a channel
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const leftChannel = oldState.channel;
      if (!leftChannel) return;

      // Check if this is a temp VC
      const tempVC = await storage.getTempVoiceChannel(leftChannel.id);
      if (!tempVC) return;

      // Check if channel is now empty
      if (leftChannel.members.size === 0) {
        console.log(`🗑️ Deleting empty temp VC: ${leftChannel.name}`);
        await leftChannel.delete("Temporary VC is empty");
        await storage.deleteTempVoiceChannel(leftChannel.id);
      }
    }
  } catch (error) {
    console.error("Error handling voice state update:", error);
  }
});

// Daily bible verse sender (runs at midnight UTC)
async function sendDailyBibleVerse() {
  try {
    // Get all guilds with bible channel configured
    const allChannels = client.channels.cache;
    
    for (const [, channel] of allChannels) {
      if (!channel.isTextBased() || !('guild' in channel) || !channel.guild) continue;
      
      const settings = await storage.getServerSettings(channel.guild.id);
      if (!settings || !settings.bibleChannelId || settings.bibleChannelId !== channel.id) continue;

      // Fetch verse from Bible API (free, no key required)
      const response = await fetch("https://bible-api.com/?random=verse");
      const data = await response.json();

      const embed = new EmbedBuilder()
        .setColor(0x9C27B0)
        .setTitle("📖 Daily Bible Verse")
        .setDescription(`**${data.reference}**\n\n${data.text}`)
        .setFooter({ text: "Daily verse delivered at midnight UTC" })
        .setTimestamp();

      if (channel.isTextBased() && 'send' in channel) {
        await channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error("Error sending daily bible verse:", error);
  }
}

// Schedule daily bible verse at midnight UTC
setInterval(async () => {
  const now = new Date();
  if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
    await sendDailyBibleVerse();
  }
}, 60000); // Check every minute

// Trading news fetcher (using free RSS feeds)
async function sendTradingNews() {
  try {
    // Get all channels configured for news
    const allChannels = client.channels.cache;
    
    for (const [, channel] of allChannels) {
      if (!channel.isTextBased() || !('guild' in channel) || !channel.guild) continue;
      
      const settings = await storage.getServerSettings(channel.guild.id);
      if (!settings || !settings.newsChannelId || settings.newsChannelId !== channel.id) continue;

      // Fetch latest market news from free RSS feed (MarketWatch)
      const response = await fetch("https://feeds.marketwatch.com/marketwatch/topstories/");
      const rssText = await response.text();
      
      // Parse RSS (simple extraction - no XML parser needed)
      const items = rssText.match(/<item>[\s\S]*?<\/item>/g) || [];
      const newsItems = items.slice(0, 3).map(item => {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                     item.match(/<title>(.*?)<\/title>/)?.[1] || "No title";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                          item.match(/<description>(.*?)<\/description>/)?.[1] || "";
        return { title, link, description };
      });

      if (newsItems.length > 0) {
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle("📈 Latest Trading News")
          .setDescription("Top market stories from MarketWatch")
          .setTimestamp();

        newsItems.forEach((item, index) => {
          const cleanDesc = item.description.replace(/<[^>]*>/g, '').substring(0, 200);
          embed.addFields({
            name: `${index + 1}. ${item.title.substring(0, 100)}`,
            value: `${cleanDesc}...\n[Read more](${item.link})`,
          });
        });

        embed.setFooter({ text: "News updates delivered hourly" });

        if (channel.isTextBased() && 'send' in channel) {
          await channel.send({ embeds: [embed] });
          console.log(`📰 Sent trading news to ${channel.guild.name}`);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching trading news:", error);
  }
}

// Schedule trading news every hour
setInterval(async () => {
  await sendTradingNews();
}, 3600000); // Every hour (3600000 ms)

// NEW COMMAND HANDLERS

async function handleSetupSignupCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    const role = interaction.options.getRole("role", true);
    const channel = interaction.options.getChannel("channel", true);

    // Show modal for embed customization
    const modal = new ModalBuilder()
      .setCustomId(`signup_modal_${role.id}_${channel.id}`)
      .setTitle("Customize Signup Embed");

    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Embed Title")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g., Join Our Community!")
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Embed Description")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Describe what users will get by signing up...")
      .setRequired(true);

    const colorInput = new TextInputBuilder()
      .setCustomId("color")
      .setLabel("Color (hex code, e.g., #2B5BBA)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("#2B5BBA")
      .setRequired(false);

    const imageInput = new TextInputBuilder()
      .setCustomId("image")
      .setLabel("Image URL (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId("footer")
      .setLabel("Footer Text (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    console.error("Error in setupsignup command:", error);
    await interaction.reply({ content: "❌ Failed to open signup modal.", ephemeral: true });
  }
}

async function handleReqRequestCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    const role = interaction.options.getRole("role", true);

    await storage.updateServerSettings(interaction.guild.id, {
      requestRequiredRoleId: role.id,
    });

    await interaction.reply({
      content: `✅ Users now need the **${role.name}** role to use the \`/request\` command.`,
      ephemeral: false,
    });
  } catch (error) {
    console.error("Error in reqrequest command:", error);
    await interaction.reply({ content: "❌ Failed to set required role.", ephemeral: true });
  }
}

async function handleRequestCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    // Check if user has required role
    const settings = await storage.getServerSettings(interaction.guild.id);
    if (settings?.requestRequiredRoleId) {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (!member?.roles.cache.has(settings.requestRequiredRoleId)) {
        await interaction.reply({
          content: `❌ You need the <@&${settings.requestRequiredRoleId}> role to use this command.`,
          ephemeral: true,
        });
        return;
      }
    }

    // Show modal for request
    const modal = new ModalBuilder()
      .setCustomId("request_modal")
      .setTitle("Submit a Request");

    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Request Title")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Brief title for your request")
      .setRequired(true);

    const detailsInput = new TextInputBuilder()
      .setCustomId("details")
      .setLabel("Request Details")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Provide details about what you're requesting...")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(detailsInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    console.error("Error in request command:", error);
    await interaction.reply({ content: "❌ Failed to open request modal.", ephemeral: true });
  }
}

// Button interaction handler
async function handleButton(interaction: any) {
  const { customId } = interaction;

  try {
    // Gallery pagination buttons
    if (customId.startsWith("gallery_prev_") || customId.startsWith("gallery_next_")) {
      const parts = customId.split("_");
      const userId = parts[2];
      let currentPage = parseInt(parts[3]);

      // Verify it's the same user
      if (userId !== interaction.user.id) {
        await interaction.reply({ content: "❌ This is not your gallery.", ephemeral: true });
        return;
      }

      // Get user's recaps
      const recaps = await storage.getTradeRecapsByUser(userId);
      const recapsWithImages = recaps.filter((r: any) => r.imageUrl);

      if (customId.startsWith("gallery_prev_")) {
        currentPage = Math.max(0, currentPage - 1);
      } else {
        currentPage = Math.min(recapsWithImages.length - 1, currentPage + 1);
      }

      const recap = recapsWithImages[currentPage];
      const embed = new EmbedBuilder()
        .setColor(recap.pnl.startsWith("+") || recap.pnl.startsWith("$") && !recap.pnl.includes("-") ? 0x10B981 : 0xEF4444)
        .setTitle(`📊 Trade #${recap.id}`)
        .addFields(
          { name: "P&L", value: recap.pnl, inline: true },
          { name: "Date", value: new Date(recap.createdAt).toLocaleDateString(), inline: true }
        )
        .setImage(recap.imageUrl!)
        .setFooter({ text: `Page ${currentPage + 1}/${recapsWithImages.length} • ${recap.notes.substring(0, 100)}${recap.notes.length > 100 ? '...' : ''}` });

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`gallery_prev_${userId}_${currentPage}`)
            .setLabel("◀")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId(`gallery_search_${userId}_${currentPage}`)
            .setLabel("🔍")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`gallery_next_${userId}_${currentPage}`)
            .setLabel("▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= recapsWithImages.length - 1)
        );

      await interaction.update({
        embeds: [embed],
        components: [row],
      });
    }

    // Gallery search button
    else if (customId.startsWith("gallery_search_")) {
      const parts = customId.split("_");
      const userId = parts[2];
      const currentPage = parseInt(parts[3]);

      if (userId !== interaction.user.id) {
        await interaction.reply({ content: "❌ This is not your gallery.", ephemeral: true });
        return;
      }

      const modal = new ModalBuilder()
        .setCustomId(`gallery_jump_${userId}_${currentPage}`)
        .setTitle("Jump to Trade");

      const tradeInput = new TextInputBuilder()
        .setCustomId("trade_number")
        .setLabel("Enter page number (trade number)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g., 5")
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(tradeInput));

      await interaction.showModal(modal);
    }

    // Signup button
    else if (customId.startsWith("signup_")) {
      const roleId = customId.replace("signup_", "");

      if (!interaction.guild) return;

      try {
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member) {
          await interaction.reply({ content: "❌ Could not find your member data.", ephemeral: true });
          return;
        }

        await member.roles.add(roleId);

        // Send DM
        try {
          await interaction.user.send("time to escape right?");
        } catch (dmError) {
          console.error("Failed to send DM:", dmError);
        }

        await interaction.reply({ content: "✅ welcome.", ephemeral: true });
      } catch (error) {
        console.error("Error assigning role:", error);
        await interaction.reply({ content: "❌ failed, dm rejected.", ephemeral: true });
      }
    }
  } catch (error) {
    console.error("Error handling button interaction:", error);
    await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true }).catch(() => {});
  }
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
