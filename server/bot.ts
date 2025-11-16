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
    .setDescription("keep track of your trades")
    .addAttachmentOption(option =>
      option
        .setName("screenshot")
        .setDescription("trade screenshot")
        .setRequired(false)
    ),
  
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
    .setName("setupwelcome")
    .setDescription("admin")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("Role to assign to new members")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("DM message to send to new members")
        .setRequired(false)
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
  
  new SlashCommandBuilder()
    .setName("code")
    .setDescription("generate a unique access code for web login"),
  
  new SlashCommandBuilder()
    .setName("testapis")
    .setDescription("admin - test both APIs and send bot statistics")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
];

// Admin user IDs who can execute admin commands via chat
const ADMIN_USER_IDS = ["404315406111604747"];

// Temporary storage for attached images in /recap command
const pendingRecapImages = new Map<string, string>();

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
      
      // Check for general commands FIRST (available to all users)
      console.log(`   → Checking for general commands...`);
      try {
        const handled = await handleGeneralCommand(message, userMessage);
        if (handled) {
          console.log(`   ✅ General command handled successfully`);
          return;
        }
        console.log(`   ✓ No general command matched`);
      } catch (cmdError) {
        console.error(`   ✗ Error in general command handler:`, cmdError);
      }
      
      // Check for admin commands (only for admins)
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
      case "setupwelcome":
        await handleSetupWelcomeCommand(interaction);
        break;
      case "reqrequest":
        await handleReqRequestCommand(interaction);
        break;
      case "request":
        await handleRequestCommand(interaction);
        break;
      case "code":
        await handleCodeCommand(interaction);
        break;
      case "testapis":
        await handleTestApisCommand(interaction);
        break;
    }
  } catch (error) {
    console.error(`Error handling /${commandName}:`, error);
    // Only try to reply if the interaction hasn't been replied to or deferred
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: "Something went wrong processing that command.", ephemeral: true });
      } catch (replyError) {
        console.error("Failed to send error reply:", replyError);
      }
    }
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
  // Get the attached screenshot if provided
  const screenshot = interaction.options.getAttachment("screenshot");
  
  // Store the image URL temporarily if provided
  if (screenshot) {
    pendingRecapImages.set(interaction.user.id, screenshot.url);
    console.log(`📸 Image attached for user ${interaction.user.username}: ${screenshot.url}`);
  } else {
    // Clear any previous image for this user
    pendingRecapImages.delete(interaction.user.id);
  }
  
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
      
      // Get the image URL from temporary storage
      const imageUrl = pendingRecapImages.get(interaction.user.id) || null;
      
      // Clear the temporary storage
      pendingRecapImages.delete(interaction.user.id);
      
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
    // Only try to reply if the interaction hasn't been replied to or deferred
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: "Something went wrong processing your submission.", ephemeral: true });
      } catch (replyError) {
        console.error("Failed to send error reply:", replyError);
      }
    }
  }
}

// Store pending confirmations
const pendingConfirmations = new Map<string, { action: string; data: any; expires: number }>();

/**
 * Helper function to get the target user from mentions, excluding the bot itself
 * This solves the issue where the bot was being targeted in commands like "@array ban @user"
 */
function getTargetUser(message: Message): { user: any; index: number } | null {
  const users = Array.from(message.mentions.users.values());
  
  // Filter out the bot from mentions
  const nonBotUsers = users.filter((user: any) => user.id !== client.user!.id);
  
  // If there's a non-bot user mentioned, return the first one
  if (nonBotUsers.length > 0) {
    return { user: nonBotUsers[0], index: users.indexOf(nonBotUsers[0]) };
  }
  
  // If only the bot was mentioned, check if the command is for the bot itself
  // e.g., "@array give yourself the role X"
  if (users.length > 0 && users[0].id === client.user!.id) {
    const lowerMessage = message.content.toLowerCase();
    // Check for self-referential keywords
    if (/(?:yourself|you|te|ti mismo|a ti)/i.test(lowerMessage)) {
      return { user: client.user, index: 0 };
    }
  }
  
  return null;
}

/**
 * Handle general commands that any user can execute
 * These include informational commands like getting avatars, user info, etc.
 */
