/**
 * What an assistant reads. The same secrecy as the app's view (convex/rooms.ts): it is built from the same scope and
 * shows one player only what that player may see, but as labelled data a model can act on without the screen, with the
 * legal choices for each open step spelled out. Every top-level key is always present; a key that does not apply in
 * this phase is null.
 */
import { v } from "convex/values";
import { internalQuery, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { isAuto, legalTargets, publicMarks, shapeOf, visibleShown, type StepPlan } from "../shared/engine";
import { condSource, legalRoles, pickCount, ROLE, TEAM_NAME, type RoleId, type Slot } from "../shared/roles";
import { describeRules, rulesOf } from "../shared/settings";
import { cardOf, describe, revealHidden, seatName, type Names } from "../shared/text";
import type { Game } from "./game";
import { redact } from "./rooms";
import { loadScope, type Scope } from "./scope";

const secs = (ms: number) => Math.max(0, Math.round(ms / 1000));
const roleCard = (id: RoleId) => ({ id, name: ROLE[id].name, team: TEAM_NAME[ROLE[id].team], rule: ROLE[id].rules });

// ───────────── chat ─────────────

async function chatRows(ctx: QueryCtx, scope: Scope) {
  const rows = await ctx.db.query("messages").withIndex("room", q => q.eq("room", scope.room._id)).collect();
  return rows.filter(m => m.round === scope.room.round || m.phase === "lobby");
}
function chat(scope: Scope, rows: Awaited<ReturnType<typeof chatRows>>, since: number) {
  const ended = scope.room.phase === "ended";
  const game = scope.room.game as Game | undefined;
  return rows.flatMap((m, n) => {
    if (n < since) return [];
    const hidden = m.mark === "unsigned" && !(ended && m.round === scope.room.round);
    const seat = hidden || !game ? null : (i => (i >= 0 ? i : null))(game.seats.indexOf(m.player));
    return [{
      n,
      from: hidden ? "(unsigned)" : seat === null ? m.name : `${m.name} (seat ${seat})`,
      seat,
      phase: m.phase,
      text: m.text,
      ...(m.mark === "signed" ? { verified: "The game confirms this was sent by the player DEALT Signet." } : {}),
      ...(m.mark === "unsigned" ? { unsigned: "Sent anonymously: the sender's name is withheld until the game ends." } : {}),
    }];
  });
}

// ───────────── versions ─────────────

/**
 * The version is a list of named parts, so room_wait can wait for one kind of change. It does not include the clock
 * or other players' night turns: only what this viewer can see change.
 */
function versionParts(scope: Scope, chatCount: number): Record<string, string | number> {
  const { room, seat, players } = scope;
  const g = room.game as Game | undefined;
  const mine = g && seat >= 0 ? g.state.dealt[seat] : null;
  // Your own night turn: before it, during it, after it (or none).
  const turn = !g || room.phase !== "night" || !mine ? "-" : (i => (i < 0 ? "-" : g.turn < i ? "before" : g.turn === i ? "now" : "after"))(g.turns.findIndex(t => t.role === mine));
  const settings = JSON.stringify([room.settings.deck, room.settings.centerCount, room.settings.rules ?? {}, room.settings.duskSeconds, room.settings.turnSeconds, room.settings.daySeconds, !!room.settings.fixedDeal, room.host]);
  let h = 0;
  for (const c of settings + players.map(p => p.name).join("|")) h = (h * 31 + c.charCodeAt(0)) | 0;
  return {
    r: room.round, ph: room.phase, t: turn, c: chatCount,
    v: g?.votes.filter(x => x !== null).length ?? 0,
    j: g && seat >= 0 ? g.log.filter(e => e.seat === seat).length + Object.keys(g.plans[seat] ?? {}).length : 0,
    s: (h >>> 0).toString(36), d: g ? visibleShown(g.state).length : 0, w: g?.daySwap && g.daySwap.by === seat ? `${g.daySwap.a}-${g.daySwap.b}` : "-",
  };
}
const encode = (p: Record<string, string | number>) => Object.entries(p).map(([k, x]) => `${k}${x}`).join(".");
/** The parts of a version that a wait mode watches. */
export const WAIT_PARTS: Record<string, string[]> = { any: ["r", "ph", "t", "c", "v", "j", "s", "d", "w"], phase: ["r", "ph"], chat: ["r", "ph", "c"], turn: ["r", "ph", "t"] };
export function versionKey(version: string, until: string): string {
  const parts = Object.fromEntries(version.split(".").map(x => { const m = /^([a-z]+)(.*)$/.exec(x); return m ? [m[1], m[2]] : [x, ""]; }));
  return (WAIT_PARTS[until] ?? WAIT_PARTS.any).map(k => `${k}${parts[k] ?? ""}`).join(".");
}

export const tick = internalQuery({
  args: { player: v.id("players"), code: v.string() },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player }, a.code);
    if (!scope) return null;
    const rows = await chatRows(ctx, scope);
    return { version: encode(versionParts(scope, rows.length)), phase: scope.room.phase, chatCount: rows.length };
  },
});

