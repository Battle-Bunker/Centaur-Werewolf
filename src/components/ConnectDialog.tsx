/**
 * Connecting an AI assistant to this seat over MCP: by signing in from the assistant's side (a connector URL; the
 * person approves on the Connect page), or with a key made here and shown once. Lists and revokes connections.
 */
import { useEffect, useState } from "react";
import { GRANTS, type Grant } from "../../shared/commands";
import { useApp, useCommand, type FreshKey } from "../app/store";
import { Modal } from "./RoleBook";
import { IconCheck, IconCopy, IconEye, IconKey, IconLink, IconPlug, IconShield, IconSpark, IconWarn } from "./icons";

export const GRANT_DETAIL: Record<Grant, string> = {
  read: "It can see what you see (your card, what you learned, the chat) but cannot do anything.",
  act: "It can also plan your night, chat and vote for you. It cannot change the table's setup.",
  host: "It can also do what the host does: build the deck, start games, end the day.",
};
export const GRANT_ICON: Record<Grant, React.ReactNode> = { read: <IconEye size={16} />, act: <IconSpark size={16} />, host: <IconShield size={16} /> };

function ago(t: number | null) {
  if (!t) return "never used";
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "used just now";
  if (s < 3600) return `used ${Math.round(s / 60)} min ago`;
  if (s < 86400) return `used ${Math.round(s / 3600)} h ago`;
  return `used ${Math.round(s / 86400)} d ago`;
}

export function Copy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 1600); return () => clearTimeout(t); }, [done]);
  return (
    <button type="button" className={`btn btn-quiet copy${done ? " is-done" : ""}`} onClick={() => void navigator.clipboard?.writeText(value).then(() => setDone(true), () => setDone(false))} aria-label={`${label}: copy to clipboard`}>
      {done ? <IconCheck size={15} /> : <IconCopy size={15} />}<span>{done ? "Copied" : label}</span>
    </button>
  );
}

export function CodeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="codeblock">
      <div className="codeblock-head"><span>{label}</span><Copy value={value} /></div>
      <pre tabIndex={0}><code>{value}</code></pre>
    </div>
  );
}

export function ConnectDialog() {
  const { dialog, setDialog, view, exec } = useApp();
  const v = view!;
  const [fresh, setFresh] = useState<FreshKey | null>(dialog?.kind === "connect" ? dialog.fresh ?? null : null);
  const [permission, setPermission] = useState<Grant>("act");
  const [label, setLabel] = useState("My assistant");
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!label.trim() || busy) return;
    setBusy(true);
    try {
      const r = await exec("connect.createKey", { permission, label: label.trim() }) as { key: string };
      setFresh({ key: r.key, permission, label: label.trim() });
    } catch { /* toast shown */ }
    setBusy(false);
  };
  return (
    <Modal onClose={() => setDialog(null)} className="connect" labelledBy="connect-title">
      <header className="modal-head">
        <div className="eyebrow"><IconPlug size={14} /> Room {v.code} · as {v.me?.name}</div>
        <h2 id="connect-title">Connect an assistant</h2>
        <p className="quiet">An assistant you connect plays through the same commands as you do, with the permission you choose, and only in this room. You can cut it off at any time.</p>
      </header>
      <div className="connect-body">
        {fresh ? <FreshKeyPanel fresh={fresh} url={v.mcpUrl} onDone={() => setFresh(null)} /> : (
          <>
            <section className="connect-way">
              <h3><span className="way-n">1</span> If your assistant can add a connector by URL</h3>
              <p>In Claude (or another app that supports MCP sign-in), add a custom connector with this URL. You will be sent back here to choose a table and approve it. No key needed.</p>
              <div className="url-row"><code className="mono">{v.mcpUrl}</code><Copy value={v.mcpUrl} label="Copy URL" /></div>
            </section>
            <section className="connect-way">
              <h3><span className="way-n">2</span> Or make a key</h3>
              <p>For Claude Code and other MCP clients you configure yourself. The key is shown once.</p>
              <div className="grants" role="radiogroup" aria-label="What it may do">
                {(Object.keys(GRANTS) as Grant[]).map(g => <GrantOption key={g} g={g} on={permission === g} pick={() => setPermission(g)} />)}
              </div>
              <label className="field">
                <span className="field-label">Name it, so you recognise it later</span>
                <input className="input" value={label} maxLength={40} onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void create(); }} />
              </label>
              <CreateButton permission={permission} disabled={!label.trim() || busy} busy={busy} onClick={() => void create()} />
            </section>
          </>
        )}
        <Connections />
      </div>
    </Modal>
  );
}

