# Centaur Werewolf: mechanics brainstorm

**Assumptions.** These are my own base roles, used in the decks below:
- **Herdkin**: Centaur, no action.
- **Stargazer**: Centaur. Views one other player's card, or two centre cards.
- **Ferryman**: Centaur. Swaps two cards that are not its own, without looking.
- **Dawnwatcher**: Centaur. At the end of the night, learns only whether its card is still the one it was dealt (yes or no).
- **Werewolf**: Wolf. At its turn, it sees the seats holding wolf-team cards. A lone wolf views one centre card.

If no wolf card is held, Centaurs win only if nobody is eliminated. The ballot has a Pass option for this.

## 1. Diagnosis

- **R1. The space of possible claims is closed and checkable.** Every claim is a statement about a world that follows from the deal, the public order and the role rules. A liar has to invent a whole consistent world. Machines list all possible worlds and drop the ones that don't fit.
- **R2. Information backs itself up.** Two honest views of one card agree. Exact details of a night action act as proof of holding that role. Wolves have no true information to build their lies on.
- **R3. Centaurs share one goal, so telling everything is their best move.** Staying quiet becomes evidence. Once a Centaur is identified, every other Centaur can trust them completely.
- **R4. Wolves know less than the table as a whole and can't coordinate.** With no private channel they can't agree a cover story, and they know less than the pooled claims do.
- **R5. Turning belief into an elimination is free.** One simultaneous vote with no downside means that once the evidence points at someone, a unanimous vote finishes the job.

## 2. Mechanics

### M1. Glamour (wolf card; acts first)
- **Rule:** The holder chooses a disguise: any non-wolf role in the deck. For the rest of the game, any night action that views the Glamour card gets back the disguise's role and team. The disguise travels with the card if it is moved. If Glamour is in the centre, it shows as itself.
- **Attacks:** R2 and R1.
- **Why it can't be solved:** A view showing "seat S is X" fits two worlds: S really holds X, or S holds a disguised Glamour. The wolf picks the disguise strategically. Usually it copies the role that the most dangerous Centaur will claim. The honest viewer then backs up the wolf, and the real X looks like the counter-claimer. The table can only weigh probabilities, and the wolf's choice of disguise is a mind game, not something logic can settle. Looking at cards, the Centaurs' strongest tool, now produces sincere testimony that is wrong.
- **Risks:** Disguise choices may become predictable ("always copy the Stargazer"), so tables learn to discount them. With 3 or more viewing roles it may be too weak.
- **Measure:** Win rate when Glamour is held versus in the centre (target 55 to 65 percent when held). How often the true holder of a disputed role is eliminated.

### M2. Hollow Mask (paired cards)
- **Rule:** Two identical "Mask" cards. One is secretly Hollow (wolf team), one is True (Centaur). Views show only "Mask". At the deal, each holder learns which one they have. Both act in the same slot: each views one centre card. The Hollow Mask does not wake with the wolves. A player who receives a Mask by a swap does not know which one it is.
- **Attacks:** R2 and R3. A wolf can tell nothing but the truth.
- **Why it can't be solved:** The two Masks have the same action, see the same kind of information and make the same kind of claim. When both are dealt, each holder knows the other is Hollow, and they accuse each other in exactly the same way. When only one Mask is held, the table can't tell which one it is. Neither machine-level consistency checks nor the Hollow's honesty separate the two cases.
- **Risks:** Mask duels become coin flips, which may feel arbitrary.
- **Measure:** How often duels happen, Centaur win rate inside duels (should be about 50 percent), and whether timing or style gives the Hollow away.

### M3. Moon-Eye (wolf; last turn of the night)
- **Rule:** Learns the final role of every card except its own.
- **Attacks:** R4 and R1.
- **Why it can't be solved:** Its lie is the true world with one edit. It claims a role that is really in the centre, backs up honest claims to build trust, and chooses whom to frame knowing exactly who can disprove what. Consistency checking finds nothing wrong, because only one seat is false.
- **Risks:** Too strong in small decks with few information roles.
- **Measure:** Win rate when held. If it is above 70 percent, have it learn only the player seats, or only teams.

