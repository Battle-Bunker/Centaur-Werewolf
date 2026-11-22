/**
 * Role definitions for Centaur Werewolf. A role is DATA: its night behaviour is a short script of steps built from a
 * few primitive effects (look, swap, learn, mark…), so the engine, the plan builder, the forced-random mover, the
 * journal and the post-game log all work for any role without role-specific code. Add a role by adding an entry to ROLES.
 *
 * What a role can be made of (see docs/architecture.md): night steps built from effects, `vote` modifiers applied by
 * the card held at the count, a `win` rule that is not simply the team's, flags the resolution reads (`decoy`,
 * `curse`, `metamorph`), a once-per-game `chat` power and a `dayPower` of the player dealt the card.
 */

/** wild: the Wildwood creatures, who win or lose by their own rules alongside the main result. */
export type Team = "centaur" | "werewolf" | "wild";
export type RoleId = string;

/** A card position: a player's seat or one of the centre cards. */
export type Slot = { k: "p"; i: number } | { k: "c"; i: number };
export const slotKey = (s: Slot) => `${s.k}${s.i}`;
export const sameSlot = (a: Slot, b: Slot) => a.k === b.k && a.i === b.i;
/** How many cards lie face down in the centre: a room setting. */
export const CENTER_MIN = 3, CENTER_MAX = 6, CENTER_DEFAULT = 3;
/** The size of a table, and (where known) its deck: what legal choices depend on. */
export interface Shape { players: number; center: number; deck?: RoleId[] }

/** Where a step's targets may be picked from. `cw`: the seat clockwise of the actor. */
export type Pool = "self" | "others" | "center" | "cw";

/**
 * A slot named relative to the actor: themselves, the nth target picked in this step, the nth target picked in an
 * earlier step, or the next seat clockwise from another ref (skipping the actor).
 */
export type Ref = "self" | { pick: number } | { from: string; pick: number } | { cw: Ref };

export type Effect =
  /**
   * The actor sees the card (or only its team) at each target, as it is at that moment. A glamoured card shows its
   * glamour, unless the actor's dealt card is on the Werewolf team. A `role` look is what later steps can branch on.
   */
  | { kind: "look"; targets: Ref[] | "picks"; reveal: "role" | "team" }
  /** Two cards change places, carrying any glamour with them. Nobody is told. */
  | { kind: "swap"; a: Ref; b: Ref }
  /** Every picked card moves one place along the picks, the last to the first. Nobody is told. */
  | { kind: "rotate" }
  /** The actor learns which other seats were dealt a role with `tag` (`limit`: only that many, chosen at random). */
  | { kind: "learnSeats"; tag: string; label: string; limit?: number }
  /** The actor learns whether their own and each neighbour's card has been moved tonight. */
  | { kind: "learnMoved"; scope: "selfAndNeighbours" }
  /** Everyone is shown what card lies at each pick right now, but not who showed it (at dawn, with that table rule). */
  | { kind: "announce" }
  /** The actor learns how many cards with `tag` are in the centre right now: a number, never which. Sees the truth. */
  | { kind: "count"; zone: "center"; tag: string; label: string }
  /** The actor learns which roles were dealt to the centre, not where (the table's Den Census rule says how many). */
  | { kind: "census" }
  /** The picked card shows the NAMED role to every look until dawn, wherever it moves. */
  | { kind: "glamour" }
  /** The actor sees what the `by` role proclaimed tonight so far, or that nothing was. */
  | { kind: "witness"; by: RoleId }
  /** A proclamation of the NAMED role at each picked card, published as if by the `as` role, indistinguishable from its. */
  | { kind: "forge"; as: RoleId }
  /** The actor gets a copy of what the player dealt the NAMED role learned tonight, or (table rule) a ghost result. */
  | { kind: "overhear" }
  /** The player at `target` joins the Werewolf team at dawn, unless their card is already on it. Binds to the SEAT. */
  | { kind: "bite"; target: Ref }
  /** The actor's dealt card is marked with the seat at `target`; a `public` mark is shown to everyone at dawn. */
  | { kind: "mark"; target: Ref; public: boolean; label: string };

