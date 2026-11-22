/**
 * Role definitions for Centaur Werewolf. A role is DATA: its night behaviour is a short script of steps built from a
 * few primitive effects (look, swap, learn…), so the engine, the plan builder, the forced-random mover, the journal
 * and the post-game log all work for any role without role-specific code. Add a role by adding an entry to ROLES.
 *
 * Extension points already in the model (see docs/architecture.md):
 *  - new Effect kinds (reveal a card to everyone, place a token, adopt another role's script);
 *  - `vote` modifiers (weight, protect the voted player, drag the voted player down on death);
 *  - `win` overrides for roles that do not simply win with their team.
 */

export type Team = "village" | "werewolf" | "lone";
export type RoleId = string;

/** A card position: a player's seat or one of the centre cards. */
export type Slot = { k: "p"; i: number } | { k: "c"; i: number };
export const slotKey = (s: Slot) => `${s.k}${s.i}`;
export const sameSlot = (a: Slot, b: Slot) => a.k === b.k && a.i === b.i;
export const CENTER_CARDS = 3;

/** Where a step's targets may be picked from. */
export type Pool = "self" | "others" | "center";

/**
 * A slot named relative to the actor: themselves, the nth target picked in this step, the nth target picked in an
 * earlier step, or the next seat clockwise from another ref (skipping the actor).
 */
export type Ref = "self" | { pick: number } | { from: string; pick: number } | { cw: Ref };

export type Effect =
  /** The actor sees the card (or only its team) at each target. A `role` look is what later steps can branch on. */
  | { kind: "look"; targets: Ref[]; reveal: "role" | "team" }
  /** Two cards change places. Nobody is told. */
  | { kind: "swap"; a: Ref; b: Ref }
  /** The actor learns which other seats were dealt a role with `tag` (`limit`: only that many, chosen at random). */
  | { kind: "learnSeats"; tag: string; label: string; limit?: number }
  /** The actor learns whether their own and each neighbour's card has been moved tonight. */
  | { kind: "learnMoved"; scope: "selfAndNeighbours" };

export interface StepDef {
  id: string;
  /** Short imperative shown on the step card: "Peek at a centre card". */
  title: string;
  /** Targets the actor chooses. Absent: nothing to choose (an automatic step, or a yes/no step when `optional`). */
  pick?: { pools: Pool[]; count: number };
  /** The actor may decline the step. */
  optional?: boolean;
  doLabel?: string;
  skipLabel?: string;
  /** The step only happens when no other player was dealt a role sharing this tag (the lone wolf's step). */
  onlyIfAlone?: string;
  effects: Effect[];
}

export interface RoleDef {
  id: RoleId;
  name: string;
  team: Team;
  /** Free-form labels other roles and the win rules refer to ("wolf"). */
  tags: string[];
  /** How many copies a deck may hold. */
  max: number;
  /** One line for chips and tooltips. */
  blurb: string;
  /** The full rule, in the second person. */
  rules: string;
  /** Position in the night; absent for roles that sleep through it. */
  wake?: number;
  steps?: StepDef[];
  /** Day-vote modifiers, applied by the card a player HOLDS when the vote is counted. */
  vote?: { weight?: number; protectsTarget?: boolean; takesTargetDown?: boolean };
  /** "dies": wins alone, and only by being eliminated. */
  win?: "dies";
}

