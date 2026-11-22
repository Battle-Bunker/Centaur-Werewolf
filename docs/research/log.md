# Research log

## Heuristics for predicting balance (running; the in-context learning is itself a deliverable)

1. **Classify scenarios by whether an unrefutable claim is in play.** If every defector claim can be refuted by a
   mechanical cross-check (a read, a glance, a count, a movement flag), Opus Centaurs win by first-order logic and the
   scenario is talk-dead. Talk-live scenarios need at least one claim the table can only judge by modelling incentives.
2. **After-talk power is degenerate by construction.** Any effect chosen after the discussion has shown where the votes
   will go makes consensus self-defeating. Check every day power for "is it applied after the votes are predictable?".
3. **Two independent honest looks at the same seat end the game** unless a mover or distortion can explain both away.
   (Pilot: Sage + Rustler both saw the wolf; the wolf's counter-claim and a late fake Farrier swap could not survive.)
4. **Opus tables guard against tie tricks under Blood Price**: they refuse "split the vote" plans from unverified
   players, so vote-splitting lies rarely work; deception must change BELIEFS about who holds what, not vote arithmetic.

## 2026-11-22 Checkpoint 1 (environment, instruments, theory)

- Environment: local Convex backend reset (fresh database) and redeployed; `sim/smoke.ts` green, including after the
  mid-session merge of the copiers and the Pyre (8fdef55).
- Runner (sim/arena.ts): Opus default, vote phase in prompt and timeline, generalised redeal, fixed-scenario mode
  (fixed deal via `setup.fixDeal`, night plans queued by the runner with each seat's key, planning tools withheld from
  agents, fingerprint of deal + night log), `replays`.
- Instruments: sim/research/game.ts (loader, public transcript, truth), metrics.ts (I1-I4 + diagnostics), judge.ts
  (two neutral judges, fixed rubric), classes.ts (deal-class frequencies by enumeration).
- Pilot (A5, natural deal, 1 game, $4.32, 282 s; discussion ended by everyone ready after 99 s): both wolves held;
  Sage and Rustler both read the same wolf; wolf counter-claimed Sage; second wolf made a late fake Farrier claim
  ("I gave Dov the centre wolf") and proposed a "zero-risk" split; the table refused (Blood Price reasoning) and
  eliminated the read wolf 3-2. Centaurs won. Prediction for this class (Sage read the wolf, nothing moved): Centaurs,
  talk-dead. Both judges: ToM 2, deception 2, path 1, noise 0, honest-info-converged. Consistent with prediction.
  One game: no rate.

### Coordinator directions after checkpoint 1 (recorded)
- No merges into this checkout while games run; each checkpoint states whether a merge window is open; own fetch/merge only between runs.
- Commits are denied in this session; the record is the files on disk (log, predictions, change-requests); do not retry.
- Vote timer 60 s is a harness setting for AI tables, not a rules change.
- Main output of the fine pass: when a scenario sweeps, say WHY (what made one story unanswerable) and propose the smallest
  card or rule change that would have left a credible counter-story.
- Fine pass must include, per roster, at least one scenario chosen because it is predicted talk-live.

### Handover from the build session (recorded)
- shared/ and convex/ are now mine (pre-registered prediction + log entry per card change; npm test, tsc -p convex, smoke
  green; rules reference regenerated; src/ off limits; breaking changes listed under "for the UI").
- Reported landed upstream (to verify after merging at the next break): CR-1, CR-2 (cutDuringVote off), CR-3 (Ember-Carrier
  a blind night swap), CR-4 (Moon-Thief day swap behind `daySwap`, off), CR-5 (seeded replay; fingerprint incl.
  proclamation order).
- **Decision on X2 (owner's Ember-Carrier prediction).** The after-talk ember was removed on calibration grounds before it
  could be tested. I will not reintroduce it: the Moon-Thief with `daySwap` ON is the same structure (a swap chosen after
  the discussion has shown where the votes go) and is still a rule setting, so it serves as the empirical degeneracy
  control X1' (one fixed 5-player scenario, 3 replays). If X1' sweeps with low path dependence, the owner's prediction
  about the ember is confirmed by its structural twin; if not, my structural argument is wrong and the ember question
  reopens.
