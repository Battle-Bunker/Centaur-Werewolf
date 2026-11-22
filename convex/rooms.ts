/**
 * What one viewer may see of a room. This is the only place hidden information leaves the server, so the rules of
 * secrecy live here: during the night and the day you get your own dealt role, plan, progress and journal (with dawn
 * notices: bitten, Imago), the proclamations once they are published, the egg after dawn, and your own queued day swap;
 * everything else (other roles, the centre, glamours, forgeries, the full log, who voted for whom) arrives only once
 * the game has ended. At a play-test table the host also sees the deal.
 */
import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { sha256 } from "./auth";
import type { Game } from "./game";
import { publicMarks, visibleShown, type LogEntry } from "../shared/engine";
import { rulesOf } from "../shared/settings";

/** A log entry as a player may see it during the game: without what only the post-game log shows. */
export const redact = ({ hidden: _hidden, ...e }: LogEntry): LogEntry => e;
/** The proclamations a player may see now, without the forgery flag or (for dawn ones) the turn they were really made in. */
export const publicShown = (game: Game) => visibleShown(game.state).map(({ forged: _f, turn, ...x }) => ({
  ...x, turn: x.atDawn ? null : turn,
  /** "At least one of `slots` is a `role`". `slot` (the first of the two) is kept only so older clients do not break. */
  slot: x.slots[0], says: "at least one of these two centre cards",
}));
import { site } from "./mcp";
import { contextOf, loadScope } from "./scope";
import { gateOf, HEARTBEAT_MS, liveness, ONLINE_TIMEOUT_MS, UNREACHABLE } from "./presence";

/** The seal of an authenticated message, as every viewer sees it until its game ends (real and forged alike). */
/**
 * A seal names a ROLE, never a player (the evidence amendment): "Sealed: the Signet". Who posted it, and whether it was
 * forged, is shown only once the game has ended.
 */
export const sealNote = (seal: string) => `Sealed: the ${seal === "signet" ? "Signet" : seal === "notary" ? "Notary" : seal}. The seal names a role, not a player, and a forger's seal looks exactly the same.`;

