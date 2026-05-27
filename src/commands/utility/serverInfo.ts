import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types/command.js";

export const serverInfoCommand: SlashCommand = {
  category: "Utility",
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Show server details."),
  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const owner = await guild.fetchOwner().catch(() => null);
    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: "Owner", value: owner ? `${owner.user.tag}` : "Unknown", inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
