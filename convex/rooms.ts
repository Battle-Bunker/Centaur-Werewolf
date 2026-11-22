/**
 * What one viewer may see of a room. This is the only place hidden information leaves the server, so the rules of
 * secrecy live here: during the night and the day you get your own dealt role, plan, progress and journal; everything
 * else (other roles, the centre, the full log, who voted for whom) arrives only once the game has ended.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Game } from "./game";
import { contextOf, loadScope } from "./scope";

export const view = query({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    const scope = await loadScope(ctx, token, code);
    if (!scope) return null;
    const { room, players, me, seat } = scope;
    const game = room.game as Game | undefined;
    const person = (id: string, i: number) => {
      const p = players.find(x => x._id === id);
      return { id, seat: i, name: p?.name ?? "(left)", bot: p?.bot ?? false, host: room.host === id, me: me?._id === id };
    };
    const ended = room.phase === "ended";
    return {
      code: room.code,
      phase: room.phase,
      round: room.round,
      settings: room.settings,
      context: contextOf(scope),
      me: me ? { id: me._id, name: me.name } : null,
      /** In the lobby: everyone, in joining order. In a game: the seated players, clockwise by seat. */
      players: game ? game.seats.map(person) : players.map((p, i) => person(p._id, i)),
      watchers: game ? players.filter(p => !game.seats.includes(p._id)).map(p => p.name) : [],
      game: game ? {
        turns: game.turns,
        turn: game.turn,
        dayEndsAt: game.dayEndsAt ?? null,
        /** Public: who has voted, never for whom. */
        voted: game.votes.map(x => x !== null),
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
          log: game.log,
        } : null,
      } : null,
    };
  },
});
