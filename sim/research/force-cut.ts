/**
 * Harness check for the Hush shim fix: waits for a table (by run dir) to reach the day, then makes the seat holding the
 * Hush cut `target` after `delay` seconds, exactly as the player could. Usage: npx tsx sim/research/force-cut.ts <tableDir> <hushName> <targetSeat> [delay]
 */
import { existsSync, readFileSync } from "node:fs";
import { tool } from "../lib";
const [dir, hush, target, delay = "20"] = process.argv.slice(2);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
while (!existsSync(`${dir}/table.json`)) await sleep(1000);
const table = JSON.parse(readFileSync(`${dir}/table.json`, "utf8"));
const key = table.seats.find((s: any) => s.name === hush).key;
for (;;) { const v: any = await tool(key, "room_view").catch(() => null); if (v?.phase === "day") break; await sleep(2000); }
await sleep(Number(delay) * 1000);
console.log(JSON.stringify(await tool(key, "day_cutLine", { seat: Number(target) })));
