I worked from my own thinking only and read no files. The base Centaur roles used in the decks are my own: **Lookout** (view one player's card), **Tracker** (view one centre card), **Ferryman** (swap two other players' cards), **Augur** (learn whether two players are on the same team) and **Herder** (no action). The Werewolf card lets the wolves see each other. Every win-rate figure below is a guess to test in play, not a measurement.

## 1. Why strong deducers beat deceivers here

- **R1. A lie gets caught by the numbers.** The deck is known, the night order is public, and everyone claims something. That leaves very few possible worlds. One lie makes the claims impossible to fit together, and the conflict narrows the liar down to one or two players.
- **R2. Wolves lie blind.** The Centaurs together know more than the wolves do. A wolf makes up a claim without knowing what is in the centre or what others saw, so the lie runs into the truth.
- **R3. Telling the truth costs Centaurs nothing.** Truth is the obvious meeting point for honest players. Holding back, hedging or late claims are themselves evidence. Liars have to coordinate their story where everyone can read it.
- **R4. The vote turns a small edge into a win.** Centaurs all vote for the most likely wolf at no cost, so even 60% confidence wins about 60% of the time.
- **R5. Every Centaur is a reliable sensor.** Players know their team and what they did at night. The only noise in the system is the wolves.

My view: taxing communication is weak against AI-assisted tables. They can agree on a shared deduction method and stay silent. Mechanics have to change the logic of the game, not the bandwidth.

## 2. Mechanics

**M1. Scent Ledger.** During the wolf turn, wolves learn which roles are in the centre, but not where. Deck rule: no Centaur role may view more than one centre card.
- **Attacks:** R2, R1.
- **Why it can't be solved around:** a wolf claiming a role that sits in the centre makes a claim no player can contradict, so the claims stay consistent. The only check is a Tracker's single peek. Wolves can work out the odds of that peek hitting their claim, and Centaurs can't remove the risk.
- **Backfire:** with 3 centre cards and a Tracker in the deck, a centre-role claim may be refuted too often, or almost never.
- **Measure:** how often a wolf claiming a centre role is caught, compared with a wolf making a blind claim.

**M2. Plagiarist.** A wolf-team card that counts as a Werewolf. Its slot comes right after the Lookout's. It learns the Lookout's exact result (which seat was viewed and what card was seen) but not who the Lookout is. If the Lookout is in the centre, it learns that.
- **Attacks:** R2, R1.
- **Why it can't be solved around:** two identical claims carry no information that tells the two apart. Only evidence from outside the claims can separate them. If the Lookout is in the centre, the Plagiarist knows its claim is safe.
- **Backfire:** standoffs that always end 50/50 feel random. The Plagiarist may be too strong when the Lookout is in the centre.
- **Measure:** how often a standoff happens, and how often the table picks the right one of the two.

**M3. Forged Omen.** Augur results are not given privately as claims. At dawn the engine posts them without names, as "Omen of the Augur: P2 ≠ P4". The Augur holder also sees its own result. The Forger (a Werewolf) acts in the last slot. It sees every queued omen and may add one omen labelled with any Augur-type role in the deck.
- **Attacks:** R1, R2, R3.
- **Why it can't be solved around:** the Forger has seen all the true omens, so its forgery fits them by design. If it copies a role that is in the centre, only one omen appears and no seat ever has to own it. If it copies a held role, two omens appear, and the real Augur has to give up its anonymity to dispute which is genuine.
- **Backfire:** with few omens, the forgery stands out.
- **Measure:** how often the forged omen is identified, and wolf win rate when the Forger is held versus in the centre.

