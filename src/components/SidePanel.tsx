/**
 * This player's own panel. Two tabs: their own things for the phase (table setup, their card and night plan, what
 * they know and their vote, the result) and the table's chat. On a very wide screen both show at once.
 */
import { useEffect, useRef, useState } from "react";
import { ROLE } from "../../shared/roles";
import { describe, viaLabel } from "../../shared/text";
import { looseFacts } from "../app/knowledge";
import { useApp, usePrevious, type View } from "../app/store";
import { Avatar, CommandButton, RoleCard, ordinal } from "./bits";
import { Chat } from "./Chat";
import { IconChat, IconEye, IconUndo, IconUser } from "./icons";
import { PlanBuilder } from "./PlanBuilder";
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

  const label = v.phase === "lobby" ? "Table setup" : !v.game?.mine && v.phase !== "ended" ? "Watching" : v.phase === "night" ? "Your night" : v.phase === "day" ? "Your day" : "Result";
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
  return <ol className="journal">{entries.map((e, i) => <li key={i} className={`journal-${e.ev.kind}`}><img src={`/art/${e.role}.webp`} alt="" /><span>{describe(e, v, seat)}{viaLabel(e) && <span className="via"> · {viaLabel(e)}</span>}</span></li>)}</ol>;
}

function Night({ v }: { v: View }) {
  const game = v.game!, mine = game.mine!;
  const role = ROLE[mine.dealt];
  const myTurn = game.turns.findIndex(t => t.role === role.id);
  return (
    <div className="panel">
      <section className="panel-hero">
        <RoleCard role={mine.dealt} caption="You were dealt">
          <p className="role-when">{role.steps && myTurn > 0 ? <>You wake <b>{ordinal(myTurn)}</b> of {game.turns.length - 1} turns.</> : "You sleep through the night."}</p>
        </RoleCard>
      </section>
      <section>
        <h2 className="section-title">Your night</h2>
        <PlanBuilder />
      </section>
    </div>
  );
}

function Day({ v }: { v: View }) {
  const game = v.game!, mine = game.mine!;
  const facts = looseFacts(mine.journal);
  const target = mine.vote !== null ? v.players[mine.vote] : null;
  return (
    <div className="panel">
      <section className="vote-box" aria-live="polite">
        <h2 className="section-title">Your vote</h2>
        {target ? (
          <div key={mine.vote} className="vote-cast">
            <span className="vote-cast-avatar"><Avatar name={target.name} bot={target.bot} /></span>
            <div><span className="eyebrow">You vote to eliminate</span><b>{target.name}</b><span className="quiet">Click someone else at the table to change it.</span></div>
          </div>
        ) : (
          <p className="vote-none">You have not voted. <b>Click a player at the table</b> to vote for them.</p>
        )}
        <div className="row">
          <CommandButton id="day.vote" variant="plain">Choose from a list</CommandButton>
          <CommandButton id="day.clearVote" variant="quiet" icon={<IconUndo size={15} />} />
          <CommandButton id="day.endDiscussion" variant="quiet" />
        </div>
        <p className="quiet small">The day ends when everyone has voted or the timer runs out. Anyone who has not voted then votes at random.</p>
      </section>
      <section>
        <h2 className="section-title">What you know</h2>
        {mine.journal.length ? <Journal entries={mine.journal} v={v} seat={mine.seat} /> : <p className="quiet">{ROLE[mine.dealt].steps ? "Nothing happened on your turn." : "You slept through the night: you know only your own card."}</p>}
        {facts.map((f, i) => <p key={i} className="fact">{f}</p>)}
        {game.shown.length > 0 && (
          <div className="shown-list">
            <span className="eyebrow">Shown to everyone by the Herald</span>
            {game.shown.map((s, i) => <p key={i}><img src={`/art/${s.role}.webp`} alt="" /> Centre {s.slot.i + 1} was <b>{ROLE[s.role].name}</b> during the Herald's turn. It may have moved since.</p>)}
          </div>
        )}
      </section>
      <section>
        <RoleCard role={mine.dealt} caption="You were dealt" compact>
          <p className="quiet small">Your card may have been moved since you looked. You win or lose by the card in front of you when the votes are counted.</p>
        </RoleCard>
      </section>
    </div>
  );
}
