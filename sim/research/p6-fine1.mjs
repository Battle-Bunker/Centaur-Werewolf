import { table, write, P, C, pick, pickRole, skip } from "./p6-make.mjs";
const T = [];
// PY6-S1: replay of coarse PY6#1 (both Sage cards in the centre; the Lure may fake a Sage read; lone wolf knows it).
T.push(table("PY6-S1-fakesage", 5, 601,
  [["Cass","pickpocket"],["Alder","werewolf"],["Fenn","rustler"],["Bryn","centaur"],["Dov","lure"],["Esme","phoenix"]],
  ["sage","werewolf","moonsage"],
  { Dov: [{ step: "lure", plan: pickRole("werewolf", P(5)) }], Alder: [{ step: "scent", plan: pick(P(2)) }],
    Bryn: [{ step: "glance", plan: pick(C(0)) }], Fenn: [{ step: "peek", plan: pick(P(3)) }, { step: "trade", plan: skip }],
    Cass: [{ step: "lift", plan: pick(P(3)) }] }));
// PY6-S2: the Sage reads the dressed Phoenix ("Werewolf"), the Rustler peeks the real wolf, the Centaur sees the other wolf in the centre.
T.push(table("PY6-S2-twowolfreads", 5, 602,
  [["Alder","sage"],["Bryn","phoenix"],["Cass","lure"],["Dov","werewolf"],["Esme","rustler"],["Fenn","centaur"]],
  ["werewolf","moonsage","pickpocket"],
  { Cass: [{ step: "lure", plan: pickRole("werewolf", P(1)) }], Dov: [{ step: "scent", plan: pick(P(0)) }],
    Alder: [{ step: "read", plan: pick(P(1)) }], Fenn: [{ step: "glance", plan: pick(C(0)) }],
    Esme: [{ step: "peek", plan: pick(P(3)) }, { step: "trade", plan: skip }] }));
// PY6-S3 (control, predicted sweep): Sage and Rustler both see the real wolf; Phoenix in the centre (the Lure is a Tanner).
T.push(table("PY6-S3-control", 3, 603,
  [["Alder","sage"],["Bryn","werewolf"],["Cass","lure"],["Dov","rustler"],["Esme","centaur"],["Fenn","pickpocket"]],
  ["phoenix","werewolf","moonsage"],
  { Cass: [{ step: "lure", plan: pickRole("werewolf", P(2)) }], Bryn: [{ step: "scent", plan: pick(P(0)) }],
    Alder: [{ step: "read", plan: pick(P(1)) }], Esme: [{ step: "glance", plan: pick(C(1)) }],
    Dov: [{ step: "peek", plan: pick(P(1)) }, { step: "trade", plan: skip }], Fenn: [{ step: "lift", plan: pick(P(4)) }] }));
write("sim/tournaments/players-6/fine1.json", T, "players-6 fine pass 1: PY6 fixed scenarios (see players-6-predictions.md, fine pass 1)");
