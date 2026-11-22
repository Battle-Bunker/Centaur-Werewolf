# Centaur Werewolf: design synthesis

Lead designer's synthesis of `brainstorm-1.md` to `brainstorm-4.md` (B1 to B4), checked against the game as built
(`shared/roles.ts`, `shared/engine.ts`, `shared/commands.ts`, `convex/`) and the five-AI pilot. It ends in a first build of
eight defector mechanics, a five-creature third faction, a test plan and five questions for the owner.

## 0. What the evidence already says

**All four designers wrote the same diagnosis.** None had seen the others' work. Each listed the same five reasons that
strong deducers beat deceivers:
1. The world is closed and can be enumerated: a public deck and a public night order.
2. True information adds up, and wolves hold none of it.
3. Honesty costs a Centaur nothing, so any lie or hedge is evidence.
4. Turning belief into an elimination is free. B2 made the sharpest point here: a two-way tie lets the Centaurs hedge at no cost.
5. Everyone's incentives are readable from behaviour.

The design below attacks each of these in turn.

**The pilot fits that diagnosis.**
- The wolf who was caught collided with an honest claim (reason 1).
- The wolf who survived did so through a coincidence: an honest Sentry's reading happened to fit his lie.
- The wolves won because a blind mover moved the card the table had correctly found. The table deduced who was *dealt*
  a Werewolf, but wins are decided by who *holds* one.

Two lessons follow. First, the held-not-dealt rule already gives the defectors a structural floor, and players tolerated
losing to it (fun 4/5). Second, coincidences that protect a liar should become things a liar can choose, not luck.

## 1. Convergence map

| Family (merged name) | Proposals | Who | Weakness attacked |
| --- | --- | --- | --- |
| **F1 Wolves learn the world** | Scent Ledger, Den Census, Moon-sight (trace), Moon-Eye | B1 B3 B2 B4 | 1, 2: wolves lie blind |
| **F2 Copy a true result** | Plagiarist, Mimic, Spyglass, Eavesdropper | B1 B2 B3 B4 | 2: detail stops proving the role |
| **F3 Turn an informed cooperator** | Thrall Bite, Thrallbite, The Bite, Bitten | B1 B2 B3 B4 | 2, 3, 5: a liar holding true facts |
| **F4 Forged public record** | Forged Omen, Crier + Forger, Twin Bulletins | B1 B2 B3 | 1: the engine vouches for a lie |
| **F5 Corrupted or curated views** | Glamour (twice), Mirage, Crier's Choice | B2 B4, B3, B4 | 2: a sincere witness can be wrong |
| **F6 Symmetric decoy** | Stalking Horse, Hollow Mask | B1 B4 | 4: a provable 50/50 at the end |
| **F7 Act after the evidence** | Ghoul, Moon-Thief, Changeling Pact, Undertow | B1 B2 B3 B4 | 4: the vote becomes a simultaneous move |
| **F8a Remove the free hedge** | Blood Price | B2 (and implicit in B1 B4 tie analyses) | 4 |
| **F8b Consensus traps** | Herd Panic (twice), Secret Pardon, Mirror Mark, Chrysalis | B1 B2, B3, B4, B1 | 4 |
| **F9 Honest players get a reason to lie** | Dying Curse, Fox's Silence, Reflection, Ward | B1 B2 B3 B4 | 3 |
| **F10 Timeline or setup fog** | Drifting Slot, Family Turns, Veiled Hour, Hidden Deck List | B1 B3 B4 B2 | 1 |
| **F11 Communication attacks** | Moonlit Rounds, Interceptor, Ink, Mimic-forgery | B2 B3 B3 B4 | communication |
| **Third faction** | wants-to-die, parasite, symbiont, scavenger, keystone, life cycle | all four | 5: suspicious behaviour stops meaning "wolf" |

**What the convergence tells us.**
- Four families were proposed by all four designers: F1, F2, F3 and F7. That is the strongest evidence we have that
  these are the natural levers for this game.
- The third faction converged even further:
  - All four built the same food web: a creature that wants to die, a parasite that marks a target, a symbiont that
    wins with a host, and a scavenger.
  - Three of the four added a keystone that knows where the creatures are.
  - Two independently named the scavenger *Carrion Crow*.
  - Two independently named the disguise card *Glamour*, and two independently named the vote rule *Herd Panic*.
- Three designers flagged their own timeline-fog proposal (F10) as their least sure. That too is evidence, and I act on it.

## 2. Critical evaluation

Each family is judged on five tests:
- **Robust:** does it survive an excellent AI table (protocols, commit-reveal claims, enumerating every world, pre-agreed conventions)?
- **Legible:** can a human follow it?
- **Floor:** does it create a provable floor, or only noise?
- **Interactions:** how does it behave with centre size and queued plans?
- **Cost and risk:** what does it take to build in this engine, and can it degenerate?

