/**
 * Role definitions for Centaur Werewolf. A role is DATA: its night behaviour is a short script of steps built from a
 * few primitive effects (look, swap, learn, mark…), so the engine, the plan builder, the forced-random mover, the
 * journal and the post-game log all work for any role without role-specific code. Add a role by adding an entry to ROLES.
 *
 * What a role can be made of (see docs/architecture.md): night steps built from effects, `vote` modifiers applied by
 * the card held at the count, a `win` rule that is not simply the team's, flags the resolution reads (`decoy`,
 * `curse`, `metamorph`), a once-per-game `chat` power and a `dayPower` of the player dealt the card.
 */

/** pyre: the third team (the Phoenix and its Kindlers). loner: cards that win by their own rule alongside the result. */
export type Team = "centaur" | "werewolf" | "pyre" | "loner";
export type RoleId = string;

/** A card position: a player's seat or one of the centre cards. */
export type Slot = { k: "p"; i: number } | { k: "c"; i: number };
export const slotKey = (s: Slot) => `${s.k}${s.i}`;
export const sameSlot = (a: Slot, b: Slot) => a.k === b.k && a.i === b.i;
/** How many cards lie face down in the centre: a room setting. */
export const CENTER_MIN = 3, CENTER_MAX = 6, CENTER_DEFAULT = 3;
/** The size of a table, and (where known) its deck: what legal choices depend on. */
export interface Shape { players: number; center: number; deck?: RoleId[]; /** Optional night steps may not be declined (a table rule). */ mandatory?: boolean }

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
  /** Everyone is shown "at least one of the two picked centre cards is a <role>" (one of the two, at random), not who showed it, at dawn. */
  | { kind: "announce" }
  /** The actor learns how many cards with `tag` are in the centre right now: a number, never which. Sees the truth. */
  | { kind: "count"; zone: "center"; tag: string; label: string }
  /** The actor learns which roles were dealt to the centre, not where (the table's Den Census rule says how many). */
  | { kind: "census" }
  /**
   * Corrupts what others see tonight, the victim never told. target card: every look at the picked card shows a wrong
   * role until dawn, and the distortion travels with the card. target viewer: every look the picked PLAYER takes at a
   * centre card shows a wrong role. value chosen: the role the actor names; random: a random other role from the deck
   * (for a card, drawn once when cast; for a viewer, at each look). The Werewolf team's own looks and counts see the truth.
   */
  | { kind: "distort"; target: "card" | "viewer"; value: "chosen" | "random" }
  /** The actor sees what the `by` role proclaimed tonight so far, or that nothing was. */
  | { kind: "witness"; by: RoleId }
  /** A proclamation of the NAMED role at each picked card, published as if by the `as` role, indistinguishable from its. */
  | { kind: "forge"; as: RoleId }
  /** The actor gets a copy of what the player dealt the NAMED role learned tonight, or (table rule) a ghost result. */
  | { kind: "overhear" }
  /** The player at `target` joins the Werewolf team at dawn, unless their card is already on it. Binds to the SEAT. */
  | { kind: "bite"; target: Ref }
  /** The actor's dealt card is marked with the seat at `target`; a `public` mark is shown to everyone at dawn. */
  | { kind: "mark"; target: Ref; public: boolean; label: string }
  /**
   * The actor becomes a copy of the card at the step's first pick, for the rest of the game: the copy is recorded on
   * the actor's CARD (instance), takes that card's true, current identity (what it has become, if it is a copier;
   * never a distortion), and from then on acts in that role's turn with its script, and wins, votes and speaks as it.
   */
  | { kind: "adopt" };

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
  /** The step only happens when this table rule is on. */
  ifRule?: string;
  effects: Effect[];
}

/** How a loner's holder wins. */
export type WinRule =
  /** Wins if the seat this card marked is eliminated and the holder is not. */
  | "markEliminated"
  /** Wins exactly when the seat this card marked wins. */
  | "markWins";

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
  vote?: { weight?: number; protectsTarget?: boolean; takesTargetDown?: boolean; /** This weight when the vote goes to a holder of a card with the tag. */ weightAgainst?: { tag: string; weight: number } };
  /** How a loner's holder wins (a bitten holder loses it). */
  win?: WinRule;
  /** If the holder is eliminated, this card's team wins the main result, whatever else falls. */
  decoy?: boolean;
  /** If no player holds a Phoenix at dawn, this card becomes a Phoenix. */
  heir?: boolean;
  /** Acts in this role's night turn (a shared turn, so the timetable does not tell the kinds apart). */
  turnOf?: RoleId;
  /**
   * A once-per-game chat power of the player DEALT this card. signed: a free-text post sealed as from the player dealt
   * this card. report: a sealed post the game composes from the actor's night look. forge: a post carrying any seal of
   * the forger's choosing, identical to the real one. unsigned: a post with no name (no card uses it now).
   */
  chat?: "signed" | "unsigned" | "report" | "forge";
  /**
   * A day power of the player DEALT this card. swap: queue a swap of two other players' cards, made when the vote
   * phase ends. cut: once, cut one player off the table for a while, exactly as if their connection dropped.
   */
  dayPower?: "swap" | "cut";
  /** A twin: acts in the named role's turn with the same steps, on another team. */
  twinOf?: RoleId;
  /** What a look at this card shows instead of the card itself (a twin that passes for its original). */
  looksAs?: RoleId;
}

