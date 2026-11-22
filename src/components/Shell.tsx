/**
 * The frame every screen sits in. Its regions are fixed now so later features slot in without a redesign:
 *
 *   header   brand · room · phase · connect · command palette trigger
 *   table    the circle of seats (most of the screen; each seat's tile is where a video stream will go)
 *   side     this player's own panel: setup, role and plan, journal, chat, results
 *   dock     the assistant panel along the bottom, height adjustable, collapsed by default
 *
 * On a phone the side panel becomes a sheet under the table.
 */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { COMMAND } from "../../shared/commands";
import { ROLE } from "../../shared/roles";
import { useApp } from "../app/store";
import { Palette, PaletteTrigger } from "../palette/Palette";
import { CommandButton } from "./bits";
import { Curtain } from "./Curtain";
import { ConnectDialog } from "./ConnectDialog";
import { ConnectPage } from "./ConnectPage";
import { Home, JoinGate } from "./Home";
import { IconPanel, IconPlug, IconSpark, IconWarn } from "./icons";
import { RoleBook } from "./RoleBook";
import { SidePanel } from "./SidePanel";
import { Table } from "./Table";
import { TurnTrack } from "./TurnTrack";

export function Shell() {
  const { route, code, view, ui, toasts, go, online, dialog } = useApp();
  const phase = view?.phase;
  const dusk = phase === "night" && view?.game?.turn === 0;
  const theme = phase === "night" ? "night" : "day";
  const inRoom = route.kind === "room" && !!view?.me;
  useEffect(() => { document.documentElement.dataset.theme = theme; document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "night" ? "#0b1712" : "#efe6d1"); }, [theme]);
  useEffect(() => { document.title = view ? `${view.code} · ${phase === "lobby" ? "Lobby" : phase === "night" ? "Night" : phase === "day" ? "Day" : "Result"} · Centaur Werewolf` : "Centaur Werewolf"; }, [view?.code, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app" data-theme={theme} data-phase={dusk ? "dusk" : (phase ?? route.kind)}>
      <a className="skip" href="#main">Skip to the table</a>
      <Header />
      {!online && <div className="offline" role="status"><IconWarn size={16} /> Reconnecting to the table… Your moves will go through once it is back.</div>}

      {route.kind === "connect" ? <ConnectPage request={route.request} />
        : !code ? <Home />
        : view === undefined ? <Loading />
        : view === null ? (
          <div className="center-note">
            <div className="center-note-card">
              <div className="eyebrow">No such table</div>
              <h2>There is no room {code}.</h2>
              <p className="quiet">Check the four letters, or start a new table. Rooms disappear when everyone has left.</p>
              <button className="btn btn-primary" onClick={() => go(null)}>Back to the front page</button>
            </div>
          </div>
        )
        : !view.me ? <JoinGate />
        : (
          <div className={`stage${ui.sidebar ? "" : " no-side"}`}>
            <main className="table-area" id="main" tabIndex={-1}>
              <TurnTrack />
              <Table />
            </main>
            {ui.sidebar && <SidePanel />}
          </div>
        )}

      {inRoom && <AssistantDock />}
      {inRoom && <Curtain />}
      <Palette />
      {dialog?.kind === "roles" && <RoleBook />}
      {dialog?.kind === "connect" && <ConnectDialog />}
      <div className="toasts" role="status" aria-live="polite">{toasts.map(t => <div key={t.id} className={`toast${t.tone ? ` toast-${t.tone}` : ""}`}>{t.text}</div>)}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="center-note" aria-busy="true">
      <div className="loading-deck" aria-hidden><span /><span /><span /></div>
      <p className="quiet">Finding the table…</p>
    </div>
  );
}

