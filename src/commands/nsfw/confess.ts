import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { assertSafeAdultText, requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const confessCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("confess")
    .setDescription("Drop an anonymous adult anime confession.")
    .addStringOption((option) =>
      option.setName("confession").setDescription("Keep it adult-only and legal.").setRequired(true)
    ),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const confession = interaction.options.getString("confession", true);
    const unsafe = assertSafeAdultText(confession);

    if (unsafe) {
      await interaction.reply({ content: unsafe, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.reply({
      content: "Confession posted anonymously.",
      flags: MessageFlags.Ephemeral
    });
    if (interaction.channel?.isTextBased() && "send" in interaction.channel) {
      await interaction.channel.send(`**Anonymous confession:** ${confession}`);
    }
  }
};
