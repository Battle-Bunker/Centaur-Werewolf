/**
 * Table-wide rule variants. Each is a room setting the host sets in the lobby (`setup.setRule`), shown to every player
 * in the app and over MCP, and described in the rules text for that table. Defaults are the recommended rules of
 * docs/design/synthesis.md; `LEGACY_RULES` turns the new table rules off, for control arms in play-tests.
 *
 * Nothing here imports anything: the engine, the registry and the server all read these definitions.
 */

export interface Rules {
  /** R1: the Centaurs win only if more Werewolves than Centaurs are eliminated. Off: any Werewolf eliminated wins. */
  bloodPrice: boolean;
  /** R2: what the pack learns of the centre at its turn: every role dealt there, three of them, or nothing. */
  census: "all" | "three" | "off";
  /** R3: proclamations are published together at dawn, in random order. Off: each is shown as it is made. */
  dawnProclamations: boolean;
  /** R4 reversed: a vote the game cast at random also triggers the Sporeling's curse. */
  randomVotesCurse: boolean;
  /** A bitten player is told which seat bit them. Off: only that they were bitten. */
  biteNamesBiter: boolean;
  /** When nobody holds the role the Eavesdropper names, it gets a real result of its own as if it held it. Off: nothing. */
  eavesdropGhost: boolean;
  /** The Moon-Thief may be in the deck only at tables of at least this many players. */
  thiefMinPlayers: number;
  /** A seat is eliminated only with at least this many votes (and the most votes). */
  eliminationVotes: number;
  /** Optional night steps (trade or keep, give or not, bite or not, scent or not) may not be declined. */
  mandatorySteps: boolean;
  /** Chat stays open during the vote phase. */
  chatDuringVote: boolean;
  /** How long a Hush's cut lasts, in seconds. */
  cutSeconds: number;
  /** A Hush may cut during the vote phase too (not only during discussion), and a cut may run on into it. */
  cutDuringVote: boolean;
}

export const DEFAULT_RULES: Rules = {
  bloodPrice: true,
  census: "all",
  dawnProclamations: true,
  randomVotesCurse: false,
  biteNamesBiter: true,
  eavesdropGhost: true,
  thiefMinPlayers: 7,
  eliminationVotes: 2,
  mandatorySteps: false,
  chatDuringVote: false,
  cutSeconds: 60,
  cutDuringVote: true,
};

/** The rules as they were before the defector mechanics: for control arms. */
export const LEGACY_RULES: Partial<Rules> = { bloodPrice: false, census: "off", dawnProclamations: false };

export type RuleId = keyof Rules;

interface RuleBase { id: RuleId; title: string; tooltip: string }
export type RuleDef =
  | (RuleBase & { kind: "boolean"; on: string; off: string })
  | (RuleBase & { kind: "choice"; options: { value: string; means: string }[] })
  | (RuleBase & { kind: "number"; min: number; max: number; means: (n: number) => string });

