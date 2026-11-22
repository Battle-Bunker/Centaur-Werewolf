/**
 * Prints one agent's game compactly from its stream transcript: its reasoning text, each tool call with arguments,
 * and a short form of each tool answer.
 *   npx tsx sim/transcript.ts <tableDir>/<Name>.jsonl [--full]
 */
import { readFileSync } from "node:fs";

const [file] = process.argv.slice(2), full = process.argv.includes("--full");
const cut = (s: string, n: number) => (full || s.length <= n ? s : s.slice(0, n) + "…");
let t0 = 0;
for (const line of readFileSync(file, "utf8").split("\n")) {
  let ev: any; try { ev = JSON.parse(line); } catch { continue; }
  if (ev.type === "system" && ev.subtype === "init") { console.log(`== session ${ev.session_id} model ${ev.model} tools: ${ev.tools.length}`); continue; }
  if (ev.type === "result") { console.log(`== result: ${ev.subtype} turns ${ev.num_turns} cost $${ev.total_cost_usd?.toFixed(3)} ${Math.round(ev.duration_ms / 1000)}s`); continue; }
  const content = ev.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type === "text" && c.text.trim()) console.log(`  » ${cut(c.text.trim().replace(/\n+/g, " "), 400)}`);
    if (c.type === "thinking" && c.thinking?.trim()) console.log(`  ~ ${cut(c.thinking.trim().replace(/\n+/g, " "), 300)}`);
    if (c.type === "tool_use") console.log(`→ ${c.name.replace("mcp__werewolf__", "")} ${cut(JSON.stringify(c.input), 300)}`);
    if (c.type === "tool_result") {
      const text = Array.isArray(c.content) ? c.content.map((x: any) => x.text ?? "").join("") : String(c.content);
      console.log(`  ← ${c.is_error ? "ERROR " : ""}${cut(text.replace(/^Game data from Centaur Werewolf[^\n]*\n?/, "").replace(/\{"untrusted":true,"notice":"[^"]*","data":/, ""), 220)}`);
    }
  }
  void t0;
}
