# Players-6: pre-registered predictions

Written 2026-11-22 before any research game at 6 players (one setup-check game, V6#1, had been played; it is reported
in players-6-log.md and is not counted). Rules: defaults (Blood Price, census "all", 2 votes to eliminate, chat closed
in the vote, `cutDuringVote` off, `burningDeniesWolves` on, `pyreFallback` kindler), 3 centre cards, discussion 240 s,
vote 60 s, all seats Opus (medium effort). Coarse games are redealt until a player holds a Werewolf card.

Evidence principle (owner, binding): no pure confirmation. So no roster here has an UNPAIRED Herald, Notary or Herder:
the Herder comes only with its Stray Herder twin; the Notary only with a Counterfeiter; no Herald.

## 0. What I bring from the setup game and the hub's coarse pass

- V6#1 (twin Sage + Herder + Pickpocket): the Pickpocket took a wolf card; the wolf who LOST its card confessed at once
  (now a Centaur), and Sage + Sentry + Herder 0 closed every gap in 40 s. Discussion ended by ready after 92 s, 4-2 vote.
  Lesson for prediction: **a dealt wolf that was robbed becomes the Centaurs' best witness**; blind stealers mostly
  help the Centaurs unless the robbed wolf can't tell it was robbed.
- Hub coarse pass (14 games): Centaurs 9 of 14; the Herder count and wolf-wolf claim collisions decided most Centaur
  wins; every wolf win came from an UNCHECKABLE parameter (Spooker direction) or a coordinated fake chain.
- General: Opus tables converge in ~90 s and almost always concentrate votes (13/14 majority or unanimous).

## 1. General predictions for 6 players (G6)

- **G6-1 (the main risk).** With identical information, fresh Opus tables reach the same reading. I predict **about
  60% of fixed scenarios sweep (5-0)** at 6 players; talk-live ones (minority >= 1) will be those where (a) two
  incompatible true-sounding claims exist and (b) no third party can corroborate either. Order of claims (who commits
  first) will be the main flip mechanism.
- **G6-2.** Vote concentration: median c about 0.8 (4 of 5 votes), unanimous about 30%, scattered under 10%.
- **G6-3.** Judges: mean ToM about 2, noise about 1, path about 2.2 across rosters; higher on Pyre and twin rosters.
- **G6-4.** Wolf-wolf claim collisions will happen in about a third of two-wolf deals (hub heuristic 5).

## 2. Candidate rosters

Class frequencies are exact deal enumerations (sim/research/classes.ts), conditional on a player holding a wolf card.
For a single card in a 9-card deck with 6 seats, P(held | wolf held) is about 2/3.

### TW6 "Twins everywhere" (owner family: duplicates and enemy shadow twins)
Deck: werewolf x2, sage, moonsage, herder, strayherder, rustler, centaur, sentry (3 centre).
- Thesis: every information claim has an enemy that can make the same claim truthfully. The Sage's read is matched by
  a Moonsage's true read; the Herder's count is matched by the Stray Herder (same true count, free to lie about it).
  Pack does not know the twins; twins do not know the pack. Sage+Moonsage both held: 31%; Herder+Stray both held: 31%;
  at least one duel: about 55%.
- Common play: two Sage claims. The Moonsage, not knowing the pack, will most often report its read TRUTHFULLY if it
  saw a Centaur (to look honest) and frame later, or frame at once if it reads a Centaur that nobody can vouch for.
  The wolves (census) know whether both Sages are held and support the Moonsage obliquely. Herder duel: the Stray
  Herder must choose a number; if it says the true count it adds nothing; lying is checkable only against the census
  (which only wolves have) and claim counting.
- Within-scenario prediction: **Sage-Moonsage duel with no Rustler peek on either: talk-live, Centaurs 2-3 of 5.**
  Duel where the Rustler peeked one of the two Sages: talk-dead (the corroborated one is believed), 5-0.
  Herder duel alone: the honest count usually wins (Centaur 4-5 of 5) because wolf claims collide with it.
