import { describe, expect, it } from "vitest";
import { availability, COMMAND, COMMANDS, grantAllows, HOME_CONTEXT, toolDefinitions } from "./commands";
import { advance, deal, deckProblem, freshProgress, legalTargets, nightTurns, randomDecision, resolvePlan, resolveVote, uncovered, validPlan, type GameState, type Plan, type StepPlan } from "./engine";
import { CENTER_MAX, CENTER_MIN, recommendedDeck, ROLE, ROLES, type Slot } from "./roles";

const rng = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const P = (i: number): Slot => ({ k: "p", i });
const C = (i: number): Slot => ({ k: "c", i });
const state = (dealt: string[], center: string[]): GameState => ({ dealt, cards: [...dealt], center, moved: [], shown: [], prophecy: {} });
const T = { players: 4, center: 3 };
const pick = (...targets: Slot[]) => ({ kind: "pick" as const, targets });
const always = (...targets: Slot[]): StepPlan => ({ branches: [], otherwise: pick(...targets) });

describe("deal", () => {
  it("deals every card once, the rest to the centre, for any centre size", () => {
    for (let c = CENTER_MIN; c <= CENTER_MAX; c++) {
      const deck = recommendedDeck(5, c);
      const s = deal(deck, 5, rng());
      expect(s.dealt).toHaveLength(5);
      expect(s.center).toHaveLength(c);
      expect([...s.dealt, ...s.center].sort()).toEqual([...deck].sort());
    }
  });
  it("gives every night role in the deck one turn, in wake order, dealt or not", () => {
    expect(nightTurns(["centaur", "sentry", "werewolf", "werewolf", "farrier", "sage", "chiron"])).toEqual(["werewolf", "sage", "centaur", "farrier", "sentry"]);
  });
  it("recommends a valid deck for 3 to 12 players and 3 to 6 centre cards", () => {
    for (let n = 3; n <= 12; n++) for (let c = CENTER_MIN; c <= CENTER_MAX; c++) expect(deckProblem(recommendedDeck(n, c), n, c), `${n}p ${c}c`).toBeNull();
  });
  it("explains a deck of the wrong size by players and centre cards", () => {
    expect(deckProblem(recommendedDeck(4, 3), 4, 5)).toMatch(/needs 9 cards: 4 players and 5 in the centre/);
  });
});

describe("plans", () => {
  const plan: StepPlan = { branches: [{ roles: ["werewolf", "whisperer"], decision: pick(P(0)) }], otherwise: pick(P(1)) };
  it("takes the first branch naming the seen card, else the otherwise decision", () => {
    expect(resolvePlan(plan, ["werewolf"])).toEqual(pick(P(0)));
    expect(resolvePlan(plan, ["centaur"])).toEqual(pick(P(1)));
    expect(resolvePlan({ branches: plan.branches }, ["centaur"])).toBeUndefined();
  });
  it("reports the outcomes a plan leaves open", () => {
    expect(uncovered({ branches: plan.branches }, ["werewolf", "centaur", "sage"])).toEqual(["centaur", "sage"]);
    expect(uncovered(plan, ["werewolf", "centaur"])).toEqual([]);
  });
  it("rejects illegal targets, wrong target counts and conditions on a step with nothing to see", () => {
    expect(validPlan(ROLE.sage, "read", 0, T, always(P(0)))).toMatch(/not allowed/);
    expect(validPlan(ROLE.sage, "read", 0, T, { branches: [{ roles: ["werewolf"], decision: pick(P(1)) }] })).toMatch(/conditional/);
    expect(validPlan(ROLE.farrier, "shoe", 0, T, plan)).toBeNull();
    expect(validPlan(ROLE.farrier, "shoe", 0, T, always(P(2)))).toMatch(/not allowed/);
    expect(validPlan(ROLE.spooker, "stampede", 0, T, always(P(1), C(0)))).toMatch(/Choose 3/);
    expect(validPlan(ROLE.spooker, "stampede", 0, T, always(P(1), C(0), C(0)))).toMatch(/different/);
  });
  it("lets the Farrier shoe only themselves or the seat clockwise", () => {
    expect(legalTargets(ROLE.farrier.steps![1], 3, T)).toEqual([P(3), P(0)]);
  });
});

