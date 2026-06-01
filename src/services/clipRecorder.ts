import { spawn } from "node:child_process";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import {
  EndBehaviorType,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
  type AudioReceiveStream,
  type DiscordGatewayAdapterCreator,
  type VoiceConnection
} from "@discordjs/voice";
import {
  AttachmentBuilder,
  PermissionFlagsBits,
  type Client,
  type Guild,
  type SendableChannels,
  type VoiceBasedChannel
} from "discord.js";
import { opus } from "prism-media";

const DEFAULT_SECONDS = 30;
const MAX_SECONDS = 60;
const SAMPLE_RATE = 48_000;
const CHANNELS = 2;
const BYTES_PER_SAMPLE = 2;
const PCM_BYTES_PER_FRAME = CHANNELS * BYTES_PER_SAMPLE;
const PCM_BYTES_PER_SECOND = SAMPLE_RATE * PCM_BYTES_PER_FRAME;
const PCM_BYTES_PER_MS = PCM_BYTES_PER_SECOND / 1_000;
const DISCORD_UPLOAD_GUARD_BYTES = 24 * 1024 * 1024;
const TEMP_DIR = path.resolve("data", "clip-temp");

type RecorderResult = {
  message: string;
  ephemeral?: boolean;
};

type EnableOptions = {
  guild: Guild;
  client: Client;
  voiceChannel: VoiceBasedChannel;
  outputChannel: SendableChannels;
  seconds: number;
  requestedByUserId: string;
};

type PcmChunk = {
  startMs: number;
  endMs: number;
  data: Buffer;
};

type AudioSource = {
  stream: AudioReceiveStream;
  decoder: opus.Decoder;
  chunks: PcmChunk[];
};

type GuildClipState = {
  guildId: string;
  client: Client;
  voiceChannelId: string;
  outputChannelId: string;
  seconds: number;
  connection: VoiceConnection;
  sources: Map<string, AudioSource>;
  observedUserIds: Set<string>;
  ignoredBotUserIds: Set<string>;
  pendingUserIds: Set<string>;
  rendering: boolean;
  activeTempFiles: Set<string>;
  speakingStartListener: (userId: string) => void;
};

export class ClipRecorder {
  private readonly states = new Map<string, GuildClipState>();

  public constructor(private readonly options: { ffmpegPath: string }) {}

  public async cleanupStaleTempFiles(): Promise<void> {
    await mkdir(TEMP_DIR, { recursive: true });

    const files = await readdir(TEMP_DIR).catch(() => []);
    await Promise.all(
      files
        .filter((file) => file.startsWith("clip-") && file.endsWith(".ogg"))
        .map((file) => unlink(path.join(TEMP_DIR, file)).catch(() => null))
    );
  }

