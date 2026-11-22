import { describe, expect, it } from "vitest";
import { rulesReference } from "./reference";
import { ROLES } from "./roles";

describe("rules reference", () => {
  it("is up to date with the engine (regenerate: npx tsx sim/make-rules-reference.ts)", async () => {
    const { readFileSync } = (await import("node:fs" as string)) as { readFileSync: (u: URL, e: "utf8") => string };
    expect(readFileSync(new URL("../docs/rules-reference.md", import.meta.url), "utf8")).toBe(rulesReference());
  });
  it("has an entry for every card", () => {
    const doc = rulesReference();
    for (const r of ROLES) expect(doc, r.id).toContain(`### ${r.name} (\`${r.id}\`)`);
  });
});