**F1. Wolves learn the world (adopt Den Census; defer the trace and Moon-Eye).**
- *Robust.* A strong table answers Census by pooling every centre glance. Each Centaur glances once, and the Herald and
  Farrier add more. With 3 centre cards and three or more glancers, most centre slots are seen, so a claim to a centre
  role is often refuted. With 5 or 6 centre cards it rarely is.
- *Floor.* Census is not a floor. It is an information equaliser that removes the cheapest catch (a collision with a
  real claim), which is exactly how the pilot's wolf was caught.
- *Interactions.*
  - Its strength rises with centre size, which is a useful dial.
  - It also lets a wolf fake a plain Centaur's glance convincingly ("centre 2 was the Sentry"), and only a positional
    cross-check can refute that.
- *Cost.* Low: a `census` effect returning the multiset of dealt centre roles.
- *Deferred.* Moon-Eye (every final card) and Moon-sight (the full trace of moves) are strictly stronger. B4's own
  estimate was "above 70% if held". Revisit them only if Census proves too weak.

**F2. Copy a true result (adopt, as the Eavesdropper).**
- *Robust.* This is the strongest idea in the corpus. A copied result is true and identical to the original, so
  commit-reveal claiming does not help: the copier does not need to hear anyone. Exhaustive enumeration returns two
  worlds of equal weight unless some outside evidence touches one of the seats (a Sage read, a Sentry reading, a Rustler peek).
- *Floor.* A genuine one. A duel between the original and the copy is 50/50 *once the free hedge is gone*. B2 is right
  that without Blood Price (F8a) the table simply ties both claimants.
- *Extra.* I adopt B2's refinement for the case where the named role is unheld: the engine runs that role's looks from
  the Eavesdropper's own seat on random targets, so the copier holds a true, uncontested result.
- *Interactions.* Census tells the wolves which roles are held, so the Eavesdropper never wastes its turn. Its choice is
  unconditional, so it fits queued plans.
- *Cost.* Medium:
  - a new decision field (a role name);
  - an `overhear` effect that copies the target seat's log entries;
  - a "ghost look" path for unheld roles.
- *Risk.* If one role is always copied, tables discount that role. That is acceptable, because the symmetry remains.

**F3. Turn an informed cooperator (adopt, as the Biter).**
- *Robust.* The bitten player's night result is real, comes from a real role and fits the public timetable. The only
  defence a table has is a corroboration-only policy, and that throws away most of its own information. That cost is
  the point.
- *Floor.* A genuine one: a bitten Sage and an honest Sage are identical in every observable.
- *Disagreement settled.* B2 tells the victim who bit them; B1 and B3 do not. I side with B2. Knowing one wolf's seat
  is what turns the victim into a partner rather than a loose cannon, and the brief asks us to *empower* deception.
- *Disagreement settled.* B4's passive *Bitten* (viewing the card converts it) is elegant but taxes investigation in a
  way that is hard to reason about. It goes to the second wave.
- *Interactions.* The bite uses the existing look-then-conditional machinery, the same as the Rustler: look, then
  "bite if Sage/Herald/Herder/Sentry, otherwise skip".
- *Originality.*
  - B2's and B3's name "Alpha" is the name of a published wolf that converts a player, so it is dropped.
  - The look step is in substance an existing published "wolf who peeks". The bite and the told victim are what make it ours.
- *Cost.* Low:
  - a `bitten {seat, by}` field;
  - a dawn notice;
  - a team override in the vote count.

**F4. Forged public record (adopt, on the existing Herald).** We already have an engine-certified, anonymous public fact,
the Herald's proclamation, so the cheapest version of this family is a wolf ally who adds a forged proclamation beside it.
- *Robust.* A table cross-checks proclamations against Centaur glances. If the Forger is held and the Herald is held,
  two proclamations appear, so the table knows one is false and must pick which.
