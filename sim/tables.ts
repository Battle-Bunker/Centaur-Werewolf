/**
 * Opens the tables of a tournament on the running server and writes what the players need to connect.
 *   npx tsx sim/tables.ts <tournament.json> <outDir>
 * The tournament file is { "timers": {dusk,turn,day}, "rules"?: {...}, "tables": [{ "label", "deck": [...], "center", "players": [...], "rules"?: {...}, "seed"?: n }] }.
 * `rules` (file-wide, then per table) are rule variants set in the lobby; `seed` makes a play-test table with a fixed deal.
 * Writes <outDir>/tables.json (room codes and each player's MCP key). Keys are secrets of the local test server only.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { setupTable, type Table } from "./lib";

const [file, out] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(file, "utf8")) as { timers: { dusk: number; turn: number; day: number }; rules?: Record<string, boolean | number | string>; tables: { label: string; deck: string[]; center: number; players: string[]; rules?: Record<string, boolean | number | string>; seed?: number; playtest?: boolean }[] };
mkdirSync(out, { recursive: true });
const tables: Table[] = [];
for (const t of spec.tables) {
  tables.push(await setupTable({ ...t, rules: { ...spec.rules, ...t.rules }, timers: spec.timers }));
  console.log(`${t.label}: room ${tables[tables.length - 1].code}, ${t.players.length} players, ${t.center} centre cards`);
}
writeFileSync(`${out}/tables.json`, JSON.stringify(tables, null, 1));
