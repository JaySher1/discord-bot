import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { formatQueue } from "../../services/music/musicFormat.js";
import { requireGuildQueue } from "../../services/music/musicGuards.js";
import type { SlashCommand } from "../../types/command.js";

export const queueCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder().setName("queue").setDescription("Show the current music queue."),
  async execute(interaction) {
    const queue = await requireGuildQueue(interaction);

    if (!queue) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Music Queue")
      .setDescription(formatQueue(queue))
      .setFooter({ text: `${queue.tracks.size} queued track${queue.tracks.size === 1 ? "" : "s"}` });

    await interaction.reply({ embeds: [embed] });
  }
};
