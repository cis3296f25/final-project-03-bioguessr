// bioguessr-client/src/arenaAugments.js

// Arena augments.
// Each augment has:
// - id: unique string
// - name: display name
// - rarity: "common" | "rare" | "epic" | "legendary"
// - description: shown in the UI

export const AUGMENTS = [
  {
    id: "safe_guard",
    name: "Safety Net",
    rarity: "common",
    description:
      "Next 4 questions: wrong answers deal no HP damage, but you earn 30% fewer points.",
  },
  {
    id: "blood_pact",
    name: "Blood Pact",
    rarity: "rare",
    description:
      "Lose 3 HP immediately to permanently double your score gains (x2).",
  },
  {
    id: "flurry_gambit",
    name: "Flurry Gambit",
    rarity: "rare",
    description:
      "Next 4 questions: earn 20% more points, but wrong answers deal 2 HP damage.",
  },
  {
    id: "hearty",
    name: "Hearty",
    rarity: "common",
    description:
      "Gain 5 HP now, but you earn 20% fewer points for the rest of the game.",
  },

  // 🔹 Defensive / utility augments

  {
    id: "shielded_shell",
    name: "Shielded Shell",
    rarity: "common",
    description:
      "For the next 4 questions: wrong answers deal half HP damage, and you earn 25% fewer points.",
  },
  {
    id: "leech_vines",
    name: "Leech Vines",
    rarity: "rare",
    description:
      "Next 4 questions: each correct answer heals 1 HP, but you earn 25% fewer points.",
  },
  {
    id: "clairvoyance",
    name: "Clairvoyance",
    rarity: "epic",
    description:
      "Next 3 questions: the common name is revealed early, but you earn 20% fewer points.",
  },

  // 🔹 LEGENDARY AUGMENTS

  {
    id: "last_life_lens",
    name: "Last Life Lens",
    rarity: "legendary",
    description:
      "Set your HP to 1 permanently and zoom the image in, but triple all score gains for the rest of the game.",
  },
  {
    id: "phantom_shroud",
    name: "Phantom Shroud",
    rarity: "legendary",
    description:
      "For the rest of the game the animal image is heavily blurred, but you gain 2.5x points.",
  },
  {
    id: "eternal_flurry",
    name: "Eternal Flurry",
    rarity: "legendary",
    description:
      "Permanent Flurry Gambit: for the rest of the game, you earn 20% more points but wrong answers deal 2 HP damage.",
  },

  // 🔹 DUEL AUGMENT (designed for future 4-man lobbies)

  {
    id: "duel_flurry",
    name: "Duel Flurry",
    rarity: "epic",
    description:
      "Arm a one-question duel. In future 4-player lobbies this will challenge the top HP rival. For now: on your next guess, if you are correct you gain triple points; if you are wrong you lose half of your current HP.",
  },
];
