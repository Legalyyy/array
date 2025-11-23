import {
  Client,
  EmbedBuilder,
  Guild,
  GuildMember,
  Role,
  GuildChannel,
  User,
  Message,
  VoiceState,
  AuditLogEvent,
  PermissionOverwrites,
  TextChannel,
  Collection,
  GuildBan,
} from "discord.js";
import { storage } from "./storage";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export async function sendLog(guild: Guild, embed: EmbedBuilder): Promise<void> {
  try {
    const settings = await storage.getServerSettings(guild.id);
    if (!settings?.logsChannelId) return;

    const channel = await guild.channels.fetch(settings.logsChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error sending log:", error);
  }
}

// 1. Role Created
export async function logRoleCreate(role: Role): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("🎭 Role Created")
    .setDescription(`A new role has been created`)
    .addFields(
      { name: "Role", value: `${role.name} (${role.id})`, inline: true },
      { name: "Color", value: role.hexColor, inline: true },
      { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
      { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
      { name: "Position", value: role.position.toString(), inline: true }
    )
    .setTimestamp();

  await sendLog(role.guild, embed);
}

// 2. Role Deleted
export async function logRoleDelete(role: Role): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🎭 Role Deleted")
    .setDescription(`A role has been deleted`)
    .addFields(
      { name: "Role", value: `${role.name} (${role.id})`, inline: true },
      { name: "Color", value: role.hexColor, inline: true }
    )
    .setTimestamp();

  await sendLog(role.guild, embed);
}

// 3. Role Updated
export async function logRoleUpdate(oldRole: Role, newRole: Role): Promise<void> {
  const changes: string[] = [];
  
  if (oldRole.name !== newRole.name) {
    changes.push(`**Name:** ${oldRole.name} → ${newRole.name}`);
  }
  if (oldRole.hexColor !== newRole.hexColor) {
    changes.push(`**Color:** ${oldRole.hexColor} → ${newRole.hexColor}`);
  }
  if (oldRole.hoist !== newRole.hoist) {
    changes.push(`**Hoisted:** ${oldRole.hoist ? "Yes" : "No"} → ${newRole.hoist ? "Yes" : "No"}`);
  }
  if (oldRole.mentionable !== newRole.mentionable) {
    changes.push(`**Mentionable:** ${oldRole.mentionable ? "Yes" : "No"} → ${newRole.mentionable ? "Yes" : "No"}`);
  }
  if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
    changes.push(`**Permissions:** Changed`);
  }
  if (oldRole.position !== newRole.position) {
    changes.push(`**Position:** ${oldRole.position} → ${newRole.position}`);
  }

  if (changes.length === 0) return;

  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("🎭 Role Updated")
    .setDescription(`Role **${newRole.name}** has been modified`)
    .addFields({ name: "Changes", value: changes.join("\n") })
    .setTimestamp();

  await sendLog(newRole.guild, embed);
}

// 4. Role Added to Member
export async function logMemberRoleAdd(member: GuildMember, role: Role): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("👤 Role Added to Member")
    .addFields(
      { name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
      { name: "Role", value: role.name, inline: true }
    )
    .setTimestamp();

  await sendLog(member.guild, embed);
}

// 5. Role Removed from Member
export async function logMemberRoleRemove(member: GuildMember, role: Role): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("👤 Role Removed from Member")
    .addFields(
      { name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
      { name: "Role", value: role.name, inline: true }
    )
    .setTimestamp();

  await sendLog(member.guild, embed);
}

// 6. Channel Created
export async function logChannelCreate(channel: GuildChannel): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("📁 Channel Created")
    .addFields(
      { name: "Channel", value: `${channel.name} (${channel.id})`, inline: true },
      { name: "Type", value: channel.type.toString(), inline: true }
    )
    .setTimestamp();

  await sendLog(channel.guild, embed);
}

// 7. Channel Deleted
export async function logChannelDelete(channel: GuildChannel): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("📁 Channel Deleted")
    .addFields(
      { name: "Channel", value: `${channel.name} (${channel.id})`, inline: true },
      { name: "Type", value: channel.type.toString(), inline: true }
    )
    .setTimestamp();

  await sendLog(channel.guild, embed);
}