export interface StepDef {
  id: string;
  /** Short imperative shown on the step card: "Peek at a centre card". */
  title: string;
  /** Targets the actor chooses. Absent: nothing to choose (an automatic step, or a yes/no step when `optional`). */
  pick?: { pools: Pool[]; count: number; /** [n, count]: with n or more centre cards, pick this many instead. */ wideCenter?: [number, number] };
  /**
   * The actor also names a role: any role in the deck, or a role in the deck that has a night turn and does not wake
   * with the pack (and is not this one). With `pick`, the decision is a pick with a `role`; without, a `name`.
   */
  names?: "deck" | "nightNonPack";
  /** The actor may decline the step. */
  optional?: boolean;
  doLabel?: string;
  skipLabel?: string;
  /** The step only happens when no other player was dealt a role sharing this tag (the lone wolf's step). */
  onlyIfAlone?: string;
  effects: Effect[];
}

/** How the holder wins, when not simply with their team. */
export type WinRule =
  /** Wins if eliminated. */
  | "eliminated"
  /** Wins if the seat this card marked is eliminated and the holder is not. */
  | "markEliminated"
  /** Wins exactly when the seat this card marked wins. */
  | "markWins"
  /** Wins if not eliminated and no other creature is; if eliminated, no other creature wins. */
  | "keystone";

export interface RoleDef {
  id: RoleId;
  name: string;
  team: Team;
  /**
   * Free-form labels other roles and the rules refer to. wolf: counts as a Werewolf when eliminated. pack: wakes
   * knowing the other pack cards (and the census). seer: an information role (the Tracker's quarry). wild: a creature
   * (the Elderbark's map).
   */
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
  /** How the holder wins, when not simply with `team` (creature rules: a bitten holder loses them). */
  win?: WinRule;
  /** If the holder is eliminated, this card's team wins the main result, whatever else falls. */
  decoy?: boolean;
  /** Every player whose own vote went to an eliminated holder of this card loses, whatever else happens. */
  curse?: boolean;
  /** If the card dealt to this card's seat is moved during the night, that seat becomes an Imago at dawn. */
  metamorph?: boolean;
  /** A once-per-game chat power of the player DEALT this card: a post the server signs, or one it strips the name from. */
  chat?: "signed" | "unsigned";
  /** A day power of the player DEALT this card. swap: queue a swap of two other players' cards, made as the votes lock. */
  dayPower?: "swap";
}

const look = (targets: Ref[] | "picks", reveal: "role" | "team" = "role"): Effect => ({ kind: "look", targets, reveal });
/** R2: every pack card begins its turn seeing the other pack seats and the census of the centre. */
const pack: StepDef = { id: "pack", title: "Meet the pack", effects: [{ kind: "learnSeats", tag: "pack", label: "The pack" }, { kind: "census" }] };
const scent: StepDef = { id: "scent", title: "Alone: scent a player", onlyIfAlone: "pack", optional: true, skipLabel: "Don't scent", pick: { pools: ["others"], count: 1 }, effects: [look("picks", "team")] };
const PACK_RULE = "You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where).";