### M4. Eavesdropper (wolf; near the end of the night)
- **Rule:** Names one role in the deck and learns exactly what happened in that role's turn: whether anyone held it, and what they saw or moved.
- **Attacks:** R2, because detail stops being proof of role, and R4.
- **Why it can't be solved:** It can make a counter-claim whose details are true and match the real holder's exactly. If the named role was not held, it learns that the role is safe to claim. The table is left with two identical stories and has to look elsewhere for anything that separates them.
- **Risks:** It is a weak turn if it guesses the wrong role.
- **Measure:** Win rate when it counter-claims. Rate of safe claims of unheld roles.

### M5. Bitten (Centaur card)
- **Rule:** When viewed, the Bitten card shows as "Herdkin". At dawn, if any night action has viewed it, it becomes wolf team. The engine tracks this and tells no one. The holder knows they hold Bitten but not whether anyone looked at it.
- **Attacks:** R2 and R3. Investigating has a cost, and a player can be unsure of their own team.
- **Why it can't be solved:** Looking at cards can create a wolf. A "Herdkin" result is the most ambiguous one possible. The Bitten holder is honestly uncertain, so even with perfect reasoning they play a mixed strategy, and the table can't read their behaviour as either loyalty or guilt.
- **Risks:** Centaurs can try to bite someone on purpose, view them, then eliminate them. This is partly self-defeating, since a real Herdkin gives the same view result and a Bitten holder will claim Herdkin. It needs a check in play-tests.
- **Measure:** Frequency of deliberate biting and its success rate.

### M6. Veiled Hour (deck modifier)
- **Rule:** Three named roles act in a block of three turns whose order is secret and random. Results are computed in that hidden order.
- **Attacks:** R1, through ordering in swap chains.
- **Why it can't be solved:** It destroys information. Six possible orders multiply the consistent worlds. Wolves choose claims that hold under many orders, while honest players can't narrow it down.
- **Risks:** It is pure noise and may hurt both sides.
- **Measure:** Number of consistent worlds at the end of the day, and the change in win rate.

### M7. Mimic (wolf) and Disown
- **Rule:** At night, the Mimic writes one message of up to 200 characters and picks a seat and a day minute (0 to 3). The engine posts the message as that seat. During the day, every player may Disown one message of their own, which puts a public flag on it.
- **Attacks:** Perfect chat memory, and R1, because claims are no longer binding commitments.
- **Why it can't be solved:** Whether the Mimic was dealt is uncertain, so every player gets one denial that can't be checked. A wolf can disown its own slip and blame a forgery. The forger can plant a claim that gets the real holder to contradict themselves.
- **Risks:** AI-written style makes forgeries easy. Disowns might become routine and meaningless.
- **Measure:** Disowns per game by team.

### M8. Crier's Choice (wolf "Rumourmonger")
- **Rule:** At dawn, the engine generates 3 true statements from templates, for example "seat 4 is not wolf team" or "seats 2 and 5 share a team". The holder picks which one is announced. If the card is in the centre, the engine picks at random. The announcement never says how it was chosen.
- **Attacks:** R5 and R2. Information stays true but is chosen by an adversary.
- **Why it can't be solved:** Updating correctly means modelling the wolf's selection policy and whether the card is held at all. That is game theory, and the wolf can randomise.
- **Risks:** Extra true information may simply help the Centaurs.
- **Measure:** Compare against a neutral crier with no chooser.

### M9. Ward (Centaur)
- **Rule:** At the deal, the engine privately assigns the Ward one random other seat. The Ward wins only if the Centaurs win and that seat is not eliminated.
- **Attacks:** R3.
- **Why it can't be solved:** A real cooperator now has a reason to shield someone who may be a wolf, and possibly to bend its own information to do it. "X defends Y" stops being evidence. Wolves claim to be the Ward to cover for defending a teammate, and the claim can't be checked.
- **Risks:** Too mild to matter.
- **Measure:** How often Ward claims are made, and the rate of wolves surviving while defended.

