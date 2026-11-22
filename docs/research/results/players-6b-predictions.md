# Players-6b: pre-registered predictions

Second 6-player session. Written before each batch of games; never edited after the games it predicts (later sections
are appended with their time). Outcomes and lessons: players-6b-log.md. Results: players-6b.md / .json.

## Starting point (what the first 6-player session left)

PY6 (werewolf x2, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket; 3 centre) is talk-live in 6 of 8 fixed
arms but the wolves won 2 of 38 fixed replays. Its diagnosis (players-6-log.md, heuristic P6-9): with
`burningDeniesWolves`, the wolf side's best move against a dressed Phoenix is to tell the truth about it, and the
Moonsage (a wolf ALLY that sees through the Lure's dress) became the Centaurs' informant (S5: Centaurs 4, Pyre 1).
My setup game (PY6 natural, openings + condemned on) went the other way: the Moonsage was a decoy (5 votes on it,
wolves win), so the wolf problem is specific to the Lure-dress class, which is exactly the class PY6 exists for.

## Theory before games (13:55 UTC)

What the wolf side needs at 6 is a story that a MOTIVATED player keeps telling (P6-8) and a vote target whose
elimination wins for the wolves without a burning. Three ways to change the wolf side's second card in PY6, each
changing one thing on the same night (the predecessor's S5, so the comparison is clean):

| Variant | Esme's card | What it changes for the wolf side | Prediction for S5's night |
| --- | --- | --- | --- |
| PY6 (done) | Moonsage (ally, not a wolf, sees through the dress) | informant: its true "Phoenix" read is Centaur evidence | (observed C 4, P 1) |
| **PYH6** | Hollow Sage (counts as a Werewolf, sees through the dress) | telling the truth about the dress now OUTS it as wolf-team, i.e. a Werewolf: it must stay quiet or frame | **Centaurs 2, Pyre 2, wolves 1** |
| **PYS6** | Stalking Horse (pack, not a wolf, eliminated = wolves win) | a second "wants the vote" seat: the table's rule of thumb "a vote-seeker is the Phoenix" now has two answers on opposite teams | **wolves 2, Centaurs 2, Pyre 1** |

Reasoning, PYH6: the honest reads (Sage on the real wolf Dov, Rustler on the dressed Phoenix Bryn) still give the
table two "Werewolf" seats. Without the Moonsage's true read, nothing tells the table which read is the dress, so the
Pyre gains. The wolves win only by a third target: framing the Sage (a Sage-vs-Hollow duel where voting the real Sage
wins for them) or pushing the exposed Lure. I expect the Hollow to try the frame and succeed about once.

Reasoning, PYS6: the Stalking Horse knows (pack + census) that Bryn's "Werewolf" read can only be a dress, and has a
perfect self-incriminating story that explains both honest reads: "I'm the Pickpocket; I lifted Bryn's card after the
Rustler looked, so I hold the Werewolf now". The table knows a Stalking Horse may be dealt (the deck is public), so
some tables will refuse to vote a self-incriminator; then the Sage's true read on Dov decides. Two teams now bait for
votes; the Centaurs must find the quiet wolf among baiters. Risk: the decoy is too strong (at 5 players a wolf-side
decoy won 11 of 12 uses).

A two-team roster where the wolves have a real duel (direction (a) of my brief), built on the 8-player Hollow Sage and
the 7-player K7 lesson (every claim must have a twin): **HC6 "Hollow Court"**: werewolf, hollowsage, duncentaur, sage,
sage, centaur, centaur, rustler, pickpocket (3 centre). Three wolf cards, all counting as Werewolves (one pack
Werewolf with the census, two shadow twins outside the pack, each with its own true night); the twinned roles are
duplicated, so two Sage or two Centaur claims are consistent with the deck and the pack Werewolf has a claim the table
cannot compute (a "Centaur" claim when one Centaur card is in the centre). The twins do not need to coordinate: each
claims its original and may report its night truly. Parity (3 wolves held) in about 24% of deals, so
`bloodPriceCondemned` on.

Rules for every table this session unless stated: `openingStatements` ON (recommended at 6 by the first session;
the key scenario will also be run OFF), `bloodPriceCondemned` ON, other rules default (`packCovers` off so the
S5 comparisons hold; census all; `burningDeniesWolves` on).

## Coarse pass (natural deals, 2 per roster, dusk 120 s, turn 10 s)

Purpose: check that each roster plays (no artefact, no forced night moves, no parity accident), not balance.
- PYH6 x2: Centaur-leaning (the Hollow is a third wolf target; two Sage claims are a duel the honest Sage often wins).
- PYS6 x2: wolf-leaning (the Stalking Horse decoy).
- HC6 x2: Centaur-leaning (two Sages and two Centaurs give the most honest information of the three rosters).
A natural game is not evidence of balance; I will not move a roster on it unless it shows a degenerate line.

## Fine pass 1 (fixed scenarios, 5 replays each, openings on, condemned on)

### PYH6-S5h: S5's night with the Hollow Sage in Esme's seat
Deal: Alder sage, Bryn phoenix, Cass lure, Dov werewolf, Esme hollowsage, Fenn rustler; centre werewolf, centaur,
pickpocket. Night: the Lure dresses Bryn (Phoenix) as a Werewolf; Dov (lone pack wolf) scents Alder (Centaur team);
Alder reads Dov: Werewolf (true); Esme reads Bryn: Phoenix (the wolf team sees through the dress); Fenn peeks Bryn:
Werewolf (dressed), no trade.
**Predict: Centaurs 2, Pyre 2, wolves 1; talk-live (minority >= 1, path >= 2.5); c mostly 0.6-0.8.** The Hollow
will not tell the truth about Bryn in its opening in at least 3 of 5 replays (if it does, it is voted out: a Centaur
win). Falsified if Centaurs >= 4 (the Hollow is still an informant) or wolves >= 3.

### PYS6-S5s: S5's night with the Stalking Horse in Esme's seat
Same deal with Esme = stalkinghorse; Dov and Esme now form a pack of two (they know each other; no scent). Night
otherwise identical (Esme has no look).
**Predict: wolves 2, Centaurs 2, Pyre 1; talk-live.** The Stalking Horse claims to hold a wolf card (or a mover's
story that puts one in its hand) in at least 2 of 5. Falsified if the wolves win 0 (the table refuses every
self-incriminator and the true read decides) or 4-5 (the decoy is unanswerable).

### HC6-S1: the hollow duel
Deal: Alder sage, Bryn werewolf, Cass hollowsage, Dov centaur, Esme rustler, Fenn pickpocket; centre sage, centaur,
duncentaur. Night: Bryn (lone pack wolf; census: sage, centaur, Dun Centaur) scents Fenn (Centaur team); Alder reads
Bryn: Werewolf; Cass (Hollow) reads Alder: Sage (so Cass knows Alder is the real Sage); Dov glances centre 0: Sage
(so at most one Sage card is held, and of two Sage claimants one is not a Sage); Esme peeks Cass: Sage (a Hollow
passes), no trade; Fenn lifts Dov (Fenn now holds the Centaur, Dov the Pickpocket).
Bryn has a claim the table cannot refute (Centaur: two copies, one unseen in the centre).
**Predict: Centaurs 3, wolves 2; talk-live; c 0.6-0.8.** The wolves win when the Hollow frames Alder ("Alder:
Werewolf") and the table believes the Rustler-corroborated Sage; they lose when the Hollow vouches or reads
elsewhere, or when Bryn's and Cass's stories collide. Falsified if Centaurs 5-0 (then the duel is not a duel: say
which asymmetry decided it) or wolves >= 4.

## If a scenario sweeps (decided in advance)
- PYH6-S5h sweeps for the Centaurs: the Hollow's silence did not matter because two honest reads plus "a Lure dresses
  the Phoenix" settle it: next change is the dress on the Hollow's OWN card or a Hollow read that conflicts with the
  Sage's (the 8-player H1 duel inside the Pyre).
- PYS6-S5s sweeps for the wolves: the decoy is unanswerable; smallest change: the Stalking Horse outside the pack
  (knows nothing; can only bait blind).
- HC6-S1 sweeps for the Centaurs: name the asymmetry (opening order, the Rustler's corroboration, the Centaur claim
  count) and remove it in S1b.
