import { SlashCommandBuilder } from "discord.js";
import { rollDice } from "../../services/games.js";
import type { SlashCommand } from "../../types/command.js";

export const diceCommand: SlashCommand = {
  category: "Games",
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Roll one or more dice.")
    .addIntegerOption((option) =>
      option
        .setName("sides")
        .setDescription("How many sides each die has.")
        .setMinValue(2)
        .setMaxValue(100)
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("How many dice to roll.")
        .setMinValue(1)
        .setMaxValue(10)
    ),
  async execute(interaction) {
    const sides = interaction.options.getInteger("sides") ?? 6;
    const count = interaction.options.getInteger("count") ?? 1;
    const rolls = rollDice(sides, count);
    const total = rolls.reduce((sum, roll) => sum + roll, 0);

    await interaction.reply(`Rolled ${count}d${sides}: **${rolls.join(", ")}**. Total: **${total}**.`);
  }
};
