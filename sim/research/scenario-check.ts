/**
 * Checks the fixed scenarios of a tournament file WITHOUT any AI player: opens each table, fixes the deal and night
 * seed, queues every night plan with each seat's key, lets the night run, prints the night log, then abandons the
 * round. Costs nothing; catches wrong step ids, illegal targets and night results other than intended.
 *   npx tsx sim/research/scenario-check.ts <tournament.json> [label,...]
 */
import { readFileSync } from "node:fs";
import { run, setupTable, tool } from "../lib";

const [file, only] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(file, "utf8"));
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
for (const t of spec.tables.filter((t: any) => t.scenario && (!only || only.split(",").includes(t.label)))) {
  const table = await setupTable({ label: t.label, deck: t.deck, center: t.center, players: t.players, timers: { dusk: 3, turn: 1, day: 30, vote: 10 }, rules: { ...spec.rules, ...t.rules }, playtest: true });
  await run("setup.fixDeal", table.seats[0].token, table.code, { seats: table.seats.map(s => s.id), cards: t.scenario.cards, nightSeed: t.scenario.seed ?? 1 });
  await run("game.start", table.seats[0].token, table.code);
  const problems: string[] = [];
  for (const s of table.seats) for (const p of t.scenario.plans[s.name] ?? []) {
    try { await tool(s.key, "night_planStep", { step: p.step, plan: p.plan, ...(p.as ? { as: p.as } : {}) }); } catch (e) { problems.push(`${s.name} ${p.step}: ${(e as Error).message}`); }
  }
  for (const s of table.seats) {
    const v = await tool<any>(s.key, "room_view");
    const open = (v.yourNightSteps ?? []).filter((x: any) => x.status.startsWith("NOT DECIDED")).map((x: any) => x.step);
    if (open.length) problems.push(`${s.name} (${v.you.dealt.id}) undecided: ${open.join(",")}`);
  }
  let v: any = await tool(table.seats[0].key, "room_view");
  for (let i = 0; i < 60 && v.phase === "night"; i++) { await sleep(1000); v = await tool(table.seats[0].key, "room_view"); }
  await run("day.endDiscussion", table.seats[0].token, table.code).catch(() => {});
  for (let i = 0; i < 30 && v.phase !== "ended"; i++) { await sleep(1000); v = await tool(table.seats[0].key, "room_view"); }
  console.log(`\n== ${t.label} (room ${table.code}) ${problems.length ? "PROBLEMS: " + problems.join(" | ") : "plans ok"}`);
  console.log(`   fingerprint ${v.result?.scenario?.fingerprint}; proclamations ${JSON.stringify((v.proclamations ?? []).map((p: any) => `${p.card}=${p.was}`))}`);
  for (const l of v.result?.nightLog ?? []) if (!l.startsWith("[Day]")) console.log("   " + l);
}
process.exit(0);
