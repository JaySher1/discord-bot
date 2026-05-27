import { SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const touchGrassCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("touchgrass")
    .setDescription("Assign a member a grass-touching sentence.")
    .addUserOption((option) => option.setName("member").setDescription("The target.")),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const user = interaction.options.getUser("member") ?? interaction.user;
    const minutes = [5, 10, 15, 30, 45, 60][Math.floor(Math.random() * 6)] ?? 10;

    await interaction.reply(`${user} must touch grass for **${minutes} minutes** before opening another waifu tab.`);
  }
};
