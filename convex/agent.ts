/**
 * What an assistant reads. The same secrecy as the app's view (convex/rooms.ts): it is built from the same scope and
 * shows one player only what that player may see, but as labelled data a model can act on without the screen, with the
 * legal choices for each open step spelled out.
 */
import { v } from "convex/values";
import { internalQuery, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { isAuto, legalTargets, shapeOf, type StepPlan } from "../shared/engine";
import { condSource, pickCount, ROLE, TEAM_NAME, type RoleId, type Slot } from "../shared/roles";
import { cardOf, describe } from "../shared/text";
import type { Game } from "./game";
import { contextOf, loadScope, type Scope } from "./scope";

const secs = (ms: number) => Math.max(0, Math.round(ms / 1000));
const roleCard = (id: RoleId) => ({ id, name: ROLE[id].name, team: TEAM_NAME[ROLE[id].team], rule: ROLE[id].rules });

async function chat(ctx: QueryCtx, scope: Scope) {
  const rows = await ctx.db.query("messages").withIndex("room", q => q.eq("room", scope.room._id)).order("desc").take(120);
  const ended = scope.room.phase === "ended";
  const game = scope.room.game as Game | undefined;
  return rows.reverse().filter(m => m.round === scope.room.round || m.phase === "lobby").map(m => {
    const hidden = m.mark === "unsigned" && !(ended && m.round === scope.room.round);
    return {
      from: hidden ? "(unsigned)" : m.name,
      seat: hidden || !game ? null : (i => (i >= 0 ? i : null))(game.seats.indexOf(m.player)),
      phase: m.phase,
      text: m.text,
      ...(m.mark === "signed" ? { verified: "The game confirms this was sent by the player DEALT Signet." } : {}),
      ...(m.mark === "unsigned" ? { unsigned: "Sent with the Forger's power: the sender's name is withheld until the game ends." } : {}),
    };
  });
}

function version(scope: Scope, messages: number) {
  const g = scope.room.game as Game | undefined;
  return [scope.room.round, scope.room.phase, g?.turn ?? 0, messages, g?.votes.filter(x => x !== null).length ?? 0, g && scope.seat >= 0 ? g.log.filter(e => e.seat === scope.seat).length : 0,
    scope.players.length, scope.room.settings.deck.length, g?.state.shown.length ?? 0].join(".");
}

export const tick = internalQuery({
  args: { player: v.id("players"), code: v.string() },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player }, a.code);
    if (!scope) return null;
    const count = (await ctx.db.query("messages").withIndex("room", q => q.eq("room", scope.room._id)).collect()).length;
    return { version: version(scope, count), phase: scope.room.phase };
  },
});

/** The CommandContext for a player, for availability checks outside a mutation. */
export const context = internalQuery({
  args: { player: v.id("players"), code: v.string() },
  handler: async (ctx, a) => contextOf(await loadScope(ctx, { player: a.player }, a.code)),
});

