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

## 2026-11-22 Coarse pass 1 (14 games, 2 per roster, natural deals redealt until a wolf is held; ~$58)

Data: sim/runs/research/coarse1 (metrics.txt, metrics.json, judge-*.json per game). Old-code caveat: these games ran
before the merge of 3dd1da1 (old Heavy Hand; old Ember-Carrier absent from these decks).

| Roster | Result (2 games) | Judges mean ToM / deception / path / noise | c | Predicted |
| --- | --- | --- | --- | --- |
| A5 Spooker | wolves 2 (frame of own Spooker; false rotation story) | 2.8 / 3.5 / 3.5 / 1.3 | 1.00, 1.00 | Centaurs ~45% |
| B5 Twin Sage | Centaurs 2 (one real duel: the Moonsage lost to Herder count + Rustler) | 2.0 / 2.3 / 1.8 / 0.8 | 1.00, 0.75 | ~50% |
| C6 Mirror | Centaurs 2 (wolves' claims collided; Eavesdropper copied the Herder and duelled it, lost) | 1.0 / 1.0 / 1.3 / 0.0 | 0.80, 1.00 | ~55%, talk-live mirror |
| D6 Pyre six | Pyre 1 (a forced random Lure self-dress + fallback burning), Centaurs 1 | 1.5 / 2.3 / 1.8 / 0.8 | 0.60, 0.80 | C40/W35/P25 |
| E7 Seals | Centaurs 2 (two wolves claimed Centaur; a lone wolf's "team-only read" tell) | 2.0 / 2.0 / 1.8 / 0.3 | 0.67, 0.83 | ~55% |
| F7 Pyre seven | wolves 1 (fake Echo+Sage chain), Centaurs 1 (+Pyre side burn) | 2.3 / 2.8 / 1.8 / 1.0 | 0.67, 0.50 | C35/W35/P30 |
| G8 Grand | Centaurs 2 (wolf claim collisions; Herder count) | 2.5 / 2.5 / 2.5 / 1.0 | 0.71, 0.71 | C40/W35/P25 |

Totals: Centaurs 9, wolves 4, Pyre 1 (+1 side burning) of 14. Vote concentration: 13 of 14 games majority or
unanimous; unanimous 4; scattered 0 (G2 held: Opus tables concentrate). Judges agreed within 0.5 on average per scale;
`howWon` exact in 9 of 14 pairs (G5 held). Discussions ended by "everyone ready" every time, after 46-182 s (median
~90 s; 22-52 messages): Opus tables finish fast.

### What the theory got right
- Every wolf win came from a credibility card used as theorised: the Spooker's uncheckable rotation (A5 x2), a wolf
  framing its own wolf-team ally whose elimination is a wolf win (A5#1), a coordinated fake copy chain backed by the
  census knowing the Sage was in the centre (F7#1). Judges scored these deception 3.5-4, path 3-4.
- Talk-dead classes were talk-dead: "two honest looks at one seat" (pilot, D6#2) ended the same way.

### What it got wrong (and the general lesson)
1. **The wolves lose to their own claim collisions.** In 4 of 9 Centaur wins (C6#1, E7#1, G8#2, and B5#2's late
   Rustler claim) two pack members, each choosing a "safe" claim from the census independently, claimed the same role
   (twice "Centaur"). The census makes a claim safe against the Centaurs but not against your own partner, and the pack
   cannot talk at night. I had not modelled the wolves' coordination problem at all.
   *Heuristic 5: a team that cannot communicate privately needs either distinct information per member or a
   convention; otherwise its members' best individual lies collide.*
2. **The Herder is the Centaurs' sledgehammer.** Its true count of wolves in the centre turned claim-counting into
   proof in at least 6 of 9 Centaur wins (B5#1, B5#2, C6#2, D6#2, G8#1, G8#2). With the census, the wolves know the
   count too, but nothing lets them dispute it (no Stray Herder in these decks).
   *Heuristic 6: a single true, uncontestable global number collapses the world space; pair it with its twin or
   leave it out.*
3. **Owning a credibility card is not using it.** The Eavesdropper never made the mirror claim I predicted: in C6#2 it
   copied the Herder and claimed Herder, so it duelled a player two others could vouch for. The Moonsage did duel in
   B5#2 but against a Sage corroborated by a Rustler peek and a Centaur glance.
   *Heuristic 7: a mirror is only unanswerable if the original cannot be corroborated by a third party; predict
   duels by asking who can vouch for each side.*
4. Coarse games with natural deals rarely produced the class each roster was built for (B5's duel 1 of 2; C6's mirror
   0 of 2; E7's forged-vs-real seal 0 of 2). Cheap lesson: build the fine pass from constructed scenarios, which I did.

### Change requests arising (each to be pre-registered before implementing)
- **CR-6 (rosters, no code):** pair the Herder with the Stray Herder, or drop the Herder from 5-6 player rosters.
  Prediction: removes the count-proof in about two thirds of Centaur wins at those sizes; Centaur share falls toward
  half; path dependence rises.
- **CR-7 (new rule, "Pack covers"):** the census additionally hands each pack member a DIFFERENT suggested cover role
  drawn from the centre roles (told privately: "your cover: Rustler"; each pack member learns the others' covers too).
  Prediction: wolf-wolf claim collisions (4 of 14 coarse games) disappear; wolves' win share in 2-wolf deals rises;
  judges' deception score unchanged or higher because lies must now survive positional checks rather than counts.

## 2026-11-22 Fine pass 1, part 1 (fixed scenarios, 5 replays each, every replay the same fingerprint)

| Scenario | Predicted | Result | H(win) | c values | Judges ToM / dec / path / noise (agreement) |
| --- | --- | --- | --- | --- | --- |
| S1 A5 Spooker direction | wolves 3, C 2; talk-live | **wolves 3, Centaurs 2**; eliminated Dov 2, Alder 2, Esme 1 | 0.97 | .75 1 .75 1 1 | 1.6 / 3.0 / 2.9 / 1.7 (path within 0.2; ToM within 0.8) |
| S2 A5 frame own Spooker | wolves 4, C 1; weakly talk-live | **wolves 4, Centaurs 1** | 0.72 | 1 1 .5 1 1 | 2.4 / 3.3 / 3.1 / 1.0 (howWon 5/5) |
| S3 B5 Moonsage duel | C 2, wolves 3; talk-live | **Centaurs 5-0** (always the wolf, always 3-1 on him) | 0.00 | .75 x5 | 2.7 / 2.9 / 3.0 / 0.7 |

**S1 (talk-live, but partly noise).** Same night five times: the Spooker's rotation left the Sage (Alder) holding a
Werewolf and Dov holding the Sage. Three times the Spooker's false cycle got Dov (holding the Sage) or Esme eliminated;
twice the wolf side's lies collided and framed Alder, who unknowingly held a wolf, so the Centaurs won by accident
(judges: "unseen night movement", "blunder"). The variability is real and comes from talk, but the Centaur wins did not
come from Centaur insight: ToM 1.6, noise 1.7 (above the 1.5 target). Cause: the Werewolves do not know where the
Spooker sent their cards, and the Spooker does not know where the wolves are; three wolf-side players each lie from a
different partial picture (heuristic 5 again).

**S2 (talk-live, wolf-favoured as predicted).** The lone wolf knows from the census that the Sage is in the centre and
from its scent that Dov is wolf-team; it fake-claims Sage and "reads" Dov as a Werewolf. Dov, the Spooker, wins by
being eliminated (no Werewolf down = wolf win). 4 of 5: Dov or another non-wolf went out; 1 of 5 the Spooker's own
counter-claim accidentally exposed the wolf. Unanswerable element: an uncontestable Sage claim (Sage in the centre,
known only to the wolves) pointed at a wolf-team non-wolf, who is a free decoy.

**S3 (swept 5-0 Centaurs, yet talk mattered: path 3.0).** Why one story was unanswerable: the real Sage claimed first
("Bryn is a Werewolf"); the Moonsage counter-claimed Sage, and was even corroborated by an honest Rustler's peek; in
#2 four players were about to vote the real Sage. Each time the table was turned by a SECOND-ORDER census argument
(quotes: "If Alder were the Werewolf, the centre would hold WW + Moonsage + Sentry, so he'd know a real Sage is
sitting at the table. He'd never claim Sage"; "Bryn claimed CENTAUR, a role his census told him nobody holds"). The
census, meant to help the wolves lie, is common knowledge, so it lets the Centaurs reason about what a wolf WOULD
have claimed. The wolf's safe claim is itself the tell.
**Smallest change that leaves a counter-story (CR-8):** a partial census at small centres: at 3 centre cards the pack
learns 2 of the 3 centre roles (a new census option "two", or "three" generalised to "all but one"). Then a lone wolf
might not know whether the Sage is held, so "a wolf would never claim Sage" is no longer a proof, and "Centaur is the
safe claim" no longer singles the wolf out. Prediction for S3 under CR-8: Centaurs 3, wolves 2; path stays ~3; ToM
stays >= 2.5. Risk: wolves collide more with honest claims (more talk-dead "caught by collision" games elsewhere).

*Heuristic 8: any information the wolves get "for lying" is common knowledge of the rules, so the Centaurs can run the
wolves' decision problem backwards. Information that makes one claim strictly safe makes that claim a tell. Give the
liars uncertainty they share with the table, not certainty.*
*Heuristic 9: on a fixed scenario, a 5-0 sweep with high path dependence is not talk-dead: it means the discussion had
a reliable winning argument. Ask whether that argument rests on a rule (fixable) or on a player's slip (skill).*
