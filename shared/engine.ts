/**
 * The pure game engine: no Convex, no React, no clock. The server (convex/) calls it inside mutations and the client
 * uses the same functions to show legal targets and plan coverage, so the two can never disagree.
 */
import { CENTER_MAX, CENTER_MIN, condSource, legalRoles, pickCount, ROLE, roleName, sameSlot, slotKey, type Effect, type Ref, type RoleDef, type RoleId, type Shape, type Slot, type StepDef, type Team } from "./roles";
import { DEFAULT_RULES, type Rules } from "./settings";

export type Rng = () => number;

/** Draws from the platform's cryptographic generator (Node and Convex both provide it): independent of any seed. */
export const secureRng: Rng = () => {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return (a[0] * 2 ** 21 + (a[1] >>> 11)) / 2 ** 53;
};
/** A small, good seeded generator (splitmix32), for fixed deals at play-test tables and for tests. */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return ((z ^ (z >>> 16)) >>> 0) / 2 ** 32;
  };
}

// ───────────────────────────── plans ─────────────────────────────

/**
 * What an actor does at one step: pick targets (with a role, at a step that names one), name a role (at a step that
 * only names one), go ahead with a yes/no step, or decline an optional step.
 */
export type Decision = { kind: "pick"; targets: Slot[]; role?: RoleId } | { kind: "name"; role: RoleId } | { kind: "do" } | { kind: "skip" };

/**
 * A queued decision for one step. `branches` are tried in order against what the actor saw at the step this one
 * depends on (see `condSource`); the first branch naming a seen role wins. `otherwise` covers everything else, so a
 * plan with no branches is an unconditional decision.
 */
export interface StepPlan {
  branches: { roles: RoleId[]; decision: Decision }[];
  otherwise?: Decision;
}
export type Plan = Record<string, StepPlan>;

export function resolvePlan(plan: StepPlan | undefined, seen: RoleId[] | undefined): Decision | undefined {
  return resolveBranch(plan, seen)?.decision;
}
function resolveBranch(plan: StepPlan | undefined, seen: RoleId[] | undefined): { decision: Decision; branch: RoleId[] | null } | undefined {
  if (!plan) return undefined;
  if (seen) for (const b of plan.branches) if (b.roles.some(r => seen.includes(r))) return { decision: b.decision, branch: b.roles };
  return plan.otherwise ? { decision: plan.otherwise, branch: null } : undefined;
}

/** The roles a step's plan leaves undecided, out of the roles the actor could see. Empty: fully queued. */
export function uncovered(plan: StepPlan | undefined, outcomes: RoleId[]): RoleId[] {
  if (!plan) return outcomes;
  if (plan.otherwise) return [];
  const named = new Set(plan.branches.flatMap(b => b.roles));
  return outcomes.filter(r => !named.has(r));
}

// ───────────────────────────── state ─────────────────────────────

/**
 * A proclamation, shown to everyone (at dawn, under that table rule): "at least one of these two centre cards is a
 * <role>", as the cards were at one moment of the night. Never a single card's identity (the evidence amendment): a
 * Forger publishes the same artefact, and a deck with a Herald must hold a Forger.
 */
export interface Shown {
  /** The two centre cards it names. */
  slots: Slot[];
  /** The role it says at least one of them is. */
  role: RoleId;
  /** The role whose turn it is published as ("herald"): a forgery is published as the Herald's. */
  by: RoleId;
  /** The turn it was really made in. Not shown to players while it is published at dawn. */
  turn: number;
  /** Published at dawn rather than at once. */
  atDawn: boolean;
  /** A Forger's: revealed only after the game. */
  forged?: boolean;
}

export interface GameState {
  /** The role each seat was dealt: it decides who wakes when, whatever happens to the card later. */
  dealt: RoleId[];
  /** The card each seat holds now. */
  cards: RoleId[];
  center: RoleId[];
  /** The roles dealt to the centre, in place (the census reads them; `center` changes as cards move). */
  dealtCenter: RoleId[];
  /** Keys of the slots whose card has changed tonight. */
  moved: string[];
  shown: Shown[];
  /**
   * Card instances. Every card dealt is one instance, numbered by deal position (seat s's dealt card is instance s, the
   * nth centre card is instance players + n), so several copies of one role stay distinguishable. `inst` and `cinst`
   * are the instances at each seat and centre position now; `instRole` the role of each instance.
   */
  inst: number[];
  cinst: number[];
  instRole: RoleId[];
  /** Seats marked by cards, keyed by card INSTANCE: the Cuckoo's egg, the Oxpecker's bond. They bind to the card. */
  marks: Record<string, number>;
  /** Tokens lying on cards, keyed by the slot the card is in now: they move with the card. `distort`: a role, or null for random. */
  tokens: Record<string, { distort?: RoleId | null }>;
  /** Viewer distortions, by seat: that player's looks at centre cards show a wrong role (a chosen one, or null: random). */
  veils: Record<string, { role: RoleId | null }>;
  /** Bites: the seat bitten and the Biter's seat. A bite binds to the SEAT. */
  bitten: { seat: number; by: number }[];
  /** Copies, by card INSTANCE: the role a copier's card has become (shared/roles.ts `adopt`). */
  adopted: Record<string, RoleId>;
  /** Card instances that became a Phoenix at dawn (an Heir's card, when no player held a Phoenix). */
  phoenixInst: number[];
  /** The night is over. */
  dawn: boolean;
  rules: Rules;
}

/** One actor's place in their night script. */
export interface Progress {
  step: number;
  picks: Record<string, Slot[]>;
  /** Roles seen at each step that looked at a card's role. */
  seen: Record<string, RoleId[]>;
  done: boolean;
}
export const shapeOf = (state: GameState): Shape => ({ players: state.dealt.length, center: state.center.length, deck: [...state.dealt, ...state.dealtCenter], mandatory: state.rules.mandatorySteps });
/** The night turn a role acts in: its own, a shared one (Kindlers), or its original's for a twin. */
export const turnKey = (role: RoleId): RoleId => ROLE[role]?.turnOf ?? ROLE[role]?.twinOf ?? role;
/** What a card instance IS for every rule (team, Werewolf, win, powers): its copy if it is a copier that copied. */
export const effRole = (state: GameState, inst: number): RoleId => state.adopted[String(inst)] ?? state.instRole[inst];
/** The role a seat acts and speaks as: the effective role of the card it was DEALT (instance = seat). */
export const actingRole = (state: GameState, seat: number): RoleId => effRole(state, seat);
/** Whether a card instance is a Phoenix (by role, by copy, or as an Heir's card turned at dawn). */
export const isPhoenix = (state: GameState, inst: number) => ROLE[effRole(state, inst)]?.tags.includes("phoenix") || state.phoenixInst.includes(inst);
/** The roles each seat holds now, as every rule reads them (copies applied). */
export const heldRoles = (state: GameState) => state.inst.map(i => effRole(state, i));
export const freshProgress = (): Progress => ({ step: 0, picks: {}, seen: {}, done: false });

