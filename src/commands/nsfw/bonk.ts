import { SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const bonkCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("bonk")
    .setDescription("Send a member to horny jail.")
    .addUserOption((option) =>
      option.setName("member").setDescription("The criminally down bad target.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The charge.")
    ),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const user = interaction.options.getUser("member", true);
    const reason = interaction.options.getString("reason") ?? "unregistered thirst crimes";

    await interaction.reply(`${user} has been bonked for **${reason}**. Sentence: 30 minutes of eye contact with grass.`);
  }
};
