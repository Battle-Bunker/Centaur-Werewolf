/**
 * The pure game engine: no Convex, no React, no clock. The server (convex/) calls it inside mutations and the client
 * uses the same functions to show legal targets and plan coverage, so the two can never disagree.
 */
import { CENTER_CARDS, ROLE, condSource, sameSlot, slotKey, type Effect, type Ref, type RoleDef, type RoleId, type Slot, type StepDef, type Team } from "./roles";

export type Rng = () => number;

// ───────────────────────────── plans ─────────────────────────────

/** What an actor does at one step: pick targets, go ahead with a yes/no step, or decline an optional step. */
export type Decision = { kind: "pick"; targets: Slot[] } | { kind: "do" } | { kind: "skip" };

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
  if (!plan) return undefined;
  if (seen) for (const b of plan.branches) if (b.roles.some(r => seen.includes(r))) return b.decision;
  return plan.otherwise;
}

/** The roles a step's plan leaves undecided, out of the roles the actor could see. Empty: fully queued. */
export function uncovered(plan: StepPlan | undefined, outcomes: RoleId[]): RoleId[] {
  if (!plan) return outcomes;
  if (plan.otherwise) return [];
  const named = new Set(plan.branches.flatMap(b => b.roles));
  return outcomes.filter(r => !named.has(r));
}

// ───────────────────────────── state ─────────────────────────────

export interface GameState {
  /** The role each seat was dealt: it decides who wakes when, whatever happens to the card later. */
  dealt: RoleId[];
  /** The card each seat holds now. */
  cards: RoleId[];
  center: RoleId[];
  /** Keys of the slots whose card has changed tonight. */
  moved: string[];
}

/** One actor's place in their night script. */
export interface Progress {
  step: number;
  picks: Record<string, Slot[]>;
  /** Roles seen at each step that looked at a card's role. */
  seen: Record<string, RoleId[]>;
  done: boolean;
}
export const freshProgress = (): Progress => ({ step: 0, picks: {}, seen: {}, done: false });

export type LogEvent =
  | { kind: "look"; slots: Slot[]; roles?: RoleId[]; teams?: Team[] }
  | { kind: "swap"; a: Slot; b: Slot }
  | { kind: "seats"; label: string; seats: number[] }
  | { kind: "moved"; slots: Slot[]; moved: boolean[] }
  | { kind: "skip" };

export interface LogEntry {
  turn: number;
  seat: number;
  role: RoleId;
  step: string;
  /** How the decision was made. */
  via: "auto" | "queued" | "live" | "forced";
  ev: LogEvent;
}

export function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function deal(deck: RoleId[], players: number, rng: Rng): GameState {
  if (deck.length !== players + CENTER_CARDS) throw new Error(`The deck needs ${players + CENTER_CARDS} cards for ${players} players.`);
  const cards = shuffle(deck, rng);
  const dealt = cards.slice(0, players);
  return { dealt, cards: [...dealt], center: cards.slice(players), moved: [] };
}

/** The roles in the deck that take a night turn, in wake order: one turn each, whether dealt or in the centre. */
export function nightTurns(deck: RoleId[]): RoleId[] {
  return [...new Set(deck)].filter(r => ROLE[r]?.steps && ROLE[r].wake !== undefined).sort((a, b) => ROLE[a].wake! - ROLE[b].wake!);
}

// ───────────────────────────── steps ─────────────────────────────

export function legalTargets(step: StepDef, seat: number, players: number): Slot[] {
  if (!step.pick) return [];
  const out: Slot[] = [];
  for (const pool of step.pick.pools) {
    if (pool === "self") out.push({ k: "p", i: seat });
    if (pool === "others") for (let i = 0; i < players; i++) if (i !== seat) out.push({ k: "p", i });
    if (pool === "center") for (let i = 0; i < CENTER_CARDS; i++) out.push({ k: "c", i });
  }
  return out;
}

/** Whether a step happens at all for this actor (the lone-wolf rule). */
export function stepApplies(step: StepDef, seat: number, state: GameState): boolean {
  if (!step.onlyIfAlone) return true;
  return !state.dealt.some((r, i) => i !== seat && ROLE[r].tags.includes(step.onlyIfAlone!));
}

/** A step with nothing to decide: it just happens when the actor's turn comes. */
export const isAuto = (step: StepDef) => !step.pick && !step.optional;