// 8. Channel Updated
export async function logChannelUpdate(oldChannel: GuildChannel, newChannel: GuildChannel): Promise<void> {
  const changes: string[] = [];
  
  if (oldChannel.name !== newChannel.name) {
    changes.push(`**Name:** ${oldChannel.name} → ${newChannel.name}`);
  }
  
  if ('topic' in oldChannel && 'topic' in newChannel && oldChannel.topic !== newChannel.topic) {
    changes.push(`**Topic:** ${oldChannel.topic || 'None'} → ${newChannel.topic || 'None'}`);
  }
  
  if ('rateLimitPerUser' in oldChannel && 'rateLimitPerUser' in newChannel && 
      oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
    changes.push(`**Slowmode:** ${oldChannel.rateLimitPerUser}s → ${newChannel.rateLimitPerUser}s`);
  }

  if ('nsfw' in oldChannel && 'nsfw' in newChannel && oldChannel.nsfw !== newChannel.nsfw) {
    changes.push(`**NSFW:** ${oldChannel.nsfw ? "Yes" : "No"} → ${newChannel.nsfw ? "Yes" : "No"}`);
  }

  if (changes.length === 0) return;

  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("📁 Channel Updated")
    .setDescription(`Channel **${newChannel.name}** has been modified`)
    .addFields({ name: "Changes", value: changes.join("\n") })
    .setTimestamp();

  await sendLog(newChannel.guild, embed);
}

// 9. Member Joined
export async function logMemberJoin(member: GuildMember): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("📥 Member Joined")
    .setDescription(`${member.user.tag} joined the server`)
    .addFields(
      { name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
      { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  await sendLog(member.guild, embed);
}

// 10. Member Left
export async function logMemberLeave(member: GuildMember): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("📤 Member Left")
    .setDescription(`${member.user.tag} left the server`)
    .addFields(
      { name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
      { name: "Roles", value: member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.name).join(", ") || "None", inline: false }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  await sendLog(member.guild, embed);
}

// 11. Member Banned
export async function logMemberBan(ban: GuildBan): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🔨 Member Banned")
    .addFields(
      { name: "User", value: `${ban.user.tag} (${ban.user.id})`, inline: true },
      { name: "Reason", value: ban.reason || "No reason provided", inline: false }
    )
    .setThumbnail(ban.user.displayAvatarURL())
    .setTimestamp();

  await sendLog(ban.guild, embed);
}

// 12. Member Unbanned
export async function logMemberUnban(ban: GuildBan): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("🔨 Member Unbanned")
    .addFields(
      { name: "User", value: `${ban.user.tag} (${ban.user.id})`, inline: true }
    )
    .setThumbnail(ban.user.displayAvatarURL())
    .setTimestamp();

  await sendLog(ban.guild, embed);
}