describe("night", () => {
  it("runs a fully queued conditional plan in one go", () => {
    const s = state(["farrier", "centaur", "sage"], ["werewolf", "centaur", "herald"]);
    const plan: Plan = { peek: always(C(0)), shoe: { branches: [{ roles: ["werewolf"], decision: pick(P(1)) }], otherwise: pick(P(0)) } };
    const p = freshProgress();
    const log = advance(s, 0, plan, p, 3, rng());
    expect(p.done).toBe(true);
    expect(s.cards[1]).toBe("werewolf");
    expect(s.center[0]).toBe("centaur");
    expect(log.map(e => e.ev.kind)).toEqual(["look", "swap"]);
    expect(s.moved.sort()).toEqual(["c0", "p1"]);
  });
  it("stops at an undecided step and forces a random legal move when told to", () => {
    const s = state(["rustler", "werewolf", "sage"], ["centaur", "centaur", "herald"]);
    const p = freshProgress();
    expect(advance(s, 0, { peek: always(P(1)) }, p, 2, rng())).toHaveLength(1);
    expect(p).toMatchObject({ step: 1, done: false, seen: { peek: ["werewolf"] } });
    const forced = advance(s, 0, {}, p, 2, rng(), { force: true });
    expect(p.done).toBe(true);
    expect(forced.every(e => e.via === "forced")).toBe(true);
  });
  it("lets a lone wolf scent a team, and skips the step in a pack that includes the Tracker", () => {
    const lone = state(["werewolf", "sage", "centaur"], ["werewolf", "centaur", "herald"]);
    const log = advance(lone, 0, { scent: always(P(1)) }, freshProgress(), 1, rng());
    expect(log.map(e => e.ev)).toEqual([{ kind: "seats", label: "Werewolves", seats: [] }, { kind: "look", slots: [P(1)], teams: ["centaur"] }]);
    const pack = state(["werewolf", "tracker", "sage"], ["herald", "centaur", "centaur"]);
    const p = freshProgress();
    expect(advance(pack, 0, {}, p, 1, rng()).map(e => e.ev)).toEqual([{ kind: "seats", label: "Werewolves", seats: [1] }]);
    expect(p.done).toBe(true);
    expect(advance(pack, 1, {}, freshProgress(), 2, rng()).map(e => e.ev)).toEqual([{ kind: "seats", label: "Werewolves", seats: [0] }, { kind: "seats", label: "An information role", seats: [2] }]);
  });
  it("shows everyone what the Herald proclaims: one card, or two with five in the centre", () => {
    const s = state(["herald", "sage", "centaur"], ["werewolf", "centaur", "rustler"]);
    advance(s, 0, { proclaim: always(C(0)) }, freshProgress(), 4, rng());
    expect(s.shown).toEqual([{ slot: C(0), role: "werewolf", turn: 4 }]);
    const wide = state(["herald", "sage", "centaur"], ["werewolf", "centaur", "rustler", "sentry", "chiron"]);
    expect(validPlan(ROLE.herald, "proclaim", 0, { players: 3, center: 5 }, always(C(0)))).toMatch(/Choose 2/);
    advance(wide, 0, { proclaim: always(C(0), C(4)) }, freshProgress(), 4, rng());
    expect(wide.shown.map(x => x.role)).toEqual(["werewolf", "chiron"]);
  });
  it("stampedes three cards one place along, and the Herder counts wolves left in the centre", () => {
    const s = state(["spooker", "werewolf", "herder", "sage"], ["werewolf", "centaur", "tracker"]);
    advance(s, 0, { stampede: always(P(1), C(1), P(3)) }, freshProgress(), 1, rng());
    expect(s.cards).toEqual(["spooker", "sage", "herder", "centaur"]);
    expect(s.center).toEqual(["werewolf", "werewolf", "tracker"]);
    expect(advance(s, 2, {}, freshProgress(), 2, rng())[0].ev).toEqual({ kind: "count", label: "Werewolf cards in the centre", n: 3 });
  });
  it("lets the Sentry notice which nearby cards moved", () => {
    const s = state(["rustler", "sage", "sentry", "centaur"], ["werewolf", "centaur", "werewolf"]);
    advance(s, 0, { peek: always(P(3)), trade: { branches: [], otherwise: { kind: "do" } } }, freshProgress(), 1, rng());
    expect(advance(s, 2, {}, freshProgress(), 2, rng())[0].ev).toEqual({ kind: "moved", slots: [P(1), P(2), P(3)], moved: [false, false, true] });
  });
  it("records a prophecy against the card, and declining as 'nobody'", () => {
    const s = state(["augur", "sage", "centaur"], ["werewolf", "centaur", "herald"]);
    advance(s, 0, { foretell: always(P(2)) }, freshProgress(), 1, rng());
    expect(s.prophecy).toEqual({ augur: 2 });
    const t = state(["augur", "sage", "centaur"], ["werewolf", "centaur", "herald"]);
    expect(advance(t, 0, { foretell: { branches: [], otherwise: { kind: "skip" } } }, freshProgress(), 1, rng())[0].ev).toEqual({ kind: "predict", seat: -1 });
    expect(t.prophecy).toEqual({ augur: -1 });
  });
  it("gives every role with steps a script that can always be forced to the end, at every centre size", () => {
    for (const role of ROLES.filter(r => r.steps)) for (let c = CENTER_MIN; c <= CENTER_MAX; c++) for (let seed = 1; seed <= 5; seed++) {
      const centre = ["centaur", "sage", "werewolf", "herald", "chiron", "sentry"].slice(0, c);
      const s = state([role.id, "centaur", "centaur", "werewolf"], [...centre]);
      const p = freshProgress();
      advance(s, 0, {}, p, 1, rng(seed), { force: true });
      expect(p.done, role.id).toBe(true);
      expect([...s.cards, ...s.center].sort(), role.id).toEqual([role.id, "centaur", "centaur", "werewolf", ...centre].sort());
    }
  });
  it("makes forced multi-target moves legal", () => {
    const d = randomDecision(ROLE.spooker.steps![0], 0, T, rng(3));
    expect(validPlan(ROLE.spooker, "stampede", 0, T, { branches: [], otherwise: d })).toBeNull();
  });
});

