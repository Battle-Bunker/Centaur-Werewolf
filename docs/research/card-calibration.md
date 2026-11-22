# Per-card power calibration (theory, before any new games)

Written before the research games, from the rules as built (docs/rules-reference.md, after the merge of the copiers and
the Pyre) and from how all-Opus tables played in rounds 1 and 2 (sim/runs/round1, round2). Every judgment here is a
prediction to be tested.

## The calibration principle

The owner's target is that **talk decides**. So a card's power should act on **beliefs and on what can credibly be
said**, never decide the outcome after the talking is over. Three kinds of power follow:

1. **Credibility power (wanted).** The card lets its holder make a claim the table cannot refute mechanically, or makes
   an honest player sincerely say something false. The table can only answer by modelling incentives: who would say
   this, and why now. (Twins, Eavesdropper, Spooker's direction, Glamour, Lure, Forger, Counterfeiter, False Witness,
   Biter, copiers, Stalking Horse.)
2. **Information power (needed, in measure).** True facts that constrain the space of worlds (Sage, Notary, Herald,
   Herder, Sentry, Centaur, census). Too much and the table reaches certainty by first-order elimination (talk-dead
   for the Centaurs); too little and nobody can reason at all (noise).
3. **After-talk power (unwanted).** The card's effect is chosen or applied after the discussion has revealed where the
   votes will go, so that what was said no longer matters (Moon-Thief's swap, the Ember-Carrier's ember, a Hush cut
   during the vote phase). These make the table's consensus self-defeating: the stronger the consensus, the surer the
   after-talk card wins. That is the owner's Pyre-swap example, and its first test is the degeneracy screen (I4).

Two structural facts shape everything:
- **Held, not dealt.** You act by the card dealt and win by the card held. Every night mover makes some honest player
  unsure of his own team, and the table must reason about where cards went. Path dependence comes from this: an honest
  player can discover mid-discussion, from others' claims, that he now holds a wolf, and switch from truth to lies.
- **Blood Price + secret ballot + closed chat in the vote.** The Centaurs cannot hedge with a tie that takes down a
  Centaur, and a split vote that eliminates nobody is a wolf win whenever a wolf is held. So the Centaurs need real
  consensus; the wolves win by splitting it. This is what makes persuasion, not just deduction, decisive.

## Cards

Power: **W** too weak, **F** fine, **S** too strong, **?** depends on roster; "credible" = what it lets its holder
say that the table cannot refute.

### Werewolf team

