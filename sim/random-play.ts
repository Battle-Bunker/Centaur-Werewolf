/**
 * The no-skill baseline for a deck: the real engine, with every night move and every vote chosen at random.
 * Used by baseline.ts (printed) and analyze.ts (set against the play-test results).
 */
import { advance, deal, freshProgress, nightTurns, resolveVote } from "../shared/engine";
import { ROLE } from "../shared/roles";

export interface Baseline { games: number; win: Record<string, number>; wolfAtTable: number; wolfDeadWhenPresent: number; nobodyDead: number; movedPerGame: number; prophecyWins: number; eliminatedHeldMoved: number }

/** opts.requireWolfDealt: redraw any deal that gives no player a wolf card (as arena.ts's redeal does). */
export function randomPlay(deck: string[], players: number, games = 20000, opts: { requireWolfDealt?: boolean } = {}): Baseline {
  const win: Record<string, number> = { centaur: 0, werewolf: 0, nobody: 0, lone: 0 };
  let wolfAtTable = 0, wolfDead = 0, nobodyDead = 0, moved = 0, extra = 0, elimMoved = 0;
  for (let g = 0; g < games; g++) {
    let state = deal(deck, players, Math.random);
    while (opts.requireWolfDealt && !state.dealt.some(r => ROLE[r].tags.includes("wolf"))) state = deal(deck, players, Math.random);
    const progress = state.dealt.map(r => ({ ...freshProgress(), done: !ROLE[r].steps }));
    nightTurns(deck).forEach((role, turn) => state.dealt.forEach((r, seat) => { if (r === role) advance(state, seat, {}, progress[seat], turn + 1, Math.random, { force: true }); }));
    const votes = state.cards.map((_, i) => { let v = Math.floor(Math.random() * (players - 1)); if (v >= i) v++; return v; });
    const o = resolveVote(state.cards, votes, state.prophecy);
    win[o.winningTeam] = (win[o.winningTeam] ?? 0) + 1;
    const wolves = state.cards.flatMap((r, i) => (ROLE[r].tags.includes("wolf") ? [i] : []));
    if (wolves.length) { wolfAtTable++; if (wolves.some(w => o.deaths.includes(w))) wolfDead++; }
    if (!o.deaths.length) nobodyDead++;
    if (o.deaths.some(i => state.cards[i] !== state.dealt[i])) elimMoved++;
    moved += state.cards.filter((r, i) => r !== state.dealt[i]).length;
    extra += o.notes.filter(x => x.includes("prophecy")).length;
  }
  const f = (x: number, d = games) => (d ? x / d : NaN);
  return {
    games, win: Object.fromEntries(Object.entries(win).map(([k, x]) => [k, f(x)])), wolfAtTable: f(wolfAtTable), wolfDeadWhenPresent: f(wolfDead, wolfAtTable),
    nobodyDead: f(nobodyDead), movedPerGame: moved / games, prophecyWins: f(extra), eliminatedHeldMoved: f(elimMoved),
  };
}