const look = (targets: Ref[] | "picks", reveal: "role" | "team" = "role"): Effect => ({ kind: "look", targets, reveal });
/** R2: every pack card begins its turn seeing the other pack seats and the census of the centre. */
const pack: StepDef = { id: "pack", title: "Meet the pack", effects: [{ kind: "learnSeats", tag: "pack", label: "The pack" }, { kind: "census" }] };
const scent: StepDef = { id: "scent", title: "Alone: scent a player", onlyIfAlone: "pack", optional: true, skipLabel: "Don't scent", pick: { pools: ["others"], count: 1 }, effects: [look("picks", "team")] };
const KINDLER_RULE = "You are a Kindler of the Pyre. In the early turn \"The brood gathers\" (shared by every Kindler kind, and by the Phoenix only under the \"Phoenix knows its kin\" rule) you learn which seats were DEALT a Phoenix and which were dealt Kindler cards. You and every Kindler win exactly when a player holding a Phoenix card is eliminated, whether or not you survive (see the Pyre rules for when no player holds one).";
const GATHER: StepDef = { id: "gather", title: "The brood gathers", effects: [{ kind: "learnSeats", tag: "phoenix", label: "The Phoenix (as dealt)" }, { kind: "learnSeats", tag: "kindler", label: "Fellow Kindlers" }] };
const COPY_RULE = "You wake before everyone else. For the rest of the game you are a copy of the card you take: its team, whether it counts as a Werewolf, its win rule, its vote and chat and day powers (your own uses of them), and its night action, which you then perform in that role's own turn (decide it live, or queue it in advance for each role you might become; undecided steps get a random move). You take the card's TRUE identity even if a distortion showed you something else, and you are told what you became. If the card is itself a copier, you become what it has become (or, if it has not, a copier with nothing left to do, on the Centaur team). The pack does not learn about you; if you become a pack card, you do see the pack. A look at your card always shows your own face (Gleaner or Echo), and if your card is moved its new holder holds the copy. If you never become anything, you are on the Centaur team.";
const PACK_RULE = "You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where).";

