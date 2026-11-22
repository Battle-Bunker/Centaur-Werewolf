/**
 * The one way in for every change: `run` takes a command id from the registry (shared/commands.ts), checks it is
 * available to this caller now, validates its arguments against the registry's schema, and calls its handler.
 * The palette, the buttons and the MCP server all call this mutation and nothing else. It also enforces the presence gate
 * (convex/presence.ts): while a seat effect silences a player, their calls are refused exactly as an unreachable
 * server would refuse them.
 */
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { availability, COMMAND, type CommandId } from "../shared/commands";
import { advance, dealFixed, freshProgress, nightTurns, secureRng, seededRng, shapeOf, shuffle, turnKey, validPlan, type StepPlan } from "../shared/engine";
import { CENTER_DEFAULT, recommendedDeck, ROLE } from "../shared/roles";
import { rulesOf } from "../shared/settings";
import { seatName } from "../shared/text";
import { endVote, nightSeats, rngFor, seatedHumans, startVote, VOTE_SECONDS_DEFAULT, type Game, type Turn } from "./game";
import { gateOf, UNREACHABLE } from "./presence";
import { contextOf, loadScope, type Scope } from "./scope";
import { answerRequest, createKey } from "./auth";

/** Commands that change something. Reads (room.view, room.wait, rules.read) are answered by convex/agent.ts. */
type ServerId = Exclude<CommandId, `ui.${string}` | "room.view" | "room.wait" | "rules.read">;
// biome-ignore lint: handlers receive arguments already validated by the registry's schema.
type Handler = (ctx: MutationCtx, scope: Scope | null, args: any, token: string, via: "app" | "agent") => Promise<unknown>;

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

/**
 * An authenticated message: the seal of `seal` (a role id). A real one and a forged one are the same artefact (same
 * text format, same seal); only the hidden `forged` flag differs, revealed after the game.
 */
async function sealedPost(ctx: MutationCtx, s: Scope, text: string, seal: string, forged: boolean, via: "app" | "agent") {
  const game = s.room.game as Game;
  game.chatUsed[s.seat] = true;
  await ctx.db.patch(s.room._id, { game });
  await ctx.db.insert("messages", { room: s.room._id, round: s.room.round, phase: s.room.phase, player: s.me!._id, name: s.me!.name, text, via, seal, ...(forged ? { forged } : {}) });
}
/** The wording of a Notary's sealed report, shared by the real report and its forgery. */
const reportText = (seat: number, card: string, names: { players: { name: string }[] }) => `Sealed report: at night, ${seatName(seat, names)}'s card was ${ROLE[card]?.name ?? card}.`;
async function seatNames(ctx: MutationCtx, game: Game) {
  return { players: await Promise.all(game.seats.map(async id => ({ name: (await ctx.db.get(id))?.name ?? "(left)" }))) };
}

