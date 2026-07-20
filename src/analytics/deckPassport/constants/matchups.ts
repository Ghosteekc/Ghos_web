export interface ArchetypeMatchups {
  strong: string[];
  weak: string[];
}

export const ARCHETYPE_MATCHUPS: Record<string, ArchetypeMatchups> = {
  "Log Bait": {
    strong: ["Bridge Spam", "Royal Hogs", "Cycle"],
    weak: ["Graveyard", "Lava", "Beatdown"],
  },
  Cycle: {
    strong: ["Beatdown", "Lava", "Siege"],
    weak: ["Log Bait", "Bridge Spam", "Royal Giant"],
  },
  Beatdown: {
    strong: ["Log Bait", "Siege", "Control"],
    weak: ["Cycle", "Bridge Spam", "Lava"],
  },
  Control: {
    strong: ["Cycle", "Bridge Spam", "Royal Hogs"],
    weak: ["Beatdown", "Lava", "Royal Giant"],
  },
  "Bridge Spam": {
    strong: ["Cycle", "Siege", "Log Bait"],
    weak: ["Beatdown", "Royal Giant", "Control"],
  },
  Lava: {
    strong: ["Beatdown", "Siege", "Royal Giant"],
    weak: ["Cycle", "Bridge Spam", "Control"],
  },
  "Royal Giant": {
    strong: ["Cycle", "Log Bait", "Bridge Spam"],
    weak: ["Beatdown", "Lava", "Control"],
  },
  Graveyard: {
    strong: ["Log Bait", "Cycle", "Bridge Spam"],
    weak: ["Beatdown", "Royal Giant", "Control"],
  },
  Siege: {
    strong: ["Beatdown", "Royal Giant"],
    weak: ["Cycle", "Bridge Spam", "Log Bait"],
  },
  "Fireball Bait": {
    strong: ["Bridge Spam", "Cycle"],
    weak: ["Graveyard", "Lava", "Beatdown"],
  },
  "Split Lane": {
    strong: ["Control", "Siege"],
    weak: ["Beatdown", "Lava", "Splashyard"],
  },
  Meta: {
    strong: ["Cycle", "Log Bait"],
    weak: ["Beatdown", "Lava", "Bridge Spam"],
  },
};