**M4. Thrall Bite.** During the wolf turn, which comes after the information roles, the wolves choose one seat to bite. At dawn the bitten player privately learns: "You are a Thrall. You win with the Werewolves. You are not a Werewolf (eliminating you does not win for the Centaurs). You do not know who the wolves are." The wolves know who they bit.
- **Attacks:** R5, R2.
- **Why it can't be solved around:** wolves bite the likeliest information role, so the Thrall is a liar holding true information. It can change the one fact that matters and keep everything else consistent. The Centaurs' only defence is to trust only claims backed by two sources, which costs them most of their information. The Thrall can't safely coordinate with wolves it doesn't know, and any "I trust P3" from a wolf is public, so the wolf side is uneven in a way that can't be exploited reliably.
- **Backfire:** biting a Herder adds nothing, and a Thrall can frame the real wolf by accident.
- **Measure:** how reliable information claims are, and wolf win rate split by what the Thrall's role was.

**M5. Stalking Horse.** A wolf-team card that is not a Werewolf. It opens its eyes with the wolves. If the Horse is eliminated, the Werewolves win, even if a Werewolf is also eliminated.
- **Attacks:** R4.
- **Why it can't be solved around:** the wolf and the Horse know exactly the same things (each other, the night's wolf information). No question a Centaur can ask has a different correct answer for one than for the other. When deduction narrows the field to two liars who mirror each other, the best the Centaurs can do is guess, at 50%. Rules like "vote the most suspicious" or "vote the second most suspicious" are deterministic and can be exploited, so the right play is a mixed strategy. That puts a floor under wolf wins.
- **Backfire:** a careless Horse is easy to spot. Two eliminations through a tie become very risky for the Centaurs.
- **Measure:** when the table is down to two liars, how often it picks the wolf. The target is close to 50%.

**M6. Drifting Slot.** Movers marked "Drift" (the Ferryman, and wolf movers) choose in secret to have their swap take effect at the end of any later slot.
- **Attacks:** R1.
- **Why it can't be solved around:** it multiplies the number of consistent timelines. A look at slot 5 is uncertain as to whether it came before or after the swap, so claims that fit either timeline both stand.
- **Backfire:** the game can turn into noise.
- **Measure:** how many worlds are still consistent at vote time, and whether the winning team's chat reasoning is correct more often than chance.

**M7. Ghoul (an action after the vote).** A wolf-team card that is not a Werewolf. It opens its eyes with the wolves. At dusk, after eliminations are settled, the engine checks whether the Ghoul holder survived and voted for an eliminated player E. If so, the holder may swap its card with E's card in private. Ties eliminate all tied players.
- **Attacks:** R4.
- **Why it can't be solved around:** it happens after all information is in, so it can't be deduced. A correct lynch of the wolf fails if the Ghoul is still alive and voted with the crowd. Voting with the majority stops clearing you. The Centaurs' only counter is a deliberate two-way tie on their top two suspects, which spends votes and gives up some of the majority's advantage.
- **Backfire:** tables may settle into rote tie-engineering.
- **Measure:** how often Centaurs deliberately engineer ties, and Ghoul success rate.

**M8. Herd Panic.** No abstaining, and ties eliminate all tied players. If one player gets votes from every other player, the herd tramples: before the reveal, that player's card is swapped in private with a random centre card.
- **Attacks:** R4.
- **Why it can't be solved around:** with two wolves, the second wolf can vote for its partner to trigger the trample. Centaurs must therefore keep at least one of their votes off the target, and the wolves can try to use that spare vote to set up a tie. Voting for the wolf no longer clears a player.
- **Backfire:** games may come down to working out vote counts. With one wolf, it is just a tax on the Centaurs.
- **Measure:** win rate split by number of wolves, and how often a trample happens.

**M9. Dying Curse.** If a Werewolf is eliminated, each eliminated wolf names one living player and one information role (Lookout, Tracker or Augur). If that player's final card is that role, the Werewolves win.
- **Attacks:** R3, and through it R1.
- **Why it can't be solved around:** proving your information exposes you. The defence is to tell the true result while lying about which role you hold. That gives honest Centaurs a reason to lie, so a role conflict no longer singles out a wolf. Ferryman swaps also protect information holders who don't know they were moved.
- **Backfire:** if wolves win almost every curse, nobody shares information.
- **Measure:** curse success rate, and how often Centaurs misstate their role.

