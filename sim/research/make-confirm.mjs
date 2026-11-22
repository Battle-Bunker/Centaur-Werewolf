// Builds the confirmation-session tournament files from the exploring sessions' exact fixed scenarios
// (same deck, seating, seed, night plans). Arms: off (default rules), open (openingStatements), spares (lureSparesPhoenix).
// 6-player tables also set bloodPriceCondemned (research lead's instruction).
import { readFileSync, writeFileSync } from "node:fs";
const pick = (f, label) => JSON.parse(readFileSync(f, "utf8")).tables.find(t => t.label === label);
const timers = { dusk: 8, turn: 2, day: 240, vote: 60 };
const agents = { model: "opus", effort: "medium" };
const src = {
  "F-P7-ember": ["sim/tournaments/players-7/fine1.json", "F-P7-ember"],
  "F-P7-inversion": ["sim/tournaments/players-7/fine2.json", "F-P7-inversion"],
  "F6-Q3-two-wolves-lure": ["sim/tournaments/p5/fine1.json", "F6-Q3-two-wolves-lure"],
  "F8-Q3-dressed-phoenix": ["sim/tournaments/p5/fine2.json", "F8-Q3-dressed-phoenix"],
  "F5-Q3-pyre-burn": ["sim/tournaments/p5/fine1.json", "F5-Q3-pyre-burn"],
  "PY6-S1-fakesage": ["sim/tournaments/players-6/fine1.json", "PY6-S1-fakesage"],
  "PY6-S2-twowolfreads": ["sim/tournaments/players-6/fine1.json", "PY6-S2-twowolfreads"],
};
const arms = { off: {}, open: { openingStatements: true }, spares: { lureSparesPhoenix: true } };
// [file, scenario, arm, replays]
const plan = {
  "c7": [["F-P7-ember", "off", 5], ["F-P7-ember", "open", 10], ["F-P7-ember", "spares", 5]],
  "c5": [["F6-Q3-two-wolves-lure", "open", 10], ["F8-Q3-dressed-phoenix", "off", 5], ["F8-Q3-dressed-phoenix", "open", 10], ["F8-Q3-dressed-phoenix", "spares", 5], ["F6-Q3-two-wolves-lure", "off", 5]],
  "c6": [["PY6-S1-fakesage", "off", 5], ["PY6-S1-fakesage", "open", 5], ["PY6-S2-twowolfreads", "off", 5], ["PY6-S2-twowolfreads", "open", 5], ["PY6-S2-twowolfreads", "spares", 5]],
  "c7b": [["F-P7-inversion", "off", 5], ["F-P7-inversion", "open", 10]],
};
for (const [file, rows] of Object.entries(plan)) {
  const tables = rows.map(([sc, arm, replays]) => {
    const t = structuredClone(pick(...src[sc]));
    const six = t.players.length === 6 ? { bloodPriceCondemned: true } : {};
    return { ...t, label: `${sc}~${arm}`, replays, rules: { ...(t.rules ?? {}), ...six, ...arms[arm] } };
  });
  writeFileSync(`sim/tournaments/confirm/${file}.json`, JSON.stringify({ timers, agents, tables }, null, 1));
  console.log(file, tables.map(t => `${t.label} x${t.replays} ${JSON.stringify(t.rules)}`).join("\n   "));
}