// 13. Member Kicked (detected through audit log)
export async function logMemberKick(member: GuildMember, executor: User | null, reason: string | null): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("👞 Member Kicked")
    .addFields(
      { name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
      { name: "Kicked By", value: executor ? executor.tag : "Unknown", inline: true },
      { name: "Reason", value: reason || "No reason provided", inline: false }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  await sendLog(member.guild, embed);
}

// 14. Member Timeout
export async function logMemberTimeout(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
  if (!newMember.isCommunicationDisabled()) return;
  
  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("⏱️ Member Timed Out")
    .addFields(
      { name: "User", value: `${newMember.user.tag} (${newMember.id})`, inline: true },
      { name: "Until", value: newMember.communicationDisabledUntil ? `<t:${Math.floor(newMember.communicationDisabledUntil.getTime() / 1000)}:F>` : "Unknown", inline: true }
    )
    .setThumbnail(newMember.user.displayAvatarURL())
    .setTimestamp();

  await sendLog(newMember.guild, embed);
}

// 15. Member Timeout Removed
export async function logMemberTimeoutRemove(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
  if (newMember.isCommunicationDisabled()) return;
  if (!oldMember.isCommunicationDisabled()) return;
  
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("⏱️ Member Timeout Removed")
    .addFields(
      { name: "User", value: `${newMember.user.tag} (${newMember.id})`, inline: true }
    )
    .setThumbnail(newMember.user.displayAvatarURL())
    .setTimestamp();

  await sendLog(newMember.guild, embed);
}

// 16. Voice Channel Join
export async function logVoiceJoin(oldState: VoiceState, newState: VoiceState): Promise<void> {
  if (!newState.channel || oldState.channelId === newState.channelId) return;
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("🔊 Voice Channel Join")
    .addFields(
      { name: "User", value: `${newState.member?.user.tag} (${newState.member?.id})`, inline: true },
      { name: "Channel", value: newState.channel.name, inline: true }
    )
    .setTimestamp();

  await sendLog(newState.guild, embed);
}

// 17. Voice Channel Leave
export async function logVoiceLeave(oldState: VoiceState, newState: VoiceState): Promise<void> {
  if (!oldState.channel || oldState.channelId === newState.channelId) return;
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("🔇 Voice Channel Leave")
    .addFields(
      { name: "User", value: `${oldState.member?.user.tag} (${oldState.member?.id})`, inline: true },
      { name: "Channel", value: oldState.channel.name, inline: true }
    )
    .setTimestamp();

  await sendLog(oldState.guild, embed);
}

// 18. Message Deleted with Content
export async function logMessageDelete(message: Message): Promise<void> {
  if (message.author.bot) return;
  
  const hasUrl = URL_REGEX.test(message.content);
  
  const embed = new EmbedBuilder()
    .setColor(hasUrl ? 0xED4245 : 0xFEE75C)
    .setTitle(hasUrl ? "🚨 URGENT: Message with Link Deleted" : "🗑️ Message Deleted")
    .addFields(
      { name: "Author", value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: "Channel", value: `${message.channel}`, inline: true },
      { name: "Content", value: message.content.substring(0, 1024) || "*No text content*", inline: false }
    )
    .setTimestamp();

  if (message.attachments.size > 0) {
    embed.addFields({
      name: "Attachments",
      value: message.attachments.map(a => `[${a.name}](${a.url})`).join("\n").substring(0, 1024)
    });
  }

  if (message.guild) {
    await sendLog(message.guild, embed);
  }
}

// 19. Message Edited
export async function logMessageEdit(oldMessage: Message, newMessage: Message): Promise<void> {
  if (oldMessage.author.bot) return;
  if (oldMessage.content === newMessage.content) return;
  
  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("✏️ Message Edited")
    .addFields(
      { name: "Author", value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
      { name: "Channel", value: `${newMessage.channel}`, inline: true },
      { name: "Before", value: oldMessage.content.substring(0, 1024) || "*No content*", inline: false },
      { name: "After", value: newMessage.content.substring(0, 1024) || "*No content*", inline: false },
      { name: "Jump to Message", value: `[Click here](${newMessage.url})`, inline: false }
    )
    .setTimestamp();

  if (newMessage.guild) {
    await sendLog(newMessage.guild, embed);
  }
}

// 20. Message with Link Sent (URGENT)
export async function logMessageWithLink(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!URL_REGEX.test(message.content)) return;
  
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🚨 URGENT: Link Detected in Message")
    .addFields(
      { name: "Author", value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: "Channel", value: `${message.channel}`, inline: true },
      { name: "Content", value: message.content.substring(0, 1024), inline: false },
      { name: "Jump to Message", value: `[Click here](${message.url})`, inline: false }
    )
    .setTimestamp();

  if (message.guild) {
    await sendLog(message.guild, embed);
  }
}

// 21. Server Name Change
export async function logGuildUpdate(oldGuild: Guild, newGuild: Guild): Promise<void> {
  const changes: string[] = [];
  
  if (oldGuild.name !== newGuild.name) {
    changes.push(`**Name:** ${oldGuild.name} → ${newGuild.name}`);
  }
  if (oldGuild.description !== newGuild.description) {
    changes.push(`**Description:** ${oldGuild.description || 'None'} → ${newGuild.description || 'None'}`);
  }
  if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
    changes.push(`**Vanity URL:** ${oldGuild.vanityURLCode || 'None'} → ${newGuild.vanityURLCode || 'None'}`);
  }

  if (changes.length === 0) return;

  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("🏰 Server Updated")
    .addFields({ name: "Changes", value: changes.join("\n") })
    .setTimestamp();

  await sendLog(newGuild, embed);
}

// 22. Emoji Created
export async function logEmojiCreate(emoji: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("😀 Emoji Created")
    .addFields(
      { name: "Emoji", value: `${emoji.name} (${emoji.id})`, inline: true },
      { name: "Animated", value: emoji.animated ? "Yes" : "No", inline: true }
    )
    .setThumbnail(emoji.url)
    .setTimestamp();

  await sendLog(emoji.guild, embed);
}

// 23. Emoji Deleted
export async function logEmojiDelete(emoji: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("😀 Emoji Deleted")
    .addFields(
      { name: "Emoji", value: `${emoji.name} (${emoji.id})`, inline: true }
    )
    .setTimestamp();

  await sendLog(emoji.guild, embed);
}

// 24. Sticker Created
export async function logStickerCreate(sticker: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("🎨 Sticker Created")
    .addFields(
      { name: "Sticker", value: `${sticker.name} (${sticker.id})`, inline: true },
      { name: "Description", value: sticker.description || "No description", inline: false }
    )
    .setTimestamp();

  await sendLog(sticker.guild, embed);
}

// 25. Sticker Deleted
export async function logStickerDelete(sticker: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🎨 Sticker Deleted")
    .addFields(
      { name: "Sticker", value: `${sticker.name} (${sticker.id})`, inline: true }
    )
    .setTimestamp();

  await sendLog(sticker.guild, embed);
}