function Header() {
  const { view, ui, go, setDialog, route, exec } = useApp();
  const game = view?.game;
  const turn = game && view?.phase === "night" ? game.turns[game.turn] : null;
  const phaseWords = !view ? null
    : view.phase === "lobby" ? "Lobby"
    : view.phase === "night" ? (game?.turn === 0 ? "Dusk" : turn?.role ? `Night · ${ROLE[turn.role].name}` : "Night")
    : view.phase === "day" ? "Day" : "Result";
  const inRoom = route.kind === "room" && !!view?.me;
  return (
    <header className="top">
      <button type="button" className="brand" onClick={() => go(null)} title="Front page (you keep your seat)">
        <img src="/art/back.webp" alt="" width={30} height={30} />
        <span className="brand-name">Centaur <i>Werewolf</i></span>
      </button>
      {view && (
        <button type="button" className="room-chip" onClick={() => void exec("ui.copyInvite")} title={COMMAND["ui.copyInvite"].tooltip} data-command="ui.copyInvite">
          <span className="room-chip-label">Room</span><b>{view.code}</b>
        </button>
      )}
      {phaseWords && <span className={`phase-chip phase-${view!.phase}`}>{phaseWords}</span>}
      <span className="top-space" />
      {inRoom && (
        <button type="button" className={`btn btn-quiet top-connect${view!.connections.length ? " is-on" : ""}`} onClick={() => setDialog({ kind: "connect" })} title="Let an AI assistant look at or play your seat">
          <IconPlug /><span className="hide-sm">{view!.connections.length ? `${view!.connections.length} assistant${view!.connections.length > 1 ? "s" : ""}` : "Connect assistant"}</span>
        </button>
      )}
      <PaletteTrigger />
      {inRoom && <CommandButton id="ui.toggleSidebar" variant="quiet" aria-pressed={ui.sidebar} aria-label={ui.sidebar ? "Hide the side panel" : "Show the side panel"} icon={<IconPanel />} className="top-panel"><span className="sr-only">Panel</span></CommandButton>}
    </header>
  );
}

/**
 * The assistant panel. The in-app assistant comes later; the panel, its toggle command and its adjustable height are
 * here so the table is already laid out around it. For now it points to connecting an outside assistant.
 */
function AssistantDock() {
  const { ui, setUi, view, setDialog } = useApp();
  const drag = useRef<{ y: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const move = (e: PointerEvent) => { if (drag.current) setUi({ dock: Math.max(120, Math.min(innerHeight * 0.6, drag.current.h + drag.current.y - e.clientY)) }); };
  const n = view?.connections.length ?? 0;
  return (
    <section className={`dock${ui.assistant ? " is-open" : ""}${dragging ? " is-dragging" : ""}`} style={ui.assistant ? { height: ui.dock } : undefined} aria-label="Assistant">
      {ui.assistant && <div className="dock-grip" role="separator" aria-orientation="horizontal" aria-label="Resize the assistant panel" title="Drag to resize" tabIndex={0}
        onKeyDown={e => { if (e.key === "ArrowUp") setUi({ dock: Math.min(innerHeight * 0.6, ui.dock + 24) }); if (e.key === "ArrowDown") setUi({ dock: Math.max(120, ui.dock - 24) }); }}
        onPointerDown={e => { drag.current = { y: e.clientY, h: ui.dock }; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={move} onPointerUp={() => { drag.current = null; setDragging(false); }} />}
      <div className="dock-bar">
        <IconSpark size={16} className="dock-icon" />
        <span className="dock-title">Assistant</span>
        <span className="dock-note">{n ? `${n} connected from outside` : "Not connected"}</span>
        <span className="top-space" />
        <CommandButton id="ui.toggleAssistant" variant="quiet">{ui.assistant ? "Close" : "Open"}</CommandButton>
      </div>
      {ui.assistant && (
        <div className="dock-body">
          <div className="dock-empty">
            <p><b>An assistant will sit here.</b> It will see exactly what you can see, and act only through the same commands as the palette, so it can never do more than you could.</p>
            <p className="quiet">Until then you can connect one you already use, such as Claude, over MCP.</p>
            <button type="button" className="btn btn-plain" onClick={() => setDialog({ kind: "connect" })}><IconPlug /> Connect an assistant</button>
          </div>
          <input className="input" disabled placeholder="Ask the assistant… (coming later)" aria-label="Message the assistant" />
        </div>
      )}
    </section>
  );
}
