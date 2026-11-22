import { table, write, P, C, pick, pickRole, skip } from "./p6-make.mjs";
const T = [];
// PY6L-S3: the S3 control (two honest looks at an unmoved wolf) with a Latecomer added to the deck (in the centre),
// 4 centre cards: a late blind mover now exists in the deck, so "the wolf card moved after your looks" is a
// claimable counter-story. Opening statements on.
T.push(table("PY6L-S3-latecomer", 5, 613,
  [["Alder","sage"],["Bryn","werewolf"],["Cass","lure"],["Dov","rustler"],["Esme","centaur"],["Fenn","pickpocket"]],
  ["phoenix","werewolf","moonsage","latecomer"],
  { Cass: [{ step: "lure", plan: pickRole("werewolf", P(2)) }], Bryn: [{ step: "scent", plan: pick(P(0)) }],
    Alder: [{ step: "read", plan: pick(P(1)) }], Esme: [{ step: "glance", plan: pick(C(1)) }],
    Dov: [{ step: "peek", plan: pick(P(1)) }, { step: "trade", plan: skip }], Fenn: [{ step: "lift", plan: pick(P(4)) }] },
  { rules: { openingStatements: true } }));
write("sim/tournaments/players-6/fine5.json", T, "players-6 fine pass 5: amendment test, S3 control plus a Latecomer");
