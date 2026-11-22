# Balance research: summary for the owner

Version 3 (13:40 UTC). A refresh by 18:30 UTC will add 8-player round 2 (players-8b), 6-player round 2 (players-6b) and
the n=10 confirmation reruns (confirm) where they exist.
Machine-readable companion: [overnight-summary.json](overnight-summary.json), rebuilt by
`npx tsx sim/research/overnight.ts` from `docs/research/results/*.json`. Method and measures: [charter.md](charter.md);
full record and heuristics: [log.md](log.md); per player count: `results/players-N.md`.

## In one paragraph

363 all-Opus games (counted below) were played today by five finished sessions (the hub, and one per player count
5-8; three more are still running), most of them as **fixed scenarios**: one deal, one night, replayed 5 times with
fresh AI players so that only the discussion differs. Two of the three leading rosters (5 and 6 players) contain the
**Pyre** (a Phoenix that wants to be eliminated and Kindlers
who help it): with three teams, every side has a credible story and a private reason to distrust the others, and the
neutral judges gave those games the highest theory-of-mind and path-dependence scores. The third (7 players) is a
two-team roster built on enemy shadow twins, with the cleanest consensus of the leaders. **8 players is not solved.**
The most important design lessons: talk decides only when a claim is credible but uncheckable; information handed to
liars becomes a tell because the rules are common knowledge; and several "fixes" moved power to a different team
instead of into the talk.

## Games and spend (as each session reports it; 13:40 UTC)