async function handleGeneralCommand(message: Message, userMessage: string): Promise<boolean> {
  const lowerMessage = userMessage.toLowerCase();
  
  // GET AVATAR - Show user's avatar (supports mentions)
  if (/(?:avatar|pfp|profile picture|foto de perfil|muestra.*avatar|show.*avatar)/i.test(lowerMessage)) {
    const targetResult = getTargetUser(message);
    const targetUser = targetResult?.user || message.author;
    try {
      const avatarURL = targetUser.displayAvatarURL({ size: 2048, extension: 'png' });
      await message.reply(`${targetUser.username}'s avatar: ${avatarURL}`);
      return true;
    } catch (error) {
      console.error("Error getting avatar:", error);
      await message.reply(`❌ Could not get avatar.`);
      return true;
    }
  }
  
  // GET USER INFO - Show user information (supports mentions)
  if (/(?:user|usuario).*(?:info|information|informacion|datos)/i.test(lowerMessage)) {
    const targetResult = getTargetUser(message);
    const targetUser = targetResult?.user || message.author;
    try {
      const member = message.guild ? await message.guild.members.fetch(targetUser.id) : null;
      const info = [
        `**User:** ${targetUser.username}`,
        `**ID:** ${targetUser.id}`,
        `**Account Created:** ${targetUser.createdAt.toDateString()}`,
      ];
      if (member) {
        info.push(`**Joined Server:** ${member.joinedAt?.toDateString()}`);
        info.push(`**Roles:** ${member.roles.cache.map(r => r.name).filter(n => n !== '@everyone').join(', ') || 'None'}`);
      }
      await message.reply(info.join('\n'));
      return true;
    } catch (error) {
      console.error("Error getting user info:", error);
      await message.reply(`❌ Could not get user info.`);
      return true;
    }
  }
  
  // SERVER INFO - Show server information
  if (message.guild && /(?:server|servidor).*(?:info|information|informacion|datos)/i.test(lowerMessage)) {
    try {
      const guild = message.guild;
      const info = [
        `**Server Name:** ${guild.name}`,
        `**Server ID:** ${guild.id}`,
        `**Members:** ${guild.memberCount}`,
        `**Created:** ${guild.createdAt.toDateString()}`,
        `**Owner:** <@${guild.ownerId}>`,
      ];
      await message.reply(info.join('\n'));
      return true;
    } catch (error) {
      console.error("Error getting server info:", error);
      await message.reply(`❌ Could not get server info.`);
      return true;
    }
  }
  
  return false; // Command not handled
}

// Timeout bochornoso responses for non-owners trying admin commands
const bochornosoResponses = [
  "Nah you don't have perms for that",
  "Only rejected can do that",
  "Nice try but no",
  "You wish lol",
  "Not happening",
  "That's a no from me",
  "Nope, admin only",
  "Yeah no",
];

