import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { randomInt } from "../../services/games.js";
import type { SlashCommand } from "../../types/command.js";

export const guessCommand: SlashCommand = {
  category: "Games",
  data: new SlashCommandBuilder()
    .setName("guess")
    .setDescription("Guess a number between 1 and 10.")
    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription("Your guess.")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true)
    ),
  async execute(interaction) {
    const guess = interaction.options.getInteger("number", true);
    const answer = randomInt(1, 10);

    if (guess === answer) {
      await interaction.reply(`Correct. The number was **${answer}**.`);
      return;
    }

    await interaction.reply({
      content: `Close, but not this time. You guessed **${guess}** and the number was **${answer}**.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
