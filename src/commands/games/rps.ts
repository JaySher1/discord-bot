import { SlashCommandBuilder } from "discord.js";
import { playRps, type RpsChoice } from "../../services/games.js";
import type { SlashCommand } from "../../types/command.js";

export const rpsCommand: SlashCommand = {
  category: "Games",
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play rock-paper-scissors against the bot.")
    .addStringOption((option) =>
      option
        .setName("choice")
        .setDescription("Your move.")
        .setRequired(true)
        .addChoices(
          { name: "Rock", value: "rock" },
          { name: "Paper", value: "paper" },
          { name: "Scissors", value: "scissors" }
        )
    ),
  async execute(interaction) {
    const choice = interaction.options.getString("choice", true) as RpsChoice;
    const result = playRps(choice);
    const resultText =
      result.result === "tie" ? "It is a tie." : result.result === "win" ? "You win." : "I win.";

    await interaction.reply(`You chose **${choice}**. I chose **${result.botChoice}**. ${resultText}`);
  }
};