/** A copied journal line: what the player dealt a role did and learned at one of its steps. */
export interface Overheard { step: string; ev: LogEvent }

export type LogEvent =
  | { kind: "look"; slots: Slot[]; roles?: RoleId[]; teams?: Team[] }
  | { kind: "swap"; a: Slot; b: Slot }
  | { kind: "seats"; label: string; seats: number[] }
  | { kind: "moved"; slots: Slot[]; moved: boolean[] }
  | { kind: "rotate"; slots: Slot[] }
  /** "At least one of `slots` is `roles[0]`" (one role, two cards). */
  | { kind: "announce"; slots: Slot[]; roles: RoleId[]; atDawn: boolean }
  | { kind: "count"; label: string; n: number }
  | { kind: "census"; roles: RoleId[]; of: number; covers?: { seat: number; role: RoleId | null }[] }
  /** A distortion cast: on a card (`slot`) or on a viewer (`viewer`); `role` null means a random wrong role per look. */
  | { kind: "distort"; slot?: Slot; viewer?: number; role: RoleId | null }
  /** Proclamation k named `slots[2k]` and `slots[2k+1]`, and said at least one of them is `roles[k]`. */
  | { kind: "witness"; by: RoleId; slots: Slot[]; roles: RoleId[] }
  /** A forged proclamation: "at least one of `slots` is `roles[0]`". */
  | { kind: "forge"; slots: Slot[]; roles: RoleId[]; as: RoleId }
  | { kind: "overhear"; role: RoleId; copied: Overheard[] }
  | { kind: "bite"; seat: number; took: boolean }
  | { kind: "mark"; seat: number; label: string; public: boolean; unheld?: boolean }
  /** Dawn notices, each to the seat it concerns. */
  | { kind: "bitten"; by: number | null }
  | { kind: "heir" }
  /** A copier became this role (the card's true identity). */
  | { kind: "adopt"; role: RoleId }

  /** A step the actor had queued that turned out not to happen. */
  | { kind: "void"; why: string }
  /** The Moon-Thief's swap, made as the vote phase ended. */
  | { kind: "daySwap"; a: number; b: number }
  /** A Hush's cut: the seat, and the window (ms timestamps). Logged only when the game ends. */
  | { kind: "cut"; seat: number; from: number; until: number }
  | { kind: "skip" };

export interface LogEntry {
  turn: number;
  /** The actor, or the seat a dawn notice is for; -1 for something the game itself did. */
  seat: number;
  role: RoleId;
  step: string;
  /** How the decision was made. */
  via: "auto" | "queued" | "live" | "forced";
  ev: LogEvent;
  /** A conditional plan's choice: what the actor saw, and the branch it matched (null: `otherwise`). */
  cond?: { saw: RoleId[]; branch: RoleId[] | null };
  /**
   * What only the post-game log may show: the true cards behind a glamoured look, where an Eavesdropper's copy came
   * from. Views strip it until the game has ended.
   */
  hidden?: { truth?: RoleId[]; cards?: RoleId[]; source?: number | "ghost" | "none"; role?: RoleId };
}

export function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** A state with the cards already in place: the first `players` cards to the seats in order, the rest to the centre. */
export function dealFixed(cards: RoleId[], players: number, rules: Partial<Rules> = {}): GameState {
  if (cards.length < players + CENTER_MIN) throw new Error("The deck is too small for this table.");
  const dealt = cards.slice(0, players), center = cards.slice(players);
  return {
    dealt, cards: [...dealt], center: [...center], dealtCenter: [...center],
    inst: dealt.map((_, i) => i), cinst: center.map((_, i) => players + i), instRole: [...cards],
    moved: [], shown: [], marks: {}, tokens: {}, veils: {}, bitten: [], adopted: {}, phoenixInst: [], dawn: false, rules: { ...DEFAULT_RULES, ...rules },
  };
}

export function deal(deck: RoleId[], players: number, rng: Rng, rules: Partial<Rules> = {}): GameState {
  return dealFixed(shuffle(deck, rng), players, rules);
}

/**
 * The night's turns, in wake order: one per role in the deck that acts at night, whether dealt or in the centre. A twin
 * acts in its original's turn, so a deck with a twin and no original still shows the original's turn (and only that).
 */
export function nightTurns(deck: RoleId[]): RoleId[] {
  return [...new Set(deck.filter(r => ROLE[r]?.steps && ROLE[r].wake !== undefined).map(turnKey))].sort((a, b) => ROLE[a].wake! - ROLE[b].wake!);
}

// ───────────────────────────── steps ─────────────────────────────

export function legalTargets(step: StepDef, seat: number, { players, center }: Shape): Slot[] {
  if (!step.pick) return [];
  const out: Slot[] = [];
  for (const pool of step.pick.pools) {
    if (pool === "self") out.push({ k: "p", i: seat });
    if (pool === "others") for (let i = 0; i < players; i++) if (i !== seat) out.push({ k: "p", i });
    if (pool === "cw") out.push({ k: "p", i: (seat + 1) % players });
    if (pool === "center") for (let i = 0; i < center; i++) out.push({ k: "c", i });
  }
  return out;
}

const TAG_WORDS: Record<string, string> = { pack: "a card of the pack", wolf: "a Werewolf card" };
/** Whether a step happens at all for this actor (the lone-wolf rule), and if not, why. */
export function stepApplies(step: StepDef, seat: number, state: GameState): boolean {
  return stepVoid(step, seat, state) === null;
}
function stepVoid(step: StepDef, seat: number, state: GameState): string | null {
  if (step.onlyIfAlone && state.dealt.some((r, i) => i !== seat && ROLE[r].tags.includes(step.onlyIfAlone!))) return `another player was dealt ${TAG_WORDS[step.onlyIfAlone] ?? `a "${step.onlyIfAlone}" card`}, so you were not alone`;
  if (step.names && !legalRoles(step, shapeOf(state).deck!, state.dealt[seat]).length) return "there was no role you could name";
  if (step.ifRule && !state.rules[step.ifRule as keyof Rules]) return "the table rule it depends on is off";
  return null;
}

