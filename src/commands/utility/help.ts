import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { commands } from "../index.js";
import type { CommandCategory, SlashCommand } from "../../types/command.js";

export const helpCommand: SlashCommand = {
  category: "Utility",
  data: new SlashCommandBuilder().setName("help").setDescription("Show the bot command list."),
  async execute(interaction) {
    const grouped = commands.reduce<Record<CommandCategory, string[]>>(
      (acc, command) => {
        acc[command.category].push(`/${command.data.name} - ${command.data.description}`);
        return acc;
      },
      { Admin: [], Moderation: [], Utility: [], Games: [] }
    );

    const embed = new EmbedBuilder()
      .setTitle("Server Command Bot")
      .setDescription("Here are the commands currently loaded.")
      .setTimestamp();

    for (const [category, lines] of Object.entries(grouped)) {
      if (lines.length > 0) {
        embed.addFields({ name: category, value: lines.join("\n") });
      }
    }

    await interaction.reply({ embeds: [embed] });
  }
};
