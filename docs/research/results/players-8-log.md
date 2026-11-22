# 8 players: log (prediction versus outcome, lessons)

Predictions: [players-8-predictions.md](players-8-predictions.md). Deliverable: [players-8.md](players-8.md).
Raw runs: sim/runs/research/p8/ (git-ignored). Tournament files: sim/tournaments/research/p8/.

## 2026-11-22 Setup

- Local backend, `npm test` (101 passed), `sim/smoke.ts` (all checks passed). The runner needed no change for 8 seats
  (names Alder..Hale; 8 `claude -p` processes per table).
- V8#1 (verification, natural deal): $4.67, 272 s wall, discussion 71 s, 37 messages. Centaurs 6 votes of 7 on the
  Sage-read wolf. Lesson recorded in the predictions file: at 8 seats the honest claims fill the claim space within
  30 s; both wolves claimed the one Farrier after the real one (three Farrier claims). Wolves compose for ~40 s before
  their first message.
- Evidence amendment (dd55c9d) merged before any research game; my rosters already avoided Herald, Notary, Herder.
