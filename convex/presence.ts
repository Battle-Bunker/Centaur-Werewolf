/**
 * Presence and the gate: the ONE place that decides whether a player may emit or receive right now, and the ONE place
 * that derives what other players may see of a player's connection. Every command (convex/commands.ts `dispatch`),
 * every view (convex/rooms.ts, convex/agent.ts), the MCP endpoint (convex/mcp.ts) and every future real-time channel
 * (video, audio, typing, reactions) must go through `gateOf` and `liveness`; nothing else may re-implement them.
 *
 * Liveness comes from heartbeats only: the app's `presence.heartbeat` command and every authenticated MCP call stamp
 * `players.lastSeenAt`. A seat is online while its last heartbeat is younger than ONLINE_TIMEOUT_MS. A time-limited
 * seat effect of kind "blackout" (the Hush's cut) closes the gate: every call from that player is refused exactly as
 * an unreachable server would refuse it, and their heartbeats with it, so their `lastSeenAt` simply stops. Other
 * players therefore see exactly what a real network drop produces: the same lag before the seat shows offline, and
 * the return on the first heartbeat after the window. Nothing about the effect leaves the server until the game ends.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { Game } from "./game";
import { rulesOf } from "../shared/settings";
import { loadScope } from "./scope";

/** The app sends a heartbeat this often; MCP calls count too. */
export const HEARTBEAT_MS = 5_000;
/** A seat with no heartbeat for this long shows as offline: about three missed heartbeats, as a real drop would take. */
export const ONLINE_TIMEOUT_MS = 16_000;
/** The words of an unreachable server, used for every refusal while the gate is closed (and only then). */
export const UNREACHABLE = "UNREACHABLE: the server could not be reached. Check your connection and try again.";

/**
 * A time-limited status effect on a seat. blackout: nothing the player sends goes through and nothing new reaches
 * them. The general shape (seat, kind, window, source) is meant for other time-limited effects too.
 */
export interface SeatEffect { seat: number; kind: "blackout"; from: number; until: number; by: number; source: string }

/** May this seat emit or receive right now? `kind` says which effect closed it, for the dispatcher's rule. */
export function gateOf(game: Game | undefined, phase: Doc<"rooms">["phase"], rules: ReturnType<typeof rulesOf>, seat: number, now: number): { open: boolean; kind?: SeatEffect["kind"] } {
  if (!game || seat < 0 || !(phase === "day" || phase === "vote")) return { open: true };
  for (const e of game.seatEffects ?? []) {
    if (e.seat !== seat || now < e.from || now >= e.until) continue;
    if (e.kind === "blackout" && phase === "vote" && !rules.cutDuringVote) continue;
    return { open: false, kind: e.kind };
  }
  return { open: true };
}

/** What other players may see of a player's connection. The only source is the heartbeat timestamp. */
export function liveness(player: Pick<Doc<"players">, "bot" | "lastSeenAt"> | undefined, now: number): "online" | "offline" | "bot" {
  if (!player) return "offline";
  if (player.bot) return "bot";
  return player.lastSeenAt !== undefined && now - player.lastSeenAt < ONLINE_TIMEOUT_MS ? "online" : "offline";
}

/** For the MCP endpoint: is this player's gate open now, and is their heartbeat due? */
export const gate = internalQuery({
  args: { player: v.id("players"), code: v.string(), now: v.number() },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player }, a.code);
    if (!scope?.me) return { open: true, due: false };
    const g = gateOf(scope.room.game as Game | undefined, scope.room.phase, rulesOf(scope.room.settings.rules), scope.seat, a.now);
    return { open: g.open, due: (scope.me.lastSeenAt ?? 0) < a.now - HEARTBEAT_MS };
  },
});

/** A heartbeat from an MCP call. */
export const touch = internalMutation({
  args: { player: v.id("players") },
  handler: async (ctx, a) => { if (await ctx.db.get(a.player)) await ctx.db.patch(a.player, { lastSeenAt: Date.now() }); },
});
