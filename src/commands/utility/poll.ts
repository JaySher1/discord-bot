import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";

export const pollCommand: SlashCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a quick yes/no poll.")
    .addStringOption((option) =>
      option.setName("question").setDescription("The poll question.").setRequired(true)
    ),
  async execute(interaction) {
    const question = interaction.options.getString("question", true);
    const message = await interaction.reply({
      content: `**Poll:** ${question}\n\nVote with the reactions below.`,
      fetchReply: true
    });

    await message.react("👍");
    await message.react("👎");
  }
};
