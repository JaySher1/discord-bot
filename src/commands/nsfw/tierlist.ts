import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder
} from "discord.js";
import { getDb, nowIso } from "../../services/database.js";
import { assertSafeAdultText, requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

function optionLine(name: string, votes: number): string {
  return `**${name}** - ${votes} vote(s)`;
}

export const tierlistCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("tierlist")
    .setDescription("Vote on the hottest adult anime character from a short list.")
    .addStringOption((option) =>
      option.setName("option1").setDescription("Adult character option 1.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("option2").setDescription("Adult character option 2.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("option3").setDescription("Adult character option 3.")
    )
    .addStringOption((option) =>
      option.setName("option4").setDescription("Adult character option 4.")
    ),
  async execute(interaction) {
    if (!interaction.guildId || !(await requireNsfwChannel(interaction))) {
      return;
    }

    const options = ["option1", "option2", "option3", "option4"]
      .map((name) => interaction.options.getString(name))
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim());
    const unsafe = options.map(assertSafeAdultText).find(Boolean);

    if (unsafe) {
      await interaction.reply({ content: unsafe, flags: MessageFlags.Ephemeral });
      return;
    }

    const tierId = crypto.randomUUID();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      options.map((name, index) =>
        new ButtonBuilder()
          .setCustomId(`tier:${tierId}:${index}`)
          .setLabel(name.slice(0, 80))
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const embed = new EmbedBuilder()
      .setTitle("Hottest Adult Anime Character Vote")
      .setDescription(options.map((name) => optionLine(name, 0)).join("\n"))
      .setFooter({ text: "Vote once. Results update for 60 seconds." })
      .setTimestamp();

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000
    });

    collector.on("collect", async (button) => {
      const selectedIndex = Number(button.customId.split(":").at(-1));
      const selected = options[selectedIndex];

      if (!selected || !interaction.guildId) {
        await button.reply({ content: "That vote option no longer exists.", flags: MessageFlags.Ephemeral });
        return;
      }

      getDb()
        .prepare(
          `INSERT INTO tier_votes (guild_id, tier_id, user_id, option_name, score, created_at)
           VALUES (?, ?, ?, ?, 1, ?)
           ON CONFLICT(guild_id, tier_id, user_id)
           DO UPDATE SET option_name = excluded.option_name, created_at = excluded.created_at`
        )
        .run(interaction.guildId, tierId, button.user.id, selected, nowIso());

      const rows = getDb()
        .prepare(
          `SELECT option_name as optionName, COUNT(*) as votes
           FROM tier_votes
           WHERE guild_id = ? AND tier_id = ?
           GROUP BY option_name`
        )
        .all(interaction.guildId, tierId) as Array<{ optionName: string; votes: number }>;
      const voteMap = new Map(rows.map((row) => [row.optionName, row.votes]));

      embed.setDescription(options.map((name) => optionLine(name, voteMap.get(name) ?? 0)).join("\n"));
      await button.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", async () => {
      await interaction.editReply({ components: [] }).catch(() => undefined);
    });
  }
};
