import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";

export const coinFlipCommand: SlashCommand = {
  category: "Games",
  data: new SlashCommandBuilder().setName("coinflip").setDescription("Flip a coin."),
  async execute(interaction) {
    const result = Math.random() > 0.5 ? "Heads" : "Tails";
    await interaction.reply(`The coin landed on **${result}**.`);
  }
};