/** A step with nothing to decide: it just happens when the actor's turn comes. */
export const isAuto = (step: StepDef) => !step.pick && !step.optional && !step.names;

function roleProblem(step: StepDef, shape: Shape, role: RoleId | undefined, actor?: RoleId): string | null {
  if (!step.names) return role ? "This step takes no role." : null;
  if (!role) return "Name a role as well.";
  const legal = legalRoles(step, shape.deck ?? Object.keys(ROLE), actor);
  return legal.includes(role) ? null : `You cannot name ${roleName(role)} here: choose one of ${legal.map(roleName).join(", ") || "(none)"}.`;
}

export function validDecision(step: StepDef, seat: number, shape: Shape, d: Decision, actor?: RoleId): string | null {
  if (d.kind === "skip") return !step.optional ? "This step cannot be skipped." : shape.mandatory ? "At this table every night step is mandatory (the \"Mandatory night steps\" rule): this one cannot be skipped." : null;
  if (d.kind === "do") return step.pick ? "Choose a target." : step.names ? "Name a role." : null;
  if (d.kind === "name") return step.pick ? "Choose a target (and a role)." : roleProblem(step, shape, d.role, actor);
  if (!step.pick) return step.names ? "This step takes a role only: use { \"kind\": \"name\", \"role\": <id> }." : "This step takes no target.";
  const count = pickCount(step, shape);
  if (d.targets.length !== count) return `Choose ${count} target${count === 1 ? "" : "s"}.`;
  const legal = legalTargets(step, seat, shape);
  for (const [n, t] of d.targets.entries()) {
    if (!legal.some(l => sameSlot(l, t))) return "That target is not allowed.";
    if (d.targets.findIndex(o => sameSlot(o, t)) !== n) return "Choose different targets.";
  }
  return roleProblem(step, shape, d.role, actor);
}

export function validPlan(role: RoleDef, stepId: string, seat: number, shape: Shape, plan: StepPlan): string | null {
  const step = role.steps?.find(s => s.id === stepId);
  if (!step) return "No such step.";
  if (isAuto(step)) return "Nothing to decide at this step.";
  if (plan.branches.length && !condSource(role, stepId)) return "This step has nothing to be conditional on.";
  for (const d of [...plan.branches.map(b => b.decision), ...(plan.otherwise ? [plan.otherwise] : [])]) {
    const err = validDecision(step, seat, shape, d, role.id);
    if (err) return err;
  }
  return null;
}

/** How many distinct legal decisions a step has (ordered target choices × named roles, plus declining). */
export function decisionCount(step: StepDef, seat: number, shape: Shape, actor?: RoleId): number {
  const roles = step.names ? legalRoles(step, shape.deck ?? Object.keys(ROLE), actor).length : 1;
  let picks = 1;
  if (step.pick) { const n = legalTargets(step, seat, shape).length, k = pickCount(step, shape); for (let i = 0; i < k; i++) picks *= n - i; }
  return picks * roles + (step.optional && !shape.mandatory ? 1 : 0);
}

/** A uniformly random legal decision: every ordered choice of targets, every named role, and declining weigh the same. */
export function randomDecision(step: StepDef, seat: number, shape: Shape, rng: Rng, actor?: RoleId): Decision {
  const roles = legalRoles(step, shape.deck ?? Object.keys(ROLE), actor);
  const total = decisionCount(step, seat, shape, actor);
  if (step.optional && !shape.mandatory && Math.floor(rng() * total) === 0) return { kind: "skip" };
  const role = () => roles[Math.floor(rng() * roles.length)];
  if (step.pick) {
    const targets = shuffle(legalTargets(step, seat, shape), rng).slice(0, pickCount(step, shape));
    return step.names ? { kind: "pick", targets, role: role() } : { kind: "pick", targets };
  }
  if (step.names) return { kind: "name", role: role() };
  return { kind: "do" };
}

function resolveRef(ref: Ref, seat: number, players: number, picks: Slot[], progress: Progress): Slot {
  if (ref === "self") return { k: "p", i: seat };
  if ("pick" in ref && !("from" in ref)) return picks[ref.pick];
  if ("from" in ref) return progress.picks[ref.from][ref.pick];
  const base = resolveRef(ref.cw, seat, players, picks, progress);
  if (base.k !== "p") throw new Error("Only a seat has a clockwise neighbour.");
  let i = (base.i + 1) % players;
  if (i === seat) i = (i + 1) % players;
  return { k: "p", i };
}

export const cardAt = (state: GameState, s: Slot) => (s.k === "p" ? state.cards[s.i] : state.center[s.i]);
const instAt = (state: GameState, s: Slot) => (s.k === "p" ? state.inst[s.i] : state.cinst[s.i]);
/** Puts a card (role and instance) at a slot. */
function setCard(state: GameState, s: Slot, r: RoleId, inst: number) {
  if (s.k === "p") { state.cards[s.i] = r; state.inst[s.i] = inst; } else { state.center[s.i] = r; state.cinst[s.i] = inst; }
}
/** A random role from the deck other than `not`, for random distortions. */
function wrongRole(state: GameState, not: RoleId, rng: Rng): RoleId {
  const pool = [...new Set(state.instRole)].filter(r => r !== not);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : not;
}

/**
 * What an actor sees at a slot, in this order: a twin card shows its original (if it is that kind of twin); a
 * distortion on the card shows its role instead (the latest cast wins); then, for a look at a centre card, a veil on
 * the viewer shows its role instead. Distortions are defector noise: the Werewolf team's own looks see the truth.
 */
export function seenAt(state: GameState, s: Slot, actor: number, rng: Rng): { role: RoleId; truth: RoleId } {
  const truth = cardAt(state, s);
  if (actor >= 0 && ROLE[state.dealt[actor]].team === "werewolf") return { role: truth, truth };
  let role = ROLE[truth].looksAs ?? truth;
  const token = state.tokens[slotKey(s)];
  if (token && "distort" in token) role = token.distort ?? wrongRole(state, truth, rng);
  const veil = s.k === "c" && actor >= 0 ? state.veils[String(actor)] : undefined;
  if (veil) role = veil.role ?? wrongRole(state, truth, rng);
  return { role, truth };
}

