# 8 players: requests to the hub (existing cards and rules; I did not modify them)

Evidence: [players-8.md](players-8.md), [players-8-log.md](players-8-log.md). Counts, not rates.

## R8-1. Moonsage: its win condition makes every Sage duel one-sided (evidence: F1 5-0, F2 5-0; H1 4-1 after the change)
Under Blood Price, eliminating a Moonsage (wolf team, NOT a Werewolf) can never win for the Centaurs. So when a Sage
claim names a Werewolf and another player claims Sage, the accused seat is the only vote that can win, whichever Sage
lies. The judges cited exactly this reasoning in 2 of 5 F1 replays ("voting out Alder could never win for the
Centaurs, since he was either a Sage or the Moonsage"). The tagger found "decision-theoretic vote" by the Centaurs in
43 of 58 games. I added the **Hollow Sage** (`hollowsage`, a Sage twin that counts as a Werewolf, outside the pack,
passes as a Sage). In the same scenario this turned a 5-0 sweep into 4-1 (talk-live by the charter; the wolf win was
a path-4 frame of the true Sage). **Request:** consider making the Hollow Sage the default Sage twin in rosters of 7 or
more, or note in the Moonsage's text that it is a "decoy that cannot win the vote". The same reasoning applies to
every non-Werewolf wolf ally that claims an information role (Pale Herald, Stray Herder): an accusation from it is
free, and a counter-accusation against it is worthless.

## R8-2. Pack covers: draw covers only from roles with NO copy held by a non-pack player (evidence: H2c 5-0)
`packCovers` gave the pair "Centaur" and "Drifter". The deck had 2 Centaurs, one in the centre and one held by an
honest player, so the wolf's Centaur cover made 3 Centaur claims for 2 cards in all 5 replays. The pack cannot know
whether a duplicated role's other copies are held, but the engine can. **Request:** a cover must be a Centaur-team
role all of whose copies lie in the centre; if there are none, fall back to "claim no role" or to a twin's original.

## R8-3. The census leaks through vocabulary (evidence: census slips in 10 of 58 games, decisive in 8)
Wolves named a card no honest look can show ("I saw the Hollow Sage in the centre": a passing twin always reads as
its original) or said "two Sages in the deck, one held". **Request (text only):** in the census line, add "an honest
look at a passing twin shows its original: say 'Sage', never 'Hollow Sage'". This is a rules-literacy leak, not a
balance question; humans would make it too.

## R8-4. The Pyre's Lure frame sweeps (evidence: F3 Pyre 5-0, judges deception 3.8, path 3.6)
The Lure dresses the Phoenix as a Werewolf, the Sage condemns it sincerely, the Phoenix FIGHTS the vote (a double
bluff), and "a Phoenix would welcome the vote" carried the table in all 5 replays. The only player who knew the truth
was the lone Werewolf (by its scent), who could not say how he knew without confessing. These are the cleverest wins
of my session but within-scenario there is no variability. The counter-story needs an honest voice that can doubt a
single dressed look. **Proposal (untested):** a Lure variant whose dress fools only the FIRST look at the card ("a
dress tears when looked at"), so two independent looks at the Phoenix disagree and the table can reason about why.
Or keep the Lure and pair it with a Rustler/Echo-style second reader as standard in Pyre rosters.

## R8-5. Opening claims are decided by typing speed (evidence: latency tell in 53 of 58 games; decisive in 31)
Honest players claim within 6-10 s; a liar composes for 30-40 s, then "claims only after being named". This tell
decided more games than any card. **Proposal (rule, untested):** an optional "opening statements" step: during the
first N seconds of the discussion every player may post one statement, all revealed together. It removes the
speed tell and the liar's advantage of hearing every honest claim first. I predict it lowers the Centaurs' share at 8
seats and increases claim collisions between wolves (which R8-2 then matters for).

## R8-6. Self-incriminating movers cannot carry a counter-story (evidence: S3 5-0 vs H1 4-1)
Putting a Spooker into the duel scenario did not help the wolves. A Spooker that claims its own (fake) rotation
admits it is wolf-side, so the table discounts it ("why would a wolf-team Spooker reveal where the wolf is?"). The
fake-movement stories that worked (S2#2, N-M1HS#1) were told by a WEREWOLF claiming a Centaur mover or a centre
Spooker (census-safe). **Proposal (new card, untested):** a passing twin of a blind Centaur mover (e.g. a "Night
Pickpocket", wolf team, passes as a Pickpocket). It lets a wolf-side player truthfully describe a real swap, which
gives the wolves a movement story with a credible voice.

## R8-7. Ops: `npx convex dev` did not hot-reload an edit to shared/roles.ts
The local backend kept the old role validator until a file under convex/ was touched. Everyone adding cards should
`touch convex/commands.ts` and wait for "Convex functions ready" before a scenario check.