function GrantOption({ g, on, pick }: { g: Grant; on: boolean; pick(): void }) {
  const { can } = useCommand("connect.createKey", { permission: g, label: "x" });
  return (
    <button type="button" role="radio" aria-checked={on} className={`grant${on ? " is-on" : ""}`} disabled={!can.ok} title={can.ok ? GRANT_DETAIL[g] : can.reason} onClick={pick}>
      <span className="grant-head">{GRANT_ICON[g]}<b>{GRANTS[g]}</b></span>
      <span className="grant-detail">{can.ok ? GRANT_DETAIL[g] : can.reason}</span>
    </button>
  );
}

function CreateButton({ permission, disabled, busy, onClick }: { permission: Grant; disabled: boolean; busy: boolean; onClick(): void }) {
  const { can, def } = useCommand("connect.createKey", { permission, label: "x" });
  return <button type="button" className="btn btn-primary" disabled={disabled || !can.ok} title={can.ok ? def.tooltip : can.reason} onClick={onClick}><IconKey size={16} />{busy ? "Making a key…" : "Make a key"}</button>;
}

function FreshKeyPanel({ fresh, url, onDone }: { fresh: FreshKey; url: string; onDone(): void }) {
  const [tab, setTab] = useState<"cc" | "json">("cc");
  const cc = `claude mcp add --transport http centaur-werewolf ${url} --header "Authorization: Bearer ${fresh.key}"`;
  const json = JSON.stringify({ mcpServers: { "centaur-werewolf": { type: "http", url, headers: { Authorization: `Bearer ${fresh.key}` } } } }, null, 2);
  return (
    <section className="fresh">
      <div className="fresh-head"><IconCheck size={18} /><div><b>Key made for “{fresh.label}”</b><span className="quiet">{GRANTS[fresh.permission]}. {GRANT_DETAIL[fresh.permission]}</span></div></div>
      <div className="fresh-warn"><IconWarn size={16} /> This is the only time the key is shown. Treat it like a password: anyone with it can {fresh.permission === "read" ? "see what you see" : "play as you"} in this room.</div>
      <div className="url-row key-row"><code className="mono">{fresh.key}</code><Copy value={fresh.key} label="Copy key" /></div>
      <div className="filters" role="tablist" aria-label="Instructions for">
        <button type="button" role="tab" aria-selected={tab === "cc"} className={`filter${tab === "cc" ? " is-on" : ""}`} onClick={() => setTab("cc")}>Claude Code</button>
        <button type="button" role="tab" aria-selected={tab === "json"} className={`filter${tab === "json" ? " is-on" : ""}`} onClick={() => setTab("json")}>Other MCP clients</button>
      </div>
      {tab === "cc" ? <CodeBlock label="Run in a terminal" value={cc} /> : <CodeBlock label="Add to your client's MCP configuration" value={json} />}
      <p className="quiet small">Then ask your assistant to look at the table. MCP endpoint: <span className="mono">{url}</span></p>
      <button type="button" className="btn btn-plain" onClick={onDone}>Done, I have saved it</button>
    </section>
  );
}

function Connections() {
  const { view } = useApp();
  const list = view!.connections;
  return (
    <section className="connections">
      <h3>Connected to your seat {list.length > 0 && <span className="count">{list.length}</span>}</h3>
      {!list.length ? <p className="quiet small">Nothing is connected. Assistants you connect appear here, and you can disconnect them at any time.</p> : (
        <ul>
          {list.map(c => (
            <li key={c.id} className="conn">
              <span className="conn-icon">{c.kind === "oauth" ? <IconLink size={16} /> : <IconKey size={16} />}</span>
              <div className="conn-text"><b>{c.label}</b><span className="quiet small">{GRANTS[c.permission as Grant]} · {c.kind === "oauth" ? "signed in" : "key"} · {ago(c.lastUsedAt)}</span></div>
              <RevokeButton id={c.id} label={c.label} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RevokeButton({ id, label }: { id: string; label: string }) {
  const { can, run, def } = useCommand("connect.revoke", { connection: id });
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 5000); return () => clearTimeout(t); }, [armed]);
  return (
    <button type="button" className={`btn ${armed ? "btn-danger" : "btn-quiet"}`} disabled={!can.ok} title={can.ok ? def.tooltip : can.reason} aria-label={armed ? `Click again to disconnect ${label}` : `Disconnect ${label}`}
      onClick={() => { if (!armed) setArmed(true); else { setArmed(false); void run(); } }}>
      {armed ? "Click again to disconnect" : "Disconnect"}
    </button>
  );
}
