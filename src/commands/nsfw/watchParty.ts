import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const watchPartyCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("watchparty")
    .setDescription("Schedule an anime watch party.")
    .addStringOption((option) => option.setName("title").setDescription("Anime title.").setRequired(true))
    .addStringOption((option) => option.setName("time").setDescription("When it starts.").setRequired(true)),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const title = interaction.options.getString("title", true);
    const time = interaction.options.getString("time", true);
    const embed = new EmbedBuilder()
      .setTitle("Watch Party")
      .setDescription(`**${title}**\nStarts: **${time}**\nReact if you are showing up.`)
      .setTimestamp();

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    await message.react("✅");
    await message.react("👀");
  }
};
