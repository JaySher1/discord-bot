import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { formatNowPlaying } from "../../services/music/musicFormat.js";
import { requireGuildQueue } from "../../services/music/musicGuards.js";
import type { SlashCommand } from "../../types/command.js";

export const nowPlayingCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Show the current music track."),
  async execute(interaction) {
    const queue = await requireGuildQueue(interaction);

    if (!queue) {
      return;
    }

    const embed = new EmbedBuilder().setTitle("Now Playing").setDescription(formatNowPlaying(queue));

    await interaction.reply({ embeds: [embed] });
  }
};
