import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";
import { triviaQuestions } from "../../data/trivia.js";
import type { SlashCommand } from "../../types/command.js";

export const triviaCommand: SlashCommand = {
  category: "Games",
  data: new SlashCommandBuilder().setName("trivia").setDescription("Answer a quick trivia question."),
  async execute(interaction) {
    const questionIndex = Math.floor(Math.random() * triviaQuestions.length);
    const question = triviaQuestions[questionIndex];

    if (!question) {
      await interaction.reply("No trivia questions are loaded yet.");
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      question.choices.map((choice, index) =>
        new ButtonBuilder()
          .setCustomId(`trivia:${interaction.id}:${index}`)
          .setLabel(choice)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const response = await interaction.reply({
      content: `**Trivia:** ${question.question}`,
      components: [row],
      fetchReply: true
    });

    try {
      const selection = await response.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 30_000,
        filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id
      });
      const selectedIndex = Number(selection.customId.split(":").at(-1));
      const selectedAnswer = question.choices[selectedIndex] ?? "";
      const correct = selectedAnswer === question.answer;

      await selection.update({
        content: correct
          ? `Correct. **${question.answer}** was the answer.`
          : `Not quite. You picked **${selectedAnswer}**. The answer was **${question.answer}**.`,
        components: []
      });
    } catch {
      await interaction.editReply({
        content: `Time is up. The answer was **${question.answer}**.`,
        components: []
      });
    }
  }
};
