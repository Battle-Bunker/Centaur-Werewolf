# Centaur Werewolf: rules reference

This file is generated (`npx tsx sim/make-rules-reference.ts`) from the engine's own data; a test fails if it is stale.
It states the game exactly as built. Design history: docs/design/synthesis.md and docs/design/owner-directions.md.

## 1. Setup

- 3 to 12 players. The deck holds one card per player plus 3 to 6 centre cards (a room setting, default 3). Any card may
  appear up to 12 times. Each player is dealt one card face down; the rest lie face down in the centre.
- Seating is a random circle (seat 0 to n-1, clockwise). Every game records its shuffle seed (shown after the game).
- A **play-test table** (chosen at creation, shown to everyone) lets the host fix the seed, the seating or the exact
  deal, and see the deal. Ordinary tables cannot.

## 2. Phases and timers

| Phase | What happens | Ends |
| --- | --- | --- |
| Night: Dusk | Everyone reads their card and may queue their night decisions. | Dusk timer (5-120 s, default 20) |
| Night: turns | One turn per night role in the deck, in wake order, each exactly the turn length (5-120 s, default 12), **whether or not anyone holds that card**. A shadow twin acts in its original's turn. Everyone sees which turn it is. Each player acts in the turn of the card they were DEALT, even if it has been moved. Undecided steps at the end of a player's turn get a uniformly random legal decision. | Last turn |
| Dawn | Proclamations are published (in random order under the dawn rule); a public mark nobody made (an unheld Cuckoo's egg) is laid on a random seat; bitten players and Imagos are told privately. | Immediately |
| Discussion | Chat. Players mark themselves ready. A Moon-Thief may queue its swap; a Hush may cut. No voting. | Its timer (30-1800 s, default 300), the host, or every seated human ready |
| Vote | Each seated player votes for one other player and may change it. Votes are secret until the end; only "has voted" is public. Chat closed unless the rule opens it. | Its timer (5-120 s, default 20) or every seated human has voted |
| Count | Missing votes are cast uniformly at random (marked "did not vote in time"). The Moon-Thief's swap happens. Then the resolution order below. | |

## 3. Table rule settings

| Rule | Title | Default | Values | Meaning (at the default) |
| --- | --- | --- | --- | --- |
| `bloodPrice` | Blood Price | true | on / off | The Centaurs win only if more Werewolves than Centaurs are eliminated: a tie that takes down a Centaur along with a Werewolf is a loss for the Centaurs. |
| `census` | Den Census | "all" | all / three / off | Every card of the pack (Werewolves and the cards that wake with them) learns which roles were dealt to the centre: the roles, not their positions. |
| `dawnProclamations` | Proclamations at dawn | true | on / off | Every proclamation (the Herald's, and a Forger's) is published together at dawn, in random order, each marked "Herald's turn" and true at that moment of the night. |
| `randomVotesCurse` | Random votes curse | false | on / off | A vote the game cast at random never triggers the Sporeling's curse. |
| `biteNamesBiter` | The bitten know the Biter | true | on / off | A bitten player is told which seat bit them. |
| `eavesdropGhost` | Eavesdropper's own result | true | on / off | If nobody was dealt the role the Eavesdropper names, it secretly gets a real result of its own as if it held that role (looks only, never moves), and is not told which case happened. |
| `thiefMinPlayers` | Moon-Thief table size | 7 | 3 to 12 | The Moon-Thief may be in the deck only with 7 or more players. |
| `eliminationVotes` | Votes to eliminate | 2 | 2 to 4 | The player or players with the most votes are eliminated, if that is at least 2 votes; otherwise nobody is. |
| `mandatorySteps` | Mandatory night steps | false | on / off | Optional night steps (trade or keep, give or not, bite or not, scent or not) may be declined. |
| `chatDuringVote` | Chat during the vote | false | on / off | Chat closes when the vote phase begins. |
| `cutSeconds` | Hush cut length | 60 | 15 to 180 | A Hush's cut lasts 60 seconds. |
| `cutDuringVote` | Hush during the vote | true | on / off | A Hush may cut during discussion or the vote phase, and a cut may run on into the vote. |

## 4. Information, looks and movement

- **A look shows a card as it is at that moment**, as seen by that viewer. Later moves may change what is there.
- **Cards move**: swaps, rotations and the Moon-Thief's day swap move cards between seats and the centre. A moved card
  carries its team, its win rule and anything bound to it (an egg, a bond, a distortion token). Nobody is told their
  card moved (the Sentry may detect *that* a nearby card moved; nothing detects direction or destination).
- **You act by the card you were DEALT; you win by the card you HOLD at the count** (unless bitten or an Imago).
- **Card instances**: every physical card is distinct even when several copies of a role exist; marks bind to the
  physical card.
- **What a look shows**, in order: a passing twin shows its original; then the latest card distortion (Glamour: a chosen
  role; Will-o'-Wisp: one random wrong role); then, for a look at a centre card, the viewer's veil (Mistweaver: a chosen
  role; Fogbank: a random wrong role at each look). **Werewolf-team looks and the Herder's count always see the truth.**
  Team-only looks show the team of the role seen. Proclamations publish what their maker saw. Conditional plans branch
  on what the actor saw. Distortions last until dawn.
- **Proclamations** (Herald, Pale Herald) are anonymous; a Forger adds forged ones indistinguishable from them.
- **Seals**: a sealed chat message reads "The game confirms this was sent by the player DEALT <role>". A Counterfeiter's
  forgery is identical until the game ends. The seal proves the claimed DEALT role of the sender, nothing about the card
  held now.
- **Presence**: a player shows offline after 16 s without a heartbeat. A Hush's cut makes its victim's connection fail for
  the cut length; others see exactly what a real drop looks like. Nothing a cut player sends goes through; a vote they
  could not cast becomes random. Only the results reveal cuts.

## 5. How a game is decided (in this order)

1. **Swap.** The Moon-Thief's queued swap is applied.
2. **Tally.** Each vote weighs by the voter's HELD card (Chiron: 2). Every seat tied on the most votes is eliminated, if
   that is at least the "Votes to eliminate" rule (default 2). Otherwise nobody is.
3. **Teams.** A bitten seat is on the Werewolf team and loses creature rules; an Imago is a creature; everyone else is on
   the team of the card they hold.
4. **Main result.**
   - (a) If an eliminated player holds a decoy (Stalking Horse), its team (Werewolf) wins.
   - (b) Else, if no player holds a Werewolf card: Centaurs win if nobody is eliminated; otherwise the surviving
     Werewolf-team players win; if there are none, no team wins.
   - (c) Else, with Blood Price: Centaurs win only if W > C (W = Werewolf cards eliminated, C = Centaur-team players
     eliminated). Without it: Centaurs win if W ≥ 1. Otherwise the Werewolf team wins.
   - Every member of the winning team wins, alive or dead. Allies, creatures, Imagos and bitten players count in
     neither W nor C. Eliminating a Werewolf-team card that is not a Werewolf never wins for the Centaurs.
5. **Creatures** (alongside the main result): Sporeling holder and Imagos win if eliminated; the Cuckoo holder wins if
   its card's egged seat is eliminated and they are not; the Elderbark holder wins if alive and no other creature is
   eliminated. An eliminated Elderbark denies every other creature.
6. **Curse.** Every player whose own (non-random, unless the rule says so) vote went to an eliminated Sporeling holder
   loses.
7. **Oxpecker.** Its holder wins if its card's bonded seat is a winner after step 6 and no Elderbark was eliminated; the
   curse then applies to it.

**Count as Werewolves:** Werewolf, Glamour, Moon-Thief, Tracker, Eavesdropper, Biter, Dun Centaur, Dusk Rustler.
**Werewolf team but not Werewolves:** Stalking Horse, Whisperer, Forger, Spooker, Will-o'-Wisp, Mistweaver, Fogbank, Poacher, Counterfeiter, Hush, Moonsage, Pale Herald, Stray Herder.

## 6. Night order (the full roster)

1. Elderbark (wake 8)
2. Werewolf (wake 10)
3. Stalking Horse (wake 11)
4. Glamour (wake 12)
5. Moon-Thief (wake 13)
6. Will-o'-Wisp (wake 14)
7. Tracker (wake 15)
8. Mistweaver (wake 16)
9. Fogbank (wake 17)
10. Whisperer (wake 20)
11. Cuckoo (wake 25)
12. Sage (wake 30) + Moonsage
13. Notary (wake 32)
14. Centaur (wake 35) + Dun Centaur
15. Herald (wake 40) + Pale Herald
16. Forger (wake 42)
17. Poacher (wake 44)
18. Rustler (wake 45) + Dusk Rustler
19. Cutpurse (wake 46)
20. Pickpocket (wake 47)
21. Drifter (wake 48)
22. Farrier (wake 50)
23. Spooker (wake 55)
24. Herder (wake 80) + Stray Herder
25. Oxpecker (wake 85)
26. Latecomer (wake 88)
27. Sentry (wake 90)
28. Eavesdropper (wake 93)
29. Biter (wake 96)

Roles with no night action: Counterfeiter, Hush, Chiron, Signet, Moth, Sporeling.

## 7. Every card

## Werewolf team

### Werewolf (`werewolf`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. **Pack:** wakes knowing the other pack seats and gets the census. Tags: wolf, pack. Copies allowed: up to 12.
- **Night:** has its own turn, wake 10 (position 2 of the full roster's night order).
  - *Meet the pack* (automatic): learns which other seats were DEALT a card tagged "pack" (journal label "The pack"); then learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule.
  - *Alone: scent a player* (OPTIONAL (may be declined, unless the Mandatory-night-steps rule is on)): only if no other player was dealt a "pack" card; chooses another player's card; sees only the team of the chosen card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where). If no other pack card was dealt, you may also scent one player and learn which team their card is on. Your team wins by the table's win rule: no Werewolf eliminated, or (with Blood Price) no more Werewolves than Centaurs eliminated.

### Stalking Horse (`stalkinghorse`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. **Pack:** wakes knowing the other pack seats and gets the census. Tags: pack. Copies allowed: up to 12.
- **Night:** has its own turn, wake 11 (position 3 of the full roster's night order).
  - *Meet the pack* (automatic): learns which other seats were DEALT a card tagged "pack" (journal label "The pack"); then learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule.
  - *Alone: scent a player* (OPTIONAL (may be declined, unless the Mandatory-night-steps rule is on)): only if no other player was dealt a "pack" card; chooses another player's card; sees only the team of the chosen card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team; if its holder is eliminated, the Werewolf team wins the main result outright.
- **Card text:** You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where). If no other pack card was dealt, you may scent one player's team. You are NOT a Werewolf. If whoever holds this card is eliminated, the Werewolf team wins, even if a Werewolf falls too.

### Glamour (`glamour`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. **Pack:** wakes knowing the other pack seats and gets the census. Tags: wolf, pack. Copies allowed: up to 12.
- **Night:** has its own turn, wake 12 (position 4 of the full roster's night order).
  - *Meet the pack* (automatic): learns which other seats were DEALT a card tagged "pack" (journal label "The pack"); then learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule.
  - *Cast a glamour* (MANDATORY): chooses your own card or another player's card or a centre card; names any role in the deck; distorts the chosen card: until dawn every look at it (except Werewolf-team looks) shows the role they name; it travels with the card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are a Werewolf. You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where). Then choose any one card (a player's, your own, or a centre card) and any role in the deck: until dawn, every look at that card shows the role you chose and its team, wherever the card moves. This fools reads, centre glances, proclamations and creatures' looks; the Werewolf team's own looks and the Herder's count see the truth.

### Moon-Thief (`moonthief`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. **Pack:** wakes knowing the other pack seats and gets the census. Tags: wolf, pack. Copies allowed: up to 12.
- **Night:** has its own turn, wake 13 (position 5 of the full roster's night order).
  - *Meet the pack* (automatic): learns which other seats were DEALT a card tagged "pack" (journal label "The pack"); then learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** the player DEALT it may queue a swap of two other players' cards during discussion or the vote; it happens as the vote ends, before counting (day_queueSwap).
- **Win:** with the Werewolf team.
- **Card text:** You are a Werewolf. You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where). During the day, if you were DEALT this card, you may secretly queue one swap of two other players' cards, and change or clear it until the votes lock. The swap happens the instant voting ends, before anything is counted: votes are weighed and every win is decided by the cards after the swap.

### Tracker (`tracker`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. **Pack:** wakes knowing the other pack seats and gets the census. Tags: wolf, pack. Copies allowed: up to 12.
- **Night:** has its own turn, wake 15 (position 7 of the full roster's night order).
  - *Meet the pack* (automatic): learns which other seats were DEALT a card tagged "pack" (journal label "The pack"); then learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule.
  - *Pick up a trail* (automatic): learns which other seats were DEALT a card tagged "seer" (only 1, chosen at random) (journal label "An information role").
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are a Werewolf. You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where). You are also told the seat of one player dealt an information role (Sage, Herald or Herder), chosen at random.

### Whisperer (`whisperer`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 20 (position 10 of the full roster's night order).
  - *Hear a name* (automatic): learns which other seats were DEALT a card tagged "wolf" (only 1, chosen at random) (journal label "A Werewolf").
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. You are told one player dealt a Werewolf card, chosen at random; they do not know you. You win when the Werewolf team wins, even if you are eliminated.

### Forger (`forger`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 42 (position 16 of the full roster's night order).
  - *See the Herald's proclamation* (automatic): sees what the Herald proclaimed so far tonight (or that nothing was).
  - *Forge a proclamation* (MANDATORY): chooses a centre card (2 centre cards when the centre holds 5 or more); names any role in the deck; adds a forged proclamation of the named role at the chosen centre card(s), published at dawn exactly as the Herald's, in random order with the real ones.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. You see what the Herald proclaimed tonight, or that nothing was. Then you name centre cards (as many as the Herald proclaims at this table) and a role in the deck for each: at dawn your forgery is published exactly like a Herald's proclamation, and nobody can tell which is which. A deck with a Forger must have a Herald. You win when the Werewolf team wins.

### Spooker (`spooker`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 55 (position 23 of the full roster's night order).
  - *Stampede three cards* (MANDATORY): chooses 3 different cards (each another player's card or a centre card); moves the chosen cards one place along (first to second's place, second to third's, third to first's), seeing none of them.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. Choose three cards other than your own, from players or the centre. The first goes to the second's place, the second to the third's, the third to the first's. You look at none of them. You win when the Werewolf team wins.

### Eavesdropper (`eavesdropper`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. **Pack:** wakes knowing the other pack seats and gets the census. Tags: wolf, pack. Copies allowed: up to 12.
- **Night:** has its own turn, wake 93 (position 28 of the full roster's night order).
  - *Meet the pack* (automatic): learns which other seats were DEALT a card tagged "pack" (journal label "The pack"); then learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule.
  - *Name a role to overhear* (MANDATORY): names a role in the deck that acts at night and is not of the pack (not itself); names a role; receives a copy of everything the first player clockwise who was DEALT it learned tonight (or, if nobody was, a ghost result per the table rule).
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are a Werewolf. You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where). Then name one role in the deck that acts at night and does not wake with the pack. If a player was dealt it (with two copies, the first clockwise from you), you get a copy of everything that player learned tonight, trades included. If nobody was dealt it, then under the table's rule the game secretly runs that role's looks from your seat on random targets and gives you those true results (it moves no card); you are not told which case happened.

### Biter (`biter`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. **Pack:** wakes knowing the other pack seats and gets the census. Tags: wolf, pack. Copies allowed: up to 12.
- **Night:** has its own turn, wake 96 (position 29 of the full roster's night order).
  - *Meet the pack* (automatic): learns which other seats were DEALT a card tagged "pack" (journal label "The pack"); then learns the roles DEALT to the centre (not where, not what is there now), per the Den Census rule.
  - *Look at a player's true card* (MANDATORY): chooses another player's card; sees the role of the chosen card.
  - *Bite them?* (OPTIONAL (may be declined, unless the Mandatory-night-steps rule is on)): bites the player at the looked-at seat: unless their card is on the Werewolf team, they join the Werewolf team at dawn (told privately).
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are a Werewolf and wake last. You wake knowing which other players were dealt cards of the pack (the Werewolves and the cards that wake with them) and, under the Den Census rule, which roles lie in the centre (not where). Look at one other player's card (glamour does not fool you), then decide whether to bite them; you can queue that decision on the card you will see. If their card is not on the Werewolf team, at dawn they are told they were bitten (and, under the table's rule, by your seat): from then on they win only with the Werewolf team, though they are not a Werewolf. A bitten creature loses its creature rules.

### Will-o'-Wisp (`wisp`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 14 (position 6 of the full roster's night order).
  - *Lead a look astray* (MANDATORY): chooses your own card or another player's card or a centre card; distorts the chosen card: until dawn every look at it (except Werewolf-team looks) shows one random other role from the deck, drawn once; it travels with the card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. Choose any one card (a player's, your own, or a centre card): until dawn every look at it shows a random other role from the deck (the same one for everyone), wherever the card moves. Its holder is never told. The Werewolf team's looks and the Herder's count see the truth. You win when the Werewolf team wins.

### Mistweaver (`mistweaver`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 16 (position 8 of the full roster's night order).
  - *Veil a player's eyes* (MANDATORY): chooses another player's card; names any role in the deck; veils the chosen player: tonight every centre card they look at shows the role named.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. Choose another player and a role in the deck: tonight, every centre card that player looks at (a glance, a peek, a proclamation) shows that role. They are never told. It does not touch looks at players' cards, the Werewolf team's looks or the Herder's count. You win when the Werewolf team wins.

### Fogbank (`fogbank`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 17 (position 9 of the full roster's night order).
  - *Fog a player's eyes* (MANDATORY): chooses another player's card; veils the chosen player: tonight every centre card they look at shows a random wrong role, drawn at each look.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. Choose another player: tonight, every centre card that player looks at shows a random other role from the deck. They are never told. It does not touch looks at players' cards, the Werewolf team's looks or the Herder's count. You win when the Werewolf team wins.

### Poacher (`poacher`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 44 (position 17 of the full roster's night order).
  - *Swap with a player* (MANDATORY): chooses another player's card; swaps their own card with it; then sees the role of their own (new) card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you start on their side. You must swap your card with another player's card, then you look at your new card. Your Poacher card, and its team, go to them: you are now on the team of the card you took. They are not told.

### Counterfeiter (`counterfeiter`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** no night action.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** once, the player DEALT it posts a forged Signet or Notary seal, identical to a real one until the end (chat_forgeSeal).
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. You do nothing at night. Once during the day you may post one sealed message carrying the seal of a role in the deck that can seal (Signet: free text; Notary: "at night, <player>'s card was <role>" with the player and role of your choosing). Until the game ends it is identical, in every view, to a real one. You win when the Werewolf team wins.

### Hush (`hush`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** no night action.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** once, the player DEALT it may cut another player off for the cut length, exactly as a dropped connection (day_cutLine).
- **Win:** with the Werewolf team.
- **Card text:** You are not a Werewolf, but you side with them. You do nothing at night. Once during the day you may silently cut one other player off: for the table's set time (a minute by default) nothing they send goes through and nothing new reaches them, and everyone sees them go offline and come back exactly as if their connection had dropped. Only the results reveal it. You win when the Werewolf team wins.

### Moonsage (`moonsage`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** acts in the Sage's turn (a shadow twin: one public turn for both), wake 30 (position 12 of the full roster's night order).
  - *Read a player's card* (MANDATORY): chooses another player's card; sees the role of the chosen card.
- **A look at this card shows:** a Sage (it passes for its original), except to Werewolf-team looks.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You act in the Sage's turn and do exactly what the Sage does: Look at one other player's card. You see it as it is at that moment (a glamour, if one is on it). But you are on the Werewolf team, and you are not a Werewolf. Any look at your card shows a Sage. You win when the Werewolf team wins.

### Dun Centaur (`duncentaur`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. Tags: wolf. Copies allowed: up to 12.
- **Night:** acts in the Centaur's turn (a shadow twin: one public turn for both), wake 35 (position 14 of the full roster's night order).
  - *Look at a centre card* (MANDATORY): chooses a centre card; sees the role of the chosen card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You act in the Centaur's turn and do exactly what the Centaur does: Look at one centre card. Your team wins by the table's win rule: a Werewolf eliminated (with Blood Price: more Werewolves than Centaurs eliminated). But you are on the Werewolf team and you count as a Werewolf (you do not wake with the pack, and the pack does not know you). A look at your card shows the Dun Centaur. You win when the Werewolf team wins.

### Pale Herald (`paleherald`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** acts in the Herald's turn (a shadow twin: one public turn for both), wake 40 (position 15 of the full roster's night order).
  - *Proclaim a centre card* (MANDATORY): chooses a centre card (2 centre cards when the centre holds 5 or more); publishes to everyone what the chosen card(s) show right now (at dawn under the Proclamations-at-dawn rule), without saying who proclaimed.
- **A look at this card shows:** a Herald (it passes for its original), except to Werewolf-team looks.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You act in the Herald's turn and do exactly what the Herald does: Choose a centre card. Everyone, you included, is shown what it is at that moment, but not who showed it: at dawn, under the table's rule, together with any other proclamation. With five or six centre cards you choose two. The cards stay face down and may still be moved later. But you are on the Werewolf team, and you are not a Werewolf. Any look at your card shows a Herald. You win when the Werewolf team wins.

### Dusk Rustler (`duskrustler`)

- **Team:** Werewolf team. **Counts as a Werewolf:** yes. Tags: wolf. Copies allowed: up to 12.
- **Night:** acts in the Rustler's turn (a shadow twin: one public turn for both), wake 45 (position 18 of the full roster's night order).
  - *Peek at a player's card* (MANDATORY): chooses another player's card; sees the role of the chosen card.
  - *Trade cards with them?* (OPTIONAL (may be declined, unless the Mandatory-night-steps rule is on)): swaps their own card with it.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You act in the Rustler's turn and do exactly what the Rustler does: Look at one other player's card. Then decide whether to swap your card with it. If you swap, you are now on that card's team. But you are on the Werewolf team and you count as a Werewolf (you do not wake with the pack, and the pack does not know you). A look at your card shows the Dusk Rustler. You win when the Werewolf team wins.

