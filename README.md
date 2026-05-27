# Server Command Discord Bot

A TypeScript Discord bot for a new server, built with Discord.js. The first version includes welcome messages, moderation controls, mod logs, utility commands, polls, and lightweight games.

## Features

- Welcome messages for new members
- Server config commands for welcome and log channels
- Moderation: kick, ban, timeout, untimeout, warn, and purge
- Utility: help, server info, user info, avatar, and polls
- Games/fun: coin flip, dice, rock-paper-scissors, number guessing, and trivia
- Adult-only waifu economy: pulls, claims, collections, trades, releases, profiles, tierlists, and NSFW social commands
- SQLite persistence for waifu ownership, trades, tier votes, optional adult channel markers, and command stats
- JSON-backed server configuration for a simple first version

## Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:

   ```text
   DISCORD_TOKEN=...
   DISCORD_CLIENT_ID=...
   DISCORD_GUILD_ID=...
   ```

3. Build the bot:

   ```powershell
   npm run build
   ```

4. Initialize the local SQLite database:

   ```powershell
   npm run db:init
   ```

5. Register slash commands:

   ```powershell
   npm run deploy
   ```

6. Start the bot:

   ```powershell
   npm start
   ```

## VPS notes

On a VPS, keep `.env` private and run the bot from the project directory. A process manager such as PM2 is a good next step after the bot is configured:

```powershell
npm install -g pm2
pm2 start dist/index.js --name server-command-bot
pm2 save
```

## Discord permissions

When inviting the bot, enable the scopes `bot` and `applications.commands`. The bot needs permissions for the features you use, especially:

- Send Messages
- Use Slash Commands
- Embed Links
- Manage Messages
- Kick Members
- Ban Members
- Moderate Members

## Commands

Run `/help` in Discord after deploying commands to see the full command list.

## Adult command setup

Adult waifu commands are available in server channels without requiring Discord's NSFW channel flag. Admins can still mark a preferred adult bot channel for organization:

```text
/setnsfwchannel channel:#your-adult-channel enabled:true
```

Even in loose server mode, the safety filter blocks underage, ambiguous-age, incest, and non-consensual terms before posting or accepting entries.

The waifu economy uses `data/bot.sqlite`. This works well on a Droplet or any persistent server. DigitalOcean App Platform can redeploy workers onto fresh storage, so use a Droplet for SQLite or migrate this storage to Postgres before relying on long-term collections.