describe("vote", () => {
  it("eliminates the most voted and gives the Centaurs the win over a dead wolf", () => {
    expect(resolveVote(["werewolf", "centaur", "sage"], [1, 0, 0])).toMatchObject({ deaths: [0], winningTeam: "centaur", winners: [1, 2] });
  });
  it("eliminates nobody when every seat has one vote, so the wolves win", () => {
    expect(resolveVote(["werewolf", "centaur", "sage"], [1, 2, 0])).toMatchObject({ deaths: [], winningTeam: "werewolf", winners: [0] });
  });
  it("counts the Tracker as a Werewolf", () => {
    expect(resolveVote(["tracker", "centaur", "sage"], [1, 0, 0]).winningTeam).toBe("centaur");
  });
  it("counts Chiron's vote twice, by the card held", () => {
    expect(resolveVote(["chiron", "werewolf", "centaur", "centaur"], [1, 2, 3, 0])).toMatchObject({ tally: [1, 2, 1, 1], deaths: [1], winningTeam: "centaur" });
  });
  it("lets an eliminated Sagittarius take their target down", () => {
    const o = resolveVote(["sagittarius", "werewolf", "centaur", "centaur"], [1, 0, 0, 2]);
    expect(o).toMatchObject({ deaths: [0, 1], winningTeam: "centaur" });
    expect(o.notes[0]).toMatch(/took their target down/);
  });
  it("lets wolf allies win with the wolves even when eliminated", () => {
    expect(resolveVote(["whisperer", "werewolf", "centaur"], [1, 0, 0])).toMatchObject({ deaths: [0], winners: [0, 1], winningTeam: "werewolf" });
  });
  it("with no wolf at the table, the Centaurs win only by eliminating nobody", () => {
    expect(resolveVote(["sage", "centaur", "centaur"], [1, 2, 0]).winningTeam).toBe("centaur");
    expect(resolveVote(["sage", "centaur", "centaur"], [1, 0, 1]).winningTeam).toBe("nobody");
  });
  it("pays out a prophecy to whoever HOLDS the card, alongside the winning team", () => {
    const o = resolveVote(["augur", "werewolf", "centaur"], [1, 0, 1], { augur: 1 });
    expect(o).toMatchObject({ deaths: [1], winningTeam: "centaur", winners: [0, 2] });
    expect(resolveVote(["augur", "werewolf", "centaur"], [1, 2, 0], { augur: -1 }).winners).toEqual([0, 1]);
    expect(resolveVote(["augur", "werewolf", "centaur"], [1, 0, 1], { augur: 2 }).winners).toEqual([2]);
    expect(resolveVote(["augur", "werewolf", "centaur"], [1, 0, 1]).winners).toEqual([2]);
  });
  it("puts the Hybrid on the team of the card clockwise of it", () => {
    expect(resolveVote(["hybrid", "werewolf", "centaur"], [2, 2, 0])).toMatchObject({ teams: ["werewolf", "werewolf", "centaur"], winners: [0, 1] });
    expect(resolveVote(["hybrid", "centaur", "werewolf"], [2, 2, 0])).toMatchObject({ teams: ["centaur", "centaur", "werewolf"], winners: [0, 1] });
    expect(resolveVote(["hybrid", "augur", "werewolf"], [2, 2, 0]).teams[0]).toBe("centaur");
  });
});