- Overall natural deals: Centaurs 55%, wolves 45%. c median 0.8. Judges ToM 2.3, deception 2.3, path 2.3, noise 1.0.
- Falsified if: duels are decided by a fixed rule ("the first Sage claim is believed") in 5-0 sweeps.

### PY6 "Pyre with a twin" (owner family: the Pyre)
Deck: werewolf x2, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket (3 centre).
- Thesis: three agendas. The Lure (knows the dealt Phoenix seat) dresses the Phoenix as a Werewolf, so the Sage (or
  Moonsage) that reads it sincerely calls a Werewolf. The wolves know from the pack and census that the accused is NOT
  one of them but cannot say how without revealing themselves; since a burning denies them, they must defend it.
  Phoenix+Lure both held 39%; Phoenix held without Lure 23%.
- Common play: the Phoenix acts mildly suspicious; a seer calls the dressed Phoenix a Werewolf; the wolves dispute with
  "a Lure is in the deck: that read could be a dress" (a sentence that is cheap for anyone to say). Pickpocket may carry
  the Phoenix (blind) to someone else.
- Within-scenario: **Phoenix+Lure held, Sage reads the dressed Phoenix, the real wolf unread: talk-live, outcome split
  Pyre 2 / wolves 2 / Centaurs 1 of 5.** Phoenix held, no dress: Centaurs or wolves, Pyre at most 1 of 5.
- Overall: Centaurs 40%, wolves 35%, Pyre 25%. c median 0.7 (three-way tables split more). Judges ToM 2.5,
  deception 2.5, path 2.6, noise 1.2.
- Falsified if: the Pyre wins every dressed-Phoenix replay (the dress is unanswerable) or none of them (Opus always
  says "Lure could dress it" and nobody votes a read wolf).

### SE6 "Anonymous seals" (owner family: forged role-signed messages)
Deck: werewolf x2, counterfeiter, notary, moonsage, rustler, centaur, sentry, pickpocket (3 centre).
- Thesis: after the evidence amendment, a sealed report is signed by the ROLE only: "Notary: at night X's card was Y",
  sender hidden. The Counterfeiter can post an identical forged report. No real Sage in the deck: the only Sage claims
  are the Moonsage's (a wolf-side true reader). Counterfeiter+Notary both held 39%; Counterfeiter held, Notary in the
  centre 26% (an uncontested forgery is possible); Notary held, Counterfeiter in the centre 23% (the report is true but
  the Centaurs cannot know it).
