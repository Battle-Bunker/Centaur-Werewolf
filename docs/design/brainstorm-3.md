# Centaur Werewolf: design brainstorm (worked from my own reasoning only; no files read)

## 1. Diagnosis: why strong deducers beat deceivers here

1. **There are few possible worlds, and they can all be checked.** The deck, the public night order and the role rules are all known. With 5 to 8 seats and a handful of roles, an AI can list every possible deal and every possible move history, then strike out any that contradict the claims made in chat. A liar has to fit their story into a world that is still possible, and the AI tests every story against every world at once.
2. **What cooperators learn is true, and they can repeat it.** Every Centaur's night result is accurate and can be reported. True reports add up and point to the same answer. A Werewolf has to invent a result, so its lies are the only false input, and false inputs are exactly what consistency checking catches.
3. **Defectors have no true information to work with.** A Werewolf knows only the other Werewolves. It does not know which roles are safe to claim, what the information roles saw, or where cards moved. So its lies are guesses, and guesses collide with real claims.
4. **Agreeing costs nothing and cannot be exploited.** Claiming everything at once and then voting together is the best strategy for Centaurs. It has no downside, and nothing in the rules punishes a predictable group or rewards a minority that steers it.
5. **Everyone knows their own team, and honest players are predictable.** Cooperators know they are cooperators, and their incentives are clean. So "a player whose behaviour does not fit a Centaur's interests" is reliable evidence of a Werewolf.

## 2. Mechanics

Conventions used below:
- Every wolf-team card is a Werewolf for elimination purposes unless the rule says otherwise.
- A tie for most votes eliminates everyone tied.
- **Ghost play:** when a role is not held, the engine plays its turn at random, and anything it does in public looks exactly like a held turn.

**M1. Den Census.**
- *Rule:* At the Werewolf turn, every Werewolf privately learns which roles are in the centre (the list of roles, not their positions).
- *Attacks:* reasons 3 and 1.
- *Why deducers can't solve around it:* A Werewolf now only claims roles nobody holds, so its claim never collides with a real one. Deducers know this. But an honest holder of an uncontested role looks exactly the same, so "nobody else claimed X" stops being evidence either way. To catch the Werewolf, they must find something wrong in what it says it learned, which is much harder than spotting two people claiming one role.
- *Backfire:* If a Centaur looked at the centre, they know which roles in there were safe claims, and wolf claims to those roles become strong evidence. Watch for wolves always claiming the plainest, information-free role.
- *Measure:* how often two players claim the same role; how often a wolf claims a role with no action.

**M2. Spyglass** (wolf-team card).
- *Rule:* Acts late in the night. Picks a seat and receives a copy of everything that seat's role learned this night, plus that role's name.
- *Attacks:* reasons 3 and 2.
- *Why deducers can't solve around it:* The Spyglass can claim that role itself, or claim a result that agrees with the real one. Then the two claims either match or conflict only in ways that are possible in some world. Deducers can only weigh which of the two players is more likely real. And the real player cannot prove anything, because the Spyglass knows every detail they know.
- *Backfire:* If it picks a seat whose role has no action, it learns almost nothing.
- *Measure:* win rate when the Spyglass is held compared with when it is not; how often two players claim the same result.

**M3. Mirage** (role: Fetch, wolf-team; ghost-played).
- *Rule:* Acts first. Puts a hidden Mirage token on one seat. Any information that seat gets tonight is falsified by the engine: a yes/no answer is flipped, and a viewed card is replaced by a different role that is in the deck. The victim is not told. If no one holds Fetch, the engine puts the token on a random seat.
- *Attacks:* reason 2, directly.
- *Why deducers can't solve around it:* Every report becomes "true unless Mirage hit this seat". The Mirage always exists, so there is always a corrupted report. When two honest reports contradict each other, deducers must treat that as noise, not proof of a liar. A Werewolf's lie is then indistinguishable from a sincere report from the Mirage victim. A held Fetch aims the token at the most dangerous information role instead of a random seat. Deducers can estimate probabilities, but a 1-in-5 noise level on every report keeps any world from reaching certainty.
- *Backfire:* Too much noise makes the game random and not interesting. Corrupting only one seat is the dial to tune.
- *Measure:* how often the table names the victim of a random (unheld) Mirage, and how often for a wolf-aimed one; Centaur win rate when the Mirage lands on an information role compared with when it does not.

