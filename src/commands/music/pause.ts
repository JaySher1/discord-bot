import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { requireGuildQueue } from "../../services/music/musicGuards.js";
import type { SlashCommand } from "../../types/command.js";

export const pauseCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause the current music track."),
  async execute(interaction) {
    const queue = await requireGuildQueue(interaction);

    if (!queue) {
      return;
    }

    if (queue.node.isPaused()) {
      await interaction.reply({
        content: "Playback is already paused.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!queue.node.pause()) {
      await interaction.reply({
        content: "I could not pause playback right now.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.reply("Paused playback.");
  }
};
