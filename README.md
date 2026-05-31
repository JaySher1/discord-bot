# Server Command Discord Bot

A TypeScript Discord bot for a new server, built with Discord.js. The first version includes welcome messages, moderation controls, mod logs, utility commands, polls, and lightweight games.

## Features

- Welcome messages for new members
- Server config commands for welcome and log channels
- Moderation: kick, ban, timeout, untimeout, warn, and purge
- Utility: help, server info, user info, avatar, and polls
- Games/fun: coin flip, dice, rock-paper-scissors, number guessing, and trivia
- Music: `/play` uses Lavalink to stream YouTube searches, YouTube links, and SoundCloud track links into voice
- Voice clipping: a separate clip bot process can save short Ogg clips from a voice channel
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
   CLIP_BOT_TOKEN=...
   CLIP_BOT_CLIENT_ID=...
   FFMPEG_PATH=ffmpeg
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
   npm run deploy:clip
   ```

6. Start the bot:

   ```powershell
   npm start
   ```

   To run only the clip bot locally after building:

   ```powershell
   npm run start:clip
   ```

## VPS notes

On a VPS or Droplet, keep `.env` private and run the bot from the project directory. A process manager such as PM2 is a good next step after the bot is configured:

```powershell
npm install -g pm2
pm2 start dist/index.js --name server-command-bot
pm2 start dist/clip-bot.js --name clip-bot
pm2 save
```

After updates on the VPS:

```bash
cd /path/to/discord-bot
git pull origin main
sudo apt-get update
sudo apt-get install -y ffmpeg
npm install --legacy-peer-deps
npm run build
npm run deploy:clip
pm2 restart server-command-bot --update-env || pm2 start dist/index.js --name server-command-bot
pm2 restart clip-bot --update-env || pm2 start dist/clip-bot.js --name clip-bot
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

The clip bot is a second Discord application. Invite it separately with the scopes `bot` and `applications.commands`. It needs:

- Send Messages
- Use Slash Commands
- Attach Files
- Connect
- View Channels for the voice and clip channels

## Clip bot setup

The clip bot uses `@discordjs/voice` receive streams and system FFmpeg. It does not replace Lavalink and does not download music permanently.

Clip bot environment:

```text
CLIP_BOT_TOKEN=...
CLIP_BOT_CLIENT_ID=...
FFMPEG_PATH=ffmpeg
```

Commands:

```text
/clip enable seconds:30 channel:#clips
/clip save title:"optional title"
/clip status
/clip stop
```

`/clip enable` requires Manage Guild and posts a consent/privacy notice in the clip channel. `/clip save` can only be run by someone in the same voice channel as the clip bot. The bot renders a temporary `.ogg`, checks it is below the conservative 24 MiB upload guard, uploads it, then deletes the temp file. If it is too large, it replies `clip too large, reduce seconds.`

Temporary render files live under `data/clip-temp/`. The clip bot cleans stale temp clips on startup and clears active temp files during shutdown.

### Music audio feasibility checkpoint

The clip bot is intentionally separate so it can run while the Lavalink music bot is active. Discord voice receive behavior still needs to be verified in the real guild:

1. Start Lavalink and the main music bot.
2. Start the clip bot.
3. Put both bots in the same voice channel.
4. Play a short track with `/play` while no users are speaking.
5. Run `/clip enable seconds:10 channel:#clips`.
6. Run `/clip save title:"music receive test"`.
7. Listen to the uploaded Ogg.

If the Ogg contains the music, this guild/runtime exposes the music bot packets to the clip bot and clipping captures that audio. If the Ogg is silent, Discord is not exposing the music bot audio packets to the receive API in this setup; the feature still works for voice users that Discord exposes to the clip bot.

## Commands

Run `/help` in Discord after deploying commands to see the full command list.

## Adult command setup

Adult waifu commands are available in server channels without requiring Discord's NSFW channel flag. Admins can still mark a preferred adult bot channel for organization:

```text
/setnsfwchannel channel:#your-adult-channel enabled:true
```

Even in loose server mode, the safety filter blocks underage, ambiguous-age, incest, and non-consensual terms before posting or accepting entries.

The waifu economy uses `data/bot.sqlite`. This works well on a Droplet or any persistent server. DigitalOcean App Platform can redeploy workers onto fresh storage, so use a Droplet for SQLite or migrate this storage to Postgres before relying on long-term collections.