// 26. Webhook Created
export async function logWebhookCreate(webhook: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("🔗 Webhook Created")
    .addFields(
      { name: "Name", value: webhook.name || "Unknown", inline: true },
      { name: "Channel", value: `<#${webhook.channelId}>`, inline: true }
    )
    .setTimestamp();

  if (webhook.guild) {
    await sendLog(webhook.guild, embed);
  }
}

// 27. Webhook Deleted
export async function logWebhookDelete(webhook: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🔗 Webhook Deleted")
    .addFields(
      { name: "Name", value: webhook.name || "Unknown", inline: true },
      { name: "Channel", value: `<#${webhook.channelId}>`, inline: true }
    )
    .setTimestamp();

  if (webhook.guild) {
    await sendLog(webhook.guild, embed);
  }
}

// 28. Member Nickname Changed
export async function logMemberNicknameChange(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
  if (oldMember.nickname === newMember.nickname) return;
  
  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("✏️ Nickname Changed")
    .addFields(
      { name: "User", value: `${newMember.user.tag} (${newMember.id})`, inline: true },
      { name: "Before", value: oldMember.nickname || oldMember.user.username, inline: true },
      { name: "After", value: newMember.nickname || newMember.user.username, inline: true }
    )
    .setTimestamp();

  await sendLog(newMember.guild, embed);
}

// 29. Invite Created
export async function logInviteCreate(invite: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("📨 Invite Created")
    .addFields(
      { name: "Code", value: invite.code, inline: true },
      { name: "Inviter", value: invite.inviter ? `${invite.inviter.tag}` : "Unknown", inline: true },
      { name: "Channel", value: `<#${invite.channelId}>`, inline: true },
      { name: "Max Uses", value: invite.maxUses ? invite.maxUses.toString() : "Unlimited", inline: true },
      { name: "Expires", value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : "Never", inline: true }
    )
    .setTimestamp();

  await sendLog(invite.guild, embed);
}

// 30. Invite Deleted
export async function logInviteDelete(invite: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("📨 Invite Deleted")
    .addFields(
      { name: "Code", value: invite.code, inline: true },
      { name: "Channel", value: `<#${invite.channelId}>`, inline: true }
    )
    .setTimestamp();

  await sendLog(invite.guild, embed);
}

// Additional logging functions for completeness

// 31. Thread Created
export async function logThreadCreate(thread: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("🧵 Thread Created")
    .addFields(
      { name: "Thread", value: `${thread.name} (${thread.id})`, inline: true },
      { name: "Parent Channel", value: `<#${thread.parentId}>`, inline: true }
    )
    .setTimestamp();

  await sendLog(thread.guild, embed);
}

// 32. Thread Deleted
export async function logThreadDelete(thread: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🧵 Thread Deleted")
    .addFields(
      { name: "Thread", value: `${thread.name} (${thread.id})`, inline: true },
      { name: "Parent Channel", value: `<#${thread.parentId}>`, inline: true }
    )
    .setTimestamp();

  await sendLog(thread.guild, embed);
}

// 33. Message Pinned
export async function logMessagePin(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("📌 Message Pinned")
    .addFields(
      { name: "Channel", value: `${message.channel}`, inline: true },
      { name: "Author", value: `${message.author.tag}`, inline: true },
      { name: "Content", value: message.content.substring(0, 1024) || "*No text content*", inline: false },
      { name: "Jump to Message", value: `[Click here](${message.url})`, inline: false }
    )
    .setTimestamp();

  if (message.guild) {
    await sendLog(message.guild, embed);
  }
}

// 34. Message Unpinned
export async function logMessageUnpin(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("📌 Message Unpinned")
    .addFields(
      { name: "Channel", value: `${message.channel}`, inline: true },
      { name: "Author", value: `${message.author.tag}`, inline: true },
      { name: "Content", value: message.content.substring(0, 1024) || "*No text content*", inline: false }
    )
    .setTimestamp();

  if (message.guild) {
    await sendLog(message.guild, embed);
  }
}

// 35. Stage Instance Created
export async function logStageInstanceCreate(stageInstance: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle("🎙️ Stage Started")
    .addFields(
      { name: "Topic", value: stageInstance.topic, inline: true },
      { name: "Channel", value: `<#${stageInstance.channelId}>`, inline: true }
    )
    .setTimestamp();

  await sendLog(stageInstance.guild, embed);
}

// 36. Stage Instance Deleted
export async function logStageInstanceDelete(stageInstance: any): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🎙️ Stage Ended")
    .addFields(
      { name: "Topic", value: stageInstance.topic, inline: true },
      { name: "Channel", value: `<#${stageInstance.channelId}>`, inline: true }
    )
    .setTimestamp();

  await sendLog(stageInstance.guild, embed);
}
