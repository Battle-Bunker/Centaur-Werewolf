/**
 * The no-skill baseline for a deck: the same engine, with every night move and every vote chosen at random. It shows
 * what the deck's mechanics do by themselves, so that play-test results can be read against it (how much better than
 * chance do talking players find a wolf; does a team win mostly whatever anyone does).
 *   npx tsx sim/baseline.ts <tournament.json> [games per deck = 20000]
 */
import { readFileSync } from "node:fs";
import { advance, deal, freshProgress, nightTurns, resolveVote } from "../shared/engine";
import { ROLE } from "../shared/roles";

const [file, n = "20000"] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(file, "utf8")) as { tables: { label: string; deck: string[]; center: number; players: string[] }[] };
const seen = new Set<string>();
const pct = (x: number, d: number) => (d ? `${((100 * x) / d).toFixed(0)}%` : "n/a");
for (const t of spec.tables) {
  const label = t.label.replace(/#\d+$/, "");
  if (seen.has(label)) continue;
  seen.add(label);
  const games = Number(n), players = t.players.length;
  const win: Record<string, number> = { centaur: 0, werewolf: 0, nobody: 0, lone: 0 };
  let wolfAtTable = 0, wolfDead = 0, nobodyDead = 0, moved = 0, extra = 0;
  for (let g = 0; g < games; g++) {
    const state = deal(t.deck, players, Math.random);
    const progress = state.dealt.map(r => ({ ...freshProgress(), done: !ROLE[r].steps }));
    nightTurns(t.deck).forEach((role, turn) => state.dealt.forEach((r, seat) => { if (r === role) advance(state, seat, {}, progress[seat], turn + 1, Math.random, { force: true }); }));
    const votes = state.cards.map((_, i) => { let v = Math.floor(Math.random() * (players - 1)); if (v >= i) v++; return v; });
    const o = resolveVote(state.cards, votes, state.prophecy);
    win[o.winningTeam]++;
    const wolves = state.cards.flatMap((r, i) => (ROLE[r].tags.includes("wolf") ? [i] : []));
    if (wolves.length) { wolfAtTable++; if (wolves.some(w => o.deaths.includes(w))) wolfDead++; }
    if (!o.deaths.length) nobodyDead++;
    moved += state.cards.filter((r, i) => r !== state.dealt[i]).length;
    extra += o.notes.filter(x => x.includes("prophecy")).length;
  }
  console.log(`${label}  (${players} players, ${t.center} centre) random play, ${games} games`);
  console.log(`  winners: Centaur ${pct(win.centaur, games)}  Werewolf ${pct(win.werewolf, games)}  nobody ${pct(win.nobody, games)} · prophecy wins ${pct(extra, games)}`);
  console.log(`  wolf at table ${pct(wolfAtTable, games)} · wolf eliminated when present ${pct(wolfDead, wolfAtTable)} · nobody eliminated ${pct(nobodyDead, games)} · cards moved per game ${(moved / games).toFixed(1)}`);
}
