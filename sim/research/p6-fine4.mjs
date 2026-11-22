import { table, write, P, C, pick, pickRole, skip } from "./p6-make.mjs";
const open = { rules: { openingStatements: true } };
const T = [];
// PE6-S1: the Ember-Carrier carries the Phoenix (Bryn) to the Rustler (Esme); the Sage reads Bryn: "Rustler";
// the Rustler (now holding the Phoenix, untold) peeks the real wolf; the Sentry (Fenn, seat 5) sees Esme's card moved.
T.push(table("PE6-S1-carried", 5, 611,
  [["Alder","sage"],["Bryn","phoenix"],["Cass","embercarrier"],["Dov","werewolf"],["Esme","rustler"],["Fenn","sentry"]],
  ["werewolf","centaur","pickpocket"],
  { Cass: [{ step: "carry", plan: pick(P(1), P(4)) }], Dov: [{ step: "scent", plan: pick(P(2)) }],
    Alder: [{ step: "read", plan: pick(P(1)) }], Esme: [{ step: "peek", plan: pick(P(3)) }, { step: "trade", plan: skip }] }, open));
// PF6-S1: sealed pair reports. The Notary reads the wolf (Bryn) and the Phoenix (Cass); the False Witness may forge one
// report; the Centaur sees the other wolf in the centre; the Rustler confirms the Centaur.
T.push(table("PF6-S1-seals", 5, 612,
  [["Alder","notary"],["Bryn","werewolf"],["Cass","phoenix"],["Dov","falsewitness"],["Esme","rustler"],["Fenn","centaur"]],
  ["werewolf","pickpocket","sentry"],
  { Alder: [{ step: "read", plan: pick(P(1), P(2)) }], Bryn: [{ step: "scent", plan: pick(P(3)) }],
    Fenn: [{ step: "glance", plan: pick(C(0)) }], Esme: [{ step: "peek", plan: pick(P(5)) }, { step: "trade", plan: skip }] }, open));
write("sim/tournaments/players-6/fine4.json", T, "players-6 fine pass 4: ember-carried Phoenix (PE6) and sealed pair reports with a Pyre forger (PF6); opening statements on");
