/**
 * What an assistant reads. The same secrecy as the app's view (convex/rooms.ts): it is built from the same scope and
 * shows one player only what that player may see, but as labelled data a model can act on without the screen, with the
 * legal choices for each open step spelled out. Every top-level key is always present; a key that does not apply in
 * this phase is null. Times are computed against `now`, passed in by the HTTP action (a query's own clock would be
 * cached), and given both as absolute end times and as seconds left.
 */
import { v } from "convex/values";
import { internalQuery, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { actingRole, copierOptions, freshProgress, isAuto, isPhoenix, legalTargets, publicMarks, seededRng, shapeOf, shuffle, turnKey, visibleShown, type Progress, type StepPlan } from "../shared/engine";
import { aRole, condSource, legalRoles, pickCount, ROLE, ROLES, TEAM_NAME, type RoleId, type Slot } from "../shared/roles";
import { describeRules, rulesOf } from "../shared/settings";
import { cardOf, describe, revealHidden, seatName, voteLine, type Names } from "../shared/text";
import type { Game } from "./game";
import { liveness, ONLINE_TIMEOUT_MS } from "./presence";
import { redact, sealNote } from "./rooms";
import { loadScope, type Scope } from "./scope";

const secs = (ms: number) => Math.max(0, Math.round(ms / 1000));
/** The label every text uses for a slot ("centre card 1" for { k: "c", i: 0 }), shown beside every slot argument. */
const slotLabelOf = (s: Slot) => (s.k === "c" ? `centre card ${s.i + 1}` : `seat ${s.i}`);
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
    const seal = m.seal ?? (m.mark === "signed" ? "signet" : null);
    // Unsigned and sealed messages carry no name or seat until the game ends (a seal names a role, never a player).
    const hidden = (m.mark === "unsigned" || !!seal) && !(ended && m.round === scope.room.round);
    const seat = hidden || !game ? null : (i => (i >= 0 ? i : null))(game.seats.indexOf(m.player));
    return [{
      n,
      from: hidden ? (seal ? `sealed: the ${ROLE[seal]?.name ?? seal}` : "(unsigned)") : seat === null ? m.name : `${m.name} (seat ${seat})`,
      seat,
      ...(hidden && seal && m.player === scope.me?._id ? { yours: true } : {}),
      phase: m.phase,
      text: m.text,
      ...(seal ? { sealed: sealNote(seal) } : {}),
      ...(ended && m.forged ? { FORGED: "This seal was forged by a Counterfeiter." } : {}),
      ...(m.mark === "unsigned" ? { unsigned: "Sent anonymously: the sender's name is withheld until the game ends." } : {}),
    }];
  });
}

// ───────────── versions ─────────────

/**
 * The version is a list of named parts, so room_wait can wait for one kind of change (shared/commands.ts
 * `versionKey`). It does not include the clock or other players' night turns: only what this viewer can see change.
 */
function versionParts(scope: Scope, chatCount: number): Record<string, string | number> {
  const { room, seat, players } = scope;
  const g = room.game as Game | undefined;
  const mine = g && seat >= 0 ? turnKey(g.state.dealt[seat]) : null;
  // Your own night turn: before it, during it, after it (or none).
  const turn = !g || room.phase !== "night" || !mine ? "-" : (i => (i < 0 ? "-" : g.turn < i ? "before" : g.turn === i ? "now" : "after"))(g.turns.findIndex(t => t.role === mine));
  const settings = JSON.stringify([room.settings.deck, room.settings.centerCount, room.settings.rules ?? {}, room.settings.duskSeconds, room.settings.turnSeconds, room.settings.daySeconds, room.settings.voteSeconds, !!room.settings.fixedDeal, room.host]);
  let h = 0;
  for (const c of settings + players.map(p => p.name).join("|")) h = (h * 31 + c.charCodeAt(0)) | 0;
  return {
    r: room.round, ph: room.phase, t: turn, c: chatCount,
    v: `${g?.votes.filter(x => x !== null).length ?? 0}-${g?.ready?.filter(Boolean).length ?? 0}`,
    j: g && seat >= 0 ? g.log.filter(e => e.seat === seat).length + Object.keys(g.plans[seat] ?? {}).length : 0,
    s: (h >>> 0).toString(36), d: g ? visibleShown(g.state).length : 0, w: g?.daySwap && g.daySwap.by === seat ? `${g.daySwap.a}-${g.daySwap.b}` : "-",
  };
}
const encode = (p: Record<string, string | number>) => Object.entries(p).map(([k, x]) => `${k}${x}`).join(".");
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

