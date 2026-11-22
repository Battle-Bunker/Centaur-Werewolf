/**
 * Exact frequencies of deal classes for a roster: which roles are held by players (vs the centre), by enumerating
 * every split of the deck. Deal combinatorics only: it simulates no play (charter: random play is never evidence).
 *   npx tsx sim/research/classes.ts <players> <role,role,...> [--require tag:wolf] [--key role,role,...]
 * --key: the roles whose held/centre status defines a class (default: every non-Centaur-team role plus sage).
 */
import { ROLE } from "../../shared/roles";

const [pArg, deckArg, ...rest] = process.argv.slice(2);
const players = Number(pArg), deck = deckArg.split(",");
const flag = (n: string) => { const i = rest.indexOf(`--${n}`); return i >= 0 ? rest[i + 1] : undefined; };
const require = flag("require");
const keyRoles = flag("key")?.split(",") ?? [...new Set(deck.filter(r => ROLE[r].team !== "centaur" || r === "sage"))];
const match = (id: string, m: string) => (m.startsWith("tag:") ? ROLE[id].tags.includes(m.slice(4) as never) : m.startsWith("team:") ? ROLE[id].team === m.slice(5) : id === m);

const classes = new Map<string, number>();
let total = 0;
const n = deck.length;
// every subset of card positions of size `players` (cards are distinct instances; duplicates collapse in the key)
const rec = (start: number, chosen: number[]) => {
  if (chosen.length === players) {
    const held = chosen.map(i => deck[i]);
    if (require && !held.some(h => require.split("|").some(m => match(h, m)))) return;
    const key = keyRoles.map(r => `${r}:${held.filter(h => h === r).length}`).join(" ");
    classes.set(key, (classes.get(key) ?? 0) + 1); total++;
    return;
  }
  for (let i = start; i <= n - (players - chosen.length); i++) rec(i + 1, [...chosen, i]);
};
rec(0, []);
console.log(`${players} players, deck ${deck.join(",")}${require ? `, given a player holds ${require}` : ""}: ${total} deals`);
for (const [k, c] of [...classes].sort((a, b) => b[1] - a[1])) console.log(`  ${(100 * c / total).toFixed(1).padStart(5)}%  held: ${k}`);
