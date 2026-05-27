import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import { releaseWaifu } from "../../services/waifuStore.js";
import type { SlashCommand } from "../../types/command.js";

export const releaseCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release one of your claimed waifus.")
    .addStringOption((option) =>
      option.setName("waifu_id").setDescription("The waifu ID from /collection.").setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) {
      return;
    }

    const waifuId = interaction.options.getString("waifu_id", true);
    const released = releaseWaifu(interaction.guildId, interaction.user.id, waifuId);

    await interaction.reply({
      content: released
        ? `Released **${waifuId}**. The streets remember.`
        : `You do not own **${waifuId}**, so there is nothing to release.`,
      flags: released ? undefined : MessageFlags.Ephemeral
    });
  }
};