/** Moves the tokens of several slots along with their cards: `to[i]` receives what lay on `from[i]`. */
function moveTokens(state: GameState, from: Slot[], to: Slot[]) {
  const held = from.map(s => state.tokens[slotKey(s)]);
  for (const s of from) delete state.tokens[slotKey(s)];
  to.forEach((s, i) => { if (held[i]) state.tokens[slotKey(s)] = held[i]; });
}

type Applied = { ev: LogEvent; hidden?: LogEntry["hidden"] } | null;
const INFORMATION: Effect["kind"][] = ["look", "learnSeats", "learnMoved", "count", "census", "witness"];

interface Ctx { state: GameState; seat: number; picks: Slot[]; named?: RoleId; progress: Progress; stepId: string; turn: number; rng: Rng; history: LogEntry[] }

function applyEffect(e: Effect, c: Ctx): Applied {
  const { state, seat, picks, progress } = c;
  const touch = (s: Slot) => { if (!state.moved.includes(slotKey(s))) state.moved.push(slotKey(s)); };
  const players = state.dealt.length;
  const ref = (r: Ref) => resolveRef(r, seat, players, picks, progress);
  switch (e.kind) {
    case "look": {
      const slots = e.targets === "picks" ? picks : e.targets.map(ref);
      const seen = slots.map(s => seenAt(state, s, seat, c.rng));
      const roles = seen.map(x => x.role);
      const hidden = seen.some(x => x.role !== x.truth) ? { truth: seen.map(x => x.truth) } : undefined;
      if (e.reveal === "role") { progress.seen[c.stepId] = roles; return { ev: { kind: "look", slots, roles }, hidden }; }
      return { ev: { kind: "look", slots, teams: roles.map(r => ROLE[r].team) }, hidden };
    }
    case "swap": {
      const a = ref(e.a), b = ref(e.b);
      if (sameSlot(a, b)) return null;
      const ca = cardAt(state, a), ia = instAt(state, a);
      setCard(state, a, cardAt(state, b), instAt(state, b)); setCard(state, b, ca, ia);
      moveTokens(state, [a, b], [b, a]);
      touch(a); touch(b);
      return { ev: { kind: "swap", a, b } };
    }
    case "rotate": {
      const held = picks.map(s => cardAt(state, s)), insts = picks.map(s => instAt(state, s));
      const next = picks.map((_, i) => picks[(i + 1) % picks.length]);
      picks.forEach((s, i) => { setCard(state, next[i], held[i], insts[i]); touch(s); });
      moveTokens(state, picks, next);
      return { ev: { kind: "rotate", slots: picks } };
    }
    case "announce": {
      // The two cards as the Herald's eyes see them (distortion applies); the game names one of the two at random.
      const seen = picks.map(s => seenAt(state, s, seat, c.rng));
      const role = seen[Math.floor(c.rng() * seen.length)].role;
      const atDawn = state.rules.dawnProclamations;
      // Always published as the Herald's, whoever made it (a Pale Herald, a copier): the label must not tell them apart.
      state.shown.push({ slots: picks, role, by: "herald", turn: c.turn, atDawn });
      return { ev: { kind: "announce", slots: picks, roles: [role], atDawn }, hidden: { cards: seen.map(x => x.role), ...(seen.some(x => x.role !== x.truth) ? { truth: seen.map(x => x.truth) } : {}) } };
    }
    case "count": return { ev: { kind: "count", label: e.label, n: state.cinst.filter(i => ROLE[effRole(state, i)].tags.includes(e.tag)).length } };
    case "adopt": {
      const role = effRole(state, instAt(state, picks[0]));
      state.adopted[String(seat)] = role; // the actor's dealt card is instance `seat`
      return { ev: { kind: "adopt", role } };
    }
    case "census": {
      if (state.rules.census === "off") return null;
      let roles = [...state.dealtCenter];
      if (state.rules.census === "three") roles = shuffle(roles, c.rng).slice(0, 3);
      if (state.rules.census === "allButOne") roles = shuffle(roles, c.rng).slice(0, Math.max(0, roles.length - 1));
      // Pack covers: each pack seat (by DEALT card) gets a different Centaur-team role from the centre to claim, the same
      // assignment for every pack member (it depends only on the deal), so their claims cannot collide with each other.
      const covers = state.rules.packCovers ? packCovers(state) : undefined;
      return { ev: { kind: "census", roles: roles.sort(), of: state.dealtCenter.length, ...(covers ? { covers } : {}) } };
    }
    case "distort": {
      const slot = picks[0];
      // A random card distortion picks its wrong role once, when cast, so every look at that card agrees; a random
      // viewer distortion draws afresh at each look.
      if (e.target === "card") {
        const role = e.value === "chosen" ? c.named! : wrongRole(state, cardAt(state, slot), c.rng);
        state.tokens[slotKey(slot)] = { ...state.tokens[slotKey(slot)], distort: role };
        return { ev: { kind: "distort", slot, role: e.value === "chosen" ? role : null }, hidden: e.value === "random" ? { role } : undefined };
      }
      if (slot.k !== "p") throw new Error("Only a player can be veiled.");
      state.veils[String(slot.i)] = { role: e.value === "chosen" ? c.named! : null };
      return { ev: { kind: "distort", viewer: slot.i, role: e.value === "chosen" ? c.named! : null } };
    }
    case "witness": {
      const made = state.shown.filter(s => s.by === e.by && !s.forged);
      return { ev: { kind: "witness", by: e.by, slots: made.flatMap(s => s.slots), roles: made.map(s => s.role) } };
    }
    case "forge": {
      state.shown.push({ slots: picks, role: c.named!, by: e.as, turn: c.turn, atDawn: true, forged: true });
      return { ev: { kind: "forge", slots: picks, roles: [c.named!], as: e.as } };
    }
    case "overhear": {
      const role = c.named!;
      let source = -1;
      for (let k = 1; k < players && source < 0; k++) { const i = (seat + k) % players; if (state.dealt[i] === role) source = i; }
      if (source >= 0) {
        const copied = c.history.filter(h => h.seat === source && h.role === role && h.turn <= c.turn).map(h => ({ step: h.step, ev: h.ev }));
        return { ev: { kind: "overhear", role, copied }, hidden: { source } };
      }
      if (!state.rules.eavesdropGhost) return { ev: { kind: "overhear", role, copied: [] }, hidden: { source: "none" } };
      return { ev: { kind: "overhear", role, copied: ghostLooks(role, state, seat, c.turn, c.rng) }, hidden: { source: "ghost" } };
    }
    case "bite": {
      const t = ref(e.target);
      if (t.k !== "p") throw new Error("Only a player can be bitten.");
      if (ROLE[effRole(state, instAt(state, t))].team === "werewolf" || state.bitten.some(b => b.seat === t.i)) return { ev: { kind: "bite", seat: t.i, took: false } };
      state.bitten.push({ seat: t.i, by: seat });
      return { ev: { kind: "bite", seat: t.i, took: true } };
    }
    case "mark": {
      const t = ref(e.target);
      if (t.k !== "p") throw new Error("Only a player can be marked.");
      state.marks[String(seat)] = t.i; // the actor's dealt card is instance `seat`
      return { ev: { kind: "mark", seat: t.i, label: e.label, public: e.public } };
    }
    case "learnSeats": {
      let seats = state.dealt.flatMap((r, i) => (i !== seat && ROLE[r].tags.includes(e.tag) ? [i] : []));
      if (e.limit !== undefined) seats = shuffle(seats, c.rng).slice(0, e.limit);
      return { ev: { kind: "seats", label: e.label, seats } };
    }
    case "learnMoved": {
      const slots: Slot[] = [...new Set([(seat + players - 1) % players, seat, (seat + 1) % players])].map(i => ({ k: "p" as const, i }));
      return { ev: { kind: "moved", slots, moved: slots.map(s => state.moved.includes(slotKey(s))) } };
    }
  }
}

