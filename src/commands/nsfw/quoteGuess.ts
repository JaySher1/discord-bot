import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";
import { quoteQuestions } from "../../data/animePrompts.js";
import { replyAndFetchMessage } from "../../lib/interactionResponses.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const quoteGuessCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("quoteguess")
    .setDescription("Guess the anime character from a quote."),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const question = quoteQuestions[Math.floor(Math.random() * quoteQuestions.length)];

    if (!question) {
      await interaction.reply("No quote questions are loaded yet.");
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      question.choices.map((choice, index) =>
        new ButtonBuilder().setCustomId(`quote:${interaction.id}:${index}`).setLabel(choice).setStyle(ButtonStyle.Secondary)
      )
    );
    const response = await replyAndFetchMessage(interaction, { content: `**Who said it?** "${question.quote}"`, components: [row] });

    try {
      const selected = await response.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 30_000,
        filter: (button) => button.user.id === interaction.user.id
      });
      const answer = question.choices[Number(selected.customId.split(":").at(-1))] ?? "";
      await selected.update({
        content: answer === question.answer ? `Correct: **${question.answer}**.` : `Wrong. It was **${question.answer}**.`,
        components: []
      });
    } catch {
      await interaction.editReply({ content: `Time. It was **${question.answer}**.`, components: [] });
    }
  }
};
