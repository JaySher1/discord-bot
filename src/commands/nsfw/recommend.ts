import { SlashCommandBuilder } from "discord.js";
import { recommendations } from "../../data/animePrompts.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const recommendCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("recommend")
    .setDescription("Get an anime recommendation by vibe.")
    .addStringOption((option) =>
      option
        .setName("vibe")
        .setDescription("What you are in the mood for.")
        .setRequired(true)
        .addChoices(
          { name: "Action", value: "action" },
          { name: "Romance", value: "romance" },
          { name: "Dark", value: "dark" },
          { name: "Gooner", value: "gooner" },
          { name: "Classic", value: "classic" }
        )
    ),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const vibe = interaction.options.getString("vibe", true);
    const list = recommendations[vibe] ?? recommendations.action ?? ["Cowboy Bebop"];
    const pick = list[Math.floor(Math.random() * list.length)] ?? list[0];

    await interaction.reply(`Tonight's **${vibe}** recommendation: **${pick}**.`);
  }
};
