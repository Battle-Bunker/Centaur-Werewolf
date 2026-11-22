/**
 * This player's own panel. Two tabs: their own things for the phase (table setup, their card and night plan, what
 * they know and their vote, the result) and the table's chat. On a very wide screen both show at once.
 */
import { useEffect, useRef, useState } from "react";
import { ROLE, roleName, type RoleId } from "../../shared/roles";
import { viaLabel } from "../../shared/text";
import { looseFacts, notices, shownSentence } from "../app/knowledge";
import { myNight } from "../app/night";
import { useApp, usePrevious, type View } from "../app/store";
import { deckWarnings, proclamationForgers } from "../app/teams";
import { Avatar, CommandButton, RoleCard, ordinal } from "./bits";
import { Chat } from "./Chat";
import { IconChat, IconCheck, IconEye, IconFlame, IconHand, IconScissors, IconSeal, IconSwap, IconUndo, IconUser } from "./icons";
import { PlanBuilder, safeDescribe } from "./PlanBuilder";
import { Result } from "./Result";
import { Setup } from "./Setup";
import type { LogEntry } from "../../shared/engine";

function useMedia(q: string) {
  const [on, setOn] = useState(() => matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const f = () => setOn(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, [q]);
  return on;
}

export function SidePanel() {
  const { view, tab, setTab } = useApp();
  const v = view!;
  const split = useMedia("(min-width: 1560px) and (min-height: 760px)") && v.phase !== "night";
  const prevPhase = usePrevious(v.phase);
  // Follow the game: the chat at dawn, your own things at night and at the end.
  useEffect(() => {
    if (!prevPhase || prevPhase === v.phase) return;
    setTab(v.phase === "day" ? "chat" : "mine");
  }, [v.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const chatVisible = split || tab === "chat";
  const others = v.messages.filter(m => !m.mine).length;
  const seen = useRef(others);
  if (chatVisible) seen.current = others;
  const unread = Math.max(0, others - seen.current);

  const label = v.phase === "lobby" ? "Table setup" : !v.game?.mine && v.phase !== "ended" ? "Watching" : v.phase === "night" ? "Your night" : v.phase === "day" ? "Your day" : v.phase === "vote" ? "Your vote" : "Result";
  return (
    <aside className={`side${split ? " is-split" : ""}`} aria-label="Your panel">
      {!split && (
        <div className="side-tabs" role="tablist" aria-label="Panel">
          <button type="button" role="tab" id="tab-mine" aria-selected={tab === "mine"} aria-controls="panel-mine" className="side-tab" onClick={() => setTab("mine")}><IconUser size={16} />{label}</button>
          <button type="button" role="tab" id="tab-chat" aria-selected={tab === "chat"} aria-controls="panel-chat" className="side-tab" onClick={() => setTab("chat")}>
            <IconChat size={16} />Table talk{unread > 0 && <span className="badge" aria-label={`${unread} unread`}>{unread}</span>}
          </button>
        </div>
      )}
      {(split || tab === "mine") && <div className="side-body" role="tabpanel" id="panel-mine" aria-labelledby="tab-mine"><Mine v={v} /></div>}
      {chatVisible && <div className="side-chat" role="tabpanel" id="panel-chat" aria-labelledby="tab-chat">{split && <h2 className="side-chat-title"><IconChat size={16} /> Table talk</h2>}<Chat /></div>}
    </aside>
  );
}

function Mine({ v }: { v: View }) {
  if (v.phase === "lobby") return <Setup />;
  if (v.phase === "ended") return <Result />;
  if (!v.game?.mine) return (
    <div className="panel">
      <section className="empty-state">
        <IconEye size={28} />
        <h2>You are watching</h2>
        <p className="quiet">This round started before you sat down. You see what everyone sees: the turns, the chat and the vote count. You will be dealt in next round.</p>
      </section>
    </div>
  );
  if (v.phase === "night") return <Night v={v} />;
  return <Day v={v} />;
}

function Journal({ entries, v, seat }: { entries: LogEntry[]; v: View; seat: number }) {
  return <ol className="journal">{entries.map((e, i) => <li key={i} className={`journal-${e.ev.kind}`}><img src={`/art/${e.role}.webp`} alt="" /><span>{safeDescribe(e, v, seat)}{viaLabel(e) && <span className="via"> · {viaLabel(e)}</span>}</span></li>)}</ol>;
}

function Night({ v }: { v: View }) {
  const game = v.game!, mine = game.mine!;
  const role = ROLE[mine.dealt];
  const n = myNight(v)!;
  return (
    <div className="panel">
      <section className="panel-hero">
        <RoleCard role={mine.dealt} caption="You were dealt" reveal={game.turn === 0 && Date.now() - game.turns[0].startsAt < 4000}>
          <p className="role-when">{role.steps && n.ownTurn > 0 ? <>You wake <b>{ordinal(n.ownTurn)}</b> of {game.turns.length - 1} turns{role.twinOf ? <>, in the {roleName(role.twinOf)}'s turn</> : role.turnOf && role.turnOf !== role.id ? <>, in the shared {roleName(role.turnOf)} turn</> : null}.</> : "You sleep through the night."}</p>
        </RoleCard>
      </section>
      <Notices v={v} />
      <section>
        <h2 className="section-title">Your night</h2>
        <PlanBuilder />
      </section>
    </div>
  );
}

/** Private notices: a copy, a bite, a card that became a Phoenix. */
function Notices({ v }: { v: View }) {
  const list = notices(v);
  if (!list.length) return null;
  return (
    <section className="notices" aria-live="polite">
      {list.map(n => (
        <div key={n.tone} className={`notice notice-${n.tone}`}>
          {n.role ? <img src={`/art/${n.role}.webp`} alt="" /> : <span className="notice-glyph"><IconFlame size={20} /></span>}
          <div><b>{n.title}</b><p>{n.text}</p></div>
        </div>
      ))}
    </section>
  );
}

function Day({ v }: { v: View }) {
  const game = v.game!, mine = game.mine!;
  const facts = looseFacts(mine.journal);
  const target = mine.vote !== null ? v.players[mine.vote] : null;
  const warnings = deckWarnings(v.settings.deck);
  const meReady = !!game.ready[mine.seat];
  const humans = v.players.filter(p => !p.bot);
  const readyCount = humans.filter(p => game.ready[p.seat]).length;
  const marks = game.marks ?? [];
  return (
    <div className="panel">
      <Notices v={v} />
      {v.phase === "day" ? (
        <section className="vote-box" aria-live="polite">
          <h2 className="section-title">Discussion</h2>
          <p className="quiet small">Voting opens when every player is ready, when the host ends the talk, or when the timer runs out. Then everyone has {v.settings.voteSeconds ?? 20} seconds to vote{v.settings.rules.chatDuringVote ? "" : ", and the chat closes"}.</p>
          <div className={`ready-box${meReady ? " is-on" : ""}`}>
            <CommandButton id="day.ready" args={{ ready: !meReady }} variant={meReady ? "plain" : "primary"} icon={<IconHand size={16} />}>{meReady ? "Not ready after all" : "I am ready to vote"}</CommandButton>
            <span className="ready-count"><b>{readyCount}</b> of {humans.length} ready</span>
          </div>
          <ul className="ready-list" aria-label="Who is ready">
            {humans.map(p => <li key={p.id} className={game.ready[p.seat] ? "is-on" : ""} title={game.ready[p.seat] ? `${p.name} is ready to vote` : `${p.name} is still talking`}><Avatar name={p.name} bot={p.bot} size="sm" /><span>{p.me ? "you" : p.name}</span>{game.ready[p.seat] && <IconCheck size={12} strokeWidth={2.6} />}</li>)}
          </ul>
          {v.context.host && <div className="row"><CommandButton id="day.endDiscussion" variant="quiet" /></div>}
        </section>
      ) : (
        <section className="vote-box is-voting" aria-live="polite">
          <h2 className="section-title">Your vote</h2>
          {target ? (
            <div key={mine.vote} className="vote-cast">
              <span className="vote-cast-avatar"><Avatar name={target.name} bot={target.bot} /></span>
              <div><span className="eyebrow">You vote to eliminate</span><b>{target.name}</b><span className="quiet">Click someone else at the table to change it.</span></div>
            </div>
          ) : (
            <p className="vote-none">You have not voted. <b>Click a player at the table</b> to vote for them. If time runs out, the game votes for you at random.</p>
          )}
          <div className="row">
            <CommandButton id="day.vote" variant="plain">Choose from a list</CommandButton>
            <CommandButton id="day.clearVote" variant="quiet" icon={<IconUndo size={15} />} />
          </div>
        </section>
      )}
      <Powers v={v} />
      <section>
        <h2 className="section-title">What you know</h2>
        {mine.journal.length ? <Journal entries={mine.journal} v={v} seat={mine.seat} /> : <p className="quiet">{ROLE[mine.dealt].steps ? "Nothing happened on your turn." : "You slept through the night: you know only your own card."}</p>}
        {facts.map((f, i) => <p key={i} className="fact">{f}</p>)}
        {game.shown.length > 0 && (
          <div className="shown-list">
            <span className="eyebrow">Proclaimed to everyone{game.shown.some(s => s.atDawn) ? " at dawn" : ""}</span>
            {game.shown.map((s, i) => <p key={i}><img src={`/art/${s.role}.webp`} alt="" /><span>{shownSentence(s, v, mine.seat)}</span></p>)}
            {proclamationForgers(v.settings.deck).length > 0 && <p className="quiet small">A Forger is in this deck: any of these may be forged, and looks exactly like a real one.</p>}
          </div>
        )}
        {marks.length > 0 && marks.map((m, i) => <p key={i} className="fact fact-mark"><img src={`/art/${m.role}.webp`} alt="" />{m.label} lies on <b>{v.players[m.seat]?.name ?? `seat ${m.seat}`}</b>. Everyone sees it; nobody knows who laid it.</p>)}
      </section>
      {warnings.length > 0 && (
        <section className="warnings">
          <h2 className="section-title">At this table, beware</h2>
          <ul>{warnings.map(w => <li key={w.key} className={`warn-${w.key}`}>{w.text}</li>)}</ul>
        </section>
      )}
      <section>
        <RoleCard role={mine.dealt} caption="You were dealt" compact>
          <p className="quiet small">Your card may have been moved since you looked. You win or lose by the card in front of you when the votes are counted{mine.status.bitten ? ", but you were bitten: you play for the Werewolf team" : ""}.</p>
        </RoleCard>
      </section>
    </div>
  );
}

/** The once-per-game powers of the card you were dealt (or became): sealed posts and day actions. */
function Powers({ v }: { v: View }) {
  const ctx = v.context, mine = v.game!.mine!;
  const others = v.players.filter(p => p.seat !== mine.seat);
  const [text, setText] = useState("");
  const [as, setAs] = useState<"signet" | "notary">(() => (ctx.deck.includes("signet") ? "signet" : "notary"));
  const [seat, setSeat] = useState<number | null>(null);
  const [card, setCard] = useState<RoleId>(() => ctx.deck[0] ?? "");
  const [a, setA] = useState<number | null>(mine.daySwap?.a ?? null);
  const [b, setB] = useState<number | null>(mine.daySwap?.b ?? null);
  const look = mine.journal.find(e => e.ev.kind === "look" && e.ev.roles && e.ev.slots.length === 2 && e.ev.slots.every(s => s.k === "p"));
  const seenPair = look?.ev.kind === "look" && look.ev.roles ? look.ev : null;
  const [reportCard, setReportCard] = useState<RoleId | null>(null);
  const [seat2, setSeat2] = useState<number | null>(null);
  const chat = ctx.chatPower, day = ctx.dayPower;
  const swapOn = day === "swap" || !!mine.daySwap;
  if (!chat && !day && !mine.daySwap) return null;
  const seatSelect = (value: number | null, set: (n: number | null) => void, label: string, not?: number | null) => (
    <select className="input" value={value ?? ""} aria-label={label} onChange={e => set(e.target.value === "" ? null : Number(e.target.value))}>
      <option value="">{label}…</option>
      {others.filter(p => p.seat !== not).map(p => <option key={p.id} value={p.seat}>{p.name} (seat {p.seat})</option>)}
    </select>
  );
  const sealers = ["signet", "notary"].filter(r => ctx.deck.includes(r)) as ("signet" | "notary")[];
  return (
    <section className="powers">
      <h2 className="section-title">Your power, once</h2>
      {chat === "signed" && (
        <div className="power-card">
          <p><IconSeal size={16} /> Post one message sealed “the {roleName("signet")}”. It carries no name; a forger's seal looks the same.</p>
          <textarea className="input" rows={2} maxLength={600} value={text} onChange={e => setText(e.target.value)} placeholder="Your sealed message…" aria-label="Sealed message" />
          <CommandButton id="chat.sendSigned" args={{ text: text.trim() }} variant="secondary" disabled={!text.trim()}>Post with the seal</CommandButton>
        </div>
      )}
      {chat === "report" && (
        <div className="power-card">
          <p><IconSeal size={16} /> Post a sealed report the game writes from your night look. It is sealed “the Notary” and carries no name.</p>
          {seenPair && <>
            <div className="segmented segmented-text" role="radiogroup" aria-label="Which role the report names">
              {[...new Set(seenPair.roles!)].map(r => <button key={r} type="button" role="radio" aria-checked={(reportCard ?? seenPair.roles![0]) === r} className={`segment${(reportCard ?? seenPair.roles![0]) === r ? " is-on" : ""}`} onClick={() => setReportCard(r)}>{roleName(r)}</button>)}
            </div>
            <p className="quiet small">It will read: “Sealed report: at night, at least one of {v.players[seenPair.slots[0].i]?.name}'s and {v.players[seenPair.slots[1].i]?.name}'s cards was {roleName(reportCard ?? seenPair.roles![0])}.”</p>
          </>}
          <CommandButton id="chat.sendReport" args={seenPair ? { card: reportCard ?? seenPair.roles![0] } : {}} variant="secondary">Post the sealed report</CommandButton>
        </div>
      )}
      {chat === "forge" && (
        <div className="power-card is-secret">
          <p><IconSeal size={16} /> Post one message under another role's seal. Until the game ends it is identical to a real one.</p>
          <div className="segmented segmented-text" role="radiogroup" aria-label="Seal to forge">
            {(["signet", "notary"] as const).map(r => <button key={r} type="button" role="radio" aria-checked={as === r} className={`segment${as === r ? " is-on" : ""}`} disabled={!sealers.includes(r)} title={sealers.includes(r) ? `Forge the ${roleName(r)}'s seal` : `There is no ${roleName(r)} in this deck: its seal would give you away.`} onClick={() => setAs(r)}>{roleName(r)}</button>)}
          </div>
          {as === "signet" ? <textarea className="input" rows={2} maxLength={600} value={text} onChange={e => setText(e.target.value)} placeholder="The message…" aria-label="Forged message" />
            : <div className="power-row">{seatSelect(seat, setSeat, "One player", seat2)}{seatSelect(seat2, setSeat2, "The other", seat)}<select className="input" value={card} onChange={e => setCard(e.target.value)} aria-label="The card it names">{[...new Set(ctx.deck)].map(r => <option key={r} value={r}>{roleName(r)}</option>)}</select></div>}
          {as === "notary" && seat !== null && seat2 !== null && <p className="quiet small">It will read: “Sealed report: at night, at least one of {v.players[Math.min(seat, seat2)]?.name}'s and {v.players[Math.max(seat, seat2)]?.name}'s cards was {roleName(card)}.”</p>}
          <CommandButton id="chat.forgeSeal" args={as === "signet" ? { as, text: text.trim() } : { as, seat: seat ?? -1, seat2: seat2 ?? -1, card }} variant="secondary" disabled={as === "signet" ? !text.trim() : seat === null || seat2 === null}>Post the forged seal</CommandButton>
        </div>
      )}
      {day === "cut" && (
        <div className="power-card is-secret">
          <p><IconScissors size={16} /> Cut one player off for {v.settings.rules.cutSeconds} seconds. To everyone, them included, it looks exactly like their connection dropping. Only the results reveal it.</p>
          <div className="power-row">{seatSelect(seat, setSeat, "Who")}<CommandButton id="day.cutLine" args={{ seat: seat ?? -1 }} variant="danger" disabled={seat === null}>Cut them off</CommandButton></div>
        </div>
      )}
      {swapOn && (
        <div className="power-card is-secret">
          <p><IconSwap size={16} /> Queue a secret swap of two other players' cards, made the instant the vote ends.{mine.daySwap ? <> Queued: <b>{v.players[mine.daySwap.a]?.name}</b> ⇄ <b>{v.players[mine.daySwap.b]?.name}</b>.</> : ""}</p>
          <div className="power-row">{seatSelect(a, setA, "One player", b)}{seatSelect(b, setB, "The other", a)}</div>
          <div className="row"><CommandButton id="day.queueSwap" args={{ a: a ?? -1, b: b ?? -1 }} variant="secondary" disabled={a === null || b === null}>{mine.daySwap ? "Change the swap" : "Queue the swap"}</CommandButton><CommandButton id="day.clearSwap" variant="quiet" /></div>
        </div>
      )}
    </section>
  );
}
