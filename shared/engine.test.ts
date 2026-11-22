import { describe, expect, it } from "vitest";
import { availability, COMMAND, COMMANDS, HOME_CONTEXT, toolDefinitions } from "./commands";
import { advance, deal, deckProblem, freshProgress, nightTurns, resolvePlan, resolveVote, uncovered, validPlan, type GameState, type Plan, type StepPlan } from "./engine";
import { recommendedDeck, ROLE, ROLES, type Slot } from "./roles";

const rng = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const P = (i: number): Slot => ({ k: "p", i });
const C = (i: number): Slot => ({ k: "c", i });
const state = (dealt: string[], center: string[]): GameState => ({ dealt, cards: [...dealt], center, moved: [] });
const pick = (...targets: Slot[]) => ({ kind: "pick" as const, targets });

describe("deal", () => {
  it("deals every card once and three to the centre", () => {
    const deck = recommendedDeck(5);
    const s = deal(deck, 5, rng());
    expect(s.dealt).toHaveLength(5);
    expect(s.center).toHaveLength(3);
    expect([...s.dealt, ...s.center].sort()).toEqual([...deck].sort());
  });
  it("gives every night role in the deck one turn, in wake order, dealt or not", () => {
    expect(nightTurns(["villager", "sentry", "werewolf", "werewolf", "farrier", "sage"])).toEqual(["werewolf", "sage", "farrier", "sentry"]);
  });
  it("recommends a valid deck for 3 to 12 players", () => {
    for (let n = 3; n <= 12; n++) expect(deckProblem(recommendedDeck(n), n)).toBeNull();
  });
});

describe("plans", () => {
  const plan: StepPlan = { branches: [{ roles: ["werewolf", "whisperer"], decision: pick(P(0)) }], otherwise: pick(P(2)) };
  it("takes the first branch naming the seen card, else the otherwise decision", () => {
    expect(resolvePlan(plan, ["werewolf"])).toEqual(pick(P(0)));
    expect(resolvePlan(plan, ["villager"])).toEqual(pick(P(2)));
    expect(resolvePlan({ branches: plan.branches }, ["villager"])).toBeUndefined();
  });
  it("reports the outcomes a plan leaves open", () => {
    expect(uncovered({ branches: plan.branches }, ["werewolf", "villager", "sage"])).toEqual(["villager", "sage"]);
    expect(uncovered(plan, ["werewolf", "villager"])).toEqual([]);
  });
  it("rejects illegal targets and conditions on a step with nothing to see", () => {
    expect(validPlan(ROLE.sage, "read", 0, 4, { branches: [], otherwise: pick(P(0)) })).toMatch(/not allowed/);
    expect(validPlan(ROLE.sage, "read", 0, 4, { branches: [{ roles: ["werewolf"], decision: pick(P(1)) }] })).toMatch(/conditional/);
    expect(validPlan(ROLE.farrier, "shoe", 0, 4, plan)).toBeNull();
  });
});

