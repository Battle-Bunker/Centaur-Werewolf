/** Builds sim/tournaments/p5/fine1.json: the first 5-player fixed-scenario pass (5 replays each). */
import { writeFileSync } from "node:fs";
const P = (i: number) => ({ k: "p", i }), C = (i: number) => ({ k: "c", i });
const pick = (...targets: object[]) => ({ branches: [], otherwise: { kind: "pick", targets } });
const pickRole = (role: string, ...targets: object[]) => ({ branches: [], otherwise: { kind: "pick", targets, role } });
const skip = { branches: [], otherwise: { kind: "skip" } };
const Q1 = ["werewolf", "moonsage", "spooker", "sage", "rustler", "sentry", "centaur", "centaur"];
const Q2 = ["werewolf", "werewolf", "cutpurse", "pickpocket", "latecomer", "sage", "sentry", "centaur"];
const Q3 = ["werewolf", "werewolf", "phoenix", "lure", "sage", "rustler", "sentry", "centaur"];
const tables = [
  // F1 = coarse Q1#1: lone wolf, Spooker held and rotates a Centaur into the centre; Sage and Moonsage in the centre.
  { label: "F1-Q1-spooker-decoy", deck: Q1, players: ["Bryn", "Dov", "Alder", "Esme", "Cass"],
    scenario: { seed: 11, cards: ["spooker", "centaur", "centaur", "werewolf", "sentry", "sage", "moonsage", "rustler"],
      plans: { Esme: [{ step: "scent", plan: pick(P(4)) }], Dov: [{ step: "glance", plan: pick(C(0)) }], Alder: [{ step: "glance", plan: pick(C(0)) }],
               Bryn: [{ step: "stampede", plan: pick(P(2), P(4), C(0)) }] } } },
  // F2 constructed: Sage reads the wolf; Moonsage reads the Sage; Rustler peeks the Moonsage (sees "Sage"); Spooker in centre.
  { label: "F2-Q1-twin-duel", deck: Q1, players: ["Alder", "Bryn", "Cass", "Dov", "Esme"],
    scenario: { seed: 12, cards: ["werewolf", "moonsage", "sage", "rustler", "centaur", "spooker", "sentry", "centaur"],
      plans: { Alder: [{ step: "scent", plan: pick(P(4)) }], Bryn: [{ step: "read", plan: pick(P(2)) }], Cass: [{ step: "read", plan: pick(P(0)) }],
               Dov: [{ step: "peek", plan: pick(P(1)) }, { step: "trade", plan: skip }], Esme: [{ step: "glance", plan: pick(C(1)) }] } } },
  // F3 = coarse Q2#1: two wolves; the Cutpurse steals a wolf (knowing), the Pickpocket then lifts the Cutpurse card off the old wolf.
  { label: "F3-Q2-cutpurse-wolf", deck: Q2, players: ["Cass", "Dov", "Bryn", "Alder", "Esme"],
    scenario: { seed: 13, cards: ["werewolf", "pickpocket", "cutpurse", "werewolf", "sage", "latecomer", "centaur", "sentry"],
      plans: { Esme: [{ step: "read", plan: pick(P(2)) }], Bryn: [{ step: "steal", plan: pick(P(3)) }], Dov: [{ step: "lift", plan: pick(P(3)) }] } } },
  // F4 = coarse Q2#2: lone wolf, nothing touches it; predicted talk-dead control.
  { label: "F4-Q2-lone-wolf", deck: Q2, players: ["Dov", "Esme", "Alder", "Bryn", "Cass"],
    scenario: { seed: 14, cards: ["sentry", "werewolf", "sage", "pickpocket", "centaur", "werewolf", "latecomer", "cutpurse"],
      plans: { Esme: [{ step: "scent", plan: pick(P(2)) }], Alder: [{ step: "read", plan: pick(P(3)) }], Cass: [{ step: "glance", plan: pick(C(0)) }], Bryn: [{ step: "lift", plan: pick(P(0)) }] } } },
  // F5 = coarse Q3#3: Sage reads the lone wolf; Phoenix and Lure held (Lure dresses itself as a Werewolf).
  { label: "F5-Q3-pyre-burn", deck: Q3, players: ["Bryn", "Alder", "Cass", "Esme", "Dov"],
    scenario: { seed: 15, cards: ["sentry", "phoenix", "werewolf", "lure", "sage", "rustler", "werewolf", "centaur"],
      plans: { Esme: [{ step: "lure", plan: pickRole("werewolf", P(3)) }], Cass: [{ step: "scent", plan: pick(P(3)) }], Dov: [{ step: "read", plan: pick(P(2)) }] } } },
  // F6 = coarse Q3#2: two wolves held, Lure held (self-dressed as a Werewolf), Phoenix and Sage in the centre.
  { label: "F6-Q3-two-wolves-lure", deck: Q3, players: ["Bryn", "Dov", "Alder", "Esme", "Cass"],
    scenario: { seed: 16, cards: ["werewolf", "werewolf", "centaur", "lure", "sentry", "sage", "rustler", "phoenix"],
      plans: { Esme: [{ step: "lure", plan: pickRole("werewolf", P(3)) }], Alder: [{ step: "glance", plan: pick(C(0)) }] } } },
].map(t => ({ ...t, center: 3, replays: 5 }));
writeFileSync("sim/tournaments/p5/fine1.json", JSON.stringify({ timers: { dusk: 8, turn: 2, day: 240, vote: 60 }, agents: { model: "opus", effort: "medium" }, tables }, null, 1));
console.log(tables.map(t => t.label).join(" "));