// ───────────── caveats ─────────────

/** What a deck means for anything a player sees or hears: one warning per mechanic in it. */
export function caveats(deck: RoleId[]): string[] {
  const has = (id: RoleId) => deck.includes(id);
  const out: string[] = [];
  if (["rustler", "farrier", "spooker", "moonthief"].some(has)) out.push("Cards move in this deck: your own card may have been moved without your knowing, and a moved card takes its team with it. Every look shows a card as it was at that moment.");
  if (has("glamour")) out.push("Glamour is in this deck: any card looked at tonight (a read, a centre glance, a proclamation, a creature's look) may have shown a disguise. Werewolf-team looks and the Herder's count see the truth.");
  if (has("forger")) out.push("A Forger is in this deck: one proclamation at dawn may be forged, and it looks exactly like the Herald's.");
  if (has("eavesdropper")) out.push("An Eavesdropper is in this deck: a Werewolf may hold an exact copy of one role's true night results, so two players can make the same true claim.");
  if (has("biter")) out.push("A Biter is in this deck: a player may have been bitten onto the Werewolf team. They keep their true night results and know one wolf's seat.");
  if (has("stalkinghorse")) out.push("A Stalking Horse is in this deck: it wakes with the pack and knows what they know. If whoever holds it is eliminated, the Werewolf team wins, even if a Werewolf falls too.");
  if (has("moonthief")) out.push("A Moon-Thief is in this deck: the player dealt it may swap two other players' cards the instant the votes lock, before anything is counted.");
  if (has("sporeling")) out.push("A Sporeling is in this deck: if you vote for whoever holds it and they are eliminated, you lose, whatever side you are on.");
  if (has("moth")) out.push("A Moth is in this deck: if the card dealt to its seat was moved tonight, that player is now an Imago, who wins only by being eliminated.");
  if (has("cuckoo")) out.push("A Cuckoo is in this deck: whoever holds it wins if the egged seat is eliminated and they are not. Pressure on the egged seat may come from them.");
  if (has("oxpecker")) out.push("An Oxpecker is in this deck: whoever holds it wins exactly when the seat it bonded to wins, whatever side that is.");
  if (has("elderbark")) out.push("An Elderbark is in this deck: it knows which seats were dealt creatures, and wins if no creature is eliminated. A claim to be the Elderbark may be a lie.");
  return out;
}

// ───────────── the view ─────────────