### M10. Mirror Mark (wolf "Mirrorwolf")
- **Rule:** At night, privately marks any seat, including its own. At the vote: if the marked seat has strictly the most votes, the player with the second-most votes is eliminated instead (everyone tied for second goes; if nobody else has votes, no one is eliminated). Ties for first place ignore the mirror, and everyone tied is eliminated.
- **Attacks:** R5. Consensus is punished.
- **Why it can't be solved:** Finding the wolf is not enough. If the Mirrorwolf marked itself, the only way to remove it is a deliberate tie between it and a sacrificed second player. Every vote becomes a decision about how to split votes, with a cost attached: guess wrong about the mark and either you remove an innocent instead, or you sacrifice one innocent alongside an innocent suspect.
- **Risks:** Ties may become routine and kill a Centaur every game. That could be fine; it is a price.
- **Measure:** Frequency of deliberate ties, and Centaur win rate when the Mirrorwolf is held.

### M11. Undertow (wolf)
- **Rule:** After ballots are revealed and before elimination, the holder at the end of the night may silently swap the card of one player about to be eliminated with the card of a seat next to that player. Its own card cannot be involved.
- **Attacks:** R5 and R1. The final state is decided after all the evidence is in.
- **Why it can't be solved:** It can rescue any doomed wolf. The only safe targets are the Undertow holder itself, or a player whose neighbours are both wolves. Deducers have to find the specific card, not just any wolf.
- **Risks:** With 3 or more wolf cards in a deck it is almost unbeatable.
- **Measure:** Win rate when held (cap about 60 percent).

## 3. Third faction: the Mirewood

All Mirewood cards are printed with a moss border. A view shows the role and "Mirewood".

**Main-team wins, revised:**
- **Centaurs** win if at least one wolf is eliminated and the Mossback is not.
- **Werewolves** win if no wolf and no Ashmoth is eliminated. The Ashmoth's ashes expose the den.

**Roles:**
- **Ashmoth (life cycle).** Wins if it is eliminated. Its death is a loss for both main teams unless a wolf also dies, so it is the outcome neither main team wants.
- **Sporecap (parasite).** Night: views one player's card, then places a Spore on any one other card. The Spore travels with the card. Wins if a card carrying the Spore is eliminated. It can spore a wolf and become an honest Centaur ally, or spore an innocent and argue like a wolf.
- **Lichen (symbiont).** Night: bonds to a seat and sees that seat's card. Wins if the team of the card held at that seat at the end wins. It is a free agent that tells some truth on behalf of whatever side its host is on, including a wolf host.
- **Carrion Crow (scavenger).** Night: views up to two centre cards. Wins if any Mirewood card other than itself is eliminated and it survives. That includes the Mossback, so the Crow is the only creature that profits if the keystone falls.
- **Mossback (keystone; Centaur team, printed as Mirewood).** Night: learns which seats hold Mirewood cards, as of its turn. Its elimination is an automatic Centaur loss, and every creature except the Crow loses too.

**How they interlock.** The Ashmoth, Crow and sometimes the Sporecap all want a creature to die. The Mossback gives the Centaurs a map of the creatures, but revealing itself makes it a target for the Crow and for wolves who want to frame it. The key consequence: because both main teams fear the Ashmoth, wolves gain from acting like an Ashmoth. Odd behaviour becomes a shield instead of a giveaway.

**Worked example (Deck 3).**

Setup: P1 Stargazer, P2 Werewolf, P3 Ashmoth, P4 Sporecap, P5 Mossback. Centre: Moon-Eye, Lichen, Ferryman, Herdkin.

Night:
1. The lone Werewolf views the centre and sees Lichen.
2. The Sporecap views P2 (Werewolf) and spores P2.
3. The Mossback learns seats {3, 4, 5} are Mirewood.
4. The Stargazer views P3 and sees Ashmoth.