export const view = query({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    const scope = await loadScope(ctx, { token }, code);
    if (!scope) return null;
    const { room, players, me, seat } = scope;
    const game = room.game as Game | undefined;
    const now = Date.now();
    // The gate: a silenced player is served nothing, exactly as an unreachable server serves nothing. The client must
    // render this error and a lost connection identically (docs/architecture.md, "Presence and the gate").
    if (!gateOf(game, room.phase, rulesOf(room.settings.rules), seat, now).open) throw new ConvexError(UNREACHABLE);
    // Another seat's last heartbeat is rounded down to the heartbeat interval: online or not is all it may tell, never
    // the timing of a burst of activity (an assistant planning in its turn).
    const person = (id: string, i: number) => {
      const p = players.find(x => x._id === id);
      return { id, seat: i, name: p?.name ?? "(left)", bot: p?.bot ?? false, host: room.host === id, me: me?._id === id, lastSeenAt: p?.lastSeenAt == null ? null : me?._id === id ? p.lastSeenAt : Math.floor(p.lastSeenAt / HEARTBEAT_MS) * HEARTBEAT_MS, presence: liveness(p, now) };
    };
    const ended = room.phase === "ended";
    const rows = await ctx.db.query("messages").withIndex("room", q => q.eq("room", room._id)).order("desc").take(200);
    const creds = me ? await ctx.db.query("credentials").withIndex("player", q => q.eq("player", me._id)).collect() : [];
    return {
      code: room.code,
      phase: room.phase,
      round: room.round,
      /** The server's clock when this view was made; every countdown is an absolute end time to compare with it. */
      serverNow: now,
      /** Presence: a seat is online while its last heartbeat (players[].lastSeenAt) is younger than onlineTimeoutMs. Recompute it with the clock. */
      presence: { heartbeatMs: HEARTBEAT_MS, onlineTimeoutMs: ONLINE_TIMEOUT_MS },
      /** The fixed deal is the host's alone: others only learn that one is set. */
      settings: { ...room.settings, rules: rulesOf(room.settings.rules), fixedDeal: room.settings.fixedDeal && room.host === me?._id ? room.settings.fixedDeal : undefined },
      fixedDeal: !!room.settings.fixedDeal,
      /** A play-test table: shown to everyone, because its host may fix the deal and sees every card. */
      playtest: !!room.playtest,
      context: contextOf(scope),
      me: me ? { id: me._id, name: me.name } : null,
      /** In the lobby: everyone, in joining order. In a game: the seated players, clockwise by seat. */
      players: game ? game.seats.map(person) : players.map((p, i) => person(p._id, i)),
      /** Table talk, oldest first. An unsigned message's sender is withheld until its game has ended. */
      messages: rows.reverse().map(m => {
        const seal = m.seal ?? (m.mark === "signed" ? "signet" : null), revealed = m.round !== room.round || ended;
        // An unsigned or sealed message carries no name, seat, avatar or assistant marker until its game has ended.
        const hidden = (m.mark === "unsigned" || !!seal) && !revealed;
        const own = me?._id === m.player;
        return { id: m._id, at: m._creationTime, round: m.round, phase: m.phase, text: m.text, mark: m.mark ?? null, seal, sealNote: seal ? sealNote(seal) : null, forged: revealed && m.forged ? true : null, via: hidden ? null : m.via, name: hidden ? null : m.name, seat: hidden || !game ? null : game.seats.indexOf(m.player), mine: hidden ? (seal ? own : false) : own };
      }),
      /** The viewer's own assistant connections, and where an MCP client connects. */
      connections: creds.filter(c => !c.revokedAt && (c.kind === "oauth" ? (c.refreshExpiresAt ?? 0) : c.expiresAt) > Date.now()).map(c => ({ id: c._id, label: c.label, permission: c.permission, kind: c.kind, lastUsedAt: c.lastUsedAt ?? null, createdAt: c._creationTime })),
      mcpUrl: `${site()}/mcp`,
      watchers: game ? players.filter(p => !game.seats.includes(p._id)).map(p => p.name) : [],
      game: game ? {
        turns: game.turns,
        turn: game.turn,
        dayEndsAt: game.dayEndsAt ?? null,
        voteEndsAt: game.voteEndsAt ?? null,
        /** Public: who is ready to end the discussion. */
        ready: game.ready ?? game.seats.map(() => false),
        /** Public: who has voted, never for whom. */
        voted: game.votes.map(x => x !== null),
        /** The proclamations published so far (at dawn, under that rule): a card as it was at that moment of the night. */
        shown: publicShown(game),
        /** Public marks (the Cuckoo's egg), after dawn. */
        marks: publicMarks(game.state),
        dawn: game.state.dawn,
        mine: seat >= 0 ? {
          seat,
          dealt: game.state.dealt[seat],
          plan: game.plans[seat],
          progress: game.progress[seat],
          journal: game.log.filter(e => e.seat === seat).map(e => (ended ? e : redact(e))),
          vote: game.votes[seat],
          /** Told at dawn. */
          status: { bitten: game.state.dawn && game.state.bitten.some(b => b.seat === seat), heir: game.log.some(e => e.seat === seat && e.ev.kind === "heir"), became: game.state.adopted[String(seat)] ?? null },
          adoptPlans: game.adoptPlans?.[seat] ?? {},
          adoptProgress: game.adoptProgress?.[seat] ?? null,
          daySwap: game.daySwap?.by === seat ? { a: game.daySwap.a, b: game.daySwap.b } : null,
        } : null,
        /** Play-test tables: the deal, for the host only. */
        playtestDeal: room.playtest && room.host === me?._id ? { dealt: game.state.dealt, center: game.state.dealtCenter, fixed: !!game.fixed } : null,
        final: ended ? {
          dealt: game.state.dealt,
          cards: game.state.cards,
          /** The physical card (instance) each seat holds at the end; instance i < players was dealt to seat i, players + n to centre card n + 1. */
          inst: game.state.inst,
          /** The instance in each centre slot at the end. */
          cinst: game.state.cinst,
          center: game.state.center,
          dealtCenter: game.state.dealtCenter,
          votes: game.votes,
          forcedVotes: game.forcedVotes,
          outcome: game.outcome!,
          marks: game.state.marks,
          bitten: game.state.bitten,
          adopted: game.state.adopted,
          phoenixInst: game.state.phoenixInst,
          shown: game.state.shown.map(x => ({ ...x, slot: x.slots[0] })),
          daySwap: game.daySwap ?? null,
          seatEffects: game.seatEffects ?? [],
          dealSeed: game.dealSeed ?? null,
          nightSeed: game.nightSeed ?? null,
          fingerprint: game.fingerprint ?? null,
          rules: game.state.rules,
          log: game.log,
        } : null,
      } : null,
    };
  },
});

/** The rooms this browser has a seat in, for the Connect page's room picker. */
export const mine = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const seats = await ctx.db.query("players").withIndex("token", q => q.eq("token", token)).collect();
    const out = [];
    for (const p of seats) {
      const room = await ctx.db.get(p.room);
      if (room) out.push({ code: room.code, name: p.name, phase: room.phase, host: room.host === p._id, players: (await ctx.db.query("players").withIndex("room", q => q.eq("room", room._id)).collect()).length });
    }
    return out;
  },
});

/** What the Connect page shows about a pending OAuth request: who is asking, and for what. */
export const connectRequest = query({
  args: { request: v.string() },
  handler: async (ctx, { request }) => {
    const keyHash = await sha256(request);
    const r = await ctx.db.query("oauthRequests").withIndex("key", q => q.eq("keyHash", keyHash)).unique();
    if (!r || r.expiresAt < Date.now()) return null;
    return { client: r.clientName, redirectHost: new URL(r.redirectUri).host, asks: r.scope, status: r.status, completeUrl: `${site()}/oauth/complete` };
  },
});
