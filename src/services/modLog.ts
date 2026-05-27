import {
  Colors,
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type User
} from "discord.js";
import { getGuildConfig } from "./configStore.js";

type ModLogInput = {
  guild: Guild;
  action: string;
  moderator: User;
  target?: User | GuildMember;
  reason?: string | null;
  details?: string;
};

function getTargetName(target?: User | GuildMember): string {
  if (!target) {
    return "No target";
  }

  return "user" in target ? `${target.user.tag} (${target.id})` : `${target.tag} (${target.id})`;
}

export async function sendModLog(input: ModLogInput): Promise<void> {
  const config = await getGuildConfig(input.guild.id);

  if (!config.logChannelId) {
    return;
  }

  const channel = await input.guild.channels.fetch(config.logChannelId).catch(() => null);

  if (!channel?.isTextBased() || !("send" in channel)) {
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(input.action)
    .addFields(
      { name: "Moderator", value: `${input.moderator.tag} (${input.moderator.id})` },
      { name: "Target", value: getTargetName(input.target) },
      { name: "Reason", value: input.reason || "No reason provided" }
    )
    .setTimestamp();

  if (input.details) {
    embed.addFields({ name: "Details", value: input.details });
  }

  await channel.send({ embeds: [embed] });
}
