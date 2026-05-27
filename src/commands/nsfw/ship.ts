import { SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const shipCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Calculate a cursed compatibility score.")
    .addUserOption((option) => option.setName("member1").setDescription("First member.").setRequired(true))
    .addUserOption((option) => option.setName("member2").setDescription("Second member.").setRequired(true)),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const first = interaction.options.getUser("member1", true);
    const second = interaction.options.getUser("member2", true);
    const score = Math.floor(Math.random() * 101);

    await interaction.reply(`${first} x ${second}: **${score}%** compatibility. The council is concerned.`);
  }
};
