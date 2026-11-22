/**
 * Table talk. Everyone in the room reads it. Silent at night (the registry says so, and the composer shows why).
 * A Signet message carries the game's seal; a Forger message carries no name until the game is over; a message an
 * assistant sent for its player is marked as such.
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { CommandId } from "../../shared/commands";
import { useApp, useCommand, type Message } from "../app/store";
import { sealForgers } from "../app/teams";
import { Avatar } from "./bits";
import { IconMask, IconSeal, IconSend, IconSpark } from "./icons";

const PHASE_TITLE: Record<string, string> = { lobby: "In the lobby", night: "Night", day: "Day", vote: "The vote", ended: "After the game" };
const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function Chat() {
  const { view } = useApp();
  const v = view!;
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const onScroll = () => { const el = list.current!; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; };
  useLayoutEffect(() => { const el = list.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [v.messages.length]);

  let lastKey = "", lastAuthor = "";
  return (
    <div className="chat">
      <div className="chat-list" ref={list} onScroll={onScroll} role="log" aria-label="Table talk" aria-live="polite">
        {!v.messages.length && (
          <div className="chat-empty">
            <p><b>Nobody has said anything yet.</b></p>
            <p className="quiet">{v.phase === "night" ? "The table is silent at night. Talk opens at dawn." : "Say hello, make a claim, ask a question."}</p>
          </div>
        )}
        {sealForgers(v.settings.deck).length > 0 && v.phase !== "ended" && v.messages.some(m => m.seal) && (
          <p className="chat-caveat"><IconSeal size={13} /> Seals can be forged at this table. A forgery looks exactly like a real seal until the game ends.</p>
        )}
        {v.messages.map(m => {
          const key = `${m.round}:${m.phase}`;
          const head = key !== lastKey ? <div className="chat-sep"><span>{PHASE_TITLE[m.phase] ?? m.phase}{m.round && m.phase !== "lobby" ? ` · round ${m.round}` : ""}</span></div> : null;
          const author = `${m.name}|${m.mark}|${m.via}`;
          const cont = !head && author === lastAuthor && !m.mark;
          lastKey = key; lastAuthor = author;
          return <div key={m.id}>{head}<Bubble m={m} cont={cont} /></div>;
        })}
      </div>
      <Composer />
    </div>
  );
}

function Bubble({ m, cont }: { m: Message; cont: boolean }) {
  const anon = m.mark === "unsigned";
  const sealed = !!m.seal;
  return (
    <div className={`msg${m.mine ? " is-mine" : ""}${cont ? " is-cont" : ""}${sealed ? " is-sealed" : ""}${m.forged ? " is-forged" : ""}${anon ? " is-unsigned" : ""}`}>
      <span className="msg-avatar">{!cont && (anon ? <span className="avatar avatar-sm tone-mask"><IconMask size={16} /></span> : <Avatar name={m.name ?? "?"} size="sm" />)}</span>
      <div className="msg-body">
        {!cont && (
          <div className="msg-head">
            <b>{anon ? (m.name ? <>Unsigned <span className="msg-revealed">· it was {m.name}</span></> : "Unsigned") : m.name}</b>
            {m.mine && !anon && <span className="msg-you">you</span>}
            {m.via === "agent" && <span className="msg-agent" title="Sent by this player's assistant"><IconSpark size={12} /> assistant</span>}
            <time dateTime={new Date(m.at).toISOString()}>{time(m.at)}</time>
          </div>
        )}
        {sealed && (
          <div className="msg-seal" title={`${m.sealNote ?? ""} It proves the card that player was dealt, not the card they hold now.`}>
            <img src={`/art/${m.seal}.webp`} alt="" /><IconSeal size={14} /><span>{m.sealNote}</span>
          </div>
        )}
        {m.forged && <div className="msg-forged" title="Revealed after the game: this seal was forged.">Forged: the seal was false</div>}
        {anon && <div className="msg-mask" title="Who sent it is shown when the game ends.">{m.name ? "Posted without a name" : "No name on it. Who sent it is shown when the game ends."}</div>}
        <p className="msg-text">{m.text}</p>
      </div>
    </div>
  );
}

function Composer() {
  const { exec } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<CommandId | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const send = useCommand("chat.send");
  const signed = useCommand("chat.sendSigned");

  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(null), 5000); return () => clearTimeout(t); }, [armed]);
  useLayoutEffect(() => { const el = area.current; if (!el) return; el.style.height = "auto"; el.style.height = `${Math.min(140, el.scrollHeight)}px`; }, [text]);

  const go = async (id: CommandId) => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try { await exec(id, { text: t }); setText(""); } catch { /* the store shows why */ }
    setBusy(false); setArmed(null);
    area.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (send.can.ok) void go("chat.send"); } };
  const power = signed.can.ok ? { id: "chat.sendSigned" as const, cmd: signed, label: "Post with the seal", icon: <IconSeal size={15} /> } : null;
  const disabled = !send.can.ok;
  const reason = !send.can.ok ? send.can.reason : "";
  return (
    <div className={`composer${disabled ? " is-disabled" : ""}`}>
      {power && (
        <div className={`power${armed === power.id ? " is-armed" : ""}`}>
          <span className="power-text">{power.icon}<span><b>Once per game:</b> {power.cmd.def.tooltip}</span></span>
          <button type="button" className={`btn btn-secondary${armed === power.id ? " is-armed" : ""}`} disabled={!text.trim() || busy} title={text.trim() ? power.cmd.def.tooltip : "Write the message first."}
            onClick={() => { if (armed !== power.id) setArmed(power.id); else void go(power.id); }}>
            {armed === power.id ? "Click again to post it" : power.label}
          </button>
        </div>
      )}
      <div className="composer-row">
        <textarea ref={area} className="input composer-input" rows={1} maxLength={600} value={text} disabled={disabled} placeholder={disabled ? reason : "Say something to the table…"}
          aria-label="Message to the table" onChange={e => setText(e.target.value)} onKeyDown={onKey} title={disabled ? reason : "Enter to send, Shift+Enter for a new line"} />
        <button type="button" className="btn btn-primary composer-send" disabled={disabled || !text.trim() || busy} onClick={() => void go("chat.send")} title={disabled ? reason : send.def.tooltip} aria-label="Send">
          <IconSend size={17} />
        </button>
      </div>
      {disabled && <p className="composer-why">{reason}</p>}
    </div>
  );
}
