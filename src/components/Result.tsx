/**
 * The end of a game: the verdict, how it was decided (in the order the engine decides it), every seat's story (dealt,
 * became, ended holding, team, won or lost and why), random votes, cuts and forgeries revealed, and the whole night
 * turn by turn with what each look showed beside what was true.
 */
import type { LogEntry } from "../../shared/engine";
import { ROLE, roleName, type RoleId } from "../../shared/roles";
import { clock, revealHidden, viaLabel } from "../../shared/text";
import { useApp, type View } from "../app/store";
import { rolesInTurn, teamShort } from "../app/teams";
import { Avatar, CommandButton, TeamBadge } from "./bits";
import { verdictTitle } from "./CentreStage";
import { IconArrowRight, IconFlame, IconScissors, IconSeal, IconWifiOff } from "./icons";
import { safeDescribe } from "./PlanBuilder";

type Final = NonNullable<NonNullable<View["game"]>["final"]>;

/**
 * Which physical card each seat holds at the end: the deal's instances moved by every swap, stampede and day swap in
 * the log, in order. Lets a copier's copy and an Heir's Phoenix follow the card that carries them.
 */
export function heldInstances(final: Final): number[] {
  const n = final.dealt.length;
  const seat = final.dealt.map((_, i) => i), centre = final.dealtCenter.map((_, i) => n + i);
  const at = (s: { k: "p" | "c"; i: number }) => (s.k === "p" ? seat : centre);
  for (const e of final.log) {
    const ev = e.ev;
    if (ev.kind === "swap") { const x = at(ev.a)[ev.a.i]; at(ev.a)[ev.a.i] = at(ev.b)[ev.b.i]; at(ev.b)[ev.b.i] = x; }
    if (ev.kind === "rotate") { const held = ev.slots.map(s => at(s)[s.i]); ev.slots.forEach((_, i) => { const t = ev.slots[(i + 1) % ev.slots.length]; at(t)[t.i] = held[i]; }); }
    if (ev.kind === "daySwap") { [seat[ev.a], seat[ev.b]] = [seat[ev.b], seat[ev.a]]; }
  }
  return seat;
}
/** The role a card instance plays as (its copy, if it is a copier that copied). */
const effective = (final: Final, inst: number) => final.adopted[String(inst)] ?? [...final.dealt, ...final.dealtCenter][inst];

