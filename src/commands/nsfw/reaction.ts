import { SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

const reactions: Record<string, string[]> = {
  blush: ["face red, brain gone", "critical blush damage", "cannot maintain eye contact"],
  smug: ["smug aura detected", "villain grin online", "absolutely insufferable energy"],
  bonk: ["bonk delivered", "horny jail paperwork filed", "thirst levels forcibly reduced"],
  cringe: ["psychic damage taken", "the room got quieter", "delete this before witnesses arrive"]
};

export const reactionCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("reaction")
    .setDescription("Send an anime-style reaction line.")
    .addStringOption((option) =>
      option
        .setName("mood")
        .setDescription("Reaction mood.")
        .setRequired(true)
        .addChoices(
          { name: "Blush", value: "blush" },
          { name: "Smug", value: "smug" },
          { name: "Bonk", value: "bonk" },
          { name: "Cringe", value: "cringe" }
        )
    ),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const mood = interaction.options.getString("mood", true);
    const options = reactions[mood] ?? reactions.blush ?? ["reaction failed successfully"];
    const line = options[Math.floor(Math.random() * options.length)] ?? options[0];

    await interaction.reply(`**${mood.toUpperCase()} reaction:** ${line}.`);
  }
};
