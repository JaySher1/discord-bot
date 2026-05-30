import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getLavalinkManager } from "../../services/lavalink.js";
import { formatDuration, formatQueueLine, formatSource } from "../../services/musicControls.js";
import type { SlashCommand } from "../../types/command.js";

const MAX_QUEUE_ITEMS = 10;

export const queueCommand = createQueueCommand("queue", "Show the current music queue.");
export const qCommand = createQueueCommand("q", "Show the current music queue.");

function createQueueCommand(name: "queue" | "q", description: string): SlashCommand {
  return {
    category: "Music",
    data: new SlashCommandBuilder().setName(name).setDescription(description),
    async execute(interaction) {
      if (!interaction.guild) {
        await interaction.reply("Use this inside a server so I can find the music queue.");
        return;
      }

      const player = getLavalinkManager().getPlayer(interaction.guild.id);
      const current = player?.queue.current;
      const upcoming = player?.queue.tracks ?? [];

      if (!current && upcoming.length === 0) {
        await interaction.reply("The music queue is empty.");
        return;
      }

      const embed = new EmbedBuilder().setTitle("Music Queue").setTimestamp();

      if (current) {
        embed.addFields({
          name: "Now Playing",
          value: truncateField(`**${current.info.title}** - ${formatDuration(current.info.duration)} from ${formatSource(
            current.info.sourceName ?? "Lavalink"
          )}`)
        });

        if (current.info.artworkUrl) {
          embed.setThumbnail(current.info.artworkUrl);
        }
      }

      if (upcoming.length > 0) {
        const visibleTracks = upcoming.slice(0, MAX_QUEUE_ITEMS).map((track, index) => formatQueueLine(track, index + 1));
        const remaining = upcoming.length - visibleTracks.length;
        embed.addFields({
          name: `Up Next (${upcoming.length})`,
          value: truncateField(`${visibleTracks.join("\n")}${remaining > 0 ? `\n...and ${remaining} more.` : ""}`)
        });
      } else {
        embed.addFields({ name: "Up Next", value: "Nothing else queued." });
      }

      await interaction.reply({ embeds: [embed] });
    }
  };
}

function truncateField(value: string): string {
  if (value.length <= 1024) {
    return value;
  }

  return `${value.slice(0, 1020)}...`;
}
