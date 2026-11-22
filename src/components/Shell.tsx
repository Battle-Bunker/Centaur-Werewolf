/**
 * The frame every screen sits in. Its regions are fixed now so later features slot in without a redesign:
 *
 *   header   brand · room · command palette trigger
 *   table    the circle of seats (most of the screen; each seat's tile is where a video stream will go)
 *   side     this player's own panel: setup, role and plan, journal, results
 *   dock     the assistant panel along the bottom, height adjustable, collapsed by default
 */
import { useRef, useState, type PointerEvent } from "react";
import { saveName, savedName } from "../app/session";
import { useApp } from "../app/store";
import { Palette, PaletteTrigger } from "../palette/Palette";
import { CommandButton, RoleArt } from "./bits";
import { SidePanel } from "./SidePanel";
import { Table } from "./Table";
import { TurnTrack } from "./TurnTrack";

export function Shell() {
  const { code, view, ui, toasts, go } = useApp();
  const night = view?.phase === "night";
  const inRoom = !!code && !!view?.me;
  return (
    <div className="app" data-theme={night ? "night" : "day"}>
      <header className="top">
        <button type="button" className="brand" onClick={() => go(null)} title="Front page">
          <RoleArt role={null} size={28} label="" /><span>Centaur Werewolf</span>
        </button>
        {view && <span className="room-chip" title="Room code">Room <b>{view.code}</b></span>}
        <span className="top-space" />
        <PaletteTrigger />
        {inRoom && <CommandButton id="ui.toggleSidebar" variant="quiet" aria-pressed={ui.sidebar}>{ui.sidebar ? "Hide panel" : "Show panel"}</CommandButton>}
      </header>

      {!code ? <Home />
        : view === undefined ? <div className="center-note">Finding the table…</div>
        : view === null ? <div className="center-note"><h2>There is no room {code}.</h2><p>Check the code, or start a new table.</p><button className="btn btn-primary" onClick={() => go(null)}>Front page</button></div>
        : !view.me ? <JoinGate />
        : (
          <div className={`stage${ui.sidebar ? "" : " no-side"}`}>
            <main className="table-area">
              <TurnTrack />
              <Table />
            </main>
            {ui.sidebar && <aside className="side"><SidePanel /></aside>}
          </div>
        )}

      {inRoom && <AssistantDock />}
      <Palette />
      <div className="toasts" role="status" aria-live="polite">{toasts.map(t => <div key={t.id} className="toast">{t.text}</div>)}</div>
    </div>
  );
}

function NameInput({ value, onChange, onEnter }: { value: string; onChange(v: string): void; onEnter(): void }) {
  return <input className="input" value={value} maxLength={24} placeholder="Your name" aria-label="Your name" onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter") onEnter(); }} />;
}

function Home() {
  const { exec } = useApp();
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState("");
  const ready = name.trim().length > 0;
  const create = () => { if (ready) { saveName(name.trim()); void exec("room.create", { name: name.trim() }).catch(() => {}); } };
  const join = () => { if (ready && code.length === 4) { saveName(name.trim()); void exec("room.join", { code, name: name.trim() }).catch(() => {}); } };
  return (
    <div className="home">
      <div className="home-art" aria-hidden>
        {["sage", "werewolf", "rustler", "farrier", "glitch"].map((r, i) => <img key={r} src={`/art/${r}.webp`} alt="" style={{ ["--i" as string]: i - 2 }} />)}
      </div>
      <h1>Centaur Werewolf</h1>
      <p className="home-lede">One night, one vote. Queue your night move, watch the turns go by on the same clock as everyone else, then talk your way to the truth.</p>
      <div className="home-form">
        <NameInput value={name} onChange={setName} onEnter={create} />
        <button className="btn btn-primary" disabled={!ready} onClick={create} title={ready ? "Open a new table and invite others with its code." : "Enter a name first."}>Create a room</button>
        <div className="home-or">or join one</div>
        <div className="home-join">
          <input className="input code-input" value={code} maxLength={4} placeholder="CODE" aria-label="Room code" onChange={e => setCode(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())} onKeyDown={e => { if (e.key === "Enter") join(); }} />
          <button className="btn btn-plain" disabled={!ready || code.length !== 4} onClick={join}>Join</button>
        </div>
      </div>
      <CommandButton id="ui.showRoles" variant="quiet">Read the roles</CommandButton>
    </div>
  );
}

/** Someone who opened an invite link and has no seat yet. */
function JoinGate() {
  const { view, exec } = useApp();
  const [name, setName] = useState(savedName);
  const join = () => { if (name.trim()) { saveName(name.trim()); void exec("room.join", { code: view!.code, name: name.trim() }).catch(() => {}); } };
  return (
    <div className="center-note">
      <h2>Join room {view!.code}</h2>
      <p>{view!.players.length} at the table{view!.phase !== "lobby" ? ". A game is in progress: you will watch this round and play the next." : "."}</p>
      <div className="home-join"><NameInput value={name} onChange={setName} onEnter={join} /><button className="btn btn-primary" disabled={!name.trim()} onClick={join}>Take a seat</button></div>
    </div>
  );
}

/**
 * The assistant panel. The assistant itself comes later; the panel, its toggle command and its adjustable height are
 * here so the table is already laid out around it.
 */
function AssistantDock() {
  const { ui, setUi } = useApp();
  const drag = useRef<{ y: number; h: number } | null>(null);
  const move = (e: PointerEvent) => { if (drag.current) setUi({ dock: Math.max(120, Math.min(innerHeight * 0.6, drag.current.h + drag.current.y - e.clientY)) }); };
  return (
    <section className={`dock${ui.assistant ? " is-open" : ""}`} style={ui.assistant ? { height: ui.dock } : undefined} aria-label="Assistant">
      {ui.assistant && <div className="dock-grip" role="separator" aria-orientation="horizontal" aria-label="Resize the assistant panel" title="Drag to resize"
        onPointerDown={e => { drag.current = { y: e.clientY, h: ui.dock }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={move} onPointerUp={() => { drag.current = null; }} />}
      <div className="dock-bar">
        <span className="dock-title">Assistant</span>
        <span className="dock-note">Not connected yet</span>
        <span className="top-space" />
        <CommandButton id="ui.toggleAssistant" variant="quiet">{ui.assistant ? "Close" : "Open"}</CommandButton>
      </div>
      {ui.assistant && (
        <div className="dock-body">
          <p className="dock-empty">Your assistant will sit here: it will see what you can see, and act only through the same commands as the palette.</p>
          <input className="input" disabled placeholder="Ask the assistant… (coming later)" aria-label="Message the assistant" />
        </div>
      )}
    </section>
  );
}
