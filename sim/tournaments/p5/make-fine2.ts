/** Builds sim/tournaments/p5/fine2.json: the second 5-player fixed-scenario pass (5 replays each). */
import { writeFileSync } from "node:fs";
const P = (i: number) => ({ k: "p", i }), C = (i: number) => ({ k: "c", i });
const pick = (...targets: object[]) => ({ branches: [], otherwise: { kind: "pick", targets } });
const pickRole = (role: string, ...targets: object[]) => ({ branches: [], otherwise: { kind: "pick", targets, role } });
const skip = { branches: [], otherwise: { kind: "skip" } };
const Q1D = ["werewolf", "moonsage", "spooker", "sage", "drover", "sentry", "centaur", "centaur"];
const Q2 = ["werewolf", "werewolf", "cutpurse", "pickpocket", "latecomer", "sage", "sentry", "centaur"];
const Q3 = ["werewolf", "werewolf", "phoenix", "lure", "sage", "rustler", "sentry", "centaur"];
const tables = [
  // D1 = F1 with the Drover in place of the Rustler (centre card 3): the amendment's direct test.
  { label: "D1-Q1D-spooker-decoy", deck: Q1D, players: ["Bryn", "Dov", "Alder", "Esme", "Cass"],
    scenario: { seed: 21, cards: ["spooker", "centaur", "centaur", "werewolf", "sentry", "sage", "moonsage", "drover"],
      plans: { Esme: [{ step: "scent", plan: pick(P(4)) }], Dov: [{ step: "glance", plan: pick(C(0)) }], Alder: [{ step: "glance", plan: pick(C(0)) }],
               Bryn: [{ step: "stampede", plan: pick(P(2), P(4), C(0)) }] } } },
  // D2: Spooker and Drover both held. Sage reads the wolf (Alder); the Spooker then carries the wolf card to Esme;
  // the Drover honestly rotates the three centre cards.
  { label: "D2-Q1D-two-rotators", deck: Q1D, players: ["Alder", "Bryn", "Cass", "Dov", "Esme"],
    scenario: { seed: 22, cards: ["werewolf", "spooker", "drover", "sage", "centaur", "moonsage", "sentry", "centaur"],
      plans: { Alder: [{ step: "scent", plan: pick(P(4)) }], Dov: [{ step: "read", plan: pick(P(0)) }], Esme: [{ step: "glance", plan: pick(C(1)) }],
               Bryn: [{ step: "stampede", plan: pick(P(0), P(4), C(0)) }], Cass: [{ step: "stampede", plan: pick(C(0), C(1), C(2)) }] } } },
  // F7 Q2: lone wolf; the Pickpocket blindly lifts the wolf card; the Latecomer later swaps blind with a Centaur.
  { label: "F7-Q2-blind-carrier", deck: Q2, players: ["Alder", "Bryn", "Cass", "Dov", "Esme"],
    scenario: { seed: 23, cards: ["werewolf", "pickpocket", "sage", "latecomer", "centaur", "werewolf", "cutpurse", "sentry"],
      plans: { Alder: [{ step: "scent", plan: pick(P(2)) }], Cass: [{ step: "read", plan: pick(P(3)) }], Bryn: [{ step: "lift", plan: pick(P(0)) }], Dov: [{ step: "swap", plan: pick(P(4)) }], Esme: [{ step: "glance", plan: pick(C(1)) }] } } },
  // F8 Q3: the Lure dresses the Phoenix as a Werewolf; the Sage reads the dressed Phoenix; the Rustler peeks the real wolf.
  { label: "F8-Q3-dressed-phoenix", deck: Q3, players: ["Alder", "Bryn", "Cass", "Dov", "Esme"],
    scenario: { seed: 24, cards: ["phoenix", "lure", "sage", "werewolf", "rustler", "werewolf", "centaur", "sentry"],
      plans: { Bryn: [{ step: "lure", plan: pickRole("werewolf", P(0)) }], Dov: [{ step: "scent", plan: pick(P(1)) }], Cass: [{ step: "read", plan: pick(P(0)) }],
               Esme: [{ step: "peek", plan: pick(P(3)) }, { step: "trade", plan: skip }] } } },
].map(t => ({ ...t, center: 3, replays: 5 }));
writeFileSync("sim/tournaments/p5/fine2.json", JSON.stringify({ timers: { dusk: 8, turn: 2, day: 240, vote: 60 }, agents: { model: "opus", effort: "medium" }, tables }, null, 1));
console.log(tables.map(t => t.label).join(" "));
