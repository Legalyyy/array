# Discord Bot Role Hierarchy Fix - Error 50013 Resolution

## Problem
The bot was experiencing `Error 50013: Missing Permissions` when trying to execute moderation commands (kick, ban, timeout) even though both the user and bot had administrator permissions.

## Root Cause
Discord's permission system has two requirements for moderation:
1. **Permission bits** (e.g., KICK_MEMBERS, BAN_MEMBERS)
2. **Role hierarchy** - Bot's highest role must be positioned ABOVE the target user's highest role

The bot was checking permissions but NOT checking role hierarchy, causing the 50013 error when trying to moderate users with equal or higher roles.

## Solution Implemented

### 1. Enhanced Kick Command (`server/bot.ts` lines 1042-1084)
Added comprehensive checks:
- ✅ Verify target is not the server owner
- ✅ Check if bot's role is higher than target's role
- ✅ Check if executor's role is higher than target's role (unless executor is owner)
- ✅ Verify bot has KICK_MEMBERS permission
- ✅ Provide detailed error messages explaining exactly why moderation failed

### 2. Enhanced Ban Command (`server/bot.ts` lines 998-1040)
Added comprehensive checks:
- ✅ Verify target is not the server owner
- ✅ Check if bot's role is higher than target's role
- ✅ Check if executor's role is higher than target's role (unless executor is owner)
- ✅ Verify bot has BAN_MEMBERS permission
- ✅ Provide detailed error messages with role names and positions

### 3. Enhanced Timeout Command (`server/bot.ts` lines 1102-1154)
Added comprehensive checks:
- ✅ Verify target is not the server owner
- ✅ Check if bot's role is higher than target's role
- ✅ Check if executor's role is higher than target's role (unless executor is owner)
- ✅ Verify bot has MODERATE_MEMBERS permission
- ✅ Fixed mention parsing (changed from second user to first user)
- ✅ Provide detailed error messages

### 4. Enhanced AI Understanding (`server/gemini.ts` lines 229-262)
Updated the bot's system prompt to include comprehensive Discord knowledge:
- Role hierarchy mechanics and how position determines power
- Difference between permissions and hierarchy
- Common causes of moderation failures
- Practical solutions (moving bot role higher in settings)
- Detailed explanations for users when issues occur

## Example Error Messages

### Before Fix
```
❌ Failed to kick user.
```

### After Fix
```
❌ I cannot kick **username** because their highest role is equal to or higher than mine.

**My highest role:** Bot Role (position 5)
**Their highest role:** Admin (position 6)

Move my role higher in Server Settings → Roles to fix this.
```

## Technical Implementation

### Code Pattern Used
```typescript
const targetMember = await message.guild.members.fetch(mentionedUser.id);
const botMember = await message.guild.members.fetchMe();
const executorMember = await message.guild.members.fetch(message.author.id);

// Check server owner
if (targetMember.id === message.guild.ownerId) {
  await message.reply(`❌ Cannot kick the server owner.`);
  return true;
}

// Check bot hierarchy
if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
  await message.reply(`❌ I cannot kick **${mentionedUser.username}** because their highest role is equal to or higher than mine.\n\n**My highest role:** ${botMember.roles.highest.name} (position ${botMember.roles.highest.position})\n**Their highest role:** ${targetMember.roles.highest.name} (position ${targetMember.roles.highest.position})\n\nMove my role higher in Server Settings → Roles to fix this.`);
  return true;
}

// Check executor hierarchy
if (targetMember.roles.highest.position >= executorMember.roles.highest.position && message.author.id !== message.guild.ownerId) {
  await message.reply(`❌ You cannot kick **${mentionedUser.username}** because their role is equal to or higher than yours.`);
  return true;
}

// Check permissions
if (!botMember.permissions.has(PermissionsBitField.Flags.KickMembers)) {
  await message.reply(`❌ I don't have the **Kick Members** permission. Please enable it in my role settings.`);
  return true;
}
```

## Testing Recommendations
1. Test kicking/banning users with roles below bot's role → Should succeed
2. Test kicking/banning users with roles above bot's role → Should fail with detailed message
3. Test kicking/banning users with equal role to bot → Should fail with detailed message
4. Test kicking/banning server owner → Should fail immediately
5. Verify error messages show correct role names and positions

## How to Fix in Your Server

If you still get Error 50013 after this update, the most common cause is that the bot's role is not high enough in the role hierarchy:

1. **Go to Server Settings** → **Roles**
2. **Find your bot's role** (drag it if needed)
3. **Move it ABOVE** all the roles you want the bot to be able to moderate
4. **Save changes**

The bot will now be able to moderate any user whose highest role is below the bot's role in the list.

## Resolution
This fix addresses the root cause of Error 50013 by:
1. Preventing the bot from attempting impossible moderation actions
2. Providing clear, actionable error messages to users
3. Educating the AI about Discord's permission system
4. Respecting Discord's role hierarchy rules

The bot now properly validates all conditions before attempting moderation, eliminating the 50013 error.