export const ROLES: RoleDef[] = [
  // ── Werewolf team: the pack ──
  {
    id: "werewolf", name: "Werewolf", team: "werewolf", tags: ["wolf", "pack"], max: 12, wake: 10,
    blurb: "Knows the pack and the centre's roles. Alone, scents one player's team.",
    rules: `${PACK_RULE} If no other pack card was dealt, you may also scent one player and learn which team their card is on. Your team wins by the table's win rule: no Werewolf eliminated, or (with Blood Price) no more Werewolves than Centaurs eliminated.`,
    steps: [pack, scent],
  },
  {
    id: "stalkinghorse", name: "Stalking Horse", team: "werewolf", tags: ["pack"], max: 12, wake: 11, decoy: true,
    blurb: "Wakes with the pack and knows what it knows, but is not a Werewolf. Eliminated, its team wins.",
    rules: `${PACK_RULE} If no other pack card was dealt, you may scent one player's team. You are NOT a Werewolf. If whoever holds this card is eliminated, the Werewolf team wins, even if a Werewolf falls too.`,
    steps: [pack, scent],
  },
  {
    id: "glamour", name: "Glamour", team: "werewolf", tags: ["wolf", "pack"], max: 12, wake: 12,
    blurb: "A Werewolf who disguises one card as any role until dawn.",
    rules: `You are a Werewolf. ${PACK_RULE} Then choose any one card (a player's, your own, or a centre card) and any role in the deck: until dawn, every look at that card shows the role you chose and its team, wherever the card moves. This fools reads, centre glances, proclamations and creatures' looks; the Werewolf team's own looks and the Herder's count see the truth.`,
    steps: [pack, { id: "glamour", title: "Cast a glamour", names: "deck", pick: { pools: ["self", "others", "center"], count: 1 }, effects: [{ kind: "distort", target: "card", value: "chosen" }] }],
  },
  {
    id: "moonthief", name: "Moon-Thief", team: "werewolf", tags: ["wolf", "pack"], max: 12, wake: 13, dayPower: "swap",
    blurb: "A Werewolf who, under the table's day-swap rule, may secretly queue a swap of two other players' cards, made as the votes lock.",
    rules: `You are a Werewolf. ${PACK_RULE} Only if the table's "Moon-Thief's day swap" rule is on (it is off by default): during the day, if you were DEALT this card, you may secretly queue one swap of two other players' cards, and change or clear it until the votes lock. The swap happens the instant voting ends, before anything is counted: votes are weighed and every win is decided by the cards after the swap.`,
    steps: [pack],
  },
  {
    id: "tracker", name: "Tracker", team: "werewolf", tags: ["wolf", "pack"], max: 12, wake: 15,
    blurb: "A Werewolf who is also told where one information role sits.",
    rules: `You are a Werewolf. ${PACK_RULE} You are also told the seat of one player dealt an information role (Sage, Herald or Herder), chosen at random.`,
    steps: [pack, { id: "track", title: "Pick up a trail", effects: [{ kind: "learnSeats", tag: "seer", label: "An information role", limit: 1 }] }],
  },
  {
    id: "whisperer", name: "Whisperer", team: "werewolf", tags: [], max: 12, wake: 20,
    blurb: "A human ally of the wolves who is told one Werewolf's seat.",
    rules: "You are not a Werewolf, but you side with them. You are told one player dealt a Werewolf card, chosen at random; they do not know you. You win when the Werewolf team wins, even if you are eliminated.",
    steps: [{ id: "whisper", title: "Hear a name", effects: [{ kind: "learnSeats", tag: "wolf", label: "A Werewolf", limit: 1 }] }],
  },
  {
    id: "forger", name: "Forger", team: "werewolf", tags: [], max: 12, wake: 42,
    blurb: "A wolf ally who sees the Herald's proclamation, then forges one of their own.",
    rules: "You are not a Werewolf, but you side with them. You see what the Herald proclaimed tonight, or that nothing was. Then you choose two centre cards and a role in the deck: at dawn \"at least one of these two centre cards is a <role>\" is published exactly like a Herald's proclamation, and nobody can tell which is which until the results. A deck with a Forger has a Herald, and a deck with a Herald has a Forger. You win when the Werewolf team wins.",
    steps: [
      { id: "witness", title: "See the Herald's proclamation", effects: [{ kind: "witness", by: "herald" }] },
      { id: "forge", title: "Forge a proclamation", names: "deck", pick: { pools: ["center"], count: 2 }, effects: [{ kind: "forge", as: "herald" }] },
    ],
  },
  {
    id: "spooker", name: "Spooker", team: "werewolf", tags: [], max: 12, wake: 55,
    blurb: "A wolf ally who stampedes three cards around, unseen.",
    rules: "You are not a Werewolf, but you side with them. Choose three cards other than your own, from players or the centre. The first goes to the second's place, the second to the third's, the third to the first's. You look at none of them. You win when the Werewolf team wins.",
    steps: [{ id: "stampede", title: "Stampede three cards", pick: { pools: ["others", "center"], count: 3 }, effects: [{ kind: "rotate" }] }],
  },
  {
    id: "eavesdropper", name: "Eavesdropper", team: "werewolf", tags: ["wolf", "pack"], max: 12, wake: 93,
    blurb: "A Werewolf who names a role and learns exactly what its holder learned tonight.",
    rules: `You are a Werewolf. ${PACK_RULE} Then name one role in the deck that acts at night and does not wake with the pack. If a player was dealt it (with two copies, the first clockwise from you), you get a copy of everything that player learned tonight, trades included. If nobody was dealt it, then under the table's rule the game secretly runs that role's looks from your seat on random targets and gives you those true results (it moves no card); you are not told which case happened.`,
    steps: [pack, { id: "listen", title: "Name a role to overhear", names: "nightNonPack", effects: [{ kind: "overhear" }] }],
  },
  {
    id: "biter", name: "Biter", team: "werewolf", tags: ["wolf", "pack"], max: 12, wake: 96,
    blurb: "A Werewolf who looks at a player's true card, then may bite them onto the Werewolf team.",
    rules: `You are a Werewolf and wake last. ${PACK_RULE} Look at one other player's card (glamour does not fool you), then decide whether to bite them; you can queue that decision on the card you will see. If their card is not on the Werewolf team, at dawn they are told they were bitten (and, under the table's rule, by your seat): from then on they win only with the Werewolf team, though they are not a Werewolf. A bitten creature loses its creature rules.`,
    steps: [
      pack,
      { id: "sniff", title: "Look at a player's true card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] },
      { id: "bite", title: "Bite them?", optional: true, doLabel: "Bite", skipLabel: "Let them be", effects: [{ kind: "bite", target: { from: "sniff", pick: 0 } }] },
    ],
  },
  {
    id: "wisp", name: "Will-o'-Wisp", team: "werewolf", tags: [], max: 12, wake: 14,
    blurb: "A wolf ally who makes one card show a random wrong role to every look tonight.",
    rules: "You are not a Werewolf, but you side with them. Choose any one card (a player's, your own, or a centre card): until dawn every look at it shows a random other role from the deck (the same one for everyone), wherever the card moves. Its holder is never told. The Werewolf team's looks and the Herder's count see the truth. You win when the Werewolf team wins.",
    steps: [{ id: "wisp", title: "Lead a look astray", pick: { pools: ["self", "others", "center"], count: 1 }, effects: [{ kind: "distort", target: "card", value: "random" }] }],
  },
  {
    id: "mistweaver", name: "Mistweaver", team: "werewolf", tags: [], max: 12, wake: 16,
    blurb: "A wolf ally who makes one player see a role of their choosing in every centre card they look at tonight.",
    rules: "You are not a Werewolf, but you side with them. Choose another player and a role in the deck: tonight, every centre card that player looks at (a glance, a peek, a proclamation) shows that role. They are never told. It does not touch looks at players' cards, the Werewolf team's looks or the Herder's count. You win when the Werewolf team wins.",
    steps: [{ id: "veil", title: "Veil a player's eyes", names: "deck", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "distort", target: "viewer", value: "chosen" }] }],
  },
  {
    id: "fogbank", name: "Fogbank", team: "werewolf", tags: [], max: 12, wake: 17,
    blurb: "A wolf ally who makes one player see random wrong roles in every centre card they look at tonight.",
    rules: "You are not a Werewolf, but you side with them. Choose another player: tonight, every centre card that player looks at shows a random other role from the deck. They are never told. It does not touch looks at players' cards, the Werewolf team's looks or the Herder's count. You win when the Werewolf team wins.",
    steps: [{ id: "fog", title: "Fog a player's eyes", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "distort", target: "viewer", value: "random" }] }],
  },
  {
    id: "poacher", name: "Poacher", team: "werewolf", tags: [], max: 12, wake: 44,
    blurb: "A wolf ally who must swap cards with a player, then looks at what they took.",
    rules: "You are not a Werewolf, but you start on their side. You must swap your card with another player's card, then you look at your new card. Your Poacher card, and its team, go to them: you are now on the team of the card you took. They are not told.",
    steps: [{ id: "poach", title: "Swap with a player", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "swap", a: "self", b: { pick: 0 } }, look(["self"])] }],
  },
  {
    id: "counterfeiter", name: "Counterfeiter", team: "werewolf", tags: [], max: 12, chat: "forge",
    blurb: "A wolf ally who can post one sealed message as if from a sealing role, indistinguishable from the real thing.",
    rules: "You are not a Werewolf, but you side with them. You do nothing at night. Once during the day you may post one sealed message carrying the seal of a role in the deck that can seal (Signet: free text; Notary: \"at night, at least one of <A>'s and <B>'s cards was a <role>\" with the players and role of your choosing). Seals carry no name, and until the game ends yours is identical, in every view, to a real one. You win when the Werewolf team wins.",
  },
  {
    id: "hush", name: "Hush", team: "werewolf", tags: [], max: 12, dayPower: "cut",
    blurb: "A wolf ally who can, once, cut one player off the table for a minute, exactly as if their connection dropped.",
    rules: "You are not a Werewolf, but you side with them. You do nothing at night. Once during the day you may silently cut one other player off: for the table's set time (a minute by default) nothing they send goes through and nothing new reaches them, and everyone sees them go offline and come back exactly as if their connection had dropped. Only the results reveal it. You win when the Werewolf team wins.",
  },
  // ── Centaur team ──
  {
    id: "sage", name: "Sage", team: "centaur", tags: ["seer"], max: 12, wake: 30,
    blurb: "Reads one other player's card.",
    rules: "Look at one other player's card. You see it as it is at that moment (a glamour, if one is on it).",
    steps: [{ id: "read", title: "Read a player's card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] }],
  },
  {
    id: "centaur", name: "Centaur", team: "centaur", tags: [], max: 12, wake: 35,
    blurb: "Looks at one centre card.",
    rules: "Look at one centre card. Your team wins by the table's win rule: a Werewolf eliminated (with Blood Price: more Werewolves than Centaurs eliminated).",
    steps: [{ id: "glance", title: "Look at a centre card", pick: { pools: ["center"], count: 1 }, effects: [look("picks")] }],
  },
  {
    id: "herald", name: "Herald", team: "centaur", tags: ["seer"], max: 12, wake: 40,
    blurb: "Proclaims to everyone that at least one of two centre cards is a certain role. A Forger's proclamation looks the same.",
    rules: "Choose two centre cards. At dawn everyone, you included, is shown \"at least one of these two centre cards is a <role>\", the role being what one of the two (chosen at random) showed at that moment. It does not say which of the two, nor who proclaimed it. A deck with a Herald always holds a Forger, whose forged proclamations look exactly the same; only the results tell them apart. The cards stay face down and may still be moved later.",
    steps: [{ id: "proclaim", title: "Proclaim two centre cards", pick: { pools: ["center"], count: 2 }, effects: [{ kind: "announce" }] }],
  },
  {
    id: "notary", name: "Notary", team: "centaur", tags: ["seer"], max: 12, wake: 32, chat: "report",
    blurb: "Reads two players' cards; once in the day, posts a sealed report that at least one of them was a certain role.",
    rules: "Look at two other players' cards. Once during the day you may post a sealed report the game composes from what you saw: \"at night, at least one of <A>'s and <B>'s cards was a <role>\", naming one of the two roles you saw (your choice). It is sealed \"the Notary\" and carries no name: nobody learns who posted it until the game ends. A deck with a Notary always holds a seal forger (Counterfeiter or False Witness), whose forged reports look exactly the same.",
    steps: [{ id: "read", title: "Read two players' cards", pick: { pools: ["others"], count: 2 }, effects: [look("picks")] }],
  },
  {
    id: "rustler", name: "Rustler", team: "centaur", tags: [], max: 12, wake: 45,
    blurb: "Peeks at a player's card, then decides whether to trade cards with them.",
    rules: "Look at one other player's card. Then decide whether to swap your card with it. If you swap, you are now on that card's team.",
    steps: [
      { id: "peek", title: "Peek at a player's card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] },
      { id: "trade", title: "Trade cards with them?", optional: true, doLabel: "Trade", skipLabel: "Keep mine", effects: [{ kind: "swap", a: "self", b: { from: "peek", pick: 0 } }] },
    ],
  },
  {
    id: "farrier", name: "Farrier", team: "centaur", tags: [], max: 12, wake: 50,
    blurb: "Peeks at a centre card, then may shoe themselves or the next seat clockwise with it.",
    rules: "Look at one centre card. Then you may swap it with your own card or with the card of the player clockwise of you.",
    steps: [
      { id: "peek", title: "Peek at a centre card", pick: { pools: ["center"], count: 1 }, effects: [look("picks")] },
      { id: "shoe", title: "Give that card to…", optional: true, skipLabel: "Nobody", pick: { pools: ["self", "cw"], count: 1 }, effects: [{ kind: "swap", a: { from: "peek", pick: 0 }, b: { pick: 0 } }] },
    ],
  },
  {
    id: "cutpurse", name: "Cutpurse", team: "centaur", tags: [], max: 12, wake: 46,
    blurb: "Must swap cards with a player, then looks at the card they took.",
    rules: "You must swap your card with another player's card, then you look at your new card: you know what you became, they do not. You are now on the team of the card you took.",
    steps: [{ id: "steal", title: "Swap with a player", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "swap", a: "self", b: { pick: 0 } }, look(["self"])] }],
  },
  {
    id: "pickpocket", name: "Pickpocket", team: "centaur", tags: [], max: 12, wake: 47,
    blurb: "Must swap cards with a player, blind: learns nothing of what they took.",
    rules: "You must swap your card with another player's card. You do not look at what you took. You are now on the team of that card, whatever it is.",
    steps: [{ id: "lift", title: "Swap blind with a player", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "swap", a: "self", b: { pick: 0 } }] }],
  },
  {
    id: "drifter", name: "Drifter", team: "centaur", tags: [], max: 12, wake: 48,
    blurb: "Must swap their card with a centre card, then looks at their new card.",
    rules: "You must swap your card with a centre card, then you look at your new card. You are now on its team.",
    steps: [{ id: "drift", title: "Swap with a centre card", pick: { pools: ["center"], count: 1 }, effects: [{ kind: "swap", a: "self", b: { pick: 0 } }, look(["self"])] }],
  },
  {
    id: "herder", name: "Herder", team: "centaur", tags: ["seer"], max: 12, wake: 80,
    blurb: "After the cards have moved, counts the Werewolves in the centre.",
    rules: "Late in the night, you learn how many Werewolf cards are in the centre at that moment: a number, not which ones. Glamour does not fool the count.",
    steps: [{ id: "tally", title: "Count the strays", effects: [{ kind: "count", zone: "center", tag: "wolf", label: "Werewolf cards in the centre" }] }],
  },
  {
    id: "latecomer", name: "Latecomer", team: "centaur", tags: [], max: 12, wake: 88,
    blurb: "Late in the night, must swap cards with a player, blind.",
    rules: "Late in the night, after almost every other move, you must swap your card with another player's card. You do not look at it. You are now on the team of that card.",
    steps: [{ id: "swap", title: "Swap blind with a player", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "swap", a: "self", b: { pick: 0 } }] }],
  },
  {
    id: "sentry", name: "Sentry", team: "centaur", tags: [], max: 12, wake: 90,
    blurb: "Near the end of the night, learns whether their own or their neighbours' cards were moved.",
    rules: "You wake near the end of the night. You learn whether your card, and the card of the player on each side of you, was moved during the night so far.",
    steps: [{ id: "watch", title: "Check the watch", effects: [{ kind: "learnMoved", scope: "selfAndNeighbours" }] }],
  },
  {
    id: "chiron", name: "Chiron", team: "centaur", tags: [], max: 12,
    blurb: "Their vote counts twice.",
    rules: "You do nothing at night. Whoever holds this card when the votes are counted has a vote that counts twice.",
    vote: { weight: 2 },
  },
  {
    id: "signet", name: "Signet", team: "centaur", tags: [], max: 12, chat: "signed",
    blurb: "May post one nameless message sealed \"the Signet\". A forger's seal looks the same.",
    rules: "You do nothing at night. Once during the day you may post a message sealed \"the Signet\". The seal names the role, never you: nobody learns who posted it until the game ends. A deck with a Signet always holds a seal forger (Counterfeiter or False Witness), whose forged Signet messages look exactly the same.",
  },
  // ── The Pyre: a third team. The Phoenix must burn (be eliminated) for its Kindlers to win. ──
  {
    id: "phoenix", name: "Phoenix", team: "pyre", tags: ["phoenix"], max: 12, wake: 5, turnOf: "kindler",
    blurb: "The Pyre's sacrifice: the Pyre wins if whoever holds this card is eliminated.",
    rules: "You are the Pyre's sacrifice. The whole Pyre team (you and every Kindler) wins if the player HOLDING a Phoenix card is eliminated. You do not know who the Kindlers are (unless the table's \"Phoenix knows its kin\" rule is on: then you wake with the brood and learn their seats). If the card moves, its new holder is the Phoenix, untold.",
    steps: [{ id: "kin", title: "Know your kin", ifRule: "phoenixKnowsKindlers", effects: [{ kind: "learnSeats", tag: "kindler", label: "Your Kindlers" }] }],
  },
  {
    id: "kindler", name: "Kindler", team: "pyre", tags: ["kindler"], max: 12, wake: 5,
    blurb: "Pyre: learns where the Phoenix was dealt and who the other Kindlers are; wins when the Phoenix burns.",
    rules: `${KINDLER_RULE}`,
    steps: [GATHER],
  },
  {
    id: "lure", name: "Lure", team: "pyre", tags: ["kindler"], max: 12, wake: 5, turnOf: "kindler",
    blurb: "A Kindler who makes one card read as a role of their choosing tonight, so honest eyes accuse it.",
    rules: `${KINDLER_RULE} Then choose any one card and any role in the deck: until dawn every look at that card (except the Werewolf team's) shows that role, wherever it moves. Dress the Phoenix as a Werewolf and let honest seers condemn it.`,
    steps: [GATHER, { id: "lure", title: "Dress a card for the pyre", names: "deck", pick: { pools: ["self", "others", "center"], count: 1 }, effects: [{ kind: "distort", target: "card", value: "chosen" }] }],
  },
  {
    id: "falsewitness", name: "False Witness", team: "pyre", tags: ["kindler"], max: 12, wake: 5, turnOf: "kindler", chat: "forge",
    blurb: "A Kindler who can post one forged seal, e.g. a Notary's report naming the Phoenix as a Werewolf.",
    rules: `${KINDLER_RULE} Once during the day you may post one forged sealed message (a Signet message, or a Notary's report \"at night, at least one of <A>'s and <B>'s cards was a <role>\" of your choosing), identical to a real one until the game ends. The sealing role must be in the deck.`,
    steps: [GATHER],
  },
  {
    id: "embercarrier", name: "Ember-Carrier", team: "pyre", tags: ["kindler"], max: 12, wake: 5, turnOf: "kindler",
    blurb: "A Kindler who, at night, must blindly swap two other players' cards: carry the Phoenix to someone who does not know.",
    rules: `${KINDLER_RULE} Then, still in the brood's turn, you must swap the cards of two other players, seeing neither. Knowing where the Phoenix was dealt, you can carry it to a player who does not know they now want to burn (and the brood's knowledge goes stale). Nobody is told.`,
    steps: [GATHER, { id: "carry", title: "Carry the ember", pick: { pools: ["others"], count: 2 }, effects: [{ kind: "swap", a: { pick: 0 }, b: { pick: 1 } }] }],
  },
  {
    id: "heavyhand", name: "Heavy Hand", team: "pyre", tags: ["kindler"], max: 12, wake: 5, turnOf: "kindler", vote: { weight: 2 },
    blurb: "A Kindler whose vote counts double.",
    rules: `${KINDLER_RULE} Whoever holds this card when the votes are counted has a vote that counts twice, whoever it goes to (so a misplaced vote costs the Pyre too).`,
    steps: [GATHER],
  },
  {
    id: "heir", name: "Heir", team: "pyre", tags: ["kindler"], max: 12, wake: 5, turnOf: "kindler", heir: true,
    blurb: "A Kindler whose card becomes a Phoenix if no player holds one at dawn.",
    rules: `${KINDLER_RULE} If at dawn no player holds a Phoenix card (it lies in the centre or was moved there), the card of the Heir becomes a Phoenix for the rest of the game and whoever holds it is told: the Pyre always has something to burn.`,
    steps: [GATHER],
  },
  // ── Loners: each wins by its own rule, alongside whatever team wins. ──
  {
    id: "cuckoo", name: "Cuckoo", team: "loner", tags: [], max: 12, wake: 25, win: "markEliminated",
    blurb: "A loner: looks at a card, then lays its egg on a player; wins if the egged player is eliminated.",
    rules: "You are a loner: you win by your own rule, alongside whatever team wins, and lose otherwise. Look at one other player's card, then lay your egg on any other player. At dawn everyone sees which seat holds the egg, but not who laid it. The egg stays with this CARD: whoever holds it when the votes are counted wins if the egged player is eliminated and they are not. If nobody holds the Cuckoo at night, the game lays the egg on a random seat and it benefits nobody.",
    steps: [
      { id: "peek", title: "Look at a player's card", pick: { pools: ["others"], count: 1 }, effects: [look("picks")] },
      { id: "egg", title: "Lay your egg on a player", pick: { pools: ["others"], count: 1 }, effects: [{ kind: "mark", target: { pick: 0 }, public: true, label: "The egg" }] },
    ],
  },
  {
    id: "oxpecker", name: "Oxpecker", team: "loner", tags: [], max: 12, wake: 85, win: "markWins",
    blurb: "A loner: looks at a player's card and bonds to them; wins exactly when they win.",
    rules: "You are a loner. Late in the night, look at one other player's card and bond to that seat. The bond stays with this CARD: whoever holds it wins exactly when the player in the bonded seat wins, whatever side that turns out to be, and loses otherwise.",
    steps: [{ id: "bond", title: "Bond to a player", pick: { pools: ["others"], count: 1 }, effects: [look("picks"), { kind: "mark", target: { pick: 0 }, public: false, label: "Your bond" }] }],
  },
  // ── Copiers: become another role for the rest of the game. ──
  {
    id: "gleaner", name: "Gleaner", team: "centaur", tags: [], max: 12, wake: 2,
    blurb: "Wakes first, looks at a centre card and becomes that role for the rest of the game.",
    rules: `${COPY_RULE} You look at one centre card and become a copy of it.`,
    steps: [{ id: "glean", title: "Take a role from the centre", pick: { pools: ["center"], count: 1 }, effects: [look("picks"), { kind: "adopt" }] }],
  },
  {
    id: "echo", name: "Echo", team: "centaur", tags: [], max: 12, wake: 3,
    blurb: "Wakes first, looks at another player's card and becomes that role for the rest of the game.",
    rules: `${COPY_RULE} You look at another player's card and become a copy of it.`,
    steps: [{ id: "echo", title: "Take a role from a player", pick: { pools: ["others"], count: 1 }, effects: [look("picks"), { kind: "adopt" }] }],
  },
];