export const view = internalQuery({
  args: { player: v.id("players"), code: v.string() },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player }, a.code);
    if (!scope || !scope.me) return null;
    const { room, players, me, seat } = scope;
    const game = room.game as Game | undefined;
    const now = Date.now();
    const names = { players: game ? game.seats.map(id => ({ name: players.find(p => p._id === id)?.name ?? "(left)" })) : players.map(p => ({ name: p.name })) };
    const slotName = (s: Slot) => (s.k === "c" ? `centre card ${s.i + 1}` : `${names.players[s.i].name} (seat ${s.i})`);
    const messages = await chat(ctx, scope);
    const count = (await ctx.db.query("messages").withIndex("room", q => q.eq("room", room._id)).collect()).length;
    const deck = [...new Set(room.settings.deck)].map(id => ({ role: ROLE[id].name, id, team: TEAM_NAME[ROLE[id].team], copies: room.settings.deck.filter(x => x === id).length }));

    const out: Record<string, unknown> = {
      version: version(scope, count),
      room: room.code,
      phase: room.phase,
      you: { name: me.name, seat: seat >= 0 ? seat : null, host: room.host === me._id, ...(game && seat < 0 ? { watching: "This round began before you sat down." } : {}) },
      players: game
        ? game.seats.map((id, i) => ({ seat: i, name: names.players[i].name, you: i === seat, host: room.host === id, bot: players.find(p => p._id === id)?.bot ?? false }))
        : players.map(p => ({ name: p.name, you: p._id === me._id, host: room.host === p._id, bot: p.bot })),
      seating: game ? "Seats are in clockwise order: the player clockwise of seat N is seat N+1, wrapping to seat 0." : "Seats are assigned at random when the game starts.",
      table: { centreCards: room.settings.centerCount, deck, deckSize: room.settings.deck.length, timersSeconds: { dusk: room.settings.duskSeconds, eachNightTurn: room.settings.turnSeconds, day: room.settings.daySeconds } },
      chat: messages,
    };
    if (!game) return out;

    if (seat >= 0) {
      const dealt = game.state.dealt[seat], role = ROLE[dealt], progress = game.progress[seat], shape = shapeOf(game.state);
      (out.you as Record<string, unknown>).dealt = roleCard(dealt);
      (out.you as Record<string, unknown>).reminder = "You win or lose by the card you HOLD when the votes are counted. It may have been moved since you were dealt it.";
      out.learned = game.log.filter(e => e.seat === seat).map(e => describe(e, names, seat));
      if (room.phase === "night") {
        out.yourNightSteps = (role.steps ?? []).map((step, i) => {
          const done = progress.done || i < progress.step;
          if (done) return { step: step.id, title: step.title, status: "done" };
          if (isAuto(step)) return { step: step.id, title: step.title, status: "automatic: happens by itself on your turn" };
          const src = condSource(role, step.id), seen = src ? progress.seen[src.id] : undefined;
          const plan = game.plans[seat][step.id] as StepPlan | undefined;
          const targets = legalTargets(step, seat, shape);
          return {
            step: step.id, title: step.title,
            status: plan ? "queued (you can still change it until it happens)" : "NOT DECIDED: a random move is made for you if this is still undecided when your turn ends",
            ...(step.onlyIfAlone ? { note: "Only happens if no other player was dealt a Werewolf." } : {}),
            choices: [
              ...(step.pick ? [{ kind: "pick", targetsNeeded: pickCount(step, shape), legalTargets: targets.map(t => ({ slot: t, is: t.k === "p" && t.i === seat ? "your own card" : slotName(t) })) }] : [{ kind: "do", means: step.doLabel ?? "Do it" }]),
              ...(step.optional ? [{ kind: "skip", means: step.skipLabel ?? "Skip" }] : []),
            ],
            ...(src ? (seen ? { youSaw: seen.map(r => ROLE[r].name) } : { canBranchOn: `what you will see at step "${src.id}"`, possibleCards: [...new Set(room.settings.deck)] }) : {}),
            queuedPlan: plan ?? null,
          };
        });
      }
    }

    out.shownToEveryone = game.state.shown.map(s => ({ card: cardOf(s.slot, names, -1), was: ROLE[s.role].name, duringTurn: game.turns[s.turn]?.role ? ROLE[game.turns[s.turn].role!].name : "Dusk", note: "True at that moment. Later turns may have moved it." }));

    if (room.phase === "night") {
      const turn = game.turns[game.turn];
      out.night = {
        now: turn ? { turn: game.turn, role: turn.role ? ROLE[turn.role].name : "Dusk (everyone reads their card and may queue their move)", secondsLeft: secs(turn.endsAt - now) } : null,
        timetable: game.turns.map((t, i) => ({ turn: i, role: t.role ? ROLE[t.role].name : "Dusk", state: i < game.turn ? "over" : i === game.turn ? "NOW" : `starts in ${secs(t.startsAt - now)}s`, ...(seat >= 0 && t.role === game.state.dealt[seat] ? { yours: true } : {}) })),
        dayStartsInSeconds: secs(game.turns[game.turns.length - 1].endsAt - now),
        note: "Every role in the deck gets a turn of the same length whether or not anyone holds it. Chat is closed until day.",
      };
    }
    if (room.phase === "day") {
      out.day = {
        secondsLeft: secs((game.dayEndsAt ?? now) - now),
        yourVote: seat >= 0 && game.votes[seat] !== null ? { seat: game.votes[seat], name: names.players[game.votes[seat]!].name } : null,
        haveVoted: game.votes.flatMap((x, i) => (x !== null ? [names.players[i].name] : [])),
        notYetVoted: game.votes.flatMap((x, i) => (x === null ? [names.players[i].name] : [])),
        note: "The day ends as soon as every human player has voted, or when the time runs out. A vote can be changed until then. Anyone who has not voted gets a random vote.",
      };
    }
    if (room.phase === "ended" && game.outcome) {
      const o = game.outcome;
      out.result = {
        headline: o.headline, notes: o.notes, winningTeam: o.winningTeam,
        youWon: seat >= 0 ? o.winners.includes(seat) : null,
        eliminated: o.deaths.map(i => names.players[i].name),
        seats: game.seats.map((_, i) => ({ seat: i, name: names.players[i].name, dealt: ROLE[game.state.dealt[i]].name, endedHolding: ROLE[game.state.cards[i]].name, endedOnTeam: TEAM_NAME[o.teams[i]], votedFor: names.players[game.votes[i]!]?.name, voteWasRandom: game.forcedVotes.includes(i), votesReceived: o.tally[i], eliminated: o.deaths.includes(i), won: o.winners.includes(i) })),
        centre: game.state.center.map(r => ROLE[r].name),
        nightLog: game.log.map(e => `[${game.turns[e.turn]?.role ? ROLE[game.turns[e.turn].role!].name : "Dusk"}] ${describe(e, names, -1)}${e.via === "forced" ? " (random: out of time)" : ""}`),
      };
    }
    return out;
  },
});