Day:
- P3 behaves like a textbook wolf: inconsistent and pushy. Without the Mirewood, P3 is eliminated and the wolves win.
- The Stargazer outs P3 as the Ashmoth. P4 says it spored P2, a Werewolf.
- P2's best reply is not to deny being a wolf. It claims to be the Ashmoth: "the Stargazer is a lying Moon-Eye."
- The Centaurs are now weighing a self-interested parasite (the Sporecap would make the same accusation if it had spored an innocent) against a possible Ashmoth whose elimination loses the game.
- The Mossback's map breaks the tie: P2 is not Mirewood, so P2 cannot be the Ashmoth. But the Mossback has to reveal itself to say so. With a Crow possibly in play, that is a real risk in other games.

The right Centaur play changes in two ways: protect the most suspicious player, and decide how far to trust a parasite whose honesty depends on where it put its Spore.

## 4. Decks

**D1 "Twin Faces" (5 players, 3 centre).** Werewolf, Hollow Mask, True Mask, Stargazer, Ferryman, Dawnwatcher, Ward, Herdkin.
When the Werewolf alone is held, the table catches it by cross-checking the Stargazer and Ferryman (about 30 percent wolf wins). When a Mask is held, the table can't tell Hollow from True, and the Ferryman moving a Mask leaves even the holders unsure. Duels are close to 50/50, and a Ward assigned to a Mask makes them worse. I predict about 45 percent wolf wins overall. Tables will over-vote the Masks and sometimes eliminate a True Mask held alone.

**D2 "Observer's Curse" (5 players, 3 centre).** Glamour, Mirrorwolf, Bitten, Stargazer ×2, Ferryman, Herdkin ×2.
Two Stargazers want to cross-check each other. But "Herdkin" now has four possible sources: two real Herdkin, the Bitten card, and a Glamour disguise. Every look risks creating a wolf. Even after the table finds a wolf, the Mirrorwolf forces a decision on a deliberate tie, which costs an innocent or misfires. I predict about 50 percent wolf wins, mostly through bad vote splits rather than bad deduction.

**D3 "Mirewood Lite" (5 players, 4 centre).** Werewolf, Moon-Eye, Ashmoth, Sporecap, Lichen, Mossback, Stargazer, Ferryman, Herdkin.
With 4 cards in the centre, which roles are held is very uncertain. The Moon-Eye's claim is perfectly consistent, and fear of the Ashmoth stops the table piling onto the strangest player. Centaurs will lean heavily on the Mossback, so the Moon-Eye will frame it as a liar. I predict about 45 percent wolf wins, plus about 10 percent of games won by the Ashmoth or Sporecap.

**D4 "Food Web" (7 players, 3 centre).** Werewolf, Eavesdropper, Undertow, Ashmoth, Carrion Crow, Mossback, Ward, Bitten, Stargazer, Ferryman. Veiled Hour covers the Stargazer, Ferryman and Mossback turns.
The veil blurs the Mossback's map and the Stargazer's view. The Eavesdropper copies whichever information role matters. The Crow quietly pushes for the Mossback to be eliminated. Even a correct consensus has to get past the Undertow, so the table ends up voting for a pair of neighbours, or for the Undertow claimant itself. I predict 45 to 50 percent wolf wins. Seven skilled deducers have lots of information, but almost all of it is either compromised or self-interested.

## 5. Ranking

**Top five:**
1. **Glamour.** It turns investigation into sincere false corroboration, so the Centaurs' best tool becomes the wolves' cover.
2. **Mirror Mark.** It makes the vote itself a strategic problem with a real price, beyond working out who the wolf is.
3. **Mirewood**, built around the Ashmoth's double loss and the Sporecap's conditional honesty. Suspicious behaviour becomes protective.
4. **Bitten.** A player is unsure of their own team, and looking at cards has a cost.
5. **Moon-Eye.** A liar whose story is the true world with one seat changed.

**Least sure:**
- **Mimic.** One forgery plus a universal Disown may collapse into everyone disowning, or forgeries may be trivially spotted. Its effect on how much chat can be trusted is hard to predict.
- **Crier's Choice.** Its information is true, and excellent Bayesian players may get more from it than it costs them. The wolf's power to choose may not outweigh the extra truth handed to the table.
