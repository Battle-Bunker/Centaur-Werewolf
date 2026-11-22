/** The game document held in `rooms.game`, and the night/day transitions shared by commands and timers. */
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { advance, dawn, daySwap, resolveVote, secureRng, shapeOf, type GameState, type LogEntry, type Outcome, type Plan, type Progress } from "../shared/engine";
import type { RoleId } from "../shared/roles";

export interface Turn { role: RoleId | null; startsAt: number; endsAt: number }
export interface Game {
  /** Seat → player, clockwise. */
  seats: Id<"players">[];
  state: GameState;
  /** The whole night's timetable, fixed at the deal. Turn 0 is dusk (`role: null`). */
  turns: Turn[];
  /** The turn in progress; `turns.length` once the night is over. */
  turn: number;
  plans: Plan[];
  progress: Progress[];
  log: LogEntry[];
  dayEndsAt?: number;
  votes: (number | null)[];
  /** Seats whose vote was cast for them at random. */
  forcedVotes: number[];
  /** Seats that have spent their dealt card's once-per-game chat power. */
  chatUsed: boolean[];
  /** The Moon-Thief's queued swap: two seats, and the seat that queued it. Secret until the game ends. */
  daySwap?: { a: number; b: number; by: number } | null;
  /** The deal was fixed at a play-test table. */
  fixed?: boolean;
  outcome?: Outcome;
}

const ACTORS = (game: Game, role: RoleId) => game.state.dealt.flatMap((r, seat) => (r === role ? [seat] : []));

/** The actors of the turn that just began run whatever they have queued. */
export function beginTurn(game: Game) {
  const role = game.turns[game.turn]?.role;
  if (!role) return;
  for (const seat of ACTORS(game, role)) game.log.push(...advance(game.state, seat, game.plans[seat], game.progress[seat], game.turn, secureRng, { history: game.log }));
}

/** The turn's time is up: anything its actors left undecided is decided at random. Then the next turn, or dawn and the day. */
export async function endTurn(ctx: MutationCtx, room: Doc<"rooms">) {
  const game = room.game as Game;
  const role = game.turns[game.turn]?.role;
  if (role) for (const seat of ACTORS(game, role)) game.log.push(...advance(game.state, seat, game.plans[seat], game.progress[seat], game.turn, secureRng, { force: true, history: game.log }));
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

/** Counts the votes: a seat that has not voted votes for a random other seat; the Moon-Thief's swap happens first. */
export async function endDay(ctx: MutationCtx, room: Doc<"rooms">) {
  const game = room.game as Game;
  const n = game.seats.length;
  game.votes.forEach((v, seat) => {
    if (v !== null) return;
    const others = [...Array(n).keys()].filter(i => i !== seat);
    game.votes[seat] = others[Math.floor(secureRng() * others.length)];
    game.forcedVotes.push(seat);
  });
  const s = game.state;
  if (game.daySwap) game.log.push({ turn: game.turns.length + 1, seat: game.daySwap.by, role: s.dealt[game.daySwap.by], step: "day", via: "live", ev: daySwap(s, game.daySwap.a, game.daySwap.b) });
  game.outcome = resolveVote(s.cards, game.votes, { forced: game.forcedVotes, bitten: s.bitten, imago: s.imago, marks: s.marks, rules: s.rules });
  await ctx.db.patch(room._id, { phase: "ended", game });
}