export const RULES = `CENTAUR WEREWOLF: how to play

One night, one day, one vote.
- Each player is dealt one card face down; extra cards lie face down in the centre. You know only your own card.
- NIGHT. It begins with Dusk (read your card), then every role in the deck that acts at night gets one turn, in a fixed order, each exactly the same length, whether a player holds that card or it lies in the centre. Everyone sees which turn it is. You act on the turn of the card you were DEALT.
- Night actions can move cards. Your card may be swapped away without you knowing. The card you HOLD when the votes are counted decides your team.
- DAY. Everyone talks in chat, then votes for one other player. The player(s) with the most votes are eliminated, unless nobody got more than one vote, in which case nobody is.

Winning
- Centaur team: wins if at least one Werewolf is eliminated. If no player holds a Werewolf card, the Centaurs win only if nobody is eliminated.
- Werewolf team (Werewolves and their allies): wins if no Werewolf is eliminated.
- Some cards win in their own way; their rule says how.

Deciding your night action (tool night_planStep)
- Call room_view: "yourNightSteps" lists each step, its legal choices, and whether it is decided.
- Decide BEFORE your turn if you can (during Dusk): the plan then plays by itself when your turn comes. If you decide during your own turn it happens at once. A step still undecided when your turn ends gets a RANDOM legal move.
- Unconditional: { "step": "<id>", "plan": { "branches": [], "otherwise": <decision> } }
- A decision is { "kind": "pick", "targets": [<slot>, ...] } with exactly "targetsNeeded" slots copied from "legalTargets", or { "kind": "do" }, or { "kind": "skip" }. A slot is { "k": "p", "i": <seat> } for a player or { "k": "c", "i": <index from 0> } for a centre card.
- Conditional: a step that says "canBranchOn" may depend on the card you will see at the earlier step:
  { "step": "trade", "plan": { "branches": [ { "roles": ["werewolf", "tracker"], "decision": { "kind": "skip" } } ], "otherwise": { "kind": "do" } } }
  The first branch whose roles include the card you saw applies; "otherwise" covers every other card. Role ids are in table.deck.
- After each of your turns, call room_view again: "learned" lists what you did and saw.

Day
- chat_send posts to the whole table. Claims can be lies. Read "chat" in room_view; use room_wait to wait for new messages instead of polling.
- day_vote casts or changes your vote (by seat number, not your own). The day ends as soon as every human has voted, so vote only when you have said what you want to say.

General
- room_wait(version) returns when anything changes. Pass the latest version you have.
- A tool that cannot be used right now answers with the reason.`;

export const rules = internalQuery({
  args: { player: v.id("players"), code: v.string() },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player as Id<"players"> }, a.code);
    if (!scope) return null;
    const deck = scope.room.settings.deck;
    const nightOrder = [...new Set(deck)].filter(r => ROLE[r].wake !== undefined).sort((x, y) => ROLE[x].wake! - ROLE[y].wake!);
    return {
      rules: RULES,
      thisTable: { players: scope.players.length, centreCards: scope.room.settings.centerCount, nightOrder: ["Dusk", ...nightOrder.map(r => ROLE[r].name)] },
      rolesInThisDeck: [...new Set(deck)].map(id => ({ ...roleCard(id), copies: deck.filter(x => x === id).length, actsAtNight: ROLE[id].wake !== undefined })),
    };
  },
});
