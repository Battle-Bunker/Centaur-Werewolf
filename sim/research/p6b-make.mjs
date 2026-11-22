// Builds players-6b tournament files (second 6-player session). node sim/research/p6b-make.mjs
// Fixed scenarios reuse sim/research/p6-make.mjs (deal: cards[i] to the i-th player, the rest to the centre).
import { writeFileSync } from "node:fs";
import { table, write, P, C, pick, pickRole, skip } from "./p6-make.mjs";

const SEATS = ["Alder", "Bryn", "Cass", "Dov", "Esme", "Fenn"];
export const DECKS = {
  PYH6: ["werewolf", "werewolf", "phoenix", "lure", "sage", "hollowsage", "rustler", "centaur", "pickpocket"],
  PYS6: ["werewolf", "werewolf", "phoenix", "lure", "sage", "stalkinghorse", "rustler", "centaur", "pickpocket"],
  HC6: ["werewolf", "hollowsage", "duncentaur", "sage", "sage", "centaur", "centaur", "rustler", "pickpocket"],
};
const RULES = { openingStatements: true, bloodPriceCondemned: true };

// ── coarse pass 1: two natural deals per roster ──
{
  const tables = [];
  for (const [name, deck] of Object.entries(DECKS)) for (const k of [1, 2]) tables.push({ label: `${name}#${k}`, center: 3, players: SEATS, deck, rules: RULES });
  writeFileSync("sim/tournaments/players-6b/coarse1.json", JSON.stringify({ about: "players-6b coarse pass 1: natural deals", timers: { dusk: 120, turn: 10, day: 240, vote: 60 }, agents: { model: "opus", effort: "medium" }, redeal: "wolfDealt", tables }, null, 1));
}

// ── fine pass 1 ──
{
  const T = [];
  // S5's night (players-6 fine6) with the wolf side's second card varied: Hollow Sage.
  T.push(table("PYH6-S5h", 5, 614,
    [["Alder","sage"],["Bryn","phoenix"],["Cass","lure"],["Dov","werewolf"],["Esme","hollowsage"],["Fenn","rustler"]],
    ["werewolf","centaur","pickpocket"],
    { Cass: [{ step: "lure", plan: pickRole("werewolf", P(1)) }], Dov: [{ step: "scent", plan: pick(P(0)) }],
      Alder: [{ step: "read", plan: pick(P(3)) }], Esme: [{ step: "read", plan: pick(P(1)) }],
      Fenn: [{ step: "peek", plan: pick(P(1)) }, { step: "trade", plan: skip }] },
    { rules: RULES }));
  // Same night with the Stalking Horse: Dov and Esme are a pack of two (no scent).
  T.push(table("PYS6-S5s", 5, 614,
    [["Alder","sage"],["Bryn","phoenix"],["Cass","lure"],["Dov","werewolf"],["Esme","stalkinghorse"],["Fenn","rustler"]],
    ["werewolf","centaur","pickpocket"],
    { Cass: [{ step: "lure", plan: pickRole("werewolf", P(1)) }],
      Dov: [{ step: "scent", plan: skip }], Esme: [{ step: "scent", plan: skip }],
      Alder: [{ step: "read", plan: pick(P(3)) }],
      Fenn: [{ step: "peek", plan: pick(P(1)) }, { step: "trade", plan: skip }] },
    { rules: RULES }));
  // Hollow Court: the hollow duel.
  T.push(table("HC6-S1", 5, 621,
    [["Alder","sage"],["Bryn","werewolf"],["Cass","hollowsage"],["Dov","centaur"],["Esme","rustler"],["Fenn","pickpocket"]],
    ["sage","centaur","duncentaur"],
    { Bryn: [{ step: "scent", plan: pick(P(5)) }], Alder: [{ step: "read", plan: pick(P(1)) }],
      Cass: [{ step: "read", plan: pick(P(0)) }], Dov: [{ step: "glance", plan: pick(C(0)) }],
      Esme: [{ step: "peek", plan: pick(P(2)) }, { step: "trade", plan: skip }], Fenn: [{ step: "lift", plan: pick(P(3)) }] },
    { rules: RULES }));
  write("sim/tournaments/players-6b/fine1.json", T, "players-6b fine pass 1 (players-6b-predictions.md)");
}
