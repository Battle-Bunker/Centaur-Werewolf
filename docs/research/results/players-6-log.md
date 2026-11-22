# Players-6: log of predictions versus outcomes, and lessons

Raw runs: sim/runs/p6/ (git-ignored). Metrics: `npx tsx sim/research/metrics.ts sim/runs/p6/<dir>`.

## Setup check (11:41, not counted)
V6#1 (werewolf x2, moonsage, sage, rustler, sentry, centaur, herder, pickpocket): $3.37, 269 s, 28 messages, ended by
ready after 92 s. The Pickpocket robbed a wolf; the robbed wolf (now Centaur team) confessed and named its packmate;
Sage + Sentry + Herder 0 closed it; Centaurs 4-2.

## Coarse pass (11 games, 11:51-12:10, ~$49; HU6 held back: Hush harness bug reported by the hub)

| Roster | Games | Winners | c values | Judges ToM / decep / path / noise | Predicted |
| --- | --- | --- | --- | --- | --- |
| TW6 twins everywhere | 3 | wolves 2, Centaurs 1 | 0.8 0.6 0.6 | 2.0 / 2.3 / 1.5 / 1.0 | C55 W45, path 2.3 |
| PY6 Pyre + Moonsage | 3 | Pyre 1, Centaurs 1, wolves 1 | 0.8 0.8 0.6 | 2.3 / 2.8 / 3.0 / 1.5 | C40 W35 P25, path 2.6 |
| SE6 anonymous seals | 3 | wolves 3 | 0.6 0.6 0.8 | 1.8 / 2.2 / 1.7 / 1.0 | C45, path 2.5 |
| SO6 stealer soup (predicted BAD) | 2 | Centaurs 2 | 1.0 0.8 | 2.3 / 2.3 / 2.3 / 1.0 | noise >= 2, ToM <= 1.5 |

Judges agreed within 0.5 per scale on average; `howWon` exact 7/11. Discussions ended by "ready" every time
(65-136 s, 31-45 messages).

### What the theory got wrong
1. **The parity bloc (new, the biggest finding).** 4 of the 5 wolf wins (TW6#2, TW6#3, SE6#1, SE6#2) were the same
   shape: the deal put THREE wolf-team cards in six hands (two wolves + a Moonsage or Stray Herder or Counterfeiter).
   The Centaurs, correctly, all voted a wolf; the wolf team all voted one Centaur; 3-3 tie; one Werewolf and one Centaur
   eliminated; Blood Price gives the wolves the win. The twins do not know the pack, but they found each other through
   the talk within a minute (whoever is attacking the claims the Centaurs believe). Once three wolf-team cards are
   held, no discussion can win for the Centaurs: the alternative to a tie is no elimination (also a wolf win).
   Judges' path 1 in TW6#2-3. My rosters had 4 wolf-team cards in 9: P(3+ wolf-team held | a wolf held) = 50/77 = 65% (exact
   enumeration), so TW6 and SE6 are mostly parity deals by construction. **Heuristic P6-1: at 6 players with Blood Price, any deal with half the seats on the wolf team is
   a degenerate wolf win. Keep wolf-team cards at most 3 of 9 (parity 26% of wolf-held deals) or 3 of 10 with 4 centre (18%), or let a
   third team hold seats (PY6: the Pyre breaks the bloc).**
