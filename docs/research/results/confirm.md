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

<!-- auto:start --><!-- auto:end -->
