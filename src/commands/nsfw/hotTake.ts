import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { replyAndFetchMessage } from "../../lib/interactionResponses.js";
import { assertSafeAdultText, requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const hotTakeCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("hottake")
    .setDescription("Post an anime hot take for the server to judge.")
    .addStringOption((option) =>
      option.setName("take").setDescription("Your terrible opinion.").setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName("anonymous").setDescription("Hide your name.")
    ),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const take = interaction.options.getString("take", true);
    const unsafe = assertSafeAdultText(take);

    if (unsafe) {
      await interaction.reply({ content: unsafe, flags: MessageFlags.Ephemeral });
      return;
    }

    const anonymous = interaction.options.getBoolean("anonymous") ?? false;
    const message = await replyAndFetchMessage(interaction, {
      content: `**Hot take from ${anonymous ? "a coward" : interaction.user}:** ${take}`,
    });

    await message.react("🔥");
    await message.react("🗑️");
  }
};