/**
 * Shadow twins: an enemy-team card with the same night steps as a Centaur original, acting IN the original's turn (the
 * public timetable shows one turn for both), so its holder can truthfully describe the original's action. `looksAs`:
 * whether a look at it shows the original (it passes) or the twin itself. `wolf`: whether it counts as a Werewolf.
 */
const TWINS: { id: RoleId; name: string; of: RoleId; team: Team; wolf: boolean; passes: boolean; blurb: string }[] = [
  { id: "moonsage", name: "Moonsage", of: "sage", team: "werewolf", wolf: false, passes: true, blurb: "A wolf ally who reads a card in the Sage's turn, exactly as the Sage does, and shows as a Sage to every look." },
  { id: "duncentaur", name: "Dun Centaur", of: "centaur", team: "werewolf", wolf: true, passes: false, blurb: "A Werewolf (outside the pack) who looks at a centre card in the Centaur's turn." },
  { id: "paleherald", name: "Pale Herald", of: "herald", team: "werewolf", wolf: false, passes: true, blurb: "A wolf ally who makes a Herald's proclamation in the Herald's turn and shows as a Herald to every look." },
  { id: "duskrustler", name: "Dusk Rustler", of: "rustler", team: "werewolf", wolf: true, passes: false, blurb: "A Werewolf (outside the pack) who peeks and may trade in the Rustler's turn." },
  { id: "hollowsage", name: "Hollow Sage", of: "sage", team: "werewolf", wolf: true, passes: true, blurb: "A Werewolf (outside the pack) who reads a card in the Sage's turn, exactly as the Sage does, and shows as a Sage to every look." },
  { id: "strayherder", name: "Stray Herder", of: "herder", team: "werewolf", wolf: false, passes: true, blurb: "A wolf ally who counts the centre's wolves in the Herder's turn and shows as a Herder to every look." },
];
for (const t of TWINS) {
  const o = ROLES.find(r => r.id === t.of)!;
  ROLES.push({
    id: t.id, name: t.name, team: t.team, tags: t.wolf ? ["wolf"] : [], max: 12, wake: o.wake, steps: o.steps, twinOf: o.id, ...(t.passes ? { looksAs: o.id } : {}), blurb: t.blurb,
    rules: `You act in the ${o.name}'s turn and do exactly what the ${o.name} does: ${o.rules} But you are on the Werewolf team${t.wolf ? " and you count as a Werewolf (you do not wake with the pack, and the pack does not know you)" : ", and you are not a Werewolf"}. ${t.passes ? `Any look at your card shows a ${o.name}.` : `A look at your card shows the ${t.name}.`} You win when the Werewolf team wins.`,
  });
}
// Research variants (players-7 study, docs/research/results/players-7-log.md): additive, the originals are unchanged.
{
  const herder = ROLES.find(r => r.id === "herder")!;
  ROLES.push(
    {
      id: "mirage", name: "Mirage", team: "werewolf", tags: ["wolf", "pack"], max: 12, wake: 18,
      blurb: "A Werewolf who must disguise ANOTHER card (never its own) as any role until dawn.",
      rules: `You are a Werewolf. ${PACK_RULE} Then choose one card that is not yours (another player's, or a centre card) and any role in the deck: until dawn, every look at that card shows the role you chose and its team, wherever the card moves. You cannot disguise your own card. The Werewolf team's own looks and the Herder's count see the truth.`,
      steps: [pack, { id: "mirage", title: "Cast a mirage", names: "deck", pick: { pools: ["others", "center"], count: 1 }, effects: [{ kind: "distort", target: "card", value: "chosen" }] }],
    },
    {
      id: "greyherder", name: "Grey Herder", team: "werewolf", tags: ["pack"], max: 12, wake: herder.wake, steps: [pack, ...herder.steps!], twinOf: "herder", looksAs: "herder",
      blurb: "A Stray Herder that wakes with the pack: it knows the pack and the census, and the pack knows it.",
      rules: `You act in the Herder's turn and do exactly what the Herder does: ${herder.rules} You also wake with the pack: you learn which players were dealt cards of the pack and, under the Den Census rule, which roles lie in the centre (not where), and the pack learns your seat. You are on the Werewolf team, and you are not a Werewolf. Any look at your card shows a Herder. You win when the Werewolf team wins.`,
    },
  );
}

