import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import { claimWaifu, getLastPull } from "../../services/waifuStore.js";
import type { SlashCommand } from "../../types/command.js";

export const claimCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim your latest pulled waifu as yours."),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) {
      return;
    }

    const waifu = getLastPull(interaction.guildId, interaction.user.id);

    if (!waifu) {
      await interaction.reply({
        content: "Pull a waifu with `/waifu` first. You cannot claim air, tragic as that is.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const result = claimWaifu(interaction.guildId, waifu.id, interaction.user.id);

    if (!result.ok) {
      await interaction.reply({
        content:
          result.existing.ownerId === interaction.user.id
            ? `You already own **${waifu.id}**. Possessive behavior detected.`
            : `Too slow. **${waifu.id}** already belongs to <@${result.existing.ownerId}>.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.reply(`Claimed **${waifu.id}**. She is now in your collection.`);
  }
};
