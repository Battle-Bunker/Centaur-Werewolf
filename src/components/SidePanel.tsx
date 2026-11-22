/** This player's own panel, by phase: table setup, role and night plan, the day journal, the results and full log. */
import { useState } from "react";
import { availability, COMMAND, TIMERS } from "../../shared/commands";
import { deckProblem, type LogEntry } from "../../shared/engine";
import { ROLE, ROLES, TEAM_NAME } from "../../shared/roles";
import { useApp, type View } from "../app/store";
import { describe, viaLabel } from "../app/text";
import { CommandButton, RoleArt, RoleCard, TeamDot } from "./bits";
import { PlanBuilder } from "./PlanBuilder";

export function SidePanel() {
  const { view } = useApp();
  const v = view!;
  if (v.phase === "lobby") return <Lobby v={v} />;
  if (!v.game?.mine && v.phase !== "ended") return <div className="panel"><h2>Watching</h2><p className="quiet">This round started before you sat down. You will be dealt in next round.</p></div>;
  if (v.phase === "night") return <Night v={v} />;
  if (v.phase === "day") return <Day v={v} />;
  return <Ended v={v} />;
}

function Lobby({ v }: { v: View }) {
  const { exec, ctx } = useApp();
  const need = v.players.length + 3;
  const problem = deckProblem(v.settings.deck, v.players.length);
  return (
    <div className="panel">
      <section>
        <h2>Players <span className="count">{v.players.length}</span></h2>
        <ul className="people">
          {v.players.map(p => (
            <li key={p.id}>
              <span className="avatar avatar-sm" aria-hidden>{p.bot ? "⚙" : p.name.slice(0, 1).toUpperCase()}</span>
              <span className="people-name">{p.name}{p.me ? " (you)" : ""}</span>
              {p.host && <span className="tag">host</span>}
              {p.me ? <CommandButton id="room.rename" variant="quiet">Rename</CommandButton> : <CommandButton id="room.remove" args={{ player: p.id }} variant="quiet">Remove</CommandButton>}
            </li>
          ))}
        </ul>
        <div className="row">
          <CommandButton id="ui.copyInvite" variant="plain" />
          <CommandButton id="room.addBot" variant="plain" />
        </div>
      </section>

      <section>
        <h2>Deck <span className={`count${v.settings.deck.length === need ? " is-ok" : ""}`}>{v.settings.deck.length} of {need}</span></h2>
        <p className="quiet">Three cards more than there are players: the extras lie face down in the centre. Listed in wake order.</p>
        <ul className="deck">
          {ROLES.map(r => {
            const count = v.settings.deck.filter(x => x === r.id).length;
            return (
              <li key={r.id} className={count ? "is-in" : ""} title={r.rules}>
                <RoleArt role={r.id} size={44} label="" />
                <div className="deck-text"><b>{r.name}</b> <TeamDot role={r.id} /><span className="quiet">{r.blurb}</span></div>
                {ctx.host ? (
                  <div className="stepper">
                    <CommandButton id="setup.removeRole" args={{ role: r.id }} variant="plain" aria-label={`Remove a ${r.name}`}>−</CommandButton>
                    <span className="stepper-n" aria-label={`${count} in the deck`}>{count}</span>
                    <CommandButton id="setup.addRole" args={{ role: r.id }} variant="plain" aria-label={`Add a ${r.name}`}>+</CommandButton>
                  </div>
                ) : <span className="stepper-n">{count || ""}</span>}
              </li>
            );
          })}
        </ul>
        <div className="row"><CommandButton id="setup.useRecommended" variant="plain" /></div>
      </section>

      <section>
        <h2>Timers</h2>
        {(Object.keys(TIMERS) as (keyof typeof TIMERS)[]).map(t => (
          <TimerField key={t} label={TIMERS[t].label} value={v.settings[`${t}Seconds`]} min={TIMERS[t].min} max={TIMERS[t].max} disabled={!ctx.host}
            why={ctx.host ? "" : availability(COMMAND["setup.setTimer"], ctx).ok ? "" : "Only the host can do this."} onSet={seconds => void exec("setup.setTimer", { timer: t, seconds }).catch(() => {})} />
        ))}
        <p className="quiet">Every night turn lasts exactly the turn time, whether or not anyone holds that role. A player who has not decided when their turn ends gets a random move.</p>
      </section>

      <section className="panel-foot">
        {problem && <p className="warn">{problem}</p>}
        <CommandButton id="game.start" variant="primary" />
        {!ctx.host && <p className="quiet">Waiting for the host to start.</p>}
        <CommandButton id="room.leave" variant="quiet" />
      </section>
    </div>
  );
}

function TimerField({ label, value, min, max, disabled, why, onSet }: { label: string; value: number; min: number; max: number; disabled: boolean; why: string; onSet(n: number): void }) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => { const n = Number(text); if (text !== null && Number.isInteger(n) && n >= min && n <= max && n !== value) onSet(n); setText(null); };
  return (
    <label className="timer" title={disabled ? why : `${min} to ${max} seconds`}>
      <span>{label}</span>
      <input className="input input-num" type="number" min={min} max={max} disabled={disabled} value={text ?? value} onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
      <span className="quiet">s</span>
    </label>
  );
}