**M4. The Bite** (role: Alpha, wolf-team; always acts last).
- *Rule:*
  - The Alpha picks a seat and sees that seat's card.
  - If the card is not wolf-team, the holder is told: "You are Turned. You win with the Werewolves. You are not a Werewolf for elimination."
  - The Turned player is not told who bit them. The Alpha knows whom it bit.
- *Attacks:* reasons 2, 3 and 5. It turns a cooperator holding true information into a defector.
- *Why deducers can't solve around it:* The Turned player has a real role and a real result. Their claims hold up against every check because they are true, and they can lie surgically about the one detail that matters, such as "my check came up empty" when it found the wolf. A consistency check finds nothing to catch. The Alpha knows who the Turned player is and can quietly back their story. Deducers can at most suspect that one information role could be compromised, and that suspicion falls on genuine cooperators too.
- *Backfire:* The Turned player may not know who the wolf is and may defend the wrong person. If the Alpha bites a player whose role has no action, the bite is wasted.
- *Measure:* win rate when a bite lands on an information role; how often the table identifies the Turned player.

**M5. Twin Bulletins** (roles: Herald, Centaur; Forger, wolf-team; both ghost-played).
- *Rule:*
  - The Herald picks a seat. The engine writes a true bulletin: "Seat X: [Werewolf / not Werewolf]."
  - The Forger writes any bulletin it likes that is false at that moment.
  - At dawn, both bulletins appear side by side in random order, unsigned.
  - If no one holds a role, the engine writes that role's bulletin from a random seat. So there are always exactly two bulletins, one true and one false.
- *Attacks:* reasons 1 and 2. The engine itself vouches for a lie.
- *Why deducers can't solve around it:* There is always a false bulletin, so its mere existence proves nothing. A held Forger writes a lie that agrees with the wolves' claims. The Herald says "mine is the first one". The Forger says the same about the other. That is a conflict between two claims, but now each side has an engine statement backing it, and Mirage noise lets either side be the honest one.
- *Backfire:* If the random fake from an unheld Forger is absurd (it contradicts a solid claim), deducers learn the Forger is not held. To prevent this, the engine's fake should pick among false statements that are still consistent with the world.
- *Measure:* how often the table picks the true bulletin when the Forger is held, and when it is not.

**M6. Family Turns.**
- *Rule:* Night turns are labelled with a family instead of a role (for example, "a Hand acts" for Tinker, Forger or Changeling). The order of roles within a family is shuffled secretly each game. Only the holders know their own position.
- *Attacks:* reason 1.
- *Why deducers can't solve around it:* Claims that depend on order, such as "I swapped after the Tracker looked", fit several orderings, so the number of possible worlds grows multiplicatively. A Werewolf can pick whichever role or position makes its story fit. Enumeration still works, but it returns many surviving worlds instead of one.
- *Backfire:* Too many families turn the game into a fog with no handholds.
- *Measure:* the number of worlds the table's AI still has open when the vote happens.

