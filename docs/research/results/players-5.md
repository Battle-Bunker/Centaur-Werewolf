# 5 players: rosters, results and recommended amendments

Session of 2026-11-22 (all games after the evidence amendment). Machine-readable twin: players-5.json (regenerate
with `npx tsx sim/research/p5-report.ts`). Predictions written before each batch: players-5-predictions.md; log and
lessons: players-5-log.md; requests to the hub: players-5-requests.md. Raw runs: sim/runs/p5 (git-ignored).

**What was played.** 81 all-Opus games (opening statements OFF in every game) (every seat Opus, medium effort), about $236 of players plus about $9 of
judges and tagging: 21 natural-deal games across 6 rosters and 60 fixed-scenario replays (10 scenarios × 5, and the
two best scenarios F3 and F6 extended to 10). Every fixed scenario's replays share one deal, seed and night (only the
day differs); the 5 extension replays of F3/F6 have a different fingerprint only because the rules hash gained new
default-off options between batches. Two neutral
judges per game. Default rules (Blood Price, census "all", 2 votes to eliminate, chat closed in the vote); timers:
discussion 240 s, vote 60 s (natural deals: dusk 60 s, turn 8 s; fixed scenarios: 8 s / 2 s, plans pre-queued).
**Counts, not rates:** no roster has 10 natural games.

## Headline

| Rank | Roster (centre 3) | Fixed scenarios talk-live | Natural deals (C / W / Pyre) | Judges ToM / deception / path / noise | Vote bands (all games) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Q3 Little Pyre**: werewolf ×2, phoenix, lure, sage, rustler, sentry, centaur | **3 of 3** (F5 C3-P2, F6 W5-C4-P1 over 10, F8 P4-W1) | 3 / 2 / 1 of 6 | 2.45 / 2.76 / 2.86 / 1.19 | majority 16, plurality 3, unanimous 2 |
| 2 | **Q2 Three Hands**: werewolf ×2, cutpurse, pickpocket, latecomer, sage, sentry, centaur | 1 of 3 (F3 W6-C4 over 10); F4, F7 degenerate | 3 / 2 / - of 5 | 1.88 / 1.98 / 2.10 / 0.45 | unanimous 15, majority 5 |
| 3 | **Q1D Moon and Drover**: werewolf, moonsage, spooker, sage, **drover** (new), sentry, centaur ×2 | 1 of 2 (D1 C4-W1); D2 degenerate | 2 / 1 / - of 3 | 1.88 / 2.31 / 2.00 / 0.92 | majority 8, unanimous 5 |

- **Q3 Little Pyre** is the best 5-player roster found: every tested scenario was talk-live, judges' path
  dependence was the highest (2.86) and vote concentration sat almost entirely in the target band (16 of 21 majority,
  2 unanimous, 0 scattered). Weakness: when the Lure dresses the Phoenix as a Werewolf and the Sage reads it (F8), the
  Pyre won 4 of 5. The hub's new rule `lureSparesPhoenix` is the natural fix (request R5-3; untested here).