**M10. Wolf Ledger handoff.** This one combines M1 and M4. If a Thrall exists, the wolves' Scent Ledger result is also shown to the Thrall at dawn.
- **Attacks:** R2.
- **Why it can't be solved around:** it gives the wolf side a second liar who can claim a centre role safely.
- **Backfire:** two safe centre-role claims may hit the same role. They then contradict each other, which hands the Centaurs the answer.
- **Measure:** how often the wolf side collides on the same claim.

## 3. Third faction: the Thicket

**Shared rules for all Thicket (Wild) cards:**
- A Wild card is neither Centaur nor Werewolf. Eliminating one never counts as eliminating a Werewolf.
- Wild players win or lose on their own conditions, alongside whatever the main teams do.
- For the Augur, Wild cards form a third team.

**The creatures:**

- **Puffcap (prey that wants to be eaten).**
  - No night action.
  - It wins if it is eliminated.
  - **Blight:** if the Puffcap is eliminated, the Werewolves cannot win this game. Unless a wolf was also eliminated, neither main team wins.
- **Mycelium (the keystone).**
  - At night it learns which seat holds the Puffcap, or that the Puffcap is in the centre.
  - It wins if the Puffcap is eliminated and the Mycelium is not.
  - It has to persuade the table that the Puffcap is a wolf, so it plays as a convincing accuser framing someone. That looks exactly like a wolf.
- **Gravemoth (the scavenger).**
  - At night it views one player's card.
  - It wins if that seat is eliminated, unless the seat ends up holding the Puffcap.
  - Its side depends on what it saw. If it saw a wolf, it tells the truth. If it saw a Centaur, it lies like a wolf. Its accusation is the same either way, so it proves nothing.
- **Remora (the symbiont).**
  - At night it attaches to a seat and sees that card.
  - It wins if whoever ends up in that seat wins.
  - If it attaches to the Puffcap, it pushes to have its own host eliminated.
- **Chrysalis (the life cycle).**
  - No night action.
  - If eliminated, it hatches. It leaves the eliminated set, the runner-up or runners-up are eliminated instead, and the Chrysalis wins. This replacement happens only once.

**How they interlock:**
- The Puffcap is poison to the wolves, so wolves also avoid voting for suspicious players.
- A real Puffcap would never claim to be the Puffcap, so a Puffcap claim refutes itself. A wolf instead acts suspicious without claiming anything, hoping to be read as the Puffcap. A real Puffcap and a wolf doing this look the same.
- The Chrysalis makes second place in the vote decisive, and it combines badly with the Puffcap if the Puffcap is the runner-up.
- The Mycelium and the Remora turn the Puffcap's wish to die into accusers who look like Centaurs.
- Suspicious behaviour now points four different ways at once.

**Worked example (5 players, 3 centre cards).**
- **Deal:** P1 Lookout, P2 Werewolf, P3 Puffcap, P4 Gravemoth, P5 Mycelium. Centre: Ferryman, Herder, Chrysalis.
- **Night:** the Lookout views P3 and sees the Puffcap. The Gravemoth views P1 and sees the Lookout. The Mycelium learns that P3 is the Puffcap.
- **Day:**
  - P3 makes a clumsy false Lookout claim to attract votes.
  - P5 (Mycelium) "confirms" that P3 contradicts the public night order and calls for P3's elimination.
  - P4 (Gravemoth) wants P1 gone. It claims to be the Tracker and says P1's story is false.
  - P1 truthfully says P3 is the Puffcap and asks everyone not to vote P3.
