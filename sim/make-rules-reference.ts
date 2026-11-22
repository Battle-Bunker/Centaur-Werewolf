/** Writes docs/rules-reference.md from the engine's data (shared/reference.ts).  npx tsx sim/make-rules-reference.ts */
import { writeFileSync } from "node:fs";
import { rulesReference } from "../shared/reference";
writeFileSync(new URL("../docs/rules-reference.md", import.meta.url), rulesReference());
console.log("wrote docs/rules-reference.md");