const has = (deck: RoleId[], pred: (r: RoleId) => boolean) => deck.some(pred);
/** What a deck means for anything a player sees or hears: one warning per mechanic in it. */
export function caveats(deck: RoleId[]): string[] {
  const out: string[] = [];
  const any = (...ids: RoleId[]) => ids.some(id => deck.includes(id));
  const movers = deck.filter(r => ROLE[r]?.steps?.some(s => s.effects.some(e => e.kind === "swap" || e.kind === "rotate")) || ROLE[r]?.dayPower === "swap");
  if (movers.length) out.push(`Cards move in this deck (${[...new Set(movers)].map(r => ROLE[r].name).join(", ")}): your own card may have been moved without your knowing, and a moved card takes its team with it. Every look shows a card as it was at that moment.`);
  const dups = [...new Set(deck)].filter(r => deck.filter(x => x === r).length > 1);
  if (dups.length) out.push(`Several copies of ${dups.map(r => ROLE[r].name).join(", ")}: two honest players can hold the same role and act in the same turn.`);
  const twins = [...new Set(deck)].filter(r => ROLE[r]?.twinOf);
  if (twins.length) out.push(`Shadow twins in this deck: ${twins.map(r => `${ROLE[r].name} (acts in the ${ROLE[ROLE[r].twinOf!].name}'s turn, on the Werewolf team${ROLE[r].looksAs ? `, looks like a ${ROLE[ROLE[r].looksAs!].name}` : ""})`).join("; ")}. A true description of a role's night does not prove its team.`);
  if (has(deck, r => ROLE[r]?.steps?.some(s => s.effects.some(e => e.kind === "distort")) ?? false)) out.push("Distortion is in this deck (Glamour, Will-o'-Wisp, Mistweaver, Fogbank): a look may have shown a wrong role, and its viewer is never told. Werewolf-team looks and the Herder's count see the truth.");
  if (any("forger")) out.push("A Forger is in this deck: one proclamation at dawn may be forged, and it looks exactly like the Herald's.");
  if (any("counterfeiter") || any("falsewitness")) out.push("A seal forger (Counterfeiter, False Witness) is in this deck: any sealed message (Signet, Notary) may be forged, identical to a real one until the game ends. Seals name a role, never a player.");
  if (any("eavesdropper")) out.push("An Eavesdropper is in this deck: a Werewolf may hold an exact copy of one role's true night results, so two players can make the same true claim.");
  if (any("biter")) out.push("A Biter is in this deck: a player may have been bitten onto the Werewolf team. They keep their true night results and may know a wolf's seat.");
  if (any("stalkinghorse")) out.push("A Stalking Horse is in this deck: it wakes with the pack and knows what they know. If whoever holds it is eliminated, the Werewolf team wins, even if a Werewolf falls too.");
  if (any("moonthief")) out.push("A Moon-Thief is in this deck: a Werewolf of the pack (its vote-lock swap exists only under the table's day-swap rule, off by default).");
  if (any("hush")) out.push("A Hush is in this deck: once, it can cut one player off for a while, exactly as if their connection dropped. A player going offline may be a real drop or a cut; only the results say.");
  if (has(deck, r => ROLE[r]?.team === "pyre")) out.push(`The Pyre is in this deck: its Kindlers win when a player holding a Phoenix is eliminated, and know where the Phoenix was dealt. A player eager to be voted out, or pushing hard on one seat, may be Pyre.${any("lure") ? " A Lure may have dressed a card (the Phoenix?) as another role tonight." : ""}${any("falsewitness") ? " A False Witness may post a forged seal." : ""}${any("embercarrier") ? " An Ember-Carrier blindly swapped two players' cards in the brood's turn: the Phoenix may have moved to someone who does not know." : ""}${any("heavyhand") ? " A Heavy Hand's vote counts double." : ""}${any("heir") ? " If no player holds a Phoenix at dawn, an Heir's card becomes one." : ""}`);
  if (any("gleaner", "echo")) out.push("A copier is in this deck (Gleaner: from the centre; Echo: from a player): it may have become any role, with that role's team and powers, and acts in that role's turn. Two players can truthfully claim the same role. A look at a copier's card shows Gleaner or Echo.");
  if (any("cuckoo")) out.push("A Cuckoo is in this deck: whoever holds it wins if the egged seat is eliminated and they are not. Pressure on the egged seat may come from them.");
  if (any("oxpecker")) out.push("An Oxpecker is in this deck: whoever holds it wins exactly when the seat it bonded to wins, whatever side that is.");
  return out;
}

/** Which cards count as Werewolves at the count, and which Werewolf-team cards do not: generated from the roster. */
export function werewolfCensus(deck?: RoleId[]): string {
  const ids = deck ? [...new Set(deck)] : ROLES.map(r => r.id);
  const wolves = ids.filter(r => ROLE[r]?.tags.includes("wolf")).map(r => ROLE[r].name);
  const allies = ids.filter(r => ROLE[r]?.team === "werewolf" && !ROLE[r].tags.includes("wolf")).map(r => ROLE[r].name);
  return `Count as Werewolves (for elimination and for the Herder's count): ${wolves.join(", ") || "none"}. On the Werewolf team but NOT Werewolves (eliminating them never wins for the Centaurs): ${allies.join(", ") || "none"}.`;
}

// ───────────── the view ─────────────

export const view = internalQuery({
  args: { player: v.id("players"), code: v.string(), now: v.number(), compact: v.optional(v.boolean()), chatSince: v.optional(v.number()) },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player }, a.code);
    if (!scope || !scope.me) return null;
    const { room, players, me, seat } = scope;
    const game = room.game as Game | undefined;
    const now = a.now;
    const names: Names = { players: game ? game.seats.map(id => ({ name: players.find(p => p._id === id)?.name ?? "(left)" })) : players.map(p => ({ name: p.name })) };
    const who = (i: number) => seatName(i, names);
    const slotName = (s: Slot) => (s.k === "c" ? `centre card ${s.i + 1} (index ${s.i})` : who(s.i));
    const rows = await chatRows(ctx, scope);
    const rules = game ? game.state.rules : rulesOf(room.settings.rules);
    const deckIds = game ? shapeOf(game.state).deck! : room.settings.deck;
    const deck = [...new Set(deckIds)].map(id => ({ role: ROLE[id].name, id, team: TEAM_NAME[ROLE[id].team], copies: deckIds.filter(x => x === id).length, ...(ROLE[id].twinOf ? { actsInTurnOf: ROLE[ROLE[id].twinOf!].name } : {}) }));
    const ended = room.phase === "ended";
    const mine = game && seat >= 0 ? game.state.dealt[seat] : null;
    const myBite = game?.state.dawn ? game.state.bitten.find(b => b.seat === seat) : undefined;
    const heirMe = !!game && game.log.some(e => e.seat === seat && e.ev.kind === "heir");
    const timer = (endsAt: number | undefined) => (endsAt === undefined ? null : { endsAt, secondsLeft: secs(endsAt - now) });

    const out: Record<string, unknown> = {
      version: encode(versionParts(scope, rows.length)),
      serverNow: now,
      room: room.code,
      phase: room.phase,
      playtest: room.playtest ? "This is a play-test table: its host may fix the deal and sees every card." : null,
      you: {
        name: me.name, seat: seat >= 0 ? seat : null, host: room.host === me._id,
        watching: game && seat < 0 ? "This round began before you sat down." : null,
        dealt: mine ? roleCard(mine) : null,
        status: !mine ? null : myBite
          ? { bitten: { by: rules.biteNamesBiter ? who(myBite.by) : "(not told)" }, winsBy: "You were bitten: you now win only with the Werewolf team. You are not a Werewolf and have no creature rules." }
          : heirMe ? { heir: true, winsBy: "No player held a Phoenix at dawn, so the Heir's card you hold became a Phoenix: if you are eliminated, the Pyre wins." }
          : { winsBy: "By the card you HOLD when the votes are counted (it may have been moved since you were dealt it): its team, or its own rule." },
      },
      players: game
        ? game.seats.map((id, i) => { const p = players.find(x => x._id === id); return { seat: i, name: names.players[i].name, label: who(i), you: i === seat, host: room.host === id, bot: p?.bot ?? false, connection: liveness(p, now), ready: room.phase === "day" ? !!game.ready?.[i] : null, voted: room.phase === "vote" ? game.votes[i] !== null : null }; })
        : players.map(p => ({ seat: null, name: p.name, label: p.name, you: p._id === me._id, host: room.host === p._id, bot: p.bot, connection: liveness(p, now), ready: null, voted: null })),
      connectionNote: `A player shows "offline" after ${Math.round(ONLINE_TIMEOUT_MS / 1000)} s without a heartbeat (the app sends one every few seconds; every MCP call counts). An offline player cannot chat, get ready or vote until they are back.`,
      seating: game ? "Seats are in clockwise order, counted from 0: the player clockwise of seat N is seat N+1, wrapping to seat 0." : "Seats are assigned at random when the game starts.",
      table: a.compact ? null : {
        centreCards: game ? game.state.center.length : room.settings.centerCount, deck, deckSize: deckIds.length,
        timersSeconds: { dusk: room.settings.duskSeconds, eachNightTurn: room.settings.turnSeconds, discussion: room.settings.daySeconds, vote: room.settings.voteSeconds ?? 20 },
        rules: describeRules(rules).map(r => ({ rule: r.rule, title: r.title, value: r.value, means: r.means })),
        werewolves: werewolfCensus(deckIds),
        caveats: caveats(deckIds),
      },
      learned: null, yourNightSteps: null, copier: null, night: null, proclamations: null, marks: null, day: null, vote: null, result: null,
      chat: chat(scope, rows, a.chatSince ?? 0),
      chatCount: rows.length,
      chatOpen: room.phase === "lobby" || room.phase === "day" || room.phase === "ended" || (room.phase === "vote" && rules.chatDuringVote),
    };
    if (!game) return out;

    if (seat >= 0) {
      const role = ROLE[mine!], progress = game.progress[seat], shape = shapeOf(game.state);
      out.learned = game.log.filter(e => e.seat === seat).map(e => describe(ended ? e : redact(e), names, seat) + (ended ? revealHidden(e, names) : ""));
      if (room.phase === "night") {
        // Interchangeable targets (centre cards) are listed in an order of this viewer's own, so no position is a default.
        const order = seededRng((game.dealSeed ?? 0) ^ (seat * 7919 + 1));
        const render = (role: typeof ROLE[string], progress: Progress, plans: Record<string, StepPlan>, as?: RoleId) => (role.steps ?? []).map((step, i) => {
          const done = progress.done || i < progress.step;
          if (done) return { step: step.id, title: step.title, status: "done", ...(as ? { as } : {}) };
          if (isAuto(step)) return { step: step.id, title: step.title, status: "automatic: happens by itself on your turn", ...(as ? { as } : {}) };
          const src = condSource(role, step.id), seen = src ? progress.seen[src.id] : undefined;
          const plan = plans[step.id] as StepPlan | undefined;
          const raw = legalTargets(step, seat, shape), roles = legalRoles(step, shape.deck!, role.id);
          const targets = [...raw.filter(t => t.k === "p"), ...shuffle(raw.filter(t => t.k === "c"), order)];
          const optional = step.optional && !shape.mandatory;
          const decisionFor = (n: number) => (step.pick ? { kind: "pick", targets: targets.slice(n, n + pickCount(step, shape)), ...(step.names ? { role: roles[0] } : {}) } : step.names ? { kind: "name", role: roles[0] } : { kind: "do" });
          const possible = [...new Set(shape.deck!)];
          return {
            step: step.id, title: step.title, ...(as ? { as, plansWith: `night_planStep { "step": "${step.id}", "as": "${as}", "plan": ... }` } : {}),
            status: plan ? "queued (you can still change it until it happens)" : "NOT DECIDED: a random move is made for you if this is still undecided when your turn ends",
            note: step.onlyIfAlone ? "Only happens if no other player was dealt a card of the pack; if it does not happen, you are told." : null,
            choices: [
              ...(step.pick ? [{ kind: "pick", targetsNeeded: pickCount(step, shape), legalTargets: targets.map(t => ({ slot: t, label: slotLabelOf(t), is: t.k === "p" && t.i === seat ? "your own card" : slotName(t) })), ...(step.names ? { alsoName: "a role from legalRoles, as \"role\"" } : {}) }] : step.names ? [{ kind: "name", means: "name a role from legalRoles, as \"role\"" }] : [{ kind: "do", means: step.doLabel ?? "Do it" }]),
              ...(optional ? [{ kind: "skip", means: step.skipLabel ?? "Skip" }] : []),
            ],
            mandatory: !optional,
            legalRoles: step.names ? roles.map(r => ({ id: r, name: ROLE[r].name })) : null,
            ...(src ? (seen ? { youSaw: seen.map(r => ROLE[r].name) } : {
              canBranchOn: `what you will see at step "${src.id}"`, possibleCards: possible,
              exampleConditionalPlan: { step: step.id, ...(as ? { as } : {}), plan: { branches: [{ roles: possible.filter(r => ROLE[r].team === "werewolf"), decision: optional ? { kind: "skip" } : decisionFor(1) }], otherwise: decisionFor(0) } },
            }) : {}),
            queuedPlan: plan ?? null,
          };
        });
        out.yourNightSteps = render(role, progress, game.plans[seat]);
        // A copier: before copying, the steps of every role it may become (plan them with "as"); after, its copy's steps.
        if (role.steps?.some(st => st.effects.some(e => e.kind === "adopt"))) {
          const became = game.state.adopted[String(seat)];
          const plans = game.adoptPlans?.[seat] ?? {};
          if (became) {
            (out.yourNightSteps as unknown[]).push(...render(ROLE[became], game.adoptProgress?.[seat] ?? freshProgress(), plans[became] ?? {}, became));
            out.copier = { became: ROLE[became].name, note: `You are now a copy of the ${ROLE[became].name}. Its steps (marked "as") run in its own turn.` };
          } else {
            // Every role in the DECK, never the actual deal: listing the dealt centre would tell a Gleaner what lies there.
            const mayBecome = copierOptions(shape.deck!, role.id);
            out.copier = {
              became: null,
              note: "You may queue, for each role you might become, what that role will do: night_planStep with \"as\": <role id>. Undecided steps of the role you become are asked live in its turn, else random.",
              stepsIfYouBecome: Object.fromEntries(mayBecome.filter(r => ROLE[r]?.steps?.some(st => !isAuto(st))).map(r => [r, render(ROLE[r], freshProgress(), plans[r] ?? {}, r)])),
            };
          }
        }
      }
    }

    out.proclamations = visibleShown(game.state).map(s => ({
      cards: s.slots.map(x => cardOf(x, names, -1)), atLeastOneIs: ROLE[s.role].name,
      says: `At least one of ${s.slots.map(x => cardOf(x, names, -1)).join(" and ")} is ${aRole(s.role)}.`,
      madeDuring: s.atDawn ? `${ROLE[s.by]?.name ?? s.by}'s turn` : game.turns[s.turn]?.role ? `${ROLE[game.turns[s.turn].role!].name}'s turn` : "Dusk",
      ...(ended && s.forged ? { FORGED: "This proclamation was the Forger's." } : {}),
      note: "Not proof: a Forger's proclamation looks exactly the same (this deck has one, possibly in the centre). A real one was true at that moment of the night as its maker saw it (distortion applies); later turns may have moved the cards.",
    }));
    out.marks = game.state.dawn ? publicMarks(game.state).map(m => ({ what: m.label, on: who(m.seat), seat: m.seat, note: m.role === "cuckoo" ? "Whoever holds this Cuckoo card when the votes are counted wins if this seat is eliminated and they are not." : null })) : null;

    if (room.phase === "night") {
      const turn = game.turns[game.turn];
      const yours = mine ? game.turns.findIndex(t => t.role === turnKey(mine)) : -1;
      out.night = {
        now: turn ? { turn: game.turn, role: turn.role ? ROLE[turn.role].name : "Dusk (everyone reads their card and may queue their move)", ...timer(turn.endsAt) } : null,
        yourTurn: yours < 0 ? { state: "none", note: "Your dealt card does not act at night." } : yours > game.turn ? { state: "upcoming", turn: yours, startsAt: game.turns[yours].startsAt, startsInSeconds: secs(game.turns[yours].startsAt - now), endsAt: game.turns[yours].endsAt } : yours === game.turn ? { state: "NOW", ...timer(game.turns[yours].endsAt) } : { state: "over" },
        timetable: a.compact ? null : game.turns.map((t, i) => ({ turn: i, role: t.role ? ROLE[t.role].name : "Dusk", startsAt: t.startsAt, state: i < game.turn ? "over" : i === game.turn ? "NOW" : `starts in ${secs(t.startsAt - now)}s`, yours: !!mine && t.role === turnKey(mine) })),
        dayStarts: timer(game.turns[game.turns.length - 1].endsAt),
        note: "Every role in the deck gets a turn of the same length whether or not anyone holds it; a twin acts in its original's turn. Chat is closed until day. Proclamations and the egg are published at dawn.",
      };
    }
    const actingOf = (i: number) => actingRole(game.state, i);
    const dayPower = mine && !game.powerUsed?.[seat] ? ROLE[actingOf(seat)].dayPower : undefined;
    const swapInfo = mine && ROLE[actingOf(seat)].dayPower === "swap" && rules.daySwap ? (game.daySwap?.by === seat ? { a: who(game.daySwap.a), b: who(game.daySwap.b), note: "Made the instant the vote phase ends. Change it with day_queueSwap, cancel with day_clearSwap." } : { none: "You may queue a swap with day_queueSwap { a, b } (two other players' seats)." }) : null;
    if (room.phase === "day") {
      const op = game.opening && !game.opening.done ? game.opening : null;
      out.day = {
        opening: op ? {
          ...timer(op.until),
          yourStatement: seat >= 0 ? op.statements[seat]?.text ?? null : null,
          note: seat >= 0 && op.statements[seat] ? "Your opening statement is in. All statements are revealed together, in seat order, once every player has posted or the window ends; then free chat opens. Nobody can see who has posted." : "OPENING STATEMENTS: post exactly ONE message now with chat_send (your claim). It is held unseen and revealed together with everyone's, in seat order, when all are in or the window ends. Free chat, day_ready and sealed messages open after the reveal.",
        } : null,
        discussionEnds: timer(game.dayEndsAt),
        ready: game.seats.flatMap((_, i) => (game.ready?.[i] ? [who(i)] : [])),
        notReady: game.seats.flatMap((_, i) => (!game.ready?.[i] ? [who(i)] : [])),
        youAreReady: seat >= 0 ? !!game.ready?.[seat] : null,
        yourSwap: swapInfo,
        yourCut: dayPower === "cut" ? `You may cut one player off for ${rules.cutSeconds} s with day_cutLine { "seat": n } (once).` : null,
        warning: deckIds.includes("sporeling") ? "If you vote for whoever holds the Sporeling and they are eliminated, you lose." : null,
        note: `Discussion. Voting is NOT open yet. The vote phase (${room.settings.voteSeconds ?? 20} s) starts when this timer runs out, when the host ends the discussion, or as soon as every seated human is ready (day_ready { "ready": true }).`,
      };
    }
    if (room.phase === "vote") {
      out.vote = {
        ends: timer(game.voteEndsAt),
        yourVote: seat >= 0 && game.votes[seat] !== null ? { seat: game.votes[seat], name: who(game.votes[seat]!) } : null,
        haveVoted: game.votes.flatMap((x, i) => (x !== null ? [who(i)] : [])),
        notYetVoted: game.votes.flatMap((x, i) => (x === null ? [who(i)] : [])),
        yourSwap: swapInfo,
        yourCut: dayPower === "cut" && rules.cutDuringVote ? `You may still cut one player off with day_cutLine { "seat": n } (once).` : null,
        warning: deckIds.includes("sporeling") ? "If you vote for whoever holds the Sporeling and they are eliminated, you lose." : null,
        note: `Vote now with day_vote { "seat": n } (anyone but yourself); you may change it until the phase ends. It ends when the timer runs out or once every seated human has voted. Anyone who has not voted then gets a random vote, marked as such in the results. Chat is ${rules.chatDuringVote ? "open" : "closed"} during the vote.`,
      };
    }
    if (ended && game.outcome) {
      const o = game.outcome, s = game.state;
      out.result = {
        headline: o.headline, notes: o.notes, winningTeam: o.winningTeam, pyreWon: o.burned,
        youWon: seat >= 0 ? o.winners.includes(seat) : null,
        why: seat >= 0 ? o.why[seat] : null,
        eliminated: o.deaths.map(who),
        bloodPrice: { werewolvesEliminated: o.wolvesDown, centaursEliminated: o.centaursDown, ruleOn: s.rules.bloodPrice },
        seats: game.seats.map((_, i) => ({
          seat: i, name: names.players[i].name, dealt: ROLE[s.dealt[i]].name, endedHolding: ROLE[s.cards[i]].name, endedOnTeam: TEAM_NAME[o.teams[i]],
          won: o.winners.includes(i), why: o.why[i],
          votedFor: who(game.votes[i]!), voteWasRandom: game.forcedVotes.includes(i), votesReceived: o.tally[i], eliminated: o.deaths.includes(i),
          became: s.adopted[String(i)] ? ROLE[s.adopted[String(i)]].name : null,
          endedHoldingCopyOf: s.adopted[String(s.inst[i])] ? ROLE[s.adopted[String(s.inst[i])]].name : null,
          heldPhoenix: isPhoenix(s, s.inst[i]),
          summary: `dealt ${ROLE[s.dealt[i]].name}${s.adopted[String(i)] ? `, became ${ROLE[s.adopted[String(i)]].name}` : ""}, ended holding ${ROLE[s.cards[i]].name}${s.adopted[String(s.inst[i])] ? ` (a copy of ${ROLE[s.adopted[String(s.inst[i])]].name})` : ""}, on the ${TEAM_NAME[o.teams[i]]}: ${o.why[i]}`,
          bitten: s.bitten.some(b => b.seat === i),
          cutOff: (game.seatEffects ?? []).filter(e => e.seat === i).map(e => ({ by: who(e.by), forSeconds: Math.round((e.until - e.from) / 1000), at: e.from })),
        })),
        votes: game.seats.map((_, i) => voteLine(i, game.votes[i]!, game.forcedVotes.includes(i), names)),
        centre: s.center.map(r => ROLE[r].name),
        dealtCentre: s.dealtCenter.map(r => ROLE[r].name),
        marks: Object.entries(s.marks).map(([inst, i]) => ({ card: ROLE[s.instRole[Number(inst)]]?.name ?? inst, seat: i, on: who(i) })),
        daySwap: game.daySwap ? { by: who(game.daySwap.by), swapped: [who(game.daySwap.a), who(game.daySwap.b)] } : null,
        dealSeed: game.dealSeed ?? null,
        heldInstances: { seats: s.inst, centre: s.cinst, note: "The physical card each seat (and centre slot) holds at the end: instance i < players was dealt to seat i, instance players + n to centre card n + 1." },
        scenario: { fingerprint: game.fingerprint ?? null, dealSeed: game.dealSeed ?? null, nightSeed: game.nightSeed ?? null, dealt: s.dealt.map(r => ROLE[r].name), dealtCentre: s.dealtCenter.map(r => ROLE[r].name), note: "Runs with the same fingerprint had the same deal, night seed and night (every action and result): only the day differed." },
        nightLog: game.log.map(e => `[${e.turn >= game.turns.length ? (e.step === "day" ? "Day" : "Dawn") : game.turns[e.turn]?.role ? ROLE[game.turns[e.turn].role!].name : "Dusk"}] ${describe(e, names, -1)}${revealHidden(e, names)}${e.via === "forced" ? " (random: out of time)" : ""}`),
      };
    }
    return out;
  },
});