/**
 * The Eavesdropper's own result when nobody holds the role it named: that role's information effects run from the
 * Eavesdropper's seat on random legal targets. Nothing moves, nothing is marked, and a proclamation becomes a private look.
 */
function ghostLooks(role: RoleId, state: GameState, seat: number, turn: number, rng: Rng): Overheard[] {
  const shape = shapeOf(state), progress = freshProgress(), out: Overheard[] = [];
  for (const step of ROLE[role].steps ?? []) {
    if (!stepApplies(step, seat, state)) continue;
    const picks = step.pick ? shuffle(legalTargets(step, seat, shape), rng).slice(0, pickCount(step, shape)) : [];
    progress.picks[step.id] = picks;
    for (const e of step.effects) {
      const eff: Effect | null = e.kind === "announce" ? { kind: "look", targets: "picks", reveal: "role" } : INFORMATION.includes(e.kind) ? e : null;
      if (!eff) continue;
      const r = applyEffect(eff, { state, seat, picks, progress, stepId: step.id, turn, rng, history: [] });
      if (r) out.push({ step: step.id, ev: r.ev });
    }
  }
  return out;
}

/**
 * Runs an actor's script as far as it can go: automatic steps happen, decided steps happen, and it stops at the first
 * step with no decision yet. With `force`, undecided steps get a uniformly random legal decision instead of stopping.
 * `live` names a step whose plan was just set during the actor's own turn, for the log. `history` is the night's log so
 * far (the Eavesdropper copies from it).
 */
export function advance(state: GameState, seat: number, plan: Plan, progress: Progress, turn: number, rng: Rng, opts: { force?: boolean; live?: string; history?: LogEntry[]; role?: RoleId } = {}): LogEntry[] {
  const role = ROLE[opts.role ?? state.dealt[seat]];
  const steps = role.steps ?? [];
  const shape = shapeOf(state);
  const log: LogEntry[] = [];
  while (!progress.done) {
    const step = steps[progress.step];
    if (!step) { progress.done = true; break; }
    const entry = (ev: LogEvent, via: LogEntry["via"], extra: Partial<LogEntry> = {}): LogEntry => ({ turn, seat, role: role.id, step: step.id, via, ev, ...extra });
    const why = stepVoid(step, seat, state);
    if (why) {
      // A step that does not happen is silent, unless the actor had queued something for it: then they are told.
      if (plan[step.id]) log.push(entry({ kind: "void", why: `${step.title}: did not happen, because ${why}.` }, "auto"));
      progress.step++;
      continue;
    }
    let decision: Decision | undefined, via: LogEntry["via"] = "auto", cond: LogEntry["cond"];
    if (isAuto(step)) decision = { kind: "do" };
    else {
      const src = condSource(role, step.id), seen = src ? progress.seen[src.id] : undefined;
      const chosen = resolveBranch(plan[step.id], seen);
      decision = chosen?.decision;
      via = opts.live === step.id ? "live" : "queued";
      if (chosen && seen && plan[step.id].branches.length) cond = { saw: seen, branch: chosen.branch };
      if (decision && validDecision(step, seat, shape, decision, role.id)) decision = undefined;
      if (!decision) {
        if (!opts.force) break;
        decision = randomDecision(step, seat, shape, rng, role.id); via = "forced"; cond = undefined;
      }
    }
    const extra = cond ? { cond } : {};
    if (decision.kind === "skip") log.push(entry({ kind: "skip" }, via, extra));
    else {
      const picks = decision.kind === "pick" ? decision.targets : [];
      const named = decision.kind === "pick" || decision.kind === "name" ? decision.role : undefined;
      progress.picks[step.id] = picks;
      const history = [...(opts.history ?? []), ...log];
      for (const e of step.effects) {
        const r = applyEffect(e, { state, seat, picks, named, progress, stepId: step.id, turn, rng, history });
        if (r) log.push(entry(r.ev, via, { ...extra, ...(r.hidden ? { hidden: r.hidden } : {}) }));
      }
    }
    progress.step++;
  }
  return log;
}

/** A seat's night: its own plan and progress, and for a copier, a plan per role it may become and the adopted script's progress. */
export interface NightSeat { plan: Plan; progress: Progress; adoptPlans?: Record<RoleId, Plan>; adoptProgress?: Progress }
const copies = (role: RoleId) => !!ROLE[role]?.steps?.some(s => s.effects.some(e => e.kind === "adopt"));

/** Who acts in a turn: seats whose dealt card acts then, and copiers whose adopted role acts then. */
export function actorsOf(state: GameState, turnRole: RoleId): { seat: number; as?: RoleId }[] {
  const out: { seat: number; as?: RoleId }[] = [];
  state.dealt.forEach((r, seat) => {
    if (turnKey(r) === turnRole) out.push({ seat });
    const a = state.adopted[String(seat)];
    if (a && turnKey(a) === turnRole && !copies(a) && ROLE[a]?.steps) out.push({ seat, as: a });
  });
  return out;
}

/**
 * Runs everyone who acts in a turn as far as their plans go (with `force`, to the end with random moves). A copier's
 * adopted script runs with the plan it queued for that role, if any (`adoptPlans[role]`), else live or forced.
 */