**M7. Interceptor** (wolf-team; a day power, twice per game).
- *Rule:* Picks a seat. That seat's next chat message goes privately to the Interceptor first. The Interceptor publishes it unchanged, publishes an edited version, or deletes it. The author sees the result like everyone else. Anyone may post "I disown message #k."
- *Attacks:* reason 4 (cheap reliable communication).
- *Why deducers can't solve around it:* AI tables will sign their messages: each player posts a hash at the start, then reveals a hash-chain step with each message. Plain forgery fails against that. Interception does not: the Interceptor sees the real hash step and attaches it to edited text. The real author can disown the message with a properly signed follow-up, but a Werewolf can just as validly disown its own true statement once it becomes awkward. So every statement can be denied after the fact, and "you said X earlier" stops being binding.
- *Backfire:* Deducers may discount disowned messages entirely, which would make interception only a delay.
- *Measure:* how often messages are disowned; the win swing when an interception actually happened compared with when it was threatened but unused.

**M8. Mandatory Secret Pardon** (vote rule).
- *Rule:* Along with your vote, you must secretly pardon one other player. A player pardoned by at least two players cannot be eliminated. Their votes are thrown out and the next-highest player is eliminated instead. The vote breakdown is published; the pardons are not.
- *Attacks:* reasons 4 and 5. Trust becomes something you are forced to spend, and it can be exploited.
- *Why deducers can't solve around it:* Two Werewolves pardon each other, so each needs just one Centaur pardon to be untouchable. Every Centaur must place trust somewhere, and nobody can verify what anyone pardoned ("I pardoned Bob" may be a lie). An agreed scheme such as "everyone pardons P1" is fine only while P1 is certainly a Centaur, and that is exactly what the Werewolves contest. A lone Werewolf needs two Centaur pardons, which makes for a gentler deck.
- *Backfire:* The Centaurs could all pardon the most certain Centaur. The Werewolves' answer is to cast doubt on that player.
- *Measure:* how often an elimination is diverted by pardons; how often the wolves are pardoned.

**M9. Reflection** (card).
- *Rule:* At the end, the Reflection's team is the team of the card held by its left neighbour. It is never a valid elimination target. The holder knows they hold Reflection but not the neighbour's card.
- *Attacks:* reason 5. Here is a sincere player whose interests depend on suspicion of someone else.
- *Why deducers can't solve around it:* A rational Reflection who becomes convinced its neighbour is a Werewolf switches to defending them, using honest-looking arguments. A Werewolf can also claim Reflection to explain why it defends someone. Deducers know the incentive, but they cannot tell a sincere switch from a wolf in disguise.
- *Backfire:* Reflection can tip the vote alone in 5-player games.
- *Measure:* win rate for the Reflection holder; vote accuracy when Reflection is in the deck.

**M10. Changeling Pact** (wolf-team; Hand family).
- *Rule:*
  - At night, the Changeling looks at one centre card and may mark it as the Pact.
  - After the vote, if the Changeling card's holder is eliminated with fewer than half the votes (rounding up), their card and the Pact card swap before winners are decided.
  - In plain terms: a Changeling slips away from a divided crowd but not from a majority.
- *Attacks:* reason 4. It raises the bar from "most likely" to "a confident majority".
- *Why deducers can't solve around it:* Splitting the vote is free for the Werewolves. A Centaur majority can still finish the Changeling, but only with enough certainty to unite the Centaurs. Every bit of noise (Mirage, the bulletins) now costs more.
- *Backfire:* If the Pact card is another Werewolf, the swap is skipped. If the threshold is set wrong, the game becomes about vote arithmetic.
- *Measure:* how often the Changeling escapes; the distribution of vote margins.

**M11. Ink.**
- *Rule:* Each player gets 8 messages of at most 160 characters. A wolf-team Inkthief steals 3 messages from one seat at night, and the victim is told at dawn.
- *Attacks:* reason 4.
- *Why deducers can't solve around it:* They will compress their messages, but cross-examination needs back-and-forth rounds, and the tax hits the questioner more than the person answering.
- *Backfire:* It is mostly a nuisance.
- *Measure:* messages left unused; the number of questions answered.

## 3. Third faction: The Mire

