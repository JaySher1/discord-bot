import { avatarCommand } from "./utility/avatar.js";
import { helpCommand } from "./utility/help.js";
import { pollCommand } from "./utility/poll.js";
import { serverInfoCommand } from "./utility/serverInfo.js";
import { userInfoCommand } from "./utility/userInfo.js";
import { banCommand } from "./moderation/ban.js";
import { kickCommand } from "./moderation/kick.js";
import { purgeCommand } from "./moderation/purge.js";
import { timeoutCommand } from "./moderation/timeout.js";
import { untimeoutCommand } from "./moderation/untimeout.js";
import { warnCommand } from "./moderation/warn.js";
import { setLogChannelCommand } from "./admin/setLogChannel.js";
import { setWelcomeChannelCommand } from "./admin/setWelcomeChannel.js";
import { coinFlipCommand } from "./games/coinFlip.js";
import { diceCommand } from "./games/dice.js";
import { guessCommand } from "./games/guess.js";
import { rpsCommand } from "./games/rps.js";
import { triviaCommand } from "./games/trivia.js";
import type { SlashCommand } from "../types/command.js";

export const commands: SlashCommand[] = [
  helpCommand,
  serverInfoCommand,
  userInfoCommand,
  avatarCommand,
  pollCommand,
  kickCommand,
  banCommand,
  timeoutCommand,
  untimeoutCommand,
  warnCommand,
  purgeCommand,
  setWelcomeChannelCommand,
  setLogChannelCommand,
  coinFlipCommand,
  diceCommand,
  rpsCommand,
  guessCommand,
  triviaCommand
];