export function runTurn(state: GameState, turnRole: RoleId, seats: NightSeat[], turn: number, rng: Rng, history: LogEntry[], opts: { force?: boolean } = {}): LogEntry[] {
  const log: LogEntry[] = [];
  for (const a of actorsOf(state, turnRole)) {
    const s = seats[a.seat];
    if (a.as) log.push(...advance(state, a.seat, s.adoptPlans?.[a.as] ?? {}, (s.adoptProgress ??= freshProgress()), turn, rng, { ...opts, history: [...history, ...log], role: a.as }));
    else log.push(...advance(state, a.seat, s.plan, s.progress, turn, rng, { ...opts, history: [...history, ...log] }));
  }
  return log;
}

// ───────────────────────────── dawn ─────────────────────────────

/**
 * The night is over. A public mark nobody made (the Cuckoo in the centre) is made at random; if the deck holds a
 * Phoenix but no player holds one, every held Heir card becomes a Phoenix and its holder is told; the bitten player is
 * told; the proclamations are published together, in random order.
 * Returns the dawn notices, each addressed to the seat it concerns (`seat: -1` for the table).
 */
export function dawn(state: GameState, deck: RoleId[], turn: number, rng: Rng): LogEntry[] {
  const log: LogEntry[] = [];
  const players = state.dealt.length;
  void deck;
  // Centre cards whose role lays a public mark (an unheld Cuckoo): the game lays it at random.
  state.dealtCenter.forEach((id, n) => {
    const e = ROLE[id]?.steps?.flatMap(x => x.effects).find(x => x.kind === "mark" && x.public);
    const inst = String(players + n);
    if (!e || e.kind !== "mark" || inst in state.marks) return;
    const seat = Math.floor(rng() * players);
    state.marks[inst] = seat;
    log.push({ turn, seat: -1, role: id, step: "dawn", via: "auto", ev: { kind: "mark", seat, label: e.label, public: true, unheld: true } });
  });
  const allInst = [...state.inst, ...state.cinst];
  if (allInst.some(i => isPhoenix(state, i)) && !state.inst.some(i => isPhoenix(state, i))) {
    state.inst.forEach((inst, seat) => {
      if (!ROLE[effRole(state, inst)]?.heir) return;
      state.phoenixInst.push(inst);
      log.push({ turn, seat, role: effRole(state, inst), step: "dawn", via: "auto", ev: { kind: "heir" } });
    });
  }
  for (const b of state.bitten) log.push({ turn, seat: b.seat, role: state.dealt[b.seat], step: "dawn", via: "auto", ev: { kind: "bitten", by: state.rules.biteNamesBiter ? b.by : null } });
  state.shown = [...state.shown.filter(s => !s.atDawn), ...shuffle(state.shown.filter(s => s.atDawn), rng)];
  state.dawn = true;
  return log;
}

/** The proclamations a player may see now: the ones shown at once, and the dawn ones once the night is over. */
export const visibleShown = (state: GameState) => state.shown.filter(s => !s.atDawn || state.dawn);
/** Public marks a player may see now (the egg): only after dawn. */
export function publicMarks(state: GameState): { role: RoleId; seat: number; label: string }[] {
  if (!state.dawn) return [];
  return Object.entries(state.marks).flatMap(([inst, seat]) => {
    const role = state.instRole[Number(inst)];
    const e = ROLE[role]?.steps?.flatMap(s => s.effects).find(x => x.kind === "mark" && x.public);
    return e && e.kind === "mark" ? [{ role, seat, label: e.label }] : [];
  });
}

/** The Moon-Thief's swap, as the votes lock: two seats' cards change places. */
export function daySwap(state: GameState, a: number, b: number): LogEvent {
  [state.cards[a], state.cards[b]] = [state.cards[b], state.cards[a]];
  [state.inst[a], state.inst[b]] = [state.inst[b], state.inst[a]];
  return { kind: "daySwap", a, b };
}

// ───────────────────────────── day ─────────────────────────────

export interface Outcome {
  /** Weighted votes received per seat. */
  tally: number[];
  deaths: number[];
  winners: number[];
  /** The main result between the Centaurs and the Werewolves ("nobody" when neither wins). */
  winningTeam: Team | "nobody";
  headline: string;
  /** Wins and turns of fate beyond the team result, one sentence each. */
  notes: string[];
  /** The team each seat ended on, after rules that change it (bitten: Werewolf). */
  teams: Team[];
  /** One sentence per seat: why they won or lost. */
  why: string[];
  /** A Phoenix holder (or, with no Phoenix held, a Kindler under the fallback rule) was eliminated: the Pyre wins. */
  burned: boolean;
  /** Werewolf cards and Centaur-team players among the eliminated. */
  wolvesDown: number;
  centaursDown: number;
}

export interface ResolveInput {
  /** Seats whose vote the game cast at random. */
  forced?: number[];
  /** Bitten seats (a single bite, a list, or none). */
  bitten?: { seat: number; by: number } | { seat: number; by: number }[] | null;
  /** Marks keyed by card instance (with `held`), or by role id (without). */
  marks?: Record<string, number>;
  /** The card instance each seat holds (GameState.inst), to find each held card's marks. */
  held?: number[];
  /** Which seats hold a Phoenix (GameState via `isPhoenix`); without it, a Phoenix-tagged card. */
  phoenix?: boolean[];
  rules?: Partial<Rules>;
}

/**
 * Counts the vote and decides the winners, by the cards players HOLD at the count (copies applied: pass
 * `heldRoles(state)` as `cards`). Order (docs/rules-reference.md section 5): day swaps must already be applied; tally;
 * teams; main result (decoy, no Werewolf held, Blood Price); the burning (Pyre, and with the rule, its denial of the main
 * teams); loners (Cuckoo, then Oxpecker); a sentence per seat saying why.
 */
