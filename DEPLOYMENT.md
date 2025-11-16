# HolaCentro Trading Journal - Deployment Guide

This guide will help you deploy HolaCentro Trading Journal to production (Render or other hosting platforms).

## Prerequisites

1. **Node.js** 18 or later
2. **PostgreSQL** database (can use Render's PostgreSQL or external like Neon)
3. **Discord Bot** created and configured
4. **Environment Variables** ready

## Environment Variables

You'll need to set these environment variables:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:port/database
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id
SESSION_SECRET=random_secure_string_here

# Optional (for AI features)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

## Local Development Setup

### Quick Start

Run the initialization script:

```bash
./init.sh
```

This script will:
1. Check Node.js installation
2. Verify environment variables
3. Install dependencies
4. Generate database schema
5. Push schema to database
6. Test database connection

### Manual Setup

If you prefer manual setup:

```bash
# 1. Install dependencies
npm install

# 2. Generate database schema
npm run db:generate

# 3. Push schema to database
npm run db:push

# 4. Start the application
npm run dev
```

## Deploying to Render

### Step 1: Create a Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: holacentro-trading-journal
   - **Environment**: Node
   - **Build Command**: `npm install && npm run db:push`
   - **Start Command**: `npm run dev`
   - **Instance Type**: Free or Starter (depending on your needs)

### Step 2: Add Environment Variables

In the Render dashboard, add these environment variables:

```
DATABASE_URL=your_database_url
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id
SESSION_SECRET=generate_random_string
GOOGLE_GENERATIVE_AI_API_KEY=optional_gemini_key
```

**Important**: Get your `DATABASE_URL` from Render's PostgreSQL add-on or use external database like Neon.

### Step 3: Create PostgreSQL Database (on Render)

1. Go to "New +" → "PostgreSQL"
2. Configure:
   - **Name**: holacentro-db
   - **Region**: Same as your web service
   - **PostgreSQL Version**: 15 or later
   - **Instance Type**: Free or Starter
3. Copy the **Internal Database URL** and add it to your web service environment variables

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Push database schema with `npm run db:push`
   - Start the application with `npm run dev`

### Step 5: Configure Discord Bot

Update your Discord bot's redirect URL:
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Select your application
- Go to OAuth2 → General
- Add redirect URL: `https://your-app-name.onrender.com/api/auth/callback`

## Post-Deployment

### Health Check

Visit your deployed URL and check:
- [ ] Homepage loads correctly
- [ ] Discord bot is online in your server
- [ ] Users can generate access codes with `/generate-access`
- [ ] Web login works
- [ ] Profile customization works

### Database Management

Access your database:

```bash
# Using Drizzle Studio (locally)
npm run db:studio

# Connect to production database
DATABASE_URL=your_production_url npm run db:studio
```

### Monitoring

Monitor your application:
1. Check Render logs for errors
2. Monitor Discord bot status in your server
3. Check database performance in Render dashboard

## Updating the Application

### Using Render Auto-Deploy

1. Push changes to your GitHub repository
2. Render will automatically deploy the changes

### Manual Deploy

1. Go to Render dashboard
2. Select your web service
3. Click "Manual Deploy" → "Deploy latest commit"

## Troubleshooting

### Bot Not Connecting

- Check `DISCORD_BOT_TOKEN` is correct
- Verify bot has proper permissions in Discord Developer Portal
- Check Render logs for connection errors

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Ensure database is running
- Check firewall/security group settings

### Profile Images Not Loading

- Check that image URLs are accessible publicly
- Verify CORS settings if using external image hosting

### Session Issues

- Verify `SESSION_SECRET` is set
- Check that sessions are persisting (not using in-memory store in production)

## Scaling Considerations

### For High Traffic

1. **Upgrade Render Instance**: Move from Free to Starter or higher
2. **Database**: Upgrade PostgreSQL instance
3. **Caching**: Consider adding Redis for session storage
4. **CDN**: Use Cloudflare or similar for static assets

### Database Optimization

```bash
# Create indexes for better performance
npm run db:generate
# Add indexes in your schema for frequently queried fields
npm run db:push
```

## Backup Strategy

### Database Backups

Render automatically backs up PostgreSQL databases. To download a backup:
1. Go to your PostgreSQL instance in Render
2. Click "Backups"
3. Download the latest backup

### Manual Backup

```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20240101.sql
```

## Support

If you encounter issues:
1. Check application logs in Render dashboard
2. Review Discord bot status
3. Verify all environment variables are set correctly
4. Check database connection and schema

## Security Best Practices

1. **Never commit** `.env` files or secrets to Git
2. **Rotate** `SESSION_SECRET` periodically
3. **Use HTTPS** (Render provides this automatically)
4. **Limit Discord bot permissions** to only what's needed
5. **Review** user roles and permissions regularly

---

Good luck with your deployment! 🚀
