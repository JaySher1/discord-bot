export type TriviaQuestion = {
  question: string;
  answer: string;
  choices: string[];
};

export const triviaQuestions: TriviaQuestion[] = [
  {
    question: "Which planet is known as the Red Planet?",
    answer: "Mars",
    choices: ["Mars", "Venus", "Jupiter", "Mercury"]
  },
  {
    question: "What does CPU stand for?",
    answer: "Central Processing Unit",
    choices: [
      "Central Processing Unit",
      "Computer Power Utility",
      "Core Program Unit",
      "Control Processing User"
    ]
  },
  {
    question: "How many sides does a hexagon have?",
    answer: "Six",
    choices: ["Five", "Six", "Seven", "Eight"]
  },
  {
    question: "Which ocean is the largest on Earth?",
    answer: "Pacific Ocean",
    choices: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"]
  },
  {
    question: "In Discord, what are slash commands prefixed with?",
    answer: "/",
    choices: ["/", "!", "#", "$"]
  }
];
