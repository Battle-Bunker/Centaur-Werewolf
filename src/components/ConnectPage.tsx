/**
 * The page an assistant's sign-in sends a browser to (`#/connect/<request>`): who is asking, where it will send you
 * back, which of your tables it may sit at and with what permission. Approving or refusing makes a secret only this
 * browser knows, answers through the registry for the chosen room, then hands the browser back to the server, which
 * releases the result to the assistant.
 */
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { GRANTS, type Grant } from "../../shared/commands";
import { randomSecret, savedName, saveName, TOKEN } from "../app/session";
import { useApp } from "../app/store";
import { GRANT_DETAIL, GRANT_ICON } from "./ConnectDialog";
import { IconArrowRight, IconCheck, IconLink, IconPlug, IconWarn, IconX } from "./icons";

const ORDER: Grant[] = ["read", "act", "host"];
const PHASE: Record<string, string> = { lobby: "lobby", night: "night", day: "day", ended: "game over" };

export function ConnectPage({ request }: { request: string }) {
  const { exec, go } = useApp();
  const req = useQuery(api.rooms.connectRequest, { request });
  const rooms = useQuery(api.rooms.mine, { token: TOKEN });
  const [code, setCode] = useState<string | null>(null);
  const [permission, setPermission] = useState<Grant | null>(null);
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);

  const room = rooms?.find(r => r.code === code) ?? rooms?.[0];
  useEffect(() => { if (!code && rooms?.length) setCode(rooms[0].code); }, [rooms, code]);
  const allowed = req ? ORDER.slice(0, ORDER.indexOf(req.asks as Grant) + 1).filter(g => g !== "host" || room?.host) : [];
  const grant: Grant | undefined = permission && allowed.includes(permission) ? permission : allowed.includes("act") ? "act" : allowed[allowed.length - 1];

  const answer = async (kind: "approve" | "deny") => {
    if (!req || !room || busy) return;
    setBusy(kind); setError(null);
    const completion = randomSecret();
    try {
      if (kind === "approve") await exec("connect.approve", { request, permission: grant, completion }, { code: room.code, quiet: true });
      else await exec("connect.deny", { request, completion }, { code: room.code, quiet: true });
      setLeaving(kind);
      location.href = `${req.completeUrl}?request=${encodeURIComponent(request)}&completion=${encodeURIComponent(completion)}`;
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "That did not go through. Try again.");
      setBusy(null);
    }
  };

  if (req === undefined || rooms === undefined) return <Frame><div className="loading-deck" aria-hidden><span /><span /><span /></div><p className="quiet">Reading the request…</p></Frame>;
  if (req === null) return (
    <Frame>
      <div className="consent-icon is-bad"><IconX size={26} /></div>
      <h1>This request has expired</h1>
      <p className="quiet">Requests to connect last a few minutes. Start again from your assistant: it will send you back here.</p>
      <button type="button" className="btn btn-plain" onClick={() => go(null)}>Go to the front page</button>
    </Frame>
  );
  if (leaving || req.status !== "pending") return (
    <Frame>
      <div className="consent-icon"><IconCheck size={26} /></div>
      <h1>{leaving ? `Sending you back to ${req.redirectHost}…` : "This request has been answered"}</h1>
      <p className="quiet">{leaving === "deny" ? "You refused. Nothing was connected." : leaving ? "You approved. Your assistant can now finish connecting." : "You can close this page."}</p>
    </Frame>
  );
  return (
    <Frame>
      <div className="consent-icon"><IconPlug size={26} /></div>
      <div className="eyebrow">Request to connect</div>
      <h1>An assistant wants to sit at your table</h1>
      <dl className="consent-facts">
        <div><dt>It calls itself</dt><dd><b>{req.client}</b><span className="quiet small">The name is chosen by the assistant itself and not checked.</span></dd></div>
        <div><dt>It will send you back to</dt><dd><b className="mono">{req.redirectHost}</b><span className="quiet small">If you do not recognise this, refuse.</span></dd></div>
        <div><dt>It asks to</dt><dd><b>{GRANTS[req.asks as Grant]}</b></dd></div>
      </dl>

      {!rooms.length ? <NoTable /> : (
        <>
          <fieldset className="consent-group">
            <legend>Which table</legend>
            <div className="room-options" role="radiogroup">
              {rooms.map(r => (
                <button key={r.code} type="button" role="radio" aria-checked={room?.code === r.code} className={`room-option${room?.code === r.code ? " is-on" : ""}`} onClick={() => setCode(r.code)}>
                  <b className="mono">{r.code}</b><span>as <b>{r.name}</b>{r.host ? " · host" : ""}</span><span className="quiet small">{r.players} seated · {PHASE[r.phase] ?? r.phase}</span>
                  {room?.code === r.code && <IconCheck size={16} />}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="consent-group">
            <legend>What it may do</legend>
            <div className="grants" role="radiogroup">
              {ORDER.map(g => {
                const ok = allowed.includes(g);
                const why = ORDER.indexOf(g) > ORDER.indexOf(req.asks as Grant) ? "It did not ask for this much." : g === "host" && !room?.host ? "Only the host can hand over the table." : "";
                return (
                  <button key={g} type="button" role="radio" aria-checked={grant === g} disabled={!ok} title={ok ? GRANT_DETAIL[g] : why} className={`grant${grant === g ? " is-on" : ""}`} onClick={() => setPermission(g)}>
                    <span className="grant-head">{GRANT_ICON[g]}<b>{GRANTS[g]}</b></span>
                    <span className="grant-detail">{ok ? GRANT_DETAIL[g] : why}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          {error && <p className="form-error" role="alert"><IconWarn size={16} /> {error}</p>}
          <div className="consent-actions">
            <button type="button" className="btn btn-plain btn-lg" disabled={!!busy} onClick={() => void answer("deny")}>{busy === "deny" ? "Refusing…" : "Refuse"}</button>
            <button type="button" className="btn btn-primary btn-lg" disabled={!!busy || !grant} onClick={() => void answer("approve")}>
              {busy === "approve" ? "Approving…" : <>Approve for {room?.code} <IconArrowRight size={16} /></>}
            </button>
          </div>
          <p className="quiet small consent-foot">It will act only in room {room?.code}, as {room?.name}. You can disconnect it from that table at any time (Connect assistant, in the header).</p>
        </>
      )}
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="consent-page" id="main"><div className="consent">{children}</div></div>;
}

/** This browser sits at no table: make or join one here, then carry on with the request. */
function NoTable() {
  const { exec } = useApp();
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (join: boolean) => {
    if (!name.trim() || busy || (join && code.length !== 4)) return;
    saveName(name.trim()); setBusy(true);
    await (join ? exec("room.join", { code, name: name.trim() }, { stay: true }) : exec("room.create", { name: name.trim() }, { stay: true })).catch(() => {});
    setBusy(false);
  };
  return (
    <div className="consent-empty">
      <p><IconLink size={16} /> <b>You are not at a table in this browser yet.</b> An assistant can only be connected to a seat. Open a table or join one here, then approve.</p>
      <label className="field"><span className="field-label">Your name</span><input className="input" value={name} maxLength={24} onChange={e => setName(e.target.value)} /></label>
      <div className="row">
        <button type="button" className="btn btn-primary" disabled={!name.trim() || busy} onClick={() => void run(false)}>Open a new table</button>
        <span className="quiet">or</span>
        <input className="input code-input" value={code} maxLength={4} placeholder="CODE" aria-label="Room code" onChange={e => setCode(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())} />
        <button type="button" className="btn btn-plain" disabled={!name.trim() || code.length !== 4 || busy} onClick={() => void run(true)}>Join</button>
      </div>
    </div>
  );
}
