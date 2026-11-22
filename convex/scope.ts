/** Who is calling, in which room: loaded once and used by both the command dispatcher and the room view. */
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { CommandContext } from "../shared/commands";
import { HOME_CONTEXT } from "../shared/commands";
import { actingRole, isAuto } from "../shared/engine";
import type { RoleId } from "../shared/roles";
import { ROLE } from "../shared/roles";
import { rulesOf } from "../shared/settings";
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

/** A copier's plannable roles: any before its copy; the copy's role while that script still has open steps; else none. */
export function adoptOpen(game: Game, seat: number): RoleId[] | "any" {
  if (!ROLE[game.state.dealt[seat]].steps?.some(s => s.effects.some(e => e.kind === "adopt"))) return [];
  const a = game.state.adopted[String(seat)];
  if (!a) return "any";
  const p = game.adoptProgress?.[seat];
  return p?.done ? [] : (ROLE[a].steps ?? []).some((s, i) => i >= (p?.step ?? 0) && !isAuto(s)) ? [a] : [];
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
    adoptOpen: room.phase === "night" && game && seat >= 0 ? adoptOpen(game, seat) : [],
    voted: !!game && seat >= 0 && game.votes[seat] !== null,
    // Powers of the card the viewer was DEALT, as it is now: a copier has its copy's powers (its own uses of them).
    chatPower: game && seat >= 0 && !game.chatUsed[seat] ? (ROLE[actingRole(game.state, seat)].chat ?? null) : null,
    dayPower: game && seat >= 0 && !game.powerUsed?.[seat] ? (p => (p === "swap" && !game.state.rules.daySwap ? null : p ?? null))(ROLE[actingRole(game.state, seat)].dayPower) : null,
    ready: !!game?.ready?.[seat],
    swapQueued: !!game?.daySwap && game.daySwap.by === seat,
    playtest: !!room.playtest,
    rules: rulesOf(room.settings.rules),
  };
}
