/**
 * What one viewer may see of a room. This is the only place hidden information leaves the server, so the rules of
 * secrecy live here: during the night and the day you get your own dealt role, plan, progress and journal; everything
 * else (other roles, the centre, the full log, who voted for whom) arrives only once the game has ended.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";
import { sha256 } from "./auth";
import type { Game } from "./game";
import { site } from "./mcp";
import { contextOf, loadScope } from "./scope";

export const view = query({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    const scope = await loadScope(ctx, { token }, code);
    if (!scope) return null;
    const { room, players, me, seat } = scope;
    const game = room.game as Game | undefined;
    const person = (id: string, i: number) => {
      const p = players.find(x => x._id === id);
      return { id, seat: i, name: p?.name ?? "(left)", bot: p?.bot ?? false, host: room.host === id, me: me?._id === id };
    };
    const ended = room.phase === "ended";
    const rows = await ctx.db.query("messages").withIndex("room", q => q.eq("room", room._id)).order("desc").take(200);
    const creds = me ? await ctx.db.query("credentials").withIndex("player", q => q.eq("player", me._id)).collect() : [];
    return {
      code: room.code,
      phase: room.phase,
      round: room.round,
      settings: room.settings,
      context: contextOf(scope),
      me: me ? { id: me._id, name: me.name } : null,
      /** In the lobby: everyone, in joining order. In a game: the seated players, clockwise by seat. */
      players: game ? game.seats.map(person) : players.map((p, i) => person(p._id, i)),
      /** Table talk, oldest first. An unsigned message's sender is withheld until its game has ended. */
      messages: rows.reverse().map(m => {
        const hidden = m.mark === "unsigned" && !(ended && m.round === room.round) && m.round === room.round;
        return { id: m._id, at: m._creationTime, round: m.round, phase: m.phase, text: m.text, mark: m.mark ?? null, via: m.via, name: hidden ? null : m.name, seat: hidden || !game ? null : game.seats.indexOf(m.player), mine: !hidden && me?._id === m.player };
      }),
      /** The viewer's own assistant connections, and where an MCP client connects. */
      connections: creds.filter(c => !c.revokedAt && (c.kind === "oauth" ? (c.refreshExpiresAt ?? 0) : c.expiresAt) > Date.now()).map(c => ({ id: c._id, label: c.label, permission: c.permission, kind: c.kind, lastUsedAt: c.lastUsedAt ?? null, createdAt: c._creationTime })),
      mcpUrl: `${site()}/mcp`,
      watchers: game ? players.filter(p => !game.seats.includes(p._id)).map(p => p.name) : [],
      game: game ? {
        turns: game.turns,
        turn: game.turn,
        dayEndsAt: game.dayEndsAt ?? null,
        /** Public: who has voted, never for whom. */
        voted: game.votes.map(x => x !== null),
        /** What everyone has been shown (the Herald): a card as it was during that turn. */
        shown: game.state.shown,
        mine: seat >= 0 ? {
          seat,
          dealt: game.state.dealt[seat],
          plan: game.plans[seat],
          progress: game.progress[seat],
          journal: game.log.filter(e => e.seat === seat),
          vote: game.votes[seat],
        } : null,
        final: ended ? {
          dealt: game.state.dealt,
          cards: game.state.cards,
          center: game.state.center,
          votes: game.votes,
          forcedVotes: game.forcedVotes,
          outcome: game.outcome!,
          prophecy: game.state.prophecy,
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