export const RULES = `CENTAUR WEREWOLF: how to play

One night, one day of discussion, one vote.
- Each player is dealt one card face down; extra cards lie face down in the centre. You know only your own card.
- NIGHT. It begins with Dusk (read your card), then every role in the deck that acts at night gets one turn, in a fixed order, each exactly the same length, whether a player holds that card or it lies in the centre. Everyone sees which turn it is. You act on the turn of the card you were DEALT. A shadow twin acts in its original's turn (one public turn for both). A deck may hold several copies of a card; all their holders act in the same turn.
- DAWN. Proclamations (and, with a Cuckoo, the egg) are published; a bitten player, or an Heir whose card became a Phoenix, is told privately.
- DISCUSSION. With the "Opening statements" rule, it opens with one held message from each player, all revealed together in seat order; then free chat. Everyone talks in chat. Voting is not open yet. It ends when its timer runs out, when the host ends it, or as soon as every seated human is ready (day_ready { "ready": true }); everyone sees who is ready.
- VOTE. A separate timed phase (20 s by default). Vote for one other player with day_vote { "seat": n }; you may change it until the phase ends. It ends when its timer runs out or once every seated human has voted. A player who has not voted then gets a uniformly random vote (anyone but themselves), marked "did not vote in time: voted at random" in the results. Chat is closed during the vote unless the table rule opens it.
- COUNT. All players tied on the most votes are eliminated (every one of them), if that is at least the table's "Votes to eliminate" (2 by default); otherwise nobody is. A Moon-Thief's queued swap happens the instant the vote phase ends, before anything is counted.

Cards, looks and what you know
- A look shows a card AS IT IS AT THAT MOMENT. Later turns may move it.
- Night actions can move cards. Your own card may be swapped away without you knowing. A moved card takes its team with it: the card you HOLD when the votes are counted decides your team (unless you were bitten or became an Imago). Several roles MUST swap (Cutpurse, Pickpocket, Drifter, Poacher, Latecomer); with the "Mandatory night steps" rule, every optional step must be done too.
- Distortion: Glamour (a chosen role on a card) and Will-o'-Wisp (a random wrong role on a card) make every look at that card show a wrong role until dawn, wherever the card moves; Mistweaver (a chosen role) and Fogbank (random) make every centre card ONE player looks at tonight show a wrong role. The victim is never told. A distorted look also distorts what a proclamation publishes and what a conditional plan branches on (it branches on what you SAW). The Werewolf team's own looks and the Herder's count always see the truth. The latest distortion of a card wins; a veil on the viewer is applied last. The results show both what was seen and what was true.
- Twins: Moonsage, Pale Herald and Stray Herder show as their original to every look; Dun Centaur and Dusk Rustler show as themselves.
- Copiers: the Gleaner (from a centre card) and the Echo (from a player) wake first and become a copy of the card's TRUE identity (never a distortion): its team, Werewolf or not, win rule, powers and night action, performed in that role's own turn. A copier can queue, for each role it might become, what that role will do (night_planStep with "as"). The pack does not learn about a copier that became a Werewolf. A look at a copier's card shows its own face; if the card moves, its new holder holds the copy.
- The Pyre: the Phoenix wants to be eliminated; Kindlers (Kindler, Lure, False Witness, Ember-Carrier, Heavy Hand, Heir) share an early turn, "The brood gathers", learning where the Phoenix was DEALT and who the other Kindlers were dealt to, and win when a Phoenix holder is eliminated. The Phoenix does not know the Kindlers unless the table rule says so.
- Evidence: the game never publishes a plain confirmation. What it vouches for in public is indirect, ambiguous and fakeable, and the deck always holds a card that could have faked it (possibly in the centre).
- Proclamations (Herald, Pale Herald) say "at least one of these two centre cards is a <role>" (the role one of the two showed, chosen at random), at dawn, anonymous. A deck with a Herald always holds a Forger, whose forged proclamations look exactly the same.
- Seals: a sealed message is signed by a role only, "sealed: the Signet" / "sealed: the Notary": no name, no seat, until the game ends (the poster sees "yours"). Signet: free text. Notary: a report composed by the game from its night look at two players, "at least one of <A>'s and <B>'s cards was a <role>". A deck with a Signet or Notary always holds a seal forger (Counterfeiter, False Witness), whose seals look exactly the same.
- Connections: a player goes offline after a short time without a heartbeat and comes back when they reconnect. With a Hush in the deck, a drop may be a deliberate cut; nothing tells the two apart until the results. Nothing typed while cut off is delivered later; a vote not cast in time is random.
- What "blind" roles do not learn: the Spooker, Pickpocket and Latecomer see none of the cards they move or take; the Sentry learns only WHETHER nearby cards moved, not what they are; the Herder learns only HOW MANY Werewolf cards lie in the centre, not which; the Whisperer is told one Werewolf's seat, and that Werewolf does not know the Whisperer; the census tells the pack which roles were dealt to the centre, not where; the Elderbark learns which seats were DEALT creatures, not what they hold now; a bitten player is not told what the Biter holds.

How the game is decided (in this order)
1. Swap: the Moon-Thief's queued swap, only if the table's day-swap rule is on (off by default).
2. Tally: votes, weighted by the card each voter holds (Chiron and Heavy Hand count twice). Every seat tied on the most votes is eliminated, if that is enough votes.
3. Teams: a bitten seat is on the Werewolf team; everyone else is on the team of the card they hold (a copier's card: the team of what it copied).
4. Main result (Centaurs v. Werewolves):
   a. If an eliminated player holds a Stalking Horse, the Werewolf team wins.
   b. If no player holds a Werewolf card: the Centaurs win if nobody is eliminated; if someone is, the SURVIVING Werewolf-team players win (if there are none, no main team wins).
   c. Otherwise, with the Blood Price rule: the Centaurs win only if more Werewolf cards than Centaur-team players are eliminated (a Werewolf and a Centaur tied and eliminated is a Werewolf-team win). Without it: the Centaurs win if any Werewolf card is eliminated. If the Centaurs do not win, the Werewolf team does.
   Every member of the winning team wins, alive or dead. Eliminating a Werewolf-team card that is not a Werewolf never wins for the Centaurs. Pyre and loner cards count as neither Werewolves nor Centaurs.
   ${werewolfCensus()}
5. The burning: if a player holding a Phoenix card is eliminated (or, if no player holds one, under the table rule, if a Kindler is), the Pyre wins: every player holding a Pyre card, alive or dead. With the "A burning denies the wolves" rule (on by default): the Werewolf team cannot win (even by the Stalking Horse), and the Centaurs keep their win only if it came from 4c (a Werewolf eliminated, Blood Price as usual); otherwise no main team wins.
6. Loners win alongside: the Cuckoo holder wins if the seat its card's egg is on is eliminated and they are not; then the Oxpecker holder wins if the seat its card bonded to is a winner.
After the game, room_view's "result" says for every seat the card dealt, the card held at the end, the team ended on, whether they won and why, how they voted (and whether the vote was random), and any cut.

Deciding your night action (tool night_planStep)
- Call room_view: "yourNightSteps" lists each step, its legal choices, whether it is mandatory, and whether it is decided. "night.yourTurn" counts down to your turn.
- Decide BEFORE your turn if you can (during Dusk): the plan then plays by itself when your turn comes. If you decide during your own turn it happens at once. A step still undecided when your turn ends gets a uniformly RANDOM legal move.
- Unconditional: { "step": "<id>", "plan": { "branches": [], "otherwise": <decision> } }
- A decision is { "kind": "pick", "targets": [<slot>, ...] } with exactly "targetsNeeded" slots copied from "legalTargets" (add "role": "<id>" from "legalRoles" at a step that also names a role), or { "kind": "name", "role": "<id>" } at a step that only names a role, or { "kind": "do" }, or { "kind": "skip" } (optional steps only). A slot is { "k": "p", "i": <seat> } for a player or { "k": "c", "i": <index from 0> } for a centre card ("centre card 1" is index 0).
- Conditional: a step that says "canBranchOn" may depend on the card you will see at the earlier step; "exampleConditionalPlan" is a ready-to-edit example built from your legal choices:
  { "step": "trade", "plan": { "branches": [ { "roles": ["werewolf", "tracker"], "decision": { "kind": "skip" } } ], "otherwise": { "kind": "do" } } }
  The first branch whose roles include the card you saw applies; "otherwise" covers every other card. Role ids are in table.deck.
- After your turn, "learned" lists what you did and saw, which branch of your plan applied, and any queued step that turned out not to happen (and why).

Day
- chat_send posts to the whole table. Claims can be lies. Name players with seat numbers ("Bo (seat 1)").
- day_ready { "ready": true } says you are done talking. The vote opens when everyone is ready, or on the timer.
- day_vote { "seat": <number> } during the VOTE phase only.
- The player dealt the Moon-Thief may queue a swap during discussion or the vote: day_queueSwap { "a": <seat>, "b": <seat> }. The player dealt Hush may cut a player off once: day_cutLine { "seat": <seat> }. Signet, Notary and Counterfeiter post sealed messages (chat_sendSigned, chat_sendReport, chat_forgeSeal).

Waiting and reading
- room_wait { "version": <latest>, "until": "any" | "phase" | "chat" | "turn" } returns as soon as that kind of thing changes, or after a few seconds with "changed": false: then call it again. Every countdown in room_view has an absolute "endsAt" and "secondsLeft", computed against "serverNow".
- room_view { "compact": true, "chatSince": <chatCount you last saw> } returns only what is new in the chat and leaves out the deck, rules and timetable.
- A tool that cannot be used right now answers with the reason. If the server cannot be reached (HTTP 503), your connection has dropped: wait and try again.`;