- *Floor.* Weaker than F2 or F3 and only partly a floor. The forgery hurts most when it frames an honest claimant ("centre
  2 is the Sage"), which the Forger is guessing at.
- *Requirements.*
  - All proclamations must be released together at dawn, each labelled "Herald's turn". At present they appear during
    the night turn that made them, and the timing alone would expose the forgery.
  - A deck rule: no Forger without a Herald.
- *Cost.* Low to medium:
  - an `announce` with an override role;
  - deferred release of `shown`;
  - the Forger's unsigned-chat power is retired.
- *Keep or cut.* It is the first defector mechanic to cut if it tests flat.

**F5. Corrupted views (adopt Glamour; reject Mirage; defer Crier's Choice).**
- *Glamour.* I take B2's general form: one chosen card reads as one chosen role. B4's form only allowed disguising your
  own card.
  - It turns the Centaurs' best tool, reading cards, into sincere false testimony: framing an innocent, or vouching for a wolf.
  - It is adversarial and deliberate, so it is a mind game and not noise.
  - The counter is count-checking. Two "Sentry" readings when the deck holds one Sentry prove a glamour. The wolf
    plays around that with Census.
- *Mirage* (B3: the engine randomly falsifies one seat's information each night) is pure noise. Humans will hate losing
  to it. Rejected.
- *Crier's Choice* (a wolf picks which true statement is announced) may give strong Bayesian players more than it costs
  them. Second wave.
- *Glamour cost.* Medium: a `tokens` map keyed by slot, which `swap` and `rotate` must carry along, consulted by `look`
  and `announce`.

**F6. Symmetric decoy (adopt the Stalking Horse; defer the Hollow Mask).**
- *Floor.* The Horse is the only proposal with a floor you can prove on paper. A Werewolf and the Horse wake together
  and get identical knowledge. No question a Centaur can ask has a different correct answer for the two of them.
- *The tie counter.* Tying the two would be the obvious hedge, but eliminating the Horse is an outright wolf win, so tying
  the pair loses.
- *Requirements.* The lone-wolf rule must count the Horse, so that a wolf paired with a Horse does not get the lone
  wolf's extra scent. The wolves' "see the pack" step should look for a `pack` tag; `wolf` is kept for elimination.
- *Cost.* Low.
- *Hollow Mask.* Same floor, but it needs two cards and produces coin-flip duels every time both are dealt. Second wave.

**F7. Act after the evidence (adopt B2's Moon-Thief form).**
- *Convergence.* All four designers proposed a swap at or after the vote.
- *Why B2's form.* Its swap is queued *during* the day and applies when votes lock, so the vote becomes a genuine
  simultaneous-move game.
  - The table's obvious wolf may be swapped onto a Centaur nobody is voting for.
  - The Thief's own card cannot move, so the stable counter is to find the Thief, and that is a deduction problem.
  - The wolves must therefore randomise whom they let look guilty.
- *Rejected forms.*
  - B3's vote-share threshold and B4's "neighbour of the doomed" are arithmetic.
  - B1's Ghoul ("swaps after the elimination if it voted with the crowd") makes votes a signal; second wave.
- *Legibility.* "One hidden wolf may swap two cards the moment the vote closes." The pilot suggests humans accept
  "right deduction, moved card".
- *Cost.* Medium:
  - **one new registry command pair**, `day.queueSwap` / `day.clearSwap`;
  - a `daySwap` field on the game;
  - the swap applied in `endDay` before `resolveVote`.
- *Risk.* The highest of all eight mechanics for human feel. It is the first to cut if human ratings drop.

**F8a. Blood Price (adopt, as a global rule).** It is B2's, and I reached the same conclusion from the code.
- *The problem.* `resolveVote` eliminates every seat tied on most votes, and the Centaurs win if *any* Werewolf falls. A
  strong table therefore turns every 50/50 into a deliberate tie at no cost. This one rule would neutralise F2, F3, F6
  and F7.
- *The fix.* Count losses: a tie that takes a Centaur down with a Werewolf is a loss.
- *Legible and cheap.*

**F8b. Consensus traps (reject Herd Panic; second wave for Mirror Mark, Pardon and Chrysalis).**
- *Herd Panic.* Both designers who proposed it ranked it among their least sure, and B2 shows it is fatal at 5 players.
- *Mirror Mark.* A real mixed strategy, but it pushes the day towards vote arithmetic. Test after Blood Price.
- *Secret Pardon.* Interesting, but it needs a new hidden ballot field and is hard for humans to read.

**F9. Honest players given a reason to lie (reject this build).**
- *Dying Curse* (B1): a caught wolf names an information role to steal the win. In substance this is the Assassin of a
  well-known published hidden-role game. Rejected.
- *Reflection* (B3) duplicates our existing Hybrid.
- *Ward* (B4) is, in its author's words, "too mild".
- *Fox's Silence* (B2) needs a claim-tag system and its author doubts it.
- *Verdict.* The family is right in principle. F3 (the Biter) and the Oxpecker below already create the same effect
  structurally: a sincere-looking player whose side is hidden.

**F10. Timeline fog (reject).**
- It conflicts with the owner's public, fixed timetable.
- Three of the four designers marked it as least sure.
- Against enumerating AIs it multiplies the possible worlds for both sides alike, which is noise and not a floor.
- *Hidden Deck List* (B2) is cheap and potent but changes the game's identity. Second wave.

**F11. Communication attacks (reject).**
- An AI table answers forgery with signing protocols; a typing budget (Ink) taxes humans more than AIs.
- Fixed chat rounds (Moonlit Rounds) and message interception (Interceptor) restructure chat for a gain the logic
  mechanics already deliver.
- The owner asked us to prefer logic over communication taxes.

**Third faction (adopt with one original rule).**
- *The problem.* Three of the four "wants to die" creatures (Puffcap's Blight, Ashmoth, Hollow Stag) are, in substance,
  the published Tanner and its rule that a Tanner's death denies the wolves. Our engine's current `win: "dies"` ("wins
  alone, everyone else loses") is a stricter Tanner.
- *My fix: the Sporeling.* The cost of its death falls on **its voters**, not on a team. That is original, it gives
  every individual vote a price, and it makes the most suspicious player a personal risk to vote for.
- *Life cycle.* I add B2's **Moth**. Night movers turn it into an Imago, which wants to die. It is cheap because it
  reads the existing `moved` list, and it is original.
- *Symbiont.* The linked-death "Lichen" (B2) is the lovers of another published werewolf game, so I keep only the
  bond-and-follow form.
- *Scavenger.* All four scavengers reward multiple eliminations. Blood Price already makes those visibly bad for
  Centaurs, so a scavenger would be easy to spot. Second wave.

**Existing roles that are published roles in substance.**
- **Sagittarius** is a known published role exactly: if eliminated, takes their vote target down. Retire it.
- **Sage, Centaur and Rustler** echo generic seer, centre-peek and robber archetypes. The Centaur is owner-mandated, and
  the Rustler's peek-then-optional-trade is distinct enough. Keep them.

## 3. Recommendation

### 3.1 Rule changes (apply to every deck)

**R1. Blood Price.**
- *Rule:* The Centaur team wins only if more Werewolves than Centaurs are eliminated.
  - A **Werewolf** is an eliminated player holding a `wolf`-tagged card.
  - A **Centaur** is an eliminated player whose final team is Centaur.
  - Allies, creatures, Imagos and bitten players count as neither.
- *Unchanged:* with no wolf card held, the Centaurs win only if nobody is eliminated.
- *For players:* "A tie that takes down a Centaur along with a Werewolf is a loss for the Centaurs."

**R2. Pack and Den Census.**
- *Rule:* Every `pack`-tagged card begins its turn by seeing the other seats dealt `pack` cards and the list of roles
  dealt to the centre (the census: the roles, not their positions).
- *Lone scent:* the lone-wolf scent applies only when no other `pack` card was dealt.
- *For players:* "Wolves see each other and learn which roles lie in the centre, but not where."

**R3. Proclamations at dawn.** All Herald (and Forger) proclamations are published together at dawn, in random order,
each marked "Herald's turn, true at that moment".

**R4. A random vote never curses.** A vote the game casts for an absent player never triggers the Sporeling's curse.

### 3.2 New and changed defector cards

Each card is given as exact rule, then the two-sentence player text.

**Stalking Horse** (Werewolf team, tags `pack`, wake 11, max 1).
- *Rule:* It runs the pack step (R2) and the lone scent if no other `pack` card was dealt. If an eliminated player holds
  the Stalking Horse, the Werewolf team wins, overriding Blood Price.
- *Player text:* "You wake with the Werewolves and know what they know, but you are not a Werewolf. If you are eliminated,
  your team wins, even if a Werewolf falls too."

**Glamour** (Werewolf, tags `wolf pack`, wake 12, max 1).
- *Rule:*
  - It runs the pack step.
  - It names any one card (a player's or a centre card) and any role in the deck.
  - For the rest of the night, every look at that card returns the named role and its team. This covers player reads,
    centre glances, Herald proclamations, Cuckoo and Oxpecker looks, and scents.
  - Werewolf-team actions and the Herder's count see the truth.
  - The glamour travels with the card.
- *Player text:* "Cast a glamour on one card: until dawn, anyone who looks at it sees the role you chose. You can hide
  yourself, vouch for a friend, or frame an innocent."

**Moon-Thief** (Werewolf, tags `wolf pack`, wake 13, max 1).
- *Rule:*
  - At night it runs the pack step only.
  - During the day, the player *dealt* this card may queue one swap of two other players' cards with `day.queueSwap`,
    changeable or clearable until votes lock.
  - The swap happens when votes lock, before anything is counted. Every card-dependent rule (vote weight, every win)
    uses the cards after the swap.
- *Player text:* "During the day, secretly queue a swap of two other players' cards. It happens the instant voting ends,
  before anyone is counted."

**Forger** (changed; Werewolf ally, no tags, wake 42, max 1; requires a Herald in the deck).
- *Rule:*
  - It sees what the Herald proclaimed tonight, or that nothing was proclaimed.
  - It then names one centre card and one role in the deck. At dawn that is proclaimed exactly like a Herald proclamation.
  - The unsigned-chat power is removed.
- *Player text:* "You see the Herald's proclamation, then forge one of your own about any centre card. At dawn nobody can
  tell which is which."

**Eavesdropper** (Werewolf, tags `wolf pack`, wake 93, max 1).
- *Rule:*
  - It runs the pack step.
  - It names one non-pack role that has a night turn.
  - If a player was dealt that role (with two copies, the first one clockwise), it receives a copy of everything that
    player learned tonight, Rustler trades included.
  - If nobody was dealt it, the engine performs that role's looks from the Eavesdropper's seat on random legal targets
    and gives it those true results. No swaps are made and the Eavesdropper is not told which case happened.
- *Player text:* "Name a role: you learn exactly what its holder learned tonight. If nobody holds it, you secretly get a
  real result of your own as if you did."

**Biter** (Werewolf, tags `wolf pack`, wake 96, max 1; last of the night).
- *Rule:*
  - It runs the pack step.
  - It looks at one other player's true card. Glamour does not fool it.
  - It may then bite that player, and the step can be queued conditionally on what it saw.
  - If the card is not Werewolf-team, at dawn its holder is told: "You were bitten by seat X. You now win only with the
    Werewolf team. You are not a Werewolf."
  - A bitten creature loses all its creature rules.
- *Player text:* "Look at one player's card, then decide whether to bite them. If you do, they join your side, know it was
  you, and keep everything they learned tonight."

**Werewolf** (changed) gets R2. **Tracker, Whisperer and Spooker** are unchanged. The Tracker's "an information role
sits at seat X" now feeds the Biter's and Eavesdropper's choices.

### 3.3 The third faction: the Wildwood

Creature cards are on the new team `wild` (replacing `lone`) and carry the tag `wild`, except the Moth (see below).
Creatures win or lose alongside the main result.

**Sporeling** (life cycle; no night action).
- *Rule:* Whoever holds it wins if eliminated. Every player who voted for an eliminated Sporeling holder loses, whatever
  else happens (except votes the game cast at random).
- *Player text:* "You win if you are eliminated. Everyone who voted for you then loses, whichever side they were on."

**Moth** (life cycle; Centaur-team card tagged `wild`; no night action).
- *Rule:*
  - At dawn, if the card dealt to the Moth's seat was moved during the night, that seat becomes an **Imago** and is told
    privately.
  - An Imago is a creature that wins only if eliminated, whatever card it holds.
  - Otherwise the holder of the Moth card is a Larva on the Centaur team.
  - The Imago is set at dawn. A Moon-Thief swap does not change it.
- *Player text:* "You start as a Centaur. If anyone moves your card in the night, you wake as an Imago and then win only
  by being eliminated."

**Cuckoo** (brood parasite; wake 25).
- *Rule:*
  - It looks at one other player's card, then lays its egg on any other player.
  - At dawn everyone sees which seat holds the egg, but not who laid it.
  - If the Cuckoo is in the centre, the engine lays the egg on a random seat, and nobody benefits from it.
  - The win binds to the Cuckoo **card** (as the current prophecy does): whoever holds the Cuckoo wins if the egged seat
    is eliminated and they are not.
  - It replaces the Augur.
- *Player text:* "Look at one player's card, then lay your egg on any other player; everyone sees the egg, nobody knows
  whose it is. You win if the egged player is eliminated and you are not."

**Oxpecker** (symbiont; wake 85, after all movers).
- *Rule:* It looks at one other player's card and bonds to that seat. The bond binds to the Oxpecker card. Whoever holds
  it wins exactly when the player in the bonded seat wins. It replaces the Hybrid.
- *Player text:* "Look at one player's card and bond to them. You win exactly when they win, whatever side that turns out
  to be."

**Elderbark** (keystone; wake 8).
- *Rule:* It learns which other seats were dealt `wild` cards (the Moth included). It wins if it is not eliminated and no
  other creature or Imago is. If it is eliminated, no other creature wins.
- *Player text:* "You learn which seats were dealt creatures. You win if no creature is eliminated; if you fall, the
  whole wood loses."

**How the creatures interlock.**
- Every creature turns behaviour into ambiguous evidence:
  - a reckless player may be a Sporeling or an Imago, and voting for them can cost you the game personally;
  - a hard pusher against the egged seat may be the Cuckoo;
  - a defender may be an Oxpecker bonded to a wolf.
- Elderbark's map is true. That makes "I'm Elderbark, seat 2 is a creature, don't vote it" the best lie a wolf can tell
  to shield a partner.

### 3.4 Resolution order (replaces `resolveVote`)

1. **Swap.** Apply the Moon-Thief's queued swap, if any.
2. **Tally.** Count votes with held-card weights. The eliminated set E is every seat tied on the most votes, if that
   number is at least 2.
3. **Teams.**
   - A bitten seat is on the Werewolf team and has no creature rules.
   - An Imago seat is `wild`.
   - Every other player is on the team of the card they hold.
4. **Main result.**
   - (a) If someone in E holds the Stalking Horse, the Werewolf team wins.
   - (b) Otherwise, if no player holds a `wolf` card: the Centaurs win if E is empty. If not, the surviving Werewolf-team
     players win (this is the current rule).
   - (c) Otherwise the Centaurs win if W > C, where W is the number of `wolf` cards in E and C is the number of Centaur-team
     players in E. If not, the Werewolf team wins.
   - Every member of the winning team wins, alive or dead (the current rule).
5. **Creatures.**
   - The Sporeling holder and an Imago win if they are in E.
   - The Cuckoo holder wins if the egged seat is in E and the Cuckoo holder is not.
   - The Elderbark holder wins if it is not in E and no other creature or Imago is.
   - If the Elderbark holder is in E, no other creature wins.
6. **Curse.** Remove from the winners every seat whose own (not random) vote went to an eliminated Sporeling holder.
7. **Oxpecker.** The Oxpecker holder wins if its host seat is a winner after step 6 and the Elderbark holder is not in E.
   Then step 6 is applied to the Oxpecker itself.
8. **Report.** The outcome reports, for each seat, *why* they won or lost.

**Worked edge cases.**
- **Sporeling and Werewolf tied and eliminated.** W=1 and C=0, so the Centaurs win. The Sporeling wins. Every Centaur
  who voted for the Sporeling loses. The wolves lose.
- **Sporeling and Centaur tied, with a wolf at the table.** W=0, so the wolves win. The Sporeling wins. Wolves who voted
  for the Sporeling lose too.
- **Werewolf and Centaur tied.** W=1 and C=1, so the Werewolves win. This is the case Blood Price exists for.
- **Stalking Horse and Werewolf tied.** The Werewolf team wins, by rule (a).
- **Nobody eliminated** (every seat got 1 vote, or no seat got 2).
  - If a wolf card is held, the wolves win.
  - The Elderbark wins.
  - The Sporeling, any Imago and the Cuckoo lose.
  - The Oxpecker follows its host.
- **Sporeling card moved.** If a Spooker rotated the Sporeling to a seat dealt Sage, that player is now the Sporeling
  without knowing it. Their voters are cursed if they fall. The Elderbark's map still points at the seat that was dealt it.
- **A creature card ends in the centre.**
  - Sporeling: the curse cannot trigger.
  - Cuckoo: its egg is still public but benefits nobody.
  - Oxpecker: the bond is held by nobody, and the player who was dealt the Oxpecker wins by whatever card they now hold.
- **Moon-Thief moves the Sporeling onto the table's target.** The target wins as the Sporeling and its voters are
  cursed. This is legal and deadly, but the Thief cannot see cards, so it needs a Sporeling who has given itself away.
  Watch for it in tests.
- **Imago holding a Werewolf card is eliminated.** W=1, so the Centaurs win, and the Imago also wins by its own rule.
- **Oxpecker bonded to a seat that is later bitten.** It wins with the wolves, unknowingly. The bite comes at wake 96,
  after the bond at 85.

### 3.5 Roster and wake order

**Wake order.**
Dusk → Elderbark 8 → Werewolf 10 → Stalking Horse 11 → Glamour 12 → Moon-Thief 13 → Tracker 15 → Whisperer 20 →
Cuckoo 25 → Sage 30 → Centaur 35 → Herald 40 → Forger 42 → Rustler 45 → Farrier 50 → Spooker 55 → Herder 80 →
Oxpecker 85 → Sentry 90 → Eavesdropper 93 → Biter 96.

At dawn:
- the bite notice and any Imago notice are delivered;
- the egg and the proclamations are published.

**No night turn:** Chiron, Signet, Sporeling, Moth.

**What happens to each role.**

| | Roles |
| --- | --- |
| **Keep** | Sage, Centaur, Herald (now released at dawn), Rustler, Farrier, Herder, Sentry, Chiron, Signet, Tracker, Whisperer, Spooker |
| **Change** | Werewolf (gains Census), Forger (proclamation instead of unsigned chat) |
| **Add** | Stalking Horse, Glamour, Moon-Thief, Eavesdropper, Biter; Sporeling, Moth, Cuckoo, Oxpecker, Elderbark |
| **Retire** | Sagittarius (published role in substance), Augur (folded into the Cuckoo), Hybrid (folded into the Oxpecker). The `chat: "unsigned"` primitive stays in the code with no card using it. |

### 3.6 Implementation in this engine

**State** (`GameState` and `Game`):
- `tokens: Record<slotKey, { glamour?: RoleId }>`, carried along by `swap` and `rotate`;
- `bitten?: { seat, by }`;
- `egg?: number`;
- generalise `prophecy` into `marks: Record<RoleId, number>` (for the Cuckoo and Oxpecker);
- `imago?: number`, set at dawn from `moved`;
- `shown[].release: "dawn"`;
- `Game.daySwap?: { a, b }`.

**Effects:**
- `census`;
- `glamour` (a slot plus a role);
- `overhear` (a role; copies the target seat's `LogEvent`s, or runs a ghost look);
- `bite` (conditional, like the Rustler's `trade`);
- `egg` (public, with a random fallback when unheld);
- `bond`.

**Supporting changes:**
- `look` and `announce` read through `tokens` unless the actor is `pack`.
- Tags change: `pack` drives `learnSeats` and `onlyIfAlone`; `wolf` drives elimination.
- The team `lone` becomes `wild`.

**Registry:**
- `night.planStep`'s decision schema gains an optional `role` on `pick` decisions, plus `role`-only decisions for steps
  declaring `names: "deckRole"`. Every night action still goes through the one command.
- New: `day.queueSwap { a, b }` and `day.clearSwap`, available only to the player dealt the Moon-Thief (a new
  `dayPower` field in `CommandContext`, mirroring `chatPower`).
- Remove `chat.sendUnsigned`.

**Visibility.**
- Each actor sees their own results.
- At dawn:
  - the bitten seat sees its notice;
  - the Imago sees its new status;
  - everyone sees the egg seat and the proclamations, which carry no forged flag.
- The Moon-Thief sees its queued swap.
- Glamour tokens, the forged flag, the eavesdrop target and the day swap appear only in the post-game log.

**What the MCP view (`convex/agent.ts`) must say to an AI.**
- A `caveats` list built from the deck, for example "Glamour is in this deck: any card you looked at may have shown a
  disguise" and "a Forger is in this deck: one proclamation may be forged".
- `you.status` for bitten and Imago players, with the changed win condition.
- `day.yourSwap` for the Moon-Thief.
- `day.warning`: "If you vote for whoever holds the Sporeling and they are eliminated, you lose."
- `legalRoles` on every step that names a role.
- The resolution order (3.4), added to `RULES`.
- A per-seat `why` in `result`.

**Lobby checks** (`deckProblem`):
- a Forger needs a Herald;
- every `pack` card has max 1, except Werewolf (3).

## 4. Second wave

**Promising but riskier; test after the first build.**
- **Mirror Mark.** A wolf secretly marks a seat; if the marked seat tops the vote outright, the runner-up is eliminated
  instead. It is a mixed strategy, and it is only sound once Blood Price makes ties costly.
- **Hollow Mask.** Two identical Mask cards, one secretly on the wolf side. It gives the same floor as the Horse, but in
  two-card form.
- **Bitten (passive).** A card that turns wolf-side if anyone views it. That puts a price on investigation.
- **Moon-Eye / Moon-sight.** Wolves learn every final card, or the full trace of moves. A fallback if Census tests weak.
- **Hidden Deck List.** Players see a pool of roles, but the real deck is a secret subset of it. A big, cheap lever on
  reason 1, but it changes the game's identity.
- **Crier's Choice.** A wolf picks which of three true statements the engine announces.
- **Ghoul.** A wolf who voted with the crowd for an eliminated player swaps cards with them afterwards.
- **Secret Pardon.** Every vote comes with a secret pardon; a player pardoned twice cannot be eliminated.
- **Chrysalis.** A creature that, if eliminated, hatches and sends the runner-up out instead.
- **Carrion Crow or Kite** (scavenger). Viable once we know how often multiple eliminations happen under Blood Price.

**Rejected.**
- **Mirage.** The engine falsifies one seat's information each night: random noise.
- **Drifting Slot, Family Turns, Veiled Hour.** Fog that breaks the public timetable.
- **Herd Panic.** Brittle and fatal at 5 players.
- **Interceptor, Ink, the chat Mimic, Moonlit Rounds.** Communication taxes.
- **Dying Curse.** In substance a published assassin role.
- **Reflection.** Duplicates the Hybrid.
- **Ward and Fox's Silence.** Too mild.
- **Hollow Stag, Puffcap Blight, Ashmoth.** Tanner rules.
- **Lichen's linked death.** The published lovers.
- **Changeling Pact and Undertow.** Vote arithmetic.

## 5. Play-test plan

**Method: the natural experiment.**
- In every deck, each card is held with probability players ÷ (players + centre): 62% at 5/3, 45% at 5/6, 64% at 7/4.
- So every deck can be analysed by stratifying games on "mechanic X held vs in the centre". That isolates several
  mechanics inside one deck.
- Use fixed deal seeds across the arms of a comparison so that only the rule varies.
- Run 150 games per arm, which gives about ±8 points (95%). Treat effects under 10 points as unresolved.

**Metrics for every deck.**
- Wolf-side win rate.
- Multi-elimination rate.
- Claim-collision rate.
- **Fooled vs floored:** was the table's top suspect at vote time holding a wolf card? If yes and the wolves still won,
  they won on a floor. If no, they won by deception.
- Human ratings (tension, fun, "felt fair") from human or mixed tables.

**Target.** At strong tables, the wolf side wins 40 to 55 percent, and creatures win in no more than 25 percent of the
games that contain any creature.

**Decks.**

| # | Deck (players/centre) | Cards | Hypothesis, signal, cut rule |
| --- | --- | --- | --- |
| C1 | **Control-5** (5/3; also 5/6 with +Centaur, Farrier, Herder) | Werewolf×2, Sage, Centaur×2, Herald, Rustler, Sentry | Three arms: legacy rules; +Blood Price; +Blood Price and Census. BP: +5 to 10 points for wolves, multi-elimination drops by half. Census: +3 points at 3 centre cards, +10 at 6. Cut or retune Census (show only 3 centre roles) if wolves exceed 65% at 6. |
| C2 | **Control-7** (7/4) | the current `recommendedDeck(7,4)` | Legacy vs BP and Census, at scale. |
| T1 | **Horse** (5/3) | Werewolf, Stalking Horse, Sage, Centaur×2, Rustler, Sentry, Herder | In "two liars left" endgames the table picks the wolf about 50% of the time. Cut if above 70% (a tell exists) or wolves exceed 65% overall. |
| T2 | **Glamour** (5/4) | Glamour, Werewolf, Sage, Centaur×2, Herald, Rustler, Farrier, Sentry | Track the honest players eliminated after a glamoured read, and the distribution of glamour targets. Cut if the effect is under 3 points, or if wolves win over 70% when it is held. |
| T3 | **Eavesdropper** (7/4) | Werewolf, Eavesdropper, Tracker, Sage, Centaur×2, Herald, Rustler, Farrier, Herder, Sentry | Track duel frequency and duel accuracy. Retune if duel accuracy is over 65%; cut if wolves exceed 65%. |
| T4 | **Biter** (7/3) | Werewolf, Biter, Sage, Herald, Centaur×2, Rustler, Farrier, Herder, Sentry | Track which role gets bitten, how often the bitten player is identified, and wolf wins by bitten role. Cut if identification is over 60%. Nerf (stop telling the victim the seat) if wolves exceed 65% when a seer is bitten. |
| T5 | **Thief and Forger** (5/5) | Werewolf, Moon-Thief, Forger, Herald, Sage, Centaur×2, Rustler, Farrier, Sentry | Stratify by which is held. Thief: track how often the swap hits the voted seat and the human "felt fair" rating; cut if fairness falls by a point or more. Forger: cut if the forgery is identified 80% of the time or more. |
| T6 | **Wildwood** (5/4) | Werewolf×2, Sage, Centaur, Rustler, Sentry, Sporeling, Cuckoo, Elderbark | Track the Sporeling elimination rate (aim 10 to 30%), how many players are cursed, and creature win share. Retune if the Sporeling is eliminated under 5% (inert) or over 40%. |
| X1 | **Combo-5** (5/3) | Werewolf, Glamour, Stalking Horse, Sage, Centaur, Herald, Sentry, Sporeling | Wolf side 45 to 55%. If above 60%, remove the mechanic whose held-stratum lift is largest. |
| X2 | **Combo-7** (7/6) | Werewolf, Eavesdropper, Biter, Stalking Horse, Sage, Herald, Centaur×2, Farrier, Sentry, Moth, Cuckoo, Oxpecker | The full ecosystem. Watch for degeneracy: wolves over 65%, creatures over 30%, or the table "not voting at all" (most games ending with nobody eliminated). |

**Testing the owner's premise directly.** The harness sets model and effort per seat, but teams come from the deal.
1. **Add a test hook** that seeds the deal and lets the harness assign agents to seats *after* dealing, by dealt team.
2. **Run three pairings on C1, C2, X1 and X2:**
   - strong Centaurs vs weak wolves (the owner's premise);
   - strong vs strong;
   - weak Centaurs vs strong wolves.
3. **Add homogeneous all-strong and all-weak tables** as anchors.

**How to read the results.**
- **Premise holds** if, in the control decks, strong Centaurs facing weak wolves push the wolf side below 30%.
- **A mechanic is a floor** if the wolf side stays at 35% or more even against strong Centaurs with weak wolves. The Horse,
  Biter and Moon-Thief should be.
- **A mechanic rewards deception skill** if strong wolves beat weak wolves by 10 points or more against strong Centaurs.
  Glamour, the Eavesdropper and Census should.
- **Floor without skill makes a coin-flip game; skill without a floor lets the premise win.** We want both.

## 6. Open questions for the owner

1. **Blood Price as a core rule** (it changes "any Werewolf eliminated" for every deck).
   *Recommendation:* yes. Without it, every floor mechanic is hedged away by deliberate ties.
2. **Moon-Thief's day swap** can undo a correct deduction after the fact. Is that the game you want humans to feel?
   *Recommendation:* include it in testing, gate it to 7+ players, and cut it first if the "felt fair" rating drops.
3. **Individual losses inside a winning team** (the Sporeling's curse), and seat-level scoring in the tournament.
   *Recommendation:* accept both. The curse is what keeps the faction from being a Tanner.
4. **Retirements:** Sagittarius (a published role in substance), Augur and Hybrid (folded into the Cuckoo and Oxpecker),
   and the unsigned chat power.
   *Recommendation:* retire all four from the roster and from the recommended decks.
5. **The target band.**
   *Recommendation:* the wolf side wins 40 to 55% at strong tables; creatures win in no more than 25% of games containing
   them; and no single held card lifts its side by more than 15 points.
