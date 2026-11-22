/**
 * A minimal MCP client for the command line: one tool call per run, over the real MCP endpoint.
 *   npx tsx sim/mcp.ts <key> <tool> ['<json arguments>']
 *   npx tsx sim/mcp.ts <key> --tools          list the tools this key may use
 */
import { Refusal, rpc, tool } from "./lib";

const [key, name, json] = process.argv.slice(2);
if (!key || !name) { console.error("usage: tsx sim/mcp.ts <key> <tool> ['<json arguments>']"); process.exit(2); }
if (name === "--tools") {
  const { body } = await rpc(key, "tools/list");
  for (const t of body.result.tools) console.log(`${t.name}\n    ${t.description}\n    arguments: ${JSON.stringify(t.inputSchema.properties ?? {})}`);
} else {
  try { console.log(JSON.stringify(await tool(key, name, json ? JSON.parse(json) : {}), null, 1)); }
  catch (e) { if (e instanceof Refusal) { console.log(`REFUSED: ${e.message}`); } else throw e; }
}