export const ROLES: RoleDef[] = [
  {
    id: "werewolf", name: "Werewolf", team: "werewolf", tags: ["wolf"], max: 3, wake: 10,
    blurb: "Knows the pack. A lone wolf scents one player's team.",
    rules: "You see who the other Werewolves are. If you are the only Werewolf at the table, you may scent one player and learn which team their card is on. You win if no Werewolf is eliminated.",
    steps: [
      { id: "pack", title: "Meet the pack", effects: [{ kind: "learnSeats", tag: "wolf", label: "Werewolves" }] },
      { id: "scent", title: "Lone wolf: scent a player", onlyIfAlone: "wolf", optional: true, skipLabel: "Don't scent", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "look", targets: [{ pick: 0 }], reveal: "team" }] },
    ],
  },
  {
    id: "whisperer", name: "Whisperer", team: "werewolf", tags: [], max: 1, wake: 20,
    blurb: "A human ally of the wolves who is told one Werewolf's name.",
    rules: "You are human, but you side with the Werewolves. You are told one Werewolf, chosen at random; they do not know you. You win when the Werewolves win, even if you are eliminated.",
    steps: [{ id: "whisper", title: "Hear a name", effects: [{ kind: "learnSeats", tag: "wolf", label: "A Werewolf", limit: 1 }] }],
  },
  {
    id: "sage", name: "Sage", team: "village", tags: ["centaur"], max: 1, wake: 30,
    blurb: "Reads one other player's card.",
    rules: "Look at one other player's card.",
    steps: [{ id: "read", title: "Read a player's card", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "look", targets: [{ pick: 0 }], reveal: "role" }] }],
  },
  {
    id: "rustler", name: "Rustler", team: "village", tags: ["centaur"], max: 1, wake: 40,
    blurb: "Peeks at a player's card, then decides whether to trade cards with them.",
    rules: "Look at one other player's card. Then decide whether to swap your card with it. If you swap, you are now on that card's team.",
    steps: [
      { id: "peek", title: "Peek at a player's card", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "look", targets: [{ pick: 0 }], reveal: "role" }] },
      { id: "trade", title: "Trade cards with them?", optional: true, doLabel: "Trade", skipLabel: "Keep mine", effects: [{ kind: "swap", a: "self", b: { from: "peek", pick: 0 } }] },
    ],
  },
  {
    id: "farrier", name: "Farrier", team: "village", tags: ["centaur"], max: 1, wake: 50,
    blurb: "Peeks at a centre card, then may shoe any player with it.",
    rules: "Look at one centre card. Then you may swap that card with any player's card, including your own.",
    steps: [
      { id: "peek", title: "Peek at a centre card", pick: { pools: ["center"], count: 1 }, effects: [{ kind: "look", targets: [{ pick: 0 }], reveal: "role" }] },
      { id: "shoe", title: "Give that card to…", optional: true, skipLabel: "Nobody", pick: { pools: ["self", "others"], count: 1 }, effects: [{ kind: "swap", a: { from: "peek", pick: 0 }, b: { pick: 0 } }] },
    ],
  },
  {
    id: "courier", name: "Courier", team: "village", tags: ["centaur"], max: 1, wake: 60,
    blurb: "Passes one player's card to the next seat clockwise, unseen.",
    rules: "Choose another player. Their card and the card of the next player clockwise from them (skipping you) change places. You do not look at either.",
    steps: [{ id: "pass", title: "Pass a player's card clockwise", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "swap", a: { pick: 0 }, b: { cw: { pick: 0 } } }] }],
  },
  {
    id: "wanderer", name: "Wanderer", team: "village", tags: [], max: 1, wake: 70,
    blurb: "Trades their card for a centre card and learns only its team.",
    rules: "Swap your card with a centre card. You learn which team your new card is on, but not which card it is.",
    steps: [{ id: "roam", title: "Trade your card for a centre card", pick: { pools: ["center"], count: 1 }, effects: [{ kind: "swap", a: "self", b: { pick: 0 } }, { kind: "look", targets: ["self"], reveal: "team" }] }],
  },
  {
    id: "sentry", name: "Sentry", team: "village", tags: ["centaur"], max: 1, wake: 90,
    blurb: "At the end of the night, learns whether their own or their neighbours' cards were moved.",
    rules: "You wake last. You learn whether your card, and the card of the player on each side of you, was moved during the night.",
    steps: [{ id: "watch", title: "Check the watch", effects: [{ kind: "learnMoved", scope: "selfAndNeighbours" }] }],
  },
  {
    id: "archer", name: "Archer", team: "village", tags: ["centaur"], max: 1,
    blurb: "Their vote counts twice.",
    rules: "You do nothing at night. Whoever holds this card when the votes are counted has a vote that counts twice.",
    vote: { weight: 2 },
  },
  {
    id: "villager", name: "Villager", team: "village", tags: [], max: 3,
    blurb: "No night action. Finds the wolves by talking.",
    rules: "You do nothing at night. You win if at least one Werewolf is eliminated.",
  },
  {
    id: "glitch", name: "Glitch", team: "lone", tags: [], max: 1, win: "dies",
    blurb: "Wins alone, and only by being eliminated.",
    rules: "You do nothing at night. You win only if you are eliminated, and then nobody else wins.",
  },
];

export const ROLE: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map(r => [r.id, r]));
export const roleName = (id: RoleId) => ROLE[id]?.name ?? id;
export const TEAM_NAME: Record<Team, string> = { village: "Village", werewolf: "Werewolf team", lone: "Alone" };

/** Roles that take a night turn, in wake order. */
export const NIGHT_ROLES = ROLES.filter(r => r.steps && r.wake !== undefined).sort((a, b) => a.wake! - b.wake!);

/** The step whose `role` look a later step can branch on: the nearest earlier step that looks at a card's role. */
export function condSource(role: RoleDef, stepId: string): StepDef | undefined {
  const steps = role.steps ?? [];
  const at = steps.findIndex(s => s.id === stepId);
  for (let i = at - 1; i >= 0; i--) if (steps[i].effects.some(e => e.kind === "look" && e.reveal === "role")) return steps[i];
  return undefined;
}

/** A sensible deck for a player count: two wolves, then information and movement roles, padded with Villagers. */
export function recommendedDeck(players: number): RoleId[] {
  const order = ["werewolf", "werewolf", "sage", "rustler", "farrier", "villager", "courier", "sentry", "wanderer", "whisperer", "archer", "villager", "glitch", "villager", "werewolf"];
  return order.slice(0, Math.min(order.length, players + CENTER_CARDS));
}