async function handleAdminCommand(message: Message, userMessage: string): Promise<boolean> {
  const lowerMessage = userMessage.toLowerCase();
  const isOwner = ADMIN_USER_IDS.includes(message.author.id);
  
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
  
  if (!isOwner && message.guild) {
    const adminActions = [
      'delete', 'clear', 'remove', 'borrar', 'eliminar', 'purge', 'clean', 'wipe',
      'ban', 'kick', 'timeout', 'mute', 'silenciar',
      'crea', 'create', 'make', 'add',
      'cambiar', 'change', 'set', 'rename'
    ];
    
    const hasAdminIntent = adminActions.some(action => lowerMessage.includes(action));
    const hasModTarget = /canal|channel|rol|role|user|usuario|member|miembro/i.test(lowerMessage);
    
    if (hasAdminIntent && hasModTarget) {
      try {
        const member = await message.guild.members.fetch(message.author.id);
        await member.timeout(60000, `Attempted admin command without permission`);
        
        const response = bochornosoResponses[Math.floor(Math.random() * bochornosoResponses.length)];
        await message.reply(response);
        
        console.log(`⏱️ Timed out ${message.author.username} for attempting admin command`);
        return true;
      } catch (error) {
        console.error("Error timing out user:", error);
      }
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
          messagesToDelete = messagesToDelete.filter((msg: any) => msg.author.bot);
          if (numberMatch) {
            messagesToDelete = messagesToDelete.slice(0, deleteAmount);
          }
        }
        
        // Check if filtering by specific user
        else if (message.mentions.users.size > 0) {
          const targetResult = getTargetUser(message);
          const mentionedUser = targetResult?.user;
          console.log(`   → Filtering messages from ${mentionedUser?.username}...`);
          messagesToDelete = messagesToDelete.filter((msg: any) => msg.author.id === mentionedUser?.id);
          if (numberMatch) {
            messagesToDelete = messagesToDelete.slice(0, deleteAmount);
          }
        }
        
        // Check if filtering messages from the person who sent the command
        else if (/(?:my|mis|i'?ve sent|he enviado)/i.test(lowerMessage)) {
          console.log(`   → Filtering messages from ${message.author.username}...`);
          messagesToDelete = messagesToDelete.filter((msg: any) => msg.author.id === message.author.id);
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
    if (mentionedUser && message.guild) {
      try {
        const targetMember = await message.guild.members.fetch(mentionedUser.id);
        const botMember = await message.guild.members.fetchMe();
        const executorMember = await message.guild.members.fetch(message.author.id);
        
        // Check if target is the server owner
        if (targetMember.id === message.guild.ownerId) {
          await message.reply(`❌ Cannot ban the server owner.`);
          return true;
        }
        
        // Check if bot can ban this user (role hierarchy)
        if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
          await message.reply(`❌ I cannot ban **${mentionedUser.username}** because their highest role is equal to or higher than mine.\n\n**My highest role:** ${botMember.roles.highest.name} (position ${botMember.roles.highest.position})\n**Their highest role:** ${targetMember.roles.highest.name} (position ${targetMember.roles.highest.position})\n\nMove my role higher in Server Settings → Roles to fix this.`);
          return true;
        }
        
        // Check if executor can ban this user (role hierarchy)
        if (targetMember.roles.highest.position >= executorMember.roles.highest.position && message.author.id !== message.guild.ownerId) {
          await message.reply(`❌ You cannot ban **${mentionedUser.username}** because their role is equal to or higher than yours.`);
          return true;
        }
        
        // Check if bot has BAN_MEMBERS permission
        if (!botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          await message.reply(`❌ I don't have the **Ban Members** permission. Please enable it in my role settings.`);
          return true;
        }
        
        await targetMember.ban({ reason: `Banned by ${message.author.username} via bot command` });
        await message.reply(`✅ Banned **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error banning user:", error);
        await message.reply(`❌ Failed to ban user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return true;
      }
    }
  }
  
  // 7. KICK USER
  if (/kick/i.test(lowerMessage)) {
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
    if (mentionedUser && message.guild) {
      try {
        const targetMember = await message.guild.members.fetch(mentionedUser.id);
        const botMember = await message.guild.members.fetchMe();
        const executorMember = await message.guild.members.fetch(message.author.id);
        
        // Check if target is the server owner
        if (targetMember.id === message.guild.ownerId) {
          await message.reply(`❌ Cannot kick the server owner.`);
          return true;
        }
        
        // Check if bot can kick this user (role hierarchy)
        if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
          await message.reply(`❌ I cannot kick **${mentionedUser.username}** because their highest role is equal to or higher than mine.\n\n**My highest role:** ${botMember.roles.highest.name} (position ${botMember.roles.highest.position})\n**Their highest role:** ${targetMember.roles.highest.name} (position ${targetMember.roles.highest.position})\n\nMove my role higher in Server Settings → Roles to fix this.`);
          return true;
        }
        
        // Check if executor can kick this user (role hierarchy)
        if (targetMember.roles.highest.position >= executorMember.roles.highest.position && message.author.id !== message.guild.ownerId) {
          await message.reply(`❌ You cannot kick **${mentionedUser.username}** because their role is equal to or higher than yours.`);
          return true;
        }
        
        // Check if bot has KICK_MEMBERS permission
        if (!botMember.permissions.has(PermissionsBitField.Flags.KickMembers)) {
          await message.reply(`❌ I don't have the **Kick Members** permission. Please enable it in my role settings.`);
          return true;
        }
        
        await targetMember.kick(`Kicked by ${message.author.username} via bot command`);
        await message.reply(`✅ Kicked **${mentionedUser.username}**`);
        return true;
      } catch (error) {
        console.error("Error kicking user:", error);
        await message.reply(`❌ Failed to kick user: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
        const targetMember = await message.guild.members.fetch(mentionedUser.id);
        const botMember = await message.guild.members.fetchMe();
        const executorMember = await message.guild.members.fetch(message.author.id);
        
        // Check if target is the server owner
        if (targetMember.id === message.guild.ownerId) {
          await message.reply(`❌ Cannot timeout the server owner.`);
          return true;
        }
        
        // Check if bot can timeout this user (role hierarchy)
        if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
          await message.reply(`❌ I cannot timeout **${mentionedUser.username}** because their highest role is equal to or higher than mine.\n\n**My highest role:** ${botMember.roles.highest.name} (position ${botMember.roles.highest.position})\n**Their highest role:** ${targetMember.roles.highest.name} (position ${targetMember.roles.highest.position})\n\nMove my role higher in Server Settings → Roles to fix this.`);
          return true;
        }
        
        // Check if executor can timeout this user (role hierarchy)
        if (targetMember.roles.highest.position >= executorMember.roles.highest.position && message.author.id !== message.guild.ownerId) {
          await message.reply(`❌ You cannot timeout **${mentionedUser.username}** because their role is equal to or higher than yours.`);
          return true;
        }
        
        // Check if bot has MODERATE_MEMBERS permission
        if (!botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
          await message.reply(`❌ I don't have the **Moderate Members** (timeout) permission. Please enable it in my role settings.`);
          return true;
        }
        
        await targetMember.timeout(duration, `Timed out by ${message.author.username}`);
        await message.reply(`✅ **${mentionedUser.username}** timed out for ${Math.floor(duration/60000)} minutes`);
        return true;
      } catch (error) {
        console.error("Error timing out user:", error);
        await message.reply(`❌ Failed to timeout user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return true;
      }
    }
  }

  
  // 10. UNTIMEOUT USER
  if (/(?:untimeout|unmute|quitar (?:mute|timeout|silencio)|desmutear)/i.test(lowerMessage) && !/ canal| channel| voice| voz/i.test(lowerMessage)) {
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    
    const targetResult = getTargetUser(message);
    const userMatch = targetResult?.user;
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
  
  // 43. MOVE USER TO VOICE CHANNEL
  if (/(?:move|mover).*(?:to|a).*(?:voice|voz)/i.test(lowerMessage)) {
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
    const targetResult = getTargetUser(message);
    const mentionedUser = targetResult?.user;
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
      content: `✅ Daily bible verses will be sent to <#${channel.id}> at midnight (00:00 New York time / ET).`,
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

// Handle new member joins - auto assign role and send DM
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    console.log(`👤 New member joined: ${member.user.username} in ${member.guild.name}`);
    
    // Get server settings
    const settings = await storage.getServerSettings(member.guild.id);
    if (!settings || !settings.welcomeRoleId) {
      console.log("⚠️ No welcome role configured for this server");
      return;
    }

    // Check if this member has been welcomed before
    const hasBeenWelcomed = await storage.hasBeenWelcomed(member.guild.id, member.user.id);
    if (hasBeenWelcomed) {
      console.log(`✅ Member ${member.user.username} was already welcomed before, skipping`);
      return;
    }

    // Assign the welcome role
    try {
      await member.roles.add(settings.welcomeRoleId);
      console.log(`✅ Assigned role to ${member.user.username}`);
    } catch (roleError) {
      console.error("❌ Failed to assign role:", roleError);
    }

    // Send welcome DM
    const welcomeMessage = settings.welcomeMessage || "time to escape right?";
    try {
      await member.user.send(welcomeMessage);
      console.log(`✅ Sent DM to ${member.user.username}`);
    } catch (dmError) {
      console.error("❌ Failed to send DM (user may have DMs disabled):", dmError);
    }

    // Mark as welcomed
    await storage.addWelcomedMember({
      guildId: member.guild.id,
      userId: member.user.id,
      username: member.user.username,
    });

    console.log(`✅ Successfully welcomed ${member.user.username}`);
  } catch (error) {
    console.error("❌ Error handling new member join:", error);
  }
});

// Handle member leaving - remove from welcomed list so they get welcomed again if they rejoin
client.on(Events.GuildMemberRemove, async (member) => {
  try {
    console.log(`👋 Member left: ${member.user.username} from ${member.guild.name}`);
    await storage.deleteWelcomedMember(member.guild.id, member.user.id);
    console.log(`✅ Removed ${member.user.username} from welcomed list`);
  } catch (error) {
    console.error("❌ Error handling member leave:", error);
  }
});

// Fetch verse of the day from NET Bible API (no API key required, very reliable)
async function getDailyBibleVerse() {
  try {
    // NET Bible API has a built-in "verse of the day" endpoint
    const response = await fetch('https://labs.bible.org/api/?passage=votd&type=json');
    
    if (!response.ok) {
      throw new Error(`Bible API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // NET Bible API returns an array with one verse for VOTD
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response from Bible API');
    }
    
    const verse = data[0];
    
    return {
      reference: `${verse.bookname} ${verse.chapter}:${verse.verse}`,
      text: verse.text.trim(),
      verseNumber: verse.verse.toString(),
      translation: "NET Bible"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error fetching Bible verse:", errorMessage);
    
    // Fallback to random verse if VOTD fails
    try {
      console.log("⚠️ Trying fallback random verse API...");
      const fallbackResponse = await fetch('https://labs.bible.org/api/?passage=random&type=json');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && Array.isArray(fallbackData) && fallbackData.length > 0) {
          const verse = fallbackData[0];
          return {
            reference: `${verse.bookname} ${verse.chapter}:${verse.verse}`,
            text: verse.text.trim(),
            verseNumber: verse.verse.toString(),
            translation: "NET Bible"
          };
        }
      }
    } catch (fallbackError) {
      console.error("❌ Fallback API also failed:", fallbackError);
    }
    
    throw new Error("Bible API unavailable");
  }
}

// List of motivational keywords (for traders)
const motivationalKeywords = [
  "wisdom", "strength", "courage", "faith", "trust", "patience",
  "endurance", "persevere", "perseverance", "confidence", 
  "guidance", "hope", "peace"
];

// Function to get the daily motivational verse
async function getMotivationalBibleVerse() {
  try {
    // Use the NET Bible API's verse of the day - it's already curated and motivational
    const verse = await getDailyBibleVerse();

    if (!verse || !verse.text) {
      console.error("❌ Could not get verse from primary API");
      return null;
    }

    return verse;

  } catch (error) {
    console.error("❌ Error fetching motivational verse:", error);
    return null;
  }
}

// Sends the verse to all guilds
async function sendDailyBibleVerse() {
  try {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const today = nyTime.toISOString().split('T')[0];

    for (const [guildId, guild] of client.guilds.cache) {
      const settings = await storage.getServerSettings(guildId);
      if (!settings || !settings.bibleChannelId) continue;

      if (settings.lastBibleSent) {
        const lastSentNY = new Date(
          settings.lastBibleSent.toLocaleString("en-US", { timeZone: "America/New_York" })
        );
        if (lastSentNY.toISOString().split('T')[0] === today) continue;
      }

      const channel = await client.channels.fetch(settings.bibleChannelId).catch(() => null);
      if (!channel || !channel.isTextBased() || !('send' in channel)) {
        console.log(`⚠️ Invalid Bible channel for ${guild.name}`);
        continue;
      }

      const verse = await getMotivationalBibleVerse();
      if (!verse) {
        console.log("❌ Could not get a valid motivational verse");
        continue;
      }

      // Create the embed
      const embed = new EmbedBuilder()
        .setColor(0x00b0f4)
        .setTitle("📖 Daily Scripture")
        .setDescription(`**${verse.reference}**`)
        .addFields(
          { name: "📜 Verse", value: verse.text, inline: false }
        )
        .setFooter({ text: "array bible" })
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      await storage.updateServerSettings(guildId, { lastBibleSent: now });

      console.log(`✅ Sent daily Bible verse to ${guild.name}`);
    }
  } catch (error) {
    console.error("❌ Error sending daily Bible verse:", error);
  }
}

// Interval check every 5 minutes
setInterval(async () => {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const nyHour = nyTime.getHours();
  const nyMinute = nyTime.getMinutes();
  const today = nyTime.toISOString().split('T')[0];

  if (nyHour === 0 && nyMinute < 5) {
    await sendDailyBibleVerse();
  } else {
    let needsSending = false;

    for (const [guildId, guild] of client.guilds.cache) {
      const settings = await storage.getServerSettings(guildId);
      if (!settings || !settings.bibleChannelId) continue;

      if (!settings.lastBibleSent) {
        needsSending = true;
        break;
      }

      const lastSentNY = new Date(
        settings.lastBibleSent.toLocaleString("en-US", { timeZone: "America/New_York" })
      );
      if (lastSentNY.toISOString().split('T')[0] !== today) {
        needsSending = true;
        break;
      }
    }

    if (needsSending) await sendDailyBibleVerse();
  }
}, 300000);

// Store last sent news IDs to avoid duplicates
const sentNewsIds = new Set<string>();

// Forex News Feed using ForexFactory API (using native fetch for ESM compatibility)
async function fetchForexNews(): Promise<any[]> {
  try {
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
    
    if (!response.ok) {
      throw new Error(`Forex API responded with status: ${response.status}`);
    }
    
    const newsData = await response.json();
    return newsData;
  } catch (error) {
    // Ensure error is always an Error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching Forex news:", errorMessage);
    throw new Error("Forex API unavailable");
  }
}

async function sendTradingNews() {
  try {
    for (const [guildId, guild] of client.guilds.cache) {
      const settings = await storage.getServerSettings(guildId);
      if (!settings || !settings.newsChannelId) continue;

      const channel = await client.channels.fetch(settings.newsChannelId).catch(() => null);
      if (!channel || !channel.isTextBased() || !('send' in channel)) continue;

      const newsData = await fetchForexNews();
      console.log(`📊 Fetched ${newsData.length} forex news items for ${guild.name}`);
      
      const now = new Date();
      const nowTime = now.getTime();
      
      const recentNews = newsData.filter((item: any) => {
        const newsTime = new Date(item.date).getTime();
        const timeDiff = nowTime - newsTime;
        const newsId = `${item.date}_${item.title}`;
        
        return timeDiff >= 0 && timeDiff <= 900000 && !sentNewsIds.has(newsId);
      });

      console.log(`🔔 Found ${recentNews.length} new forex news items to send`);

      for (const newsItem of recentNews) {
        const newsId = `${newsItem.date}_${newsItem.title}`;
        
        let color = 0x6b7280;
        if (newsItem.impact === 'High') color = 0xef4444;
        else if (newsItem.impact === 'Medium') color = 0xf59e0b;
        
        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`📰 ${newsItem.title}`)
          .setDescription(newsItem.country || 'Global')
          .addFields(
            { name: '🕐 Time', value: new Date(newsItem.date).toLocaleString(), inline: true },
            { name: '⚡ Impact', value: newsItem.impact || 'N/A', inline: true },
            { name: '📊 Forecast', value: newsItem.forecast || 'N/A', inline: true },
            { name: '📈 Previous', value: newsItem.previous || 'N/A', inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'Array Forex News Feed' });

        try {
          await channel.send({ embeds: [embed] });
          console.log(`✅ Sent forex news: ${newsItem.title}`);
          sentNewsIds.add(newsId);
        } catch (sendError) {
          console.error(`❌ Error sending news embed:`, sendError);
        }
        
        if (sentNewsIds.size > 1000) {
          const idsArray = Array.from(sentNewsIds);
          idsArray.slice(0, 500).forEach(id => sentNewsIds.delete(id));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (recentNews.length === 0) {
        console.log(`ℹ️ No new forex news to send for ${guild.name}`);
      }
    }
  } catch (error) {
    console.error("❌ Error fetching forex news:", error);
  }
}

// Schedule trading news every 5 minutes (same as forex example)
setInterval(async () => {
  await sendTradingNews();
}, 300000); // Every 5 minutes

// NEW COMMAND HANDLERS

async function handleSetupWelcomeCommand(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    const role = interaction.options.getRole("role", true);
    const message = interaction.options.getString("message") || "time to escape right?";

    await storage.updateServerSettings(interaction.guild.id, {
      welcomeRoleId: role.id,
      welcomeMessage: message,
    });

    await interaction.reply({
      content: `✅ Welcome system configured!\n**Role:** ${role.name}\n**DM Message:** ${message}\n\nNew members will automatically receive this role and DM when they join the server.`,
      ephemeral: false,
    });
  } catch (error) {
    console.error("Error in setupwelcome command:", error);
    await interaction.reply({ content: "❌ Failed to set up welcome system.", ephemeral: true });
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

async function handleCodeCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Immediately acknowledge the interaction to prevent timeout
    await interaction.deferReply({ ephemeral: true });

    // Check if user already has a code - if so, delete it
    const existingUserCode = await storage.getAccessCodeByUserId(interaction.user.id);
    if (existingUserCode) {
      await storage.deleteAccessCodeByUserId(interaction.user.id);
      console.log(`Deleted old code for user ${interaction.user.username}`);
    }

    // Generate unique 6-digit code in XXX-XXX format
    const generateUniqueCode = () => {
      const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const part2 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${part1}-${part2}`;
    };

    let code = generateUniqueCode();
    
    // Ensure code is unique
    let existingCode = await storage.getAccessCodeByCode(code);
    while (existingCode) {
      code = generateUniqueCode();
      existingCode = await storage.getAccessCodeByCode(code);
    }

    // Get user avatar URL
    const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });

    // Get user roles if in a guild and check for premium role
    let userRoles: string[] = [];
    let hasRequiredRole = false;
    const PREMIUM_ROLE_ID = '1433090678073852107'; // "sighted" role
    
    if (interaction.guild && interaction.member) {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      userRoles = member.roles.cache.map(role => role.id);
      
      // Check if user has the premium role "sighted"
      hasRequiredRole = userRoles.includes(PREMIUM_ROLE_ID);
      
      console.log(`User ${interaction.user.username} has roles:`, userRoles);
      console.log(`User has premium role (${PREMIUM_ROLE_ID}): ${hasRequiredRole}`);
      console.log(`Role IDs as strings:`, userRoles.map(r => `"${r}"`).join(', '));
    }

    // Set expiration to a very far future date (code is persistent)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10 years

    // Save code to database
    await storage.createAccessCode({
      code,
      userId: interaction.user.id,
      username: interaction.user.username,
      avatarUrl,
      roles: userRoles,
      hasRequiredRole,
      expiresAt,
    });

    // Send DM to user with the code and profile link
    let dmSent = false;
    try {
      // Construct profile URL
      const baseUrl = process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5000';
      const profileUrl = `https://array-9mnn.onrender.com/p/${interaction.user.username.toLowerCase()}`;
      
      const dmEmbed = new EmbedBuilder()
        .setColor(0x2B5BBA)
        .setTitle("**Here is your code.**")
        .setDescription(`\nGlobal Access Code: ||${code}||\n\n🔗 **Sharing:** ${profileUrl}`)
        .setFooter({ text: "You can reset your code with /code" })
        .setTimestamp();

      await interaction.user.send({ embeds: [dmEmbed] });
      dmSent = true;
    } catch (dmError) {
      console.log(`Could not send DM to ${interaction.user.username}:`, dmError);
    }

    // Edit the deferred reply with the result
    if (dmSent) {
      await interaction.editReply({ 
        content: "✅ I've sent your access code to your DMs. Check your messages!"
      });
    } else {
      await interaction.editReply({ 
        content: `✅ Your access code: ||${code}||\n⚠️ I couldn't DM you, so here's your code. Use /code again to generate a new one.`
      });
    }

    console.log(`Generated persistent code ${code} for user ${interaction.user.username} (${interaction.user.id})`);
  } catch (error) {
    console.error("Error generating access code:", error);
    // Try to edit the deferred reply, or reply if it hasn't been deferred yet
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: "❌ Failed to generate access code. Please try again." });
      } else {
        await interaction.reply({ content: "❌ Failed to generate access code. Please try again.", ephemeral: true });
      }
    } catch (replyError) {
      console.error("Failed to send error message:", replyError);
    }
  }
}