export function Result() {
  const { view } = useApp();
  const v = view!, game = v.game!, final = game.final!, mine = game.mine;
  const o = final.outcome;
  const won = mine ? o.winners.includes(mine.seat) : null;
  const viewer = mine?.seat ?? -1;
  const name = (i: number) => (i === viewer ? "you" : v.players[i]?.name ?? `seat ${i}`);
  const held = heldInstances(final);
  const cuts = final.seatEffects ?? [];
  const sealedMsgs = v.messages.filter(m => m.round === v.round && m.seal);
  const forgedShown = final.shown.filter(s => s.forged);
  const nightEnd = game.turns.length;
  return (
    <div className="panel result">
      <section className={`verdict verdict-${o.burned && o.winningTeam === "nobody" ? "pyre" : o.winningTeam}`}>
        {won !== null && <div className={`verdict-you ${won ? "is-won" : "is-lost"}`}>{won ? "You won" : "You lost"}</div>}
        <h2>{verdictTitle(o)}</h2>
        <p>{o.headline}</p>
        {o.notes.map((n, i) => <p key={i} className="verdict-note">{n}</p>)}
        {mine && <p className="verdict-why">{o.why[mine.seat]}</p>}
        <div className="row"><CommandButton id="game.playAgain" variant="primary" /><CommandButton id="room.leave" variant="quiet" /></div>
        {mine && !v.context.host && <p className="quiet small">The host can start another round with the same table.</p>}
      </section>

      <section>
        <h2 className="section-title">How it was decided</h2>
        <ol className="decided">
          {final.daySwap && <li><b>The day swap.</b> {name(final.daySwap.by)} swapped the cards of {name(final.daySwap.a)} and {name(final.daySwap.b)} as the vote ended.</li>}
          <li>
            <b>The votes.</b> {o.tally.some(t => t > 0) ? o.tally.map((t, i) => (t ? `${name(i)} ${t}` : null)).filter(Boolean).join(", ") : "No votes"}. {o.deaths.length ? `Eliminated: ${o.deaths.map(name).join(", ")}.` : `Nobody reached ${final.rules.eliminationVotes} votes with the most: nobody was eliminated.`}
            {final.forcedVotes.length > 0 && <span className="decided-random"> Voted at random (not in time): {final.forcedVotes.map(name).join(", ")}.</span>}
          </li>
          {final.bitten.length > 0 && <li><b>The bitten.</b> {final.bitten.map(b => name(b.seat)).join(", ")} played for the Werewolf team, whatever card they held.</li>}
          <li><b>Centaurs and Werewolves.</b> {o.headline.replace(/ A Phoenix burned[^.]*\./, "")}</li>
          <li className={o.burned ? "is-burn" : ""}><b>The Pyre.</b> {o.burned ? <><IconFlame size={14} /> A Phoenix burned: every Pyre card's holder wins{final.rules.burningDeniesWolves ? ", and the burning denies the Werewolf team" : ""}.</> : "No Phoenix burned."}</li>
          {o.notes.length > 0 && <li><b>Loners.</b> {o.notes.join(" ")}</li>}
        </ol>
      </section>

      {(cuts.length > 0 || sealedMsgs.length > 0 || forgedShown.length > 0) && (
        <section className="reveals">
          <h2 className="section-title">Revealed now</h2>
          {cuts.map((c, i) => (
            <p key={`c${i}`} className="reveal-cut"><IconScissors size={16} /><span><b>{name(c.seat)}</b> did not lose their connection{c.from ? ` at ${new Date(c.from).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}: <b>{name(c.by)}</b> ({roleName(c.source)}) cut them off for {clock(c.until - c.from)}.</span></p>
          ))}
          {sealedMsgs.map(m => (
            <p key={m.id} className={m.forged ? "reveal-forged" : "reveal-sealed"}><IconSeal size={16} /><span>The message sealed as the {m.seal ? roleName(m.seal) : ""} was posted by <b>{m.mine ? "you" : m.name}</b>{m.forged ? <>, and the seal was <b>forged</b></> : ", and the seal was genuine"}: “{m.text.length > 90 ? `${m.text.slice(0, 88)}…` : m.text}”</span></p>
          ))}
          {forgedShown.map((s, i) => (
            <p key={`s${i}`} className="reveal-forged"><IconSeal size={16} /><span>The proclamation that {s.slot.k === "c" ? `centre card ${s.slot.i + 1}` : name(s.slot.i)} was <b>{roleName(s.role)}</b> was <b>forged</b>, published as the {roleName(s.by)}'s.</span></p>
          ))}
        </section>
      )}

      <section>
        <h2 className="section-title">Every seat</h2>
        <ol className="reveal-list">
          {v.players.map((p, k) => {
            const seat = p.seat, dealt = final.dealt[seat], inst = held[seat];
            const heldRole = final.cards[seat], plays = effective(final, inst);
            const became = final.adopted[String(seat)] as RoleId | undefined;
            const phoenixAtDawn = final.phoenixInst.includes(inst);
            const vote = final.votes[seat], random = final.forcedVotes.includes(seat);
            const dead = o.deaths.includes(seat), w = o.winners.includes(seat);
            const cut = cuts.filter(c => c.seat === seat);
            return (
              <li key={p.id} className={`reveal-row${dead ? " is-dead" : ""}${w ? " is-won" : ""}`} style={{ ["--k" as string]: k }}>
                <span className="reveal-who"><Avatar name={p.name} bot={p.bot} size="sm" /><b>{p.name}</b>{p.me && <span className="seat-you">you</span>}
                  <span className="top-space" />{w ? <span className="tag tag-win">won</span> : <span className="tag tag-lost">lost</span>}{dead && <span className="tag tag-dead">eliminated</span>}
                </span>
                <span className="reveal-cards">
                  <img src={`/art/${dealt}.webp`} alt="" title={`Dealt ${roleName(dealt)}`} />
                  {became && <><IconArrowRight size={13} /><img src={`/art/${became}.webp`} alt="" title={`Became ${roleName(became)}`} className="is-copy" /></>}
                  {heldRole !== dealt && <><IconArrowRight size={13} /><img src={`/art/${heldRole}.webp`} alt="" title={`Ended holding ${roleName(heldRole)}`} /></>}
                  <span className="reveal-names">
                    Dealt <b>{roleName(dealt)}</b>{became ? <>, became <b>{roleName(became)}</b></> : null}
                    {heldRole === dealt && !became ? ", kept it" : <>, ended holding <b>{roleName(heldRole)}</b>{plays !== heldRole ? <> (a copy of {roleName(plays)})</> : null}</>}
                    {phoenixAtDawn ? ", which became a Phoenix at dawn" : ""}.
                  </span>
                </span>
                <span className="reveal-why">{o.why[seat]}</span>
                <span className="reveal-meta">
                  <TeamBadge team={o.teams[seat]} short />
                  <span>{o.tally[seat]} vote{o.tally[seat] === 1 ? "" : "s"} against</span>
                  <span className={random ? "reveal-random" : "quiet"}>{vote === null ? "did not vote" : random ? `did not vote in time: voted at random for ${name(vote)}` : `voted for ${name(vote)}`}</span>
                  {cut.map((c, i) => <span key={i} className="reveal-cut-tag"><IconWifiOff size={12} /> cut off by {name(c.by)}</span>)}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="reveal-centre">
          <span className="eyebrow">In the centre at the end</span>
          <div>{final.center.map((r, i) => <span key={i} className="reveal-centre-card"><img src={`/art/${r}.webp`} alt="" /><span>{roleName(r)}</span>{final.dealtCenter[i] !== r && <i className="quiet">dealt {roleName(final.dealtCenter[i])}</i>}</span>)}</div>
        </div>
        <p className="quiet small">Deal seed {final.dealSeed ?? "?"}{final.nightSeed !== null ? ` · night seed ${final.nightSeed}` : ""}{final.fingerprint ? ` · scenario ${final.fingerprint}` : ""}</p>
      </section>

      <section>
        <h2 className="section-title">What happened in the night</h2>
        <ol className="log">
          {game.turns.map((t, i) => {
            const entries = final.log.filter(e => e.turn === i);
            if (!t.role && !entries.length) return null;
            const kin = t.role ? rolesInTurn(t.role, v.settings.deck) : [];
            const held = t.role ? kin.some(r => final.dealt.includes(r)) || entries.length > 0 : true;
            return (
              <li key={i} className={entries.length ? "" : "is-empty"}>
                <div className="log-turn">{t.role ? <img src={`/art/${t.role}.webp`} alt="" /> : null}<b>{t.role ? kin.map(roleName).join(" + ") || roleName(t.role) : "Dusk"}</b>{t.role && <span className="quiet small">{teamShort(ROLE[t.role]?.team)}</span>}</div>
                {entries.length ? <LogLines entries={entries} v={v} viewer={viewer} />
                  : <p className="quiet small">{held ? "Nothing happened." : "Nobody was dealt this card: the turn passed in silence."}</p>}
              </li>
            );
          })}
          {[{ at: nightEnd, title: "Dawn" }, { at: nightEnd + 1, title: "The day" }].map(({ at, title }) => {
            const entries = final.log.filter(e => e.turn === at);
            return entries.length ? <li key={title}><div className="log-turn"><b>{title}</b></div><LogLines entries={entries} v={v} viewer={viewer} /></li> : null;
          })}
        </ol>
      </section>
    </div>
  );
}

/** Log lines, with what a look showed beside what was true when a distortion was at work. */
function LogLines({ entries, v, viewer }: { entries: LogEntry[]; v: View; viewer: number }) {
  return (
    <ul>
      {entries.map((e, k) => {
        const truth = e.hidden?.truth;
        const shown = e.ev.kind === "look" && e.ev.roles ? e.ev.roles : e.ev.kind === "announce" ? e.ev.roles : null;
        const rest = e.hidden ? revealHidden({ ...e, hidden: { ...e.hidden, truth: shown && truth ? undefined : truth } }, v) : "";
        return (
          <li key={k} className={truth ? "is-distorted" : ""}>
            {safeDescribe(e, v, viewer)}{rest && <span className="log-hidden">{rest}</span>}{viaLabel(e) && <span className="via"> · {viaLabel(e)}</span>}
            {shown && truth && (
              <span className="seen-true">
                {shown.map((r, i) => (
                  <span key={i} className={`seen-pair${r !== truth[i] ? " is-false" : ""}`}>
                    <span className="seen-side"><img src={`/art/${r}.webp`} alt="" /><span><i>seen</i> {roleName(r)}</span></span>
                    <span className="seen-side is-true"><img src={`/art/${truth[i]}.webp`} alt="" /><span><i>true</i> {roleName(truth[i])}</span></span>
                  </span>
                ))}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
