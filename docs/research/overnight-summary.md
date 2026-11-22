# Balance research: summary for the owner

Version 2 (14:00 UTC; refreshed again by 18:30 UTC with the 6-player JSON, 8-player round 2 and the confirmation runs).
Machine-readable companion: [overnight-summary.json](overnight-summary.json), rebuilt by
`npx tsx sim/research/overnight.ts` from `docs/research/results/*.json`. Method and measures: [charter.md](charter.md);
full record and heuristics: [log.md](log.md); per player count: `results/players-N.md`.

## In one paragraph

About 300 all-Opus games were played today by five sessions (hub, and one per player count 5-8), most of them as
**fixed scenarios**: one deal, one night, replayed 5 times with fresh AI players so that only the discussion differs.
The best rosters at 5, 6 and 7 players all contain the **Pyre** (a Phoenix that wants to be eliminated and Kindlers
who help it): with three teams, every side has a credible story and a private reason to distrust the others, and the
neutral judges gave those games the highest theory-of-mind and path-dependence scores. **8 players is not solved.**
The most important design lessons: talk decides only when a claim is credible but uncheckable; information handed to
liars becomes a tell because the rules are common knowledge; and several "fixes" moved power to a different team
instead of into the talk.

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

## Top 3 rosters (ranked on the primary target: talk-live fixed scenarios, then ToM, then consensus in band)

### 1. "Little Pyre", 5 players (5-player session, roster Q3)
- **Deck** (8 cards, 3 centre): werewolf, werewolf, phoenix, lure, sage, rustler, sentry, centaur. **Rules**: defaults.
- **Games**: 21 = 6 natural + 3 fixed scenarios x 5. **Talk-live: 3 of 3.**
- **Wins**: fixed F5 Centaurs 3 / Pyre 2; F6 wolves 2 / Centaurs 2 / Pyre 1; F8 Pyre 4 / wolves 1. Natural: Centaurs 3,
  wolves 2, Pyre 1. All 21: Centaurs 8, wolves 5, Pyre 8.
- **Vote concentration** (21 games): majority 16, plurality 3, unanimous 2, scattered 0 (median 0.75).
- **Judges** (42 verdicts): ToM 2.45, deception 2.76, path 2.86, noise 1.19; agreement 0.14-0.29 per scale, "how won"
  17 of 21.
- **Weakness**: when the Lure dresses the Phoenix as a Werewolf and the Sage reads it (F8), the Pyre won 4 of 5. My
  `lureSparesPhoenix` option removes that line (tested at 6 players: Pyre 0 of 8) but without opening statements it
  handed the wolves a decoy (see "proposed changes"). The Pyre total (8 of 21) is inflated by Pyre-centred scenarios.

### 2. "Pyre seven", 7 players (7-player session, roster P7)
- **Deck** (10 cards, 3 centre): werewolf, werewolf, phoenix, lure, embercarrier, sage, rustler, sentry, centaur,
  pickpocket. **Rules**: defaults (the Ember-Carrier as redesigned: a blind swap at night).
- **Games**: 7 = 2 natural + 1 fixed scenario x 5. **Talk-live: 1 of 1**, and the only scenario of the night where all
  three teams won: **Pyre 2, wolves 2, Centaurs 1**. Natural: Pyre 1, Centaurs 1.
- **Vote concentration**: fixed 0.67 0.67 0.50 0.50 0.83 (two plurality: three agendas split the vote).
- **Judges** (fixed, 10 verdicts): ToM 2.7, deception 3.1, path 3.3, noise 1.5; agreement within 0.0-0.4.
- **Why it works**: the Ember-Carrier carries the Lure-dressed Phoenix to a player who does not know it; the honest Sage
  sincerely reads "Werewolf" on him; the lone wolf, who scented him as Pyre, must stop the burning without revealing
  how he knows; a Pickpocket in the deck gives every moved card an innocent explanation.
- **Weakness**: one fixed scenario only (a confirmation run at n=10 is under way); noise at the limit; vote
  concentration low in 2 of 5. The same ember scenario at 6 players (no Pickpocket, the Sentry watching both swapped
  seats) swept 5-0 for the Centaurs: the player dealt the Phoenix honestly said so and the swap was decoded.
- The 7-player session's other rosters are also talk-live in their one scenario each and more Centaur-leaning: K7
  "Shadow Court" (twins duel, Centaurs 4 / wolves 1, path 3.4), S7 (Spooker confession, 4-1, path 3.8), G7 (Glamour
  frame, 3-2, path 3.0).

