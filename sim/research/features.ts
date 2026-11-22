/**
 * Exact frequencies of named deal FEATURES for a roster (deal combinatorics only, no play): each feature is a predicate
 * over the multiset of HELD roles. Prints P(feature | require) for each.
 *   npx tsx sim/research/features.ts <players> <deck,...> [--require tag:wolf] --f "name::expr" ...
 * expr: JS over h (count of held role id: h("sage")), e.g. "duel::h('sage')>=1&&h('moonsage')>=1".
 */
import { ROLE } from "../../shared/roles";
const [pArg, deckArg, ...rest] = process.argv.slice(2);
const players = Number(pArg), deck = deckArg.split(",");
const req = rest.includes("--require") ? rest[rest.indexOf("--require") + 1] : undefined;
const feats: [string, (h: (r: string) => number) => boolean][] = [];
rest.forEach((a, i) => { if (a === "--f") { const [n, e] = rest[i + 1].split(/::(.*)/s); feats.push([n, new Function("h", `return (${e});`) as never]); } });
const match = (id: string, m: string) => (m.startsWith("tag:") ? ROLE[id].tags.includes(m.slice(4) as never) : m.startsWith("team:") ? ROLE[id].team === m.slice(5) : id === m);
let total = 0; const hits = feats.map(() => 0);
const rec = (start: number, chosen: number[]) => {
  if (chosen.length === players) {
    const held = chosen.map(i => deck[i]);
    if (req && !held.some(x => match(x, req))) return;
    total++;
    const h = (r: string) => r.startsWith("tag:") || r.startsWith("team:") ? held.filter(x => match(x, r)).length : held.filter(x => x === r).length;
    feats.forEach(([, f], k) => { if (f(h)) hits[k]++; });
    return;
  }
  for (let i = start; i <= deck.length - (players - chosen.length); i++) rec(i + 1, [...chosen, i]);
};
rec(0, []);
console.log(`${players}p ${deck.join(",")} (${total} deals${req ? `, given ${req} held` : ""})`);
feats.forEach(([n], k) => console.log(`  ${(100 * hits[k] / total).toFixed(0).padStart(3)}%  ${n}`));
