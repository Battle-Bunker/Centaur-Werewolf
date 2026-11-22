import { describe, expect, it } from "vitest";
import { availability, COMMAND, COMMANDS, grantAllows, HOME_CONTEXT, toolDefinitions } from "./commands";
import { actingRole, advance, dawn, daySwap, deal, dealFixed, decisionCount, deckProblem, freshProgress, heldRoles, isPhoenix, legalTargets, nightTurns, publicMarks, randomDecision, resolvePlan, resolveVote, runTurn, secureRng, seededRng, shapeOf, shuffle, turnKey, uncovered, validDecision, validPlan, visibleShown, type GameState, type LogEntry, type NightSeat, type Plan, type StepPlan } from "./engine";
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
function night(s: GameState, plans: Record<number, Plan> = {}, seed = 7, adoptPlans: Record<number, Record<string, Plan>> = {}): LogEntry[] {
  const log: LogEntry[] = [];
  const r = rng(seed);
  const seats: NightSeat[] = s.dealt.map((_, i) => ({ plan: plans[i] ?? {}, progress: freshProgress(), adoptPlans: adoptPlans[i] ?? {} }));
  nightTurns([...s.dealt, ...s.dealtCenter]).forEach((role, turn) => log.push(...runTurn(s, role, seats, turn + 1, r, log, { force: true })));
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
    expect(nightTurns(ROLES.map(r => r.id))).toEqual(["gleaner", "echo", "kindler", "werewolf", "stalkinghorse", "glamour", "moonthief", "wisp", "tracker", "mistweaver", "fogbank", "whisperer", "cuckoo", "sage", "notary", "centaur", "herald", "forger", "poacher", "rustler", "cutpurse", "pickpocket", "drifter", "farrier", "spooker", "herder", "oxpecker", "latecomer", "sentry", "eavesdropper", "biter"]);
    // A twin acts in its original's turn: one public turn for the pair, and the original's turn even if only the twin is in the deck.
    expect(nightTurns(["sage", "moonsage", "centaur"])).toEqual(["sage", "centaur"]);
    expect(nightTurns(["moonsage", "centaur"])).toEqual(["sage", "centaur"]);
  });
  it("retires Sagittarius, the Augur, the Hybrid and the Wildwood creatures; the Pyre is a team, Cuckoo and Oxpecker are loners", () => {
    for (const id of ["sagittarius", "augur", "hybrid", "sporeling", "moth", "elderbark"]) expect(ROLE[id]).toBeUndefined();
    expect(ROLES.filter(r => r.team === "pyre").map(r => r.id)).toEqual(["phoenix", "kindler", "lure", "falsewitness", "embercarrier", "heavyhand", "heir"]);
    expect(ROLES.filter(r => r.team === "loner").map(r => r.id)).toEqual(["cuckoo", "oxpecker"]);
    expect(ROLES.every(r => r.max >= 12)).toBe(true); // any number of copies of any card
    // Every Kindler kind (and the Phoenix) acts in one shared turn, so the timetable never tells them apart.
    expect(nightTurns(["phoenix", "lure", "heir", "centaur"])).toEqual(["kindler", "centaur"]);
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
    // The evidence amendment: every public artefact must be one a defector could have made.
    expect(deckProblem([...base.slice(1), "sentry", "herald"], 5, 3)).toMatch(/Herald needs a Forger/);
    expect(deckProblem([...base.slice(1), "sentry", "paleherald"], 5, 3)).toMatch(/Herald needs a Forger/);
    expect(deckProblem([...base.slice(1), "sentry", "signet"], 5, 3)).toMatch(/forges seals/);
    expect(deckProblem([...base.slice(1), "notary", "falsewitness"], 5, 3)).toBeNull();
    expect(deckProblem([...base.slice(1), "signet", "counterfeiter"], 5, 3)).toBeNull();
    expect(deckProblem([...base, "moonthief"], 5, 3)).toBeNull(); // the day swap is off by default
    expect(deckProblem([...base, "moonthief"], 5, 3, { daySwap: true })).toMatch(/Moon-Thief needs 7 or more/);
    expect(deckProblem([...base, "moonthief"], 5, 3, { daySwap: true, thiefMinPlayers: 5 })).toBeNull();
    expect(deckProblem(["glamour", "glamour", "glamour", "sage", "sage", "sage", "centaur", "centaur"], 5, 3)).toBeNull();
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
    expect(DEFAULT_RULES).toMatchObject({ bloodPrice: true, census: "all", dawnProclamations: true, burningDeniesWolves: true, phoenixKnowsKindlers: false, pyreFallback: "kindler" });
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
    const s = state(["herald", "sage", "centaur"], ["werewolf", "werewolf", "rustler"]);
    expect(validPlan(ROLE.herald, "proclaim", 0, { players: 3, center: 3 }, always(C(0)))).toMatch(/Choose 2/);
    const ev = act(s, 0, { proclaim: always(C(0), C(1)) }, 4)[0];
    // Never one card's identity: "at least one of these two is a Werewolf", published as the Herald's.
    expect(s.shown).toEqual([{ slots: [C(0), C(1)], role: "werewolf", by: "herald", turn: 4, atDawn: true }]);
    expect(ev.ev).toEqual({ kind: "announce", slots: [C(0), C(1)], roles: ["werewolf"], atDawn: true });
    expect(visibleShown(s)).toEqual([]);
    dawn(s, [...s.dealt, ...s.dealtCenter], 9, rng());
    expect(visibleShown(s)).toHaveLength(1);
    const now = state(["herald", "sage", "centaur"], ["werewolf", "centaur", "rustler"], { dawnProclamations: false });
    act(now, 0, { proclaim: always(C(0), C(2)) }, 4);
    expect(visibleShown(now)).toHaveLength(1);
    expect(["werewolf", "rustler"]).toContain(now.shown[0].role);
    // A Pale Herald's proclamation is labelled the Herald's too: nothing tells them apart.
    const pale = state(["paleherald", "sage", "centaur"], ["werewolf", "centaur", "rustler"]);
    act(pale, 0, { proclaim: always(C(0), C(1)) }, 4);
    expect(pale.shown[0].by).toBe("herald");
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
    expect(g.map(e => e.ev.kind)).toEqual(["seats", "census", "distort"]);
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
    const made = act(s, 1, { proclaim: always(C(1), C(2)) })[0];
    expect(made.hidden).toEqual({ cards: ["werewolf", "sentry"], truth: ["centaur", "sentry"] });
    expect(["werewolf", "sentry"]).toContain(s.shown[0].role);
    act(s, 0, glam(P(0), "centaur"));
    act(s, 2, { peek: always(P(0)), trade: decide({ kind: "do" }) }); // the Rustler takes the glamoured card
    expect(s.cards[2]).toBe("glamour");
    expect(s.tokens).toMatchObject({ p2: { distort: "centaur" } });
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
    const s = state(["herald", "forger", "sage"], ["werewolf", "werewolf", "rustler"]);
    act(s, 0, { proclaim: always(C(0), C(1)) }, 5);
    const f = act(s, 1, { forge: decide({ kind: "pick", targets: [C(1), C(2)], role: "sage" }) }, 6);
    expect(f.map(e => e.ev)).toEqual([{ kind: "witness", by: "herald", slots: [C(0), C(1)], roles: ["werewolf"] }, { kind: "forge", slots: [C(1), C(2)], roles: ["sage"], as: "herald" }]);
    // The forgery is the same artefact as a real proclamation; only the hidden flag differs.
    expect(s.shown[1]).toEqual({ slots: [C(1), C(2)], role: "sage", by: "herald", turn: 6, atDawn: true, forged: true });
    expect(visibleShown(s)).toEqual([]);
    dawn(s, [...s.dealt, ...s.dealtCenter], 9, rng());
    expect(visibleShown(s).map(x => x.role).sort()).toEqual(["sage", "werewolf"]);
  });
  it("forges a pair of centre cards, and sees that nothing was proclaimed when the Herald is unheld", () => {
    const s = state(["forger", "sage", "centaur"], ["herald", "centaur", "rustler", "sentry", "chiron"]);
    expect(validPlan(ROLE.forger, "forge", 0, { players: 3, center: 5, deck: [...s.dealt, ...s.dealtCenter] }, decide({ kind: "pick", targets: [C(0)], role: "sage" }))).toMatch(/Choose 2/);
    expect(act(s, 0, { forge: decide({ kind: "pick", targets: [C(0), C(1)], role: "sage" }) })[0].ev).toEqual({ kind: "witness", by: "herald", slots: [], roles: [] });
    expect(s.shown).toHaveLength(1);
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
    expect(s.bitten).toEqual([{ seat: 1, by: 0 }]);
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
    expect(s.bitten).toEqual([]);
  });
});

