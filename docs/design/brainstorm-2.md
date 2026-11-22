I did this from my own thinking only: I read no files and searched nothing.

# Centaur Werewolf: mechanics brief

## 1. Diagnosis: why strong deducers beat deceivers here

- **D1. The set of possible claims is closed and can be checked.** The deck list and the night order are public, so each claim narrows the possible worlds a lot. A liar has to make up a full story without seeing anyone else's, and the AI checks every story against every other one. If two players claim the same role, or a claim contradicts what a role can do, that convicts someone.
- **D2. True information adds up; lies do not.** Every Centaur holds an independent true fact, and those facts support each other. Werewolves hold almost nothing true except who their teammates are. Every Wolf claim is invented, so no other evidence ever backs it up.
- **D3. Honesty costs a Centaur nothing.** "Everyone reveals everything" is the Centaurs' best plan. So any lie, hedge or silence counts as evidence of being a Wolf, and lying is the same thing as being on the Wolf team.
- **D4. The game is a one-shot puzzle with no reply step.** All information is pooled before a vote the Wolves cannot answer. Hedging is free: you can vote both suspects into a tie. Nothing happens at the same time as the vote, so there is no mixed-strategy floor. A perfect deducer gets the posterior right and wins whenever the evidence allows.
- **D5. Wolves must commit to a story before they can adapt it.** Their claims go into chat in real time and get checked instantly.