The Mire is a fen ecosystem. Its cards are neither Werewolves nor Centaurs, each has its own win condition, and several factions can win at once. Herald bulletins report Mire cards as "not Werewolf". The Mire is the reason that "acting suspiciously" stops being safe evidence: at least two of its creatures want votes or accusations for reasons that have nothing to do with being a Werewolf.

- **Lantern Angler** (a predator that lures): no night action. Wins if it is eliminated. It hides by playing badly on purpose and making messy, wolfish claims.
- **Bloatcap** (a parasitic fungus): at night, puts a Spore on another seat. Wins if the Spored seat is eliminated and the Bloatcap is not. It is a sincere, aggressive accuser of a target it may not understand.
- **Carrion Crow** (a scavenger): looks at one centre card. Wins if any Mire card other than itself is eliminated. The Crow and the Angler share an interest (the Crow eats what the Angler lures), so the Crow "uncovers" the Angler as if it were a Werewolf.
- **Heartwood Elk** (the keystone species): learns which seats hold Mire cards. Wins if no Mire card is eliminated. Keystone rule: if the Elk is eliminated, every Mire creature loses. The Elk holds true information and has an agenda the Centaurs do not share: it will lie to protect an Angler.
- **Cleaner Wren** (a symbiont): looks at one player's card and bonds to that seat. Wins exactly when that seat's final holder wins. If it bonds to a Werewolf, it becomes a defector who has seen the wolf card. If it bonds to a Centaur, it is an extra cooperator. The table cannot tell which.

**How the pieces interlock**
- If the Angler is eliminated alone, the Werewolves win, the Angler wins and the Crow wins. The Centaurs lose, and so do the Elk and the Wren (unless bonded to a Werewolf).
- The Elk is the main check on the Angler.
- The Bloatcap and the Crow add sincere hostility that has nothing to do with wolves.
- The Wren takes on whichever side it bonds to.
- Behaviour-based reads (reason 5) collapse.