describe("creatures at night", () => {
  it("gathers the brood: every Kindler learns where the Phoenix was dealt and who the Kindlers are; the Phoenix only under the rule", () => {
    const s = state(["phoenix", "kindler", "lure", "werewolf", "sage"], ["heir", "centaur", "sentry"]);
    expect(act(s, 1).map(e => e.ev)).toEqual([{ kind: "seats", label: "The Phoenix (as dealt)", seats: [0] }, { kind: "seats", label: "Fellow Kindlers", seats: [2] }]);
    expect(act(s, 0)).toEqual([]);
    const told = state(["phoenix", "kindler", "lure", "werewolf", "sage"], ["heir", "centaur", "sentry"], { phoenixKnowsKindlers: true });
    expect(act(told, 0).map(e => e.ev)).toEqual([{ kind: "seats", label: "Your Kindlers", seats: [1, 2] }]);
  });
  it("lets the Lure dress the Phoenix as a Werewolf, so an honest read accuses it", () => {
    const s = state(["phoenix", "lure", "sage", "werewolf"], ["centaur", "herald", "sentry"]);
    act(s, 1, { lure: decide({ kind: "pick", targets: [P(0)], role: "werewolf" }) });
    expect(act(s, 2, { read: always(P(0)) })[0].ev).toMatchObject({ roles: ["werewolf"] });
  });
  it("turns an Heir's card into a Phoenix at dawn when no player holds one, and tells its holder", () => {
    const s = state(["heir", "sage", "werewolf"], ["phoenix", "centaur", "sentry"]);
    const notes = dawn(s, [], 9, rng());
    expect(notes).toEqual([{ turn: 9, seat: 0, role: "heir", step: "dawn", via: "auto", ev: { kind: "heir" } }]);
    expect(isPhoenix(s, 0)).toBe(true);
    const held = state(["heir", "phoenix", "werewolf"], ["sage", "centaur", "sentry"]);
    expect(dawn(held, [], 9, rng())).toEqual([]);
  });
  it("carries the ember at night: the Ember-Carrier blindly swaps two other players' cards in the brood's turn, before any talk", () => {
    const s = state(["embercarrier", "phoenix", "werewolf", "sage"], ["centaur", "herald", "sentry"]);
    const log = act(s, 0, { carry: always(P(1), P(3)) });
    expect(log.map(e => e.ev.kind)).toEqual(["seats", "seats", "swap"]);
    expect(s.cards).toEqual(["embercarrier", "sage", "werewolf", "phoenix"]);
    expect(ROLE.embercarrier.steps![1].optional).toBeUndefined();
    expect(turnKey("embercarrier")).toBe("kindler");
  });
  it("lays the Cuckoo's egg (public at dawn) and the Oxpecker's bond (private); an unheld Cuckoo's egg is laid at random", () => {
    const s = state(["cuckoo", "oxpecker", "sage", "werewolf"], ["herald", "centaur", "sentry"]);
    act(s, 0, { peek: always(P(3)), egg: always(P(2)) });
    act(s, 1, { bond: always(P(3)) });
    expect(s.marks).toEqual({ 0: 2, 1: 3 }); // keyed by card instance: seat s's dealt card is instance s
    expect(publicMarks(s)).toEqual([]);
    dawn(s, [...s.dealt, ...s.dealtCenter], 9, rng());
    expect(publicMarks(s)).toEqual([{ role: "cuckoo", seat: 2, label: "The egg" }]);
    const unheld = state(["sage", "centaur", "werewolf"], ["cuckoo", "herald", "sentry"]);
    const notes = dawn(unheld, [...unheld.dealt, ...unheld.dealtCenter], 9, rng());
    expect(notes[0]).toMatchObject({ seat: -1, role: "cuckoo", ev: { kind: "mark", unheld: true, public: true } });
    expect(unheld.marks[3]).toBeGreaterThanOrEqual(0); // the first centre card is instance 3
  });
  it("swaps two seats' cards (and card instances) for the Moon-Thief", () => {
    const s = state(["moonthief", "phoenix", "centaur", "sage"], ["werewolf", "herald", "sentry"]);
    expect(daySwap(s, 1, 2)).toEqual({ kind: "daySwap", a: 1, b: 2 });
    expect(s.cards).toEqual(["moonthief", "centaur", "phoenix", "sage"]);
    expect(s.inst).toEqual([0, 2, 1, 3]);
  });
  it("plays a whole night of the full ecosystem without breaking, at every seed", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const deck = shuffle(["werewolf", "eavesdropper", "biter", "stalkinghorse", "sage", "herald", "centaur", "echo", "gleaner", "phoenix", "lure", "cuckoo", "oxpecker"], rng(seed));
      const s = dealFixed(deck, 7);
      night(s, {}, seed);
      expect(s.dawn).toBe(true);
      expect([...s.cards, ...s.center].sort()).toEqual([...deck].sort());
      expect(Object.keys(s.marks).length).toBeGreaterThanOrEqual(1);
      for (const c of ["echo", "gleaner"]) { const seat = s.dealt.indexOf(c); if (seat >= 0) expect(s.adopted[String(seat)], `${seed} ${c}`).toBeDefined(); }
    }
  });
});

