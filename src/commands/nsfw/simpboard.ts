import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import { getSimpboard } from "../../services/commandStats.js";
import type { SlashCommand } from "../../types/command.js";

export const simpboardCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("simpboard")
    .setDescription("Show the server's top waifu-command offenders."),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) return;

    const rows = getSimpboard(interaction.guildId);

    if (rows.length === 0) {
      await interaction.reply({
        content: "No simpboard data yet. The degeneracy economy is still booting.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Simpboard")
      .setDescription(
        rows.map((row, index) => `**${index + 1}.** <@${row.userId}> - ${row.count} incident(s)`).join("\n")
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