export const view = internalQuery({
  args: { player: v.id("players"), code: v.string(), compact: v.optional(v.boolean()), chatSince: v.optional(v.number()) },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player }, a.code);
    if (!scope || !scope.me) return null;
    const { room, players, me, seat } = scope;
    const game = room.game as Game | undefined;
    const now = Date.now();
    const names: Names = { players: game ? game.seats.map(id => ({ name: players.find(p => p._id === id)?.name ?? "(left)" })) : players.map(p => ({ name: p.name })) };
    const who = (i: number) => seatName(i, names);
    const slotName = (s: Slot) => (s.k === "c" ? `centre card ${s.i + 1} (index ${s.i})` : who(s.i));
    const rows = await chatRows(ctx, scope);
    const rules = game ? game.state.rules : rulesOf(room.settings.rules);
    const deckIds = game ? shapeOf(game.state).deck! : room.settings.deck;
    const deck = [...new Set(deckIds)].map(id => ({ role: ROLE[id].name, id, team: TEAM_NAME[ROLE[id].team], copies: deckIds.filter(x => x === id).length }));
    const ended = room.phase === "ended";
    const mine = game && seat >= 0 ? game.state.dealt[seat] : null;
    const bittenMe = !!game && game.state.dawn && game.state.bitten?.seat === seat;
    const imagoMe = !!game && game.state.imago.includes(seat);

    const out: Record<string, unknown> = {
      version: encode(versionParts(scope, rows.length)),
      room: room.code,
      phase: room.phase,
      playtest: room.playtest ? "This is a play-test table: its host may fix the deal and sees every card." : null,
      you: {
        name: me.name, seat: seat >= 0 ? seat : null, host: room.host === me._id,
        watching: game && seat < 0 ? "This round began before you sat down." : null,
        dealt: mine ? roleCard(mine) : null,
        status: !mine ? null : bittenMe
          ? { bitten: { by: game!.state.bitten!.by >= 0 && rules.biteNamesBiter ? who(game!.state.bitten!.by) : "(not told)" }, winsBy: "You were bitten: you now win only with the Werewolf team. You are not a Werewolf and have no creature rules." }
          : imagoMe ? { imago: true, winsBy: "You are an Imago: you win only by being eliminated, whatever card you hold." }
          : { winsBy: "By the card you HOLD when the votes are counted (it may have been moved since you were dealt it): its team, or its own rule." },
      },
      players: game
        ? game.seats.map((id, i) => ({ seat: i, name: names.players[i].name, label: who(i), you: i === seat, host: room.host === id, bot: players.find(p => p._id === id)?.bot ?? false }))
        : players.map(p => ({ seat: null, name: p.name, label: p.name, you: p._id === me._id, host: room.host === p._id, bot: p.bot })),
      seating: game ? "Seats are in clockwise order, counted from 0: the player clockwise of seat N is seat N+1, wrapping to seat 0." : "Seats are assigned at random when the game starts.",
      table: a.compact ? null : {
        centreCards: game ? game.state.center.length : room.settings.centerCount, deck, deckSize: deckIds.length,
        timersSeconds: { dusk: room.settings.duskSeconds, eachNightTurn: room.settings.turnSeconds, day: room.settings.daySeconds },
        rules: describeRules(rules).map(r => ({ rule: r.rule, title: r.title, value: r.value, means: r.means })),
        caveats: caveats(deckIds),
      },
      learned: null, yourNightSteps: null, night: null, proclamations: null, marks: null, day: null, result: null,
      chat: chat(scope, rows, a.chatSince ?? 0),
      chatCount: rows.length,
    };
    if (!game) return out;

    if (seat >= 0) {
      const role = ROLE[mine!], progress = game.progress[seat], shape = shapeOf(game.state);
      out.learned = game.log.filter(e => e.seat === seat).map(e => describe(ended ? e : redact(e), names, seat) + (ended ? revealHidden(e, names) : ""));
      if (room.phase === "night") {
        out.yourNightSteps = (role.steps ?? []).map((step, i) => {
          const done = progress.done || i < progress.step;
          if (done) return { step: step.id, title: step.title, status: "done" };
          if (isAuto(step)) return { step: step.id, title: step.title, status: "automatic: happens by itself on your turn" };
          const src = condSource(role, step.id), seen = src ? progress.seen[src.id] : undefined;
          const plan = game.plans[seat][step.id] as StepPlan | undefined;
          const targets = legalTargets(step, seat, shape), roles = legalRoles(step, shape.deck!, role.id);
          return {
            step: step.id, title: step.title,
            status: plan ? "queued (you can still change it until it happens)" : "NOT DECIDED: a random move is made for you if this is still undecided when your turn ends",
            note: step.onlyIfAlone ? "Only happens if no other player was dealt a card of the pack; if it does not happen, you are told." : null,
            choices: [
              ...(step.pick ? [{ kind: "pick", targetsNeeded: pickCount(step, shape), legalTargets: targets.map(t => ({ slot: t, is: t.k === "p" && t.i === seat ? "your own card" : slotName(t) })), ...(step.names ? { alsoName: "a role from legalRoles, as \"role\"" } : {}) }] : step.names ? [{ kind: "name", means: "name a role from legalRoles, as \"role\"" }] : [{ kind: "do", means: step.doLabel ?? "Do it" }]),
              ...(step.optional ? [{ kind: "skip", means: step.skipLabel ?? "Skip" }] : []),
            ],
            legalRoles: step.names ? roles.map(r => ({ id: r, name: ROLE[r].name })) : null,
            ...(src ? (seen ? { youSaw: seen.map(r => ROLE[r].name) } : { canBranchOn: `what you will see at step "${src.id}"`, possibleCards: [...new Set(shape.deck!)] }) : {}),
            queuedPlan: plan ?? null,
          };
        });
      }
    }

    out.proclamations = visibleShown(game.state).map(s => ({
      card: cardOf(s.slot, names, -1), was: ROLE[s.role].name,
      madeDuring: s.atDawn ? `${ROLE[s.by]?.name ?? s.by}'s turn` : game.turns[s.turn]?.role ? `${ROLE[game.turns[s.turn].role!].name}'s turn` : "Dusk",
      ...(ended && s.forged ? { FORGED: "This proclamation was the Forger's." } : {}),
      note: "True at that moment of the night (unless forged or glamoured). Later turns may have moved the card.",
    }));
    const marks = publicMarks(game.state);
    out.marks = game.state.dawn ? marks.map(m => ({ what: m.label, on: who(m.seat), seat: m.seat, note: m.role === "cuckoo" ? "Whoever holds the Cuckoo when the votes are counted wins if this seat is eliminated and they are not." : null })) : null;

    if (room.phase === "night") {
      const turn = game.turns[game.turn];
      const yours = mine ? game.turns.findIndex(t => t.role === mine) : -1;
      out.night = {
        now: turn ? { turn: game.turn, role: turn.role ? ROLE[turn.role].name : "Dusk (everyone reads their card and may queue their move)", secondsLeft: secs(turn.endsAt - now) } : null,
        yourTurn: yours < 0 ? { state: "none", note: "Your dealt card does not act at night." } : yours > game.turn ? { state: "upcoming", turn: yours, startsInSeconds: secs(game.turns[yours].startsAt - now), endsInSeconds: secs(game.turns[yours].endsAt - now) } : yours === game.turn ? { state: "NOW", endsInSeconds: secs(game.turns[yours].endsAt - now) } : { state: "over" },
        timetable: a.compact ? null : game.turns.map((t, i) => ({ turn: i, role: t.role ? ROLE[t.role].name : "Dusk", state: i < game.turn ? "over" : i === game.turn ? "NOW" : `starts in ${secs(t.startsAt - now)}s`, yours: !!mine && t.role === mine })),
        dayStartsInSeconds: secs(game.turns[game.turns.length - 1].endsAt - now),
        note: "Every role in the deck gets a turn of the same length whether or not anyone holds it. Chat is closed until day. Proclamations and the egg are published at dawn.",
      };
    }
    if (room.phase === "day") {
      const dayPower = mine ? ROLE[mine].dayPower : undefined;
      out.day = {
        secondsLeft: secs((game.dayEndsAt ?? now) - now),
        yourVote: seat >= 0 && game.votes[seat] !== null ? { seat: game.votes[seat], name: who(game.votes[seat]!) } : null,
        haveVoted: game.votes.flatMap((x, i) => (x !== null ? [who(i)] : [])),
        notYetVoted: game.votes.flatMap((x, i) => (x === null ? [who(i)] : [])),
        yourSwap: dayPower === "swap" ? (game.daySwap?.by === seat ? { a: who(game.daySwap.a), b: who(game.daySwap.b), note: "Made the instant the votes lock. Change it with day_queueSwap, cancel with day_clearSwap." } : { none: "You may queue a swap with day_queueSwap { a, b } (two other players' seats)." }) : null,
        warning: deckIds.includes("sporeling") ? "If you vote for whoever holds the Sporeling and they are eliminated, you lose." : null,
        note: "The day ends as soon as every human player has voted, or when the time runs out. A vote can be changed until then. Anyone who has not voted gets a random vote.",
      };
    }
    if (ended && game.outcome) {
      const o = game.outcome, s = game.state;
      out.result = {
        headline: o.headline, notes: o.notes, winningTeam: o.winningTeam,
        youWon: seat >= 0 ? o.winners.includes(seat) : null,
        why: seat >= 0 ? o.why[seat] : null,
        eliminated: o.deaths.map(who),
        bloodPrice: { werewolvesEliminated: o.wolvesDown, centaursEliminated: o.centaursDown, ruleOn: s.rules.bloodPrice },
        seats: game.seats.map((_, i) => ({
          seat: i, name: names.players[i].name, dealt: ROLE[s.dealt[i]].name, endedHolding: ROLE[s.cards[i]].name, endedOnTeam: TEAM_NAME[o.teams[i]],
          won: o.winners.includes(i), why: o.why[i],
          votedFor: who(game.votes[i]!), voteWasRandom: game.forcedVotes.includes(i), votesReceived: o.tally[i], eliminated: o.deaths.includes(i),
          bitten: s.bitten?.seat === i, imago: s.imago.includes(i), cursed: o.cursed.includes(i),
        })),
        centre: s.center.map(r => ROLE[r].name),
        dealtCentre: s.dealtCenter.map(r => ROLE[r].name),
        marks: Object.entries(s.marks).map(([r, i]) => ({ card: ROLE[r].name, seat: i, on: who(i) })),
        daySwap: game.daySwap ? { by: who(game.daySwap.by), swapped: [who(game.daySwap.a), who(game.daySwap.b)] } : null,
        nightLog: game.log.map(e => `[${e.turn >= game.turns.length ? (e.step === "day" ? "Vote" : "Dawn") : game.turns[e.turn]?.role ? ROLE[game.turns[e.turn].role!].name : "Dusk"}] ${describe(e, names, -1)}${revealHidden(e, names)}${e.via === "forced" ? " (random: out of time)" : ""}`),
      };
    }
    return out;
  },
});