### 3. "Pyre six", 6 players (hub roster D6 and the 6-player session's PY6)
- **Decks** (9 cards, 3 centre): D6 = werewolf, werewolf, phoenix, lure, sage, rustler, sentry, centaur, herder;
  PY6 = werewolf, werewolf, phoenix, lure, sage, moonsage, rustler, centaur, pickpocket. **Rules**: defaults.
- **Games**: D6 25 (2 natural + 5 fixed scenarios, 23 replays incl. rule variants); PY6 21 (3 natural + 4 fixed
  scenarios, 18 replays) plus 15 replays with opening statements.
- **Talk-live**: D6 4 of 5 fixed scenarios; PY6 2 of 4 (one borderline, one predicted control).
- **Wins** (fixed, defaults): D6 S5 Centaurs 4 (one with a side burning) / Pyre 1; D6 S9 Pyre 4 / Centaurs 1;
  PY6 S1 Pyre 4 / wolves 1; S2 Pyre 3 / Centaurs 2; S4 Centaurs 4 / Pyre 1; S3 Centaurs 3 (control).
- **Judges**: the highest of the night: PY6 S1 ToM 3.0, deception 3.6, path 3.4; D6 fixed ToM 2.6, path 3.3, noise 1.1.
  Concentration: D6 22 of 25 in band; PY6 median 0.8, no scattered vote.
- **Weakness**: the Pyre is too strong when the Lure dresses the Phoenix (two scenarios at 4 of 5), and the WOLVES are
  near-spectators in lone-wolf deals (PY6: 1 wolf win in 18 replays; all its scenarios had one wolf held). Opening
  statements moved PY6 toward balance (S1 Pyre 4 / W 1 -> Centaurs 3 / Pyre 1 / W 1) but moved D6's S5 the other way
  (Centaurs 4 -> Pyre 4); see the lesson on simultaneous claims below.

**Not recommendable yet**: 8 players (both 8-player sessions so far: of 10 fixed scenarios 1 talk-live, 2 borderline,
7 swept; 63 games Centaurs 52, wolves 6, Pyre 5), and every 5-6 player roster without a third team except as noted.

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

### Pyre seven (7 players)
- **P7#1, Pyre wins: the mover's lie turned a wolf.** The Ember-Carrier lied about which two cards it swapped
  ("Gale and Fen"; truly Cass and Bryn). A wolf believed his card had gone to Gale, confessed *"I was dealt
  Werewolf... I'm sitting on the Lure"*, and the table eliminated Gale, who held the Lure (Phoenix in the centre, so a
  Kindler's elimination burned): Pyre win, wolves denied. Judges path 4.
- **P7#2, Centaurs win: a fake confession caught.** A player carried the Phoenix, read as "Phoenix" by the Sage, claimed
  *"I was dealt WEREWOLF, my peek was invented"* to get voted out; the Sage caught it: *"Gale named me Sage at msg 1,
  before I had said anything."*
- **F-P7-ember (the fixed scenario)**: replays ended Centaurs ("deduced the only possible wolf"), Pyre twice ("fake
  Rustler look framed the Phoenix holder"), wolves twice ("a late fake Pickpocket claim hid the lone wolf").

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
tagger judged it decided the game). The per-count sessions' tables agree in direction (5p: 71 games; 8p: 63; see
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
11. **Ambiguity must exist in the holder's own knowledge**, not only in the public artefact (6-player session: the
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
- **Hush harness**: a cut AI player never came back. Fixed in the harness (7-player session).
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
| 9 | `packCovers` (fixed) and `census: "allButOne"` stay options | neutral where tested (S1); allButOne did not break S3 | built; default off |
| 10 | 5-player requests: Drover (Centaur twin of the Spooker) | 5p F1: wolves 5-0 -> Centaurs 4 / wolves 1 | 5p session's card; adopt as option |

## What is not yet known

- Natural-deal win shares for any roster (fixed scenarios measure day-variability, not how often each class is dealt).
- Whether the top rosters' talk-live scenarios hold at n=10 and with opening statements on (confirmation runs under way:
  7p ember, 5p Little Pyre, 6p PY6).
- Whether results transfer to human players (talk speed, the timing tell, patience for 5-minute discussions: AI tables
  always ended the discussion early, after 45-180 s, by everyone marking ready).
- 8 players: unsolved; a second 8-player session is running.