// Handle /testapis command - Admin only
async function handleTestApisCommand(interaction: ChatInputCommandInteraction) {
  try {
    const OWNER_ID = "404315406111604747";
    
    // Only allow the bot owner to use this command
    if (interaction.user.id !== OWNER_ID) {
      await interaction.reply({ 
        content: "❌ This command is only available to the bot owner.", 
        ephemeral: true 
      });
      return;
    }

    // Defer reply since this will take time
    await interaction.deferReply({ ephemeral: true });

    // Test Bible API
    let bibleTestResult = "✅ Success";
    let bibleVerse: any = null;
    try {
      bibleVerse = await getDailyBibleVerse();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Bible API test failed:", errorMessage);
      bibleTestResult = `❌ Failed`;
    }

    // Test Forex API
    let forexTestResult = "✅ Success";
    let forexNewsCount = 0;
    try {
      const forexData = await fetchForexNews();
      forexNewsCount = forexData.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Forex API test failed:", errorMessage);
      forexTestResult = `❌ Failed`;
    }

    // Collect bot statistics
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const totalChannels = client.channels.cache.size;
    
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    const ping = client.ws.ping;

    // Count configured servers
    let configuredBible = 0;
    let configuredNews = 0;
    let configuredVC = 0;
    let configuredWelcome = 0;
    
    for (const [guildId, guild] of client.guilds.cache) {
      const settings = await storage.getServerSettings(guildId);
      if (settings?.bibleChannelId) configuredBible++;
      if (settings?.newsChannelId) configuredNews++;
      if (settings?.vcTriggerChannelId) configuredVC++;
      if (settings?.welcomeRoleId) configuredWelcome++;
    }

    // Get storage stats
    const allAccessRequests = await storage.getAccessRequests();
    const allAccessCodes = await storage.getAllAccessCodes();
    const allKnowledge = await storage.getAllKnowledge();
    const allLearnedFacts = await storage.getAllLearnedFacts();

    // Create comprehensive stats embed
    const statsEmbed = new EmbedBuilder()
      .setColor(0x2B5BBA)
      .setTitle("🤖 Bot Statistics & Health Report")
      .setDescription("Complete system status and API test results")
      .addFields(
        { name: "🧪 API Test Results", value: `**Bible API:** ${bibleTestResult}\n**Forex API:** ${forexTestResult}${forexNewsCount > 0 ? ` (${forexNewsCount} items)` : ""}`, inline: false },
        { name: "🌐 Server Stats", value: `Servers: ${totalGuilds}\nTotal Users: ${totalUsers}\nChannels: ${totalChannels}`, inline: true },
        { name: "⚙️ System", value: `Uptime: ${uptimeHours}h ${uptimeMinutes}m\nMemory: ${memoryMB} MB\nPing: ${ping}ms`, inline: true },
        { name: "📊 Configurations", value: `Bible: ${configuredBible}\nNews: ${configuredNews}\nVC: ${configuredVC}\nWelcome: ${configuredWelcome}`, inline: true },
        { name: "📈 Usage Stats", value: `Access Requests: ${allAccessRequests.length}\nAccess Codes: ${allAccessCodes.length}\nBot Knowledge: ${allKnowledge.length}\nLearned Facts: ${allLearnedFacts.length}`, inline: false },
        { name: "🔧 Node Version", value: process.version, inline: true },
        { name: "📅 Started", value: new Date(Date.now() - uptime * 1000).toLocaleString(), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Admin Command" });

    // If Bible test was successful, add sample verse
    if (bibleVerse) {
      const verseEmbed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle("📖 Sample Bible Verse")
        .setDescription(`**${bibleVerse.reference}** - ${bibleVerse.translation}\n\n${bibleVerse.text.substring(0, 1000)}${bibleVerse.text.length > 1000 ? '...' : ''}`)
        .setTimestamp();

      // Send to owner via DM
      try {
        await interaction.user.send({ embeds: [statsEmbed, verseEmbed] });
        await interaction.editReply({ content: "✅ API tests complete! Check your DMs for detailed statistics." });
      } catch (dmError) {
        // If DM fails, send in channel
        await interaction.editReply({ embeds: [statsEmbed, verseEmbed] });
      }
    } else {
      // Send just stats if Bible API failed
      try {
        await interaction.user.send({ embeds: [statsEmbed] });
        await interaction.editReply({ content: "⚠️ API tests complete with errors. Check your DMs for detailed statistics." });
      } catch (dmError) {
        await interaction.editReply({ embeds: [statsEmbed] });
      }
    }

    console.log(`✅ ${interaction.user.username} ran /testapis command`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in testapis command:", errorMessage);
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: "❌ Command failed. Please try again." });
      } else {
        await interaction.reply({ content: "❌ Command failed. Please try again.", ephemeral: true });
      }
    } catch (replyError) {
      const replyErrorMessage = replyError instanceof Error ? replyError.message : String(replyError);
      console.error("Failed to send error message:", replyErrorMessage);
    }
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
