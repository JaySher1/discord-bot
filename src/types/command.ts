import type {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from "discord.js";

export type CommandCategory = "Admin" | "Moderation" | "Utility" | "Games" | "Music" | "NSFW";

export type CommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type SlashCommand = {
  category: CommandCategory;
  data: CommandData;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
};