export function resolveVote(cards: RoleId[], votes: (number | null)[], input: ResolveInput = {}): Outcome {
  const rules = { ...DEFAULT_RULES, ...input.rules };
  const n = cards.length;
  const markOf = (i: number): number | undefined => (input.marks ?? {})[input.held ? String(input.held[i]) : cards[i]];
  const phoenix = input.phoenix ?? cards.map(r => ROLE[r].tags.includes("phoenix"));
  const holdsTag = (i: number, tag: string) => (tag === "phoenix" ? phoenix[i] : ROLE[cards[i]].tags.includes(tag));
  const tally = Array<number>(n).fill(0);
  votes.forEach((v, i) => {
    if (v === null) return;
    const w = ROLE[cards[i]].vote;
    tally[v] += w?.weightAgainst && holdsTag(v, w.weightAgainst.tag) ? w.weightAgainst.weight : w?.weight ?? 1;
  });
  const top = Math.max(...tally);
  let deaths = top >= rules.eliminationVotes ? tally.flatMap((t, i) => (t === top ? [i] : [])) : [];
  const protectedSeats = new Set(votes.flatMap((v, i) => (v !== null && ROLE[cards[i]].vote?.protectsTarget ? [v] : [])));
  deaths = deaths.filter(d => !protectedSeats.has(d));
  const notes: string[] = [];
  for (let i = 0; i < deaths.length; i++) {
    const d = deaths[i], v = votes[d];
    if (ROLE[cards[d]].vote?.takesTargetDown && v !== null && !deaths.includes(v) && !protectedSeats.has(v)) { deaths.push(v); notes.push(`${ROLE[cards[d]].name} fell and took their target down too.`); }
  }
  deaths.sort((a, b) => a - b);
  const dead = (i: number) => deaths.includes(i);

  // ── teams ──
  const bittenSeats = new Set((Array.isArray(input.bitten) ? input.bitten : input.bitten ? [input.bitten] : []).map(b => b.seat));
  const teams: Team[] = cards.map((r, i) => (bittenSeats.has(i) ? "werewolf" : ROLE[r].team));
  const seatsOf = (team: Team) => teams.flatMap((t, i) => (t === team ? [i] : []));
  const isWolf = (i: number) => ROLE[cards[i]].tags.includes("wolf");
  const wolvesHeld = cards.some((_, i) => isWolf(i));
  // Condemned Blood Price (rule bloodPriceCondemned): a Centaur-team death counts in C only if someone NOT on the
  // Werewolf team voted for them, so a wolf bloc cannot buy a Blood Price tie with its own votes alone.
  const condemned = (i: number) => votes.some((v, j) => v === i && teams[j] !== "werewolf");
  const uncondemned = rules.bloodPriceCondemned ? deaths.filter(i => teams[i] === "centaur" && !condemned(i)) : [];
  const W = deaths.filter(isWolf).length, C = deaths.filter(i => teams[i] === "centaur" && !uncondemned.includes(i)).length;
  if (uncondemned.length) notes.push(`Only Werewolf-team players voted for ${uncondemned.length === 1 ? "one eliminated Centaur" : `${uncondemned.length} eliminated Centaurs`}, so under "Blood Price counts the condemned" ${uncondemned.length === 1 ? "that death does" : "those deaths do"} not count against the Centaurs.`);
  const winners = new Set<number>();
  const why: string[] = Array(n).fill("");

  // ── main result ──
  let winningTeam: Outcome["winningTeam"], headline: string, reason: string, byBloodCount = false;
  const decoy = deaths.find(i => ROLE[cards[i]].decoy && teams[i] === ROLE[cards[i]].team);
  if (decoy !== undefined) {
    winningTeam = ROLE[cards[decoy]].team;
    reason = `the ${ROLE[cards[decoy]].name} was eliminated`;
    headline = `The ${ROLE[cards[decoy]].name} was eliminated, so the Werewolf team wins${W ? ", even though a Werewolf fell too" : ""}.`;
  } else if (!wolvesHeld) {
    if (!deaths.length) {
      winningTeam = "centaur"; reason = "nobody held a Werewolf card and nobody was eliminated";
      headline = "No player held a Werewolf card and nobody was eliminated. The Centaurs win.";
    } else if (seatsOf("werewolf").some(i => !dead(i))) {
      winningTeam = "werewolf"; reason = "nobody held a Werewolf card, yet someone was eliminated (only its surviving members win)";
      headline = "No player held a Werewolf card, but the herd turned on itself. The Werewolf team's survivors win.";
    } else {
      winningTeam = "nobody"; reason = "nobody held a Werewolf card, yet someone was eliminated";
      headline = "No player held a Werewolf card, and someone was eliminated anyway. No main team wins.";
    }
  } else if (rules.bloodPrice ? W > C : W > 0) {
    winningTeam = "centaur"; byBloodCount = true;
    reason = C ? `more Werewolves than Centaurs were eliminated (${W} to ${C})` : W === 1 ? "a Werewolf was eliminated" : `${W} Werewolves were eliminated`;
    headline = C ? `More Werewolves than Centaurs were eliminated (${W} to ${C}). The Centaurs win.` : `${W === 1 ? "A Werewolf was" : `${W} Werewolves were`} eliminated. The Centaurs win.`;
  } else {
    winningTeam = "werewolf";
    if (!deaths.length) { reason = "nobody was eliminated"; headline = "Nobody was eliminated. The Werewolf team wins."; }
    else if (!W) { reason = "no Werewolf was eliminated"; headline = "No Werewolf was eliminated. The Werewolf team wins."; }
    else { reason = `as many Centaurs as Werewolves fell (${W} to ${C}), and the Blood Price makes that a Centaur loss`; headline = `A Werewolf fell, but so did ${C === 1 ? "a Centaur" : `${C} Centaurs`} (${W} to ${C}): under the Blood Price the Werewolf team wins.`; }
  }

  // ── the burning ──
  const phoenixHeld = phoenix.some(Boolean);
  const burned = phoenixHeld ? deaths.some(i => phoenix[i]) : rules.pyreFallback === "kindler" && deaths.some(i => teams[i] === "pyre");
  if (burned && rules.burningDeniesWolves && !(winningTeam === "centaur" && byBloodCount)) {
    reason = `${reason}, but a burning denied it`;
    headline = `${headline.replace(/ (The )?(Werewolf team|Centaurs) wins?( [^.]*)?\.$/, "")} A Phoenix burned, so the Pyre wins and ${winningTeam === "werewolf" ? "the Werewolf team is denied" : "no main team wins"}.`;
    winningTeam = "nobody";
  } else if (burned) headline = `${headline} A Phoenix burned: the Pyre wins too.`;
  if (winningTeam === "centaur" || winningTeam === "werewolf") {
    if (reason.includes("surviving members")) seatsOf("werewolf").filter(i => !dead(i)).forEach(i => winners.add(i));
    else seatsOf(winningTeam).forEach(i => winners.add(i));
  }
  if (burned) seatsOf("pyre").forEach(i => winners.add(i));
  const pyreReason = burned
    ? phoenixHeld ? "a player holding a Phoenix was eliminated (a burning)" : "no player held a Phoenix and a Kindler was eliminated (the fallback burning)"
    : phoenixHeld ? "no player holding a Phoenix was eliminated" : rules.pyreFallback === "kindler" ? "no player held a Phoenix and no Kindler was eliminated" : "no player held a Phoenix";

  // ── loners ──
  for (let i = 0; i < n; i++) {
    if (teams[i] !== "loner" || ROLE[cards[i]].win !== "markEliminated") continue;
    const m = markOf(i), name = ROLE[cards[i]].name;
    if (m === undefined) why[i] = `held the ${name}, which marked nobody, so lost`;
    else if (dead(i)) why[i] = `held the ${name} and lost, because they were eliminated themselves`;
    else if (!dead(m)) why[i] = `held the ${name} and lost, because the marked seat ${m} was not eliminated`;
    else { winners.add(i); why[i] = `held the ${name} and won, because the marked seat ${m} was eliminated and they were not`; }
  }
  for (let i = 0; i < n; i++) {
    if (teams[i] !== "loner" || ROLE[cards[i]].win !== "markWins") continue;
    const host = markOf(i), name = ROLE[cards[i]].name;
    if (host === undefined || host === i) why[i] = `held the ${name}, bonded to ${host === i ? "their own seat" : "nobody"}, so lost`;
    else if (winners.has(host)) { winners.add(i); why[i] = `held the ${name} and won with the seat it bonded to (seat ${host}), which won`; }
    else why[i] = `held the ${name} and lost with the seat it bonded to (seat ${host}), which lost`;
  }

  // ── why, for everyone else ──
  const teamWord: Record<Team, string> = { centaur: "the Centaur team", werewolf: "the Werewolf team", pyre: "the Pyre", loner: "no team" };
  for (let i = 0; i < n; i++) {
    if (!why[i]) {
      const t = teams[i], on = bittenSeats.has(i) ? `was bitten, so played for ${teamWord[t]}` : `held the ${ROLE[cards[i]].name}, on ${teamWord[t]}`;
      if (t === "pyre") why[i] = `${on}, which ${burned ? "won" : "lost"} because ${pyreReason}`;
      else if (winningTeam === "nobody") why[i] = `${on}, and no main team won because ${reason}`;
      else if (t === winningTeam) why[i] = winners.has(i) ? `${on}, which won because ${reason}` : `${on}, which won because ${reason}, but only its surviving members win`;
      else why[i] = `${on}, which lost because ${reason}`;
    }
    why[i] = `${winners.has(i) ? "Won" : "Lost"}: ${why[i]}.`;
  }
  for (let i = 0; i < n; i++) if (teams[i] === "loner" && winners.has(i)) notes.push(`Seat ${i} won as the ${ROLE[cards[i]].name}.`);
  return { tally, deaths, winners: [...winners].sort((a, b) => a - b), winningTeam, headline, notes, teams, why, burned, wolvesDown: W, centaursDown: C };
}

