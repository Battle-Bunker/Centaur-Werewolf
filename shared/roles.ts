/**
 * Role definitions for Centaur Werewolf. A role is DATA: its night behaviour is a short script of steps built from a
 * few primitive effects (look, swap, learn…), so the engine, the plan builder, the forced-random mover, the journal
 * and the post-game log all work for any role without role-specific code. Add a role by adding an entry to ROLES.
 *
 * What a role can be made of (see docs/architecture.md): night steps built from effects, `vote` modifiers applied
 * by the card held at the count, a `win` rule that is not simply the team's, and a once-per-game `chat` power.
 */

export type Team = "centaur" | "werewolf" | "lone";
export type RoleId = string;

/** A card position: a player's seat or one of the centre cards. */
export type Slot = { k: "p"; i: number } | { k: "c"; i: number };
export const slotKey = (s: Slot) => `${s.k}${s.i}`;
export const sameSlot = (a: Slot, b: Slot) => a.k === b.k && a.i === b.i;
/** How many cards lie face down in the centre: a room setting. */
export const CENTER_MIN = 3, CENTER_MAX = 6, CENTER_DEFAULT = 3;
/** The size of a table: how many seats and how many centre cards. */
export interface Shape { players: number; center: number }

/** Where a step's targets may be picked from. `cw`: the seat clockwise of the actor. */
export type Pool = "self" | "others" | "center" | "cw";

/**
 * A slot named relative to the actor: themselves, the nth target picked in this step, the nth target picked in an
 * earlier step, or the next seat clockwise from another ref (skipping the actor).
 */
export type Ref = "self" | { pick: number } | { from: string; pick: number } | { cw: Ref };

export type Effect =
  /** The actor sees the card (or only its team) at each target. A `role` look is what later steps can branch on. */
  | { kind: "look"; targets: Ref[] | "picks"; reveal: "role" | "team" }
  /** Two cards change places. Nobody is told. */
  | { kind: "swap"; a: Ref; b: Ref }
  /** Every picked card moves one place along the picks, the last to the first. Nobody is told. */
  | { kind: "rotate" }
  /** The actor learns which other seats were dealt a role with `tag` (`limit`: only that many, chosen at random). */
  | { kind: "learnSeats"; tag: string; label: string; limit?: number }
  /** The actor learns whether their own and each neighbour's card has been moved tonight. */
  | { kind: "learnMoved"; scope: "selfAndNeighbours" }
  /** Everyone is shown what card lies at each pick right now, but not who showed it. The card stays face down. */
  | { kind: "announce" }
  /** The actor learns how many cards with `tag` are in the centre right now: a number, never which. */
  | { kind: "count"; zone: "center"; tag: string; label: string }
  /** The actor privately names a seat (or, by declining, nobody). The prophecy binds to this CARD, not to the actor. */
  | { kind: "predict" };

export interface StepDef {
  id: string;
  /** Short imperative shown on the step card: "Peek at a centre card". */
  title: string;
  /** Targets the actor chooses. Absent: nothing to choose (an automatic step, or a yes/no step when `optional`). */
  pick?: { pools: Pool[]; count: number; /** [n, count]: with n or more centre cards, pick this many instead. */ wideCenter?: [number, number] };
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
  /** Free-form labels other roles and the win rules refer to: "wolf" (counts as a Werewolf), "seer" (an information role). */
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
  /**
   * How the holder wins, when not simply with `team`.
   * dies: alone, and only by being eliminated. prophecy: alongside the winners, if the seat this card named is
   * eliminated. neighbour: with the team of the card held by the next seat clockwise.
   */
  win?: "dies" | "prophecy" | "neighbour";
  /** A once-per-game chat power of the player DEALT this card: a post the server signs, or one it strips the name from. */
  chat?: "signed" | "unsigned";
}

const look = (targets: Ref[] | "picks", reveal: "role" | "team" = "role"): Effect => ({ kind: "look", targets, reveal });
const pack: StepDef = { id: "pack", title: "Meet the pack", effects: [{ kind: "learnSeats", tag: "wolf", label: "Werewolves" }] };

