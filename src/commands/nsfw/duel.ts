import { SlashCommandBuilder } from "discord.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

const moves = ["forbidden nosebleed technique", "waifu discourse beam", "plot armor parry", "beach episode counter"];

export const duelCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("duel")
    .setDescription("Challenge another member to a deeply unserious anime duel.")
    .addUserOption((option) => option.setName("member").setDescription("Opponent.").setRequired(true)),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const opponent = interaction.options.getUser("member", true);
    const challengerMove = moves[Math.floor(Math.random() * moves.length)] ?? moves[0];
    const opponentMove = moves[Math.floor(Math.random() * moves.length)] ?? moves[1];
    const winner = Math.random() > 0.5 ? interaction.user : opponent;

    await interaction.reply(
      `${interaction.user} uses **${challengerMove}**.\n${opponent} answers with **${opponentMove}**.\nWinner: ${winner}.`
    );
  }
};