describe("night", () => {
  it("runs a fully queued conditional plan in one go", () => {
    const s = state(["farrier", "villager", "sage"], ["werewolf", "villager", "courier"]);
    const plan: Plan = {
      peek: { branches: [], otherwise: pick(C(0)) },
      shoe: { branches: [{ roles: ["werewolf"], decision: pick(P(1)) }], otherwise: pick(P(0)) },
    };
    const p = freshProgress();
    const log = advance(s, 0, plan, p, 3, rng());
    expect(p.done).toBe(true);
    expect(s.cards[1]).toBe("werewolf");
    expect(s.center[0]).toBe("villager");
    expect(log.map(e => e.ev.kind)).toEqual(["look", "swap"]);
    expect(s.moved.sort()).toEqual(["c0", "p1"]);
  });
  it("stops at an undecided step and forces a random legal move when told to", () => {
    const s = state(["rustler", "werewolf", "sage"], ["villager", "villager", "courier"]);
    const p = freshProgress();
    expect(advance(s, 0, { peek: { branches: [], otherwise: pick(P(1)) } }, p, 2, rng())).toHaveLength(1);
    expect(p).toMatchObject({ step: 1, done: false, seen: { peek: ["werewolf"] } });
    const forced = advance(s, 0, {}, p, 2, rng(), { force: true });
    expect(p.done).toBe(true);
    expect(forced.every(e => e.via === "forced")).toBe(true);
  });
  it("lets a lone wolf scent a team, and skips the step in a pack", () => {
    const lone = state(["werewolf", "sage", "villager"], ["werewolf", "villager", "courier"]);
    const log = advance(lone, 0, { scent: { branches: [], otherwise: pick(P(1)) } }, freshProgress(), 1, rng());
    expect(log.map(e => e.ev)).toEqual([{ kind: "seats", label: "Werewolves", seats: [] }, { kind: "look", slots: [P(1)], teams: ["village"] }]);
    const pack = state(["werewolf", "werewolf", "villager"], ["sage", "villager", "courier"]);
    const p = freshProgress();
    expect(advance(pack, 0, {}, p, 1, rng()).map(e => e.ev)).toEqual([{ kind: "seats", label: "Werewolves", seats: [1] }]);
    expect(p.done).toBe(true);
  });
  it("passes a card clockwise past the courier, and the sentry notices", () => {
    const s = state(["courier", "sage", "sentry", "villager"], ["werewolf", "villager", "werewolf"]);
    advance(s, 0, { pass: { branches: [], otherwise: pick(P(3)) } }, freshProgress(), 1, rng());
    expect(s.cards).toEqual(["courier", "villager", "sentry", "sage"]);
    const log = advance(s, 2, {}, freshProgress(), 2, rng());
    expect(log[0].ev).toEqual({ kind: "moved", slots: [P(1), P(2), P(3)], moved: [true, false, true] });
  });
  it("gives every role with steps a script that can always be forced to the end", () => {
    for (const role of ROLES.filter(r => r.steps)) {
      const s = state([role.id, "villager", "villager", "werewolf"], ["villager", "sage", "werewolf"]);
      const p = freshProgress();
      advance(s, 0, {}, p, 1, rng(7), { force: true });
      expect(p.done, role.id).toBe(true);
      expect([...s.cards, ...s.center].sort()).toEqual([role.id, "villager", "villager", "werewolf", "villager", "sage", "werewolf"].sort());
    }
  });
});

describe("vote", () => {
  it("eliminates the most voted and gives the village the win over a dead wolf", () => {
    const o = resolveVote(["werewolf", "villager", "sage"], [1, 0, 0]);
    expect(o).toMatchObject({ deaths: [0], winningTeam: "village", winners: [1, 2] });
  });
  it("eliminates nobody when every seat has one vote, so the wolves win", () => {
    expect(resolveVote(["werewolf", "villager", "sage"], [1, 2, 0])).toMatchObject({ deaths: [], winningTeam: "werewolf", winners: [0] });
  });
  it("counts the archer's vote twice, by the card held", () => {
    expect(resolveVote(["archer", "werewolf", "villager", "villager"], [1, 2, 3, 0])).toMatchObject({ tally: [1, 2, 1, 1], deaths: [1], winningTeam: "village" });
  });
  it("lets an eliminated glitch win alone, and the whisperer win with the wolves when dead", () => {
    expect(resolveVote(["glitch", "werewolf", "villager"], [1, 0, 0])).toMatchObject({ winners: [0], winningTeam: "lone" });
    expect(resolveVote(["whisperer", "werewolf", "villager"], [1, 0, 0])).toMatchObject({ deaths: [0], winners: [0, 1], winningTeam: "werewolf" });
  });
  it("with no wolf at the table, the village wins only by eliminating nobody", () => {
    expect(resolveVote(["sage", "villager", "villager"], [1, 2, 0]).winningTeam).toBe("village");
    expect(resolveVote(["sage", "villager", "villager"], [1, 0, 1]).winningTeam).toBe("nobody");
  });
});

describe("commands", () => {
  it("hides commands of other phases and explains the ones that cannot run yet", () => {
    expect(availability(COMMAND["game.start"], HOME_CONTEXT)).toMatchObject({ ok: false, hidden: true });
    const lobby = { ...HOME_CONTEXT, phase: "lobby" as const, member: true, seated: false, host: true, players: 2, deck: recommendedDeck(3) };
    expect(availability(COMMAND["game.start"], lobby)).toEqual({ ok: false, reason: "Needs 3 players (2 seated).", hidden: false });
    expect(availability(COMMAND["game.start"], { ...lobby, players: 3 })).toEqual({ ok: true });
    expect(availability(COMMAND["game.start"], { ...lobby, players: 3, host: false })).toMatchObject({ ok: false, reason: "Only the host can do this." });
  });
  it("exports every server command as an MCP tool with a JSON schema", () => {
    const tools = toolDefinitions();
    expect(tools).toHaveLength(COMMANDS.filter(c => c.runs === "server").length);
    expect(tools.find(t => t.name === "day_vote")?.inputSchema).toMatchObject({ type: "object", required: ["seat"] });
  });
});