| Card | Who benefits / what it lets you credibly say | Counter-play through talk | Power |
| --- | --- | --- | --- |
| Werewolf | Pack + census: can claim a centre role safely ("I'm the Farrier") because it knows no one holds it. | Positional cross-checks: Centaur/Farrier glances at the exact centre slot; Sentry movement. | F (the baseline) |
| Stalking Horse | Its elimination wins for the wolves; it wakes with the pack, so it and a Werewolf know the same things. A credible "I'm a pack member" is a trap. | Only reads (Sage, Notary) tell Horse from Wolf; the table must model "who wants to be voted". | F to S: S at 5p where one pack pair often IS the only lead. |
| Glamour | Wolf that makes one look sincere-but-false (frame a Centaur as a Werewolf, or clear itself). | Count-checking claims vs the deck; asking who could have been glamoured; looks taken later by movers. | F (pure belief-manipulation) |
| Moon-Thief | Swaps two other players' cards as the vote ends: once the table's consensus is visible, the doomed wolf card is moved onto an unvoted Centaur. | Only: find and eliminate the Thief itself (its own card cannot move), or vote unpredictably (which forfeits consensus). | **S (after-talk)**. Prediction X1. |
| Tracker | Knows one info role's seat: can counter-claim it or avoid it. | Little; it is mild. | F (mild) |
| Whisperer | Knows one wolf; can vouch, or bus it. | Ordinary minion counter-play. | F (mild) |
| Forger | A forged proclamation identical to the Herald's: an engine-backed lie, but two proclamations reveal one is false. | Which proclamation fits the claims; the Herald cannot prove which was his. | F (needs a Herald) |
| Spooker | Blind 3-rotation; its claimed DIRECTION and targets are uncheckable (round 2: a reversed-direction lie won a game). | Reasoning about what a wolf-side mover would say; the Sentry constrains which seats moved, not where. | F (a model credibility card) |
| Eavesdropper | Wolf with an exact copy of a role's true results: two players can make the same true claim. | Outside evidence touching one seat; who claimed first; whose story fits the census-informed liar. | F to S: a pure mirror duel can be a coin flip (noise). |
| Biter | Converts an informed Centaur into a wolf-sider who keeps true results and knows a wolf. | Hard: only corroboration-only policies; the bitten's selective lies. | S at small tables (one bite of the Sage removes the Centaurs' main information). |
| Will-o'-Wisp | One look shows a random wrong role. | Same as Glamour, but nobody chose it, so nobody can model it. | W as a deception tool; adds **noise** (judge risk). |
| Mistweaver / Fogbank | One player's centre looks show a chosen / random wrong role. | Centre facts get cross-checked by others. | W (Fogbank is noise) |
| Poacher | Must swap with a player: the Poacher's actor joins the victim's team (with full knowledge), the victim becomes an unknowing wolf ally. Mostly hands the actor to the Centaurs. | n/a | W (helps the Centaurs more than the wolves) |
| Counterfeiter | One forged seal (Signet text or Notary report) identical to a real one. If the real Notary is in the centre, a fully credible lie; if not, a duel the forger may lose. | Real Notary withholds its seal to bait the forger (second-order); seal content vs other claims. | F (needs Signet/Notary) |
| Hush | Cuts one player off for 60 s. In discussion: silences a key voice (belief power). In the vote phase (`cutDuringVote` on, default): the victim's vote becomes random, decided after talk. | In discussion: others relay the victim's information. In the vote: none. | **S in the vote phase (after-talk)**; F in discussion only. Change request CR-2. |
| Moonsage | Sage twin, on the wolf team, reads as a Sage: can truthfully describe a Sage's night. Not pack, no census. | Read cross-checks; who knows what a liar could not; the real Sage's corroborations. | F (model card) |
| Dun Centaur | A Werewolf that truthfully describes a Centaur's centre glance; unknown to the pack. | As for any Centaur claim. | F (mild) |
| Pale Herald | A true but chosen proclamation from the wolf side. | Little needed. | W (it publishes a truth) |
| Dusk Rustler | Wolf with a Rustler's peek; trading dumps its wolf on the victim and sends the actor to the Centaurs, so a rational one never trades. | As for Rustler. | F (as a wolf with a peek) |
| Stray Herder | False Herder with the true count. | Herder duel. | F (mild) |

### Centaur team

