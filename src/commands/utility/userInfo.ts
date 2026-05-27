import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";

export const userInfoCommand: SlashCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a user.")
    .addUserOption((option) => option.setName("user").setDescription("The user to inspect.")),
  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const member = interaction.guild
      ? await interaction.guild.members.fetch(user.id).catch(() => null)
      : null;

    const embed = new EmbedBuilder()
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "User ID", value: user.id, inline: true },
        { name: "Account created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true }
      )
      .setTimestamp();

    if (member?.joinedTimestamp) {
      embed.addFields({
        name: "Joined server",
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