export const ROLES: RoleDef[] = [
  // ── Werewolf team ──
  {
    id: "werewolf", name: "Werewolf", team: "werewolf", tags: ["wolf"], max: 3, wake: 10,
    blurb: "Knows the pack. A lone wolf scents one player's team.",
    rules: "You see who the other Werewolves are. If you are the only one at the table, you may scent one player and learn which team their card is on. You win if no Werewolf is eliminated.",
    steps: [pack, { id: "scent", title: "Lone wolf: scent a player", onlyIfAlone: "wolf", optional: true, skipLabel: "Don't scent", pick: { pools: ["others"], count: 1 }, effects: [look("picks", "team")] }],
  },
  {
    id: "tracker", name: "Tracker", team: "werewolf", tags: ["wolf"], max: 1, wake: 15,
    blurb: "A Werewolf who is also told where one information role sits.",
    rules: "You are a Werewolf: you see the pack and they see you. You are also told the seat of one player dealt an information role (Sage, Herald or Herder), chosen at random. You win if no Werewolf is eliminated.",
    steps: [pack, { id: "track", title: "Pick up a trail", effects: [{ kind: "learnSeats", tag: "seer", label: "An information role", limit: 1 }] }],
  },
  {
    id: "whisperer", name: "Whisperer", team: "werewolf", tags: [], max: 1, wake: 20,
    blurb: "A human ally of the wolves who is told one Werewolf's name.",
    rules: "You are not a Werewolf, but you side with them. You are told one Werewolf, chosen at random; they do not know you. You win when the Werewolves win, even if you are eliminated.",
    steps: [{ id: "whisper", title: "Hear a name", effects: [{ kind: "learnSeats", tag: "wolf", label: "A Werewolf", limit: 1 }] }],
  },
  {
    id: "spooker", name: "Spooker", team: "werewolf", tags: [], max: 1, wake: 55,
    blurb: "A wolf ally who stampedes three cards around, unseen.",
    rules: "You are not a Werewolf, but you side with them. Choose three cards other than your own, from players or the centre. The first goes to the second's place, the second to the third's, the third to the first's. You look at none of them. You win when the Werewolves win.",
    steps: [{ id: "stampede", title: "Stampede three cards", pick: { pools: ["others", "center"], count: 3 }, effects: [{ kind: "rotate" }] }],
  },
  {
    id: "forger", name: "Forger", team: "werewolf", tags: [], max: 1, chat: "unsigned",
    blurb: "A wolf ally who may post one unsigned message during the day.",
    rules: "You are not a Werewolf, but you side with them. You do nothing at night. Once during the day you may post a message with no name on it. Who sent it is shown only after the game. You win when the Werewolves win.",
  },
  // ── Centaur team ──
  {
    id: "sage", name: "Sage", team: "centaur", tags: ["seer"], max: 1, wake: 30,
    blurb: "Reads one other player's card.",
    rules: "Look at one other player's card.",
    steps: [{ id: "read", title: "Read a player's card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] }],
  },
  {
    id: "centaur", name: "Centaur", team: "centaur", tags: [], max: 4, wake: 35,
    blurb: "Looks at one centre card.",
    rules: "Look at one centre card. You win if at least one Werewolf is eliminated.",
    steps: [{ id: "glance", title: "Look at a centre card", pick: { pools: ["center"], count: 1 }, effects: [look("picks")] }],
  },
  {
    id: "herald", name: "Herald", team: "centaur", tags: ["seer"], max: 1, wake: 40,
    blurb: "Shows everyone what one centre card is (two, with five or more in the centre).",
    rules: "Choose a centre card. Everyone, you included, is shown what it is at that moment, but not who showed it. With five or six centre cards you choose two. The cards stay face down and may still be moved later.",
    steps: [{ id: "proclaim", title: "Proclaim a centre card", pick: { pools: ["center"], count: 1, wideCenter: [5, 2] }, effects: [{ kind: "announce" }] }],
  },
  {
    id: "rustler", name: "Rustler", team: "centaur", tags: [], max: 1, wake: 45,
    blurb: "Peeks at a player's card, then decides whether to trade cards with them.",
    rules: "Look at one other player's card. Then decide whether to swap your card with it. If you swap, you are now on that card's team.",
    steps: [
      { id: "peek", title: "Peek at a player's card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] },
      { id: "trade", title: "Trade cards with them?", optional: true, doLabel: "Trade", skipLabel: "Keep mine", effects: [{ kind: "swap", a: "self", b: { from: "peek", pick: 0 } }] },
    ],
  },
  {
    id: "farrier", name: "Farrier", team: "centaur", tags: [], max: 1, wake: 50,
    blurb: "Peeks at a centre card, then may shoe themselves or the next seat clockwise with it.",
    rules: "Look at one centre card. Then you may swap it with your own card or with the card of the player clockwise of you.",
    steps: [
      { id: "peek", title: "Peek at a centre card", pick: { pools: ["center"], count: 1 }, effects: [look("picks")] },
      { id: "shoe", title: "Give that card to…", optional: true, skipLabel: "Nobody", pick: { pools: ["self", "cw"], count: 1 }, effects: [{ kind: "swap", a: { from: "peek", pick: 0 }, b: { pick: 0 } }] },
    ],
  },
  {
    id: "herder", name: "Herder", team: "centaur", tags: ["seer"], max: 1, wake: 80,
    blurb: "After the cards have moved, counts the Werewolves in the centre.",
    rules: "Late in the night, you learn how many Werewolf cards are in the centre at that moment: a number, not which ones.",
    steps: [{ id: "tally", title: "Count the strays", effects: [{ kind: "count", zone: "center", tag: "wolf", label: "Werewolf cards in the centre" }] }],
  },
  {
    id: "sentry", name: "Sentry", team: "centaur", tags: [], max: 1, wake: 90,
    blurb: "At the end of the night, learns whether their own or their neighbours' cards were moved.",
    rules: "You wake last. You learn whether your card, and the card of the player on each side of you, was moved during the night.",
    steps: [{ id: "watch", title: "Check the watch", effects: [{ kind: "learnMoved", scope: "selfAndNeighbours" }] }],
  },
  {
    id: "chiron", name: "Chiron", team: "centaur", tags: [], max: 1,
    blurb: "Their vote counts twice.",
    rules: "You do nothing at night. Whoever holds this card when the votes are counted has a vote that counts twice.",
    vote: { weight: 2 },
  },
  {
    id: "sagittarius", name: "Sagittarius", team: "centaur", tags: [], max: 1,
    blurb: "If eliminated, takes down the player they voted for.",
    rules: "You do nothing at night. If whoever holds this card is eliminated, the player they voted for is eliminated too.",
    vote: { takesTargetDown: true },
  },
  {
    id: "signet", name: "Signet", team: "centaur", tags: [], max: 1, chat: "signed",
    blurb: "May post one message the table knows came from the player dealt Signet.",
    rules: "You do nothing at night. Once during the day you may post a message that the game itself marks as sent by the player who was dealt Signet. It proves the card you were dealt, not the card you hold now.",
  },
  // ── Alone ──
  {
    id: "augur", name: "Augur", team: "lone", tags: [], max: 1, wake: 70, win: "prophecy",
    blurb: "Names who will be eliminated. Whoever holds this card at the end wins if the prophecy comes true.",
    rules: "Privately name one player, yourself included, or nobody. The prophecy stays with this card: whoever holds it when the votes are counted wins if exactly that happens (the named player is eliminated, or nobody is). They win alongside whichever team wins. If the card is moved, its new holder is not told the prophecy.",
    steps: [{ id: "foretell", title: "Foretell who will be eliminated", optional: true, skipLabel: "Nobody", pick: { pools: ["self", "others"], count: 1 }, effects: [{ kind: "predict" }] }],
  },
  {
    id: "hybrid", name: "Hybrid", team: "lone", tags: [], max: 1, win: "neighbour",
    blurb: "On the team of whatever card the next seat clockwise holds at the end.",
    rules: "You do nothing at night. Whoever holds this card at the end is on the team of the card held by the player clockwise of them, and wins or loses with that team. If that card is one that wins alone, they are a Centaur.",
  },
];

export const ROLE: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map(r => [r.id, r]));
export const roleName = (id: RoleId) => ROLE[id]?.name ?? id;
export const TEAM_NAME: Record<Team, string> = { centaur: "Centaur team", werewolf: "Werewolf team", lone: "Alone" };

/** Roles that take a night turn, in wake order. */
export const NIGHT_ROLES = ROLES.filter(r => r.steps && r.wake !== undefined).sort((a, b) => a.wake! - b.wake!);

/** The step whose `role` look a later step can branch on: the nearest earlier step that looks at a card's role. */
export function condSource(role: RoleDef, stepId: string): StepDef | undefined {
  const steps = role.steps ?? [];
  const at = steps.findIndex(s => s.id === stepId);
  for (let i = at - 1; i >= 0; i--) if (steps[i].effects.some(e => e.kind === "look" && e.reveal === "role")) return steps[i];
  return undefined;
}

/** How many targets a step takes at a table of this shape. */
export const pickCount = (step: StepDef, shape: Shape) => (!step.pick ? 0 : step.pick.wideCenter && shape.center >= step.pick.wideCenter[0] ? step.pick.wideCenter[1] : step.pick.count);

/** A sensible deck for a table: wolves and their allies scale with its size, the rest mixes information, movement and vote roles. */
export function recommendedDeck(players: number, center: number = CENTER_DEFAULT): RoleId[] {
  const order = ["werewolf", "werewolf", "sage", "rustler", "centaur", "farrier", "herald", "sentry", "centaur", "herder", "whisperer", "chiron", "augur", "spooker", "sagittarius", "centaur", "tracker", "hybrid"];
  return order.slice(0, Math.min(order.length, players + center));
}