- **How the base game would go:** the Centaurs vote out the obvious liar, P3.
- **How it actually goes:**
  - P1's warning now carries weight. The Mycelium can't safely say "I know P3 is the Puffcap and he isn't", because a Centaur Lookout's story fits the table.
  - The wolf, P2, also needs P3 to survive. P2 quietly supports P1's warning while steering the vote toward P4, who really is lying.
  - The Centaurs' best play is no longer "eliminate the liar". It is "find the liar who does not want to die".
  - P4 and P5 are both lying, but neither is a wolf. If the table eliminates P4, the Gravemoth loses and the wolves win.
- **What each side should do differently:** the Centaurs should ask each liar what they gain if they are eliminated, rather than whether they are consistent. The wolves should hide among the Wild liars rather than among the honest players.

## 4. Decks

**Deck A, "Echo" (5 players, 3 centre, 8 cards).** Werewolf, Plagiarist, Lookout, Tracker, Ferryman (Drift), Augur, Herder, Herder. Scent Ledger is active.
- **Prediction:** the table will claim everything at once. When the Lookout is held, the Plagiarist creates a duplicate claim. The Tracker's one centre card breaks the tie only when it happens to be relevant.
- When the Lookout is in the centre, the Plagiarist claims it safely. With Drift, even a conflicting Tracker reading can be explained away by timing.
- **Expected wolf win rate:** about 45%. Wolves lose mainly when both wolf cards are dealt to players and a Ferryman swap leaves a clear trail.

**Deck B, "Graveyard Shift" (5 players, 3 centre, 8 cards).** Werewolf, Ghoul, Lookout, Augur, Ferryman, Herder, Herder, Puffcap. Dying Curse is active. Ties eliminate all tied players.
- **Prediction:** Centaurs will default to engineered two-way ties. The Curse makes them hide their roles while sharing results, so consistency checks become fuzzy.
- The Puffcap punishes ties on the "obvious liar", and the Ghoul punishes single lynches.
- **Expected wolf win rate:** about 50%. Excellent tables win by tying the two players who are both suspicious and want to live.

**Deck C, "Thicket" (5 players, 4 centre, 9 cards).** Werewolf (with Thrall Bite), Puffcap, Mycelium, Gravemoth, Chrysalis, Lookout, Ferryman, Augur, Herder.
- **Prediction:** with three or more Wild cards usually in play, at least two players are self-interested liars who are not wolves. The Thrall turns one information claim bad. The Chrysalis makes the runner-up matter.
- Centaurs will build models of what each player wants. Those models can't reach certainty, because the Gravemoth's and Remora's loyalties depend on cards they saw privately.
- **Expected wolf win rate:** about 45%. Wild players will win roughly 30% of games as well, alongside whichever team wins.

**Deck D, 7 players (4 centre, 11 cards).** Werewolf (with Thrall Bite), Werewolf/Forger, Stalking Horse, Lookout, Tracker, Ferryman (Drift), Augur, Augur, Herder, Remora, Puffcap. Herd Panic and Forged Omen are active.
- **Prediction:** the omens give rich information, but one of them may be forged and one Augur may be a Thrall. Deduction will usually narrow things to a set of two or three liars that includes the Horse, where the best Centaur play is a mixed strategy.
- Herd Panic stops the Centaurs from going all in on one target when two wolves are in play.
- **Expected wolf win rate:** about 50%.

## 5. Ranking

**Top five:**
1. **Stalking Horse.** The wolf and the Horse know exactly the same things, which puts a floor on wolf wins that can be proven.
2. **Thrall Bite.** It produces a liar who holds true information, from inside the Centaur team.
3. **Dying Curse.** It gives honest players a reason to lie, which breaks the "a role conflict means a wolf" check.
4. **Puffcap with Blight, plus the Mycelium.** Suspicious behaviour becomes ambiguous in four directions.
5. **Forged Omen.** The forgery fits the true information by design.

**Least sure:**
- **Herd Panic.** It may reduce the day to working out vote counts, and its strength swings sharply between one-wolf and two-wolf games.
- **Drifting Slot.** It may just add noise. It disrupts Centaurs and wolves alike, and could make wins feel random rather than earned.
