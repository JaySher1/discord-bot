import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder
} from "discord.js";
import { replyAndFetchMessage } from "../../lib/interactionResponses.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import { cancelTrade, completeTrade, createTrade, getClaim } from "../../services/waifuStore.js";
import type { SlashCommand } from "../../types/command.js";

export const tradeCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Offer one of your waifus for one owned by another member.")
    .addUserOption((option) =>
      option.setName("member").setDescription("The member you want to trade with.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("offer").setDescription("Your offered waifu ID.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("request").setDescription("Their requested waifu ID.").setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) {
      return;
    }

    const member = interaction.options.getUser("member", true);
    const offer = interaction.options.getString("offer", true);
    const request = interaction.options.getString("request", true);

    if (member.bot || member.id === interaction.user.id) {
      await interaction.reply({
        content: "Pick another real member for the trade.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const offeredClaim = getClaim(interaction.guildId, offer);
    const requestedClaim = getClaim(interaction.guildId, request);

    if (offeredClaim?.ownerId !== interaction.user.id) {
      await interaction.reply({
        content: `You do not own **${offer}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (requestedClaim?.ownerId !== member.id) {
      await interaction.reply({
        content: `${member} does not own **${request}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const tradeId = createTrade(interaction.guildId, interaction.user.id, member.id, offer, request);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`trade:accept:${tradeId}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`trade:decline:${tradeId}`)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger)
    );

    const message = await replyAndFetchMessage(interaction, {
      content: `${member}, ${interaction.user} wants to trade **${offer}** for your **${request}**.`,
      components: [row]
    });

    try {
      const button = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 120_000,
        filter: (buttonInteraction) => buttonInteraction.user.id === member.id
      });

      if (button.customId.startsWith("trade:accept")) {
        const ok = completeTrade(tradeId);
        await button.update({
          content: ok
            ? `Trade accepted. **${offer}** and **${request}** swapped owners.`
            : "Trade failed because ownership changed before acceptance.",
          components: []
        });
        return;
      }

      cancelTrade(tradeId);
      await button.update({ content: "Trade declined.", components: [] });
    } catch {
      cancelTrade(tradeId);
      await interaction.editReply({ content: "Trade expired.", components: [] });
    }
  }
};