const HANDLERS: Record<ServerId, Handler> = {
  "room.create": async (ctx, _s, a, token) => {
    let code = "";
    do code = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");
    while (await ctx.db.query("rooms").withIndex("code", q => q.eq("code", code)).unique());
    const room = await ctx.db.insert("rooms", { code, phase: "lobby", round: 0, playtest: a.playtest ?? false, settings: { deck: recommendedDeck(3), centerCount: CENTER_DEFAULT, duskSeconds: 20, turnSeconds: 12, daySeconds: 300, voteSeconds: VOTE_SECONDS_DEFAULT, rules: {} } });
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
    await ctx.db.patch(s!.room._id, { settings: { ...s!.room.settings, deck: recommendedDeck(s!.players.length, s!.room.settings.centerCount) } });
  },
  "setup.setTimer": async (ctx, s, a) => {
    const key = ({ dusk: "duskSeconds", turn: "turnSeconds", day: "daySeconds", vote: "voteSeconds" } as const)[a.timer as "dusk" | "turn" | "day" | "vote"];
    await ctx.db.patch(s!.room._id, { settings: { ...s!.room.settings, [key]: a.seconds } });
  },
  "setup.setCenter": async (ctx, s, a) => {
    await ctx.db.patch(s!.room._id, { settings: { ...s!.room.settings, centerCount: a.count } });
  },
  "setup.setRule": async (ctx, s, a) => {
    const { room } = s!;
    await ctx.db.patch(room._id, { settings: { ...room.settings, rules: { ...rulesOf(room.settings.rules), [a.rule]: a.value } } });
  },
  "setup.fixDeal": async (ctx, s, a) => {
    const { room, players } = s!;
    const problem = fixedDealProblem({ seats: a.seats, cards: a.cards }, players.map(p => p._id), room.settings.deck);
    if (problem) return fail(problem);
    await ctx.db.patch(room._id, { settings: { ...room.settings, fixedDeal: { seed: a.seed, seats: a.seats, cards: a.cards, nightSeed: a.nightSeed } } });
  },
  "setup.clearDeal": async (ctx, s) => {
    const { fixedDeal: _gone, ...settings } = s!.room.settings;
    await ctx.db.patch(s!.room._id, { settings });
  },
  "chat.send": async (ctx, s, a, _token, via) => {
    const { room, me } = s!;
    await ctx.db.insert("messages", { room: room._id, round: room.round, phase: room.phase, player: me!._id, name: me!.name, text: a.text, via });
  },
  "chat.sendSigned": (ctx, s, a, _t, via) => sealedPost(ctx, s!, a.text, "signet", false, via),
  "chat.sendReport": async (ctx, s, _a, _t, via) => {
    const game = s!.room.game as Game;
    const look = game.log.find(e => e.seat === s!.seat && e.ev.kind === "look" && e.ev.roles && e.ev.slots[0]?.k === "p");
    if (!look || look.ev.kind !== "look" || !look.ev.roles) return fail("You have no night look to report.");
    await sealedPost(ctx, s!, reportText(look.ev.slots[0].i, look.ev.roles[0], await seatNames(ctx, game)), "notary", false, via);
  },
  "chat.forgeSeal": async (ctx, s, a, _t, via) => {
    const game = s!.room.game as Game;
    if (a.as === "notary" && a.seat >= game.seats.length) return fail("There is no such seat.");
    const text = a.as === "signet" ? a.text : reportText(a.seat, a.card, await seatNames(ctx, game));
    await sealedPost(ctx, s!, text, a.as, true, via);
  },
  "connect.createKey": async (ctx, s, a) => {
    const { key, id } = await createKey(ctx, s!.me!, a.permission, a.label);
    return { key, connection: id };
  },
  "connect.revoke": async (ctx, s, a) => {
    const id = ctx.db.normalizeId("credentials", a.connection);
    const cred = id && (await ctx.db.get(id));
    if (!cred || cred.player !== s!.me!._id) return fail("That is not one of your connections.");
    await ctx.db.patch(cred._id, { revokedAt: Date.now() });
  },
  "connect.approve": async (ctx, s, a) => {
    const err = await answerRequest(ctx, a.request, a.completion, { player: s!.me!, permission: a.permission });
    if (err) return fail(err);
  },
  "connect.deny": async (ctx, _s, a) => {
    const err = await answerRequest(ctx, a.request, a.completion, null);
    if (err) return fail(err);
  },
  "game.start": async (ctx, s) => {
    const { room, players } = s!;
    const { deck, duskSeconds, turnSeconds } = room.settings;
    const rules = rulesOf(room.settings.rules);
    // Seating and the shuffle draw from separate generators: the platform's cryptographic one, or two streams of the
    // play-test seed, so neither can echo the other (see sim/deal-uniformity.ts).
    const fixed = room.playtest ? room.settings.fixedDeal : undefined;
    const problem = fixed && fixedDealProblem(fixed, players.map(p => p._id), deck);
    if (problem) return fail(`The fixed deal no longer fits the table: ${problem} Clear it or fix it again.`);
    // Every game has a seed (recorded, shown after the game): the fixed one, or one drawn from the secure generator.
    const dealSeed = fixed?.seed ?? Math.floor(secureRng() * 2 ** 31);
    const seatRng = seededRng(dealSeed), cardRng = seededRng(dealSeed ^ 0x5bd1e995);
    const seats = fixed?.seats ?? shuffle(players, seatRng).map(p => p._id);
    const state = dealFixed(fixed?.cards ?? shuffle(deck, cardRng), seats.length, rules);
    let t = Date.now();
    const turns: Turn[] = [{ role: null, startsAt: t, endsAt: (t += duskSeconds * 1000) }];
    for (const role of nightTurns(deck)) turns.push({ role, startsAt: t, endsAt: (t += turnSeconds * 1000) });
    const game: Game = {
      seats, state, turns, turn: 0, log: [],
      plans: seats.map(() => ({})), adoptPlans: seats.map(() => ({})), adoptProgress: seats.map(() => null),
      progress: state.dealt.map(r => ({ ...freshProgress(), done: !ROLE[r].steps })),
      votes: seats.map(() => null), forcedVotes: [], chatUsed: seats.map(() => false), powerUsed: seats.map(() => false), ready: seats.map(() => false), seatEffects: [],
      daySwap: null, fixed: !!fixed, dealSeed, ...(fixed?.nightSeed !== undefined || fixed?.seed !== undefined ? { nightSeed: fixed.nightSeed ?? (fixed.seed! ^ 0x2545f491) >>> 0 } : {}),
    };
    const round = room.round + 1;
    await ctx.db.patch(room._id, { phase: "night", round, game });
    await ctx.scheduler.runAt(turns[0].endsAt, internal.timers.turnEnds, { room: room._id, round, turn: 0 });
  },
  "night.planStep": async (ctx, s, a) => {
    const { room, seat } = s!;
    const game = room.game as Game;
    const role = ROLE[a.as ?? game.state.dealt[seat]];
    const err = validPlan(role, a.step, seat, shapeOf(game.state), a.plan as StepPlan);
    if (err) return fail(err);
    const turnRole = game.turns[game.turn]?.role;
    if (a.as) {
      const seats = nightSeats(game);
      (game.adoptPlans![seat][a.as] ??= {})[a.step] = a.plan;
      // Planned during the copy's own turn: it runs at once, as a live decision.
      if (game.state.adopted[String(seat)] === a.as && turnRole === turnKey(a.as)) {
        game.log.push(...advance(game.state, seat, game.adoptPlans![seat][a.as], (seats[seat].adoptProgress ??= freshProgress()), game.turn, rngFor(game, `live${game.turn}:${seat}:${a.as}:${a.step}`), { live: a.step, history: game.log, role: a.as }));
        game.adoptProgress![seat] = seats[seat].adoptProgress ?? null;
      }
    } else {
      game.plans[seat][a.step] = a.plan;
      if (turnRole === turnKey(role.id)) game.log.push(...advance(game.state, seat, game.plans[seat], game.progress[seat], game.turn, rngFor(game, `live${game.turn}:${seat}:${a.step}`), { live: a.step, history: game.log }));
    }
    await ctx.db.patch(room._id, { game });
  },
  "night.clearStep": async (ctx, s, a) => {
    const game = s!.room.game as Game;
    if (a.as) delete game.adoptPlans?.[s!.seat]?.[a.as]?.[a.step];
    else delete game.plans[s!.seat][a.step];
    await ctx.db.patch(s!.room._id, { game });
  },
  "day.vote": async (ctx, s, a) => {
    const { room, players, seat } = s!;
    const game = room.game as Game;
    if (a.seat >= game.seats.length) return fail("There is no such seat.");
    if (a.seat === seat) return fail("You cannot vote for yourself.");
    game.votes[seat] = a.seat;
    if (seatedHumans(game, players).some(i => game.votes[i] === null)) await ctx.db.patch(room._id, { game });
    else await endVote(ctx, { ...room, game });
  },
  "day.clearVote": async (ctx, s) => {
    const game = s!.room.game as Game;
    game.votes[s!.seat] = null;
    await ctx.db.patch(s!.room._id, { game });
  },
  "day.queueSwap": async (ctx, s, a) => {
    const { room, seat } = s!;
    const game = room.game as Game;
    if (a.a >= game.seats.length || a.b >= game.seats.length) return fail("There is no such seat.");
    if (a.a === seat || a.b === seat) return fail("Your own card cannot be part of the swap: choose two other players.");
    if (a.a === a.b) return fail("Choose two different players.");
    game.daySwap = { a: a.a, b: a.b, by: seat };
    await ctx.db.patch(room._id, { game });
  },
  "day.clearSwap": async (ctx, s) => {
    const game = s!.room.game as Game;
    game.daySwap = null;
    await ctx.db.patch(s!.room._id, { game });
  },
  "day.ready": async (ctx, s, a) => {
    const { room, players, seat } = s!;
    const game = room.game as Game;
    (game.ready ??= game.seats.map(() => false))[seat] = a.ready;
    if (seatedHumans(game, players).every(i => game.ready[i])) await startVote(ctx, { ...room, game });
    else await ctx.db.patch(room._id, { game });
  },
  "day.cutLine": async (ctx, s, a) => {
    const { room, seat } = s!;
    const game = room.game as Game;
    if (a.seat >= game.seats.length) return fail("There is no such seat.");
    if (a.seat === seat) return fail("Choose another player.");
    if (game.powerUsed?.[seat]) return fail("You have already used it.");
    (game.powerUsed ??= game.seats.map(() => false))[seat] = true;
    const now = Date.now();
    (game.seatEffects ??= []).push({ seat: a.seat, kind: "blackout", from: now, until: now + rulesOf(room.settings.rules).cutSeconds * 1000, by: seat, source: "hush" });
    await ctx.db.patch(room._id, { game });
  },
  "day.endDiscussion": (ctx, s) => startVote(ctx, s!.room),
  "presence.heartbeat": async (ctx, s) => { await ctx.db.patch(s!.me!._id, { lastSeenAt: Date.now() }); },
  "game.abandon": async (ctx, s) => { await ctx.db.patch(s!.room._id, { phase: "lobby", game: undefined }); },
  "game.playAgain": async (ctx, s) => { await ctx.db.patch(s!.room._id, { phase: "lobby", game: undefined }); },
};

