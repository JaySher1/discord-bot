import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { requireGuildQueue } from "../../services/music/musicGuards.js";
import type { SlashCommand } from "../../types/command.js";

export const resumeCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume paused music playback."),
  async execute(interaction) {
    const queue = await requireGuildQueue(interaction);

    if (!queue) {
      return;
    }

    if (!queue.node.isPaused()) {
      await interaction.reply({
        content: "Playback is not paused.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!queue.node.resume()) {
      await interaction.reply({
        content: "I could not resume playback right now.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.reply("Resumed playback.");
  }
};