export const RULES = `CENTAUR WEREWOLF: how to play

One night, one day, one vote.
- Each player is dealt one card face down; extra cards lie face down in the centre. You know only your own card.
- NIGHT. It begins with Dusk (read your card), then every role in the deck that acts at night gets one turn, in a fixed order, each exactly the same length, whether a player holds that card or it lies in the centre. Everyone sees which turn it is. You act on the turn of the card you were DEALT.
- DAWN. Proclamations (and, with a Cuckoo, the egg) are published; a bitten player or an Imago is told privately.
- DAY. Everyone talks in chat, then votes for one other player. The player(s) with the most votes are eliminated, if that is at least the table's "Votes to eliminate" (2 by default); otherwise nobody is. A Moon-Thief's queued swap happens the instant the votes lock, before anything is counted.

Cards, looks and what you know
- A look shows a card AS IT IS AT THAT MOMENT. Later turns may move it.
- Night actions can move cards. Your own card may be swapped away without you knowing. A moved card takes its team with it: the card you HOLD when the votes are counted decides your team (unless you were bitten or became an Imago).
- With Glamour in the deck, a look may show a disguise (until dawn). Werewolf-team looks and the Herder's count see the truth.
- What "blind" roles do not learn: the Spooker sees none of the cards it moves; the Sentry learns only WHETHER nearby cards moved, not what they are; the Herder learns only HOW MANY Werewolf cards lie in the centre, not which; the Whisperer is told one Werewolf's seat, and that Werewolf does not know the Whisperer; the census tells the pack which roles were dealt to the centre, not where they lie; the Elderbark learns which seats were DEALT creatures, not what they hold now; a bitten player is not told what the Biter holds.

How the game is decided (in this order)
1. Swap: the Moon-Thief's queued swap, if any.
2. Tally: votes, weighted by the card each voter holds (Chiron counts twice). The eliminated are every seat tied on the most votes, if that is enough votes.
3. Teams: a bitten seat is on the Werewolf team (and has no creature rules); an Imago is a creature; everyone else is on the team of the card they hold.
4. Main result:
   a. If an eliminated player holds the Stalking Horse, the Werewolf team wins.
   b. If no player holds a Werewolf card: the Centaurs win if nobody is eliminated; otherwise the surviving Werewolf-team players win (if any).
   c. Otherwise, with the Blood Price rule: the Centaurs win only if more Werewolf cards than Centaur-team players are eliminated (a Werewolf and a Centaur tied and eliminated is a Werewolf-team win). Without it: the Centaurs win if any Werewolf card is eliminated. If the Centaurs do not win, the Werewolf team does.
   Every member of the winning team wins, alive or dead. A "Werewolf" here is a card tagged Werewolf (Werewolf, Glamour, Moon-Thief, Tracker, Eavesdropper, Biter): the Stalking Horse and the allies (Whisperer, Forger, Spooker) are on the Werewolf team but are not Werewolves.
5. Creatures win alongside: the Sporeling holder and an Imago if eliminated; the Cuckoo holder if the egged seat is eliminated and they are not; the Elderbark holder if they are not eliminated and no other creature or Imago is. If the Elderbark holder is eliminated, no other creature wins.
6. Curse: every player whose own vote (not a random one, unless the table rule says so) went to an eliminated Sporeling holder loses.
7. Oxpecker: its holder wins if the seat it bonded to is a winner after step 6 (and the Elderbark was not eliminated); the curse then applies to it too.
After the game, room_view's "result" says for every seat the card dealt, the card held at the end, the team ended on, whether they won and why.

Deciding your night action (tool night_planStep)
- Call room_view: "yourNightSteps" lists each step, its legal choices, and whether it is decided. "night.yourTurn" counts down to your turn.
- Decide BEFORE your turn if you can (during Dusk): the plan then plays by itself when your turn comes. If you decide during your own turn it happens at once. A step still undecided when your turn ends gets a RANDOM legal move.
- Unconditional: { "step": "<id>", "plan": { "branches": [], "otherwise": <decision> } }
- A decision is { "kind": "pick", "targets": [<slot>, ...] } with exactly "targetsNeeded" slots copied from "legalTargets" (add "role": "<id>" from "legalRoles" at a step that also names a role), or { "kind": "name", "role": "<id>" } at a step that only names a role, or { "kind": "do" }, or { "kind": "skip" }. A slot is { "k": "p", "i": <seat> } for a player or { "k": "c", "i": <index from 0> } for a centre card ("centre card 1" is index 0).
- Conditional: a step that says "canBranchOn" may depend on the card you will see at the earlier step:
  { "step": "trade", "plan": { "branches": [ { "roles": ["werewolf", "tracker"], "decision": { "kind": "skip" } } ], "otherwise": { "kind": "do" } } }
  The first branch whose roles include the card you saw applies; "otherwise" covers every other card. Role ids are in table.deck.
- After your turn, "learned" lists what you did and saw, which branch of your plan applied, and any queued step that turned out not to happen (and why).

Day
- chat_send posts to the whole table. Claims can be lies. Name players with seat numbers ("Bo (seat 1)").
- day_vote casts or changes your vote: { "seat": <number> }, not your own. The day ends as soon as every human has voted, so vote only when you have said what you want to say.
- The player dealt the Moon-Thief may queue a swap: day_queueSwap { "a": <seat>, "b": <seat> }.

Waiting and reading
- room_wait { "version": <latest>, "until": "any" | "phase" | "chat" | "turn" } returns when that kind of thing changes (or after "seconds"). Loop on it until "changed" is true, then call room_view.
- room_view { "compact": true, "chatSince": <chatCount you last saw> } returns only what is new in the chat and leaves out the deck, rules and timetable.
- A tool that cannot be used right now answers with the reason.`;

