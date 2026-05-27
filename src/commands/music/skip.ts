import { SlashCommandBuilder } from "discord.js";
import { requireGuildQueue } from "../../services/music/musicGuards.js";
import type { SlashCommand } from "../../types/command.js";

export const skipCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current music track."),
  async execute(interaction) {
    const queue = await requireGuildQueue(interaction);

    if (!queue) {
      return;
    }

    if (queue.tracks.size === 0) {
      queue.node.stop();
      await interaction.reply("Skipped the current track. The queue is now empty.");
      return;
    }

    if (!queue.node.skip()) {
      await interaction.reply("I could not skip the current track.");
      return;
    }

    await interaction.reply("Skipped the current track.");
  }
};
