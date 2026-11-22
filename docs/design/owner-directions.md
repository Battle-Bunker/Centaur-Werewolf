# Owner directions (binding requirements)

These directions came from the game's owner after the first tournament round. They are **requirements, not
experiments**: later sessions may retune them (every family can be switched on or off by deck composition or a room
setting) but must not remove them. Where they differ from [synthesis.md](synthesis.md), they take priority.

## 1. Duplicates and shadow twins

**Direction.** Any card may appear in a deck any number of times. Enemy-team near-duplicates of Centaur roles act in
the original's turn with the same action, so a defector can truthfully describe a real role's night.

**Realised.**
- Copy limits are 12 for every role (`deckProblem` checks only size and the deck rules). Several holders of one role all
  act in its turn, each with their own result.
- Cards are **instances** (`GameState.inst`, `cinst`, `instRole`): seat *s*'s dealt card is instance *s*, the *n*th
  centre card instance `players + n`. Anything bound to "the card" (the Cuckoo's egg, the Oxpecker's bond) is keyed by
  instance and follows that physical card. Bites are a list (several Biters).
- Twins (`RoleDef.twinOf`, `looksAs`): Moonsage (Sage), Dun Centaur (Centaur), Pale Herald (Herald), Dusk Rustler
  (Rustler), Stray Herder (Herder). `nightTurns` groups a twin under its original's turn, so the public timetable shows
  one turn for the pair (and the original's turn even when only the twin is in the deck).
  - **Passes** (`looksAs` = the original): Moonsage, Pale Herald, Stray Herder are allies that are *not* Werewolves and
    read as the original to every look (except Werewolf-team looks).
  - **Shows itself**: Dun Centaur and Dusk Rustler are Werewolves (they count for elimination and the Herder's count)
    that do not wake with the pack, and read as themselves.

## 2. Several card-stealing roles

**Direction.** Variants of "swap my card with another's", across teams, several per deck, mostly mandatory.

**Realised** (all mandatory, built from `swap` + `look`): Cutpurse (swap, then look at what you took), Pickpocket
(blind swap), Drifter (swap with a centre card, then look), Poacher (Werewolf-team; swap then look, so its team goes to
the victim), Latecomer (late, wake 88, blind). The Rustler remains "look, then choose". The room rule
`mandatorySteps` (default off) makes every optional step mandatory, for A/B tests of the round-1 finding that AI
players decline optional moves.

## 3. Deliberate noise at night

**Direction.** Defector cards corrupt what others see, the victim never told, as one parameterised primitive.

**Realised** as `Effect { kind: "distort"; target: "card" | "viewer"; value: "chosen" | "random" }`:
- Glamour (card, chosen; a Werewolf), Will-o'-Wisp (card, random), Mistweaver (viewer, chosen), Fogbank (viewer, random).
- **Card** distortions apply to every look at the card until dawn and **travel with the card** when it moves. A random
  card distortion draws its wrong role once, so every viewer agrees.
- **Viewer** distortions apply to every look that player takes **at a centre card** tonight (glances, peeks, a Herald's
  proclamation); a random one draws afresh at each look. Looks at players' cards are untouched.
- **Interactions.** Team-only looks show the team of the role seen. The Herder's count and every Werewolf-team look see
  the truth. A proclamation publishes what its maker saw. Conditional plans branch on what the viewer **saw**.
  **Stacking:** a passing twin's disguise, then the latest card distortion, then the viewer's veil (applied last).
- The post-game log shows both what was seen and what was true (`LogEntry.hidden.truth`, and the role a random
  distortion showed).

## 4. Forged authenticated messages

**Direction.** Defectors can post messages carrying a Centaur role's authentication, indistinguishable until the end.

**Realised.** An authenticated message has a claimed source role (`messages.seal`). Real and forged messages are the
same artefact (same text format, same seal, same note "The game confirms this was sent by the player DEALT <role>");
only a hidden `forged` flag differs, revealed after the game.
- Signet: free text (`chat.sendSigned`).
- Notary (new, a seer): reads a card at night; once in the day posts a **sealed report composed by the engine** from
  that look (`chat.sendReport`): "Sealed report: at night, <player> (seat n)'s card was <role>."
- Counterfeiter (Werewolf ally): once, `chat.forgeSeal` as Signet (text of its choosing) or as Notary (seat and role of
  its choosing), only for a sealing role in the deck.
- The Forger already forges the Herald's dawn proclamation. Rules text and caveats tell every player that seals and
  proclamations can be forged when a forger is in the deck.

## 5. A separate, timed vote phase

**Direction.** lobby → night → discussion → vote → ended, with its own timer and random votes for latecomers.

**Realised.** Phase `vote` with `settings.voteSeconds` (default 20, 5 to 120, `setup.setTimer { timer: "vote" }`).
Discussion ends by its timer, by the host (`day.endDiscussion`), or when every seated human is ready (`day.ready`,
public). `day.vote` works only in the vote phase (refused in discussion with how to get there). The vote ends on its
timer or once every seated human has voted; missing votes are uniformly random, kept in `forcedVotes`, marked
`voteWasRandom` and "did not vote in time: voted at random". Chat closes during the vote unless `chatDuringVote`. The
Moon-Thief's swap may be queued in discussion or the vote and fires as the vote ends, before counting.

## 6. The Hush, and presence as architecture

**Direction.** A wolf-side card cuts one player off for a minute, indistinguishable from their connection dropping until
the results; presence and every perceivable signal go through one central gate.

**Realised.**
- Presence: heartbeats (`presence.heartbeat` from the app every 5 s; every authenticated MCP call). One function,
  `liveness` (convex/presence.ts), derives online/offline (16 s without a heartbeat); both views use it.
- One gate, `gateOf(game, phase, rules, seat, now)`: may this player emit or receive now. A **seat effect** (a general
  time-window primitive, `Game.seatEffects`) of kind `blackout` closes it. The dispatcher refuses every call from a
  closed seat with the same unreachable error; the app view refuses to serve them; the MCP endpoint answers a bare 503.
  Their heartbeats fail too, so others see the normal lag before "offline" and the return on the first heartbeat after
  the window: exactly a real drop.
- Every registry command declares `perceivable` (a test fails if one does not); the dispatcher applies seat effects
  from that one property, so future commands cannot forget.
- The Hush: `day.cutLine { seat }`, once per game; rules `cutSeconds` (default 60) and `cutDuringVote` (default off since round 3: a vote forced at random after the talk is outcome noise).
  Revealed only in the results (`cutOff` per seat, a log line, `seatEffects`).
- Contract for future real-time channels (video, audio): see docs/architecture.md, "Presence and the gate".

## 7. Round-1 fixes folded in

`room_wait` holds a server slot for at most 4 s and says when no version was given; times are absolute (`endsAt`,
`serverNow`) and computed in the HTTP action; learnSeats lines use their label; every game records its deal seed
(shown after the game); forced random moves are uniform over every legal decision (ordered multi-target choices and
declining included); the MCP view lists centre-card targets in a per-viewer order and gives a ready-to-edit
conditional plan built from the legal choices.

## 8. Role copying (two copiers on one `adopt` primitive)

**Direction.** A card that copies a centre card and one that copies a player's card, becoming that role for the game.

**Realised.** `Effect { kind: "adopt" }`, recorded on the copier's CARD INSTANCE (`GameState.adopted`), read
everywhere a rule needs the card's identity (`effRole`, `heldRoles`, `actingRole`).
- **Gleaner** (wake 2, a centre card) and **Echo** (wake 3, another player's card): both wake before every other role,
  so their own turns exist whenever they are in the deck and reveal nothing about what was copied. The copier then
  performs the copied role's night action **in that role's own ordinary turn** (`actorsOf`/`runTurn`).
- **What is copied:** the card's TRUE current identity: never a distortion (the log shows both what was seen and what
  was taken); a twin stays a twin; a copier that already copied passes on what it became; an uncopied copier passes on
  a spent copier (Centaur team, nothing left to do).
- **Copying a Werewolf:** the copier counts as a Werewolf and sees the pack in the Werewolf turn; the pack does NOT see
  the copier (pack knowledge is of DEALT cards). Lone-wolf steps follow the usual rule.
- **Per-card state:** the copy has its own: its own egg or bond (marks bind to the copier's instance), its own once-per-
  game chat and day powers (granted by `actingRole`), its own Heir conversion. Copying a Phoenix makes a second Phoenix;
  copying a Kindler joins the Pyre and gathers with the brood (wake 5, after the copiers).
- **Looks** at a copier's card show its own face (Gleaner/Echo). If the card moves, its new holder holds the copy.
- **Plans:** `night.planStep { step, plan, as: <role> }` queues what the copier will do for each role it may become
  (stored per role in `Game.adoptPlans[seat][role][step]`, the same `StepPlan` shape, branches included). Default:
  decide live in that role's turn, else a uniformly random move. The MCP view lists `copier.stepsIfYouBecome[role]`
  (with legal choices) before the copy and the copied role's steps (marked `as`) after it.
- **Results:** each seat's `summary` reads "dealt Echo, became Werewolf, ended holding Echo (a copy of Werewolf), …".

## 9. The Pyre (the third team, replacing the Wildwood)

**Direction.** One sacrificial member who wants to be eliminated plus supporters who win when it is.

**Realised.** Team `pyre`. A **burning** is the elimination of a player holding a Phoenix card.
- **Phoenix** (no night action): the Pyre wins if its holder is eliminated. It does not know the Kindlers unless the
  rule `phoenixKnowsKindlers` (default off) is on.
- **Kindlers** all share one early turn, "The brood gathers" (wake 5, `turnOf: "kindler"`), learning which seats were
  DEALT a Phoenix and which were dealt Kindler cards. All Pyre cards' holders win exactly when a Phoenix burns, alive or
  dead. Kinds (several of each allowed): **Kindler** (plain), **Lure** (a chosen card distortion: dress the Phoenix as a
  Werewolf), **False Witness** (one forged seal; needs a Signet or Notary in the deck), **Ember-Carrier** (queues a seat;
  as the vote ends, after any Moon-Thief swap, a Phoenix card, held if any else from the centre, swaps with that seat's
  card; it may target any other seat, since it cannot know who holds what), **Heavy Hand** (its vote counts 2 when cast
  for a Phoenix holder), **Heir** (if the deck's Phoenix is held by no player at dawn, every held Heir card becomes a
  Phoenix and its holder is told).
- **No Phoenix held at the count** (and no Heir conversion): rule `pyreFallback`: "kindler" (default; a Kindler's
  elimination counts as the burning) or "none".
- **Rule `burningDeniesWolves`** (default on): a burning denies every Werewolf-team win (including the Stalking Horse's),
  and the Centaurs keep their win only if it came from the Blood Price count (a Werewolf eliminated, W > C).
- **Interactions.** A burning is about the CARD: a bitten Phoenix holder plays for the wolves, yet the card still burns.
  A moved Phoenix: the Kindlers knew only the dealt seat. A moved Kindler card: its new holder is Pyre, untold. Pyre cards
  show as themselves to a look and count as neither Werewolves nor Centaurs under Blood Price. A Hush may cut anyone,
  Pyre included.
- **Order:** swaps (Moon-Thief, then embers) → tally (Heavy Hand) → teams → main result (decoy, no Werewolf held,
  Blood Price) → the burning (Pyre wins; with the rule, denial) → loners (Cuckoo, then Oxpecker).
- **What happened to the Wildwood.** Kept as **loners** (team `loner`, individual win rules, clearly labelled): the
  **Cuckoo** (egg parasite) and the **Oxpecker** (symbiont): both give a seat a private agenda that does not depend on
  the main teams. Retired: the **Sporeling** and the **Moth/Imago** (both "wants to be eliminated", now the Phoenix's
  job; the curse made votes arithmetic) and the **Elderbark** (its point was mapping a faction that no longer exists).

## 10. Round-2 findings applied

- Mandatory movers (section 2) plus the `mandatorySteps` rule give Centaur movers no option to sit still; the Cutpurse
  and Drifter also learn something only by moving (what they took), so where to move is a real decision.
- Parameters invisible to detectors: the Spooker's rotation direction (the order of its three picks) and the
  Ember-Carrier's target are invisible to the Sentry, which sees only *that* a card moved.
- Votes stay secret until the end; only "has voted" is public (unchanged).
- Slot labels: every text says "centre card 1" for `{ k: "c", i: 0 }`; every legal target in the MCP view now carries
  its `label` beside the slot, and the argument description says the index counts from 0.
- Evidence: random-play baselines are not evidence of balance; balance is judged from all-Opus tournaments.

## 11. The quality target, and calibration

**Target (owner).** Within each fixed scenario (same deal, same night actions, same random draws) there should be high
variability in who wins and how, arising entirely from what players choose to SAY during the day. Variation that comes
only from the deal or from hidden actions is not the goal, and pure noise is a failure: consensus should form fairly
strongly fairly often (vote concentration skewed toward substantial consensus, not scattered and not always unanimous).
Defector wins should be clever; Centaur wins should need theory of mind, not just first-order elimination of mechanical
possibilities.

**Calibration principle.** Abilities act on beliefs and on what can credibly be said, not on the outcome after the
talking is over. Prefer strong effects that are visible in principle (deducible or preventable through talk) over
weaker invisible ones. Applied:
- The Ember-Carrier's vote-lock move (it would have converted any elimination into a burning) became a mandatory blind
  NIGHT swap of two other players' cards in the brood's turn: it can still carry the Phoenix to someone who does not
  know, but the talk comes after it, its holder can claim it, and the Sentry can notice the move.
- The Moon-Thief's vote-lock swap stays implemented behind the rule `daySwap`, OFF by default.
- The Heavy Hand's double vote counts for any target (like Chiron), so it carries risk and no longer only helps the burning.
- The Heir (dawn, before the talk) and the Hush (during the talk, revealed at the end) were judged consistent with the
  principle; several supporters may stack, each acting at night or through talk.
- Scenario replay (rules reference section 7) exists to measure exactly this target: many days per fixed scenario.

## 12. The evidence amendment

**Direction (owner, binding).** The game never gives pure, easy confirmation. Everything it vouches for in public must be
INDIRECT (a pair, a count, a relation), FAKEABLE (a defector card can emit the identical artefact, and the rules say
so) or AMBIGUOUS. No engine-vouched public fact may be something a defector could not have produced. Private looks and
the wolf side's distortions stay as they are.

**1. Seals are signed by a role, never a player.** A sealed message reads "Sealed: the Signet" (or "the Notary"). Until
the game ends no view carries its poster: in the app view `name`, `seat` and `via` (the assistant marker) are null and
`mine` is false for everyone but the poster; over MCP `from` is "sealed: the Signet", `seat` is null, and only the
poster's own view adds `yours: true`. Real and forged seals are the same row shape, the same text format and the same
note; the post updates nothing else anyone can see. The results page names the poster and flags forgeries.

**2. Hard public confirmation removed.** Audit of everything the engine publishes:

| Artefact | Before | After |
|---|---|---|
| Herald's proclamation | one centre card's identity (two with 5+ centre) | "at least one of these two centre cards is a <role>", the role one of the two showed (chosen at random); the Herald learns no more than the table |
| Pale Herald | a true single-card proclamation, labelled with its own card | the same pair proclamation, labelled the Herald's (the label used to give a Pale Herald or a copier away) |
| Forger | forged one card's identity | forges "at least one of <any two centre cards> is a <any role in the deck>", the identical artefact |
| Notary's report | "at night, <player>'s card was <role>", signed by the player dealt Notary | looks at two players; "at night, at least one of <A>'s and <B>'s cards was a <role>" (one of the two roles it saw, its choice), signed by the role only |
| Signet | "sent by the player DEALT Signet" (named the poster's dealt card) | "Sealed: the Signet", no name |
| Counterfeiter / False Witness | forged a one-card report | forge the two-player report (any two seats, any role) or Signet text |
| Cuckoo's egg | public mark on a seat, layer unknown | unchanged: not a role fact, and an unheld Cuckoo's egg is laid at random, so it is already ambiguous |
| Hush's cut | indistinguishable from a dropped connection | unchanged |

Deck rules make the fakeability real: a deck with a proclamation (Herald, Pale Herald) must hold a Forger, a Forger
needs a proclaimer, and both need "Proclamations at dawn" (with proclamations shown as made, the timing would tell a
forgery from a real one); a deck with a Signet or Notary must hold a seal forger (Counterfeiter or False Witness). The
forging card may lie in the centre: the table cannot know. No card was retired; ids are unchanged. The recommended deck
no longer includes the Herald or the Notary (a Drifter and a Latecomer take their places).

**3. Softer leaks swept.**
- Night timetable: fixed at the deal, one turn per role in the deck whether or not anyone holds it, never ended early:
  no leak (checked). The vote and the discussion end early only on everyone's ready/vote, which says nothing of cards.
- Proclamation labels: every proclamation is now published "the Herald's turn", whoever made it (fixed, see above).
- Presence: another seat's `lastSeenAt` is rounded down to the heartbeat interval (5 s), so it says online or not,
  never the timing of a burst of activity (an assistant planning in its own turn). The viewer's own is exact.
- Once-per-game powers: whether a seat has used its seal or cut is in no view but its own (checked); a cut looks like a
  dropped connection.
- Has-voted and ready indicators: public by design, never for whom; they reveal no card (checked, kept).
- Error messages: the refusals for powers (already used, wrong card) are returned to the caller only (checked).
- MCP per-phase fields: `proclamations` now carry `cards`, `atLeastOneIs`, `says` and a note that a Forger's looks the
  same; chat entries for seals carry `sealed` (the note) instead of `verified`. The app view's proclamations keep a
  `slot` field (the first of the two) only so older clients do not break; `slots` is the truth.
- Tournament stage files are regenerated through the amended deck rules (sim/tournaments/make-stages.ts amends older
  decks: a lone Herald gives way to a Farrier, a lone Notary to a Herder, a lone Signet to a Sentry).