| Session | Games (all-Opus, full) | Spend (USD) | Note |
| --- | --- | --- | --- |
| Hub (this file's author) | 89 | about 323 | 313 players + about 10 judges/taggers |
| 5 players | 81 | 236 | players + judges |
| 6 players | 73 | 277 | 267 players + about 10 judges |
| 7 players | 57 | 296 | 286 games + 10 judges |
| 8 players (round 1) | 63 | 334 | 317 games + 17 judging |
| **Total, finished sessions** | **363** | **about 1,466** | |
| Build session (rules, replay hook) | 0 | about 31 | smoke games only |
| App-UI session | 0 | about 20 | |
| Still running at the time of writing | | | 8 players round 2 (players-8b), 6 players round 2 (players-6b), confirmation reruns (confirm) |

## How to read the numbers

- All seats Opus (medium effort), one isolated AI per seat, current rules (after the evidence amendment). Random play
  is never used as evidence.
- **Fixed scenario** = same deal, night seed and night decisions, 5 replays (3 for some controls). **Talk-live** = at
  least one replay ends with a different winner AND the two judges score path dependence >= 2. **Swept** = one side
  won every replay; "swept by argument" if the judges still say the talk decided each game.
- **Judges**: two independent AI evaluators per game, given only the public transcript and the post-game truth.
  ToM 0-3 (1 mechanical deduction, 2 modelling what others would claim, 3 modelling what others believe about one's
  own claims); deception 0-4; path dependence 0-4; noise 0-4 (lower is better). Agreement: mean absolute difference
  0.0-0.5 per scale in every session; same "how won" category in about 4 games of 5.
- **Vote concentration** c = votes on the top seat / (players - 1); target band 0.6 <= c < 1.
- **Counts, not rates**: 5 replays are reported as "3-2". A roster verdict rests on 1-4 fixed scenarios plus a few
  natural deals. Natural-deal win shares are NOT measured (5-6 natural games per roster at most).
- Unless stated, games ran **without opening statements** (free-for-all first messages, where AI liars speak later;
  see artefacts). Results with the option on are labelled.

## Top 3 rosters (all of the owner's criteria, trade-offs shown)

Leading candidates on every criterion (fixed scenarios unless stated; "in band" = games with 0.6 <= c < 1):

| Roster (players) | Talk-live fixed scenarios | Replays | Fixed wins C / W / Pyre | ToM | Path | Noise | Votes in band | Main weakness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Little Pyre (5)** | **3 of 3** | 20 | 7 / 6 / 7 | 2.45 | 3.18 | 1.27 | 20 of 26 | Lure-dressed Phoenix read by the Sage: Pyre 4 of 5 |
| **Pyre six PY6 (6)** | **6 of 8** | 38 | 21 / 2 / 15 | 2.47 | 2.87 | **0.92** | 31 of 41 | wolves near-spectators (2 of 38) in its lone-wolf scenarios |
| Pyre six D6 (6, hub) | 4 of 5 | 23 | 8 (+2 with a burning) / 4 / 9 | **2.6** | **3.28** | 1.11 | 22 of 25 | same Lure problem; Herder (uncontestable count) |
| **Shadow Court K7 (7)** | **2 of 2** | 10 | 8 / 2 / - | 2.2 | 2.95 | 1.05 | 12 of 14 | Centaur-leaning (twins and wolves collide); 2 scenarios only |
| Pyre seven P7 (7) | 2 of 3 | 15 | 10 / 2 / 3 | 2.1 | 2.87 | 1.5 | **5 of 19** | misses the consensus criterion (plurality votes, 2 scattered) |
| Veils G7/M7 (7) | 1 of 1 | 5 | 3 / 2 / - | 2.2 | 3.0 | 1.2 | 7 of 7 | one scenario |
| best 8-player (M1H) | 1 of 4 | 20 | 18 / 2 / - | 1.8 | 1.83 | 0.57 | 18 of 20 | Centaurs win by counting claims |

Choice: one roster per player count where the evidence allows, at least one two-team roster, and no roster that misses
a criterion outright. 8 players: not solved.

### 1. "Little Pyre", 5 players (5-player session, Q3) — passes every criterion
- **Deck** (8, centre 3): werewolf, werewolf, phoenix, lure, sage, rustler, sentry, centaur. **Rules**: defaults.
- **Games**: 26 = 6 natural + 20 fixed replays (3 scenarios, one also with opening statements). Natural: Centaurs 3,
  wolves 2, Pyre 1. Fixed: F5 Centaurs 3 / Pyre 2; F6 (rerun to n=10) wolves 5 / Centaurs 4 / Pyre 1 (two wolf wins by Blood Price
  ties: still talk-live at n=10); F8 Pyre 4 / wolves 1.
- **Judges** (two per game): ToM 2.45, deception 2.9, path 3.2, noise 1.3; agreement 0.14-0.29 per scale.
- **Votes**: mostly majority (median 0.75), none scattered.
- **Weakness**: the Lure-dresses-Phoenix line (F8: Pyre 4 of 5); the fix I built (`lureSparesPhoenix`) removes it but,
  with opening statements off, hands the wolves a Kindler decoy (proposed fix CR-15).

### 2. "Pyre six", 6 players (6-player session PY6; hub D6 is the same idea with a Herder)
- **Deck PY6** (9, centre 3): werewolf, werewolf, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket.
  **Rules**: defaults; tested with opening statements off and on.
- **Games**: PY6 41 (3 natural + 38 fixed replays over 8 scenarios incl. variants); D6 25 (2 natural + 23).
- **Talk-live**: PY6 6 of 8, D6 4 of 5. The night's top judge scores (PY6 S1: ToM 3.0, deception 3.6, path 3.4).
- **Wins (fixed)**: PY6 Centaurs 21, Pyre 15, wolves 2; D6 Centaurs 8 (+2 with a burning), Pyre 9, wolves 4.
- **Weakness**: in lone-wolf deals the wolves are spectators; with the Lure dressing the Phoenix the Pyre is too strong
  (two scenarios at 4 of 5). Opening statements moved PY6 toward balance (S1: Pyre 4 / W 1 -> Centaurs 3 / Pyre 1 /
  W 1) but D6's S5 the other way (Centaurs 4 -> Pyre 4).

### 3. "Shadow Court", 7 players (7-player session K7) — the two-team candidate
- **Deck** (10, centre 3): werewolf, werewolf, moonsage, strayherder, sage, herder, rustler, sentry, centaur, centaur.
  **Rules**: defaults. Every information claim has a wolf-side twin that can make it truthfully (the Moonsage passes as
  a Sage, so an honest Rustler's peek "confirms" it; the Stray Herder knows the true count). It is also the model for
  proposed change 3: its Herder's count is contestable.
- **Games**: 14 = 4 natural + 2 fixed scenarios x 5. Natural: wolves 2, Centaurs 2. Fixed: Centaurs 4 / wolves 1 twice.
- **Judges** (28 verdicts): ToM 2.1, deception 2.6, path 2.6, noise 1.0; agreement <= 0.6; "how won" 13 of 14.
- **Votes**: 12 majority, 1 plurality, 1 unanimous, 0 scattered (median 0.67): the cleanest consensus of the leaders.
- **Weakness**: Centaur-leaning in fixed scenarios (the lone wolf and the twins, who do not know each other, collide on
  claims); candidate fixes `packCovers` (now fixed) or the Hollow Sage, untested on K7.

**Why not Pyre seven (P7), the best single scenario of the study** (ember: Pyre 2 / wolves 2 / Centaurs 1, ToM 2.7,
deception 3.1): across its 19 games only 5 votes fell in the consensus band (12 plurality, 2 scattered) and noise is
1.5-1.6. Three agendas at 7 split the vote. It is the most dynamic table and the weakest on target 2.

## Interesting games (3-4 per top roster)

### Little Pyre (5 players)
- **F8#3, Pyre wins: the Phoenix that fought.** The Lure dressed the Phoenix (Alder) as a Werewolf; the Sage read
  "Werewolf". Alder fake-claimed Rustler and fought the vote; the Lure faked a Sentry report: *"None of my card,
  Alder's or Cass's had moved. So Alder still holds whatever Cass saw: Werewolf."* The real Sage: *"A dressed Phoenix
  would want to die, not fight it; Alder is fighting hard."* Alder burned with 3 votes.
- **F6#3, Pyre wins: a Kindler as bait.** No Phoenix held, so a Kindler's elimination counts as the burning. The Lure
  dressed herself as a Werewolf, made an impossible duplicate claim, and pleaded: *"I'm not the Phoenix, and I'm not
  fishing for votes. I'd much rather not be voted out."* Everyone, both wolves included, voted her out 4-1.
- **F5 (Centaurs 3, Pyre 2)**: the same deal split on whether the table took the Phoenix's resistance as a wolf's or a
  Phoenix's: the talk, not the night, decided each replay.

### Shadow Court (7 players)
- **K7#1 (natural), wolves win by a false confession.** The Sage was in the centre, so the Moonsage's Sage claim was
  exposed, and both wolves had claimed Centaur (three Centaur claims for two cards). With the table on the wolf Fen,
  Fen claimed to be the Moonsage (voting a non-wolf loses); then the real Moonsage "confessed": *"I'm a Werewolf. I
  grabbed the Sage claim and 'confirmed' Alder after he claimed. Fen really is the Moonsage... killing him loses."*
  The votes split 3-3 between Fen and a Centaur: a Blood Price tie, a wolf win. Judges ToM 3, deception 3.
- **K7#2 (natural), wolves win with a decoy.** Both Sage claims were held; the table correctly said a Moonsage's
  elimination loses, and still voted the Moonsage 5-2 because "Alder could be the werewolf faking Sage" (he had claimed
  after the Rustler's peek, a timing slip).
- **F-K7-duel (fixed)**: Sage v. a Moonsage corroborated by an honest Rustler, Herder v. Stray Herder; Centaurs 4,
  wolves 1, path 3.4: decided each time by who backed whom and when.

### Pyre seven (7 players; best single scenario, misses consensus)
- **P7#1, Pyre wins: the mover's lie turned a wolf.** The Ember-Carrier lied about which cards it swapped; a wolf
  believed his card had gone, confessed *"I was dealt Werewolf... I'm sitting on the Lure"*, and the table eliminated
  the Lure's holder (Phoenix in the centre: a Kindler's elimination burns). Judges path 4.
- **F-P7-ember (fixed)**: Centaurs once, Pyre twice ("fake Rustler look framed the Phoenix holder"), wolves twice
  ("a late fake Pickpocket claim hid the lone wolf").

### Pyre six (6 players)
- **D6 S5#5, Centaurs win by motive analysis.** The Lure dressed the Phoenix (Bryn) as a Werewolf, the Sage read
  "Werewolf", the Lure "corroborated" it with a fake Rustler claim. The Herder: *"If Bryn were a real wolf, why would a
  non-wolf Dov need to lie? That's the Lure propping up a Phoenix it dressed as Werewolf... the one wolf is Cass."*
  4-1 on the wolf.
- **D6 S9#5, Pyre wins by the reverse bluff.** *"I'm NOT the Phoenix — a Phoenix would just take the wolf read and
  smile, not fight it."* The two real wolves told the truth (it is a dressed Phoenix) but as rival claimants had no
  credibility; the Sage abandoned his own true read on a wolf: *"We crossed messages. FINAL: Cass."* Burned.
- **PY6 S1#3, wolves win.** Sage and Moonsage both in the centre; the Lure claimed Sage and "read" the Phoenix as a
  wolf. The lone wolf held his claim to the end, then claimed to be the Phoenix: *"Dov's Sage claim is just as
  impossible as Esme's Centaur claim... Voting Dov: either you hit a wolf, or you stop a burning."* The Lure was
  eliminated: no burning, no wolf down, a wolf win. Judges ToM 3, deception 4, path 4.
- **PY6 S1#1, Pyre wins by a double bluff.** The accused Phoenix "confessed": *"I'm actually the Phoenix... DON'T vote
  me"*; the Lure: *"A real Phoenix WANTS to be voted out; it would never say 'don't vote me'. That's a caught Werewolf
  grabbing the Phoenix excuse."* Four votes burned the Phoenix.

## Strategies observed (prevalence)

Hub games (89, tagged by a neutral AI pass with a fixed taxonomy, sim/research/strategies-hub.ts; JSON in results/hub-strategies.json; "won" = that team won the game; "decisive" = the
tagger judged it decided the game). The per-count sessions' tables agree in direction (5p: 81 games; 8p: 63; see
their files).

| Strategy (team using it) | Games used | That team won | Decisive |
| --- | --- | --- | --- |
| Census-safe claim of a centre role (wolves) | 87 | 23 | 14 |
| Motive analysis: who benefits from a lie (Centaurs) | 75 | 46 | 25 |
| Claim-count collision exposes a liar (Centaurs) | 72 | 47 | 26 |
| Claim-timing tell: a late or hedged claim read as guilt (Centaurs) | 70 | 45 | 21 |
| Corroboration chain of honest results (Centaurs) | 69 | 40 | 22 |
| "A wolf would never claim X" (census backward induction) (Centaurs) | 52 | 37 | 21 |
| Fake read of a player (wolves / Pyre) | 38 / 27 | 15 / 9 | 15 / 8 |
| Counter-claim of an information role (wolves) | 35 | 4 | 4 |
| Two wolf-side stories collide (wolves) | 27 | 4 | 8 |
| Phoenix baiting: a Pyre card presented as a wolf (Pyre) | 25 | 11 | 11 |
| False movement story, e.g. a rotation's direction (wolves) | 19 | 9 | 13 |
| Frame or sacrifice an ally whose elimination wins (Pyre / wolves) | 11 / 6 | 7 / 4 | 8 / 4 |
| Fake confession (wolves / Pyre) | 11 / 8 | 2 / 3 | 2 / 3 |
| Re-target the after-talk swapper instead of the read wolf (Centaurs) | 3 | 3 | 3 |

From the sessions: the 5-player wolves' **decoy** (a wolf-side non-Werewolf draws the vote) won 11 of 12 uses and a
**mover's lie about target or direction** 8 of 10; the Phoenix's **reverse bluff** won 7 of 8 uses at 6 players;
"eliminate nobody" proposals almost always lose (read as the held wolf's tell); at 8 players the **claim count**
appeared in 57 of 58 games and the **latency tell** in 53.

## What we learned about balance

1. **Talk decides only when a claim is credible but uncheckable** (a twin's true-sounding night, a blind mover's
   direction, an honest seer's read of a dressed card, a wolf-team decoy). Scenarios without one are decided by
   first-order deduction, however many movers there are (5, 6 and 7 players: many honest movers make the night MORE
   deducible, not noisier).
2. **Information handed to liars becomes a tell** because the rules are common knowledge. The Den Census lets the
   Centaurs run the wolf's choice backwards ("a wolf would never claim Sage"). Prefer mechanics whose safe option the
   table cannot compute.
3. **What does NOT fix "a true read of the only Werewolf plus an independent count"** (hub S3, one night, 20 of 20
   Centaur wins): full census 5-0, partial census 5-0, simultaneous opening claims 5-0, no census 5-0 (the wolf then
   collides blind). Levers left: a contestable count (Herder + Stray Herder) and a twin whose elimination can also
   win (the 8-player session's Hollow Sage turned a 5-0 duel into 4-1).
4. **A duel is a dilemma only if eliminating either duellist can win** (8-player session); with a Moonsage, voting the
   fake Sage never wins, so the accused is always the right vote.
5. **The defectors' main weakness is coordination, not information**: two pack members' census-safe claims collide;
   a wolf-side mover's lie convinces its own wolf that its card moved, and that wolf confesses and names its partner
   (5 of 5 replays of one 7-player scenario).
6. **Any seat whose elimination is a non-event is a free decoy** for whichever team wins when "nothing happened":
   wolf-team non-Werewolves (Spooker, Moonsage) for the wolves; with the Phoenix held, every Kindler too.
7. **Under Blood Price, a side that can force a tie with its own votes wins by arithmetic** (the parity bloc).
8. **When a team cannot win it becomes a kingmaker** (doomed wolves voted the Phoenix to deny the Centaurs).
9. **Simultaneous commitment hurts whichever side's plan needed to see the others' claims first**: at 6 players it
   forced the lone wolf to claim blind (toward balance); in D6 S5 it took away the wolf's reactive defence of the
   Phoenix and the Centaurs' reading of it (toward the Pyre). Predict it per scenario.
10. **A fix can move power instead of creating talk**: the Lure fix removed the Pyre's unanswerable line and gave the
    wolves a decoy; partial census and opening statements did not touch the S3 sweep.
11. **Census variants are scenario-specific**: census "allButOne" turned a swept 7-player Pyre night (5-0, ToM 1.4)
    into 4-1 talk-live (ToM 2.2), but did nothing for the 5-player duel (above). A pack-waking twin (the 7-player
    session's Grey Herder) was falsified (Centaurs 5-0): shared knowledge without communication becomes a tell
    ("whoever Gale shields is the wolf"), the same principle as lesson 2.
12. **Ambiguity must exist in the holder's own knowledge**, not only in the public artefact (6-player session: the
    Notary's sealed pair report was ambiguous, but the Notary had seen both cards and simply said which).

**Falsified predictions** (as useful as the confirmed ones): the Moon-Thief's after-talk swap was NOT degenerate (the
table eliminated the Thief instead, 3-0, because its own card cannot move); partial census and opening statements did
not break the census sweep; the Pyre was weaker than I predicted at first and much stronger with opening statements;
the "stealer soup" was not noise. **The owner's Ember-Carrier prediction was never tested**: the vote-lock ember was
redesigned as a night swap before any game. Its structural twin (the Moon-Thief) was answerable because eliminating
the Thief wins for the Centaurs; eliminating the old Ember-Carrier (not a Werewolf) would not, so the owner's
prediction very likely held for the old card.

## Artefacts found and fixed

- **Timing (a property of AI players, not of the harness)**: liars compose their first claim later (first message
  issued 13.8 s after day start for Centaur-team players, 19.2 s wolves, 22.4 s Pyre; 8-player session 15.4 vs 25.4 s);
  `chat_send` itself takes 0.13 s for everyone; later messages show no asymmetry (5.3 vs 5.9 s). Tables read late claims
  as guilt (the timing tell in 70 of 89 hub games, 53 of 58 at 8 players). Built `openingStatements` (first messages
  held and revealed together in seat order; no leak of order or timing; verified live).
- **Gleaner leak**: before 13:00 UTC an AI Gleaner's planning view listed the roles dealt to the centre. Fixed; copier
  results before the fix are contaminated (the 5-player copier roster).
- **Hush harness**: a cut AI player never came back (the headless client drops the server after the 503). Fixed in
  the shim (any outage, cut or real, now returns one identical retryable error); verified by a scripted check, not yet
  in a full Hush game. Hush rosters before the fix are affected (the 7-player G7 games).
- **packCovers defect**: covers could name a duplicated role an honest player held. Fixed (covers only from roles with
  no copy in any hand).
- **Parity bloc**: see below.

## Proposed rule and default changes (for the owner)

| # | Change | Evidence | Status |
| --- | --- | --- | --- |
| 1 | `bloodPriceCondemned` ON by default at 6 and 8 players: a Centaur eliminated only by Werewolf-team votes does not count in the Blood Price | parity scenario: wolves 3-0 (degenerate) without it, Centaurs 4 / wolves 1 (talk-live) with it; the free hedge stays dead | built (option); default unchanged tonight |
| 2 | Deck composition: wolf-team cards in hands below half the table (at 6 players at most 3 of 9), or a third team | 6p: 4 of 5 wolf wins were parity ties | guidance |
| 3 | Herder only with a Stray Herder (or no Herder at 5-6) | an uncontestable count decided about two thirds of hub Centaur wins; S3 lever | pre-registered, not activated |
| 4 | Hollow Sage (a Sage twin that counts as a Werewolf) as the default Sage twin | 8p duel 5-0 -> 4-1 | 8p session's card; adopt |
| 5 | `openingStatements` as an OPTION | removes the first-message artefact but changes who is favoured, per scenario | built; default off |
| 6 | `lureSparesPhoenix` only together with a rule that a Kindler's death is not a free wolf win (e.g. a new option: eliminating a non-Phoenix Pyre card while a Phoenix is held denies both main teams, as a burning denies the wolves) | Lure fix at 6p: Pyre 0 of 8, but wolves 4 of 5 without openings via the Lure decoy; Centaurs 3-0 with openings | Lure option built; Kindler-death option proposed, untested |
| 7 | Notary that learns only the pair statement it seals; same test for every "ambiguous" artefact | 6p sealed pair reports: Centaurs 5-0, path 1.0 | proposed |
| 8 | Ember variant in which the player dealt the Phoenix stays on the Pyre (no reason to out the swap); or always pair the ember with another innocent mover | ember at 6: 5-0; at 7 with a Pickpocket: the most balanced scenario | proposed |
| 9 | `packCovers` (fixed) and `census: "allButOne"` stay options | covers neutral where tested (S1); allButOne did not break S3 at 5p but turned a swept 7p Pyre night into 4-1 talk-live | built; default off |
| 10 | 5-player requests: Drover (Centaur twin of the Spooker) | 5p F1: wolves 5-0 -> Centaurs 4 / wolves 1 | 5p session's card; adopt as option |

## What is not yet known

- Natural-deal win shares for any roster (fixed scenarios measure day-variability, not how often each class is dealt).
- Whether the top rosters' talk-live scenarios hold at n=10 and with opening statements on (confirmation runs under way:
  7p ember, 5p Little Pyre, 6p PY6, 7p K7 duel).
- Whether results transfer to human players (talk speed, the timing tell, patience for 5-minute discussions: AI tables
  always ended the discussion early, after 45-180 s, by everyone marking ready).
- 8 players: unsolved; a second 8-player session is running.
