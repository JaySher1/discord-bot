import type {
  BooleanCache,
  CacheType,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  Message
} from "discord.js";

export async function replyAndFetchMessage<Cached extends CacheType>(
  interaction: ChatInputCommandInteraction<Cached>,
  options: InteractionReplyOptions
): Promise<Message<BooleanCache<Cached>>> {
  await interaction.reply(options);
  return interaction.fetchReply();
}
