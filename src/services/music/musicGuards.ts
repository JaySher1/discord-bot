import {
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Guild,
  type VoiceBasedChannel
} from "discord.js";
import { getGuildQueue, type MusicQueueMetadata } from "./musicPlayer.js";
import type { GuildQueue } from "discord-player";

type VoiceReadyContext = {
  guild: Guild;
  voiceChannel: VoiceBasedChannel;
};

export async function requireUserVoiceChannel(
  interaction: ChatInputCommandInteraction
): Promise<VoiceReadyContext | null> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Music commands can only be used in a server.",
      flags: MessageFlags.Ephemeral
    });
    return null;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: "You need to be in a voice channel first.",
      flags: MessageFlags.Ephemeral
    });
    return null;
  }

  const botMember = await interaction.guild.members.fetchMe();
  const permissions = voiceChannel.permissionsFor(botMember);

  if (!permissions?.has(PermissionFlagsBits.ViewChannel)) {
    await interaction.reply({
      content: "I cannot view your voice channel.",
      flags: MessageFlags.Ephemeral
    });
    return null;
  }

  if (!permissions.has(PermissionFlagsBits.Connect)) {
    await interaction.reply({
      content: "I need the Connect permission for your voice channel.",
      flags: MessageFlags.Ephemeral
    });
    return null;
  }

  if (!permissions.has(PermissionFlagsBits.Speak)) {
    await interaction.reply({
      content: "I need the Speak permission for your voice channel.",
      flags: MessageFlags.Ephemeral
    });
    return null;
  }

  return {
    guild: interaction.guild,
    voiceChannel
  };
}

export async function requireGuildQueue(
  interaction: ChatInputCommandInteraction
): Promise<GuildQueue<MusicQueueMetadata> | null> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "Music commands can only be used in a server.",
      flags: MessageFlags.Ephemeral
    });
    return null;
  }

  const queue = getGuildQueue(interaction.guildId);

  if (!queue || (!queue.currentTrack && queue.tracks.size === 0)) {
    await interaction.reply({
      content: "There is nothing in the music queue right now.",
      flags: MessageFlags.Ephemeral
    });
    return null;
  }

  return queue;
}
