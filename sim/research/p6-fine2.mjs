import { table, write, P, C, pick, pickRole, skip } from "./p6-make.mjs";
const T = [];
// PY6-S4: Sage reads the real wolf; the Lure dressed the Phoenix but nobody looks at it; Moonsage in the centre.
T.push(table("PY6-S4-sagehits", 5, 604,
  [["Alder","werewolf"],["Bryn","sage"],["Cass","phoenix"],["Dov","lure"],["Esme","rustler"],["Fenn","centaur"]],
  ["werewolf","moonsage","pickpocket"],
  { Dov: [{ step: "lure", plan: pickRole("werewolf", P(2)) }], Alder: [{ step: "scent", plan: pick(P(3)) }],
    Bryn: [{ step: "read", plan: pick(P(0)) }], Fenn: [{ step: "glance", plan: pick(C(2)) }],
    Esme: [{ step: "peek", plan: pick(P(5)) }, { step: "trade", plan: skip }] }));
write("sim/tournaments/players-6/fine2.json", T, "players-6 fine pass 2: PY6-S4");
