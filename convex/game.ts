/** The game document held in `rooms.game`, and the night/day/vote transitions shared by commands and timers. */
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { dawn, daySwap, emberSwap, heldRoles, isPhoenix, resolveVote, runTurn, secureRng, shapeOf, type GameState, type LogEntry, type NightSeat, type Outcome, type Plan, type Progress } from "../shared/engine";
import type { RoleId } from "../shared/roles";
import type { SeatEffect } from "./presence";

export interface Turn { role: RoleId | null; startsAt: number; endsAt: number }
export interface Game {
  /** Seat → player, clockwise. */
  seats: Id<"players">[];
  state: GameState;
  /** The whole night's timetable, fixed at the deal. Turn 0 is dusk (`role: null`); a twin acts in its original's turn. */
  turns: Turn[];
  /** The turn in progress; `turns.length` once the night is over. */
  turn: number;
  plans: Plan[];
  progress: Progress[];
  /** Copiers: a plan per role they may become, and the adopted script's progress. */
  adoptPlans?: Record<RoleId, Plan>[];
  adoptProgress?: (Progress | null)[];
  log: LogEntry[];
  dayEndsAt?: number;
  voteEndsAt?: number;
  /** Discussion: seats that have said they are ready to vote. Public. */
  ready: boolean[];
  votes: (number | null)[];
  /** Seats whose vote was cast for them at random. */
  forcedVotes: number[];
  /** Seats that have spent their dealt card's once-per-game chat power. */
  chatUsed: boolean[];
  /** Seats that have spent their dealt card's once-per-game day power (the Hush's cut). */
  powerUsed?: boolean[];
  /** Time-limited status effects on seats (convex/presence.ts). Secret until the game ends. */
  seatEffects?: SeatEffect[];
  /** The Moon-Thief's queued swap: two seats, and the seat that queued it. Secret until the game ends. */
  daySwap?: { a: number; b: number; by: number } | null;
  /** Ember-Carriers' queued moves: the seat that is to receive the Phoenix card, by the carrier's seat. Secret. */
  embers?: Record<string, number>;
  /** The seed of this game's seating and shuffle. Shown only after the game ends. */
  dealSeed?: number;
  /** The deal was fixed at a play-test table. */
  fixed?: boolean;
  outcome?: Outcome;
}

export const VOTE_SECONDS_DEFAULT = 20;
/** The game's night seats as the engine's runTurn wants them (shared objects, so progress is kept). */
export function nightSeats(game: Game): NightSeat[] {
  game.adoptPlans ??= game.seats.map(() => ({}));
  game.adoptProgress ??= game.seats.map(() => null);
  return game.seats.map((_, i) => ({ plan: game.plans[i], progress: game.progress[i], adoptPlans: game.adoptPlans![i], adoptProgress: game.adoptProgress![i] ?? undefined }));
}
/** Runs a turn's actors and writes back any adopted-script progress the engine created. */
export function playTurn(game: Game, opts: { force?: boolean } = {}) {
  const role = game.turns[game.turn]?.role;
  if (!role) return;
  const seats = nightSeats(game);
  game.log.push(...runTurn(game.state, role, seats, game.turn, secureRng, game.log, opts));
  seats.forEach((s, i) => { game.adoptProgress![i] = s.adoptProgress ?? null; });
}

/** The actors of the turn that just began run whatever they have queued. */
export function beginTurn(game: Game) { playTurn(game); }

/** The turn's time is up: anything its actors left undecided is decided at random. Then the next turn, or dawn and the day. */
export async function endTurn(ctx: MutationCtx, room: Doc<"rooms">) {
  const game = room.game as Game;
  playTurn(game, { force: true });
  game.turn++;
  if (game.turn < game.turns.length) {
    beginTurn(game);
    await ctx.scheduler.runAt(game.turns[game.turn].endsAt, internal.timers.turnEnds, { room: room._id, round: room.round, turn: game.turn });
    await ctx.db.patch(room._id, { game });
  } else {
    game.log.push(...dawn(game.state, shapeOf(game.state).deck!, game.turns.length, secureRng));
    game.dayEndsAt = Date.now() + room.settings.daySeconds * 1000;
    await ctx.scheduler.runAt(game.dayEndsAt, internal.timers.dayEnds, { room: room._id, round: room.round });
    await ctx.db.patch(room._id, { phase: "day", game });
  }
}

/** The discussion ends (its timer, the host, or everyone ready): the vote phase begins. */
export async function startVote(ctx: MutationCtx, room: Doc<"rooms">) {
  const game = room.game as Game;
  game.voteEndsAt = Date.now() + (room.settings.voteSeconds ?? VOTE_SECONDS_DEFAULT) * 1000;
  await ctx.scheduler.runAt(game.voteEndsAt, internal.timers.voteEnds, { room: room._id, round: room.round });
  await ctx.db.patch(room._id, { phase: "vote", game });
}

/** Seated humans still in the room: the players the early ends of the discussion and of the vote wait for. */
export const seatedHumans = (game: Game, players: Doc<"players">[]) =>
  game.seats.flatMap((id, i) => (players.some(p => p._id === id && !p.bot) ? [i] : []));

/** The vote phase ends: a seat that has not voted votes for a random other seat; the Moon-Thief's swap happens; count. */
export async function endVote(ctx: MutationCtx, room: Doc<"rooms">) {
  const game = room.game as Game;
  const n = game.seats.length;
  game.votes.forEach((v, seat) => {
    if (v !== null) return;
    const others = [...Array(n).keys()].filter(i => i !== seat);
    game.votes[seat] = others[Math.floor(secureRng() * others.length)];
    game.forcedVotes.push(seat);
  });
  const s = game.state, after = game.turns.length + 1;
  if (game.daySwap) game.log.push({ turn: after, seat: game.daySwap.by, role: s.dealt[game.daySwap.by], step: "day", via: "live", ev: daySwap(s, game.daySwap.a, game.daySwap.b) });
  for (const [by, target] of Object.entries(game.embers ?? {})) game.log.push({ turn: after, seat: Number(by), role: s.dealt[Number(by)], step: "day", via: "live", ev: emberSwap(s, target) });
  for (const e of game.seatEffects ?? []) game.log.push({ turn: after, seat: e.by, role: s.dealt[e.by], step: "day", via: "live", ev: { kind: "cut", seat: e.seat, from: e.from, until: e.until } });
  game.outcome = resolveVote(heldRoles(s), game.votes, { forced: game.forcedVotes, bitten: s.bitten, marks: s.marks, held: s.inst, phoenix: s.inst.map(i => isPhoenix(s, i)), rules: s.rules });
  await ctx.db.patch(room._id, { phase: "ended", game });
}