describe("commands", () => {
  const lobby = { ...HOME_CONTEXT, phase: "lobby" as const, member: true, host: true, players: 2, deck: recommendedDeck(3, 3) };
  it("hides commands of other phases and explains the ones that cannot run yet", () => {
    expect(availability(COMMAND["game.start"], HOME_CONTEXT)).toMatchObject({ ok: false, hidden: true });
    expect(availability(COMMAND["game.start"], lobby)).toEqual({ ok: false, reason: "Needs 3 players (2 seated).", hidden: false });
    expect(availability(COMMAND["game.start"], { ...lobby, players: 3 })).toEqual({ ok: true });
    expect(availability(COMMAND["game.start"], { ...lobby, players: 3, center: 4 })).toMatchObject({ ok: false });
    expect(availability(COMMAND["game.start"], { ...lobby, players: 3, host: false })).toMatchObject({ ok: false, reason: "Only the host can do this." });
  });
  it("says why chat is closed at night rather than hiding it", () => {
    expect(availability(COMMAND["chat.send"], { ...lobby, phase: "night" })).toEqual({ ok: false, reason: "The table is silent at night.", hidden: false });
  });
  it("offers a card's chat power only to the player dealt it", () => {
    const day = { ...lobby, phase: "day" as const, seated: true };
    expect(availability(COMMAND["chat.sendSigned"], day)).toMatchObject({ ok: false, hidden: true });
    expect(availability(COMMAND["chat.sendSigned"], { ...day, chatPower: "signed" })).toEqual({ ok: true });
    expect(availability(COMMAND["chat.sendUnsigned"], { ...day, chatPower: "signed" })).toMatchObject({ ok: false });
  });
  it("narrows the MCP tools by grant and never exposes consent commands", () => {
    const names = (g: "read" | "act" | "host") => toolDefinitions(g).map(t => t.name);
    expect(names("read").sort()).toEqual(["room_view", "room_wait", "rules_read"]);
    expect(names("act")).toEqual(expect.arrayContaining(["night_planStep", "day_vote", "chat_send", "room_view"]));
    expect(names("act")).not.toContain("game_start");
    expect(names("host")).toContain("game_start");
    for (const g of ["read", "act", "host"] as const) expect(names(g).some(n => n.startsWith("connect_") || n.startsWith("ui_"))).toBe(false);
    expect(COMMANDS.filter(c => c.id.startsWith("connect.")).every(c => !grantAllows(c, "host"))).toBe(true);
    expect(toolDefinitions("act").find(t => t.name === "day_vote")?.inputSchema).toMatchObject({ type: "object", required: ["seat"] });
  });
});