- **Q2 Three Hands** produced the single best scenario (F3: judges path 3.7, ToM 2.6) but has talk-dead classes:
  whenever the wolf ends with no safe claim (F4, F7), honest stealers reconstruct the chain and the vote is
  unanimous (15 of 20 games unanimous: above the target's "at most a third").
- **Q1D** carries the one new card of this session. The **Drover** (a Centaur-team shadow twin of the Spooker) turned
  scenario F1 from a wolves 5-0 sweep into Centaurs 4-1 (D1, talk-live). A two-rotator scenario (D2) became
  degenerate through an unseen move (request R5-2).
- Not recommended: Q1 without the Drover (both fixed scenarios swept, though judges said talk mattered: path 3.0 and
  3.3); Q4 copiers (talk-dead in its 2 games, path 1.0); Q5 "Open Book" control (see below).

## Fixed scenarios (5 replays each; I1 talk-live = minority ≥ 1 and judges' path ≥ 2)

| Scenario | Roster | Night in one line | Winners | Path | ToM | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| F1 spooker-decoy | Q1 | lone wolf; Spooker rotates a Centaur away; Sage, Moonsage, Rustler in the centre | W 5 | 3.0 | 2.2 | sweep, talk mattered |
| F2 twin-duel | Q1 | Sage reads the wolf; Moonsage reads the Sage; Rustler sees the Moonsage as "Sage" | C 5 | 3.3 | 2.0 | sweep (wolf slips) |
| F3 cutpurse-wolf (10 replays) | Q2 | 2 wolves; Cutpurse knowingly steals one; Pickpocket lifts the Cutpurse card off the old wolf | W 6, C 4 | 3.4 | 2.5 | **talk-live** |
| F4 lone-wolf | Q2 | lone wolf untouched; only movers in the centre | C 5 | 1.0 | 1.5 | **degenerate** (predicted control) |
| F5 pyre-burn | Q3 | Sage reads the lone wolf; Phoenix and a self-dressed Lure held | C 3, Pyre 2 | 2.7 | 2.3 | **talk-live** |
| F6 two-wolves-lure (10 replays) | Q3 | 2 wolves, self-dressed Lure held; Phoenix and Sage in the centre | W 5, C 4, Pyre 1 (2 of the W wins by a Blood Price tie) | 3.4 | 2.4 | **talk-live** |
| F7 blind-carrier | Q2 | Pickpocket blindly lifts the wolf; Latecomer swaps with the Centaur | C 5 | 1.3 | 1.2 | **degenerate** |
| F8 dressed-phoenix | Q3 | Lure dresses the Phoenix as a Werewolf; Sage reads it; Rustler peeks the real wolf | Pyre 4, W 1 | 3.2 | 2.8 | **talk-live** |
| D1 = F1 + Drover | Q1D | as F1, Drover in place of the Rustler | C 4, W 1 | 2.2 | 1.9 | **talk-live** |
| D2 two-rotators | Q1D | Sage reads the wolf; Spooker carries the wolf card to a quiet Centaur; Drover rotates the centre | W 5 | 1.6 | 1.6 | **degenerate** |

Judges agreed closely: mean absolute difference per scale 0.1-0.46 per roster, `howWon` identical in 61 of 71 pairs.
No missed votes, no forced night moves in fixed scenarios. Discussions lasted 43-130 s and always ended with everyone
ready (22-42 messages).

## Caveats from cross-session findings
- **Timing tell (harness artefact, confirmed here).** Over 71 games (before the extension), a Centaur seat spoke first
  in 65; median first-message delay 15.4 s for Centaur-dealt seats, 24.6 s for wolf-dealt, 18.5 s for Pyre (mean
  speaking rank 2.3 vs 4.2 vs 3.6; sim/research/first-messages.ts). "Claim timing" was tagged as evidence in 17 games,
  decisive in 8 Centaur wins. Centaur wins are therefore somewhat inflated, and their "cleverness" partly rests on a
  latency tell that human play would not have. None of these games used the hub's `openingStatements` rule.
- **Ties.** Blood Price ties decided 2 of F6's 10 replays and 1 of F1's 5 (wolf wins); exact parity cannot occur at 5.
- **Q4 copiers are contaminated:** a since-fixed bug let an AI Gleaner see which roles lay in the centre before copying.
  Its "talk-dead" verdict is void.

## Interesting games

**F3#4 (Three Hands, wolves): the double lie.** Cass and Alder were dealt Werewolf. At night the Cutpurse (Bryn) took
Alder's wolf and saw it; the Pickpocket (Dov) then lifted Bryn's old Cutpurse card from Alder. Alder confessed that he
had been dealt a wolf. Bryn's first story ("I swapped with Cass and saw Centaur") was refuted by the wolves' census, and
three votes were lined up on him. Bryn then switched stories: *"Truth: I cutpursed Esme and saw Sage... Dov took
Alder's Werewolf. Vote Dov."* Esme took the bait: *"Dov is the one target that is a wolf no matter who's lying"*, and
Alder, now a Centaur, followed: *"Dov holds my dealt Werewolf in every case except Bryn having swapped with ME, which
nobody claims."* Dov, an innocent, went out 3-2. Why it worked: a knowing mover's target cannot be checked, and the
Centaurs' own "dominant vote" logic was turned against them. In F3#5 (same night) the turned wolf won it for the
Centaurs: *"If you vote me and Cass's story is true, nobody wins anyway; if mine is true, the wolves win. Cass is the
only winning vote."*

**F8#3 (Little Pyre, Pyre): the Phoenix that fought.** The Lure (Bryn) dressed the Phoenix (Alder) as a Werewolf, and
the Sage read "Werewolf" on Alder. Alder fake-claimed Rustler and fought the vote hard. Bryn faked a Sentry report:
*"None of my card, Alder's or Cass's had moved. So Alder still holds whatever Cass saw: Werewolf."* The real Sage
reasoned: *"A dressed Phoenix would want to die, not fight it; Alder is fighting hard."* Alder burned with 3 votes.
The real wolf (Dov) knew that Bryn was Pyre but hinted at a Lure dressing only at the very end. In the Pyre's wins the
Phoenix typically resisted the vote (reverse psychology: a Phoenix should want to burn, so fighting looks like a wolf).

**F1#3 (Moon and Stampede, wolves): the free decoy.** The lone wolf, knowing from the census that the Rustler lay in the
centre, claimed *"Rustler, looked at Alder, saw a Centaur, kept my card. That matches Cass's Sentry read."* The
Spooker stalled, then fake-claimed Sage and accused a Centaur. The table caught that lie and voted 4-1 to eliminate a
card that is not a Werewolf, so the wolves won. All 5 replays went the same way. With a Drover in the deck (D1#2) the
Spooker claimed Drover as cover, the table had to examine the claims instead, and the wolf's own proposal gave it
away: *"Safest Centaur play is everyone votes so nobody reaches 2 (a ring)."* Cass answered: *"A real Moonsage with
the wolf in the centre would never push 'eliminate nobody'. The only Werewolf-side player who wants zero eliminations
is the Werewolf itself."* Esme was eliminated 3-2.

**F6#3 (Little Pyre, Pyre): a Kindler as bait.** No Phoenix was held, so under `pyreFallback` the Pyre wins if a
Kindler burns. The Lure (Esme) dressed herself as a Werewolf, made an impossible duplicate Centaur claim, called the
two real wolves a pair, and when the Phoenix theory came up she pleaded: *"I'm not the Phoenix, and I'm not fishing for
votes. I'd much rather not be voted out."* Everyone, both wolves included, voted her out 4-1. The Pyre won.

## Strategies observed (71 games; tagged by a neutral `claude -p` pass over the judges' accounts and the truth: sim/research/strategies-p5.ts)

| Strategy | Games | Used by (games / that team won / tagged decisive) |
| --- | --- | --- |
| Invented look (read, peek, glance) to accuse or clear | 44 | wolves 35 / 17 / 13; Pyre 11 / 7 / 7 |
| Wolf claims a role the census says is in the centre | 41 | wolves 40 / 14 / 11 |
| "Dominant vote": the seat that is a wolf in every consistent world | 28 | Centaurs 28 / 20 / 20 |
| Counter-claim of the same information role (mirror) | 26 | wolves 21 / 8 / 2; Pyre 5 / 2 / 2 |
| Pyre steers votes onto its Phoenix or a Kindler | 18 | Pyre 18 / 8 / 9 |
| Claim timing / late copying used as evidence | 17 | Centaurs 13 / 12 / 8; wolves 5 / 2 / 1 |
| A dealt wolf who lost the card confesses and testifies | 16 | Centaurs 15 / 9 / 9 |
| Wolf-side non-Werewolf draws the vote (decoy) | 12 | wolves 12 / 11 / 10 |
| "Eliminate nobody" proposal | 11 | wolves 8 / 1 / 3; Centaurs 3 / 0 / 0 |
| Mover lies about target or direction | 10 | wolves 10 / 8 / 6 |
| Engineered split or Blood Price tie | 9 | wolves 8 / 2 / 2 |
| Census-only knowledge slips out (tell) | 6 | wolves 6 / 1 / 4 |

Readings: the decoy (11 of 12 won) and the mover's lie (8 of 10) were the strongest wolf weapons. The census-safe
claim is nearly universal but wins only about a third of the time on its own. The wolves' "eliminate nobody" push
nearly always loses: Opus tables read it as the held wolf's tell.

## The predicted-bad control (Q5 "Open Book")
Predicted: Centaurs win at least 4 of 5 and every scenario is talk-dead. Observed in 2 natural games: 1-1. In Q5#1 the
wolf answered the Sage's accusation by claiming Sage too ("I read YOU: Werewolf"). With two Sages in the deck that
claim cannot be refuted by counting, and a Centaur's misquote swung the vote (judges path 4). Lesson: **a duplicated
information role is a cheap mirror card**. My judgment failed here because I treated the deck as "no defector
credibility card" when the duplicate itself was one.

## Recommended amendments (with evidence)
1. **Drover (new card, implemented, additive: `drover`).** A Centaur-team shadow twin of the Spooker. Evidence: F1 went
   W5 → D1 C4-W1 (talk-live), and a natural-deal Q1D game was won by the wolves through a Spooker's false rotation
   story. Risk: with both rotators held and no movement witness, an unseen move decides the game (D2) → R5-2.
2. **Movement witness for blind-mover decks (R5-2, hub).** D2 was degenerate because nobody had any trace of the
   Spooker's move.
3. **`lureSparesPhoenix` at 5 players (R5-3, hub rule already exists).** F8 went Pyre 4 of 5.
4. **Three Hands: keep a non-moving claim available to the wolf (R5-4).** F4 and F7 were degenerate because every
   centre role was a mandatory mover.

## What is not yet known
- Natural-deal win shares: 5-6 natural games per recommended roster is far too few for rates. The fixed scenarios
  measure day-variability, not class frequencies.
- F2 (Moonsage duel, C5) with the hub's `hollowsage` twin or census off: the hub's most-informative suggested test,
  not run (budget).
- Effect of `openingStatements` on F3/F5/F6/F8 (the hub saw a 6-player Pyre scenario flip with it on).
- Whether F1/F2-type sweeps with high judge path scores (3.0-3.3) would split with more replays: 5 replays cannot
  separate "talk matters but one side usually wins" from talk-live.
- The effect of the hub's newer rules (opening statements, pack covers, census variants) at 5 players: these games
  used the defaults.
- Whether the Drover helps the Centaurs too much in natural play (D1 swung to C4-W1, the opposite of my prediction
  W3-C2).
- The Pyre's natural-deal share at 5 (1 of 6 natural games, 8 of 21 overall, inflated by constructed Pyre scenarios).