The structural fix is threefold. Give Wolves information that is **true** (so their claims look like honest ones). Make the posterior genuinely **flat** between hypotheses (so no amount of deduction separates them). Add **simultaneous moves** (so the equilibrium caps the deducers' edge however clever they are).

## 2. Mechanics

**M1. Mimic** (Werewolf-team card). Attacks D1 and D2.
- **Rule:** The Mimic acts right after the last information role. It names one information role R from the deck list.
  - If a player holds R, the Mimic gets a verbatim copy of that player's private result: the same targets and the same outcome.
  - If R is in the centre, the engine runs R's look on random legal targets, gives the Mimic that true result, and touches no cards.
  - The Mimic is never told which of the two cases happened. Copying moves nothing and leaves no trace.
- **Why deducers can't solve it:** The Mimic's information is always true. If R is held, two players make identical claims, and nothing tied to the night separates them. If R is in the centre, the Mimic is the only claimant and holds true information. No consistency check can catch either case. The only leads left are behaviour (which a Centaur partner can keep tidy) and outside evidence that happens to touch one of the two seats.
- **Backfire:** Without M2, the table votes both claimants into a tie and is guaranteed to hit a Wolf. If the Mimic always copies the strongest role, its target is predictable. That doesn't matter, because predictability doesn't break the symmetry.
- **Measure:** Win rate in games with two identical claimants. Target about 50%. If it is well above 50%, find which side evidence breaks the tie.

**M2. Blood Price** (win-condition change). Attacks D4.
- **Rule:** Centaurs win only if more Werewolf-team players are eliminated than Centaur-team players. Eliminations of Fen creatures and Thralls count as Centaur eliminations, except the Hollow Stag (see section 3). If no Wolf card is in play, Centaurs win only if nobody is eliminated.
- **Why deducers can't solve it:** It removes the free hedge. Under real 50/50 uncertainty the Centaurs have to commit, and a coin flip stays a coin flip. Without this rule, M1, M3 and M7 lose most of their bite.
- **Backfire:** Tables may get timid and land on a no-elimination outcome. Under normal rules that is a Wolf win, so timidity only helps Wolves if it becomes common.
- **Measure:** How often multiple players are eliminated, and how well the Centaurs' win rate matches their stated final confidence (calibration).

**M3. Thrallbite** (variant Werewolf card, the "Alpha"). Attacks D2 and D3.
- **Rule:** The Alpha acts after all information roles. It picks one other player. At dawn that player is told privately: "You are Thralled. You win if the Werewolves win, whatever card you hold. The bite came from seat X. If you are eliminated, it counts as a Centaur elimination."
- **Why deducers can't solve it:** The Thrall's night result is genuinely true. It was produced by a real role that really acted, and its slot fits the public order. From dawn on, that player is a liar who holds verified facts. They know a Wolf's seat, so they can protect it by framing others with true-sounding data. The Alpha's turn is public, but if the Alpha card might be in the centre, the table cannot tell whether a Thrall exists.
- **Backfire:** If the bite always lands on the strongest information claimant, the table may learn to discount that player.
- **Measure:** The share of Wolf wins where the Thrall's claim was the one the table relied on most. Also, how often Thralls get eliminated.

**M4. Moon-sight** (rule given to Werewolf-team players). Attacks D1 and D5.
- **Rule:** At the end of the night, each Wolf privately gets the full Trace. This is the list of every position that was looked at or moved, in order, with the turn slot of each action but no role names.
- **Why deducers can't solve it:** Lies get caught mostly because they contradict physical events. With the Trace, a fabricated claim never does. Deducers cannot check what the Wolves were shown, and they get nothing in return.
- **Backfire:** Combined with role claims, the Trace can make Wolves almost all-knowing. In decks with few movers, Wolves could win too often.
- **Measure:** The rate at which Wolf claims are caught by a contradiction, with Moon-sight and without it.

**M5. Glamour** (Werewolf-team card "Glamourer"). Attacks D1 and D3.
- **Rule:** The Glamourer acts first. It picks one card position and one role name from the deck. Every look at that card for the rest of the night, including team comparisons and self-looks, reports the named role and its team. The Glamour moves with the card and is never revealed.
- **Why deducers can't solve it:** If a Centaur's claim contradicts a looker's report, there are now two consistent explanations: a liar, or an honest player who was Glamoured. Contradiction no longer convicts. The Glamourer can also make a Wolf card read as a Centaur card. Deducers can only weight the two worlds by how likely it is that the Glamourer is held.
- **Backfire:** "It must have been a Glamour" becomes a get-out-of-jail card for any caught Wolf. That is close to the goal, but too generous if the Glamourer is in most decks.
- **Measure:** How often caught contradictions still lead to the liar being eliminated.

**M6. Crier and Forger** (an engine announcement plus a Werewolf-team card). Attacks D1 and D2.
- **Rule:** At dawn the engine publicly announces: "Seat X or seat Y holds a Werewolf-team card." X is a random seat that really holds one. Y is a random other seat. If no seat holds a Wolf card, X and Y are both random.
  - The Forger, at its turn, may queue any two seats.
  - If the Forger is held, its pair replaces the true announcement.
- **Why deducers can't solve it:** The Crier is the strongest public evidence in the game, so the table relies on it heavily, and it is wrong in exactly the share of games where the Forger is held. Deducers can price that risk, but they cannot remove it. A forged Crier steers the whole consensus toward two Centaurs. Paired with M4, the Forger can pick the two seats whose claims are weakest.
- **Backfire:** If the Forger's chance of being held is high, the table ignores the Crier and it becomes noise.
- **Measure:** Win rate when the Crier is forged versus true, and how much weight tables actually put on it.

**M7. Moon-Thief** (Werewolf-team card that acts during the day). Attacks D4: it creates a simultaneous move.
- **Rule:**
  - At night the Moon-Thief sees the Wolf-team seats.
  - During the day, at any time until votes lock, it secretly queues one swap of two other players' cards. It cannot include its own card.
  - The swap happens the instant votes lock, before they are counted. Nobody is told, and wins are judged on the cards after the swap.
- **Why deducers can't solve it:** It turns the vote into a guessing game played at the same moment. A Wolf the table has clearly identified gets swapped onto a Centaur who isn't being voted. The eliminated player now holds a Centaur card, and the unlucky Centaur now holds a Wolf card and wins with the Wolves. The only stable target is the Thief itself, which has no night result to claim. Even then the Centaurs face a choice: the obvious Wolf (who may be swapped) or the probable Thief (an inference). That is a mixed-strategy equilibrium, so perfect deduction cannot push the Wolves' win rate to zero.
- **Backfire:** The swap can also rescue the identified Wolf's own teammate at the original Wolf's expense, which is amusing tension inside the Wolf team. If the Thief is too easy to identify, the mechanic falls apart.
- **Measure:** How often the vote lands on the player who was swapped, and win rates when the Thief is held versus in the centre.

**M8. Herd Panic** (vote rule, 7 or more players only). Attacks D4: it punishes consensus.
- **Rule:** If every Centaur-team voter, judged by final cards, votes for the same player, that vote is void and nobody is eliminated.
- **Why deducers can't solve it:** The Centaurs need a deliberate dissenter, and that player must be a confirmed Centaur. If a Wolf is named as dissenter, the Wolf "dissents" anyway, every Centaur votes together, and the vote is void. The other dissented votes give Wolves material to build ties, which Blood Price then punishes.
- **Backfire:** At 5 players with 2 Wolves it is lethal. Three Centaurs means two on the target and one dissenting. The targeted Wolf and its partner both vote a Centaur, which makes a 2–2 tie. Under Blood Price that nets zero, so the Centaurs lose. Never use it below 7.
- **Measure:** Rate of voided votes, and whether tables settle on a stable dissenter protocol.

**M9. Moonlit Rounds** (chat structure). Attacks D5.
- **Rule:**
  - The day runs as 6 rounds of 45 seconds. Each player posts at most one message per round, and all of a round's messages appear at the same moment.
  - Wolf-team players, the Thrall and the Owl (a Centaur role) get a Late Slot. They see round k's messages 10 seconds before everyone else and can still write or edit their own round-k message. Nothing marks a message as late.
- **Why deducers can't solve it:** Wolves use the Late Slot to *avoid* claim collisions, not to respond to them. A collision that never happened is invisible, so there is no evidence to find. An open reply to a same-round message would reveal the slot, but the Owl also has one, so even that is not proof.
- **Backfire:** Late-Slot holders may be too careless and write visible same-round replies.
- **Measure:** Rate of Wolf claim collisions with Moonlit Rounds versus open chat.

**M10. Hidden Deck List** (setup rule). Attacks D1.
- **Rule:** The table sees a pool of about 12 roles and the constraints, for example "1 to 2 Wolf cards, at most 1 Fen card." The real deck is a secret random subset. The public night order gives every pool role its turn, all of the same length.
- **Why deducers can't solve it:** Arguments from role counts, and claims that "your role must be in the centre", become probabilistic. A Wolf can claim any role in the pool. The one remaining hard proof is two claimants of a role the pool holds only once. Everything else becomes a likelihood.
- **Backfire:** Too much uncertainty, and the game feels like guessing.
- **Measure:** How much the posterior narrows by vote time (entropy at vote time), compared with games using a public deck.

**M11. Fox's Silence** (Centaur role that has to lie). Attacks D3.
- **Rule:**
  - Every player has a public claim tag that the engine reads, editable until votes lock.
  - The Fox's holder casts 2 votes, unless any player's tag reads "Fox" when votes lock.
  - Saying "I'm the Fox" in chat is allowed.
- **Why deducers can't solve it:** A true Centaur now has a real reason to keep a false tag. So "this tag contradicts the evidence" stops being proof of a Wolf. If the Fox is caught lying, it can say "I'm the Fox" in chat, but so can a caught Wolf. That makes Fox a claim two people can make, and a collision among Fox claimants is only 50/50.
- **Backfire:** Tables may agree on a fixed cover lie for the Fox, such as "Fox tags Sentinel and reports no change." Wolves would copy it, which is fine. Or the double vote may matter too little to give up a clean claim for.
- **Measure:** How often the real Fox keeps a false tag, and what happens to players caught lying.

## 3. Third faction: the Fen

The Fen is the wild marsh around the Centaurs' wood. Each creature has its own win condition, and they can win alongside other teams. Under Blood Price, Fen eliminations count as Centaur eliminations, except the Stag, whose elimination overrides every other result.

- **Hollow Stag (keystone species).** No night action. It wins if it is eliminated. If it is eliminated, **Centaurs and Werewolves both lose**, which overrides everything else. Its best play is to act exactly like a clumsy Wolf.
- **Moth (life cycle).** The card is played as a Centaur, the Larva. At dawn the engine checks whether the starting Moth player's card was moved during the night.
  - If it was not, they stay a Larva and remain a Centaur.
  - If it was, they become an **Imago**: a Fen player who wins if eliminated, whatever card they now hold. The engine tells them so privately.
  - So every mover, Wolf or Centaur, may unknowingly create a player who wants to be eliminated. When a mover truthfully says "I swapped seats 2 and 5", the table learns that one of those two may now want the vote.
- **Cuckoo (brood parasite).** At night it places a **public** Egg token on another seat. It wins if the Egged player is eliminated and the Cuckoo is not. Everyone sees where the Egg is, but not who placed it. So anyone pushing hard against the Egged seat may be the Cuckoo rather than a Wolf framing someone.
- **Carrion Kite (scavenger).** It wins if at least two players are eliminated and it is not one of them. It argues for "vote both", which is exactly the hedge Blood Price makes costly.
- **Lichen (symbiont).** At night it bonds to a seat. That player is told only "something has bonded to you." If either of the two is eliminated, both are. The Lichen wins if its host wins.

**How they interlock:**
- An Egg on the Stag gives the Cuckoo the same goal as the Stag: get the Stag eliminated.
- Lichen bonded to the Stag wants its own elimination, because that takes the Stag out with it.
- Lichen on a Wolf becomes, in effect, a Wolf who protects its host fiercely.
- Any Lichen bond turns one elimination into two, which feeds the Kite.
- Movers create Imagos.

The result is that three readings that used to point at a Wolf no longer do: "that player is acting suspiciously" (Stag, Imago), "that player is pushing hard" (Cuckoo, Kite) and "that player is defending someone" (Lichen).

**Worked example.** 7 players, 3 centre cards. The deck holds 2 Werewolves, Augur, Drover, Tracker, Sentinel, Owl, Stag, Cuckoo and Moth. Each card has a 70% chance of being held.
- The Egg lands on seat 6.
- Seat 6 tags Augur and reports "2 and 4 are the same team." The Tracker's trace shows no touch matching that.
- Seat 3 pushes hard for seat 6.

Under classic reasoning, seat 6 is a caught Wolf and seat 3 is an honest Centaur. Run the hypotheses properly, though. Roughly half the remaining weight goes to "6 is the Stag, deliberately caught", given its 0.7 chance of being in play and the fact that a careful Wolf would not lie in a way the Tracker could check. Seat 3 is a likely Cuckoo. Voting seat 6 now carries about a 1-in-3 chance that *both* main teams lose.

The correct Centaur play is to stop using behaviour as evidence and vote only on chains of independent claims that agree with each other. Here that means the Drover's and the Sentinel's reports, which together point at seat 2. The correct Wolf play changes too: one Wolf should copy Stag-like sloppiness to soak up suspicion and fear, while the other stays clean.

## 4. Decks

**Deck A, "Stolen Sight": 5 players, 3 centre, 8 cards.**
- Cards: Werewolf, Mimic, Augur, Tracker, Sentinel, Drover, Fox, Moth.
- Rule: Blood Price.
- Prediction: Both the Mimic and the Augur are held in about 36% of games. Those games produce two identical Augur claims with the hedge removed, so they become a true coin flip unless the Drover or Sentinel happens to touch one of the claimants. When the Augur is in the centre, the Mimic is the cleanest-looking player at the table. A lone Werewolf without the Mimic is caught most of the time, but the Fox's false tag and the Moth's Imago both create innocent liars and innocent players who want the vote. Expected Wolf win rate is about 45%. Tables will learn to rely on the Drover's and Sentinel's results and to treat the Augur's as a contested claim.

**Deck B, "Thrall Moon": 5 players, 3 centre, 8 cards.**
- Cards: Alpha (Werewolf), Werewolf, Augur, Sentinel, Drover, Owl, Fox, Cuckoo.
- Rules: Blood Price, Moonlit Rounds.
- Prediction: Deducers will treat the Alpha's slot as a reason to discount the single strongest information claim. The Alpha knows that, so it bites a middle-ranked witness instead. The Thrall's true result, released with a Late Slot, frames someone with facts nobody can fault. The public Egg adds a pusher whose motive is unclear. Wolf win rate is about 50%: high when the bite lands on a held information role (roughly 60% of games), lower when it lands on the Fox or the Cuckoo.

**Deck C, "False Dawn": 5 players, 4 centre, 9 cards, drawn from a hidden pool of 12.**
- Cards: Glamourer, Forger, Werewolf, Augur, Tracker, Sentinel, Drover, Stag, Kite.
- Rules: Crier on, Hidden Deck List.
- Prediction: The Crier is the table's anchor, and the Forger is held often enough (5/9) that relying on it is a real gamble. Every contradiction has a Glamour explanation. The Stag makes a clumsy suspect dangerous to vote, and the Kite pushes for double eliminations. Excellent tables will vote on a true Crier pair when the claims agree, and will be wrong whenever it was forged. Expected Wolf win rate is about 50%, and probably the highest-variance of the four decks.

**Deck D, "The Whole Fen": 7 players, 4 centre, 11 cards.**
- Cards: Werewolf, Alpha, Moon-Thief, Augur, Tracker, Drover, Sentinel, Owl, Fox, Stag, Cuckoo.
- Rules: Blood Price, Herd Panic, Moon-sight.
- Prediction: Deducers will probably identify one Wolf by mid-day, but that is exactly the player the Moon-Thief swaps away. Herd Panic forces a dissenter, and the dissenter's vote is something Wolves can use to build a tie. The right Centaur strategy is to hunt the Moon-Thief, the claimant with nothing to show, while a confirmed Centaur dissents. That only works when information claims are clean, and Moon-sight plus the Thrall keep them from being clean. Expected Wolf win rate is 45–55%. The guessing game at the vote keeps a floor under the Wolves.

## 5. Ranking

1. **Mimic.** True information makes honest and dishonest claims identical. This is the cleanest answer to D1 and D2.
2. **Moon-Thief.** Simultaneous moves give the Wolves an equilibrium floor that perfect deduction cannot remove.
3. **Blood Price.** It enables the other mechanics: without it, every 50/50 gets hedged away.
4. **Hollow Stag and the Fen.** They make behaviour-based evidence expensive, and the Stag's "everyone loses" outcome is something both main teams fear together.
5. **Thrallbite.** It turns the Centaurs' best witness into a Wolf partner who knows the truth.

**The two I'm least sure about:**
- **Herd Panic.** The vote arithmetic is brittle. It is fatal at 5 players, and at 7 it may collapse into either a trivial dissenter protocol or no Centaur wins at all. That depends on how many Wolves are held, so it needs simulation before anyone plays it.
- **Fox's Silence.** A double vote may not be worth giving up a clean claim, so the Fox may never actually lie. And chat claims could reduce it to just another claimable slot.