export const rules = internalQuery({
  args: { player: v.id("players"), code: v.string() },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player as Id<"players"> }, a.code);
    if (!scope) return null;
    const game = scope.room.game as Game | undefined;
    const deck = game ? shapeOf(game.state).deck! : scope.room.settings.deck;
    const rules = game ? game.state.rules : rulesOf(scope.room.settings.rules);
    const nightOrder = [...new Set(deck)].filter(r => ROLE[r].wake !== undefined).sort((x, y) => ROLE[x].wake! - ROLE[y].wake!);
    return {
      rules: RULES,
      thisTable: {
        players: scope.players.length, centreCards: game ? game.state.center.length : scope.room.settings.centerCount,
        nightOrder: ["Dusk", ...nightOrder.map(r => ROLE[r].name), "Dawn"],
        playtest: scope.room.playtest ? "This is a play-test table: its host may fix the deal and sees every card." : null,
        ruleSettings: describeRules(rules).map(r => ({ rule: r.rule, title: r.title, value: r.value, isDefault: r.isDefault, means: r.means })),
        caveats: caveats(deck),
      },
      rolesInThisDeck: [...new Set(deck)].map(id => ({ ...roleCard(id), copies: deck.filter(x => x === id).length, actsAtNight: ROLE[id].wake !== undefined })),
    };
  },
});
