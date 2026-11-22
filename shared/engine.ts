/**
 * The pure game engine: no Convex, no React, no clock. The server (convex/) calls it inside mutations and the client
 * uses the same functions to show legal targets and plan coverage, so the two can never disagree.
 */
import { CENTER_MAX, CENTER_MIN, condSource, legalRoles, pickCount, ROLE, roleName, sameSlot, slotKey, type Effect, type Ref, type RoleDef, type RoleId, type Shape, type Slot, type StepDef, type Team, type WinRule } from "./roles";
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

/** A proclamation: a card as it was at one moment of the night, shown to everyone (at dawn, under that table rule). */
export interface Shown {
  slot: Slot;
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
  /** Seats that became an Imago at dawn. */
  imago: number[];
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
/** The night turn a role acts in: its own, or its original's for a twin. */
export const turnKey = (role: RoleId): RoleId => ROLE[role]?.twinOf ?? role;
export const freshProgress = (): Progress => ({ step: 0, picks: {}, seen: {}, done: false });

/** A copied journal line: what the player dealt a role did and learned at one of its steps. */
export interface Overheard { step: string; ev: LogEvent }

export type LogEvent =
  | { kind: "look"; slots: Slot[]; roles?: RoleId[]; teams?: Team[] }
  | { kind: "swap"; a: Slot; b: Slot }
  | { kind: "seats"; label: string; seats: number[] }
  | { kind: "moved"; slots: Slot[]; moved: boolean[] }
  | { kind: "rotate"; slots: Slot[] }
  | { kind: "announce"; slots: Slot[]; roles: RoleId[]; atDawn: boolean }
  | { kind: "count"; label: string; n: number }
  | { kind: "census"; roles: RoleId[]; of: number }
  /** A distortion cast: on a card (`slot`) or on a viewer (`viewer`); `role` null means a random wrong role per look. */
  | { kind: "distort"; slot?: Slot; viewer?: number; role: RoleId | null }
  | { kind: "witness"; by: RoleId; slots: Slot[]; roles: RoleId[] }
  | { kind: "forge"; slots: Slot[]; roles: RoleId[]; as: RoleId }
  | { kind: "overhear"; role: RoleId; copied: Overheard[] }
  | { kind: "bite"; seat: number; took: boolean }
  | { kind: "mark"; seat: number; label: string; public: boolean; unheld?: boolean }
  /** Dawn notices, each to the seat it concerns. */
  | { kind: "bitten"; by: number | null }
  | { kind: "imago" }
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
  hidden?: { truth?: RoleId[]; source?: number | "ghost" | "none"; role?: RoleId };
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
    moved: [], shown: [], marks: {}, tokens: {}, veils: {}, bitten: [], imago: [], dawn: false, rules: { ...DEFAULT_RULES, ...rules },
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
      const seen = picks.map(s => seenAt(state, s, seat, c.rng));
      const atDawn = state.rules.dawnProclamations;
      picks.forEach((slot, i) => state.shown.push({ slot, role: seen[i].role, by: state.dealt[seat], turn: c.turn, atDawn }));
      return { ev: { kind: "announce", slots: picks, roles: seen.map(x => x.role), atDawn }, hidden: seen.some(x => x.role !== x.truth) ? { truth: seen.map(x => x.truth) } : undefined };
    }
    case "count": return { ev: { kind: "count", label: e.label, n: state.center.filter(r => ROLE[r].tags.includes(e.tag)).length } };
    case "census": {
      if (state.rules.census === "off") return null;
      let roles = [...state.dealtCenter];
      if (state.rules.census === "three") roles = shuffle(roles, c.rng).slice(0, 3);
      return { ev: { kind: "census", roles: roles.sort(), of: state.dealtCenter.length } };
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
      return { ev: { kind: "witness", by: e.by, slots: made.map(s => s.slot), roles: made.map(s => s.role) } };
    }
    case "forge": {
      for (const slot of picks) state.shown.push({ slot, role: c.named!, by: e.as, turn: c.turn, atDawn: true, forged: true });
      return { ev: { kind: "forge", slots: picks, roles: picks.map(() => c.named!), as: e.as } };
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
      if (ROLE[cardAt(state, t)].team === "werewolf" || state.bitten.some(b => b.seat === t.i)) return { ev: { kind: "bite", seat: t.i, took: false } };
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
export function advance(state: GameState, seat: number, plan: Plan, progress: Progress, turn: number, rng: Rng, opts: { force?: boolean; live?: string; history?: LogEntry[] } = {}): LogEntry[] {
  const role = ROLE[state.dealt[seat]];
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

// ───────────────────────────── dawn ─────────────────────────────

/**
 * The night is over. A public mark nobody made (the Cuckoo in the centre) is made at random; seats whose metamorph
 * card was moved become Imagos; the bitten player is told; the proclamations are published together, in random order.
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
  const bitten = new Set(state.bitten.map(b => b.seat));
  state.dealt.forEach((r, i) => {
    if (!ROLE[r].metamorph || bitten.has(i) || !state.moved.includes(slotKey({ k: "p", i }))) return;
    state.imago.push(i);
    log.push({ turn, seat: i, role: r, step: "dawn", via: "auto", ev: { kind: "imago" } });
  });
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
  winningTeam: Team | "nobody";
  headline: string;
  /** Wins and turns of fate beyond the team result, one sentence each. */
  notes: string[];
  /** The team each seat ended on, after rules that change it (bitten: Werewolf; Imago: Wildwood). */
  teams: Team[];
  /** One sentence per seat: why they won or lost. */
  why: string[];
  /** Seats that lost to the Sporeling's curse. */
  cursed: number[];
  /** Werewolf cards and Centaur-team players among the eliminated. */
  wolvesDown: number;
  centaursDown: number;
}

export interface ResolveInput {
  /** Seats whose vote the game cast at random. */
  forced?: number[];
  /** Bitten seats (a single bite, a list, or none). */
  bitten?: { seat: number; by: number } | { seat: number; by: number }[] | null;
  imago?: number[];
  /** Marks keyed by card instance (with `held`), or by role id (without). */
  marks?: Record<string, number>;
  /** The card instance each seat holds (GameState.inst), to find each held card's marks. */
  held?: number[];
  rules?: Partial<Rules>;
}


/**
 * Counts the vote and decides the winners, by the cards players HOLD at the count (docs/design/synthesis.md 3.4):
 * tally; teams (bitten, Imago, card); the main result (decoy, no wolf held, Blood Price); the creatures; the curse;
 * the Oxpecker; and a sentence per seat saying why. Any day swap must already have been applied to `cards`.
 */
export function resolveVote(cards: RoleId[], votes: (number | null)[], input: ResolveInput = {}): Outcome {
  const rules = { ...DEFAULT_RULES, ...input.rules };
  const n = cards.length;
  const forced = new Set(input.forced ?? []);
  const markOf = (i: number): number | undefined => (input.marks ?? {})[input.held ? String(input.held[i]) : cards[i]];
  const tally = Array<number>(n).fill(0);
  votes.forEach((v, i) => { if (v !== null) tally[v] += ROLE[cards[i]].vote?.weight ?? 1; });
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
  const imago = new Set((input.imago ?? []).filter(i => !bittenSeats.has(i)));
  const teams: Team[] = cards.map((r, i) => (bittenSeats.has(i) ? "werewolf" : imago.has(i) ? "wild" : ROLE[r].team));
  const creature = (i: number) => teams[i] === "wild";
  const winRule = (i: number): WinRule | undefined => (imago.has(i) ? "eliminated" : creature(i) ? ROLE[cards[i]].win : undefined);
  const seatsOf = (team: Team) => teams.flatMap((t, i) => (t === team ? [i] : []));
  const isWolf = (i: number) => ROLE[cards[i]].tags.includes("wolf");
  const wolvesHeld = cards.some((_, i) => isWolf(i));
  const W = deaths.filter(isWolf).length, C = deaths.filter(i => teams[i] === "centaur").length;
  const winners = new Set<number>();
  const why: string[] = Array(n).fill("");

  // ── main result ──
  let winningTeam: Outcome["winningTeam"], headline: string, reason: string;
  const decoy = deaths.find(i => ROLE[cards[i]].decoy && teams[i] === ROLE[cards[i]].team);
  if (decoy !== undefined) {
    winningTeam = ROLE[cards[decoy]].team;
    reason = `the ${ROLE[cards[decoy]].name} was eliminated`;
    headline = `The ${ROLE[cards[decoy]].name} was eliminated, so the ${winningTeam === "werewolf" ? "Werewolf team" : "Centaurs"} win${winningTeam === "werewolf" ? "s" : ""}${W ? ", even though a Werewolf fell too" : ""}.`;
    seatsOf(winningTeam).forEach(i => winners.add(i));
  } else if (!wolvesHeld) {
    if (!deaths.length) {
      winningTeam = "centaur"; reason = "nobody held a Werewolf card and nobody was eliminated";
      headline = "No player held a Werewolf card and nobody was eliminated. The Centaurs win.";
      seatsOf("centaur").forEach(i => winners.add(i));
    } else {
      const allies = seatsOf("werewolf").filter(i => !dead(i));
      if (allies.length) {
        winningTeam = "werewolf"; reason = "nobody held a Werewolf card, yet someone was eliminated (only its surviving members win)";
        headline = "No player held a Werewolf card, but the herd turned on itself. The Werewolf team's survivors win.";
        allies.forEach(i => winners.add(i));
      } else {
        winningTeam = "nobody"; reason = "nobody held a Werewolf card, yet someone was eliminated";
        headline = "No player held a Werewolf card, and someone was eliminated anyway. No team wins.";
      }
    }
  } else if (rules.bloodPrice ? W > C : W > 0) {
    winningTeam = "centaur";
    reason = C ? `more Werewolves than Centaurs were eliminated (${W} to ${C})` : W === 1 ? "a Werewolf was eliminated" : `${W} Werewolves were eliminated`;
    headline = C ? `More Werewolves than Centaurs were eliminated (${W} to ${C}). The Centaurs win.` : `${W === 1 ? "A Werewolf was" : `${W} Werewolves were`} eliminated. The Centaurs win.`;
    seatsOf("centaur").forEach(i => winners.add(i));
  } else {
    winningTeam = "werewolf";
    if (!deaths.length) { reason = "nobody was eliminated"; headline = "Nobody was eliminated. The Werewolf team wins."; }
    else if (!W) { reason = "no Werewolf was eliminated"; headline = "No Werewolf was eliminated. The Werewolf team wins."; }
    else { reason = `as many Centaurs as Werewolves fell (${W} to ${C}), and the Blood Price makes that a Centaur loss`; headline = `A Werewolf fell, but so did ${C === 1 ? "a Centaur" : `${C} Centaurs`} (${W} to ${C}): under the Blood Price the Werewolf team wins.`; }
    seatsOf("werewolf").forEach(i => winners.add(i));
  }

  // ── creatures ──
  const keystoneDead = deaths.some(i => winRule(i) === "keystone");
  const creatureWhy = (i: number): string => {
    const rule = winRule(i), name = imago.has(i) ? "Imago" : ROLE[cards[i]].name;
    if (rule === "keystone") {
      if (dead(i)) return `held the ${name} and was eliminated, so lost (and took the whole wood down)`;
      const fallen = deaths.filter(j => j !== i && creature(j));
      if (fallen.length) return `held the ${name} and lost, because another creature was eliminated`;
      winners.add(i); return `held the ${name} and won, because no creature was eliminated`;
    }
    if (keystoneDead) return `held the ${name}, but the Elderbark was eliminated, so no other creature wins`;
    if (rule === "eliminated") {
      if (dead(i)) { winners.add(i); return imago.has(i) ? "became an Imago when their card was moved in the night, and won by being eliminated" : `held the ${name} and won by being eliminated`; }
      return imago.has(i) ? "became an Imago when their card was moved in the night, and lost because they were not eliminated" : `held the ${name} and lost because they were not eliminated`;
    }
    if (rule === "markEliminated") {
      const m = markOf(i);
      if (m === undefined) return `held the ${name}, which marked nobody, so lost`;
      if (dead(i)) return `held the ${name} and lost, because they were eliminated themselves`;
      if (!dead(m)) return `held the ${name} and lost, because the marked seat ${m} was not eliminated`;
      winners.add(i); return `held the ${name} and won, because the marked seat ${m} was eliminated and they were not`;
    }
    return "";
  };
  for (let i = 0; i < n; i++) if (creature(i) && winRule(i) !== "markWins") why[i] = creatureWhy(i);

  // ── curse ──
  const cursers = deaths.filter(i => creature(i) && ROLE[cards[i]].curse);
  const cursed = votes.flatMap((v, j) => (v !== null && cursers.includes(v) && (rules.randomVotesCurse || !forced.has(j)) ? [j] : []));

  // ── the Oxpecker: follows its host, after the curse ──
  for (let i = 0; i < n; i++) {
    if (winRule(i) !== "markWins") continue;
    const host = markOf(i), name = ROLE[cards[i]].name;
    if (host === undefined || host === i) why[i] = `held the ${name}, bonded to ${host === i ? "their own seat" : "nobody"}, so lost`;
    else if (keystoneDead) why[i] = `held the ${name}, but the Elderbark was eliminated, so no other creature wins`;
    else if (winners.has(host) && !cursed.includes(host)) { winners.add(i); why[i] = `held the ${name} and won with the seat it bonded to (seat ${host}), which won`; }
    else why[i] = `held the ${name} and lost with the seat it bonded to (seat ${host}), which lost`;
  }
  for (const j of cursed) winners.delete(j);

  // ── why, for everyone else ──
  const teamWord: Record<Team, string> = { centaur: "the Centaur team", werewolf: "the Werewolf team", wild: "the Wildwood" };
  for (let i = 0; i < n; i++) {
    if (!why[i]) {
      const t = teams[i], on = bittenSeats.has(i) ? `was bitten, so played for ${teamWord[t]}` : `held the ${ROLE[cards[i]].name}, on ${teamWord[t]}`;
      if (winningTeam === "nobody") why[i] = `${on}, and no team won because ${reason}`;
      else if (t === winningTeam) why[i] = winners.has(i) || cursed.includes(i) ? `${on}, which won because ${reason}` : `${on}, which won because ${reason}, but only its surviving members win`;
      else why[i] = `${on}, which lost because ${reason}`;
    }
    if (cursed.includes(i)) why[i] += `; then voted for the Sporeling holder (seat ${votes[i]}), who was eliminated, so lost to the curse`;
    why[i] = `${winners.has(i) ? "Won" : "Lost"}: ${why[i]}.`;
  }

  for (let i = 0; i < n; i++) if (creature(i) && winners.has(i)) notes.push(`Seat ${i} won as the ${imago.has(i) ? "Imago" : ROLE[cards[i]].name}.`);
  if (cursed.length) notes.push(`The Sporeling's curse: ${cursed.map(j => `seat ${j}`).join(", ")} voted for it and lost.`);
  return { tally, deaths, winners: [...winners].sort((a, b) => a - b), winningTeam, headline, notes, teams, why, cursed, wolvesDown: W, centaursDown: C };
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
  if (deck.includes("forger") && !deck.includes("herald")) return "A Forger needs a Herald in the deck.";
  if (deck.includes("forger") && !r.dawnProclamations) return "A Forger needs the \"Proclamations at dawn\" rule: otherwise the timing gives the forgery away.";
  if (deck.some(id => ROLE[id].dayPower === "swap") && players < r.thiefMinPlayers) return `The Moon-Thief needs ${r.thiefMinPlayers} or more players at this table (the "Moon-Thief table size" rule).`;
  return null;
}