/** Why a fixed seating or deal does not fit the room's players and deck, or null. */
function fixedDealProblem(f: { seats?: string[]; cards?: string[] }, players: string[], deck: string[]): string | null {
  if (f.seats && (f.seats.length !== players.length || new Set(f.seats).size !== f.seats.length || f.seats.some(id => !players.includes(id)))) return "The seating must list every player in the room exactly once.";
  if (f.cards && [...f.cards].sort().join() !== [...deck].sort().join()) return "The fixed cards must be exactly the cards of the deck, rearranged.";
  return null;
}

/** Who is calling: a browser (its secret token) or an assistant already authenticated as one player (convex/mcp.ts). */
export type Caller = { token: string } | { player: Id<"players"> };

/** The single path every command takes, whoever sends it. */
export async function dispatch(ctx: MutationCtx, caller: Caller, code: string | undefined, id: string, args: unknown) {
  const cmd = COMMAND[id];
  const handler = HANDLERS[id as ServerId];
  if (!cmd || cmd.runs !== "server" || !handler) return fail(`Unknown command ${id}.`);
  const agent = "player" in caller;
  const parsed = cmd.params.safeParse(args ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue ? `${issue.path.join(".") || "arguments"}: ${issue.message}` : "Those arguments are not valid.");
  }
  // Creating and joining are done from outside a room, whatever page the caller is looking at.
  const outside = cmd.contexts.length === 1 && cmd.contexts[0] === "home";
  const scope = outside ? null : await loadScope(ctx, caller, code);
  if (!scope && !outside) return fail("That room no longer exists.");
  // The presence gate, before anything else is decided or revealed: a silenced player's calls fail as an unreachable
  // server's would. A blackout refuses every call; a lighter effect would refuse only what others can perceive.
  if (scope?.me) {
    const g = gateOf(scope.room.game as Game | undefined, scope.room.phase, rulesOf(scope.room.settings.rules), scope.seat, Date.now());
    if (!g.open && (g.kind === "blackout" || cmd.perceivable)) return fail(UNREACHABLE);
  }
  const can = availability(cmd, contextOf(scope), parsed.data as Record<string, unknown>);
  if (!can.ok) return fail(can.reason);
  if (outside && agent) return fail("An assistant acts inside the room it was connected to.");
  return (await handler(ctx, scope, parsed.data, agent ? "" : caller.token, agent ? "agent" : "app")) ?? null;
}

/** The app's way in: the palette and every button call this. */
export const run = mutation({
  args: { id: v.string(), token: v.string(), code: v.optional(v.string()), args: v.optional(v.any()) },
  handler: async (ctx, { id, token, code, args }) => {
    if (token.length < 16) return fail("Missing session.");
    return dispatch(ctx, { token }, code, id, args);
  },
});

/** The assistant's way in: convex/mcp.ts authenticates a connection, then calls this as that connection's player. */
export const runAs = internalMutation({
  args: { player: v.id("players"), code: v.string(), id: v.string(), args: v.optional(v.any()) },
  handler: (ctx, { player, code, id, args }) => dispatch(ctx, { player }, code, id, args),
});
