import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import { getProfile } from "../../services/waifuStore.js";
import type { SlashCommand } from "../../types/command.js";

function titleFor(claims: number, trades: number): string {
  if (claims >= 20) return "Catastrophic Collector";
  if (claims >= 10) return "Down Bad Archivist";
  if (trades >= 5) return "Back-Alley Waifu Broker";
  if (claims >= 3) return "Certified Simp";
  return "Unranked Degenerate";
}

export const waifuProfileCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("waifuprofile")
    .setDescription("Show waifu economy stats for a member.")
    .addUserOption((option) => option.setName("member").setDescription("The member to inspect.")),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) {
      return;
    }

    const user = interaction.options.getUser("member") ?? interaction.user;
    const profile = getProfile(interaction.guildId, user.id);
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Waifu Profile`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Title", value: titleFor(profile.claimCount, profile.tradeCount), inline: true },
        { name: "Claims", value: `${profile.claimCount}`, inline: true },
        { name: "Trades", value: `${profile.tradeCount}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
