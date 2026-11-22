import { table, write, P, C, pick, pickRole, skip } from "./p6-make.mjs";
const T = [];
// PY6-S5: the wolf has its twin at the table. Moonsage held (its look sees through the Lure's dress: "Phoenix");
// the Sage reads the real wolf; the Rustler peeks the dressed Phoenix ("Werewolf"). Two Centaurs, two wolf-side, two Pyre.
T.push(table("PY6-S5-twinheld", 5, 614,
  [["Alder","sage"],["Bryn","phoenix"],["Cass","lure"],["Dov","werewolf"],["Esme","moonsage"],["Fenn","rustler"]],
  ["werewolf","centaur","pickpocket"],
  { Cass: [{ step: "lure", plan: pickRole("werewolf", P(1)) }], Dov: [{ step: "scent", plan: pick(P(0)) }],
    Alder: [{ step: "read", plan: pick(P(3)) }], Esme: [{ step: "read", plan: pick(P(1)) }],
    Fenn: [{ step: "peek", plan: pick(P(1)) }, { step: "trade", plan: skip }] },
  { rules: { openingStatements: true, bloodPriceCondemned: true } }));
write("sim/tournaments/players-6/fine6.json", T, "players-6 fine pass 6: PY6 with the Moonsage held (does the wolf side get a live game?)");
