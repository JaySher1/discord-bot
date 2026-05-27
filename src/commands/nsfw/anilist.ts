import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

type AniListResponse = {
  data?: {
    Media?: {
      title?: { romaji?: string; english?: string };
      description?: string;
      siteUrl?: string;
      episodes?: number;
      averageScore?: number;
      genres?: string[];
    };
  };
};

export const anilistCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("anilist")
    .setDescription("Search AniList for anime info.")
    .addStringOption((option) => option.setName("query").setDescription("Anime title.").setRequired(true)),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    await interaction.deferReply();

    const query = interaction.options.getString("query", true);
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `query ($search: String) {
          Media(search: $search, type: ANIME) {
            title { romaji english }
            description(asHtml: false)
            siteUrl
            episodes
            averageScore
            genres
          }
        }`,
        variables: { search: query }
      })
    });

    if (!response.ok) {
      await interaction.editReply("AniList did not respond cleanly. Try again later.");
      return;
    }

    const data = (await response.json()) as AniListResponse;
    const media = data.data?.Media;

    if (!media) {
      await interaction.editReply("No anime found.");
      return;
    }

    const description = (media.description ?? "No description available.")
      .replace(/<[^>]*>/g, "")
      .slice(0, 700);
    const embed = new EmbedBuilder()
      .setTitle(media.title?.english ?? media.title?.romaji ?? query)
      .setURL(media.siteUrl ?? null)
      .setDescription(description)
      .addFields(
        { name: "Episodes", value: `${media.episodes ?? "Unknown"}`, inline: true },
        { name: "Score", value: media.averageScore ? `${media.averageScore}/100` : "Unknown", inline: true },
        { name: "Genres", value: media.genres?.join(", ") || "Unknown" }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};
