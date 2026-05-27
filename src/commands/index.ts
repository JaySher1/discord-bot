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
import { setNsfwChannelCommand } from "./admin/setNsfwChannel.js";
import { setWelcomeChannelCommand } from "./admin/setWelcomeChannel.js";
import { coinFlipCommand } from "./games/coinFlip.js";
import { diceCommand } from "./games/dice.js";
import { guessCommand } from "./games/guess.js";
import { rpsCommand } from "./games/rps.js";
import { triviaCommand } from "./games/trivia.js";
import { nowPlayingCommand } from "./music/nowplaying.js";
import { pauseCommand } from "./music/pause.js";
import { playCommand } from "./music/play.js";
import { queueCommand } from "./music/queue.js";
import { resumeCommand } from "./music/resume.js";
import { skipCommand } from "./music/skip.js";
import { stopCommand } from "./music/stop.js";
import { animeBattleCommand } from "./nsfw/animeBattle.js";
import { anilistCommand } from "./nsfw/anilist.js";
import { bonkCommand } from "./nsfw/bonk.js";
import { claimCommand } from "./nsfw/claim.js";
import { collectionCommand } from "./nsfw/collection.js";
import { confessCommand } from "./nsfw/confess.js";
import { duelCommand } from "./nsfw/duel.js";
import { goonCheckCommand } from "./nsfw/goonCheck.js";
import { hotTakeCommand } from "./nsfw/hotTake.js";
import { opGuessCommand } from "./nsfw/opGuess.js";
import { quoteGuessCommand } from "./nsfw/quoteGuess.js";
import { reactionCommand } from "./nsfw/reaction.js";
import { recommendCommand } from "./nsfw/recommend.js";
import { releaseCommand } from "./nsfw/release.js";
import { shipCommand } from "./nsfw/ship.js";
import { simpboardCommand } from "./nsfw/simpboard.js";
import { tierlistCommand } from "./nsfw/tierlist.js";
import { touchGrassCommand } from "./nsfw/touchGrass.js";
import { tradeCommand } from "./nsfw/trade.js";
import { waifuCommand } from "./nsfw/waifu.js";
import { waifuProfileCommand } from "./nsfw/waifuProfile.js";
import { watchPartyCommand } from "./nsfw/watchParty.js";
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
  setNsfwChannelCommand,
  coinFlipCommand,
  diceCommand,
  rpsCommand,
  guessCommand,
  triviaCommand,
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopCommand,
  queueCommand,
  nowPlayingCommand,
  waifuCommand,
  claimCommand,
  collectionCommand,
  tradeCommand,
  releaseCommand,
  waifuProfileCommand,
  tierlistCommand,
  bonkCommand,
  goonCheckCommand,
  simpboardCommand,
  shipCommand,
  touchGrassCommand,
  hotTakeCommand,
  confessCommand,
  reactionCommand,
  animeBattleCommand,
  opGuessCommand,
  quoteGuessCommand,
  watchPartyCommand,
  anilistCommand,
  recommendCommand,
  duelCommand
];