### Stray Herder (`strayherder`)

- **Team:** Werewolf team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** acts in the Herder's turn (a shadow twin: one public turn for both), wake 80 (position 24 of the full roster's night order).
  - *Count the strays* (automatic): learns how many cards tagged "wolf" lie in the centre right now (the truth: never distorted).
- **A look at this card shows:** a Herder (it passes for its original), except to Werewolf-team looks.
- **Day / vote / chat powers:** none.
- **Win:** with the Werewolf team.
- **Card text:** You act in the Herder's turn and do exactly what the Herder does: Late in the night, you learn how many Werewolf cards are in the centre at that moment: a number, not which ones. Glamour does not fool the count. But you are on the Werewolf team, and you are not a Werewolf. Any look at your card shows a Herder. You win when the Werewolf team wins.

## Centaur team

### Sage (`sage`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: seer. Copies allowed: up to 12.
- **Night:** has its own turn, wake 30 (position 12 of the full roster's night order).
  - *Read a player's card* (MANDATORY): chooses another player's card; sees the role of the chosen card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** Look at one other player's card. You see it as it is at that moment (a glamour, if one is on it).

### Centaur (`centaur`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 35 (position 14 of the full roster's night order).
  - *Look at a centre card* (MANDATORY): chooses a centre card; sees the role of the chosen card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** Look at one centre card. Your team wins by the table's win rule: a Werewolf eliminated (with Blood Price: more Werewolves than Centaurs eliminated).

### Herald (`herald`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: seer. Copies allowed: up to 12.
- **Night:** has its own turn, wake 40 (position 15 of the full roster's night order).
  - *Proclaim a centre card* (MANDATORY): chooses a centre card (2 centre cards when the centre holds 5 or more); publishes to everyone what the chosen card(s) show right now (at dawn under the Proclamations-at-dawn rule), without saying who proclaimed.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** Choose a centre card. Everyone, you included, is shown what it is at that moment, but not who showed it: at dawn, under the table's rule, together with any other proclamation. With five or six centre cards you choose two. The cards stay face down and may still be moved later.

### Notary (`notary`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: seer. Copies allowed: up to 12.
- **Night:** has its own turn, wake 32 (position 13 of the full roster's night order).
  - *Read a player's card* (MANDATORY): chooses another player's card; sees the role of the chosen card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** once, the player DEALT it posts a sealed report the game composes from its night look (chat_sendReport).
- **Win:** with the Centaur team.
- **Card text:** Look at one other player's card. Once during the day you may post a sealed report the game composes from what you saw: "at night, <player>'s card was <role>". The game marks it as sent by the player dealt Notary (a Counterfeiter can forge such a seal).

### Rustler (`rustler`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 45 (position 18 of the full roster's night order).
  - *Peek at a player's card* (MANDATORY): chooses another player's card; sees the role of the chosen card.
  - *Trade cards with them?* (OPTIONAL (may be declined, unless the Mandatory-night-steps rule is on)): swaps their own card with it.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** Look at one other player's card. Then decide whether to swap your card with it. If you swap, you are now on that card's team.

### Farrier (`farrier`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 50 (position 22 of the full roster's night order).
  - *Peek at a centre card* (MANDATORY): chooses a centre card; sees the role of the chosen card.
  - *Give that card to…* (OPTIONAL (may be declined, unless the Mandatory-night-steps rule is on)): chooses your own card or the card of the player clockwise of you; swaps the two cards.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** Look at one centre card. Then you may swap it with your own card or with the card of the player clockwise of you.

### Cutpurse (`cutpurse`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 46 (position 19 of the full roster's night order).
  - *Swap with a player* (MANDATORY): chooses another player's card; swaps their own card with it; then sees the role of their own (new) card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** You must swap your card with another player's card, then you look at your new card: you know what you became, they do not. You are now on the team of the card you took.

### Pickpocket (`pickpocket`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 47 (position 20 of the full roster's night order).
  - *Swap blind with a player* (MANDATORY): chooses another player's card; swaps their own card with it.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** You must swap your card with another player's card. You do not look at what you took. You are now on the team of that card, whatever it is.

### Drifter (`drifter`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 48 (position 21 of the full roster's night order).
  - *Swap with a centre card* (MANDATORY): chooses a centre card; swaps their own card with it; then sees the role of their own (new) card.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** You must swap your card with a centre card, then you look at your new card. You are now on its team.

### Herder (`herder`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: seer. Copies allowed: up to 12.
- **Night:** has its own turn, wake 80 (position 24 of the full roster's night order).
  - *Count the strays* (automatic): learns how many cards tagged "wolf" lie in the centre right now (the truth: never distorted).
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** Late in the night, you learn how many Werewolf cards are in the centre at that moment: a number, not which ones. Glamour does not fool the count.

### Latecomer (`latecomer`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 88 (position 26 of the full roster's night order).
  - *Swap blind with a player* (MANDATORY): chooses another player's card; swaps their own card with it.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** Late in the night, after almost every other move, you must swap your card with another player's card. You do not look at it. You are now on the team of that card.

### Sentry (`sentry`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** has its own turn, wake 90 (position 27 of the full roster's night order).
  - *Check the watch* (automatic): learns, for their own seat and each neighbour, whether that card has been moved so far tonight (not by whom, not to where, not what it is).
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team.
- **Card text:** You wake near the end of the night. You learn whether your card, and the card of the player on each side of you, was moved during the night so far.

### Chiron (`chiron`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** no night action.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** the holder's vote counts 2 times.
- **Win:** with the Centaur team.
- **Card text:** You do nothing at night. Whoever holds this card when the votes are counted has a vote that counts twice.

### Signet (`signet`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: none. Copies allowed: up to 12.
- **Night:** no night action.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** once, the player DEALT it posts a free-text message sealed "sent by the player DEALT Signet" (chat_sendSigned).
- **Win:** with the Centaur team.
- **Card text:** You do nothing at night. Once during the day you may post a message that the game itself marks as sent by the player who was dealt Signet. It proves the card you were dealt, not the card you hold now.

### Moth (`moth`)

- **Team:** Centaur team. **Counts as a Werewolf:** no. Tags: wild. Copies allowed: up to 12.
- **Night:** no night action.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** with the Centaur team; if the card DEALT to this seat is moved at night, that seat becomes an Imago at dawn (a creature that wins only if eliminated).
- **Card text:** You do nothing at night and start as a Centaur (a Larva). If the card dealt to you is moved during the night, at dawn you are told you have become an Imago: a creature that wins only by being eliminated, whatever card you hold. Otherwise whoever holds this card is on the Centaur team. A swap during the day does not change it.

## Wildwood

### Elderbark (`elderbark`)

- **Team:** Wildwood. **Counts as a Werewolf:** no. Tags: wild. Copies allowed: up to 12.
- **Night:** has its own turn, wake 8 (position 1 of the full roster's night order).
  - *Read the wood* (automatic): learns which other seats were DEALT a card tagged "wild" (journal label "Creatures").
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** its holder wins if not eliminated and no other creature or Imago is eliminated; if eliminated, no other creature wins (a creature rule: lost if bitten).
- **Card text:** You learn which other seats were dealt creature cards (the Moth included). Whoever holds this card wins if they are not eliminated and no other creature or Imago is. If they are eliminated, no other creature wins.

### Cuckoo (`cuckoo`)

- **Team:** Wildwood. **Counts as a Werewolf:** no. Tags: wild. Copies allowed: up to 12.
- **Night:** has its own turn, wake 25 (position 11 of the full roster's night order).
  - *Look at a player's card* (MANDATORY): chooses another player's card; sees the role of the chosen card.
  - *Lay your egg on a player* (MANDATORY): chooses another player's card; lays the egg on the chosen player (bound to THIS card; shown to everyone at dawn, not who laid it).
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** its holder wins if the seat marked by THIS card is eliminated and the holder is not (a creature rule: lost if bitten).
- **Card text:** Look at one other player's card, then lay your egg on any other player. At dawn everyone sees which seat holds the egg, but not who laid it. The egg stays with this CARD: whoever holds it when the votes are counted wins if the egged player is eliminated and they are not. If nobody holds the Cuckoo at night, the game lays the egg on a random seat and it benefits nobody.

### Oxpecker (`oxpecker`)

- **Team:** Wildwood. **Counts as a Werewolf:** no. Tags: wild. Copies allowed: up to 12.
- **Night:** has its own turn, wake 85 (position 25 of the full roster's night order).
  - *Bond to a player* (MANDATORY): chooses another player's card; sees the role of the chosen card; then binds this card to the chosen player's seat (your bond, private).
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** its holder wins exactly when the seat bonded to THIS card wins (after the curse) (a creature rule: lost if bitten).
- **Card text:** Late in the night, look at one other player's card and bond to that seat. The bond stays with this CARD: whoever holds it wins exactly when the player in the bonded seat wins, whatever side that turns out to be (unless the Elderbark is eliminated).

### Sporeling (`sporeling`)

- **Team:** Wildwood. **Counts as a Werewolf:** no. Tags: wild. Copies allowed: up to 12.
- **Night:** no night action.
- **A look at this card shows:** this card, unless distorted.
- **Day / vote / chat powers:** none.
- **Win:** its holder wins if eliminated (alongside whatever team result) (a creature rule: lost if bitten); every player whose own vote went to an eliminated holder loses (the curse).
- **Card text:** You do nothing at night. Whoever holds this card wins if they are eliminated, and then every player whose own vote went to them loses, whichever side they were on. A vote the game cast at random does not count for this, unless the table's rule says so.