- Common play: the Notary posts a sealed report early. The Counterfeiter answers with a contradicting sealed report
  (frame the Notary's own claimant, or clear its wolf). With two contradictory sealed reports, the table must decide
  which one is real by content: whose report is consistent with the rest of the claims; who claims authorship.
- Within-scenario: **two contradictory reports, neither target corroborated: talk-live, Centaurs 2-3 of 5.**
  Uncontested real report hitting a wolf: Centaurs 5-0 (talk-dead; this is the evidence-principle failure case,
  softened only by the possibility of a forgery). Uncontested forged report: wolves 3-4 of 5.
- Overall: Centaurs 50%. c median 0.8 (seals focus votes). Judges ToM 2.2, deception 2.5, path 2.2, noise 0.8.
- Falsified if: the Counterfeiter never forges (holds its seal) or the real report is always believed 5-0.

### HU6 "Interrupt and stealers" (owner families: the communications interrupt, several card-stealers, a copier)
Deck: werewolf x2, hush, sage, echo, cutpurse, pickpocket, centaur, sentry (3 centre).
- Thesis: the Hush silences one voice for 60 s of the discussion (here: an Opus discussion lasts ~90 s, so a 60 s cut
  is two thirds of it). Echo copies a player at wake 3 (an early true read and a duplicate claim). Two mandatory
  stealers make allegiances move.
- Common play: the Hush cuts whoever claims Sage first (or before it claims). Others relay. The cut player comes back
  near the end. Stealers' victims learn their new team from claims.
- Prediction: the Hush is weaker than it looks against Opus, because the Sage typically claims in its FIRST message
  (V6#1: 6 s into the day), before any cut. So a cut mostly removes the Sage's defence, not its claim.
  Centaurs 60%. Path 2.0. Noise 1.3 (cuts create uncertainty nobody can reason about until the end). c median 0.8.
- Falsified if: the Hush lands a pre-claim cut in most games where it is held, and that decides them.

### SO6 "Stealer soup" (expected BAD, to test my judgment)
Deck: werewolf x2, spooker, pickpocket, latecomer, cutpurse, drifter, centaur, sentry (3 centre).
- Why bad: no reader; up to five mandatory moves (three blind) and a rotation. Nobody, wolves included, knows who
  holds what at dawn; claims are honest but uninformative; the vote follows the only hard facts (the Cutpurse's and
  Drifter's looks, Sentry flags). I predict **noise >= 2 from both judges, ToM <= 1.5, howWon mostly
  unseen-night-movement or split-vote**, scattered or plurality votes in at least one of 2-3 games, and outcomes the
  players themselves call luck.
- Falsified if: judges score noise <= 1 and path >= 2.5 (then heavy movement creates reasoning, not noise, and my
  heuristic "information-free movement is noise" is wrong).

## 3. Plan and triage

- Coarse: TW6, PY6, SE6, HU6 x 3 natural deals; SO6 x 2. About 14 games, about $50.
- Fine: the 3 best rosters, 2-3 constructed scenarios each (at least one predicted talk-live, one predicted sweep as a
  control), 5 replays each.
- Not testing: unpaired Herald/Notary/Herder (violate the evidence principle), Moon-Thief day swap (after-talk).

## Addendum (11:50, after merging the evidence amendment dd55c9d/5d14fc1; still before any research game)

- **SE6 changes meaning.** The Notary now looks at TWO players and seals "at least one of A's and B's cards was a
  <role>" (one of the two roles it saw, its choice), signed "the Notary" with no name; the Counterfeiter forges the
  same pair report. A pair report on a Werewolf points at two seats, one possibly innocent: it is now framing material
  for both sides. Revised SE6 prediction: Centaurs 45% (down from 50%); the crux becomes "which of the pair", decided by
  the two named players' own claims; talk-live more often (path 2.5). The uncontested-real-report sweep (5-0) I
  predicted for the old one-card report should now be a split (3-2) when the pair contains a Centaur with no
  corroborator. Falsified if the pair report is still decisive 5-0 whenever it is real.
- Other rosters contain no Herald, Notary or Signet: predictions unchanged.

## Fine pass 1: PY6 fixed scenarios (written 12:25, after the coarse pass, before these games)

Roster PY6 (werewolf x2, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket; 3 centre). Each scenario: deal,
night plans and night seed fixed (sim/tournaments/players-6/fine1.json, built by sim/research/p6-fine1.mjs; nights
checked with scenario-check.ts).

- **PY6-S1-fakesage** (replay of coarse PY6#1; 5 replays). Both Sage cards are in the centre; the Lure dressed the
  Phoenix as a Werewolf but nobody looks at it; a lone wolf knows (census) that every Sage claim is false; the Centaur
  saw "Sage" in centre card 1. Crux: will the Lure fake a Sage read on the Phoenix (as in coarse), and can the lone wolf
  expose it without exposing itself? Prediction: talk-live, **Pyre 3, wolves 1, Centaurs 1**; judges path >= 2.5.
  Falsified if 5-0 for any team.
- **PY6-S2-twowolfreads** (5 replays). Sage reads the dressed Phoenix: "Werewolf"; Rustler peeks the real wolf:
  "Werewolf"; the Centaur saw a Werewolf in the centre, so only one held wolf exists: one read is a dress. The table
  must decide which accused is the Phoenix; the wolf knows the other accused is not pack and can claim to be the
  dressed Phoenix itself. Prediction: the most talk-live scenario of the night: **Centaurs 2, Pyre 2, wolves 1**,
  path >= 3, ToM >= 2.5. Falsified if one team wins 5-0 (then the asymmetry between the accused's natural behaviours
  decides it).
- **PY6-S3-control** (3 replays, predicted SWEEP). Sage and Rustler both see the only held wolf; Phoenix in the
  centre so the Lure is a Tanner (Kindler fallback). Prediction: **Centaurs 3-0, path < 2, I4 degenerate (talk-dead)**,
  c >= 0.8. Falsified if the wolf or the Lure wins a replay.

## Coarse pass 2 (written 12:35, after fine pass 1, before these games)

Lessons applied: parity bloc (keep wolf-team cards <= 3 of 9, or use a third team); hub: full census makes a wolf's
claim choice a tell, and pack members' independent "safe" claims collide.

### PE6 "Ember Pyre" (Pyre with an unseen mover)
Deck: werewolf x2, phoenix, embercarrier, sage, rustler, centaur, sentry, pickpocket (3 centre). Wolf-team 2 of 9: no
parity deals. The Ember-Carrier knows the dealt Phoenix seat and, at wake 5 (before every look), must swap two other
players' cards blind: it can carry the Phoenix to an unknowing player, so later looks show the Phoenix truly where it
went, and the dealt Phoenix holder no longer is one but does not know. Only the Sentry sees that cards moved.
- Expected play: the Ember carries the Phoenix to a seat it expects to be suspected (or away from a seat it expects to
  be read). The original Phoenix player, unaware, pleads for votes (and is now holding a Centaur's card). The Ember
  claims a Centaur role. A Sage that reads the new Phoenix holder reports "Phoenix", which the table then avoids.
- Prediction: Centaurs 45%, wolves 30%, Pyre 25%; path 2.5; ToM 2.3; noise 1.5 (the unseen swap is the risk: if
  nobody can reason about it, judges will call the burnings "unseen-night-movement"); c median 0.8.
- Falsified if noise >= 2 in most games, or the Pyre wins 0 of 3 because the carried Phoenix is always read.

### TW6c "Twin Sage, covered pack" (twins, with the hub's new rule options)
Deck: werewolf x2, moonsage, sage, rustler, centaur, sentry, pickpocket, drifter (3 centre); rules census "allButOne",
packCovers on. Wolf-team 3 of 9 (parity in about a quarter of deals).
- Expected: packCovers ends wolf-wolf claim collisions; allButOne means the census no longer proves a Sage claim honest
  ("a wolf would never claim a role it knows is held" fails when it may not know). The Sage/Moonsage duel is the crux.
- Prediction: non-parity deals Centaurs 3 of 4-5, wolves 1-2; parity deals wolves. Path 2.3, ToM 2.3, noise 1.0,
  c median 0.8.
- Falsified if the wolves still collide on claims (packCovers ignored) or the duel is always settled by corroboration.

## Fine pass 2 and coarse pass 3 (written 12:45, after coarse pass 2, before these games)

- **PY6-S4-sagehits** (5 replays). The Sage reads the only held wolf; the Lure dressed the Phoenix but nobody looks at
  it; Moonsage, a Werewolf and the Pickpocket in the centre; the lone wolf scented the Lure ("of the Pyre"), so it knows
  a Pyre member's seat. Crux: will the Lure fake a Sage read on the Phoenix (as in S1) to make a two-Sage duel with two
  "Werewolf" accusations, and can the wolf use what it knows (Dov is Pyre) without exposing itself? Prediction:
  **Centaurs 3, Pyre 2, wolves 0** (the real Sage was first in S1-style tables only when it existed: here it does, and
  the Rustler confirms the Centaur), path 2.5. Falsified if the Centaurs win 5-0 with path < 2 (then the real Sage's
  read dominates whenever it exists, and the Pyre needs the dress to be READ, as in S2).
- **GL6 "Glamour" coarse** (2 games): glamour, werewolf, sage, rustler, centaur, sentry, pickpocket, drifter, cutpurse;
  3 centre; wolf-team 2 of 9 (no parity). Longer dusk (90 s, turn 10 s) so the agents queue their night (coarse PY6/PE6
  lost their key Pyre moves to forced random moves). The Glamour can dress itself as a Centaur role (self-clear against
  a read) or dress a Centaur as a Werewolf (frame). Prediction: wolves 1 of 2, path 2.3, deception 2.5; the Centaurs'
  many looks (Sage, Rustler, Cutpurse, Drifter) are the risk to the wolves.