describe("duplicates and card instances", () => {
  it("lets several holders of one role act in the same turn, each with their own result", () => {
    const s = state(["sage", "sage", "werewolf", "centaur"], ["herald", "centaur", "rustler"]);
    expect(act(s, 0, { read: always(P(2)) })[0].ev).toMatchObject({ roles: ["werewolf"] });
    expect(act(s, 1, { read: always(P(3)) })[0].ev).toMatchObject({ roles: ["centaur"] });
  });
  it("binds a mark to the card instance, so two Cuckoos' eggs stay apart wherever the cards go", () => {
    const s = state(["cuckoo", "cuckoo", "rustler", "sage", "werewolf"], ["herald", "centaur", "sentry"]);
    act(s, 0, { peek: always(P(3)), egg: always(P(3)) });
    act(s, 1, { peek: always(P(3)), egg: always(P(4)) });
    act(s, 2, { peek: always(P(0)), trade: decide({ kind: "do" }) }); // the first Cuckoo card goes to seat 2
    expect(s.inst).toEqual([2, 1, 0, 3, 4]);
    // seat 4 (werewolf) is voted out: only the holder of the SECOND Cuckoo card (instance 1, seat 1) wins by its egg.
    const o = resolveVote(s.cards, [4, 4, 4, 4, 0], { marks: s.marks, held: s.inst });
    expect(o.deaths).toEqual([4]);
    expect(o.winners).toContain(1);
    expect(o.winners).not.toContain(2);
  });
});

