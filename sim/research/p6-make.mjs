// Builds players-6 fixed-scenario tournament files. node sim/research/p6-make.mjs <name> ; scenarios defined below.
import { writeFileSync } from "node:fs";
const P = i => ({ k: "p", i }), C = i => ({ k: "c", i });
const pick = (...t) => ({ branches: [], otherwise: { kind: "pick", targets: t } });
const pickRole = (role, ...t) => ({ branches: [], otherwise: { kind: "pick", targets: t, role } });
const skip = { branches: [], otherwise: { kind: "skip" } };
export function table(label, replays, seed, seats, centre, plans, extra = {}) {
  const players = seats.map(s => s[0]), cards = [...seats.map(s => s[1]), ...centre];
  return { label, replays, center: centre.length, deck: [...cards].sort(), players, scenario: { seed, cards, plans }, ...extra };
}
export { P, C, pick, pickRole, skip };
export function write(file, tables, about) {
  writeFileSync(file, JSON.stringify({ about, timers: { dusk: 8, turn: 2, day: 240, vote: 60 }, agents: { model: "opus", effort: "medium" }, tables }, null, 1));
}