export function validDecision(step: StepDef, seat: number, players: number, d: Decision): string | null {
  if (d.kind === "skip") return step.optional ? null : "This step cannot be skipped.";
  if (d.kind === "do") return step.pick ? "Choose a target." : null;
  if (!step.pick) return "This step takes no target.";
  if (d.targets.length !== step.pick.count) return `Choose ${step.pick.count} target${step.pick.count === 1 ? "" : "s"}.`;
  const legal = legalTargets(step, seat, players);
  for (const [n, t] of d.targets.entries()) {
    if (!legal.some(l => sameSlot(l, t))) return "That target is not allowed.";
    if (d.targets.findIndex(o => sameSlot(o, t)) !== n) return "Choose different targets.";
  }
  return null;
}

export function validPlan(role: RoleDef, stepId: string, seat: number, players: number, plan: StepPlan): string | null {
  const step = role.steps?.find(s => s.id === stepId);
  if (!step) return "No such step.";
  if (isAuto(step)) return "Nothing to decide at this step.";
  if (plan.branches.length && !condSource(role, stepId)) return "This step has nothing to be conditional on.";
  for (const d of [...plan.branches.map(b => b.decision), ...(plan.otherwise ? [plan.otherwise] : [])]) {
    const err = validDecision(step, seat, players, d);
    if (err) return err;
  }
  return null;
}