describe("shadow twins", () => {
  it("acts in its original's turn with the original's steps, truthfully", () => {
    const s = state(["moonsage", "sage", "werewolf", "centaur"], ["herald", "centaur", "rustler"]);
    expect(turnKey("moonsage")).toBe("sage");
    expect(act(s, 0, { read: always(P(2)) })[0].ev).toEqual({ kind: "look", slots: [P(2)], roles: ["werewolf"] });
  });
  it("passes for its original under a look if it is that kind of twin, and counts as a Werewolf only if tagged", () => {
    const s = state(["sage", "moonsage", "duncentaur", "centaur"], ["herald", "centaur", "rustler"]);
    const read = (t: number) => act(dealFixed([...s.dealt, ...s.dealtCenter], 4), 0, { read: always(P(t)) })[0];
    expect(read(1).ev).toMatchObject({ roles: ["sage"] });
    expect(read(1).hidden).toEqual({ truth: ["moonsage"] });
    expect(read(2).ev).toMatchObject({ roles: ["duncentaur"] });
    expect(resolveVote(["moonsage", "centaur", "sage"], [1, 0, 0]).winningTeam).toBe("nobody"); // an ally falls, no wolf held
    expect(resolveVote(["duncentaur", "centaur", "sage"], [1, 0, 0]).winningTeam).toBe("centaur");
    expect(ROLE.moonsage.rules).toMatch(/Sage's turn.*not a Werewolf.*shows a Sage/);
  });
});

describe("card stealers", () => {
  it("Cutpurse and Drifter must swap, then see what they took; Pickpocket and Latecomer swap blind", () => {
    const s = state(["cutpurse", "pickpocket", "drifter", "latecomer", "werewolf"], ["herald", "centaur", "sentry"]);
    expect(act(s, 0, { steal: always(P(4)) }).map(e => e.ev)).toEqual([{ kind: "swap", a: P(0), b: P(4) }, { kind: "look", slots: [P(0)], roles: ["werewolf"] }]);
    expect(act(s, 1, { lift: always(P(0)) }).map(e => e.ev.kind)).toEqual(["swap"]);
    expect(act(s, 2, { drift: always(C(0)) }).map(e => e.ev)).toEqual([{ kind: "swap", a: P(2), b: C(0) }, { kind: "look", slots: [P(2)], roles: ["herald"] }]);
    expect(act(s, 3, { swap: always(P(2)) }).map(e => e.ev.kind)).toEqual(["swap"]);
    for (const r of ["cutpurse", "pickpocket", "drifter", "latecomer", "poacher"]) expect(ROLE[r].steps!.every(st => !st.optional), r).toBe(true);
  });
  it("the Poacher's swap carries the Werewolf team to its victim", () => {
    const s = state(["poacher", "sage", "werewolf"], ["herald", "centaur", "sentry"]);
    act(s, 0, { poach: always(P(1)) });
    expect(resolveVote(s.cards, [2, 2, 1]).teams).toEqual(["centaur", "werewolf", "werewolf"]);
  });
});

describe("distortion", () => {
  it("Will-o'-Wisp: a random wrong role, drawn once, the same for every look; the log keeps both", () => {
    const s = state(["wisp", "sage", "notary", "werewolf"], ["herald", "centaur", "sentry"]);
    const cast = act(s, 0, { wisp: always(P(3)) })[0];
    expect(cast.ev).toEqual({ kind: "distort", slot: P(3), role: null });
    const shown = cast.hidden!.role!;
    expect(shown).not.toBe("werewolf");
    expect(act(s, 1, { read: always(P(3)) })[0].ev).toMatchObject({ roles: [shown] });
    expect(act(s, 2, { read: always(P(3), P(1)) })[0].ev).toMatchObject({ roles: [shown, "sage"] });
  });
  it("Mistweaver: one viewer's centre looks show the named role; player reads, team-only looks too, and conditional plans follow what was seen", () => {
    const s = state(["mistweaver", "farrier", "centaur", "werewolf"], ["sage", "centaur", "sentry"]);
    act(s, 0, { veil: decide({ kind: "pick", targets: [P(1)], role: "werewolf" }) });
    // The Farrier sees a "Werewolf" in centre 3 (truly the Sentry) and its plan branches on that.
    const f = act(s, 1, { peek: always(C(2)), shoe: { branches: [{ roles: ["werewolf"], decision: { kind: "skip" } }], otherwise: pick(P(1)) } });
    expect(f[0].ev).toMatchObject({ roles: ["werewolf"] });
    expect(f[0].hidden).toEqual({ truth: ["sentry"] });
    expect(f[1].ev.kind).toBe("skip");
    expect(act(s, 2, { glance: always(C(2)) })[0].ev).toMatchObject({ roles: ["sentry"] }); // another viewer: the truth
  });
  it("Fogbank: a random wrong role at each centre look by its victim; the Werewolf team and the Herder's count see the truth", () => {
    const s = state(["fogbank", "centaur", "werewolf", "herder"], ["werewolf", "sage", "sentry"]);
    act(s, 0, { fog: always(P(1)) });
    expect((act(s, 1, { glance: always(C(0)) })[0].ev as { roles: string[] }).roles[0]).not.toBe("werewolf");
    s.veils["3"] = { role: "centaur" };
    expect(act(s, 3)[0].ev).toMatchObject({ n: 1 });
  });
  it("stacks in a fixed order: twin disguise, then the latest card distortion, then the viewer's veil", () => {
    const s = state(["glamour", "wisp", "centaur", "sage"], ["moonsage", "centaur", "sentry"]);
    s.tokens.c0 = { distort: "herald" };
    s.veils["2"] = { role: "rustler" };
    expect(act(s, 3, {}).length).toBe(0); // the Sage has not chosen yet
    expect(act(s, 2, { glance: always(C(0)) })[0].ev).toMatchObject({ roles: ["rustler"] });
    delete s.veils["2"];
    expect(act(dealFixed([...s.dealt, ...s.dealtCenter], 4), 2, { glance: always(C(0)) })[0].ev).toMatchObject({ roles: ["sage"] }); // twin passes
  });
});

describe("table rules for passivity", () => {
  it("makes optional steps mandatory under the rule: no skip in plans or in forced moves", () => {
    const s = state(["rustler", "sage", "werewolf"], ["herald", "centaur", "sentry"], { mandatorySteps: true });
    const shape = shapeOf(s);
    expect(validDecision(ROLE.rustler.steps![1], 0, shape, { kind: "skip" })).toMatch(/mandatory/);
    for (let seed = 1; seed < 50; seed++) expect(randomDecision(ROLE.rustler.steps![1], 0, shape, rng(seed)).kind).toBe("do");
  });
  it("forces a uniformly random move over every legal decision, multi-target and declining included", () => {
    const shape = { players: 4, center: 3 };
    const step = ROLE.spooker.steps![0];
    expect(decisionCount(step, 0, shape)).toBe(6 * 5 * 4);
    const farrier = ROLE.farrier.steps![1]; // two targets or decline: 3 options
    let skips = 0; const N = 30000, r = rng(11);
    for (let i = 0; i < N; i++) if (randomDecision(farrier, 0, shape, r).kind === "skip") skips++;
    expect(skips / N).toBeCloseTo(1 / 3, 1.5);
    const g = ROLE.glamour.steps![1], deck = ["glamour", "sage", "centaur", "werewolf", "herald", "sentry", "rustler"];
    expect(decisionCount(g, 0, { ...shape, deck })).toBe(7 * 7);
  });
});

describe("scenario replay", () => {
  it("a seeded night is fully deterministic: random distortions, ghost results, the unheld egg, forced moves and proclamation order", () => {
    const deck = ["wisp", "fogbank", "eavesdropper", "herald", "forger", "centaur", "rustler", "cuckoo", "sentry", "sage"];
    const run = () => {
      const s = dealFixed(deck, 6);
      const log: LogEntry[] = [];
      const seats: NightSeat[] = s.dealt.map(() => ({ plan: {}, progress: freshProgress() }));
      nightTurns(deck).forEach((role, turn) => log.push(...runTurn(s, role, seats, turn + 1, seededRng(1000 + turn), log, { force: true })));
      log.push(...dawn(s, deck, 99, seededRng(77)));
      return JSON.stringify({ log, shown: s.shown, marks: s.marks, cards: s.cards, center: s.center });
    };
    expect(run()).toBe(run());
  });
});

describe("copiers (adopt)", () => {
  const go = (dealt: string[], center: string[], plans: Record<number, Plan> = {}, adoptPlans: Record<number, Record<string, Plan>> = {}, rules = {}) => { const s = state(dealt, center, rules); const log = night(s, plans, 3, adoptPlans); return { s, log }; };
  it("Gleaner copies a centre card and acts in that role's turn with the plan queued for it", () => {
    const { s, log } = go(["gleaner", "werewolf", "centaur"], ["sage", "herald", "sentry"], { 0: { glean: always(C(0)) } }, { 0: { sage: { read: always(P(1)) } } });
    expect(s.adopted).toEqual({ 0: "sage" });
    const mine = log.filter(e => e.seat === 0).map(e => [e.role, e.ev.kind]);
    expect(mine).toEqual([["gleaner", "look"], ["gleaner", "adopt"], ["sage", "look"]]);
    expect(log.find(e => e.seat === 0 && e.role === "sage")!.ev).toMatchObject({ roles: ["werewolf"] });
    expect(actingRole(s, 0)).toBe("sage");
  });
  it("Echo copies a player's card; copying a Werewolf counts as one at the count, sees the pack, and the pack does not see it", () => {
    const { s, log } = go(["echo", "werewolf", "centaur", "sage"], ["herald", "centaur", "sentry"], { 0: { echo: always(P(1)) } });
    expect(s.adopted).toEqual({ 0: "werewolf" });
    expect(log.find(e => e.seat === 1 && e.ev.kind === "seats")!.ev).toMatchObject({ seats: [] }); // the pack does not learn the copier
    expect(log.find(e => e.seat === 0 && e.role === "werewolf" && e.ev.kind === "seats")!.ev).toMatchObject({ seats: [1] });
    expect(resolveVote(heldRoles(s), [1, 0, 0, 0]).winningTeam).toBe("centaur"); // the original Werewolf falls
    expect(resolveVote(heldRoles(s), [2, 0, 0, 0]).wolvesDown).toBe(1); // the copier itself counts as a Werewolf
  });
  it("copies the TRUE card under a distortion (the log keeps what was seen)", () => {
    // Every distortion card wakes after the copiers, so the distortion is laid by hand here.
    const s = state(["echo", "werewolf", "centaur"], ["sage", "herald", "sentry"]);
    s.tokens.p1 = { distort: "sage" };
    const log = act(s, 0, { echo: always(P(1)) });
    expect(log[0].ev).toMatchObject({ roles: ["sage"] });
    expect(log[0].hidden?.truth).toEqual(["werewolf"]);
    expect(log[1].ev).toEqual({ kind: "adopt", role: "werewolf" });
  });
  it("copying a role with no night action gives its powers and win, nothing more at night", () => {
    const { s } = go(["echo", "phoenix", "centaur"], ["sage", "herald", "kindler"], { 0: { echo: always(P(1)) } });
    expect(s.adopted["0"]).toBe("phoenix");
    expect(isPhoenix(s, 0)).toBe(true);
    const o = resolveVote(heldRoles(s), [1, 0, 0], { phoenix: s.inst.map(i => isPhoenix(s, i)) });
    expect(o).toMatchObject({ deaths: [0], burned: true, teams: ["pyre", "pyre", "centaur"] });
    expect(o.winners).toEqual([0, 1]);
  });
  it("copying a copier takes what it became (or a spent copier); copying a twin takes the twin", () => {
    const a = go(["gleaner", "echo", "werewolf"], ["herald", "sage", "sentry"], { 0: { glean: always(C(1)) }, 1: { echo: always(P(0)) } }).s;
    expect(a.adopted).toEqual({ 0: "sage", 1: "sage" });
    const b = go(["echo", "moonsage", "centaur"], ["herald", "werewolf", "sentry"], { 0: { echo: always(P(1)) } }).s;
    expect(b.adopted["0"]).toBe("moonsage");
    expect(heldRoles(b)[0]).toBe("moonsage");
  });
  it("the copy is on the card: if it moves, its new holder holds the copy; a look at it shows the copier's face", () => {
    const { s } = go(["echo", "rustler", "werewolf", "sage"], ["herald", "centaur", "sentry"], { 0: { echo: always(P(2)) }, 1: { peek: always(P(0)), trade: decide({ kind: "do" }) } });
    expect(s.cards[1]).toBe("echo");
    expect(heldRoles(s)[1]).toBe("werewolf");
    const read = act(s, 3, { read: always(P(1)) })[0].ev;
    expect(read).toMatchObject({ roles: ["echo"] });
  });
  it("copies of cards with per-card state get their own: a copied Cuckoo lays its own egg", () => {
    const { s } = go(["echo", "cuckoo", "sage", "werewolf"], ["herald", "centaur", "sentry"], { 0: { echo: always(P(1)) }, 1: { peek: always(P(2)), egg: always(P(2)) } }, { 0: { cuckoo: { peek: always(P(3)), egg: always(P(3)) } } });
    expect(s.marks).toEqual({ 0: 3, 1: 2 });
  });
  it("forced random moves cover every adopted step", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = state(["echo", "rustler", "werewolf", "sage"], ["herald", "centaur", "sentry"]);
      const log = night(s, {}, seed);
      const became = s.adopted["0"];
      const steps = ROLE[became].steps?.filter(st => !st.onlyIfAlone).length ?? 0;
      expect(log.filter(e => e.seat === 0 && e.role === became).length, `${seed} ${became}`).toBeGreaterThanOrEqual(Math.min(1, steps));
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
      expect(resolveVote(["werewolf", "phoenix", "centaur", "sage"], [1, 0, 0, 1], { rules: { burningDeniesWolves: false } }).winningTeam).toBe("centaur");
      expect(resolveVote(["werewolf", "cuckoo", "centaur", "sage"], [1, 0, 0, 1]).winningTeam).toBe("centaur");
      expect(resolveVote(["werewolf", "sage", "centaur", "centaur"], [1, 0, 0, 1], { bitten: { seat: 1, by: 0 } }).winningTeam).toBe("centaur");
    });
  });

  describe("the Pyre and loners: one ordered list, each pair tested", () => {
    it("a burning wins for every Pyre card's holder, alive or dead", () => {
      const o = resolveVote(["phoenix", "kindler", "werewolf", "centaur", "sage"], [4, 0, 0, 0, 0]);
      expect(o).toMatchObject({ deaths: [0], burned: true });
      expect(o.winners).toEqual([0, 1]);
      expect(o.why[1]).toMatch(/^Won: .*Pyre.*a player holding a Phoenix was eliminated/);
    });
    it("burning v. Werewolf win: denied by default, alongside when the rule is off", () => {
      const cards = ["phoenix", "kindler", "werewolf", "centaur", "sage"], votes = [4, 0, 0, 0, 0];
      expect(resolveVote(cards, votes)).toMatchObject({ winningTeam: "nobody", winners: [0, 1] });
      expect(resolveVote(cards, votes, { rules: { burningDeniesWolves: false } })).toMatchObject({ winningTeam: "werewolf", winners: [0, 1, 2] });
    });
    it("burning v. Centaur win: kept when a Werewolf also fell (Blood Price as usual)", () => {
      const o = resolveVote(["phoenix", "werewolf", "centaur", "sage", "kindler"], [1, 0, 0, 1, 2]);
      expect(o).toMatchObject({ deaths: [0, 1], winningTeam: "centaur", burned: true, wolvesDown: 1, centaursDown: 0 });
      expect(o.winners).toEqual([0, 2, 3, 4]);
      // A Werewolf and a Centaur fell with the Phoenix: Blood Price makes it no Centaur win, and the burning denies the wolves.
      const tie = resolveVote(["phoenix", "werewolf", "centaur", "sage"], [1, 2, 0, 0], { rules: { eliminationVotes: 1 } });
      expect(tie).toMatchObject({ winningTeam: "nobody", burned: true, winners: [0] });
    });
    it("burning v. Stalking Horse: the burning denies the decoy's win", () => {
      expect(resolveVote(["phoenix", "stalkinghorse", "centaur", "werewolf"], [1, 0, 0, 1])).toMatchObject({ deaths: [0, 1], winningTeam: "nobody", winners: [0] });
      expect(resolveVote(["phoenix", "stalkinghorse", "centaur", "werewolf"], [1, 0, 0, 1], { rules: { burningDeniesWolves: false } })).toMatchObject({ winningTeam: "werewolf" });
    });
    it("burning v. no Werewolf held: the Centaurs cannot win (someone fell), the Pyre does", () => {
      expect(resolveVote(["phoenix", "centaur", "sage"], [1, 0, 0])).toMatchObject({ winningTeam: "nobody", winners: [0] });
    });
    it("Pyre cards are not Centaurs under Blood Price", () => {
      expect(resolveVote(["werewolf", "kindler", "centaur", "sage"], [1, 0, 0, 1], { rules: { burningDeniesWolves: false } })).toMatchObject({ deaths: [0, 1], winningTeam: "centaur", centaursDown: 0 });
    });
    it("no Phoenix held: by default a Kindler's elimination counts as the burning; under the other rule the Pyre cannot win", () => {
      expect(resolveVote(["kindler", "werewolf", "centaur"], [1, 0, 0])).toMatchObject({ deaths: [0], burned: true, winners: [0] });
      expect(resolveVote(["kindler", "werewolf", "centaur"], [1, 0, 0], { rules: { pyreFallback: "none" } })).toMatchObject({ burned: false, winningTeam: "werewolf", winners: [1] });
    });
    it("an Heir's card turned Phoenix burns like one (passed as phoenix seats)", () => {
      expect(resolveVote(["heir", "werewolf", "centaur"], [1, 0, 0], { phoenix: [true, false, false] })).toMatchObject({ burned: true, winners: [0] });
    });
    it("the Heavy Hand's vote counts double, whoever it goes to", () => {
      expect(resolveVote(["heavyhand", "phoenix", "werewolf", "centaur"], [1, 2, 1, 2]).tally).toEqual([0, 3, 2, 0]);
      expect(resolveVote(["heavyhand", "phoenix", "werewolf", "centaur"], [2, 2, 1, 1]).tally).toEqual([0, 2, 3, 0]);
    });
    it("a bitten Pyre card's holder plays for the wolves; the card still burns", () => {
      const o = resolveVote(["phoenix", "werewolf", "kindler", "centaur"], [3, 0, 0, 0], { bitten: { seat: 0, by: 1 } });
      expect(o).toMatchObject({ deaths: [0], burned: true, teams: ["werewolf", "werewolf", "pyre", "centaur"], winners: [2] });
    });
    it("loners after everything: the Cuckoo by its egg, then the Oxpecker with its host (even a Pyre host)", () => {
      const o = resolveVote(["cuckoo", "phoenix", "kindler", "oxpecker", "werewolf", "centaur"], [1, 0, 1, 1, 1, 1], { marks: { cuckoo: 1, oxpecker: 2 } });
      expect(o.winners).toEqual([0, 1, 2, 3]);
      expect(resolveVote(["cuckoo", "werewolf", "centaur"], [1, 2, 1], { marks: { cuckoo: 1 } }).winners).toEqual([0, 2]);
      expect(resolveVote(["cuckoo", "werewolf", "centaur"], [2, 0, 0], { marks: { cuckoo: 1 } }).winners).toEqual([1]);
    });
    it("Werewolf and Centaur tied: the Werewolves win (the case Blood Price exists for)", () => {
      expect(resolveVote(["werewolf", "centaur", "sage"], [1, 0, 1]).winningTeam).toBe("werewolf");
    });
    it("Stalking Horse and Werewolf tied: the Werewolf team wins by rule (a)", () => {
      const o = resolveVote(["stalkinghorse", "werewolf", "centaur", "sage"], [1, 0, 0, 1]);
      expect(o).toMatchObject({ deaths: [0, 1], winningTeam: "werewolf", winners: [0, 1] });
      expect(o.headline).toMatch(/Stalking Horse was eliminated.*even though a Werewolf fell too/);
    });
    it("an Oxpecker bonded to a seat later bitten wins with the wolves, unknowingly", () => {
      const o = resolveVote(["oxpecker", "sage", "werewolf", "centaur"], [3, 3, 3, 1], { bitten: { seat: 1, by: 2 }, marks: { oxpecker: 1 } });
      expect(o).toMatchObject({ deaths: [3], winningTeam: "werewolf", winners: [0, 1, 2] });
    });
  });

  it("explains every seat's result in one sentence that starts with Won or Lost", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = rng(seed);
      const cards = shuffle(["werewolf", "stalkinghorse", "sage", "centaur", "phoenix", "kindler", "cuckoo", "oxpecker", "heavyhand"], r).slice(0, 7);
      const votes = cards.map((_, i) => { let v = Math.floor(r() * 6); if (v >= i) v++; return v; });
      const o = resolveVote(cards, votes, { marks: { cuckoo: 1, oxpecker: 2 }, bitten: seed % 3 ? null : { seat: 4, by: 0 } });
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
    const deck = ["werewolf", "moonthief", "sage", "centaur", "centaur", "rustler", "sentry", "farrier"];
    expect(availability(COMMAND["game.start"], { ...lobby, players: 5, deck, rules: { ...DEFAULT_RULES, daySwap: true } })).toMatchObject({ ok: false, reason: expect.stringMatching(/Moon-Thief needs 7/) });
    expect(availability(COMMAND["game.start"], { ...lobby, players: 5, deck, rules: { ...DEFAULT_RULES, daySwap: true, thiefMinPlayers: 5 } })).toEqual({ ok: true });
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
  it("declares for every command whether others can perceive it", () => {
    for (const c of COMMANDS) expect(typeof (c as { perceivable?: unknown }).perceivable, c.id).toBe("boolean");
    expect(COMMAND["chat.send"].perceivable).toBe(true);
    expect(COMMAND["night.planStep"].perceivable).toBe(false);
    expect(COMMAND["day.cutLine"].perceivable).toBe(false);
  });
  it("opens the vote only in the vote phase, and says how to get there", () => {
    const day = { ...lobby, phase: "day" as const, seated: true }, vote = { ...day, phase: "vote" as const };
    expect(availability(COMMAND["day.vote"], day)).toMatchObject({ ok: false, hidden: false, reason: expect.stringMatching(/day_ready/) });
    expect(availability(COMMAND["day.vote"], vote)).toEqual({ ok: true });
    expect(availability(COMMAND["day.ready"], day)).toEqual({ ok: true });
    expect(availability(COMMAND["chat.send"], vote)).toMatchObject({ ok: false, reason: expect.stringMatching(/closed during the vote/) });
    expect(availability(COMMAND["chat.send"], { ...vote, rules: { ...DEFAULT_RULES, chatDuringVote: true } })).toEqual({ ok: true });
    expect(availability(COMMAND["day.queueSwap"], { ...vote, dayPower: "swap" })).toEqual({ ok: true });
  });
  it("offers seals and the cut only to the cards that have them", () => {
    const day = { ...lobby, phase: "day" as const, seated: true, deck: ["signet", "notary", "counterfeiter", "hush", "werewolf"] };
    expect(availability(COMMAND["chat.sendReport"], { ...day, chatPower: "report" })).toEqual({ ok: true });
    expect(availability(COMMAND["chat.forgeSeal"], { ...day, chatPower: "forge" }, { as: "notary", seat: 1, seat2: 2, card: "werewolf" })).toEqual({ ok: true });
    expect(availability(COMMAND["chat.forgeSeal"], { ...day, chatPower: "forge" }, { as: "notary", seat: 1, card: "werewolf" })).toMatchObject({ ok: false, reason: expect.stringMatching(/seat2/) });
    expect(availability(COMMAND["chat.forgeSeal"], { ...day, chatPower: "forge" }, { as: "notary", seat: 1, seat2: 1, card: "werewolf" })).toMatchObject({ ok: false, reason: expect.stringMatching(/two different/) });
    expect(availability(COMMAND["chat.forgeSeal"], { ...day, chatPower: "forge", deck: ["werewolf"] }, { as: "signet", text: "x" })).toMatchObject({ ok: false, reason: expect.stringMatching(/no Signet in this deck/) });
    expect(availability(COMMAND["chat.forgeSeal"], { ...day, chatPower: "report" })).toMatchObject({ ok: false, hidden: true });
    expect(availability(COMMAND["day.cutLine"], { ...day, dayPower: "cut" })).toEqual({ ok: true });
    expect(availability(COMMAND["day.cutLine"], { ...day, phase: "vote", dayPower: "cut", rules: { ...DEFAULT_RULES, cutDuringVote: false } })).toMatchObject({ ok: false });
    expect(availability(COMMAND["day.cutLine"], day)).toMatchObject({ ok: false, hidden: true });
    expect(toolDefinitions("act").find(t => t.name === "chat_forgeSeal")?.inputSchema).toMatchObject({ type: "object" });
    expect(toolDefinitions("host").some(t => t.name === "presence_heartbeat")).toBe(false);
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
