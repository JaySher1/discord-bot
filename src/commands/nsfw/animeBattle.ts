import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder
} from "discord.js";
import { replyAndFetchMessage } from "../../lib/interactionResponses.js";
import { assertSafeAdultText, requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const animeBattleCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("animebattle")
    .setDescription("Make the server vote between two adult anime characters.")
    .addStringOption((option) => option.setName("first").setDescription("First adult character.").setRequired(true))
    .addStringOption((option) => option.setName("second").setDescription("Second adult character.").setRequired(true)),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const first = interaction.options.getString("first", true);
    const second = interaction.options.getString("second", true);
    const unsafe = assertSafeAdultText(`${first} ${second}`);

    if (unsafe) {
      await interaction.reply({ content: unsafe, flags: MessageFlags.Ephemeral });
      return;
    }

    const battleId = crypto.randomUUID();
    const votes = new Map<string, string>();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`battle:${battleId}:first`).setLabel(first.slice(0, 80)).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`battle:${battleId}:second`).setLabel(second.slice(0, 80)).setStyle(ButtonStyle.Danger)
    );
    const embed = new EmbedBuilder()
      .setTitle("Anime Battle")
      .setDescription(`**${first}** vs **${second}**\n\nVote for who clears.`);

    const message = await replyAndFetchMessage(interaction, { embeds: [embed], components: [row] });
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 45_000 });

    collector.on("collect", async (button) => {
      votes.set(button.user.id, button.customId.endsWith("first") ? first : second);
      const firstVotes = [...votes.values()].filter((vote) => vote === first).length;
      const secondVotes = [...votes.values()].filter((vote) => vote === second).length;
      embed.setDescription(`**${first}**: ${firstVotes}\n**${second}**: ${secondVotes}`);
      await button.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", async () => {
      await interaction.editReply({ components: [] }).catch(() => undefined);
    });
  }
};
