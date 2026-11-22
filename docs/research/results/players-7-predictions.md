# 7 players: pre-registered predictions

Written 2026-11-22 BEFORE any 7-player research game (only the setup-check game, on a roster not studied here, had
started). Method and measures: docs/research/charter.md. Lessons inherited from the hub's coarse pass 1
(docs/research/log.md): Opus tables concentrate votes (13/14 majority or unanimous); wolves lose to their own claim
collisions (two pack members choosing the same "safe" census cover); the lone Herder count is a sledgehammer; two honest
looks at one seat end the game; the strongest wolf weapon is a lie about a parameter no detector can see.

Constraints I hold myself to (owner's evidence principle): no card that publicly proves a card's identity or gives an
unforgeable proof. So: no Herder without its twin (Stray Herder), no Notary/Signet without a forger in the same deck,
no Herald without a Forger. Every roster below has only indirect, fakeable or ambiguous evidence.

Marginal arithmetic used throughout (7 players, centre 3, 10 cards): a given card is held with probability 0.70; two
given cards both held 0.467; three 0.292; four 0.167. With centre 4 (11 cards): 0.636 / 0.382 / 0.212.

Common settings: default rules (Blood Price, census all, chat closed in the vote, 2 votes to eliminate,
burningDeniesWolves on, pyreFallback kindler, cutDuringVote off), timers dusk 60 / turn 8 / day 240 / vote 60 for
natural deals (redeal until a player holds a wolf); fine pass dusk 8 / turn 2 / day 240 / vote 60. All seats Opus,
medium effort.

## General predictions for 7-player all-Opus tables

- **P7-G1.** More seats means more honest looks: in any scenario where two Centaur-team looks land on the same wolf
  (or on the same wolf-team card), the Centaurs win 5-0 (talk-dead). Such scenarios are common at 7 with two
  player-looking roles; the rosters below therefore have at most one honest player-look role plus twins/distortion.
- **P7-G2.** Vote concentration: median c about 0.67 (4 of 6), unanimous rarer than at 5 (more seats, more agendas):
  at most a quarter. Scattered under a fifth except in the predicted-bad roster.
- **P7-G3.** Fixed scenarios: about 40% of tested scenarios sweep (5-0). Talk-live ones are those with a symmetric
  claim (twin duel) or an uncheckable wolf/Pyre parameter (glamour target, ember targets), and they swing on who claims
  first and whether the liar's story can be corroborated by an honest third party (hub heuristic 7).
- **P7-G4.** Wolf-wolf claim collisions (hub lesson 1) happen in about a third of two-wolf games UNLESS the wolf team
  holds twins (whose natural claim is the original's role), which removes the collision for those members.
- **P7-G5.** Discussion ends by everyone-ready after 90-180 s with 35-60 messages.

## Candidate rosters

### K7 "Shadow Court" (duplicates and enemy shadow twins), centre 3
Deck: werewolf, werewolf, moonsage, strayherder, sage, herder, rustler, sentry, centaur, centaur.
Teams in the deck: wolves 2 (+2 wolf-team twins), Centaurs 6.
- Thesis: every information claim has a wolf-side twin that can make the SAME claim truthfully-sounding: the Moonsage
  reads truly and passes as a Sage to every look (so an honest Rustler peeking it corroborates the fake); the Stray
  Herder knows the true centre count and may state a false one. The pack's census tells the wolves whether the real
  Sage/Herder are in the centre, so they know whether a duel is coming.
- Classes: Sage+Moonsage both held 47% (Sage duel); Herder+Stray both held 47% (count duel); both duels 17%;
  Moonsage alone with the Sage in the centre 23% (uncontested fake); Sage alone 23%; neither 7%.
- Common play: the Sage claims early with its read; the Moonsage counter-claims Sage with a true read of a Centaur
  (or frames: "X is a Werewolf"); the Herder announces its count and the Stray Herder states a different count (if the
  true count would hurt the wolves) or the same count (to buy credibility). Crux: which Sage, which count. The real
  Sage is distinguishable only by fit with other claims and by who backs it (wolves back the Moonsage once the real
  Sage has hit one of them, which is itself a tell a 2nd-order table can read).
- Within-class winners (fixed scenarios, 5 replays): Sage duel where the real Sage read a wolf: Centaurs 3, wolves 2,
  talk-live. Uncontested Moonsage (Sage in the centre): wolves 4, Centaurs 1 (Centaurs win only if a Centaur's glance
  saw the Sage in the centre and the table trusts it). Both duels: 2-3 / 2-3, talk-live, noise up to 1.5.
- Overall: Centaurs 50%, wolves 50%. c median 0.67, unanimous <= 25%. Judges: ToM 2.3, deception 2.5, path 2.5,
  noise 1.0.
- Falsifier: Sage-duel scenarios sweep with path < 2 because one mechanical cue always settles them (e.g. "the
  first Sage claim is believed", or the Rustler's corroboration always decides even though it cannot tell twin from
  original). Then twins add no talk-liveness at 7 and the roster fails.

### P7 "Pyre seven" (the Pyre team), centre 3
Deck: werewolf, werewolf, phoenix, lure, embercarrier, sage, rustler, sentry, centaur, pickpocket.
Teams: wolves 2, Pyre 3, Centaurs 5. Expected held: wolves 1.4, Pyre 2.1, Centaurs 3.5.
- Thesis: three-way persuasion. The Ember-Carrier (blind night swap of two other players, knowing the dealt Phoenix
  seat) can carry the Phoenix to a Centaur who does not know; the Lure can dress that card as a Werewolf so an honest
  Sage sincerely condemns it. The wolves know (census) whether the Phoenix is held and, since a burning denies them,
  must defend a seat they cannot openly explain they know is not a wolf: second-order talk.
- Classes: Phoenix held 70%; Phoenix + Lure + Ember all held 29%; Phoenix + Sage 47%.
- Common play: the Phoenix (if it still holds its card) acts mildly suspicious; the Ember-Carrier claims a Centaur role
  (often Pickpocket, to explain a swap the Sentry may report); the Lure claims a Centaur role and backs a "Werewolf"
  read. The wolves claim census-safe covers and quietly argue that a single "Werewolf" read in a Lure deck may be a
  dressed Phoenix.
- Within-class winners: Lure-dressed, ember-carried Phoenix read by the Sage as a Werewolf: Pyre 2, Centaurs 2,
  wolves 1 (talk-live, three-way). Phoenix untouched, no dress: Centaurs 3, wolves 2, Pyre 0.
- Overall: Centaurs 40%, wolves 30%, Pyre 30% (counting a Pyre win alongside a Centaur Blood-Price win as Pyre too).
  c median 0.6 (three agendas), unanimous <= 15%, scattered up to 20%. Judges: ToM 2.5, deception 2.5, path 2.5,
  noise 1.5.
- Falsifier: (a) the Pyre wins every replay of the dressed-and-carried scenario (an honest Sage's sincere read is
  unanswerable: degenerate), or (b) never wins any game (Opus tables always discount a lone "Werewolf" read when a
  Lure is in the deck: the Lure is then a dead card).

### G7 "Veils and the Hush" (deliberate distortion, the communications interrupt, a role copier), centre 3
Deck: werewolf, glamour, hush, sage, echo, rustler, sentry, centaur, centaur, cutpurse.
Teams: wolves 2 (Werewolf, Glamour) + the Hush (wolf team, not a wolf); Centaurs 7.
- Thesis: the honest looks are the Centaurs' best tool, and both wolf-side cards attack them: the Glamour makes every
  look at one card show a chosen role (a sincere false read; if the Echo copied the Sage, both "honest looks" agree on
  the lie: two false confirmations instead of two true ones); the Hush cuts one voice for 60 s during the talk (in an
  Opus discussion of 90-180 s that is most of it, but the cut player cannot mark ready, so the discussion waits).
- Classes: Glamour held 70%; Glamour + Sage 47%; Echo + Sage 47%; Hush held 70%.
- Common play: the Glamour either clears itself (dresses its own card as Centaur/Rustler) or frames a Centaur as
  "Werewolf" in the Sage's likely read; the framed Centaur protests with its true role; the table must model "who
  would a Glamour dress, and why". The Hush cuts the Sage (or whoever is about to expose a wolf) right after the first
  claims; the table sees the drop and must decide whether it was the Hush (a tell that the cut player mattered).
- Within-class winners: Glamour frame of a Centaur read by the Sage: wolves 3, Centaurs 2 (talk-live). Self-clear
  with no read on the Werewolf: wolves 4, Centaurs 1. Sage reads the plain Werewolf with the Echo also on the Sage:
  Centaurs 5-0 (talk-dead; two honest looks).
- Overall: Centaurs 50%, wolves 50%. c median 0.67. Judges: ToM 2.3, deception 2.8, path 2.5, noise 1.0.
- Falsifier: Hush cuts produce noise >= 2 (random-feeling results) or are never used; the Glamour frame either always
  or never works.

### X7 "Thieves" (several card-stealers), centre 3: PREDICTED BAD
Deck: werewolf, werewolf, cutpurse, pickpocket, drifter, latecomer, poacher, sage, sentry, centaur.
- Why I expect it to fail the target: five mandatory movers among ten cards (about 3.5 held). Two of them are blind
  (Pickpocket, Latecomer: their holders do not know their own final team), the Poacher hands its team to its victim,
  and the Latecomer moves after the Sage has read. The Sage's read is stale by dawn and the Sentry sees "moved"
  nearly everywhere. Honest claims of who swapped with whom form a permutation puzzle the wolves can corrupt with one
  false swap claim that no detector can check, and the blind movers cannot even say what they took. I predict the
  table cannot reach a world model it trusts: the vote either scatters or concentrates on the seat implicated by the
  most recent swap chain, so the result is decided by unseen movement, not by persuasion.
- Prediction: c median about 0.5, scattered in at least 1 of 2 coarse games or a plurality win; judges noise >= 1.5,
  path <= 2, `howWon` unseen-night-movement or split-vote in most games. Winner: wolves more often (a scatter or a
  wrong concentration both favour them).
- Falsifier: both coarse games show c >= 0.67 and judges path >= 2.5 with noise <= 1 (the table reconstructs the swap
  chain from claims and the result turns on a believed lie): then many-movers is a talk engine and I was wrong.

## Fine-pass scenario predictions
Written in this file, dated, before each fine batch (scenarios are constructed after the coarse pass).

### S7 "Stampede seven" (added 11:50, after the setup-check game, before any replay of it), centre 3
Deck: werewolf, werewolf, spooker, sage, rustler, sentry, centaur, herder, pickpocket, centaur.
The setup-check game turned out to be a rich game (see players-7-log.md), so this roster joins the study. It carries a
lone Herder, which breaks my evidence rule whenever the Herder is held (70%); the scenario below has the Herder in the
centre, and the roster recommendation, if any, will replace it (candidate: strayherder+herder, or drop it).
- Thesis: the Spooker's rotation direction and targets are uncheckable (Sentry sees only "moved"); a wolf that believes
  a false rotation story may conclude it lost its wolf card and switch sides in talk.

## Fine-pass scenario predictions

### F-S7-confession (replay of the setup-check game; written before any replay)
Seats 0 Dov Centaur, 1 Fen Werewolf, 2 Cass Centaur, 3 Bryn Sage, 4 Esme Spooker, 5 Gale Werewolf, 6 Alder Sentry;
centre Herder, Rustler, Pickpocket. Night: Sage Bryn read Esme = Spooker; both Centaurs glanced centre 1 = Herder;
Spooker rotated Fen -> Bryn -> Gale -> Fen, so Fen now holds Gale's Werewolf, Bryn (the Sage, unaware) holds Fen's
Werewolf, Gale holds the Sage card (Centaur team, unaware); Sentry Alder saw only Gale's card moved.
- Crux: the Spooker is exposed by the Sage at once, so its only weapon is its rotation story; the two dealt wolves
  must pick census covers (Rustler and Pickpocket are the only safe ones; collision likely); whether either dealt wolf
  comes to believe it lost its card. The truly winning vote for the Centaurs is Fen or Bryn (Bryn is the Sage: almost
  nobody will vote the confirmed-looking Sage), so Fen.
- The coarse original: Spooker lied (claimed centre 2 -> Gale -> centre 3), Gale believed it, confessed "dealt
  Werewolf, Fen is my packmate", the table flipped to Fen: Centaurs won.
- **Prediction: talk-live, Centaurs 3, wolves 2 of 5.** Wolves win when the Spooker's story keeps Gale lying (or
  names a rotation that makes Fen look clean) and the table eliminates Gale (holding the Sage card, a Centaur) on the
  Sentry's "moved" plus a Rustler collision. Judges path >= 3, ToM >= 2.5. Vote c 0.67-0.83.
- Falsifier: 5-0 either way with path < 2 (e.g. the Rustler collision always dooms whichever wolf claimed second,
  regardless of the Spooker's story).

### Constructed fine-pass scenarios (written 11:58, during the coarse pass, before any replay; checked with scenario-check)
Context read just before writing: the hub's fine pass 1 (log.md) found the 5-player Moonsage duel swept 5-0 Centaurs
by a census-backwards argument ("a wolf would never claim a role its census says is held"). I keep my roster-level
predictions above unchanged (they were registered first) and state the scenario predictions in its light.

**F-K7-duel.** Seats 0 Alder Sage, 1 Bryn Werewolf, 2 Cass Rustler, 3 Dov Moonsage, 4 Esme Herder, 5 Fen Centaur,
6 Gale Stray Herder; centre Werewolf, Sentry, Centaur. Night: lone wolf Bryn scented Dov (wolf team) and his census
says Werewolf/Sentry/Centaur are in the centre (so the Sage, Herder and Rustler are held); Sage Alder read Bryn =
Werewolf; Moonsage Dov read Cass = Rustler (true); Rustler Cass peeked Dov and saw "Sage" (the twin passes), kept;
Centaur Fen glanced centre 3 = Centaur; both Herders counted 1 wolf in the centre.
- Crux: two Sage claims; the fake one is corroborated by an honest Rustler; two Herder claims (the Stray may state a
  false count, e.g. 0, making "two wolves held" and so a second accused seat plausible). Bryn knows Dov is his ally.
- Prediction: **Centaurs 3, wolves 2; talk-live** (more wolf chances than the hub's S3 because the Stray Herder can
  muddy the count and Bryn has a known ally to coordinate a story with). Judges path >= 2.5, ToM >= 2.5.
- Falsifier: 5-0 Centaurs by the census-backwards argument (as in the hub's S3): then twins alone do not make a
  talk-live duel at 7 either, and the census is the problem (test CR-8 via centre 4 + census "three").

**F-P7-ember.** Seats 0 Alder Sage, 1 Bryn Phoenix, 2 Cass Lure, 3 Dov Werewolf, 4 Esme Ember-Carrier, 5 Fen Centaur,
6 Gale Sentry; centre Werewolf, Rustler, Pickpocket. Night: the Lure dressed the Phoenix card as a Werewolf; the
Ember-Carrier swapped Bryn's and Fen's cards (Fen now holds the dressed Phoenix, unaware; Bryn holds a Centaur);
lone wolf Dov scented Fen: "of the Pyre" (he knows Fen holds a Pyre card); Sage Alder read Fen = "Werewolf"
(truly Phoenix); Fen glanced centre 2 = Rustler; Sentry Gale saw Fen's card moved.
- Crux: a sincere "Fen is a Werewolf" read plus the Sentry's "Fen moved" (fits "a mover gave Fen a wolf"); Fen
  protests Centaur; Bryn (dealt Phoenix, now Centaur) may reveal "I was dealt Phoenix" or hide it; Dov knows Fen is
  Pyre and must stop the burning without revealing his scent; the Pyre (Cass, Esme) pushes Fen.
- Prediction: **Pyre 2, Centaurs 2, wolves 1; talk-live**. c 0.5-0.83. Judges ToM >= 2.5, noise <= 1.5.
- Falsifier: Pyre 5-0 (a sincere Sage read + a Sentry move is unanswerable: Lure+Ember too strong together) or
  Pyre 0 with the table reasoning the same way every time ("a lone Werewolf read in a Lure deck is a dressed Phoenix").

**F-G7-glamour.** Seats 0 Alder Sage, 1 Bryn Glamour, 2 Cass Centaur, 3 Dov Echo, 4 Esme Werewolf, 5 Fen Hush,
6 Gale Sentry; centre Rustler, Centaur, Cutpurse. Night: the Echo copied the Sentry; the Glamour dressed Cass as a
Werewolf; the Sage read Cass = "Werewolf" (truly Centaur); Cass glanced centre 2 = Centaur; both Sentries saw no
movement near them (seats 2-6 and 0 unmoved).
- Crux: a sincere frame of an honest Centaur; nothing moved, so "Cass was swapped" is not available: the only
  defences are "Glamour is in the deck" and claim-counting (two Centaur claims plus a Centaur in the centre? only if
  someone saw it: Cass did, centre 2; two Centaur cards in the deck). The Hush (Fen) can cut Cass or the Sage.
- Prediction: **wolves 3, Centaurs 2; talk-live**. Judges deception >= 2.5.
- Falsifier: 5-0 either way with path < 2 (the Glamour frame always or never works).

*Amendment to F-G7-glamour (12:10, before any replay):* the Hush is moved to the centre (Fen becomes the second
Centaur, glancing centre 1 = Rustler; Cass now sees centre 2 = Hush), because a Hush cut currently removes an AI player for good (harness bug reported
to the hub: the client drops the MCP server after the 503s). The rest of the night is unchanged. Prediction unchanged:
wolves 3, Centaurs 2, talk-live.

## Batch 2 (written 12:45, after fine pass 1, before any of these games; scenarios checked with scenario-check)

### Amendment A1: Grey Herder (new variant card `greyherder`), test F-K7g-duel
Card: a Stray Herder that also wakes with the pack (knows the pack seats and the census; the pack knows its seat).
Why (from F-K7-duel, Centaurs 4-1): in 4 of 5 replays the wolf side lost by uncoordinated claims between the lone
Werewolf and the Stray Herder, who did not know each other (#4: both claimed Sentry; #1: the Werewolf claimed Stray
Herder against the real Herder's count; #3: the Stray Herder's fake retraction). Judges labelled 3 of 10 verdicts
"blunder". The smallest change that leaves the wolves a credible counter-story: let the twin know its pack, so it can
predict its partner's census-safe claim and pick a complementary one (it still cannot talk to it).
Scenario: F-K7-duel with the Stray Herder replaced by a Grey Herder (Gale); Bryn is therefore not alone and does not
scent (he learns Gale instead of scenting Dov). Everything else identical.
- Prediction: **wolves 2, Centaurs 3** (from 1-4); fewer wolf-wolf collisions (at most 1 of 5 replays, from 3);
  judges' "blunder" verdicts at most 1 of 10; path >= 3; deception >= 3.
- Falsifier: wolves still lose 4-5 of 5 with collisions in 2+ replays (knowing the pack is not enough without
  communication: covers would have to be assigned, as the hub's packCovers rule does).

### Amendment A2: Mirage (new variant card `mirage`), natural-deal games M7#1-4
Card: a Glamour that cannot disguise its own card (another player's or a centre card only).
Why (from coarse G7): both natural Glamours dressed their own card as "Centaur" (the dominant safe use), so
distortion never framed anyone in natural play, while the constructed frame scenario (F-G7-glamour) was talk-live 3-2
with deception 2.7. Forcing the disguise outward should bring frames (or centre-card decoys) into natural play.
Deck M7: werewolf, mirage, whisperer, sage, echo, rustler, sentry, centaur, centaur, cutpurse (G7 with Glamour -> Mirage
and Hush -> Whisperer, because a Hush cut currently removes an AI player for good; harness bug reported).
Redeal until the Mirage is held by a player. 4 games.
- Prediction: the Mirage frames a player (dresses a Centaur-team card as Werewolf or another wolf-incriminating role)
  in at least 2 of 4 games, and dresses a centre card (to create a false "X is in the centre" fact) in the rest;
  a frame becomes the decisive deception in at least 1 game; judges' deception mean >= 2.5 (G7 coarse: 2.3).
  Winners: wolves 2, Centaurs 2 (G7 coarse: Centaurs 2).
- Falsifier: the Mirage dresses a centre card harmlessly or a random seat in 3+ games with no effect on the talk.

### F-P7-inversion (second Pyre scenario)
Seats 0 Cass Lure, 1 Bryn Phoenix, 2 Gale Sentry, 3 Dov Werewolf, 4 Esme Ember-Carrier, 5 Alder Sage, 6 Fen Centaur;
centre Werewolf, Rustler, Pickpocket. Night: the Lure dressed the Phoenix card as a Werewolf; the Ember-Carrier swapped
Bryn's and Dov's cards: Bryn (dealt Phoenix) now holds the real Werewolf, Dov (dealt Werewolf, lone wolf, census) now
holds the dressed Phoenix; Dov scented Fen = Centaur team; the Sage read Bryn = Werewolf (TRUE); Fen glanced centre 2 =
Rustler; the Sentry Gale saw Bryn and Dov both moved.
- The inversion: the dealt Phoenix holds a wolf (he should now hide: eliminating him is a Centaur win), the dealt wolf
  holds the Phoenix (eliminating him is a burning: the Pyre wins, wolves denied, Centaurs lose). Both may infer the
  swap from the Sentry's "1 and 3 moved". The Pyre knows; the Sage's true read points at Bryn.
- Prediction: **talk-live, three-way: Centaurs 2, Pyre 2, wolves 1.** Judges ToM >= 2.7, path >= 3, noise <= 1.5.
- Falsifier: 5-0 for one side, e.g. Centaurs every time because a true Sage read + the Sentry is unanswerable.

### F-K7-solo (second K7 scenario: the uncontested Moonsage)
Seats 0 Alder Moonsage, 1 Bryn Werewolf, 2 Cass Rustler, 3 Dov Centaur, 4 Esme Herder, 5 Fen Stray Herder, 6 Gale
Sentry; centre Sage, Werewolf, Centaur. Night: the lone wolf Bryn (census: the Sage is in the centre) scented Dov =
Centaur team; the Moonsage read Esme = Herder; Dov glanced centre 3 = Centaur; the Rustler Cass peeked Alder = "Sage"
(the twin passes), kept; both Herders counted 1; the Sentry saw nothing moved.
- Only the wolves know the Sage is in the centre. The Moonsage's Sage claim is uncontested and corroborated by an honest
  Rustler; the Werewolf knows Alder must be the Moonsage (an ally) and can back him or frame through him.
- Prediction (my roster-level prediction for this class): **wolves 4, Centaurs 1.** Path around 2.5, deception >= 2.5.
- Falsifier: Centaurs 3+ (the table finds the wolf without exposing the fake Sage, e.g. by claim counting: Bryn's claim
  must collide with someone since only Sage, Werewolf and Centaur are in the centre and the Sage is "claimed").

## Batch 3 (written 13:20, after batch 2, before these games)

### Amendment A3 (rule setting, the hub's census "allButOne"), test F-P7-inversion-abo
Why (F-P7-inversion swept 5-0 Centaurs, ToM 1.4): the dealt wolf Dov, whose card the Ember-Carrier had carried away,
deduced it at once ("his census showed no Rustler or Pickpocket was in play and his own card had left him"), confessed
honestly, and the Ember-Carrier confirmed the swap; with the Sage's true read on Bryn and the Sentry's "1 and 3 moved",
Bryn (holding the wolf) had no counter-story. The census turned the Sentry's "moved" into certainty for Dov.
Change: census "allButOne" (seed 32: Dov learns Rustler and Werewolf, not the Pickpocket). Dov can no longer exclude a
held Pickpocket as the cause of his move, so his confession is a gamble, and the wolf side keeps an alternative
("a Pickpocket moved Dov").
- Prediction: Centaurs 3, wolves 1, Pyre 1 (from 5-0); ToM >= 2 (from 1.4); noise <= 1.5.
- Falsifier: 5-0 Centaurs again (the Sage read + Sentry + Ember-Carrier's own admission suffice without the census).

### Natural deals P7#3-4, K7#3-4 (no new prediction: the roster-level predictions above apply)
