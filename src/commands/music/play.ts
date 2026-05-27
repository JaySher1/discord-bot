import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { formatTrack } from "../../services/music/musicFormat.js";
import { requireUserVoiceChannel } from "../../services/music/musicGuards.js";
import { playMusicQuery } from "../../services/music/musicPlayer.js";
import { isYouTubeUrl, YOUTUBE_UNSUPPORTED_MESSAGE } from "../../services/music/youtube.js";
import type { SlashCommand } from "../../types/command.js";

export const playCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music from SoundCloud or a direct audio URL.")
    .addStringOption((option) =>
      option.setName("query").setDescription("A SoundCloud search, SoundCloud URL, or direct audio URL.").setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString("query", true).trim();

    if (isYouTubeUrl(query)) {
      await interaction.reply({
        content: YOUTUBE_UNSUPPORTED_MESSAGE,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const voiceContext = await requireUserVoiceChannel(interaction);

    if (!voiceContext) {
      return;
    }

    await interaction.deferReply();

    try {
      const result = await playMusicQuery({
        voiceChannel: voiceContext.voiceChannel,
        query,
        requestedBy: interaction.user,
        textChannelId: interaction.channelId
      });

      await interaction.editReply(`Queued ${formatTrack(result.track)}`);
    } catch (error) {
      console.error("Failed to play music query:", error);
      await interaction.editReply(
        "I could not play that. Try a SoundCloud search, a SoundCloud URL, or a direct audio stream URL."
      );
    }
  }
};