export const RULE_DEFS: RuleDef[] = [
  {
    id: "bloodPrice", kind: "boolean", title: "Blood Price", tooltip: "Whether a tie that takes down a Centaur with a Werewolf counts as a Centaur loss.",
    on: "The Centaurs win only if more Werewolves than Centaurs are eliminated: a tie that takes down a Centaur along with a Werewolf is a loss for the Centaurs.",
    off: "The Centaurs win if at least one Werewolf is eliminated, however many Centaurs fall with it.",
  },
  {
    id: "census", kind: "choice", title: "Den Census", tooltip: "What the Werewolves learn about the centre cards at their turn.",
    options: [
      { value: "all", means: "Every card of the pack (Werewolves and the cards that wake with them) learns which roles were dealt to the centre: the roles, not their positions." },
      { value: "three", means: "Every card of the pack learns three of the roles dealt to the centre, chosen at random: the roles, not their positions." },
      { value: "off", means: "The pack learns nothing about the centre." },
    ],
  },
  {
    id: "dawnProclamations", kind: "boolean", title: "Proclamations at dawn", tooltip: "Whether the Herald's proclamations are published together at dawn or as they are made.",
    on: "Every proclamation (the Herald's, and a Forger's) is published together at dawn, in random order, each marked \"Herald's turn\" and true at that moment of the night.",
    off: "The Herald's proclamation is shown to everyone during the Herald's turn.",
  },
  {
    id: "randomVotesCurse", kind: "boolean", title: "Random votes curse", tooltip: "Whether a vote the game cast at random can trigger the Sporeling's curse.",
    on: "A vote the game cast for a player who did not vote counts for the Sporeling's curse like any other.",
    off: "A vote the game cast at random never triggers the Sporeling's curse.",
  },
  {
    id: "biteNamesBiter", kind: "boolean", title: "The bitten know the Biter", tooltip: "Whether a bitten player is told which seat bit them.",
    on: "A bitten player is told which seat bit them.",
    off: "A bitten player is told only that they were bitten, not by whom.",
  },
  {
    id: "eavesdropGhost", kind: "boolean", title: "Eavesdropper's own result", tooltip: "What the Eavesdropper gets when nobody holds the role it names.",
    on: "If nobody was dealt the role the Eavesdropper names, it secretly gets a real result of its own as if it held that role (looks only, never moves), and is not told which case happened.",
    off: "If nobody was dealt the role the Eavesdropper names, it learns nothing.",
  },
  {
    id: "thiefMinPlayers", kind: "number", title: "Moon-Thief table size", tooltip: "The smallest table at which the Moon-Thief may be in the deck.", min: 3, max: 12,
    means: n => `The Moon-Thief may be in the deck only with ${n} or more players.`,
  },
  {
    id: "eliminationVotes", kind: "number", title: "Votes to eliminate", tooltip: "How many votes a player needs to be eliminated.", min: 2, max: 4,
    means: n => `The player or players with the most votes are eliminated, if that is at least ${n} votes; otherwise nobody is.`,
  },
  {
    id: "mandatorySteps", kind: "boolean", title: "Mandatory night steps", tooltip: "Whether optional night steps (trade, give, bite, scent) may be declined.",
    on: "Every night step must be done: nobody may decline a trade, a gift, a bite or a scent. Cards are sure to move wherever a role can move them.",
    off: "Optional night steps (trade or keep, give or not, bite or not, scent or not) may be declined.",
  },
  {
    id: "chatDuringVote", kind: "boolean", title: "Chat during the vote", tooltip: "Whether chat stays open during the vote phase.",
    on: "Chat stays open during the vote phase.", off: "Chat closes when the vote phase begins.",
  },
  {
    id: "cutSeconds", kind: "number", title: "Hush cut length", tooltip: "How long a Hush's cut lasts.", min: 15, max: 180,
    means: n => `A Hush's cut lasts ${n} seconds.`,
  },
  {
    id: "cutDuringVote", kind: "boolean", title: "Hush during the vote", tooltip: "Whether a Hush may cut during the vote phase, and a cut may run on into it.",
    on: "A Hush may cut during discussion or the vote phase, and a cut may run on into the vote.",
    off: "A Hush may cut only during discussion, and a cut ends when the vote phase begins.",
  },
];
export const RULE_DEF: Record<RuleId, RuleDef> = Object.fromEntries(RULE_DEFS.map(r => [r.id, r])) as Record<RuleId, RuleDef>;

/** Stored settings may predate a rule or hold junk: fill in the defaults and drop what is not valid. */
export function rulesOf(stored: Partial<Record<string, unknown>> | undefined | null): Rules {
  const out = { ...DEFAULT_RULES } as Record<RuleId, unknown>;
  for (const def of RULE_DEFS) {
    const v = stored?.[def.id];
    if (ruleValueProblem(def.id, v) === null) out[def.id] = v;
  }
  return out as unknown as Rules;
}

/** Why a value is not valid for a rule, or null. */
export function ruleValueProblem(id: string, value: unknown): string | null {
  const def = RULE_DEF[id as RuleId];
  if (!def) return `There is no rule ${id}.`;
  if (def.kind === "boolean") return typeof value === "boolean" ? null : `${def.title} is on or off: true or false.`;
  if (def.kind === "choice") return def.options.some(o => o.value === value) ? null : `${def.title} is one of ${def.options.map(o => JSON.stringify(o.value)).join(", ")}.`;
  return typeof value === "number" && Number.isInteger(value) && value >= def.min && value <= def.max ? null : `${def.title} is a whole number from ${def.min} to ${def.max}.`;
}

/** One sentence per rule, for players and models: what it is set to and what that means at this table. */
export function describeRules(rules: Rules): { rule: RuleId; title: string; value: Rules[RuleId]; isDefault: boolean; means: string }[] {
  return RULE_DEFS.map(def => {
    const value = rules[def.id];
    const means = def.kind === "boolean" ? (value ? def.on : def.off) : def.kind === "choice" ? def.options.find(o => o.value === value)!.means : def.means(value as number);
    return { rule: def.id, title: def.title, value, isDefault: value === DEFAULT_RULES[def.id], means };
  });
}
