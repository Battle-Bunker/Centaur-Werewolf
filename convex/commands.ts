/**
 * The one way in for every change: `run` takes a command id from the registry (shared/commands.ts), checks it is
 * available to this caller now, validates its arguments against the registry's schema, and calls its handler.
 * The palette, the buttons and (later) the MCP server all call this mutation and nothing else.
 */
import { ConvexError, v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { availability, COMMAND, type CommandId } from "../shared/commands";
import { advance, deal, freshProgress, nightTurns, shuffle, validPlan, type StepPlan } from "../shared/engine";
import { recommendedDeck, ROLE } from "../shared/roles";
import { endDay, type Game, type Turn } from "./game";
import { contextOf, loadScope, type Scope } from "./scope";

type ServerId = Exclude<CommandId, `ui.${string}`>;
// biome-ignore lint: handlers receive arguments already validated by the registry's schema.
type Handler = (ctx: MutationCtx, scope: Scope | null, args: any, token: string) => Promise<unknown>;

const fail = (message: string): never => { throw new ConvexError(message); };
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const BOT_NAMES = ["Ash", "Briar", "Cinder", "Dusk", "Ember", "Fern", "Gale", "Hazel", "Ivy", "Juniper", "Kestrel", "Lark"];

async function seat(ctx: MutationCtx, code: string, token: string, name: string) {
  const room = await ctx.db.query("rooms").withIndex("code", q => q.eq("code", code)).unique();
  if (!room) return fail(`There is no room ${code}.`);
  const existing = await ctx.db.query("players").withIndex("token", q => q.eq("token", token).eq("room", room._id)).unique();
  if (existing) await ctx.db.patch(existing._id, { name });
  else {
    const count = (await ctx.db.query("players").withIndex("room", q => q.eq("room", room._id)).collect()).length;
    if (count >= 12) fail("That table is full (12 seats).");
    await ctx.db.insert("players", { room: room._id, token, name, bot: false });
  }
  return { code };
}

const HANDLERS: Record<ServerId, Handler> = {
  "room.create": async (ctx, _s, a, token) => {
    let code = "";
    do code = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");
    while (await ctx.db.query("rooms").withIndex("code", q => q.eq("code", code)).unique());
    const room = await ctx.db.insert("rooms", { code, phase: "lobby", round: 0, settings: { deck: recommendedDeck(3), duskSeconds: 20, turnSeconds: 12, daySeconds: 300 } });
    const host = await ctx.db.insert("players", { room, token, name: a.name, bot: false });
    await ctx.db.patch(room, { host });
    return { code };
  },
  "room.join": (ctx, _s, a, token) => seat(ctx, a.code.toUpperCase(), token, a.name),
  "room.rename": async (ctx, s, a) => { await ctx.db.patch(s!.me!._id, { name: a.name }); },
  "room.leave": async (ctx, s) => {
    const { room, players, me } = s!;
    await ctx.db.delete(me!._id);
    const humans = players.filter(p => !p.bot && p._id !== me!._id);
    if (!humans.length) {
      for (const p of players) if (p._id !== me!._id) await ctx.db.delete(p._id);
      await ctx.db.delete(room._id);
    } else if (room.host === me!._id) await ctx.db.patch(room._id, { host: humans[0]._id });
  },
  "room.addBot": async (ctx, s) => {
    const taken = new Set(s!.players.map(p => p.name));
    const name = BOT_NAMES.find(n => !taken.has(n)) ?? `Bot ${s!.players.length}`;
    await ctx.db.insert("players", { room: s!.room._id, name, bot: true });
  },
  "room.remove": async (ctx, s, a) => {
    const target = s!.players.find(p => p._id === a.player);
    if (!target) return fail("That player is not in this room.");
    if (target._id === s!.me!._id) return fail("To go yourself, leave the room.");
    await ctx.db.delete(target._id);
  },
  "setup.addRole": async (ctx, s, a) => {
    const { room } = s!;
    await ctx.db.patch(room._id, { settings: { ...room.settings, deck: [...room.settings.deck, a.role] } });
  },
  "setup.removeRole": async (ctx, s, a) => {
    const { room } = s!;
    const deck = [...room.settings.deck];
    deck.splice(deck.lastIndexOf(a.role), 1);
    await ctx.db.patch(room._id, { settings: { ...room.settings, deck } });
  },
  "setup.useRecommended": async (ctx, s) => {
    await ctx.db.patch(s!.room._id, { settings: { ...s!.room.settings, deck: recommendedDeck(s!.players.length) } });
  },
  "setup.setTimer": async (ctx, s, a) => {
    const key = ({ dusk: "duskSeconds", turn: "turnSeconds", day: "daySeconds" } as const)[a.timer as "dusk" | "turn" | "day"];
    await ctx.db.patch(s!.room._id, { settings: { ...s!.room.settings, [key]: a.seconds } });
  },
  "game.start": async (ctx, s) => {
    const { room, players } = s!;
    const { deck, duskSeconds, turnSeconds } = room.settings;
    const seats = shuffle(players, Math.random).map(p => p._id);
    const state = deal(deck, seats.length, Math.random);
    let t = Date.now();
    const turns: Turn[] = [{ role: null, startsAt: t, endsAt: (t += duskSeconds * 1000) }];
    for (const role of nightTurns(deck)) turns.push({ role, startsAt: t, endsAt: (t += turnSeconds * 1000) });
    const game: Game = {
      seats, state, turns, turn: 0, log: [],
      plans: seats.map(() => ({})),
      progress: state.dealt.map(r => ({ ...freshProgress(), done: !ROLE[r].steps })),
      votes: seats.map(() => null), forcedVotes: [],
    };
    const round = room.round + 1;
    await ctx.db.patch(room._id, { phase: "night", round, game });
    await ctx.scheduler.runAt(turns[0].endsAt, internal.timers.turnEnds, { room: room._id, round, turn: 0 });
  },
  "night.planStep": async (ctx, s, a) => {
    const { room, seat } = s!;
    const game = room.game as Game;
    const role = ROLE[game.state.dealt[seat]];
    const err = validPlan(role, a.step, seat, game.seats.length, a.plan as StepPlan);
    if (err) return fail(err);
    game.plans[seat][a.step] = a.plan;
    if (game.turns[game.turn]?.role === role.id) game.log.push(...advance(game.state, seat, game.plans[seat], game.progress[seat], game.turn, Math.random, { live: a.step }));
    await ctx.db.patch(room._id, { game });
  },
  "night.clearStep": async (ctx, s, a) => {
    const game = s!.room.game as Game;
    delete game.plans[s!.seat][a.step];
    await ctx.db.patch(s!.room._id, { game });
  },
  "day.vote": async (ctx, s, a) => {
    const { room, players, seat } = s!;
    const game = room.game as Game;
    if (a.seat >= game.seats.length) return fail("There is no such seat.");
    if (a.seat === seat) return fail("You cannot vote for yourself.");
    game.votes[seat] = a.seat;
    const bots = new Set(players.filter(p => p.bot).map(p => p._id));
    const waiting = game.seats.some((id, i) => game.votes[i] === null && !bots.has(id) && players.some(p => p._id === id));
    if (waiting) await ctx.db.patch(room._id, { game });
    else await endDay(ctx, { ...room, game });
  },
  "day.clearVote": async (ctx, s) => {
    const game = s!.room.game as Game;
    game.votes[s!.seat] = null;
    await ctx.db.patch(s!.room._id, { game });
  },
  "day.endDiscussion": (ctx, s) => endDay(ctx, s!.room),
  "game.playAgain": async (ctx, s) => { await ctx.db.patch(s!.room._id, { phase: "lobby", game: undefined }); },
};

export const run = mutation({
  args: { id: v.string(), token: v.string(), code: v.optional(v.string()), args: v.optional(v.any()) },
  handler: async (ctx, { id, token, code, args }) => {
    const cmd = COMMAND[id];
    const handler = HANDLERS[id as ServerId];
    if (!cmd || cmd.runs !== "server" || !handler) return fail(`Unknown command ${id}.`);
    if (token.length < 16) return fail("Missing session.");
    const parsed = cmd.params.safeParse(args ?? {});
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Those arguments are not valid.");
    // Creating and joining are done from outside a room, whatever page the caller is looking at.
    const outside = cmd.contexts.length === 1 && cmd.contexts[0] === "home";
    const scope = outside ? null : await loadScope(ctx, token, code);
    if (!scope && !outside) return fail("That room no longer exists.");
    const can = availability(cmd, contextOf(scope), parsed.data as Record<string, unknown>);
    if (!can.ok) return fail(can.reason);
    return (await handler(ctx, scope, parsed.data, token)) ?? null;
  },
});
