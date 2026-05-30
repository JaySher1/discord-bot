import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getLavalinkManager, getSearchSource } from "../../services/lavalink.js";
import type { SlashCommand } from "../../types/command.js";

export const playCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a YouTube search, YouTube link, or SoundCloud track through Lavalink.")
    .addStringOption((option) =>
      option.setName("song").setDescription("Song name, YouTube URL, or SoundCloud URL.").setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply("Use `/play` inside a server so I can join your voice channel.");
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
      await interaction.reply("Join a voice channel first, then run `/play` again.");
      return;
    }

    const botMember = interaction.guild.members.me ?? (await interaction.guild.members.fetchMe());
    const voicePermissions = voiceChannel.permissionsFor(botMember);

    if (
      !voiceChannel.joinable ||
      !voicePermissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])
    ) {
      await interaction.reply("I can see your voice channel, but I do not have permission to join and speak there.");
      return;
    }

    const query = interaction.options.getString("song", true).trim();
    await interaction.reply(`Searching for **${query}**...`);

    try {
      const lavalink = getLavalinkManager();
      const source = getSearchSource(query);
      const player = lavalink.createPlayer({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        selfDeaf: true,
        selfMute: false,
        volume: 80
      });

      if (player.voiceChannelId !== voiceChannel.id) {
        await player.changeVoiceState({
          voiceChannelId: voiceChannel.id,
          selfDeaf: true,
          selfMute: false
        });
      }

      await player.connect();

      const search = await player.search(
        {
          query,
          source
        },
        interaction.user
      );
      const track = search.tracks[0];

      if (!track) {
        await interaction.editReply("I could not find a playable result for that.");
        return;
      }

      player.queue.add(track);

      if (!player.playing && !player.paused) {
        await player.play();
      }

      const trackUrl = track.info.uri ? `\n${track.info.uri}` : "";
      await interaction.editReply(
        `Queued **${track.info.title}** from ${formatSource(track.info.sourceName ?? "Lavalink")}.${trackUrl}`
      );
    } catch (error) {
      console.error("Play command failed", error);
      const message = error instanceof Error ? error.message : "That track could not be played.";
      await interaction.editReply(`I could not play that. ${message}`);
    }
  }
};

function formatSource(source: string): string {
  switch (source.toLowerCase()) {
    case "youtube":
      return "YouTube";
    case "soundcloud":
      return "SoundCloud";
    default:
      return source;
  }
}