**Worked example (6 players, 3 centre cards)**
- *Deck:* Werewolf ×2, Stargazer (learns whether a chosen pair of adjacent seats holds at least one Werewolf), Tracker, Tinker (swaps one player's card with a centre card, then looks at the new card), Centaur, Angler, Bloatcap, Elk.
- *Deal:* P1 Stargazer, P2 Angler, P3 Werewolf, P4 Elk, P5 Tinker, P6 Bloatcap. Centre: Werewolf, Tracker, Centaur.
- *Night:*
  - Den Census tells P3 he is the only wolf and that Tracker and Centaur are safe claims.
  - The Bloatcap Spores P1.
  - The Elk sees Mire cards at seats 2, 4 and 6.
  - The Stargazer checks seats 2 and 3: yes, a Werewolf.
  - The Tinker swaps P4 with the centre Centaur card and sees P4 now holds Centaur. The Elk card goes to the centre.
- *Day:*
  - P2 (Angler) also claims Stargazer, reports "no Werewolf in 2–3", and stirs up confusion.
  - P3 claims Centaur.
  - P6 (Bloatcap) attacks P1's claim.
  - P4, still believing he is the Elk, reveals "2 and 6 are Mire; do not vote 2". The Tinker confirms P4 was swapped, and P4 now knows his own team changed.
- *Without the Mire:* P2's counter-claim would make P2 the obvious wolf, and the Centaurs would vote P2. Here that hands the Werewolves the win.
- *With the Mire in the deck, the correct Centaur play changes:*
  - Ignore behaviour.
  - Trust the Elk's report, made before the swap, together with the Stargazer result. Together they put the Werewolf at P3.
  - Distrust P6, who would win from any elimination of P1.
- *The correct Werewolf play changes too:* stay quiet, support the case against P2, and argue that the "Elk" is just the wolf's partner covering for P2.
- *What makes it close:* the Centaurs' certainty now depends entirely on believing one unverifiable Mire claim.

## 4. Decks

**Deck A — "Paper Truths" (5 players, 3 centre)**
- *Cards:* Werewolf ×2, Forger, Herald, Stargazer, Tracker, Tinker, Centaur.
- *Rules on:* Den Census, Family Turns (Tinker and Forger form the Hand family).

Prediction: the table will publish every claim within the first minute, as the AI recommends, and then argue over which bulletin is real. With 3 wolf-team cards among 8, about 1.9 wolf cards are dealt to players on average, often two. Den Census lets wolf claims avoid every collision. A Forger lie that agrees with a wolf claim gives a picture that holds together and competes with the real one, and the table must bet on one of two coherent stories. Expected Werewolf win rate: about 45%. It falls if Stargazer checks happen to overlap, and rises when the Hand ordering is ambiguous.

**Deck B — "Bad Light" (5 players, 3 centre)**
- *Cards:* Werewolf, Alpha, Spyglass, Fetch, Stargazer ×2, Tracker, Reflection.
- *Rules on:* Mandatory Secret Pardon.

Prediction: two Stargazers look like redundancy. In practice, the Mirage plus a possible Bite means that when they disagree, neither one is caught. The Spyglass can copy a Stargazer exactly. The Centaurs' best move is to count only pairs of reports that are independent and agree, which happens in maybe half of games. The pardon gives the wolves a second route to survival. Expected Werewolf win rate: about 50%. Watch for degeneracy if the Bite plus Spyglass combination is crushing; if so, drop one of them.

**Deck C — "The Fen" (5 players, 4 centre)**
- *Cards:* Werewolf ×2, Angler, Elk, Bloatcap, Stargazer, Tinker, Herald, Centaur.

Prediction: the Herald's true bulletin and the Tinker's look are the only solid facts. Everything that looks like behaviour is suspect. The table should play it as "find the Werewolf the Herald and the Stargazer can locate, and never vote for the loudest player". The Angler pulls a share of votes every game. The Elk is often in the centre, so the Angler goes unchecked. Expected Werewolf win rate: about 40%. The Mire wins in about 20% of games, overlapping with Werewolf wins.

**Deck D — "Full Ecology" (7 players, 4 centre)**
- *Cards:* Werewolf, Alpha, Interceptor, Changeling, Herald, Forger, Stargazer, Tracker, Tinker, Angler, Crow.
- *Rules on:* Ink, Mandatory Secret Pardon, Family Turns.

Prediction: it is a dense game. The Centaurs have true information from the Herald (one of two bulletins), the Stargazer, the Tracker and the Tinker. Against that, the Forger's lie looks official, the Changeling demands a majority, the Interceptor makes any one statement deniable, and Ink limits cross-examination. Excellent deducers will usually narrow the Werewolves down to two candidates and then must win a majority vote with pardons in play. The Angler and the Crow scatter votes, and that hurts most when the Changeling needs a majority. Expected Werewolf win rate: about 50%, but the variance is the thing to measure.

## 5. Rankings

**Top five ideas**
1. The Bite (M4). It is the cleanest structural break: a defector armed with true information, whom consistency checks cannot catch.
2. Twin Bulletins with ghost play (M5). The engine's authority is split, and some falsehood is guaranteed in every game.
3. Mirage (M3). It puts a deliberate floor under how unreliable information can be. Contradictions stop proving lies.
4. Mandatory Secret Pardon (M8). It turns cooperation itself into a cost that cannot be verified and can be exploited.
5. The Mire core: Angler, Elk and Crow. It makes behaviour worthless as evidence, and it rewards trust in structure under pressure.

**Least sure**
- **Interceptor (M7).** Against AI tables with signed messages, it either turns all speech into ambiguity or gets dismissed with "disowned messages don't count". I cannot predict which without play-testing.
- **Changeling Pact (M10).** A threshold based on vote share may push the game towards vote arithmetic and away from reasoning about the world, or the wolves may be stuck with a predictable vote split. The right threshold is very sensitive to player count.
