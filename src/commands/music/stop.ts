import { SlashCommandBuilder } from "discord.js";
import { requireGuildQueue } from "../../services/music/musicGuards.js";
import type { SlashCommand } from "../../types/command.js";

export const stopCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop music, clear the queue, and leave voice."),
  async execute(interaction) {
    const queue = await requireGuildQueue(interaction);

    if (!queue) {
      return;
    }

    queue.delete();
    await interaction.reply("Stopped playback and cleared the queue.");
  }
};
