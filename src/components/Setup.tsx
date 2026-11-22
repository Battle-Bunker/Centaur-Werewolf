/**
 * The lobby: who is here, the table's rules, the deck (built by team, with art), the centre and the timers, the
 * play-test deal (play-test tables only), then Start. Every control is a registry command; everything is drawn from
 * the role and rule data, so new cards and new rules appear here without changes.
 */
import { useMemo, useState } from "react";
import { TIMERS } from "../../shared/commands";
import { deckProblem } from "../../shared/engine";
import { CENTER_MAX, CENTER_MIN, ROLE, ROLES, TEAM_NAME, type RoleDef, type RoleId } from "../../shared/roles";
import { DEFAULT_RULES, describeRules, RULE_DEF, type RuleDef, type RuleId } from "../../shared/settings";
import { useApp, useCommand, useNow, type View } from "../app/store";
import { actsAtNight, TEAM_NOTE, TEAMS } from "../app/teams";
import { Avatar, CommandButton } from "./bits";
import { IconBot, IconCrown, IconFlask, IconLink, IconMinus, IconMoon, IconPlus, IconSearch, IconShuffle, IconSun } from "./icons";

export function Setup() {
  const { view, ctx } = useApp();
  const v = view!;
  const players = v.players.length, center = v.settings.centerCount;
  const need = players + center, have = v.settings.deck.length;
  const problem = deckProblem(v.settings.deck, players, center, v.settings.rules);
  const gap = need - have;
  const people = (
    <section key="people">
      <h2 className="section-title">At the table <span className="count">{players}</span></h2>
      <ul className="people">
        {v.players.map(p => (
          <li key={p.id}>
            <span className="people-avatar"><Avatar name={p.name} bot={p.bot} size="sm" /></span>
            <span className="people-name">{p.name}{p.me && <span className="seat-you">you</span>}</span>
            {p.host && <span className="tag"><IconCrown size={12} /> host</span>}
            {p.bot && <span className="tag"><IconBot size={12} /> bot</span>}
            {!p.bot && !p.me && <Presence p={p} />}
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
  );
  return (
    <div className="panel setup">
      {v.playtest && (
        <section className="playtest-note">
          <IconFlask size={18} />
          <p><b>A play-test table.</b> {ctx.host ? "You may fix the next deal below, and you will see every card during the game." : "The host may fix the deal and sees every card during the game."} {v.fixedDeal ? <b>The next deal is fixed.</b> : "The next deal is random."}</p>
        </section>
      )}
      {players < 3 && people}
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
        <p className="quiet small">One card per player plus {center} for the centre. Any card may appear more than once. {gap > 0 ? <b className="warn-text">Add {gap} more.</b> : gap < 0 ? <b className="warn-text">Take {-gap} out.</b> : "Just right."}</p>
        <div className="row"><CommandButton id="setup.useRecommended" variant="plain" icon={<IconShuffle size={16} />} /></div>
        <DeckBuilder v={v} host={ctx.host} />
      </section>

      <RulesSection v={v} />

      <section>
        <h2 className="section-title">Timers</h2>
        {(Object.keys(TIMERS) as (keyof typeof TIMERS)[]).map(t => <TimerField key={t} timer={t} value={v.settings[`${t}Seconds`] ?? 20} playtest={v.playtest} />)}
        <p className="quiet small">Every night turn lasts exactly the turn time, whether or not anyone holds that role. The discussion ends early when every player is ready; the vote ends early when everyone has voted. A move or vote not made in time is made at random.</p>
      </section>

      {v.playtest && ctx.host && <FixDeal v={v} />}

      {players >= 3 && people}
      <section className="panel-foot">
        {problem ? <p className="foot-problem"><b>Before you can start:</b> {problem}</p> : <p className="foot-ready">Everything is ready.</p>}
        <CommandButton id="game.start" variant="primary" className="btn-block">{ctx.host ? "Deal the cards and begin" : "Waiting for the host to start"}</CommandButton>
        <CommandButton id="room.leave" variant="quiet" />
      </section>
    </div>
  );
}

/** A player's connection, as everyone sees it: the server's liveness, recomputed against the clock. */
export function Presence({ p, compact }: { p: View["players"][number]; compact?: boolean }) {
  const state = usePresence(p);
  if (state === "bot") return null;
  return <span className={`presence is-${state}${compact ? " is-compact" : ""}`} title={state === "online" ? "Connected" : "Not connected: no word from them for a while."}><span className="presence-dot" aria-hidden />{!compact && (state === "online" ? "online" : "offline")}<span className="sr-only">{state}</span></span>;
}
export function usePresence(p: View["players"][number]): "online" | "offline" | "bot" {
  const { view, serverNow } = useApp();
  useNow(1000);
  if (p.bot) return "bot";
  if (p.me) return "online";
  const limit = view?.presence.onlineTimeoutMs ?? 16000;
  return p.lastSeenAt !== null && serverNow() - p.lastSeenAt < limit ? "online" : "offline";
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

/** The whole roster, team by team: search it, show only what is in the deck, add and remove copies. */
function DeckBuilder({ v, host }: { v: View; host: boolean }) {
  const [q, setQ] = useState("");
  const [onlyIn, setOnlyIn] = useState(!host);
  const deck = v.settings.deck;
  const match = (r: RoleDef) => !q.trim() || `${r.name} ${r.blurb}`.toLowerCase().includes(q.trim().toLowerCase());
  return (
    <div className="deck-builder">
      <div className="deck-tools">
        <label className="deck-search"><IconSearch size={15} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${ROLES.length} cards`} aria-label="Search the cards" /></label>
        <label className="check"><input type="checkbox" checked={onlyIn} onChange={e => setOnlyIn(e.target.checked)} /> Only cards in the deck</label>
      </div>
      {TEAMS.map(team => {
        const all = ROLES.filter(r => r.team === team);
        const list = all.filter(r => match(r) && (!onlyIn || deck.includes(r.id)));
        const inDeck = deck.filter(id => ROLE[id]?.team === team).length;
        if (!list.length) return null;
        return (
          <details key={team} className={`deck-group team-${team}`} open={!!q.trim() || onlyIn || inDeck > 0 || team === TEAMS[0]}>
            <summary className="deck-group-head"><span className="team-pip" /><b>{TEAM_NAME[team]}</b><span className="deck-group-count">{inDeck ? `${inDeck} in the deck` : "none in the deck"}</span><span className="quiet small deck-group-note">{TEAM_NOTE[team] ?? ""}</span></summary>
            <ul className="deck">
              {list.map(r => <DeckRole key={r.id} r={r} count={deck.filter(x => x === r.id).length} host={host} />)}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function DeckRole({ r, count, host }: { r: RoleDef; count: number; host: boolean }) {
  const { setDialog } = useApp();
  const tags = [
    actsAtNight(r) ? (r.twinOf ? `Night, in the ${ROLE[r.twinOf]?.name}'s turn` : r.turnOf ? `Night, in the shared ${ROLE[r.turnOf]?.name} turn` : "Night") : null,
    r.chat || r.dayPower || r.vote ? "Day" : null,
  ].filter(Boolean) as string[];
  return (
    <li className={`deck-role${count ? " is-in" : ""}`}>
      <button type="button" className="deck-role-art" onClick={() => setDialog({ kind: "roles", role: r.id })} title={`${r.name}: ${r.blurb} (open the role reference)`}>
        <img src={`/art/${r.id}.webp`} alt="" loading="lazy" />
        {count > 0 && <span className="deck-role-count" aria-hidden>{count}</span>}
      </button>
      <div className="deck-role-text">
        <b>{r.name}{r.twinOf && <span className="twin-tag" title={`A shadow twin of the ${ROLE[r.twinOf]?.name}`}>twin</span>}</b>
        <span className="quiet">{r.blurb}</span>
        {tags.length > 0 && <span className="deck-role-tags">{tags.map(t => <span key={t} className="mini-tag">{t.startsWith("Night") ? <IconMoon size={11} /> : <IconSun size={11} />}{t}</span>)}</span>}
      </div>
      {host ? (
        <div className="stepper" role="group" aria-label={`${r.name}: ${count} in the deck`}>
          <CommandButton id="setup.removeRole" args={{ role: r.id }} variant="quiet" aria-label={`Take a ${r.name} out`} icon={<IconMinus size={14} />}><span className="sr-only">Remove</span></CommandButton>
          <span className="stepper-n">{count}{r.max < 12 && <i>/{r.max}</i>}</span>
          <CommandButton id="setup.addRole" args={{ role: r.id }} variant="quiet" aria-label={`Add a ${r.name}`} icon={<IconPlus size={14} />}><span className="sr-only">Add</span></CommandButton>
        </div>
      ) : <span className="stepper-n" aria-label={`${count} in the deck`}>{count ? `×${count}` : ""}</span>}
    </li>
  );
}

/** The table's rule settings: every player sees them; the host changes them, one registry command per change. */
function RulesSection({ v }: { v: View }) {
  const rules = describeRules(v.settings.rules);
  const changed = rules.filter(r => !r.isDefault);
  return (
    <section className="rules">
      <div className="section-head">
        <h2 className="section-title">Table rules</h2>
        <span className="quiet small">{changed.length ? `${changed.length} changed from the usual` : "The usual rules"}</span>
      </div>
      <p className="quiet small">Every player sees these. They decide how the night and the count work at this table.</p>
      <ul className="rule-list">
        {rules.map(r => <RuleRow key={r.rule} def={RULE_DEF[r.rule]} value={r.value} means={r.means} isDefault={r.isDefault} />)}
      </ul>
    </section>
  );
}

function RuleRow({ def, value, means, isDefault }: { def: RuleDef; value: unknown; means: string; isDefault: boolean }) {
  const set = useCommand("setup.setRule");
  const go = (next: unknown) => { if (next !== value) void set.run({ rule: def.id, value: next }); };
  const why = set.can.ok ? def.tooltip : set.can.reason;
  return (
    <li className={`rule-row${isDefault ? "" : " is-changed"}`}>
      <div className="rule-row-head">
        <b id={`rule-${def.id}`}>{def.title}</b>
        {!isDefault && <span className="rule-changed" title={`Usually ${JSON.stringify(DEFAULT_RULES[def.id as RuleId])}`}>changed</span>}
        <span className="top-space" />
        {def.kind === "boolean" && (
          <button type="button" role="switch" aria-checked={!!value} aria-labelledby={`rule-${def.id}`} className={`switch${value ? " is-on" : ""}`} disabled={!set.can.ok} title={why} onClick={() => go(!value)}>
            <span className="switch-knob" /><span className="switch-text">{value ? "On" : "Off"}</span>
          </button>
        )}
        {def.kind === "number" && (
          <span className="stepper" title={why}>
            <button type="button" className="btn btn-quiet" disabled={!set.can.ok || (value as number) <= def.min} onClick={() => go((value as number) - 1)} aria-label={`Lower ${def.title}`}><IconMinus size={14} /></button>
            <span className="stepper-n">{String(value)}</span>
            <button type="button" className="btn btn-quiet" disabled={!set.can.ok || (value as number) >= def.max} onClick={() => go((value as number) + 1)} aria-label={`Raise ${def.title}`}><IconPlus size={14} /></button>
          </span>
        )}
      </div>
      {def.kind === "choice" && (
        <div className="segmented segmented-text" role="radiogroup" aria-labelledby={`rule-${def.id}`}>
          {def.options.map(o => <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`segment${value === o.value ? " is-on" : ""}`} disabled={!set.can.ok} title={set.can.ok ? o.means : set.can.reason} onClick={() => go(o.value)}>{o.value}</button>)}
        </div>
      )}
      <p className="rule-means">{means}</p>
    </li>
  );
}

function TimerField({ timer, value, playtest }: { timer: keyof typeof TIMERS; value: number; playtest: boolean }) {
  const { max, label } = TIMERS[timer];
  const min = playtest && (timer === "dusk" || timer === "turn") ? 1 : TIMERS[timer].min;
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

/**
 * Play-test tables, host only: fix the next deal. Seating (who sits where), the card each seat is dealt (the centre
 * takes the rest of the deck), a seed for whatever is left random, and a night seed that makes every random draw of
 * the night and the count repeatable (scenario replay).
 */
function FixDeal({ v }: { v: View }) {
  const fixed = v.settings.fixedDeal;
  const ids = v.players.map(p => p.id);
  const deck = v.settings.deck;
  const [seatOn, setSeatOn] = useState(!!fixed?.seats);
  const [seats, setSeats] = useState<string[]>(() => (fixed?.seats && fixed.seats.length === ids.length ? fixed.seats : ids));
  const [cardsOn, setCardsOn] = useState(!!fixed?.cards);
  const [cards, setCards] = useState<(RoleId | "")[]>(() => fixed?.cards ? fixed.cards.slice(0, ids.length) : ids.map(() => ""));
  const [seed, setSeed] = useState(fixed?.seed !== undefined ? String(fixed.seed) : "");
  const [nightSeed, setNightSeed] = useState(fixed?.nightSeed !== undefined ? String(fixed.nightSeed) : "");
  const order = seats.filter(id => ids.includes(id)).concat(ids.filter(id => !seats.includes(id)));
  const name = (id: string) => v.players.find(p => p.id === id)?.name ?? "?";
  const move = (i: number, d: number) => { const o = [...order]; const j = i + d; if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; setSeats(o); };
  const seatCards = ids.map((_, i) => cards[i] ?? "");
  const centre = useMemo(() => { const rest = [...deck]; for (const c of seatCards) { const k = c ? rest.indexOf(c) : -1; if (k >= 0) rest.splice(k, 1); } return rest; }, [deck, seatCards.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = (i: number) => { const used = seatCards.filter((c, j) => j !== i && c); const rest = [...deck]; for (const c of used) { const k = rest.indexOf(c); if (k >= 0) rest.splice(k, 1); } return [...new Set(rest)]; };
  const cardsReady = seatCards.every(Boolean) && deck.length === ids.length + v.settings.centerCount;
  const num = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s.trim()) : undefined);
  const args: Record<string, unknown> = {
    ...(num(seed) !== undefined ? { seed: num(seed) } : {}),
    ...(num(nightSeed) !== undefined ? { nightSeed: num(nightSeed) } : {}),
    ...(seatOn ? { seats: order } : {}),
    ...(cardsOn && cardsReady ? { cards: [...seatCards, ...centre] } : {}),
  };
  const nothing = !Object.keys(args).length;
  return (
    <section className="fixdeal">
      <h2 className="section-title"><IconFlask size={16} /> Fix the next deal</h2>
      <p className="quiet small">Only at a play-test table. What you fix stays fixed for every round until you clear it; what you leave open is random. Players see only that the deal is fixed.</p>
      {fixed && <p className="fixdeal-now"><b>Fixed now:</b> {[fixed.seats && "seating", fixed.cards && "cards", fixed.seed !== undefined && `seed ${fixed.seed}`, fixed.nightSeed !== undefined && `night seed ${fixed.nightSeed}`].filter(Boolean).join(", ")}.</p>}
      <label className="check"><input type="checkbox" checked={seatOn} onChange={e => setSeatOn(e.target.checked)} /> Fix who sits where</label>
      <label className="check"><input type="checkbox" checked={cardsOn} onChange={e => setCardsOn(e.target.checked)} /> Fix who is dealt what</label>
      {(seatOn || cardsOn) && (
        <ol className="fixdeal-seats">
          {(seatOn ? order : ids).map((id, i) => (
            <li key={id}>
              <span className="fixdeal-n">{seatOn ? `Seat ${i}` : ""}</span>
              <span className="fixdeal-name">{name(id)}</span>
              {seatOn && <span className="fixdeal-move"><button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${name(id)} up`}>↑</button><button type="button" className="icon-btn" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${name(id)} down`}>↓</button></span>}
              {cardsOn && (
                <select className="input fixdeal-card" value={seatCards[i]} aria-label={`Card for seat ${i}`} onChange={e => setCards(c => { const n = ids.map((_, k) => c[k] ?? ""); n[i] = e.target.value; return n; })}>
                  <option value="">Choose a card…</option>
                  {[...new Set([...(seatCards[i] ? [seatCards[i]] : []), ...left(i)])].map(r => <option key={r} value={r}>{ROLE[r]?.name ?? r}</option>)}
                </select>
              )}
            </li>
          ))}
        </ol>
      )}
      {cardsOn && <p className="quiet small">Seat order is seat 0 first{seatOn ? "" : " (in the seating the deal draws; fix the seating too to know who gets which)"}. The centre gets the rest: {centre.map(r => ROLE[r]?.name ?? r).join(", ") || "nothing"}.{!cardsReady && <b className="warn-text"> Choose a card for every seat, with a full deck.</b>}</p>}
      <div className="fixdeal-seeds">
        <label className="field"><span className="field-label">Deal seed</span><input className="input" inputMode="numeric" value={seed} onChange={e => setSeed(e.target.value.replace(/\D/g, ""))} placeholder="random" /></label>
        <label className="field"><span className="field-label">Night seed</span><input className="input" inputMode="numeric" value={nightSeed} onChange={e => setNightSeed(e.target.value.replace(/\D/g, ""))} placeholder="random" /></label>
      </div>
      <p className="quiet small">The night seed fixes every random draw of the night and the count, so a scenario replays exactly when everyone queues the same moves.</p>
      <div className="row">
        <CommandButton id="setup.fixDeal" args={args} variant="secondary" disabled={nothing}>Fix this deal</CommandButton>
        <CommandButton id="setup.clearDeal" variant="quiet" disabled={!fixed}>Clear</CommandButton>
      </div>
    </section>
  );
}
