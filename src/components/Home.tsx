/** The front page (create or join a table, or go back to one) and the gate shown to someone who opened an invite. */
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { savedName, saveName, TOKEN } from "../app/session";
import { useApp } from "../app/store";
import { CommandButton } from "./bits";
import { IconArrowRight, IconBook, IconChat, IconMoon, IconSun, IconVote } from "./icons";
import { SHORTCUT } from "../palette/Palette";

function NameInput({ value, onChange, onEnter, autoFocus }: { value: string; onChange(v: string): void; onEnter(): void; autoFocus?: boolean }) {
  return (
    <label className="field">
      <span className="field-label">Your name</span>
      <input className="input input-lg" value={value} maxLength={24} placeholder="What should the table call you?" autoComplete="nickname" autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter") onEnter(); }} />
    </label>
  );
}

const FAN = ["sage", "herald", "werewolf", "centaur", "spooker"];
const PHASE_LABEL: Record<string, string> = { lobby: "in the lobby", night: "night", day: "day", ended: "game over" };

export function Home() {
  const { exec, go } = useApp();
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const mine = useQuery(api.rooms.mine, { token: TOKEN });
  const ready = name.trim().length > 0;
  const run = async (kind: "create" | "join") => {
    if (!ready || (kind === "join" && code.length !== 4) || busy) return;
    saveName(name.trim()); setBusy(kind);
    await (kind === "create" ? exec("room.create", { name: name.trim() }) : exec("room.join", { code, name: name.trim() })).catch(() => {});
    setBusy(null);
  };
  return (
    <div className="home" id="main">
      <section className="home-hero">
        <div className="home-fan" aria-hidden>
          {FAN.map((r, i) => <img key={r} src={`/art/${r}.webp`} alt="" style={{ ["--i" as string]: i - 2 }} />)}
        </div>
        <div className="home-title">
          <div className="eyebrow">A one-night game of hidden roles</div>
          <h1>Centaur <i>Werewolf</i></h1>
          <p className="home-lede">Everyone is dealt a card. In one night the cards are peeked at, traded and stampeded. At dawn you talk, accuse, and vote: and you win by the card in front of you, which may not be the one you were dealt.</p>
        </div>
      </section>

      <section className="home-panel" aria-label="Sit down at a table">
        <NameInput value={name} onChange={setName} onEnter={() => void run(code.length === 4 ? "join" : "create")} autoFocus={!name} />
        <div className="home-actions">
          <button className="btn btn-primary btn-lg" disabled={!ready || !!busy} onClick={() => void run("create")} title={ready ? "Open a new table and invite others with its code." : "Enter a name first."}>
            {busy === "create" ? "Opening a table…" : "Open a new table"}
          </button>
          <div className="home-or"><span>or join one</span></div>
          <div className="home-join">
            <input className="input input-lg code-input" value={code} maxLength={4} placeholder="CODE" aria-label="Room code, four letters" autoCapitalize="characters" spellCheck={false}
              onChange={e => setCode(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())} onKeyDown={e => { if (e.key === "Enter") void run("join"); }} />
            <button className="btn btn-secondary btn-lg" disabled={!ready || code.length !== 4 || !!busy} onClick={() => void run("join")} title={!ready ? "Enter a name first." : code.length !== 4 ? "A room code is four letters." : "Sit down at that table."}>
              {busy === "join" ? "Joining…" : "Join"}
            </button>
          </div>
          {!ready && <p className="field-hint">Enter a name to open or join a table.</p>}
        </div>
        {!!mine?.length && (
          <div className="home-rejoin">
            <div className="eyebrow">Your tables</div>
            <ul>
              {mine.map(r => (
                <li key={r.code}>
                  <button type="button" className="rejoin" onClick={() => go(r.code)}>
                    <b className="mono">{r.code}</b><span>as {r.name}{r.host ? " · host" : ""}</span><span className="quiet">{r.players} seated · {PHASE_LABEL[r.phase] ?? r.phase}</span><IconArrowRight size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="home-how" aria-label="How a game goes">
        <ol>
          <li><IconMoon /><b>Dusk</b><span>Look at your card. Queue your night move before your turn comes, so it plays by itself.</span></li>
          <li><img src="/art/back.webp" alt="" width={22} height={22} /><b>Night</b><span>Every role in the deck takes a turn on one clock, held or not, so the timing gives nothing away.</span></li>
          <li><IconSun /><b>Day</b><span>Talk it through. Claim, accuse, bluff. Then everyone votes at once.</span></li>
          <li><IconVote /><b>Reveal</b><span>The most-voted player is out. Every card turns over, and you win by the card you hold.</span></li>
        </ol>
        <div className="home-foot">
          <CommandButton id="ui.showRoles" variant="quiet" icon={<IconBook />}>Browse the 17 roles</CommandButton>
          <span className="quiet"><IconChat size={14} /> Press <kbd>{SHORTCUT}</kbd> anywhere to search or do anything.</span>
        </div>
      </section>
    </div>
  );
}

/** Someone who opened an invite link and has no seat yet. */
export function JoinGate() {
  const { view, exec } = useApp();
  const [name, setName] = useState(savedName);
  const v = view!;
  const join = () => { if (name.trim()) { saveName(name.trim()); void exec("room.join", { code: v.code, name: name.trim() }).catch(() => {}); } };
  return (
    <div className="center-note" id="main">
      <div className="center-note-card join-gate">
        <div className="join-gate-seats" aria-hidden>{v.players.slice(0, 8).map(p => <span key={p.id} className="join-gate-seat">{p.name.slice(0, 1).toUpperCase()}</span>)}</div>
        <div className="eyebrow">You are invited</div>
        <h2>Room <span className="mono">{v.code}</span></h2>
        <p className="quiet">{v.players.length} at the table{v.phase !== "lobby" ? ". A game is under way: you will watch this round and be dealt in next." : ", waiting in the lobby."}</p>
        <NameInput value={name} onChange={setName} onEnter={join} autoFocus />
        <button className="btn btn-primary btn-lg" disabled={!name.trim()} onClick={join} title={name.trim() ? "Sit down at this table." : "Enter a name first."}>Take a seat</button>
      </div>
    </div>
  );
}
