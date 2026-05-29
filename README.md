# Server Command Discord Bot

A TypeScript Discord bot for a new server, built with Discord.js. The first version includes welcome messages, moderation controls, mod logs, utility commands, polls, and lightweight games.

## Features

- Welcome messages for new members
- Server config commands for welcome and log channels
- Moderation: kick, ban, timeout, untimeout, warn, and purge
- Utility: help, server info, user info, avatar, and polls
- Games/fun: coin flip, dice, rock-paper-scissors, number guessing, and trivia
- Music: `/play` uses Lavalink to stream YouTube searches, YouTube links, and SoundCloud track links into voice
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
   LAVALINK_HOST=127.0.0.1
   LAVALINK_PORT=2333
   LAVALINK_PASSWORD=...
   LAVALINK_SECURE=false
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

On a VPS or Droplet, keep `.env` private and run the bot from the project directory. A process manager such as PM2 is a good next step after the bot is configured:

```powershell
npm install -g pm2
pm2 start dist/index.js --name server-command-bot
pm2 save
```

## Lavalink music setup

Music playback requires a separate Lavalink server. On a single Ubuntu Droplet, run Lavalink on the same machine as the bot and point the bot at `127.0.0.1`.

Create `/opt/lavalink/application.yml`:

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  plugins:
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.18.0"
      repository: "https://maven.lavalink.dev/releases"
      snapshot: false
  server:
    password: "change-this-password"
    sources:
      youtube: false
      soundcloud: true
      bandcamp: false
      twitch: false
      vimeo: false
      nico: false
      http: false
      local: false

plugins:
  youtube:
    enabled: true
    allowSearch: true
    allowDirectVideoIds: true
    allowDirectPlaylistIds: false
    clients:
      - MUSIC
      - ANDROID_VR
      - WEB
      - WEBEMBEDDED
```

Start Lavalink with Docker:

```bash
docker run -d \
  --name lavalink \
  --restart unless-stopped \
  -p 127.0.0.1:2333:2333 \
  -v /opt/lavalink/application.yml:/opt/Lavalink/application.yml \
  ghcr.io/lavalink-devs/lavalink:4-alpine
```

Check logs:

```bash
docker logs -f lavalink
```

Set the bot `.env` password to the same value used in `application.yml`.

## Discord permissions

When inviting the bot, enable the scopes `bot` and `applications.commands`. The bot needs permissions for the features you use, especially:

- Send Messages
- Use Slash Commands
- Embed Links
- Connect
- Speak
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
