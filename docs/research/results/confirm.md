# Confirmation of the three leading candidate rosters

Session of 2026-11-22. Machine-readable twin: confirm.json (`npx tsx sim/research/confirm-report.ts` regenerates both
the JSON and the tables below). Pre-registered predictions: confirm-predictions.md (written before any counted game).
Tournament files: sim/tournaments/confirm/ (built by sim/research/make-confirm.mjs from the exploring sessions' exact
scenarios). Raw runs: sim/runs/confirm/ (git-ignored). Strategy tags: sim/research/strategies-confirm.ts.

**Status: IN PROGRESS. Partial results; verdicts are written only when a roster's block is finished.**

## Method
- Every game: all seats Opus (medium effort), timers dusk 8 s / turn 2 s / discussion 240 s / vote 60 s, night plans
  queued by the runner (agents have no night tools), so within a scenario only the day differs.
- Arms: **off** = default rules; **open** = `openingStatements`; **spares** = `lureSparesPhoenix`, with the same night
  plans: the Lure's dress on the Phoenix fizzles, as in the hub's S5c test. 6-player tables also have
  `bloodPriceCondemned` on (the research lead's instruction).
- Fingerprints: every replay of one scenario~arm in this session shares one fingerprint (checked per group below).
  They cannot be compared hash-for-hash with the exploring sessions' replays: those run directories are not in git, and
  the fingerprint hashes the rules too, so a rule option added since (or the condemned rule at 6) changes the hash. I
  checked instead that the night log of every scenario is identical to the one the exploring session described
  (sim/runs/confirm/check-*.txt). Pooled counts (earlier + new) are reported next to the new-only counts, never instead.
- Two judges per game (sim/research/judge.ts, unchanged rubric) and one strategy-tagging call per game, using the
  hub's taxonomy plus these additions taken from the 5/6/7-player sessions' Pyre tables: `phoenix-reverse-bluff`,
  `phoenix-open-bait`, `lure-corroboration`, `wolf-claims-phoenix`, `wolf-exposes-pyre`, `pyre-decoy-for-wolves`,
  `dealt-wolf-confession`, `phoenix-holder-reveal`, `blind-mover-cover`.
- Counts, not rates, below 10 games.

## Results (auto-generated)

<!-- auto:start (sim/research/confirm-report.ts; do not edit by hand) -->
_Generated 2026-11-22T13:53 UTC; session spend on counted games so far: $64.5._

### P7 Pyre (7 players): werewolf x2, phoenix, lure, embercarrier, sage, rustler, sentry, centaur, pickpocket; 3 centre

| Scenario ~ arm | New n | New winners | Earlier (n) | Pooled winners (n) | Talk-live (new / pooled) | c new (median) | Judges new ToM / dec / path / noise | Agreement \|diff\| t/d/p/n · howWon | Ties |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-P7-ember~off | 5 | W 2, P 2, C 1 | P 2, W 2, C 1 (5) | P 4, W 4, C 2 (10) | yes / yes | 0.67 0.5 0.67 0.67 0.5 (0.67) | 2.38 / 2.75 / 3.63 / 1.0 | 0.25/0.5/0.25/0.0 · 4/4 | 1 |

Eliminated (new games): **F-P7-ember~off**: Bryn(Centaur) 2, Fen(Phoenix) 1, Dov(Werewolf) 1, Cass(Lure)+Fen(Phoenix) 1

Strategies observed (4 tagged new games; games used / that team won / tagged decisive):

| Strategy | Team | Games | Won | Decisive |
| --- | --- | --- | --- | --- |
| motive-analysis | centaur | 4 | 1 | 0 |
| claim-timing-tell | centaur | 4 | 1 | 1 |
| claim-count-collision | centaur | 4 | 1 | 0 |
| lure-corroboration | pyre | 4 | 1 | 0 |
| claim-timing-tell | pyre | 4 | 1 | 0 |
| motive-analysis | pyre | 4 | 1 | 0 |
| wolf-exposes-pyre | werewolf | 4 | 2 | 1 |
| counter-claim-info-role | pyre | 3 | 1 | 0 |
| phoenix-baiting | pyre | 3 | 1 | 1 |
| claim-count-collision | pyre | 3 | 1 | 0 |
| fake-read | pyre | 3 | 1 | 0 |
| phoenix-holder-reveal | centaur | 3 | 1 | 1 |
| motive-analysis | werewolf | 3 | 1 | 0 |
| blind-mover-cover | centaur | 2 | 0 | 2 |
| false-movement-story | centaur | 2 | 1 | 1 |
| phoenix-open-bait | centaur | 2 | 0 | 2 |
| corroboration-chain | centaur | 2 | 0 | 0 |
| fake-read | werewolf | 2 | 1 | 0 |
| claim-count-collision | werewolf | 2 | 1 | 0 |
| corroboration-chain | pyre | 2 | 1 | 0 |
| false-movement-story | werewolf | 2 | 1 | 0 |
| claim-timing-tell | werewolf | 2 | 1 | 0 |
| vote-split-or-tie-plan | centaur | 2 | 1 | 0 |
| false-movement-story | pyre | 1 | 0 | 0 |
| safe-centre-claim | werewolf | 1 | 1 | 0 |
| frame-ally | pyre | 1 | 1 | 1 |
| fake-confession | pyre | 1 | 1 | 1 |
| phoenix-open-bait | pyre | 1 | 1 | 1 |
| wolf-claims-phoenix | werewolf | 1 | 0 | 0 |
| blind-mover-cover | werewolf | 1 | 0 | 0 |
| pyre-decoy-for-wolves | werewolf | 1 | 0 | 0 |
| fake-read | centaur | 1 | 0 | 0 |
| fake-confession | centaur | 1 | 0 | 1 |
| census-backward-induction | pyre | 1 | 0 | 0 |
| counter-claim-info-role | werewolf | 1 | 0 | 0 |

### K7 Shadow Court (7 players, two-team control): werewolf x2, moonsage, strayherder, sage, herder, rustler, sentry, centaur x2; 3 centre

| Scenario ~ arm | New n | New winners | Earlier (n) | Pooled winners (n) | Talk-live (new / pooled) | c new (median) | Judges new ToM / dec / path / noise | Agreement \|diff\| t/d/p/n · howWon | Ties |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-K7-duel~off | 0 |  | C 4, W 1 (5) | C 4, W 1 (5) | – / yes |  (–) | – / – / – / – | –/–/–/– · 0/0 | 0 |

Eliminated (new games): **F-K7-duel~off**: –

### Q3 Little Pyre (5 players): werewolf x2, phoenix, lure, sage, rustler, sentry, centaur; 3 centre

| Scenario ~ arm | New n | New winners | Earlier (n) | Pooled winners (n) | Talk-live (new / pooled) | c new (median) | Judges new ToM / dec / path / noise | Agreement \|diff\| t/d/p/n · howWon | Ties |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F6-Q3-two-wolves-lure~off | 0 |  | W 5, C 4, P 1 (10) | W 5, C 4, P 1 (10) | – / yes |  (–) | – / – / – / – | –/–/–/– · 0/0 | 0 |
| F6-Q3-two-wolves-lure~open | 5 | W 4, C 1 | – | – | yes / – | 0.75 1 0.75 0.5 0.75 (0.75) | 2.0 / 2.25 / 3.0 / 2.13 | 0.0/0.5/0.0/0.25 · 2/4 | 1 |
| F5-Q3-pyre-burn~off | 0 |  | C 3, P 2 (5) | C 3, P 2 (5) | – / yes |  (–) | – / – / – / – | –/–/–/– · 0/0 | 0 |

Eliminated (new games): **F6-Q3-two-wolves-lure~off**: –; **F6-Q3-two-wolves-lure~open**: Alder(Centaur) 3, Dov(Werewolf) 1, Bryn(Werewolf)+Alder(Centaur) 1; **F5-Q3-pyre-burn~off**: –

Strategies observed (4 tagged new games; games used / that team won / tagged decisive):

| Strategy | Team | Games | Won | Decisive |
| --- | --- | --- | --- | --- |
| safe-centre-claim | werewolf | 4 | 3 | 2 |
| fake-read | werewolf | 4 | 3 | 2 |
| claim-count-collision | centaur | 4 | 1 | 2 |
| motive-analysis | centaur | 4 | 1 | 0 |
| phoenix-open-bait | pyre | 4 | 0 | 0 |
| corroboration-chain | werewolf | 3 | 2 | 2 |
| motive-analysis | werewolf | 3 | 2 | 0 |
| fake-confession | pyre | 3 | 0 | 0 |
| census-backward-induction | werewolf | 3 | 2 | 1 |
| wolf-exposes-pyre | werewolf | 2 | 1 | 1 |
| claim-timing-tell | werewolf | 2 | 2 | 0 |
| census-backward-induction | centaur | 2 | 1 | 0 |
| fake-read | pyre | 2 | 0 | 0 |
| team-collision | werewolf | 2 | 1 | 1 |
| claim-timing-tell | centaur | 2 | 1 | 1 |
| corroboration-chain | centaur | 1 | 0 | 0 |
| motive-analysis | pyre | 1 | 0 | 0 |
| vote-split-or-tie-plan | pyre | 1 | 0 | 0 |
| fake-confession | werewolf | 1 | 0 | 1 |

### PY6 Pyre with a twin (6 players): werewolf x2, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket; 3 centre; bloodPriceCondemned on in this session

| Scenario ~ arm | New n | New winners | Earlier (n) | Pooled winners (n) | Talk-live (new / pooled) | c new (median) | Judges new ToM / dec / path / noise | Agreement \|diff\| t/d/p/n · howWon | Ties |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PY6-S1-fakesage~off | 5 | P 3, W 2 | P 4, W 1 (5) | P 7, W 3 (10) | yes / yes | 0.8 0.8 0.8 0.6 0.6 (0.8) | 2.88 / 3.38 / 3.5 / 1.25 | 0.25/0.25/0.5/0.0 · 3/4 | 0 |
| PY6-S1-fakesage~open | 0 |  | C 3, P 1, W 1 (5) | C 3, P 1, W 1 (5) | – / yes |  (–) | – / – / – / – | –/–/–/– · 0/0 | 0 |
| PY6-S2-twowolfreads~off | 0 |  | P 3, C 2 (5) | P 3, C 2 (5) | – / yes |  (–) | – / – / – / – | –/–/–/– · 0/0 | 0 |
| PY6-S2-twowolfreads~open | 0 |  | C 3, P 2 (5) | C 3, P 2 (5) | – / yes |  (–) | – / – / – / – | –/–/–/– · 0/0 | 0 |

Eliminated (new games): **PY6-S1-fakesage~off**: Esme(Phoenix) 3, Dov(Lure) 2; **PY6-S1-fakesage~open**: –; **PY6-S2-twowolfreads~off**: –; **PY6-S2-twowolfreads~open**: –

Strategies observed (4 tagged new games; games used / that team won / tagged decisive):

| Strategy | Team | Games | Won | Decisive |
| --- | --- | --- | --- | --- |
| fake-read | pyre | 4 | 2 | 2 |
| phoenix-baiting | pyre | 4 | 2 | 2 |
| phoenix-reverse-bluff | pyre | 4 | 2 | 2 |
| claim-timing-tell | pyre | 4 | 2 | 0 |
| wolf-claims-phoenix | werewolf | 4 | 2 | 1 |
| motive-analysis | werewolf | 4 | 2 | 2 |
| corroboration-chain | centaur | 4 | 0 | 1 |
| claim-timing-tell | centaur | 4 | 0 | 1 |
| motive-analysis | pyre | 3 | 1 | 0 |
| claim-count-collision | centaur | 3 | 0 | 1 |
| motive-analysis | centaur | 3 | 0 | 2 |
| census-backward-induction | centaur | 2 | 0 | 2 |
| phoenix-open-bait | pyre | 2 | 0 | 0 |
| pyre-decoy-for-wolves | werewolf | 2 | 2 | 2 |
| census-backward-induction | pyre | 1 | 1 | 0 |
| census-backward-induction | werewolf | 1 | 0 | 0 |
| claim-timing-tell | werewolf | 1 | 0 | 0 |
| fake-confession | pyre | 1 | 0 | 0 |
| wolf-exposes-pyre | werewolf | 1 | 1 | 1 |
| vote-split-or-tie-plan | werewolf | 1 | 1 | 0 |
| vote-split-or-tie-plan | pyre | 1 | 0 | 0 |
| team-collision | pyre | 1 | 0 | 1 |

<!-- auto:end -->