/**
 * Research additions (players-5 session): Centaur-team twins of Werewolf-team originals. Same steps, same public turn,
 * so a true description of the original's night no longer proves its team.
 */
{
  const sp = ROLES.find(r => r.id === "spooker")!;
  ROLES.push({
    id: "drover", name: "Drover", team: "centaur", tags: [], max: 12, wake: sp.wake, steps: sp.steps, twinOf: "spooker",
    blurb: "A Centaur who stampedes three cards in the Spooker's turn, exactly as the Spooker does.",
    rules: "You act in the Spooker's turn and do exactly what the Spooker does: choose three cards other than your own, from players or the centre. The first goes to the second's place, the second to the third's, the third to the first's. You look at none of them. But you are on the Centaur team. A look at your card shows the Drover.",
  });
}

export const ROLE: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map(r => [r.id, r]));
export const roleName = (id: RoleId) => ROLE[id]?.name ?? id;
/** "a Sage", "an Eavesdropper": a role name with its article, for the texts the game composes. */
export const aRole = (id: RoleId) => `${/^[AEIOU]/i.test(roleName(id)) ? "an" : "a"} ${roleName(id)}`;
export const TEAM_NAME: Record<Team, string> = { centaur: "Centaur team", werewolf: "Werewolf team", pyre: "Pyre", loner: "Loner (wins alone)" };

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
  const order = ["werewolf", "werewolf", "sage", "rustler", "centaur", "farrier", "drifter", "sentry", "centaur", "herder", "whisperer", "chiron", "cuckoo", "spooker", "latecomer", "centaur", "tracker", "oxpecker"];
  return order.slice(0, Math.min(order.length, players + center));
}
