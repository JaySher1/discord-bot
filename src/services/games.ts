export type RpsChoice = "rock" | "paper" | "scissors";

const outcomes: Record<RpsChoice, RpsChoice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper"
};

export function rollDice(sides: number, count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

export function playRps(playerChoice: RpsChoice): {
  botChoice: RpsChoice;
  result: "win" | "lose" | "tie";
} {
  const choices = Object.keys(outcomes) as RpsChoice[];
  const botChoice = choices[Math.floor(Math.random() * choices.length)] ?? "rock";

  if (botChoice === playerChoice) {
    return { botChoice, result: "tie" };
  }

  return {
    botChoice,
    result: outcomes[playerChoice] === botChoice ? "win" : "lose"
  };
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