export const rules = internalQuery({
  args: { player: v.id("players"), code: v.string() },
  handler: async (ctx, a) => {
    const scope = await loadScope(ctx, { player: a.player as Id<"players"> }, a.code);
    if (!scope) return null;
    const game = scope.room.game as Game | undefined;
    const deck = game ? shapeOf(game.state).deck! : scope.room.settings.deck;
    const rules = game ? game.state.rules : rulesOf(scope.room.settings.rules);
    const nightOrder = [...new Set(deck.filter(r => ROLE[r].wake !== undefined && ROLE[r].steps).map(turnKey))].sort((x, y) => ROLE[x].wake! - ROLE[y].wake!);
    return {
      rules: RULES,
      thisTable: {
        players: scope.players.length, centreCards: game ? game.state.center.length : scope.room.settings.centerCount,
        nightOrder: ["Dusk", ...nightOrder.map(r => ROLE[r].name), "Dawn"],
        timersSeconds: { dusk: scope.room.settings.duskSeconds, eachNightTurn: scope.room.settings.turnSeconds, discussion: scope.room.settings.daySeconds, vote: scope.room.settings.voteSeconds ?? 20 },
        playtest: scope.room.playtest ? "This is a play-test table: its host may fix the deal and sees every card." : null,
        ruleSettings: describeRules(rules).map(r => ({ rule: r.rule, title: r.title, value: r.value, isDefault: r.isDefault, means: r.means })),
        werewolves: werewolfCensus(deck),
        caveats: caveats(deck),
      },
      rolesInThisDeck: [...new Set(deck)].map(id => ({ ...roleCard(id), copies: deck.filter(x => x === id).length, actsAtNight: ROLE[id].wake !== undefined, ...(ROLE[id].twinOf ? { actsInTurnOf: ROLE[ROLE[id].twinOf!].name } : {}) })),
    };
  },
});
