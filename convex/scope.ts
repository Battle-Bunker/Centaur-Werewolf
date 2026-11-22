/** Who is calling, in which room: loaded once and used by both the command dispatcher and the room view. */
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { CommandContext } from "../shared/commands";
import { HOME_CONTEXT } from "../shared/commands";
import { isAuto } from "../shared/engine";
import { ROLE } from "../shared/roles";
import type { Game } from "./game";

export interface Scope {
  room: Doc<"rooms">;
  /** Everyone in the room, in the order they joined. */
  players: Doc<"players">[];
  me: Doc<"players"> | null;
  /** The caller's seat in the game in progress; -1 when there is none or they are watching. */
  seat: number;
}

export async function loadScope(ctx: QueryCtx, caller: { token: string } | { player: Id<"players"> }, code: string | undefined): Promise<Scope | null> {
  if (!code) return null;
  const room = await ctx.db.query("rooms").withIndex("code", q => q.eq("code", code.toUpperCase())).unique();
  if (!room) return null;
  const players = await ctx.db.query("players").withIndex("room", q => q.eq("room", room._id)).collect();
  const me = players.find(p => ("player" in caller ? p._id === caller.player : p.token === caller.token)) ?? null;
  const game = room.game as Game | undefined;
  return { room, players, me, seat: me && game ? game.seats.indexOf(me._id) : -1 };
}

/** The ids of an actor's steps that still take a decision. */
export function openSteps(game: Game, seat: number): string[] {
  const p = game.progress[seat];
  if (!p || p.done) return [];
  return (ROLE[game.state.dealt[seat]].steps ?? []).filter((s, i) => i >= p.step && !isAuto(s)).map(s => s.id);
}

export function contextOf(scope: Scope | null): CommandContext {
  if (!scope) return HOME_CONTEXT;
  const { room, players, me, seat } = scope;
  const game = room.game as Game | undefined;
  return {
    phase: room.phase,
    member: !!me,
    seated: seat >= 0,
    host: !!me && room.host === me._id,
    players: players.length,
    center: room.settings.centerCount,
    deck: room.settings.deck,
    openSteps: room.phase === "night" && game && seat >= 0 ? openSteps(game, seat) : [],
    voted: !!game && seat >= 0 && game.votes[seat] !== null,
    chatPower: game && seat >= 0 && !game.chatUsed[seat] ? (ROLE[game.state.dealt[seat]].chat ?? null) : null,
  };
}
