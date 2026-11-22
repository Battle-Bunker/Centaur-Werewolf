import { describe, expect, it } from "vitest";
import { availability, COMMAND, COMMANDS, grantAllows, HOME_CONTEXT, toolDefinitions } from "./commands";
import { advance, dawn, daySwap, deal, dealFixed, deckProblem, freshProgress, legalTargets, nightTurns, publicMarks, randomDecision, resolvePlan, resolveVote, secureRng, seededRng, shuffle, uncovered, validDecision, validPlan, visibleShown, type GameState, type LogEntry, type Plan, type StepPlan } from "./engine";
import { CENTER_MAX, CENTER_MIN, legalRoles, recommendedDeck, ROLE, ROLES, type RoleId, type Slot } from "./roles";
import { DEFAULT_RULES, describeRules, LEGACY_RULES, RULE_DEFS, ruleValueProblem, rulesOf, type Rules } from "./settings";
import { describe as say, revealHidden } from "./text";

const rng = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const P = (i: number): Slot => ({ k: "p", i });
const C = (i: number): Slot => ({ k: "c", i });
const state = (dealt: string[], center: string[], rules: Partial<Rules> = {}): GameState => dealFixed([...dealt, ...center], dealt.length, rules);
const T = { players: 4, center: 3 };
const pick = (...targets: Slot[]) => ({ kind: "pick" as const, targets });
const always = (...targets: Slot[]): StepPlan => ({ branches: [], otherwise: pick(...targets) });
const decide = (d: StepPlan["otherwise"]): StepPlan => ({ branches: [], otherwise: d });
const names = { players: ["Ada", "Bo", "Cy", "Di", "Ed", "Fy", "Gus"].map(name => ({ name })) };
/** Runs one actor's whole script with this plan, forcing nothing. */
const act = (s: GameState, seat: number, plan: Plan = {}, turn = 1, history: LogEntry[] = []) => advance(s, seat, plan, freshProgress(), turn, rng(), { history });
/** Runs the whole night in wake order with these plans (undecided steps forced at random), then dawn. */
function night(s: GameState, plans: Record<number, Plan> = {}, seed = 7): LogEntry[] {
  const log: LogEntry[] = [];
  const r = rng(seed);
  nightTurns([...s.dealt, ...s.dealtCenter]).forEach((role, turn) => s.dealt.forEach((d, seat) => { if (d === role) log.push(...advance(s, seat, plans[seat] ?? {}, freshProgress(), turn + 1, r, { force: true, history: log })); }));
  log.push(...dawn(s, [...s.dealt, ...s.dealtCenter], 99, r));
  return log;
}

describe("deal", () => {
  it("deals every card once, the rest to the centre, for any centre size", () => {
    for (let c = CENTER_MIN; c <= CENTER_MAX; c++) {
      const deck = recommendedDeck(5, c);
      const s = deal(deck, 5, rng());
      expect(s.dealt).toHaveLength(5);
      expect(s.center).toHaveLength(c);
      expect(s.dealtCenter).toEqual(s.center);
      expect([...s.dealt, ...s.center].sort()).toEqual([...deck].sort());
    }
  });
  it("gives every night role in the deck one turn, in wake order, dealt or not", () => {
    expect(nightTurns(["centaur", "sentry", "werewolf", "werewolf", "farrier", "sage", "chiron"])).toEqual(["werewolf", "sage", "centaur", "farrier", "sentry"]);
    expect(nightTurns(ROLES.map(r => r.id))).toEqual(["elderbark", "werewolf", "stalkinghorse", "glamour", "moonthief", "tracker", "whisperer", "cuckoo", "sage", "centaur", "herald", "forger", "rustler", "farrier", "spooker", "herder", "oxpecker", "sentry", "eavesdropper", "biter"]);
  });
  it("retires Sagittarius, the Augur and the Hybrid, and every creature is on the Wildwood but the Moth", () => {
    for (const id of ["sagittarius", "augur", "hybrid"]) expect(ROLE[id]).toBeUndefined();
    expect(ROLES.filter(r => r.tags.includes("wild")).map(r => [r.id, r.team])).toEqual([["moth", "centaur"], ["elderbark", "wild"], ["cuckoo", "wild"], ["oxpecker", "wild"], ["sporeling", "wild"]]);
    expect(ROLES.filter(r => r.tags.includes("pack") && r.id !== "werewolf").every(r => r.max === 1)).toBe(true);
  });
  it("recommends a valid deck for 3 to 12 players and 3 to 6 centre cards", () => {
    for (let n = 3; n <= 12; n++) for (let c = CENTER_MIN; c <= CENTER_MAX; c++) expect(deckProblem(recommendedDeck(n, c), n, c), `${n}p ${c}c`).toBeNull();
  });
  it("explains a deck of the wrong size by players and centre cards", () => {
    expect(deckProblem(recommendedDeck(4, 3), 4, 5)).toMatch(/needs 9 cards: 4 players and 5 in the centre/);
  });
  it("checks the roster's deck rules: Forger needs a Herald and dawn proclamations; Moon-Thief needs the table size", () => {
    const base = ["werewolf", "sage", "centaur", "centaur", "rustler", "sentry", "chiron"];
    expect(deckProblem([...base, "forger"], 5, 3)).toMatch(/Forger needs a Herald/);
    expect(deckProblem([...base.slice(1), "forger", "herald"], 5, 3)).toBeNull();
    expect(deckProblem([...base.slice(1), "forger", "herald"], 5, 3, { dawnProclamations: false })).toMatch(/Proclamations at dawn/);
    expect(deckProblem([...base, "moonthief"], 5, 3)).toMatch(/Moon-Thief needs 7 or more/);
    expect(deckProblem([...base, "moonthief"], 5, 3, { thiefMinPlayers: 5 })).toBeNull();
    expect(deckProblem([...base, "glamour", "glamour"].slice(1), 5, 3)).toMatch(/Too many copies of Glamour/);
  });
  it("seeds deals repeatably, and the secure generator stays in [0, 1)", () => {
    const deck = recommendedDeck(7, 4);
    expect(deal(deck, 7, seededRng(42)).dealt).toEqual(deal(deck, 7, seededRng(42)).dealt);
    expect(deal(deck, 7, seededRng(42)).dealt).not.toEqual(deal(deck, 7, seededRng(43)).dealt);
    for (let i = 0; i < 1000; i++) { const x = secureRng(); expect(x >= 0 && x < 1).toBe(true); }
  });
  it("shuffles uniformly: both wolves land in the centre at the rate chance says", () => {
    const deck = ["werewolf", "werewolf", "sage", "centaur", "centaur", "herald", "rustler", "sentry"];
    let both = 0;
    const N = 40000;
    for (let g = 0; g < N; g++) if (deal(deck, 5, secureRng).center.filter(r => r === "werewolf").length === 2) both++;
    expect(both / N).toBeCloseTo(3 / 28, 1.5);
  });
});