export function randomDecision(step: StepDef, seat: number, players: number, rng: Rng): Decision {
  const options: Decision[] = [];
  if (step.pick) {
    const legal = legalTargets(step, seat, players);
    if (step.pick.count === 1) for (const t of legal) options.push({ kind: "pick", targets: [t] });
    else options.push({ kind: "pick", targets: shuffle(legal, rng).slice(0, step.pick.count) });
  } else options.push({ kind: "do" });
  if (step.optional) options.push({ kind: "skip" });
  return options[Math.floor(rng() * options.length)];
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

const cardAt = (state: GameState, s: Slot) => (s.k === "p" ? state.cards[s.i] : state.center[s.i]);
const setCard = (state: GameState, s: Slot, r: RoleId) => { if (s.k === "p") state.cards[s.i] = r; else state.center[s.i] = r; };

function applyEffect(e: Effect, state: GameState, seat: number, picks: Slot[], progress: Progress, stepId: string, rng: Rng): LogEvent | null {
  const players = state.dealt.length;
  switch (e.kind) {
    case "look": {
      const slots = e.targets.map(t => resolveRef(t, seat, players, picks, progress));
      const roles = slots.map(s => cardAt(state, s));
      if (e.reveal === "role") { progress.seen[stepId] = roles; return { kind: "look", slots, roles }; }
      return { kind: "look", slots, teams: roles.map(r => ROLE[r].team) };
    }
    case "swap": {
      const a = resolveRef(e.a, seat, players, picks, progress), b = resolveRef(e.b, seat, players, picks, progress);
      if (sameSlot(a, b)) return null;
      const ca = cardAt(state, a);
      setCard(state, a, cardAt(state, b)); setCard(state, b, ca);
      for (const s of [a, b]) if (!state.moved.includes(slotKey(s))) state.moved.push(slotKey(s));
      return { kind: "swap", a, b };
    }
    case "learnSeats": {
      let seats = state.dealt.flatMap((r, i) => (i !== seat && ROLE[r].tags.includes(e.tag) ? [i] : []));
      if (e.limit !== undefined) seats = shuffle(seats, rng).slice(0, e.limit);
      return { kind: "seats", label: e.label, seats };
    }
    case "learnMoved": {
      const slots: Slot[] = [...new Set([(seat + players - 1) % players, seat, (seat + 1) % players])].map(i => ({ k: "p" as const, i }));
      return { kind: "moved", slots, moved: slots.map(s => state.moved.includes(slotKey(s))) };
    }
  }
}

/**
 * Runs an actor's script as far as it can go: automatic steps happen, decided steps happen, and it stops at the first
 * step with no decision yet. With `force`, undecided steps get a uniformly random legal decision instead of stopping.
 * `live` names a step whose plan was just set during the actor's own turn, for the log.
 */
export function advance(state: GameState, seat: number, plan: Plan, progress: Progress, turn: number, rng: Rng, opts: { force?: boolean; live?: string } = {}): LogEntry[] {
  const role = ROLE[state.dealt[seat]];
  const steps = role.steps ?? [];
  const players = state.dealt.length;
  const log: LogEntry[] = [];
  while (!progress.done) {
    const step = steps[progress.step];
    if (!step) { progress.done = true; break; }
    if (!stepApplies(step, seat, state)) { progress.step++; continue; }
    let decision: Decision | undefined, via: LogEntry["via"] = "auto";
    if (isAuto(step)) decision = { kind: "do" };
    else {
      const src = condSource(role, step.id);
      decision = resolvePlan(plan[step.id], src ? progress.seen[src.id] : undefined);
      via = opts.live === step.id ? "live" : "queued";
      if (decision && validDecision(step, seat, players, decision)) decision = undefined;
      if (!decision) {
        if (!opts.force) break;
        decision = randomDecision(step, seat, players, rng); via = "forced";
      }
    }
    const entry = (ev: LogEvent): LogEntry => ({ turn, seat, role: role.id, step: step.id, via, ev });
    if (decision.kind === "skip") log.push(entry({ kind: "skip" }));
    else {
      const picks = decision.kind === "pick" ? decision.targets : [];
      progress.picks[step.id] = picks;
      for (const e of step.effects) { const ev = applyEffect(e, state, seat, picks, progress, step.id, rng); if (ev) log.push(entry(ev)); }
    }
    progress.step++;
  }
  return log;
}

// ───────────────────────────── day ─────────────────────────────

export interface Outcome {
  /** Weighted votes received per seat. */
  tally: number[];
  deaths: number[];
  winners: number[];
  winningTeam: Team | "nobody";
  headline: string;
}

/**
 * Counts the vote and decides the winners, by the cards players HOLD at the end. The seat(s) with the most votes are
 * eliminated, unless nobody received more than one. Then: an eliminated Glitch wins alone; otherwise the village wins
 * if a Werewolf was eliminated (or, with no Werewolf at the table, if nobody was), and the wolves' side wins if not.
 */
export function resolveVote(cards: RoleId[], votes: (number | null)[]): Outcome {
  const n = cards.length;
  const tally = Array<number>(n).fill(0);
  votes.forEach((v, i) => { if (v !== null) tally[v] += ROLE[cards[i]].vote?.weight ?? 1; });
  const top = Math.max(...tally);
  let deaths = top >= 2 ? tally.flatMap((t, i) => (t === top ? [i] : [])) : [];
  const protectedSeats = new Set(votes.flatMap((v, i) => (v !== null && ROLE[cards[i]].vote?.protectsTarget ? [v] : [])));
  deaths = deaths.filter(d => !protectedSeats.has(d));
  for (let i = 0; i < deaths.length; i++) {
    const d = deaths[i], v = votes[d];
    if (ROLE[cards[d]].vote?.takesTargetDown && v !== null && !deaths.includes(v) && !protectedSeats.has(v)) deaths.push(v);
  }
  const dead = (i: number) => deaths.includes(i);
  const seatsOf = (team: Team) => cards.flatMap((r, i) => (ROLE[r].team === team ? [i] : []));
  const wolves = cards.flatMap((r, i) => (ROLE[r].tags.includes("wolf") ? [i] : []));

  const martyrs = cards.flatMap((r, i) => (ROLE[r].win === "dies" && dead(i) ? [i] : []));
  if (martyrs.length) return { tally, deaths, winners: martyrs, winningTeam: "lone", headline: "The Glitch was eliminated and wins alone." };
  if (wolves.length) {
    if (wolves.some(dead)) return { tally, deaths, winners: seatsOf("village"), winningTeam: "village", headline: "A Werewolf was eliminated. The village wins." };
    return { tally, deaths, winners: seatsOf("werewolf"), winningTeam: "werewolf", headline: deaths.length ? "No Werewolf was eliminated. The Werewolves win." : "Nobody was eliminated. The Werewolves win." };
  }
  if (!deaths.length) return { tally, deaths, winners: seatsOf("village"), winningTeam: "village", headline: "There was no Werewolf at the table and nobody was eliminated. The village wins." };
  const allies = seatsOf("werewolf").filter(i => !dead(i));
  if (allies.length) return { tally, deaths, winners: allies, winningTeam: "werewolf", headline: "There was no Werewolf at the table, but the village turned on itself. The wolves' ally wins." };
  return { tally, deaths, winners: [], winningTeam: "nobody", headline: "There was no Werewolf at the table, and someone was eliminated anyway. Nobody wins." };
}

/** Deck checks for the lobby: the count, and each role's copy limit. */
export function deckProblem(deck: RoleId[], players: number): string | null {
  if (players < 3) return `Needs 3 players (${players} seated).`;
  const need = players + CENTER_CARDS;
  if (deck.length !== need) return `The deck needs ${need} cards for ${players} players (it has ${deck.length}).`;
  for (const id of new Set(deck)) {
    if (!ROLE[id]) return `Unknown role ${id}.`;
    if (deck.filter(r => r === id).length > ROLE[id].max) return `Too many copies of ${ROLE[id].name}.`;
  }
  return null;
}
