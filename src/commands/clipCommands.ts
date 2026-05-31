import { clipCommand, executeClipCommand } from "./clip/clip.js";
import type { ClipRecorder } from "../services/clipRecorder.js";
import type {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from "discord.js";

type ClipCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type ClipCommand = {
  data: ClipCommandData;
  execute: (
    interaction: ChatInputCommandInteraction,
    client: Client,
    recorder: ClipRecorder
  ) => Promise<void>;
};

export const clipCommands: ClipCommand[] = [
  {
    data: clipCommand,
    execute: executeClipCommand
  }
];