| Card | What it lets you credibly say | Counter-play by defectors | Power |
| --- | --- | --- | --- |
| Sage | "X was dealt/holds Y" (as of its turn). The table's main lead. | Counter-claims, twins, Glamour/Lure, later moves, bites. | F (S without any defector credibility card: then the Centaurs win by first-order logic) |
| Centaur | One centre card: refutes claims to that role. | Census-informed wolves avoid it. | F (filler with teeth) |
| Herald | A public, anonymous fact about the centre. | Forger; Pale Herald. | F (S at 5p without a Forger: shrinks the claim space) |
| Notary | A read plus a SEALED report: proves the sender was dealt Notary. Unforgeable without a Counterfeiter/False Witness: a confirmed Centaur (by deal) with a confirmed read. | Counterfeiter / False Witness; movement after its turn. | **S without a forger in the deck** (talk-dead reads); F with one. |
| Rustler | Peek + optional trade. Seeing a wolf, it may TAKE it and become a knowing wolf, leaving the old wolf an unknowing Centaur: a path-dependent defection by choice. | Sentry; peeks of others. | F |
| Farrier | Peek centre + optional gift to self or clockwise neighbour: plants unknowing allegiance changes. | As for any mover claim. | F |
| Cutpurse | Mandatory swap + look: knows exactly what it became (a knowing defector if it took a wolf). | As for any mover claim. | F |
| Pickpocket / Latecomer | Mandatory BLIND swap: neither side knows; allegiance is learned during the discussion, from others' claims. | n/a | F; the most direct engine of path dependence, but noise if too many. |
| Drifter | Swap with the centre + look. | n/a | F |
| Herder | True count of wolf cards in the centre. Hard constraint on claims. | Stray Herder; census-informed liars. | F (S with no Werewolf-side credibility card) |
| Sentry | Which nearby cards moved (not where). | Spooker's direction; blind movers. | F |
| Chiron | Holder's vote counts 2 (held, not dealt). | Claims to be Chiron are unverifiable; a moved Chiron votes for the wrong side. | F |
| Signet | One sealed free text: proves the sender was dealt Signet (a confirmed coordinator by deal). | Counterfeiter / False Witness. | F to S (a confirmed coordinator is strong at small tables) |
| Gleaner (copier) | Copies a centre card's TRUE identity (a wolf in the centre makes it a knowing, pack-seeing wolf the pack does not know); acts in that role's turn. | As for the copied role. | F: adds true duplicate claims and night defections. |
| Echo (copier) | Copies a player's card (it sees it: a Sage read at wake 3, before any move) and becomes it: a second Sage, Rustler, ... or a Werewolf. | As for the copied role. | F to S: early true read for the Centaurs, and a duplicate claim for everyone. |

### The Pyre

| Card | What it does to talk | Counter-play | Power |
| --- | --- | --- | --- |
| Phoenix | Wants to be eliminated (a Tanner whose burning, by default, denies the wolves too, so Centaurs and wolves are briefly allies against it). Must look guilty without looking like a Tanner. | "Never eliminate a self-accuser"; wolves (census) know when the Phoenix is in the centre and can expose a fake. | F |
| Kindler | Knows the dealt Phoenix seat: steers votes to it, invents reads. | Ordinary counter-claiming. | F (mild) |
| Lure | Distorts one look (dress the Phoenix as a Werewolf): honest seers sincerely condemn the Phoenix. | Count-check vs census-informed wolf claims; reasoning about who benefits from that read. | F to S (it makes the Centaurs' best tool frame the Phoenix) |
| False Witness | Forged seal for the Pyre. | As for the Counterfeiter. | F |
| Ember-Carrier | As the vote ends, swaps a Phoenix card with a seat it chose after hearing the discussion: whoever the table is about to eliminate becomes the Phoenix. | Only by eliminating the Ember-Carrier itself (unidentifiable) or by voting unpredictably (no consensus, a wolf win). | **S: degenerate (after-talk)**. The owner's prediction; X2 below. Redesign pending in the build session. |
| Heavy Hand | Its vote counts 2 for a Phoenix holder: two weighted votes reach the elimination threshold alone, so a scattered table burns the Phoenix. | Concentrate votes (consensus) elsewhere. | F: it punishes scatter, which aligns with target 2. Possibly S at 5p. |
| Heir | Guarantees a Phoenix exists when the dealt one is in the centre. | n/a | F |

### Loners

| Card | Note | Power |
| --- | --- | --- |
| Cuckoo | Public egg on a seat; whoever holds the Cuckoo wants that seat eliminated. Adds a private motive to push a vote. Unheld, the egg is random (a random draw: avoid in fixed scenarios). | F |
| Oxpecker | Wins with a bonded seat: a player with a hidden ally. | F (mild) |

## Rules settings

- `cutDuringVote` (default on): after-talk power. Proposed default off (CR-2).
- `thiefMinPlayers` 7: keeps the Moon-Thief out of small tables; it is still after-talk at 7+ (X1).
- Vote timer 20 s (default) is for people; an AI player needs about 15-40 s for one turn. AI tables use 60 s, otherwise
  missed votes become random and add noise the game does not have with people.
- `burningDeniesWolves` on: makes Centaurs and wolves allies against the Phoenix: good for third-order talk.
- `pyreFallback` "kindler": with the Phoenix in the centre, the Kindlers want one of THEMSELVES eliminated: they become
  Tanners; fine.