  public async enable(options: EnableOptions): Promise<RecorderResult> {
    if (this.states.has(options.guild.id)) {
      return {
        message: "Clipping is already enabled in this server. Use `/clip stop` before enabling it again.",
        ephemeral: true
      };
    }

    const seconds = clampSeconds(options.seconds);
    const botMember = options.guild.members.me ?? (await options.guild.members.fetchMe());
    const voicePermissions = options.voiceChannel.permissionsFor(botMember);
    const outputPermissions =
      "permissionsFor" in options.outputChannel ? options.outputChannel.permissionsFor(botMember) : null;

    if (!options.voiceChannel.joinable || !voicePermissions?.has(PermissionFlagsBits.Connect)) {
      return {
        message: "I can see your voice channel, but I do not have permission to join it.",
        ephemeral: true
      };
    }

    if (!outputPermissions?.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles])) {
      return {
        message: "I need permission to send messages and attach files in the clip channel.",
        ephemeral: true
      };
    }

    const connection = joinVoiceChannel({
      channelId: options.voiceChannel.id,
      guildId: options.guild.id,
      adapterCreator: options.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch (error) {
      connection.destroy();
      console.error(`Clip bot could not join voice in guild ${options.guild.id}`, error);
      return {
        message: "I could not join that voice channel. Check my voice permissions and try again.",
        ephemeral: true
      };
    }

    const state: GuildClipState = {
      guildId: options.guild.id,
      client: options.client,
      voiceChannelId: options.voiceChannel.id,
      outputChannelId: options.outputChannel.id,
      seconds,
      connection,
      sources: new Map(),
      observedUserIds: new Set(),
      ignoredBotUserIds: new Set(),
      pendingUserIds: new Set(),
      rendering: false,
      activeTempFiles: new Set(),
      speakingStartListener: (userId: string) => {
        void this.subscribeToUser(state, userId);
      }
    };

    connection.receiver.speaking.on("start", state.speakingStartListener);
    this.states.set(options.guild.id, state);

    try {
      await options.outputChannel.send(
        `Voice clipping is now enabled in <#${options.voiceChannel.id}> for the last ${seconds} seconds. ` +
          `Anyone speaking in that voice channel may be included in saved clips. Use \`/clip stop\` to end clipping.`
      );
    } catch (error) {
      console.error(`Clip bot could not send consent notice in guild ${options.guild.id}`, error);
      await this.stop(options.guild.id);
      return {
        message: "I joined voice, but I could not send messages in the clip channel. Check my channel permissions.",
        ephemeral: true
      };
    }

    console.log(
      `Clip recorder enabled in guild ${options.guild.id} by ${options.requestedByUserId}; decoder=${opus.Decoder.type}`
    );

    return {
      message: `Clipping enabled in <#${options.voiceChannel.id}>. Saved clips will go to <#${options.outputChannel.id}>.`,
      ephemeral: true
    };
  }

  public async save(guild: Guild, userId: string, title?: string): Promise<RecorderResult> {
    const state = this.states.get(guild.id);

    if (!state) {
      return { message: "Clipping is not active in this server." };
    }

    const member = await guild.members.fetch(userId).catch(() => null);

    if (!member?.voice.channelId || member.voice.channelId !== state.voiceChannelId) {
      return { message: "Join the same voice channel as the clip bot before saving a clip." };
    }

    if (state.rendering) {
      return { message: "A clip is already rendering for this server. Try again in a moment." };
    }

    const mixedPcm = this.buildMixedPcm(state);

    if (!mixedPcm) {
      return { message: "No voice audio is buffered yet. Wait for someone to speak, then try again." };
    }

    state.rendering = true;
    const tempPath = this.createTempPath(state.guildId);
    state.activeTempFiles.add(tempPath);

    try {
      await this.renderOgg(mixedPcm, tempPath);
      const fileStats = await stat(tempPath);

      if (fileStats.size > DISCORD_UPLOAD_GUARD_BYTES) {
        return { message: "clip too large, reduce seconds." };
      }

      const channel = await state.client.channels.fetch(state.outputChannelId).catch(() => null);

      if (!channel?.isSendable()) {
        return { message: "I cannot send clips to the configured clip channel anymore." };
      }

      const fileName = buildClipFileName(title);
      const attachment = new AttachmentBuilder(tempPath, { name: fileName });
      const content = title ? `Saved clip: **${escapeMarkdown(title)}**` : "Saved voice clip.";

      await channel.send({
        content,
        files: [attachment]
      });

      return { message: `Saved clip to <#${state.outputChannelId}>.` };
    } catch (error) {
      console.error(`Clip render failed in guild ${guild.id}`, error);
      const message = error instanceof Error ? error.message : "Unknown render error.";
      return { message: `I could not save that clip. ${message}` };
    } finally {
      state.rendering = false;
      state.activeTempFiles.delete(tempPath);
      await unlink(tempPath).catch(() => null);
    }
  }

  public getStatus(guildId: string): string {
    const state = this.states.get(guildId);

    if (!state) {
      return "Clip bot is inactive in this server.";
    }

    const bufferedSpeakers = [...state.sources.values()].filter((source) => source.chunks.length > 0).length;
    const observedSpeakers =
      state.observedUserIds.size > 0
        ? [...state.observedUserIds].slice(0, 8).map((userId) => `<@${userId}>`).join(", ")
        : "none yet";
    const ignoredBots =
      state.ignoredBotUserIds.size > 0
        ? [...state.ignoredBotUserIds].slice(0, 8).map((userId) => `<@${userId}>`).join(", ")
        : "none";

    return [
      "Clip bot is active.",
      `Voice channel: <#${state.voiceChannelId}>`,
      `Clip length: ${state.seconds} seconds`,
      `Output channel: <#${state.outputChannelId}>`,
      `Rendering: ${state.rendering ? "yes" : "no"}`,
      `Buffered speakers: ${bufferedSpeakers}`,
      `Observed packet senders: ${observedSpeakers}`,
      `Ignored bot senders: ${ignoredBots}`
    ].join("\n");
  }

  public async stop(guildId: string): Promise<string> {
    const state = this.states.get(guildId);

    if (!state) {
      await this.cleanupGuildTempFiles(guildId);
      return "Clipping is not active in this server.";
    }

    this.states.delete(guildId);
    state.connection.receiver.speaking.off("start", state.speakingStartListener);

    for (const source of state.sources.values()) {
      source.stream.destroy();
      source.decoder.destroy();
      source.chunks.length = 0;
    }

    if (state.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      state.connection.destroy();
    }

    await Promise.all([...state.activeTempFiles].map((file) => unlink(file).catch(() => null)));
    await this.cleanupGuildTempFiles(guildId);

    return "Clipping stopped. Voice buffers and temp files were cleared.";
  }

  public async shutdown(): Promise<void> {
    const guildIds = [...this.states.keys()];
    await Promise.all(guildIds.map((guildId) => this.stop(guildId)));
  }

  private async subscribeToUser(state: GuildClipState, userId: string): Promise<void> {
    if (state.sources.has(userId) || state.ignoredBotUserIds.has(userId) || state.pendingUserIds.has(userId)) {
      return;
    }

    state.pendingUserIds.add(userId);

    try {
      const user = state.client.users.cache.get(userId) ?? (await state.client.users.fetch(userId).catch(() => null));

      if (user?.bot) {
        state.ignoredBotUserIds.add(userId);
        return;
      }
    } finally {
      state.pendingUserIds.delete(userId);
    }

    const stream = state.connection.receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.Manual
      }
    });
    const decoder = new opus.Decoder({
      rate: SAMPLE_RATE,
      channels: CHANNELS,
      frameSize: 960
    });
    const source: AudioSource = {
      stream,
      decoder,
      chunks: []
    };

    state.sources.set(userId, source);

    decoder.on("data", (chunk: Buffer) => {
      const now = Date.now();
      const durationMs = chunk.length / PCM_BYTES_PER_MS;

      source.chunks.push({
        startMs: now - durationMs,
        endMs: now,
        data: Buffer.from(chunk)
      });
      state.observedUserIds.add(userId);
      this.trimSource(source, state.seconds);
    });

    stream.on("error", (error) => {
      console.error(`Clip receive stream failed for user ${userId} in guild ${state.guildId}`, error);
    });
    decoder.on("error", (error) => {
      console.error(`Clip decoder failed for user ${userId} in guild ${state.guildId}`, error);
    });

    stream.pipe(decoder);
  }

  private trimSource(source: AudioSource, seconds: number): void {
    const cutoffMs = Date.now() - (seconds + 2) * 1_000;

    while (source.chunks.length > 0) {
      const first = source.chunks[0];

      if (!first || first.endMs >= cutoffMs) {
        break;
      }

      source.chunks.shift();
    }
  }

  private buildMixedPcm(state: GuildClipState): Buffer | null {
    const durationMs = state.seconds * 1_000;
    const endMs = Date.now();
    const startMs = endMs - durationMs;
    const output = Buffer.alloc(state.seconds * PCM_BYTES_PER_SECOND);
    let hasAudio = false;

    for (const source of state.sources.values()) {
      this.trimSource(source, state.seconds);

      for (const chunk of source.chunks) {
        if (chunk.endMs <= startMs || chunk.startMs >= endMs) {
          continue;
        }

        const sourceOffset = chunk.startMs < startMs ? msToFrameOffset(startMs - chunk.startMs) : 0;
        const targetOffset = chunk.startMs > startMs ? msToFrameOffset(chunk.startMs - startMs) : 0;
        const byteCount = Math.min(
          chunk.data.length - sourceOffset,
          output.length - targetOffset
        );
        const alignedByteCount = alignToFrame(byteCount);

        if (alignedByteCount <= 0) {
          continue;
        }

        mixPcm(chunk.data, output, sourceOffset, targetOffset, alignedByteCount);
        hasAudio = true;
      }
    }

    return hasAudio ? output : null;
  }

  private async renderOgg(pcm: Buffer, outputPath: string): Promise<void> {
    await mkdir(TEMP_DIR, { recursive: true });

    const args = [
      "-f",
      "s16le",
      "-ar",
      String(SAMPLE_RATE),
      "-ac",
      String(CHANNELS),
      "-i",
      "pipe:0",
      "-c:a",
      "libopus",
      "-b:a",
      "96k",
      "-vbr",
      "on",
      "-application",
      "audio",
      "-f",
      "ogg",
      "-y",
      outputPath
    ];

    await new Promise<void>((resolve, reject) => {
      const child = spawn(this.options.ffmpegPath, args, {
        stdio: ["pipe", "ignore", "pipe"]
      });
      const stderr: Buffer[] = [];

      child.stderr.on("data", (chunk: Buffer) => {
        stderr.push(chunk);
      });
      child.on("error", (error) => {
        reject(error);
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        const details = Buffer.concat(stderr).toString("utf8").trim();
        reject(new Error(`FFmpeg exited with code ${code}.${details ? ` ${details}` : ""}`));
      });

      child.stdin.end(pcm);
    });
  }

  private createTempPath(guildId: string): string {
    const fileName = `clip-${guildId}-${Date.now()}-${Math.random().toString(36).slice(2)}.ogg`;
    return path.join(TEMP_DIR, fileName);
  }

  private async cleanupGuildTempFiles(guildId: string): Promise<void> {
    await mkdir(TEMP_DIR, { recursive: true });

    const files = await readdir(TEMP_DIR).catch(() => []);
    await Promise.all(
      files
        .filter((file) => file.startsWith(`clip-${guildId}-`) && file.endsWith(".ogg"))
        .map((file) => unlink(path.join(TEMP_DIR, file)).catch(() => null))
    );
  }
}

function clampSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return DEFAULT_SECONDS;
  }

  return Math.min(Math.max(Math.floor(seconds), 1), MAX_SECONDS);
}

function alignToFrame(byteCount: number): number {
  return Math.max(0, byteCount - (byteCount % PCM_BYTES_PER_FRAME));
}

function msToFrameOffset(ms: number): number {
  return alignToFrame(Math.floor(ms * PCM_BYTES_PER_MS));
}

function mixPcm(source: Buffer, target: Buffer, sourceOffset: number, targetOffset: number, byteCount: number): void {
  for (let offset = 0; offset < byteCount; offset += BYTES_PER_SAMPLE) {
    const mixed = target.readInt16LE(targetOffset + offset) + source.readInt16LE(sourceOffset + offset);
    target.writeInt16LE(clampInt16(mixed), targetOffset + offset);
  }
}

function clampInt16(value: number): number {
  return Math.max(-32_768, Math.min(32_767, value));
}

function buildClipFileName(title: string | undefined): string {
  const safeTitle = title
    ? title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
    : "voice-clip";

  return `${safeTitle || "voice-clip"}-${Date.now()}.ogg`;
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+\-.!|>])/g, "\\$1");
}
