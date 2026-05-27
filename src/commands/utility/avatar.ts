import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";

export const avatarCommand: SlashCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a user's avatar.")
    .addUserOption((option) => option.setName("user").setDescription("The avatar owner.")),
  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const avatarUrl = user.displayAvatarURL({ size: 1024 });
    const embed = new EmbedBuilder().setTitle(`${user.tag}'s avatar`).setImage(avatarUrl);

    await interaction.reply({ embeds: [embed] });
  }
};