/** Deck checks for the lobby: the count, each role's copy limit, and the deck rules of the roster and table rules. */
export function deckProblem(deck: RoleId[], players: number, center: number, rules: Partial<Rules> = {}): string | null {
  const r = { ...DEFAULT_RULES, ...rules };
  if (players < 3) return `Needs 3 players (${players} seated).`;
  if (center < CENTER_MIN || center > CENTER_MAX) return `The centre holds ${CENTER_MIN} to ${CENTER_MAX} cards.`;
  const need = players + center;
  if (deck.length !== need) return `The deck needs ${need} cards: ${players} players and ${center} in the centre (it has ${deck.length}).`;
  for (const id of new Set(deck)) {
    if (!ROLE[id]) return `Unknown role ${id}.`;
    if (deck.filter(x => x === id).length > ROLE[id].max) return `Too many copies of ${ROLE[id].name}.`;
  }
  // The evidence amendment: every public artefact the game vouches for must be one a defector could have made, so each
  // card that publishes one comes with a card that forges it, and nothing in the timing tells the two apart.
  const proclaims = deck.some(id => ROLE[id].steps?.some(st => st.effects.some(e => e.kind === "announce")));
  if (deck.includes("forger") && !proclaims) return "A Forger needs a Herald (or a Pale Herald) in the deck.";
  if (proclaims && !deck.includes("forger")) return "A Herald needs a Forger in the deck: every proclamation must be one a Forger could have made.";
  if ((proclaims || deck.includes("forger")) && !r.dawnProclamations) return "Proclamations need the \"Proclamations at dawn\" rule: otherwise the timing tells a forgery from a real one.";
  if (deck.some(id => ROLE[id].chat === "forge" && !["signet", "notary"].some(x => deck.includes(x)))) return "A card that forges seals (Counterfeiter, False Witness) needs a Signet or a Notary in the deck: there must be a seal to forge.";
  if (deck.some(id => ROLE[id].chat === "signed" || ROLE[id].chat === "report") && !deck.some(id => ROLE[id].chat === "forge")) return "A Signet or a Notary needs a card that forges seals (Counterfeiter or False Witness) in the deck: every seal must be one a defector could have made.";
  if (r.daySwap && deck.some(id => ROLE[id].dayPower === "swap") && players < r.thiefMinPlayers) return `The Moon-Thief needs ${r.thiefMinPlayers} or more players at this table (the "Moon-Thief table size" rule).`;
  return null;
}

/** The pack-covers assignment (rule packCovers): pack seats in seat order, each given a distinct Centaur-team role dealt to the centre, or null when there are fewer such roles than pack seats. Deterministic in the deal. */
export function packCovers(state: GameState): { seat: number; role: RoleId | null }[] {
  const pack = state.dealt.flatMap((r, i) => (ROLE[r].tags.includes("pack") ? [i] : []));
  const pool = [...new Set(state.dealtCenter.filter(r => ROLE[r].team === "centaur"))].sort();
  const offset = pool.length ? pack.reduce((a, i) => a + i, 0) % pool.length : 0;
  return pack.map((seat, k) => ({ seat, role: k < pool.length ? pool[(offset + k) % pool.length] : null }));
}

/** The roles a copier may become, as shown to it before it copies: every distinct role of the DECK except its own, in deck order. Never derived from the deal (that would leak the centre). */
export function copierOptions(deck: RoleId[], self: RoleId): RoleId[] {
  return [...new Set(deck)].filter(r => r !== self);
}
