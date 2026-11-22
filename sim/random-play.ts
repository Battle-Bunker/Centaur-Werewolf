/**
 * The no-skill baseline for a deck: the real engine, with every night move, every Moon-Thief swap and every vote
 * chosen at random (the votes count as the players' own, so the Sporeling's curse applies), under a table's rules.
 * Used by baseline.ts (printed) and analyze.ts (set against the play-test results).
 */
import { advance, dawn, daySwap, deal, freshProgress, nightTurns, resolveVote, type LogEntry } from "../shared/engine";
import { ROLE } from "../shared/roles";
import { rulesOf, type Rules } from "../shared/settings";

export interface Baseline {
  games: number;
  /** Main result, by winning team (centaur, werewolf, nobody). */
  win: Record<string, number>;
  /** Share of games in which at least one creature (or Imago) won, among games where any creature card was dealt or held. */
  creatureWins: number;
  /** Kept for older readers: the same as creatureWins. */
  prophecyWins: number;
  wolfAtTable: number;
  wolfDeadWhenPresent: number;
  nobodyDead: number;
  /** More than one seat eliminated. */
  multiElim: number;
  /** A Werewolf and at least as many Centaurs fell together (the ties Blood Price turns into Werewolf wins). */
  bloodPriceTies: number;
  movedPerGame: number;
  eliminatedHeldMoved: number;
  /** Seats that lost to the curse, per game. */
  cursedPerGame: number;
  /** Games with a bitten player; games with an Imago. */
  bitten: number;
  imago: number;
  /** Per held card: the share of games where a player held it at the end, and the Werewolf-side win rate in those games. */
  held: Record<string, { held: number; wolfWinWhenHeld: number; wolfWinWhenNot: number }>;
}

export function randomPlay(deck: string[], players: number, games = 20000, rulesIn: Partial<Rules> | Record<string, unknown> = {}): Baseline {
  const rules = rulesOf(rulesIn as Record<string, unknown>);
  const win: Record<string, number> = { centaur: 0, werewolf: 0, nobody: 0 };
  let wolfAtTable = 0, wolfDead = 0, nobodyDead = 0, moved = 0, creatureGames = 0, creatureWin = 0, elimMoved = 0, multi = 0, ties = 0, cursed = 0, bitten = 0, imago = 0;
  const ids = [...new Set(deck)];
  const heldStats = Object.fromEntries(ids.map(r => [r, { games: 0, wolfWins: 0, notGames: 0, notWolfWins: 0 }]));
  const turns = nightTurns(deck);
  for (let g = 0; g < games; g++) {
    const state = deal(deck, players, Math.random, rules);
    const progress = state.dealt.map(r => ({ ...freshProgress(), done: !ROLE[r].steps }));
    const log: LogEntry[] = [];
    turns.forEach((role, turn) => state.dealt.forEach((r, seat) => { if (r === role) log.push(...advance(state, seat, {}, progress[seat], turn + 1, Math.random, { force: true, history: log })); }));
    dawn(state, deck, turns.length + 1, Math.random);
    // A Moon-Thief swaps two other seats at random, half the time.
    state.dealt.forEach((r, seat) => {
      if (ROLE[r].dayPower !== "swap" || Math.random() < 0.5) return;
      const others = [...Array(players).keys()].filter(i => i !== seat).sort(() => Math.random() - 0.5);
      daySwap(state, others[0], others[1]);
    });
    const votes = state.cards.map((_, i) => { let v = Math.floor(Math.random() * (players - 1)); if (v >= i) v++; return v; });
    const o = resolveVote(state.cards, votes, { bitten: state.bitten, imago: state.imago, marks: state.marks, rules });
    win[o.winningTeam] = (win[o.winningTeam] ?? 0) + 1;
    const wolves = state.cards.flatMap((r, i) => (ROLE[r].tags.includes("wolf") ? [i] : []));
    if (wolves.length) { wolfAtTable++; if (wolves.some(w => o.deaths.includes(w))) wolfDead++; }
    if (!o.deaths.length) nobodyDead++;
    if (o.deaths.length > 1) multi++;
    if (o.wolvesDown > 0 && o.centaursDown >= o.wolvesDown) ties++;
    if (o.deaths.some(i => state.cards[i] !== state.dealt[i])) elimMoved++;
    moved += state.cards.filter((r, i) => r !== state.dealt[i]).length;
    const creatures = o.teams.flatMap((t, i) => (t === "wild" ? [i] : []));
    if (creatures.length || deck.some(r => ROLE[r].team === "wild")) { creatureGames++; if (creatures.some(i => o.winners.includes(i))) creatureWin++; }
    cursed += o.cursed.length;
    if (state.bitten) bitten++;
    if (state.imago.length) imago++;
    const wolfWon = o.winningTeam === "werewolf";
    for (const r of ids) { const h = heldStats[r]; if (state.cards.includes(r)) { h.games++; if (wolfWon) h.wolfWins++; } else { h.notGames++; if (wolfWon) h.notWolfWins++; } }
  }
  const f = (x: number, d = games) => (d ? x / d : NaN);
  return {
    games, win: Object.fromEntries(Object.entries(win).map(([k, x]) => [k, f(x)])), creatureWins: f(creatureWin, creatureGames), prophecyWins: f(creatureWin, creatureGames),
    wolfAtTable: f(wolfAtTable), wolfDeadWhenPresent: f(wolfDead, wolfAtTable), nobodyDead: f(nobodyDead), multiElim: f(multi), bloodPriceTies: f(ties),
    movedPerGame: moved / games, eliminatedHeldMoved: f(elimMoved), cursedPerGame: cursed / games, bitten: f(bitten), imago: f(imago),
    held: Object.fromEntries(ids.map(r => [r, { held: f(heldStats[r].games), wolfWinWhenHeld: f(heldStats[r].wolfWins, heldStats[r].games), wolfWinWhenNot: f(heldStats[r].notWolfWins, heldStats[r].notGames) }])),
  };
}
