/** The lobby: who is here, the deck (built by team, with art and limits), the centre and the timers, then Start. */
import { useState } from "react";
import { TIMERS } from "../../shared/commands";
import { deckProblem } from "../../shared/engine";
import { CENTER_MAX, CENTER_MIN, ROLES, TEAM_NAME, type RoleDef, type Team } from "../../shared/roles";
import { useApp, useCommand } from "../app/store";
import { Avatar, CommandButton } from "./bits";
import { IconBot, IconCrown, IconLink, IconMinus, IconPlus, IconShuffle } from "./icons";

const TEAMS: { team: Team; note: string }[] = [
  { team: "werewolf", note: "Werewolves and their allies win if no Werewolf is eliminated." },
  { team: "centaur", note: "The Centaurs win if a Werewolf is eliminated." },
  { team: "lone", note: "Play for themselves, alongside whoever wins." },
];

export function Setup() {
  const { view, ctx } = useApp();
  const v = view!;
  const players = v.players.length, center = v.settings.centerCount;
  const need = players + center, have = v.settings.deck.length;
  const problem = deckProblem(v.settings.deck, players, center);
  const gap = need - have;
  return (
    <div className="panel setup">
      <section>
        <h2 className="section-title">At the table <span className="count">{players}</span></h2>
        <ul className="people">
          {v.players.map(p => (
            <li key={p.id}>
              <span className="people-avatar"><Avatar name={p.name} bot={p.bot} size="sm" /></span>
              <span className="people-name">{p.name}{p.me && <span className="seat-you">you</span>}</span>
              {p.host && <span className="tag"><IconCrown size={12} /> host</span>}
              {p.bot && <span className="tag"><IconBot size={12} /> bot</span>}
              <span className="top-space" />
              {p.me ? <CommandButton id="room.rename" variant="quiet">Rename</CommandButton> : <CommandButton id="room.remove" args={{ player: p.id }} variant="quiet" aria-label={`Remove ${p.name}`}>Remove</CommandButton>}
            </li>
          ))}
        </ul>
        <div className="row">
          <CommandButton id="ui.copyInvite" variant="plain" icon={<IconLink size={16} />}>Copy invite link</CommandButton>
          <CommandButton id="room.addBot" variant="plain" icon={<IconBot size={16} />} />
        </div>
        {players < 3 && <p className="hint">You need at least 3 players. Invite friends with the link, or add practice bots to try it alone.</p>}
      </section>

      <section>
        <h2 className="section-title">Centre cards</h2>
        <p className="quiet small">Cards that lie face down in the middle, held by nobody. More of them means more roles that might not be at the table, so claims are harder to check.</p>
        <div className="segmented" role="radiogroup" aria-label="Centre cards">
          {Array.from({ length: CENTER_MAX - CENTER_MIN + 1 }, (_, k) => CENTER_MIN + k).map(n => <CentreOption key={n} n={n} on={center === n} />)}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2 className="section-title">Deck</h2>
          <span className={`meter${gap === 0 ? " is-ok" : ""}`} aria-label={`${have} of ${need} cards`}>
            <span className="meter-text"><b>{have}</b> / {need}</span>
            <span className="meter-bar"><span style={{ transform: `scaleX(${Math.min(1, have / Math.max(1, need))})` }} /></span>
          </span>
        </div>
        <p className="quiet small">One card per player plus {center} for the centre. {gap > 0 ? <b className="warn-text">Add {gap} more.</b> : gap < 0 ? <b className="warn-text">Take {-gap} out.</b> : "Just right."}</p>
        <div className="row"><CommandButton id="setup.useRecommended" variant="plain" icon={<IconShuffle size={16} />} /></div>
        {TEAMS.map(({ team, note }) => (
          <div key={team} className={`deck-group team-${team}`}>
            <div className="deck-group-head"><span className="team-pip" /><b>{TEAM_NAME[team]}</b><span className="quiet small">{note}</span></div>
            <ul className="deck">
              {ROLES.filter(r => r.team === team).map(r => <DeckRole key={r.id} r={r} count={v.settings.deck.filter(x => x === r.id).length} host={ctx.host} />)}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2 className="section-title">Timers</h2>
        {(Object.keys(TIMERS) as (keyof typeof TIMERS)[]).map(t => <TimerField key={t} timer={t} value={v.settings[`${t}Seconds`]} />)}
        <p className="quiet small">Every night turn lasts exactly the turn time, whether or not anyone holds that role. A player who has not decided when their turn ends gets a random move.</p>
      </section>

      <section className="panel-foot">
        {problem ? <p className="foot-problem"><b>Before you can start:</b> {problem}</p> : <p className="foot-ready">Everything is ready.</p>}
        <CommandButton id="game.start" variant="primary" className="btn-block">{ctx.host ? "Deal the cards and begin" : "Waiting for the host to start"}</CommandButton>
        <CommandButton id="room.leave" variant="quiet" />
      </section>
    </div>
  );
}

function CentreOption({ n, on }: { n: number; on: boolean }) {
  const { can, run, def } = useCommand("setup.setCenter", { count: n });
  return (
    <button type="button" role="radio" aria-checked={on} className={`segment${on ? " is-on" : ""}`} disabled={!can.ok} title={can.ok ? def.tooltip : can.reason} onClick={() => { if (!on) void run(); }}>
      <span className="segment-cards" aria-hidden>{Array.from({ length: n }, (_, i) => <i key={i} />)}</span>
      <b>{n}</b>
    </button>
  );
}

function DeckRole({ r, count, host }: { r: RoleDef; count: number; host: boolean }) {
  const { setDialog } = useApp();
  return (
    <li className={`deck-role${count ? " is-in" : ""}`}>
      <button type="button" className="deck-role-art" onClick={() => setDialog({ kind: "roles", role: r.id })} title={`${r.name}: ${r.blurb} (open the role reference)`}>
        <img src={`/art/${r.id}.webp`} alt="" loading="lazy" />
        {count > 0 && <span className="deck-role-count" aria-hidden>{count}</span>}
      </button>
      <div className="deck-role-text">
        <b>{r.name}</b>
        <span className="quiet">{r.blurb}</span>
      </div>
      {host ? (
        <div className="stepper" role="group" aria-label={`${r.name}: ${count} of at most ${r.max}`}>
          <CommandButton id="setup.removeRole" args={{ role: r.id }} variant="quiet" aria-label={`Take a ${r.name} out`} icon={<IconMinus size={14} />}><span className="sr-only">Remove</span></CommandButton>
          <span className="stepper-n">{count}<i>/{r.max}</i></span>
          <CommandButton id="setup.addRole" args={{ role: r.id }} variant="quiet" aria-label={`Add a ${r.name}`} icon={<IconPlus size={14} />}><span className="sr-only">Add</span></CommandButton>
        </div>
      ) : <span className="stepper-n" aria-label={`${count} in the deck`}>{count ? `×${count}` : ""}</span>}
    </li>
  );
}

function TimerField({ timer, value }: { timer: keyof typeof TIMERS; value: number }) {
  const { min, max, label } = TIMERS[timer];
  const step = timer === "day" ? 30 : 5;
  const [text, setText] = useState<string | null>(null);
  const set = useCommand("setup.setTimer");
  const go = (n: number) => { const c = Math.max(min, Math.min(max, Math.round(n))); if (c !== value) void set.run({ timer, seconds: c }); };
  const commit = () => { const n = Number(text); if (text !== null && Number.isFinite(n)) go(n); setText(null); };
  const why = set.can.ok ? `${min} to ${max} seconds` : set.can.reason;
  const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}` : `${s} s`);
  return (
    <div className="timer" title={why}>
      <span className="timer-label">{label.replace(/ \(.*\)$/, "")}<span className="quiet small">{label.match(/\((.*)\)/)?.[1] ?? ""}</span></span>
      <div className="stepper">
        <button type="button" className="btn btn-quiet" disabled={!set.can.ok || value <= min} onClick={() => go(value - step)} aria-label={`Shorter ${label}`}><IconMinus size={14} /></button>
        <input className="input input-num" inputMode="numeric" aria-label={`${label}, seconds`} disabled={!set.can.ok} value={text ?? String(value)} onChange={e => setText(e.target.value.replace(/\D/g, ""))} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
        <button type="button" className="btn btn-quiet" disabled={!set.can.ok || value >= max} onClick={() => go(value + step)} aria-label={`Longer ${label}`}><IconPlus size={14} /></button>
      </div>
      <span className="timer-human quiet small">{fmt(value)}</span>
    </div>
  );
}
