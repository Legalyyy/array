# Trading Discord Bot

## Overview

This is a Discord bot application designed for trading communities. The bot provides trade recap functionality, AI-powered conversational interactions using Google's Gemini API, and access request management. The application uses a PostgreSQL database via Neon serverless to store conversation history, trade recaps, access requests, and custom bot knowledge. The bot is built with Discord.js and includes various Discord integration features like slash commands and modals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture

**Framework**: Express.js server with Discord.js bot integration
- Express server provides health check endpoints and runs alongside the Discord bot
- Bot and server start concurrently from the same entry point (`server/index.ts`)
- Server runs on configurable PORT (defaults to 3000)

**Discord Bot Structure**:
- Uses Discord.js v14 with Gateway Intents for guilds, messages, and members
- Implements slash commands (`/help`, `/recap`, `/myrecaps`, `/recaps`)
- Uses modals for user input collection and embeds for formatted responses
- Event-driven architecture handling message creation, interactions, and member updates

**Storage Layer**:
- Interface-based storage design (`IStorage`) with `DatabaseStorage` implementation
- Separation of concerns: storage logic isolated from bot and application logic
- Supports operations for conversations, trade recaps, access requests, and bot knowledge

### Database Architecture

**ORM**: Drizzle ORM with PostgreSQL dialect
- Type-safe database queries with full TypeScript support
- Schema defined in shared directory for reusability
- Migration support via drizzle-kit

**Database Provider**: Neon Serverless PostgreSQL
- WebSocket-based connection pooling
- Connection string configured via `DATABASE_URL` environment variable

**Schema Design**:
1. **conversations** - Stores all user-bot interactions with Discord metadata (userId, username, channelId, guildId)
2. **tradeRecaps** - Records user trade summaries with P&L and notes
3. **accessRequests** - Manages server access workflow with status tracking (pending/approved/rejected)
4. **botKnowledge** - Key-value store for custom bot learnings and facts

All tables use serial primary keys and timestamp tracking for audit purposes.

### AI Integration

**Provider**: Google Gemini AI (via @google/genai)
- Conversational AI responses with context awareness
- System prompts designed for trading community personality (direct, casual, confident)
- Context building from conversation history and bot knowledge base
- API key configured via `GEMINI_API_KEY` environment variable

**Context Management**:
- Retrieves recent conversation history (up to 20 conversations, displays 10)
- Incorporates all bot knowledge entries into system context
- Maintains conversation continuity across Discord interactions

### Code Organization

**Modular Structure**:
- `/server` - Backend code (bot logic, database, API, AI integration)
- `/shared` - Shared TypeScript schema and types
- Root configuration files for TypeScript, Drizzle, and package management

**Path Aliases**: Uses `@shared/*` alias for importing shared schema across server code

**Build Process**:
- Development: tsx for TypeScript execution with hot reloading
- Production: Vite for frontend assets (if applicable) + esbuild for server bundling
- Server bundled as ESM format with external packages

### Authentication & Authorization

**Discord-based Authentication**:
- User identity managed through Discord user IDs and usernames
- Permission checks using Discord.js `PermissionsBitField`
- No separate authentication system - relies on Discord's identity management

**Access Control**:
- Access request workflow for gating server membership
- Status-based approval system stored in database
- Admin commands for managing access requests

## External Dependencies

### Third-Party Services

1. **Discord API** (discord.js v14)
   - Bot gateway connection and real-time event handling
   - Slash command registration and interaction handling
   - Required: `DISCORD_BOT_TOKEN` environment variable

2. **Google Gemini AI** (@google/genai)
   - Natural language generation for bot responses
   - Recommended model: gemini-2.5-flash or gemini-2.5-pro
   - Required: `GEMINI_API_KEY` environment variable

3. **Neon Serverless PostgreSQL** (@neondatabase/serverless)
   - Serverless PostgreSQL database hosting
   - WebSocket-based connection pooling
   - Required: `DATABASE_URL` environment variable

### UI Component Library

**Radix UI**: Comprehensive collection of unstyled, accessible React components
- Multiple primitive components for dialogs, dropdowns, menus, forms, etc.
- Used with class-variance-authority and clsx for styling flexibility
- Suggests a React frontend (though not visible in provided files)

### Data Management

1. **Drizzle ORM** (drizzle-orm)
   - Type-safe database queries and schema management
   - PostgreSQL dialect with Neon serverless adapter
   - Schema validation via drizzle-zod integration

2. **TanStack Query** (@tanstack/react-query)
   - Client-side data fetching and caching (for React frontend)

### Utilities

- **date-fns**: Date manipulation and formatting
- **zod**: Schema validation integrated with Drizzle
- **ws**: WebSocket library for Neon database connections

### Development Dependencies

- **TypeScript**: Strict type checking enabled
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production server code
- **Vite**: Build tool for frontend assets