export const ROLES: RoleDef[] = [
  // ── Werewolf team: the pack ──
  {
    id: "werewolf", name: "Werewolf", team: "werewolf", tags: ["wolf", "pack"], max: 3, wake: 10,
    blurb: "Knows the pack and the centre's roles. Alone, scents one player's team.",
    rules: `${PACK_RULE} If no other pack card was dealt, you may also scent one player and learn which team their card is on. Your team wins by the table's win rule: no Werewolf eliminated, or (with Blood Price) no more Werewolves than Centaurs eliminated.`,
    steps: [pack, scent],
  },
  {
    id: "stalkinghorse", name: "Stalking Horse", team: "werewolf", tags: ["pack"], max: 1, wake: 11, decoy: true,
    blurb: "Wakes with the pack and knows what it knows, but is not a Werewolf. Eliminated, its team wins.",
    rules: `${PACK_RULE} If no other pack card was dealt, you may scent one player's team. You are NOT a Werewolf. If whoever holds this card is eliminated, the Werewolf team wins, even if a Werewolf falls too.`,
    steps: [pack, scent],
  },
  {
    id: "glamour", name: "Glamour", team: "werewolf", tags: ["wolf", "pack"], max: 1, wake: 12,
    blurb: "A Werewolf who disguises one card as any role until dawn.",
    rules: `You are a Werewolf. ${PACK_RULE} Then choose any one card (a player's, your own, or a centre card) and any role in the deck: until dawn, every look at that card shows the role you chose and its team, wherever the card moves. This fools reads, centre glances, proclamations and creatures' looks; the Werewolf team's own looks and the Herder's count see the truth.`,
    steps: [pack, { id: "glamour", title: "Cast a glamour", names: "deck", pick: { pools: ["self", "others", "center"], count: 1 }, effects: [{ kind: "glamour" }] }],
  },
  {
    id: "moonthief", name: "Moon-Thief", team: "werewolf", tags: ["wolf", "pack"], max: 1, wake: 13, dayPower: "swap",
    blurb: "A Werewolf who may secretly queue a swap of two other players' cards, made as the votes lock.",
    rules: `You are a Werewolf. ${PACK_RULE} During the day, if you were DEALT this card, you may secretly queue one swap of two other players' cards, and change or clear it until the votes lock. The swap happens the instant voting ends, before anything is counted: votes are weighed and every win is decided by the cards after the swap.`,
    steps: [pack],
  },
  {
    id: "tracker", name: "Tracker", team: "werewolf", tags: ["wolf", "pack"], max: 1, wake: 15,
    blurb: "A Werewolf who is also told where one information role sits.",
    rules: `You are a Werewolf. ${PACK_RULE} You are also told the seat of one player dealt an information role (Sage, Herald or Herder), chosen at random.`,
    steps: [pack, { id: "track", title: "Pick up a trail", effects: [{ kind: "learnSeats", tag: "seer", label: "An information role", limit: 1 }] }],
  },
  {
    id: "whisperer", name: "Whisperer", team: "werewolf", tags: [], max: 1, wake: 20,
    blurb: "A human ally of the wolves who is told one Werewolf's seat.",
    rules: "You are not a Werewolf, but you side with them. You are told one player dealt a Werewolf card, chosen at random; they do not know you. You win when the Werewolf team wins, even if you are eliminated.",
    steps: [{ id: "whisper", title: "Hear a name", effects: [{ kind: "learnSeats", tag: "wolf", label: "A Werewolf", limit: 1 }] }],
  },
  {
    id: "forger", name: "Forger", team: "werewolf", tags: [], max: 1, wake: 42,
    blurb: "A wolf ally who sees the Herald's proclamation, then forges one of their own.",
    rules: "You are not a Werewolf, but you side with them. You see what the Herald proclaimed tonight, or that nothing was. Then you name centre cards (as many as the Herald proclaims at this table) and a role in the deck for each: at dawn your forgery is published exactly like a Herald's proclamation, and nobody can tell which is which. A deck with a Forger must have a Herald. You win when the Werewolf team wins.",
    steps: [
      { id: "witness", title: "See the Herald's proclamation", effects: [{ kind: "witness", by: "herald" }] },
      { id: "forge", title: "Forge a proclamation", names: "deck", pick: { pools: ["center"], count: 1, wideCenter: [5, 2] }, effects: [{ kind: "forge", as: "herald" }] },
    ],
  },
  {
    id: "spooker", name: "Spooker", team: "werewolf", tags: [], max: 1, wake: 55,
    blurb: "A wolf ally who stampedes three cards around, unseen.",
    rules: "You are not a Werewolf, but you side with them. Choose three cards other than your own, from players or the centre. The first goes to the second's place, the second to the third's, the third to the first's. You look at none of them. You win when the Werewolf team wins.",
    steps: [{ id: "stampede", title: "Stampede three cards", pick: { pools: ["others", "center"], count: 3 }, effects: [{ kind: "rotate" }] }],
  },
  {
    id: "eavesdropper", name: "Eavesdropper", team: "werewolf", tags: ["wolf", "pack"], max: 1, wake: 93,
    blurb: "A Werewolf who names a role and learns exactly what its holder learned tonight.",
    rules: `You are a Werewolf. ${PACK_RULE} Then name one role in the deck that acts at night and does not wake with the pack. If a player was dealt it (with two copies, the first clockwise from you), you get a copy of everything that player learned tonight, trades included. If nobody was dealt it, then under the table's rule the game secretly runs that role's looks from your seat on random targets and gives you those true results (it moves no card); you are not told which case happened.`,
    steps: [pack, { id: "listen", title: "Name a role to overhear", names: "nightNonPack", effects: [{ kind: "overhear" }] }],
  },
  {
    id: "biter", name: "Biter", team: "werewolf", tags: ["wolf", "pack"], max: 1, wake: 96,
    blurb: "A Werewolf who looks at a player's true card, then may bite them onto the Werewolf team.",
    rules: `You are a Werewolf and wake last. ${PACK_RULE} Look at one other player's card (glamour does not fool you), then decide whether to bite them; you can queue that decision on the card you will see. If their card is not on the Werewolf team, at dawn they are told they were bitten (and, under the table's rule, by your seat): from then on they win only with the Werewolf team, though they are not a Werewolf. A bitten creature loses its creature rules.`,
    steps: [
      pack,
      { id: "sniff", title: "Look at a player's true card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] },
      { id: "bite", title: "Bite them?", optional: true, doLabel: "Bite", skipLabel: "Let them be", effects: [{ kind: "bite", target: { from: "sniff", pick: 0 } }] },
    ],
  },
  // ── Centaur team ──
  {
    id: "sage", name: "Sage", team: "centaur", tags: ["seer"], max: 1, wake: 30,
    blurb: "Reads one other player's card.",
    rules: "Look at one other player's card. You see it as it is at that moment (a glamour, if one is on it).",
    steps: [{ id: "read", title: "Read a player's card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] }],
  },
  {
    id: "centaur", name: "Centaur", team: "centaur", tags: [], max: 4, wake: 35,
    blurb: "Looks at one centre card.",
    rules: "Look at one centre card. Your team wins by the table's win rule: a Werewolf eliminated (with Blood Price: more Werewolves than Centaurs eliminated).",
    steps: [{ id: "glance", title: "Look at a centre card", pick: { pools: ["center"], count: 1 }, effects: [look("picks")] }],
  },
  {
    id: "herald", name: "Herald", team: "centaur", tags: ["seer"], max: 1, wake: 40,
    blurb: "Proclaims to everyone what one centre card is (two, with five or more in the centre).",
    rules: "Choose a centre card. Everyone, you included, is shown what it is at that moment, but not who showed it: at dawn, under the table's rule, together with any other proclamation. With five or six centre cards you choose two. The cards stay face down and may still be moved later.",
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
    rules: "Late in the night, you learn how many Werewolf cards are in the centre at that moment: a number, not which ones. Glamour does not fool the count.",
    steps: [{ id: "tally", title: "Count the strays", effects: [{ kind: "count", zone: "center", tag: "wolf", label: "Werewolf cards in the centre" }] }],
  },
  {
    id: "sentry", name: "Sentry", team: "centaur", tags: [], max: 1, wake: 90,
    blurb: "Near the end of the night, learns whether their own or their neighbours' cards were moved.",
    rules: "You wake near the end of the night. You learn whether your card, and the card of the player on each side of you, was moved during the night so far.",
    steps: [{ id: "watch", title: "Check the watch", effects: [{ kind: "learnMoved", scope: "selfAndNeighbours" }] }],
  },
  {
    id: "chiron", name: "Chiron", team: "centaur", tags: [], max: 1,
    blurb: "Their vote counts twice.",
    rules: "You do nothing at night. Whoever holds this card when the votes are counted has a vote that counts twice.",
    vote: { weight: 2 },
  },
  {
    id: "signet", name: "Signet", team: "centaur", tags: [], max: 1, chat: "signed",
    blurb: "May post one message the table knows came from the player dealt Signet.",
    rules: "You do nothing at night. Once during the day you may post a message that the game itself marks as sent by the player who was dealt Signet. It proves the card you were dealt, not the card you hold now.",
  },
  {
    id: "moth", name: "Moth", team: "centaur", tags: ["wild"], max: 1, metamorph: true,
    blurb: "Starts as a Centaur; if its card is moved in the night, its seat wakes as an Imago that wants to be eliminated.",
    rules: "You do nothing at night and start as a Centaur (a Larva). If the card dealt to you is moved during the night, at dawn you are told you have become an Imago: a creature that wins only by being eliminated, whatever card you hold. Otherwise whoever holds this card is on the Centaur team. A swap during the day does not change it.",
  },
  // ── The Wildwood: creatures ──
  {
    id: "elderbark", name: "Elderbark", team: "wild", tags: ["wild"], max: 1, wake: 8, win: "keystone",
    blurb: "Learns which seats were dealt creatures. Wins if no creature is eliminated.",
    rules: "You learn which other seats were dealt creature cards (the Moth included). Whoever holds this card wins if they are not eliminated and no other creature or Imago is. If they are eliminated, no other creature wins.",
    steps: [{ id: "map", title: "Read the wood", effects: [{ kind: "learnSeats", tag: "wild", label: "Creatures" }] }],
  },
  {
    id: "cuckoo", name: "Cuckoo", team: "wild", tags: ["wild"], max: 1, wake: 25, win: "markEliminated",
    blurb: "Looks at a card, then lays its egg on a player; wins if the egged player is eliminated.",
    rules: "Look at one other player's card, then lay your egg on any other player. At dawn everyone sees which seat holds the egg, but not who laid it. The egg stays with this CARD: whoever holds it when the votes are counted wins if the egged player is eliminated and they are not. If nobody holds the Cuckoo at night, the game lays the egg on a random seat and it benefits nobody.",
    steps: [
      { id: "peek", title: "Look at a player's card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] },
      { id: "egg", title: "Lay your egg on a player", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "mark", target: { pick: 0 }, public: true, label: "The egg" }] },
    ],
  },
  {
    id: "oxpecker", name: "Oxpecker", team: "wild", tags: ["wild"], max: 1, wake: 85, win: "markWins",
    blurb: "Looks at a player's card and bonds to them; wins exactly when they win.",
    rules: "Late in the night, look at one other player's card and bond to that seat. The bond stays with this CARD: whoever holds it wins exactly when the player in the bonded seat wins, whatever side that turns out to be (unless the Elderbark is eliminated).",
    steps: [{ id: "bond", title: "Bond to a player", pick: { pools: ["others"], count: 1 }, effects: [look("picks"), { kind: "mark", target: { pick: 0 }, public: false, label: "Your bond" }] }],
  },
  {
    id: "sporeling", name: "Sporeling", team: "wild", tags: ["wild"], max: 1, win: "eliminated", curse: true,
    blurb: "Wins if eliminated; everyone who voted for it then loses.",
    rules: "You do nothing at night. Whoever holds this card wins if they are eliminated, and then every player whose own vote went to them loses, whichever side they were on. A vote the game cast at random does not count for this, unless the table's rule says so.",
  },
];

export const ROLE: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map(r => [r.id, r]));
export const roleName = (id: RoleId) => ROLE[id]?.name ?? id;
export const TEAM_NAME: Record<Team, string> = { centaur: "Centaur team", werewolf: "Werewolf team", wild: "Wildwood" };

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

/** The roles a naming step may name, given the deck (the actor's own role excluded from `nightNonPack`). */
export function legalRoles(step: StepDef, deck: RoleId[], actor?: RoleId): RoleId[] {
  if (!step.names) return [];
  const ids = [...new Set(deck)].filter(r => ROLE[r]);
  if (step.names === "deck") return ids;
  return ids.filter(r => r !== actor && ROLE[r].steps && ROLE[r].wake !== undefined && !ROLE[r].tags.includes("pack"));
}

/** A sensible deck for a table: wolves and their allies scale with its size, the rest mixes information, movement and vote roles. */
export function recommendedDeck(players: number, center: number = CENTER_DEFAULT): RoleId[] {
  const order = ["werewolf", "werewolf", "sage", "rustler", "centaur", "farrier", "herald", "sentry", "centaur", "herder", "whisperer", "chiron", "cuckoo", "spooker", "elderbark", "centaur", "tracker", "oxpecker"];
  return order.slice(0, Math.min(order.length, players + center));
}
