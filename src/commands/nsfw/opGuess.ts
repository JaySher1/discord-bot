import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";
import { openingQuestions } from "../../data/animePrompts.js";
import { replyAndFetchMessage } from "../../lib/interactionResponses.js";
import { requireNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const opGuessCommand: SlashCommand = {
  category: "NSFW",
  data: new SlashCommandBuilder()
    .setName("opguess")
    .setDescription("Guess the anime opening from a cursed hint."),
  async execute(interaction) {
    if (!(await requireNsfwChannel(interaction))) return;

    const question = openingQuestions[Math.floor(Math.random() * openingQuestions.length)];

    if (!question) {
      await interaction.reply("No opening questions are loaded yet.");
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      question.choices.map((choice, index) =>
        new ButtonBuilder().setCustomId(`op:${interaction.id}:${index}`).setLabel(choice).setStyle(ButtonStyle.Secondary)
      )
    );
    const response = await replyAndFetchMessage(interaction, { content: `**Opening hint:** ${question.hint}`, components: [row] });

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
