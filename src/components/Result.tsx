/** The end of a game: the verdict, every card dealt and held, who voted for whom, and the whole night turn by turn. */
import { ROLE, roleName, TEAM_NAME } from "../../shared/roles";
import { describe, viaLabel } from "../../shared/text";
import { useApp } from "../app/store";
import { Avatar, CommandButton, TeamBadge } from "./bits";
import { verdictTitle } from "./CentreStage";
import { IconArrowRight } from "./icons";

export function Result() {
  const { view } = useApp();
  const v = view!, game = v.game!, final = game.final!, mine = game.mine;
  const o = final.outcome;
  const won = mine ? o.winners.includes(mine.seat) : null;
  const viewer = mine?.seat ?? -1;
  const name = (i: number) => (i === viewer ? "you" : v.players[i]?.name ?? `seat ${i + 1}`);
  const prophecies = Object.entries(final.prophecy);
  return (
    <div className="panel result">
      <section className={`verdict verdict-${o.winningTeam}`}>
        {won !== null && <div className={`verdict-you ${won ? "is-won" : "is-lost"}`}>{won ? "You won" : "You lost"}</div>}
        <h2>{verdictTitle(o.winningTeam, o.winners.length ? roleName(final.cards[o.winners[0]]) : "")}</h2>
        <p>{o.headline}</p>
        {o.notes.map((n, i) => <p key={i} className="verdict-note">{n}</p>)}
        <p className="quiet">{o.deaths.length ? `Eliminated: ${o.deaths.map(name).join(", ")}.` : "Nobody was eliminated."}</p>
        {prophecies.map(([r, seat]) => (
          <p key={r} className="verdict-note">The {roleName(r)} foretold that {seat === -1 ? "nobody" : name(seat)} would be eliminated: {(seat === -1 ? !o.deaths.length : o.deaths.includes(seat)) ? "it came true" : "it did not come true"}.</p>
        ))}
        <div className="row"><CommandButton id="game.playAgain" variant="primary" /><CommandButton id="room.leave" variant="quiet" /></div>
        {mine && !v.context.host && <p className="quiet small">The host can start another round with the same table.</p>}
      </section>

      <section>
        <h2 className="section-title">Every card</h2>
        <ol className="reveal-list">
          {v.players.map((p, k) => {
            const dealt = final.dealt[p.seat], held = final.cards[p.seat], vote = final.votes[p.seat];
            const dead = o.deaths.includes(p.seat), w = o.winners.includes(p.seat);
            return (
              <li key={p.id} className={`reveal-row${dead ? " is-dead" : ""}${w ? " is-won" : ""}`} style={{ ["--k" as string]: k }}>
                <span className="reveal-who"><Avatar name={p.name} bot={p.bot} size="sm" /><b>{p.name}</b>{p.me && <span className="seat-you">you</span>}</span>
                <span className="reveal-cards">
                  <img src={`/art/${dealt}.webp`} alt="" title={`Dealt ${roleName(dealt)}`} className={dealt === held ? "is-same" : ""} />
                  {dealt !== held && <><IconArrowRight size={14} /><img src={`/art/${held}.webp`} alt="" title={`Ended holding ${roleName(held)}`} /></>}
                  <span className="reveal-names">{dealt === held ? <>Kept <b>{roleName(held)}</b></> : <>Dealt {roleName(dealt)}, ended <b>{roleName(held)}</b></>}</span>
                </span>
                <span className="reveal-meta">
                  <TeamBadge team={o.teams[p.seat]} short />
                  <span>{o.tally[p.seat]} vote{o.tally[p.seat] === 1 ? "" : "s"}</span>
                  <span className="quiet">voted {vote === null ? "nobody" : v.players[vote]?.name}{final.forcedVotes.includes(p.seat) ? " (random)" : ""}</span>
                  {dead && <span className="tag tag-dead">eliminated</span>}
                  {w && <span className="tag tag-win">won</span>}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="reveal-centre">
          <span className="eyebrow">In the centre</span>
          <div>{final.center.map((r, i) => <span key={i} className="reveal-centre-card"><img src={`/art/${r}.webp`} alt="" /><span>{ROLE[r].name}</span></span>)}</div>
        </div>
      </section>

      <section>
        <h2 className="section-title">What happened in the night</h2>
        <ol className="log">
          {game.turns.map((t, i) => {
            if (!t.role) return null;
            const entries = final.log.filter(e => e.turn === i);
            return (
              <li key={i} className={entries.length ? "" : "is-empty"}>
                <div className="log-turn"><img src={`/art/${t.role}.webp`} alt="" /><b>{ROLE[t.role].name}</b><span className="quiet small">{TEAM_NAME[ROLE[t.role].team]}</span></div>
                {entries.length
                  ? <ul>{entries.map((e, k) => <li key={k}>{describe(e, v, viewer)}{viaLabel(e) && <span className="via"> · {viaLabel(e)}</span>}</li>)}</ul>
                  : <p className="quiet small">{final.dealt.includes(t.role) ? "Nothing happened." : "Nobody was dealt this card: it lay in the centre."}</p>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