describe("rule settings", () => {
  it("defaults to the synthesis's recommendation and fills in what is missing or invalid", () => {
    expect(rulesOf(undefined)).toEqual(DEFAULT_RULES);
    expect(rulesOf({ bloodPrice: false, census: "nonsense", thiefMinPlayers: 99 })).toEqual({ ...DEFAULT_RULES, bloodPrice: false });
    expect(DEFAULT_RULES).toMatchObject({ bloodPrice: true, census: "all", dawnProclamations: true, randomVotesCurse: false });
    expect(LEGACY_RULES).toEqual({ bloodPrice: false, census: "off", dawnProclamations: false });
  });
  it("describes every rule in one sentence and validates values", () => {
    expect(describeRules(DEFAULT_RULES).map(r => r.rule)).toEqual(RULE_DEFS.map(r => r.id));
    expect(describeRules({ ...DEFAULT_RULES, bloodPrice: false })[0]).toMatchObject({ isDefault: false, means: expect.stringMatching(/at least one Werewolf/) });
    expect(ruleValueProblem("bloodPrice", "yes")).toMatch(/true or false/);
    expect(ruleValueProblem("census", "three")).toBeNull();
    expect(ruleValueProblem("thiefMinPlayers", 2)).toMatch(/from 3 to 12/);
    expect(ruleValueProblem("nope", 1)).toMatch(/no rule/);
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
  it("checks named roles: a pick with a role, or a role alone, from the legal roles", () => {
    const deck = ["glamour", "werewolf", "sage", "herald", "centaur", "biter", "eavesdropper"];
    const shape = { players: 4, center: 3, deck };
    const g = ROLE.glamour.steps![1], listen = ROLE.eavesdropper.steps![1];
    expect(validDecision(g, 0, shape, { kind: "pick", targets: [P(1)], role: "sage" })).toBeNull();
    expect(validDecision(g, 0, shape, { kind: "pick", targets: [C(2)], role: "rustler" })).toMatch(/cannot name Rustler/);
    expect(validDecision(g, 0, shape, pick(P(1)))).toMatch(/Name a role/);
    expect(validDecision(listen, 0, shape, { kind: "name", role: "sage" }, "eavesdropper")).toBeNull();
    expect(validDecision(listen, 0, shape, { kind: "name", role: "biter" }, "eavesdropper")).toMatch(/cannot name Biter/);
    expect(validDecision(listen, 0, shape, pick(P(1)))).toMatch(/takes a role only/);
    expect(legalRoles(listen, deck, "eavesdropper")).toEqual(["sage", "herald", "centaur"]);
    for (let seed = 1; seed < 20; seed++) {
      expect(validDecision(g, 0, shape, randomDecision(g, 0, shape, rng(seed)))).toBeNull();
      expect(validDecision(listen, 0, shape, randomDecision(listen, 0, shape, rng(seed), "eavesdropper"), "eavesdropper")).toBeNull();
    }
  });
});

describe("night", () => {
  it("runs a fully queued conditional plan in one go, and records the branch it took", () => {
    const s = state(["farrier", "centaur", "sage"], ["werewolf", "centaur", "herald"]);
    const plan: Plan = { peek: always(C(0)), shoe: { branches: [{ roles: ["werewolf"], decision: pick(P(1)) }], otherwise: pick(P(0)) } };
    const p = freshProgress();
    const log = advance(s, 0, plan, p, 3, rng());
    expect(p.done).toBe(true);
    expect(s.cards[1]).toBe("werewolf");
    expect(s.center[0]).toBe("centaur");
    expect(log.map(e => e.ev.kind)).toEqual(["look", "swap"]);
    expect(log[1].cond).toEqual({ saw: ["werewolf"], branch: ["werewolf"] });
    expect(say(log[1], names, 0)).toMatch(/your plan for having seen Werewolf: the branch for Werewolf/);
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
  it("lets a lone pack card scent a team; in a pack the step does not happen, and a queued scent says so", () => {
    const lone = state(["werewolf", "sage", "centaur"], ["werewolf", "centaur", "herald"]);
    const log = act(lone, 0, { scent: always(P(1)) });
    expect(log.map(e => e.ev)).toEqual([{ kind: "seats", label: "The pack", seats: [] }, { kind: "census", roles: ["centaur", "herald", "werewolf"], of: 3 }, { kind: "look", slots: [P(1)], teams: ["centaur"] }]);
    const pack = state(["werewolf", "tracker", "sage"], ["herald", "centaur", "centaur"]);
    const p = freshProgress();
    const packLog = advance(pack, 0, { scent: always(P(2)) }, p, 1, rng());
    expect(packLog.map(e => e.ev.kind)).toEqual(["seats", "census", "void"]);
    expect(say(packLog[2], names, 0)).toMatch(/Alone: scent a player: did not happen, because another player was dealt a card of the pack/);
    expect(p.done).toBe(true);
    expect(act(pack, 1).map(e => e.ev)).toEqual([{ kind: "seats", label: "The pack", seats: [0] }, { kind: "census", roles: ["centaur", "centaur", "herald"], of: 3 }, { kind: "seats", label: "An information role", seats: [2] }]);
    expect(act(state(["werewolf", "sage", "centaur"], ["werewolf", "centaur", "herald"]), 0).map(e => e.ev.kind)).toEqual(["seats", "census"]);
  });
  it("lets the Stalking Horse wake with the pack and know exactly what a Werewolf knows", () => {
    const s = state(["werewolf", "stalkinghorse", "sage", "centaur"], ["herald", "centaur", "rustler"]);
    const wolf = act(s, 0).map(e => e.ev), horse = act(s, 1).map(e => e.ev);
    expect(wolf).toEqual([{ kind: "seats", label: "The pack", seats: [1] }, { kind: "census", roles: ["centaur", "herald", "rustler"], of: 3 }]);
    expect(horse).toEqual([{ kind: "seats", label: "The pack", seats: [0] }, wolf[1]]);
    expect(act(state(["whisperer", "stalkinghorse", "werewolf"], ["sage", "centaur", "herald"]), 0)[0].ev).toEqual({ kind: "seats", label: "A Werewolf", seats: [2] });
  });
  it("gives the census of the roles DEALT to the centre: all, three, or none, by table rule", () => {
    const dealt = ["werewolf", "rustler", "sage"], centre = ["werewolf", "centaur", "herald", "sentry", "farrier"];
    const s = state(dealt, centre);
    act(s, 1, { peek: always(P(0)), trade: decide({ kind: "do" }) }); // moves nothing in the centre, but census reads the deal anyway
    s.center[0] = "sage"; // as if a later move had changed the centre
    expect(act(s, 0)[1].ev).toEqual({ kind: "census", roles: ["centaur", "farrier", "herald", "sentry", "werewolf"], of: 5 });
    const three = act(state(dealt, centre, { census: "three" }), 0)[1].ev;
    expect(three).toMatchObject({ kind: "census", of: 5 });
    expect((three as { roles: string[] }).roles).toHaveLength(3);
    expect(act(state(dealt, centre, { census: "off" }), 0).map(e => e.ev.kind)).toEqual(["seats"]);
  });
  it("publishes proclamations at dawn by default, in random order, and at once under the legacy rule", () => {
    const s = state(["herald", "sage", "centaur"], ["werewolf", "centaur", "rustler"]);
    act(s, 0, { proclaim: always(C(0)) }, 4);
    expect(s.shown).toEqual([{ slot: C(0), role: "werewolf", by: "herald", turn: 4, atDawn: true }]);
    expect(visibleShown(s)).toEqual([]);
    dawn(s, [...s.dealt, ...s.dealtCenter], 9, rng());
    expect(visibleShown(s)).toHaveLength(1);
    const now = state(["herald", "sage", "centaur"], ["werewolf", "centaur", "rustler"], { dawnProclamations: false });
    act(now, 0, { proclaim: always(C(0)) }, 4);
    expect(visibleShown(now)).toHaveLength(1);
    const wide = state(["herald", "sage", "centaur"], ["werewolf", "centaur", "rustler", "sentry", "chiron"]);
    expect(validPlan(ROLE.herald, "proclaim", 0, { players: 3, center: 5 }, always(C(0)))).toMatch(/Choose 2/);
    act(wide, 0, { proclaim: always(C(0), C(4)) }, 4);
    expect(wide.shown.map(x => x.role)).toEqual(["werewolf", "chiron"]);
  });
  it("stampedes three cards one place along, and the Herder counts wolves left in the centre", () => {
    const s = state(["spooker", "werewolf", "herder", "sage"], ["werewolf", "centaur", "tracker"]);
    act(s, 0, { stampede: always(P(1), C(1), P(3)) });
    expect(s.cards).toEqual(["spooker", "sage", "herder", "centaur"]);
    expect(s.center).toEqual(["werewolf", "werewolf", "tracker"]);
    expect(act(s, 2)[0].ev).toEqual({ kind: "count", label: "Werewolf cards in the centre", n: 3 });
  });
  it("lets the Sentry notice which nearby cards moved", () => {
    const s = state(["rustler", "sage", "sentry", "centaur"], ["werewolf", "centaur", "werewolf"]);
    act(s, 0, { peek: always(P(3)), trade: decide({ kind: "do" }) });
    expect(act(s, 2)[0].ev).toEqual({ kind: "moved", slots: [P(1), P(2), P(3)], moved: [false, false, true] });
  });
  it("gives every role with steps a script that can always be forced to the end, at every centre size", () => {
    for (const role of ROLES.filter(r => r.steps)) for (let c = CENTER_MIN; c <= CENTER_MAX; c++) for (let seed = 1; seed <= 5; seed++) {
      const centre = ["centaur", "sage", "herald", "chiron", "sentry", "rustler"].slice(0, c);
      const s = state([role.id, "centaur", "centaur", "werewolf"], [...centre]);
      const p = freshProgress();
      advance(s, 0, {}, p, 1, rng(seed), { force: true, history: [] });
      expect(p.done, role.id).toBe(true);
      expect([...s.cards, ...s.center].sort(), role.id).toEqual([...s.dealt, ...s.dealtCenter].sort());
    }
  });
  it("makes forced multi-target moves legal", () => {
    const d = randomDecision(ROLE.spooker.steps![0], 0, T, rng(3));
    expect(validPlan(ROLE.spooker, "stampede", 0, T, { branches: [], otherwise: d })).toBeNull();
  });
});

describe("Glamour", () => {
  const glam = (target: Slot, role: RoleId) => ({ glamour: decide({ kind: "pick", targets: [target], role }) });
  it("makes every look at the glamoured card show the named role, but not Werewolf-team looks or the Herder's count", () => {
    const s = state(["glamour", "sage", "herald", "herder", "biter"], ["werewolf", "centaur", "rustler"]);
    const g = act(s, 0, glam(P(3), "sage"));
    expect(g.map(e => e.ev.kind)).toEqual(["seats", "census", "glamour"]);
    const read = act(s, 1, { read: always(P(3)) });
    expect(read[0].ev).toEqual({ kind: "look", slots: [P(3)], roles: ["sage"] });
    expect(read[0].hidden).toEqual({ truth: ["herder"] });
    expect(revealHidden(read[0], names)).toMatch(/truly Herder/);
    // A Werewolf-team look sees the truth.
    expect(act(s, 4, { sniff: always(P(3)), bite: decide({ kind: "skip" }) }).find(e => e.step === "sniff")!.ev).toEqual({ kind: "look", slots: [P(3)], roles: ["herder"] });
    // The Herder's count is not fooled by a glamour on a centre card.
    act(s, 0, glam(C(0), "centaur"));
    expect(act(s, 3)[0].ev).toMatchObject({ n: 1 });
  });
  it("fools a proclamation, and travels with the card when it moves", () => {
    const s = state(["glamour", "herald", "rustler", "sage"], ["werewolf", "centaur", "sentry"]);
    act(s, 0, glam(C(1), "werewolf"));
    act(s, 1, { proclaim: always(C(1)) });
    expect(s.shown[0]).toMatchObject({ slot: C(1), role: "werewolf" });
    act(s, 0, glam(P(0), "centaur"));
    act(s, 2, { peek: always(P(0)), trade: decide({ kind: "do" }) }); // the Rustler takes the glamoured card
    expect(s.cards[2]).toBe("glamour");
    expect(s.tokens).toMatchObject({ p2: { glamour: "centaur" } });
    expect(s.tokens.p0).toBeUndefined();
    expect(act(s, 3, { read: always(P(2)) })[0].ev).toMatchObject({ roles: ["centaur"] });
  });
  it("moves with a stampede too", () => {
    const s = state(["glamour", "spooker", "sage", "centaur"], ["werewolf", "centaur", "sentry"]);
    act(s, 0, glam(P(0), "sage"));
    act(s, 1, { stampede: always(P(0), C(2), P(3)) });
    expect(s.center[2]).toBe("glamour");
    expect(Object.keys(s.tokens)).toEqual(["c2"]);
  });
});

describe("Forger", () => {
  it("sees the Herald's proclamation, then forges one that is published with it at dawn, flagged only after the game", () => {
    const s = state(["herald", "forger", "sage"], ["werewolf", "centaur", "rustler"]);
    act(s, 0, { proclaim: always(C(0)) }, 5);
    const f = act(s, 1, { forge: decide({ kind: "pick", targets: [C(2)], role: "sage" }) }, 6);
    expect(f.map(e => e.ev)).toEqual([{ kind: "witness", by: "herald", slots: [C(0)], roles: ["werewolf"] }, { kind: "forge", slots: [C(2)], roles: ["sage"], as: "herald" }]);
    expect(s.shown[1]).toEqual({ slot: C(2), role: "sage", by: "herald", turn: 6, atDawn: true, forged: true });
    expect(visibleShown(s)).toEqual([]);
    dawn(s, [...s.dealt, ...s.dealtCenter], 9, rng());
    expect(visibleShown(s).map(x => x.role).sort()).toEqual(["sage", "werewolf"]);
  });
  it("forges as many cards as the Herald proclaims, and sees that nothing was proclaimed when the Herald is unheld", () => {
    const s = state(["forger", "sage", "centaur"], ["herald", "centaur", "rustler", "sentry", "chiron"]);
    expect(validPlan(ROLE.forger, "forge", 0, { players: 3, center: 5, deck: [...s.dealt, ...s.dealtCenter] }, decide({ kind: "pick", targets: [C(0)], role: "sage" }))).toMatch(/Choose 2/);
    expect(act(s, 0, { forge: decide({ kind: "pick", targets: [C(0), C(1)], role: "sage" }) })[0].ev).toEqual({ kind: "witness", by: "herald", slots: [], roles: [] });
    expect(s.shown).toHaveLength(2);
  });
});

describe("Eavesdropper", () => {
  const listen = (role: RoleId): Plan => ({ listen: decide({ kind: "name", role }) });
  it("copies everything the holder of the named role learned tonight, trades included", () => {
    const s = state(["rustler", "eavesdropper", "sage", "werewolf"], ["centaur", "herald", "sentry"]);
    const log = act(s, 0, { peek: always(P(3)), trade: decide({ kind: "skip" }) }, 2);
    const ev = act(s, 1, listen("rustler"), 9, log).find(e => e.step === "listen")!;
    expect(ev.ev).toEqual({ kind: "overhear", role: "rustler", copied: [{ step: "peek", ev: { kind: "look", slots: [P(3)], roles: ["werewolf"] } }, { step: "trade", ev: { kind: "skip" } }] });
    expect(ev.hidden).toEqual({ source: 0 });
    expect(say(ev, names, 1)).toMatch(/You overheard the Rustler: The Rustler looked at Di \(seat 3\)'s card: Werewolf. The Rustler chose: Keep mine/);
  });
  it("with two copies, copies the first holder clockwise of the Eavesdropper", () => {
    const s = state(["centaur", "eavesdropper", "sage", "centaur"], ["werewolf", "herald", "sentry"]);
    const log = [...act(s, 0, { glance: always(C(0)) }, 3), ...act(s, 3, { glance: always(C(1)) }, 3)];
    expect(act(s, 1, listen("centaur"), 9, log).find(e => e.step === "listen")!.hidden).toEqual({ source: 3 });
  });
  it("when nobody holds the role, gets a true ghost result from its own seat (moving nothing), or nothing under the rule", () => {
    const s = state(["eavesdropper", "sage", "centaur"], ["rustler", "herald", "sentry"]);
    const before = JSON.stringify([s.cards, s.center]);
    const e = act(s, 0, listen("rustler"), 9).find(x => x.step === "listen")!;
    expect(e.hidden).toEqual({ source: "ghost" });
    const copied = (e.ev as { copied: { step: string; ev: { kind: string; slots: Slot[] } }[] }).copied;
    expect(copied.map(c => c.ev.kind)).toEqual(["look"]);
    expect(copied[0].ev.slots[0].k === "p" && copied[0].ev.slots[0].i !== 0).toBe(true);
    expect(JSON.stringify([s.cards, s.center])).toBe(before);
    const herald = act(state(["eavesdropper", "sage", "centaur"], ["rustler", "herald", "sentry"]), 0, listen("herald"), 9).find(x => x.step === "listen")!;
    expect((herald.ev as { copied: { ev: { kind: string } }[] }).copied.map(c => c.ev.kind)).toEqual(["look"]); // a private look, no proclamation
    const off = state(["eavesdropper", "sage", "centaur"], ["rustler", "herald", "sentry"], { eavesdropGhost: false });
    expect(act(off, 0, listen("rustler"), 9).find(x => x.step === "listen")!.ev).toEqual({ kind: "overhear", role: "rustler", copied: [] });
  });
});

describe("Biter", () => {
  it("looks at the true card, bites conditionally, and the victim is told at dawn (with the seat, under the rule)", () => {
    const s = state(["biter", "sage", "centaur", "werewolf"], ["rustler", "herald", "sentry"]);
    const log = act(s, 0, { sniff: always(P(1)), bite: { branches: [{ roles: ["sage", "herald"], decision: { kind: "do" } }], otherwise: { kind: "skip" } } });
    expect(log.map(e => e.ev.kind)).toEqual(["seats", "census", "look", "bite"]);
    expect(s.bitten).toEqual({ seat: 1, by: 0 });
    const notes = dawn(s, [...s.dealt, ...s.dealtCenter], 9, rng());
    expect(notes).toEqual([{ turn: 9, seat: 1, role: "sage", step: "dawn", via: "auto", ev: { kind: "bitten", by: 0 } }]);
    expect(say(notes[0], names, 1)).toMatch(/you were bitten by Ada \(seat 0\)\. You now win only with the Werewolf team\. You are not a Werewolf/);
    const quiet = state(["biter", "sage", "centaur"], ["rustler", "herald", "sentry"], { biteNamesBiter: false });
    act(quiet, 0, { sniff: always(P(1)), bite: decide({ kind: "do" }) });
    expect(dawn(quiet, [], 9, rng())[0].ev).toEqual({ kind: "bitten", by: null });
  });
  it("has no effect on a card already on the Werewolf team", () => {
    const s = state(["biter", "whisperer", "centaur"], ["rustler", "herald", "sentry"]);
    expect(act(s, 0, { sniff: always(P(1)), bite: decide({ kind: "do" }) }).slice(-1)[0].ev).toEqual({ kind: "bite", seat: 1, took: false });
    expect(s.bitten).toBeNull();
  });
});

describe("creatures at night", () => {
  it("lets the Elderbark learn which seats were dealt creatures, the Moth included", () => {
    const s = state(["elderbark", "moth", "sage", "sporeling", "werewolf"], ["cuckoo", "herald", "sentry"]);
    expect(act(s, 0)[0].ev).toEqual({ kind: "seats", label: "Creatures", seats: [1, 3] });
  });
  it("lays the Cuckoo's egg (public at dawn) and the Oxpecker's bond (private); an unheld Cuckoo's egg is laid at random", () => {
    const s = state(["cuckoo", "oxpecker", "sage", "werewolf"], ["herald", "centaur", "sentry"]);
    act(s, 0, { peek: always(P(3)), egg: always(P(2)) });
    act(s, 1, { bond: always(P(3)) });
    expect(s.marks).toEqual({ cuckoo: 2, oxpecker: 3 });
    expect(publicMarks(s)).toEqual([]);
    dawn(s, [...s.dealt, ...s.dealtCenter], 9, rng());
    expect(publicMarks(s)).toEqual([{ role: "cuckoo", seat: 2, label: "The egg" }]);
    const unheld = state(["sage", "centaur", "werewolf"], ["cuckoo", "herald", "sentry"]);
    const notes = dawn(unheld, [...unheld.dealt, ...unheld.dealtCenter], 9, rng());
    expect(notes[0]).toMatchObject({ seat: -1, role: "cuckoo", ev: { kind: "mark", unheld: true, public: true } });
    expect(unheld.marks.cuckoo).toBeGreaterThanOrEqual(0);
  });
  it("turns the Moth's seat into an Imago at dawn if the card dealt to it was moved, unless bitten", () => {
    const moved = state(["moth", "rustler", "sage"], ["werewolf", "herald", "sentry"]);
    act(moved, 1, { peek: always(P(0)), trade: decide({ kind: "do" }) });
    const notes = dawn(moved, [], 9, rng());
    expect(moved.imago).toEqual([0]);
    expect(notes.map(e => [e.seat, e.ev.kind])).toEqual([[0, "imago"]]);
    const still = state(["moth", "rustler", "sage"], ["werewolf", "herald", "sentry"]);
    dawn(still, [], 9, rng());
    expect(still.imago).toEqual([]);
    const bit = state(["moth", "rustler", "biter"], ["werewolf", "herald", "sentry"]);
    act(bit, 1, { peek: always(P(0)), trade: decide({ kind: "do" }) });
    act(bit, 2, { sniff: always(P(0)), bite: decide({ kind: "do" }) });
    dawn(bit, [], 9, rng());
    expect(bit.imago).toEqual([]);
  });
  it("swaps two seats' cards for the Moon-Thief, and does not change an Imago", () => {
    const s = state(["moonthief", "sporeling", "centaur", "moth"], ["werewolf", "herald", "sentry"]);
    s.imago = [3];
    expect(daySwap(s, 1, 2)).toEqual({ kind: "daySwap", a: 1, b: 2 });
    expect(s.cards).toEqual(["moonthief", "centaur", "sporeling", "moth"]);
    expect(s.imago).toEqual([3]);
  });
  it("plays a whole night of the full ecosystem without breaking, at every seed", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const deck = shuffle(["werewolf", "eavesdropper", "biter", "stalkinghorse", "sage", "herald", "centaur", "centaur", "farrier", "sentry", "moth", "cuckoo", "oxpecker"], rng(seed));
      const s = dealFixed(deck, 7);
      night(s, {}, seed);
      expect(s.dawn).toBe(true);
      expect([...s.cards, ...s.center].sort()).toEqual([...deck].sort());
      expect(s.marks.cuckoo).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("vote", () => {
  it("eliminates the most voted and gives the Centaurs the win over a dead wolf", () => {
    expect(resolveVote(["werewolf", "centaur", "sage"], [1, 0, 0])).toMatchObject({ deaths: [0], winningTeam: "centaur", winners: [1, 2] });
  });
  it("eliminates nobody when every seat has one vote, so the wolves win", () => {
    expect(resolveVote(["werewolf", "centaur", "sage"], [1, 2, 0])).toMatchObject({ deaths: [], winningTeam: "werewolf", winners: [0] });
  });
  it("needs the table's number of votes to eliminate", () => {
    const cards = ["werewolf", "centaur", "sage", "centaur", "centaur"];
    expect(resolveVote(cards, [1, 0, 0, 2, 3]).deaths).toEqual([0]);
    expect(resolveVote(cards, [1, 0, 0, 2, 3], { rules: { eliminationVotes: 3 } }).deaths).toEqual([]);
  });
  it("counts every wolf-tagged card as a Werewolf, but not the Stalking Horse or the allies", () => {
    for (const w of ["tracker", "glamour", "moonthief", "eavesdropper", "biter"]) expect(resolveVote([w, "centaur", "sage"], [1, 0, 0]).winningTeam, w).toBe("centaur");
    expect(resolveVote(["whisperer", "werewolf", "centaur"], [1, 0, 0])).toMatchObject({ deaths: [0], winners: [0, 1], winningTeam: "werewolf" });
  });
  it("counts Chiron's vote twice, by the card held", () => {
    expect(resolveVote(["chiron", "werewolf", "centaur", "centaur"], [1, 2, 3, 0])).toMatchObject({ tally: [1, 2, 1, 1], deaths: [1], winningTeam: "centaur" });
  });
  it("with no wolf held, the Centaurs win only by eliminating nobody; otherwise the surviving wolf side wins, or nobody", () => {
    expect(resolveVote(["sage", "centaur", "centaur"], [1, 2, 0]).winningTeam).toBe("centaur");
    expect(resolveVote(["sage", "centaur", "centaur"], [1, 0, 1]).winningTeam).toBe("nobody");
    expect(resolveVote(["spooker", "centaur", "centaur"], [1, 0, 1])).toMatchObject({ winningTeam: "werewolf", winners: [0] });
    expect(resolveVote(["spooker", "centaur", "centaur"], [1, 0, 0])).toMatchObject({ winningTeam: "nobody", winners: [] });
  });
  describe("Blood Price", () => {
    const cards = ["werewolf", "centaur", "sage", "centaur"];
    it("makes a Werewolf and a Centaur tied and eliminated a Werewolf-team win (the case it exists for)", () => {
      const o = resolveVote(cards, [1, 0, 0, 1]);
      expect(o).toMatchObject({ deaths: [0, 1], winningTeam: "werewolf", wolvesDown: 1, centaursDown: 1, winners: [0] });
      expect(o.headline).toMatch(/Blood Price/);
    });
    it("is off under the legacy rule: any Werewolf eliminated wins for the Centaurs", () => {
      expect(resolveVote(cards, [1, 0, 0, 1], { rules: LEGACY_RULES }).winningTeam).toBe("centaur");
    });
    it("lets the Centaurs win when more Werewolves than Centaurs fall", () => {
      expect(resolveVote(["werewolf", "werewolf", "centaur", "sage", "centaur"], [1, 0, 0, 2, 2]).winningTeam).toBe("werewolf");
      expect(resolveVote(["werewolf", "werewolf", "centaur", "sage", "centaur"], [1, 0, 1, 0, 3])).toMatchObject({ deaths: [0, 1], winningTeam: "centaur" });
    });
    it("does not count allies, creatures or the bitten as Centaurs", () => {
      expect(resolveVote(["werewolf", "whisperer", "centaur", "sage"], [1, 0, 0, 1]).winningTeam).toBe("centaur");
      expect(resolveVote(["werewolf", "sporeling", "centaur", "sage"], [1, 0, 0, 1]).winningTeam).toBe("centaur");
      expect(resolveVote(["werewolf", "sage", "centaur", "centaur"], [1, 0, 0, 1], { bitten: { seat: 1, by: 0 } }).winningTeam).toBe("centaur");
    });
  });

  describe("the synthesis's worked edge cases", () => {
    it("Sporeling and Werewolf tied and eliminated: Centaurs win, Sporeling wins, its Centaur voters lose, wolves lose", () => {
      // seats: 0 Sporeling, 1 Werewolf, 2 Centaur (votes Sporeling), 3 Sage (votes Werewolf), 4 Centaur (votes Sporeling)
      const o = resolveVote(["sporeling", "werewolf", "centaur", "sage", "centaur"], [1, 0, 0, 1, 3]);
      expect(o).toMatchObject({ deaths: [0, 1], winningTeam: "centaur", cursed: [1, 2] });
      expect(o.winners).toEqual([0, 3, 4]);
      expect(o.why[2]).toMatch(/^Lost: .*curse/);
      expect(o.why[0]).toMatch(/^Won: held the Sporeling and won by being eliminated/);
    });
    it("Sporeling and Centaur tied, with a wolf at the table: wolves win, Sporeling wins, wolves who voted for it lose", () => {
      const o = resolveVote(["sporeling", "centaur", "werewolf", "werewolf", "sage"], [1, 0, 0, 1, 2]);
      expect(o).toMatchObject({ deaths: [0, 1], winningTeam: "werewolf", wolvesDown: 0, cursed: [1, 2] });
      expect(o.winners).toEqual([0, 3]);
    });
    it("Werewolf and Centaur tied: the Werewolves win", () => {
      expect(resolveVote(["werewolf", "centaur", "sage"], [1, 0, 1]).winningTeam).toBe("werewolf");
    });
    it("Stalking Horse and Werewolf tied: the Werewolf team wins by rule (a)", () => {
      const o = resolveVote(["stalkinghorse", "werewolf", "centaur", "sage"], [1, 0, 0, 1]);
      expect(o).toMatchObject({ deaths: [0, 1], winningTeam: "werewolf", winners: [0, 1] });
      expect(o.headline).toMatch(/Stalking Horse was eliminated.*even though a Werewolf fell too/);
    });
    it("Nobody eliminated: wolves win, the Elderbark wins, the Sporeling, Imago and Cuckoo lose, the Oxpecker follows its host", () => {
      const cards = ["werewolf", "elderbark", "sporeling", "cuckoo", "oxpecker", "moth", "centaur"];
      const o = resolveVote(cards, [1, 2, 3, 4, 5, 6, 0], { imago: [5], marks: { cuckoo: 0, oxpecker: 0 } });
      expect(o.deaths).toEqual([]);
      expect(o.winningTeam).toBe("werewolf");
      expect(o.winners).toEqual([0, 1, 4]);
      expect(resolveVote(cards, [1, 2, 3, 4, 5, 6, 0], { imago: [5], marks: { cuckoo: 0, oxpecker: 6 } }).winners).toEqual([0, 1]);
    });
    it("a moved Sporeling: whoever holds it at the count is the Sporeling and curses their voters", () => {
      // The Sage's seat (2) now holds the Sporeling without knowing it.
      const o = resolveVote(["werewolf", "centaur", "sporeling", "centaur"], [2, 2, 0, 2]);
      expect(o).toMatchObject({ deaths: [2], winningTeam: "werewolf", cursed: [0, 1, 3] });
      expect(o.winners).toEqual([2]);
    });
    it("creature cards in the centre: no curse, an egg that benefits nobody, a bond held by nobody", () => {
      const o = resolveVote(["werewolf", "centaur", "sage", "centaur"], [1, 0, 0, 1], { marks: { cuckoo: 1, oxpecker: 2 } });
      expect(o).toMatchObject({ cursed: [], winningTeam: "werewolf", winners: [0] });
    });
    it("the Moon-Thief moves the Sporeling onto the table's target: the target wins as the Sporeling, its voters are cursed", () => {
      const s = state(["moonthief", "sporeling", "werewolf", "centaur", "sage", "centaur", "centaur"], ["herald", "sentry", "farrier"], { thiefMinPlayers: 7 });
      daySwap(s, 1, 2); // the table votes for seat 2, the obvious wolf
      const o = resolveVote(s.cards, [2, 2, 1, 2, 2, 2, 2], { rules: s.rules });
      expect(o).toMatchObject({ deaths: [2], winningTeam: "werewolf", cursed: [0, 1, 3, 4, 5, 6] });
      expect(o.winners).toEqual([2]);
    });
    it("an Imago holding a Werewolf card is eliminated: the Centaurs win and the Imago wins too", () => {
      const o = resolveVote(["werewolf", "centaur", "sage", "centaur"], [1, 0, 0, 0], { imago: [0] });
      expect(o).toMatchObject({ deaths: [0], winningTeam: "centaur", winners: [0, 1, 2, 3], teams: ["wild", "centaur", "centaur", "centaur"] });
      expect(o.why[0]).toMatch(/became an Imago .* won by being eliminated/);
    });
    it("an Oxpecker bonded to a seat later bitten wins with the wolves, unknowingly", () => {
      const o = resolveVote(["oxpecker", "sage", "werewolf", "centaur"], [3, 3, 3, 1], { bitten: { seat: 1, by: 2 }, marks: { oxpecker: 1 } });
      expect(o).toMatchObject({ deaths: [3], winningTeam: "werewolf", winners: [0, 1, 2] });
      expect(o.why[0]).toMatch(/won with the seat it bonded to \(seat 1\)/);
      expect(o.why[1]).toMatch(/was bitten, so played for the Werewolf team, which won/);
    });
  });

  describe("creatures", () => {
    it("the Elderbark eliminated: no other creature wins", () => {
      const o = resolveVote(["elderbark", "sporeling", "werewolf", "oxpecker", "centaur"], [1, 0, 0, 1, 2], { marks: { oxpecker: 2 } });
      expect(o.deaths).toEqual([0, 1]);
      expect(o.winners).toEqual([2]); // the wolves win (W=0); Sporeling, Elderbark and Oxpecker lose
      expect(o.why[1]).toMatch(/Elderbark was eliminated/);
      expect(o.why[3]).toMatch(/Elderbark was eliminated/);
    });
    it("the Elderbark loses when another creature (or an Imago) is eliminated", () => {
      expect(resolveVote(["elderbark", "sporeling", "werewolf", "centaur"], [1, 2, 1, 1]).winners).toContain(1);
      expect(resolveVote(["elderbark", "sporeling", "werewolf", "centaur"], [1, 2, 1, 1]).winners).not.toContain(0);
      expect(resolveVote(["elderbark", "moth", "werewolf", "centaur"], [1, 2, 1, 1], { imago: [1] }).winners).not.toContain(0);
    });
    it("the Cuckoo holder wins if the egged seat falls and they do not", () => {
      expect(resolveVote(["cuckoo", "sage", "werewolf", "centaur"], [2, 2, 1, 2], { marks: { cuckoo: 2 } }).winners).toEqual([0, 1, 3]);
      expect(resolveVote(["cuckoo", "sage", "werewolf", "centaur"], [2, 0, 0, 2], { marks: { cuckoo: 2 } }).winners).not.toContain(0);
    });
    it("the Oxpecker loses with a cursed host, and is itself cursed for voting for the Sporeling", () => {
      const hostCursed = resolveVote(["oxpecker", "centaur", "sporeling", "werewolf", "sage"], [3, 2, 3, 2, 2], { marks: { oxpecker: 3 } });
      expect(hostCursed.cursed).toContain(3);
      expect(hostCursed.winners).not.toContain(0);
      const selfCursed = resolveVote(["oxpecker", "centaur", "sporeling", "werewolf", "sage"], [2, 2, 3, 2, 3], { marks: { oxpecker: 2 } });
      expect(selfCursed.why[0]).toMatch(/won with the seat it bonded to.*curse/);
      expect(selfCursed.cursed).toContain(0);
      expect(selfCursed.winners).not.toContain(0);
    });
    it("a random vote never curses, unless the table rule says it does", () => {
      const cards = ["sporeling", "werewolf", "centaur", "sage"];
      expect(resolveVote(cards, [1, 0, 0, 0], { forced: [2] }).cursed).toEqual([1, 3]);
      expect(resolveVote(cards, [1, 0, 0, 0], { forced: [2], rules: { randomVotesCurse: true } }).cursed).toEqual([1, 2, 3]);
    });
    it("a bitten creature loses its creature rules: no win by elimination, no curse", () => {
      const o = resolveVote(["sporeling", "werewolf", "centaur", "sage"], [1, 0, 0, 0], { bitten: { seat: 0, by: 1 } });
      expect(o).toMatchObject({ deaths: [0], cursed: [], winningTeam: "werewolf", teams: ["werewolf", "werewolf", "centaur", "centaur"] });
      expect(o.winners).toEqual([0, 1]);
    });
  });

  it("explains every seat's result in one sentence that starts with Won or Lost", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = rng(seed);
      const cards = shuffle(["werewolf", "stalkinghorse", "sage", "centaur", "sporeling", "cuckoo", "oxpecker", "elderbark", "moth"], r).slice(0, 7);
      const votes = cards.map((_, i) => { let v = Math.floor(r() * 6); if (v >= i) v++; return v; });
      const o = resolveVote(cards, votes, { marks: { cuckoo: 1, oxpecker: 2 }, imago: [3], bitten: seed % 3 ? null : { seat: 4, by: 0 } });
      o.why.forEach((w, i) => expect(w, `${seed}:${i}`).toMatch(o.winners.includes(i) ? /^Won: .+\.$/ : /^Lost: .+\.$/));
    }
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
  it("checks the deck against the table's rules before starting", () => {
    const deck = ["werewolf", "moonthief", "sage", "centaur", "centaur", "rustler", "sentry", "herald"];
    expect(availability(COMMAND["game.start"], { ...lobby, players: 5, deck })).toMatchObject({ ok: false, reason: expect.stringMatching(/Moon-Thief needs 7/) });
    expect(availability(COMMAND["game.start"], { ...lobby, players: 5, deck, rules: { ...DEFAULT_RULES, thiefMinPlayers: 5 } })).toEqual({ ok: true });
  });
  it("validates rule values before setting them", () => {
    expect(availability(COMMAND["setup.setRule"], lobby, { rule: "census", value: "three" })).toEqual({ ok: true });
    expect(availability(COMMAND["setup.setRule"], lobby, { rule: "census", value: true })).toMatchObject({ ok: false, reason: expect.stringMatching(/one of/) });
    expect(COMMAND["setup.setRule"].params.safeParse({ rule: "bloodPrice", value: false }).success).toBe(true);
    expect(COMMAND["setup.setRule"].params.safeParse({ rule: "nope", value: false }).success).toBe(false);
  });
  it("says why chat is closed at night rather than hiding it", () => {
    expect(availability(COMMAND["chat.send"], { ...lobby, phase: "night" })).toEqual({ ok: false, reason: "The table is silent at night.", hidden: false });
  });
  it("offers a card's chat and day powers only to the player dealt it", () => {
    const day = { ...lobby, phase: "day" as const, seated: true };
    expect(availability(COMMAND["chat.sendSigned"], day)).toMatchObject({ ok: false, hidden: true });
    expect(availability(COMMAND["chat.sendSigned"], { ...day, chatPower: "signed" })).toEqual({ ok: true });
    expect(COMMAND["chat.sendUnsigned"]).toBeUndefined();
    expect(availability(COMMAND["day.queueSwap"], day)).toMatchObject({ ok: false, hidden: true, reason: expect.stringMatching(/Moon-Thief/) });
    expect(availability(COMMAND["day.queueSwap"], { ...day, dayPower: "swap" })).toEqual({ ok: true });
    expect(availability(COMMAND["day.clearSwap"], { ...day, dayPower: "swap" })).toMatchObject({ ok: false, reason: "You have no swap queued." });
    expect(availability(COMMAND["day.clearSwap"], { ...day, dayPower: "swap", swapQueued: true })).toEqual({ ok: true });
  });
  it("offers the play-test hooks only at a play-test table, and only to the host", () => {
    expect(availability(COMMAND["setup.fixDeal"], lobby)).toMatchObject({ ok: false, hidden: true });
    expect(availability(COMMAND["setup.fixDeal"], { ...lobby, playtest: true })).toEqual({ ok: true });
    expect(availability(COMMAND["setup.fixDeal"], { ...lobby, playtest: true, host: false })).toMatchObject({ ok: false });
    expect(availability(COMMAND["game.abandon"], { ...lobby, phase: "day", playtest: false })).toMatchObject({ ok: false });
    expect(availability(COMMAND["game.abandon"], { ...lobby, phase: "day", playtest: true })).toEqual({ ok: true });
  });
  it("accepts named-role decisions in a night plan", () => {
    const p = COMMAND["night.planStep"].params;
    expect(p.safeParse({ step: "glamour", plan: { branches: [], otherwise: { kind: "pick", targets: [{ k: "p", i: 1 }], role: "sage" } } }).success).toBe(true);
    expect(p.safeParse({ step: "listen", plan: { branches: [], otherwise: { kind: "name", role: "sage" } } }).success).toBe(true);
    expect(p.safeParse({ step: "listen", plan: { branches: [], otherwise: { kind: "name", role: "augur" } } }).success).toBe(false);
  });
  it("narrows the MCP tools by grant and never exposes consent commands", () => {
    const names = (g: "read" | "act" | "host") => toolDefinitions(g).map(t => t.name);
    expect(names("read").sort()).toEqual(["room_view", "room_wait", "rules_read"]);
    expect(names("act")).toEqual(expect.arrayContaining(["night_planStep", "day_vote", "chat_send", "room_view", "day_queueSwap", "day_clearSwap"]));
    expect(names("act")).not.toContain("game_start");
    expect(names("act")).not.toContain("setup_fixDeal");
    expect(names("host")).toEqual(expect.arrayContaining(["game_start", "setup_setRule", "setup_fixDeal", "game_abandon"]));
    for (const g of ["read", "act", "host"] as const) expect(names(g).some(n => n.startsWith("connect_") || n.startsWith("ui_"))).toBe(false);
    expect(COMMANDS.filter(c => c.id.startsWith("connect.")).every(c => !grantAllows(c, "host"))).toBe(true);
    expect(toolDefinitions("act").find(t => t.name === "day_vote")?.inputSchema).toMatchObject({ type: "object", required: ["seat"] });
    expect(toolDefinitions("act").find(t => t.name === "day_vote")?.description).toMatch(/\{ "seat": <seat number/);
    expect(toolDefinitions("act").find(t => t.name === "room_wait")?.inputSchema).toMatchObject({ properties: { until: { enum: ["any", "phase", "chat", "turn"] } } });
  });
});
