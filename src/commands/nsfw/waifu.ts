import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import { fetchAdultWaifu } from "../../services/waifuApi.js";
import { getClaim, rememberLastPull, saveWaifu } from "../../services/waifuStore.js";
import type { SlashCommand } from "../../types/command.js";

export const waifuCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("waifu")
    .setDescription("Pull a random adult waifu card from the forbidden shelf."),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) {
      return;
    }

    await interaction.deferReply();

    const image = await fetchAdultWaifu();
    const waifu = saveWaifu(image);
    rememberLastPull(interaction.guildId, interaction.user.id, waifu.id);

    const claim = getClaim(interaction.guildId, waifu.id);
    const embed = new EmbedBuilder()
      .setTitle(`Waifu Pull: ${waifu.id}`)
      .setDescription(
        claim
          ? `Already claimed by <@${claim.ownerId}>. If you want her, bring a trade offer.`
          : "Unclaimed. Use `/claim` if you want to lock this one into your collection."
      )
      .setImage(waifu.url)
      .addFields(
        { name: "Tags", value: waifu.tags.slice(0, 8).join(", ") || "waifu", inline: true },
        { name: "Source", value: waifu.source ?? "Unknown", inline: true }
      )
      .setFooter({ text: "Adult-only filtered. Unsafe tags are blocked before posting." })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
