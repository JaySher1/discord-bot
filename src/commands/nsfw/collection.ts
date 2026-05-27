import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import { countCollection, getCollection } from "../../services/waifuStore.js";
import type { SlashCommand } from "../../types/command.js";

export const collectionCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("collection")
    .setDescription("Show a member's claimed waifu collection.")
    .addUserOption((option) =>
      option.setName("member").setDescription("Whose collection to inspect.")
    )
    .addIntegerOption((option) =>
      option.setName("page").setDescription("Collection page.").setMinValue(1)
    ),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) {
      return;
    }

    const user = interaction.options.getUser("member") ?? interaction.user;
    const page = interaction.options.getInteger("page") ?? 1;
    const pageSize = 5;
    const total = countCollection(interaction.guildId, user.id);
    const collection = getCollection(interaction.guildId, user.id, pageSize, (page - 1) * pageSize);

    if (collection.length === 0) {
      await interaction.reply({
        content: `${user} has no claimed waifus yet.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Waifu Collection`)
      .setDescription(
        collection
          .map((waifu, index) => {
            const number = (page - 1) * pageSize + index + 1;
            return `**${number}. ${waifu.id}**\nClaimed <t:${Math.floor(new Date(waifu.claimedAt).getTime() / 1000)}:R>\n${waifu.url}`;
          })
          .join("\n\n")
      )
      .setFooter({ text: `Page ${page} • ${total} total claim(s)` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