function Journal({ entries, v, seat, empty }: { entries: LogEntry[]; v: View; seat: number; empty: string }) {
  if (!entries.length) return <p className="quiet">{empty}</p>;
  return <ol className="journal">{entries.map((e, i) => <li key={i}>{describe(e, v, seat)}{viaLabel(e) && <span className="via"> {viaLabel(e)}</span>}</li>)}</ol>;
}

function Night({ v }: { v: View }) {
  const mine = v.game!.mine!;
  return (
    <div className="panel">
      <section><RoleCard role={mine.dealt} caption="You were dealt" /></section>
      <section><h2>Your night</h2><PlanBuilder /></section>
    </div>
  );
}

function Day({ v }: { v: View }) {
  const mine = v.game!.mine!;
  return (
    <div className="panel">
      <section>
        <RoleCard role={mine.dealt} caption="You were dealt" />
        <p className="quiet">Your card may have been moved after you looked at it. You win or lose by the card in front of you when the votes are counted.</p>
      </section>
      <section>
        <h2>What you did and learned</h2>
        <Journal entries={mine.journal} v={v} seat={mine.seat} empty={ROLE[mine.dealt].steps ? "Nothing happened on your turn." : "You slept through the night."} />
      </section>
      <section>
        <h2>Your vote</h2>
        <p>{mine.vote === null ? "You have not voted. Click a player at the table." : <>You voted for <b>{v.players[mine.vote]?.name}</b>.</>}</p>
        <div className="row"><CommandButton id="day.vote" variant="plain">Choose from a list</CommandButton><CommandButton id="day.clearVote" variant="quiet" /></div>
        <p className="quiet">The day ends when everyone has voted or the timer runs out. Anyone who has not voted then votes at random.</p>
      </section>
    </div>
  );
}

function Ended({ v }: { v: View }) {
  const final = v.game!.final!, mine = v.game!.mine;
  const { outcome } = final;
  const won = mine ? outcome.winners.includes(mine.seat) : null;
  return (
    <div className="panel">
      <section className={`verdict verdict-${outcome.winningTeam}`}>
        <div className="eyebrow">{won === null ? "Result" : won ? "You won" : "You lost"}</div>
        <h2>{outcome.winningTeam === "nobody" ? "Nobody wins" : outcome.winningTeam === "lone" ? "The Glitch wins" : `${TEAM_NAME[outcome.winningTeam]} wins`}</h2>
        <p>{outcome.headline}</p>
        <p className="quiet">{outcome.deaths.length ? `Eliminated: ${outcome.deaths.map(i => v.players[i]?.name).join(", ")}.` : "Nobody was eliminated."}</p>
        <div className="row"><CommandButton id="game.playAgain" variant="primary" /><CommandButton id="room.leave" variant="quiet" /></div>
      </section>
      <section>
        <h2>Cards</h2>
        <table className="results">
          <thead><tr><th>Player</th><th>Dealt</th><th>Ended as</th><th>Votes</th></tr></thead>
          <tbody>
            {v.players.map(p => (
              <tr key={p.id} className={outcome.deaths.includes(p.seat) ? "is-dead" : ""}>
                <td>{p.name}{outcome.winners.includes(p.seat) && <span className="tag tag-win">won</span>}</td>
                <td>{ROLE[final.dealt[p.seat]].name}</td>
                <td><TeamDot role={final.cards[p.seat]} /> {ROLE[final.cards[p.seat]].name}</td>
                <td>{outcome.tally[p.seat]}</td>
              </tr>
            ))}
            <tr><td className="quiet">Centre</td><td colSpan={3}>{final.center.map(r => ROLE[r].name).join(", ")}</td></tr>
          </tbody>
        </table>
      </section>
      <section>
        <h2>What happened in the night</h2>
        <ol className="log">
          {v.game!.turns.map((t, i) => {
            if (!t.role) return null;
            const entries = final.log.filter(e => e.turn === i);
            return (
              <li key={i}>
                <div className="log-turn"><RoleArt role={t.role} size={24} label="" /><b>{ROLE[t.role].name}</b></div>
                {entries.length ? <Journal entries={entries} v={v} seat={mine?.seat ?? -1} empty="" /> : <p className="quiet">{final.dealt.includes(t.role) ? "Nothing happened." : "Nobody held this card: it was in the centre."}</p>}
              </li>
            );
          })}
          <li>
            <div className="log-turn"><b>The vote</b></div>
            <ol className="journal">{v.players.map(p => <li key={p.id}>{p.name} voted for {v.players[final.votes[p.seat]!]?.name}.{final.forcedVotes.includes(p.seat) && <span className="via"> random, did not vote</span>}</li>)}</ol>
          </li>
        </ol>
      </section>
    </div>
  );
}
