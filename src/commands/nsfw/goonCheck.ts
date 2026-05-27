import { SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

const verdicts = [
  "stable, but one fanart away from disaster",
  "terminally down bad",
  "operating at unsafe thirst pressure",
  "too far gone for conventional moderation",
  "surprisingly composed, which is suspicious"
];

export const goonCheckCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("gooncheck")
    .setDescription("Run a deeply scientific down-bad diagnostic.")
    .addUserOption((option) => option.setName("member").setDescription("The subject.")),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const user = interaction.options.getUser("member") ?? interaction.user;
    const score = Math.floor(Math.random() * 101);
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)] ?? verdicts[0];

    await interaction.reply(`${user}'s goon meter: **${score}%**. Diagnosis: **${verdict}**.`);
  }
};