2. **The stealer soup was not noise** (falsified). Heavy blind movement plus a Sentry was reconstructed exactly from
   honest claims: every Centaur mover knows what it did, and a robbed wolf confesses (as in V6#1). Judges: noise 1.0,
   path 2.3; both games Centaur wins by honest-info-converged. **Heuristic P6-2: movement without a liar about the
   movement is information, not noise; what creates uncertainty is a mover whose report cannot be checked (the
   Spooker's direction), not the number of moves.** The soup is still poor on the target: Centaurs 2-0 by first-order
   reconstruction (low ToM requirement for the wolves' opponents was predicted correctly; the noise was not).
3. **The Counterfeiter barely forged.** SE6: one forged pair report in 3 games (SE6#2, late, ineffective). The pair
   report is weak framing material and the wolves preferred ordinary role claims. Prediction "seal duel" not reached.

### What it got right
- PY6 was the most talk-live roster: three different winners in three games, judges path 3.0 (4 in PY6#3), with the
  Lure's fake Sage read on the Phoenix (PY6#1, judges ToM 3, deception 3) the cleverest defector win so far.
  But note: in PY6#1 and PY6#2 the Lure's dress was a FORCED RANDOM move (the agent did not queue it in a 60 s dusk +
  8 s turn): the coarse-game Lure plays are partly luck. In the fine pass the dress is fixed.
- Opus tables concentrate: no scattered vote in 11 games; the plurality games (c = 0.6) are all 3-3 ties.

### Parity versus non-parity in the coarse pass (coordinator's request)
All three SE6 games were parity deals (three wolf-team cards held): SE6#1 and SE6#2 were 3-3 Blood Price ties, SE6#3 a
decoy (the Counterfeiter drew four votes on a false Pickpocket claim). None was decided by a seal. TW6: #2 and #3
parity (wolf wins by tie), #1 non-parity (Centaur win). Non-parity coarse games (6): Centaurs 4 (TW6#1, PY6#2, SO6#1, SO6#2), Pyre 1 (PY6#1),
wolves 1 (PY6#3, a 3-3 tie forced by the Lure's vote). Parity games (5): wolves 5. What made the stealer soup
legible: every mover but the Spooker was a Centaur who reported its own move truthfully; the Sentry fixed which seats
moved; the robbed wolf confessed (it was now a Centaur); the Spooker's rotation was then the only unexplained movement
and was solved by elimination.

## Fine pass 1 (PY6, 13 replays, 12:13-12:27, ~$46)

| Scenario | Predicted | Result | c | Judges ToM / dec / path / noise | Verdict |
| --- | --- | --- | --- | --- | --- |
| S1 fake Sage (both Sages in centre; dressed Phoenix unread) | Pyre 3, W 1, C 1 | Pyre 4, wolves 1 | .8 1 .8 1 .8 | 3.0 / 3.6 / 3.4 / 1.0 | talk-live |
| S2 two wolf reads (Sage reads dressed Phoenix, Rustler reads wolf) | C 2, P 2, W 1 | Pyre 3, Centaurs 2 | .6 .8 .6 .8 .8 | 2.5 / 2.7 / 2.8 / 1.0 | talk-live |
| S3 control: two honest looks at the wolf | C 3-0, path < 2 | Centaurs 3-0 | 1 1 1 | 1.5 / 1.7 / 1.0 / 0.0 | degenerate (as predicted) |

What decided them (judges' pivots, checked against transcripts):
- **The Phoenix detector and its inversion.** Every table used "a Phoenix WANTS the votes" to classify the accused. In
  S1 the Phoenix beat it 3 times by resisting ("I'm the Phoenix... DON'T vote me", read as a cornered wolf grabbing the
  Phoenix excuse; or a plainly false counter-claim and "Vote Dov, or at least split"). In S2 the Phoenix won 3 of 5 the
  same way ("a dressed Phoenix would happily take the vote, not fight it, and Bryn is fighting"). This is second-order
  play by the Phoenix, and it is the main source of within-scenario variance: whether some Centaur raises the
  third-order point ("a Phoenix who knows we use that test would fight") decides it.
- **The wolf's dilemma.** With `burningDeniesWolves`, the lone wolf must stop the burning but every defence of the
  Phoenix exposes it (S1#1, #2, #5: the wolf correctly explained the Lure/Phoenix setup and was ignored as self-serving).
  The one wolf win (S1#3) came from the wolf claiming to be the Phoenix late, which made the table vote the Lure.
- In S2 the Centaurs won when the real wolf broke silence too loudly (S2#5) or three Pickpocket claims collided (S2#1).

Lessons: **Heuristic P6-3: a sincere false accusation (an honest seer fooled by a dress) plus a player whose motive
inverts the normal reading (wants to be voted) is the most reliable talk-live engine found at 6 players.**
**Heuristic P6-4: "two independent honest looks at an unmoved card" is talk-dead whatever else is in the deck,
unless some card in play can explain BOTH looks away (a late mover, or a dress).**

## Coarse pass 2 (6 games, 12:29-12:40, ~$25)

| Roster | Result | c | Judges ToM / dec / path / noise |
| --- | --- | --- | --- |
| PE6 Ember Pyre | Centaurs 2, wolves 1 | .8 .8 1 | 1.7 / 2.3 / 2.3 / 0.7 |
| TW6c twins, census allButOne + packCovers | Centaurs 2, wolves 1 (parity, 3-3 tie) | .6 1 .8 | 1.7 / 2.0 / 1.3 / 0.5 |

- PE6: the Ember-Carrier's swap was a forced random move in PE6#1 (agent did not queue it), the Pyre lost all three.
  An Ember swap is a Spooker without a direction to lie about: once the Sentry and honest movers speak, the swap is
  reconstructed. Not promising for the target; dropped.
- TW6c: packCovers worked (no wolf-wolf claim collisions; the wolves took the covers Sentry and Sage), but the Moonsage
  was absent or the cover was refuted by centre looks (a "Sage" seen in the centre was the Moonsage). Non-parity games
  were honest-info-converged. Dropped; the hub is testing these options within scenario.
- Recurrent harness issue: in coarse games with dusk 60 s / turn 8 s, the Pyre's early-turn plan (wake 5) is often not
  queued in time and becomes a forced random move (PY6#1, PY6#2, PE6#1). Coarse pass 3 uses dusk 90 s / turn 10 s.
