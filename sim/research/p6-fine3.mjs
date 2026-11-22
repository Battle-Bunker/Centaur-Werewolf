import { readFileSync } from "node:fs";
import { write } from "./p6-make.mjs";
// Re-uses the exact PY6-S1 and PY6-S2 scenarios from fine1.json with rule options switched on.
const f1 = JSON.parse(readFileSync("sim/tournaments/players-6/fine1.json", "utf8")).tables;
const get = l => f1.find(t => t.label.startsWith(l));
const T = [
  { ...get("PY6-S1"), label: "PY6-S1-open", rules: { openingStatements: true } },
  { ...get("PY6-S2"), label: "PY6-S2-open", rules: { openingStatements: true } },
  { ...get("PY6-S2"), label: "PY6-S2-nodenial", rules: { openingStatements: true, burningDeniesWolves: false } },
];
write("sim/tournaments/players-6/fine3.json", T, "players-6 fine pass 3: PY6 S1/S2 with opening statements; S2 with burningDeniesWolves off");
