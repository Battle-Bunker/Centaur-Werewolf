/**
 * The command palette: one list of everything that can be done here, generated from the registry
 * (shared/commands.ts). Rows that cannot run now are dimmed and say why; rows that could never apply to this viewer
 * are not listed. Commands with arguments open nested pages (palette/pages.ts). Ctrl/Cmd+K or "/" opens it; Esc or
 * Backspace on an empty search goes back a page, then closes.
 */
import { ConvexError } from "convex/values";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { availability, COMMANDS, type Availability, type CommandDef, type CommandId, type Group } from "../../shared/commands";
import { useApp, type FreshKey } from "../app/store";
import { IconMenu, IconSearch } from "../components/icons";
import { PAGES, type Page, type PickOption } from "./pages";

const SECTIONS: { group: Group | "suggested"; title: string }[] = [
  { group: "suggested", title: "Suggested" }, { group: "play", title: "Play" }, { group: "talk", title: "Talk" }, { group: "setup", title: "Setup" },
  { group: "room", title: "Room" }, { group: "connect", title: "Assistants" }, { group: "view", title: "View" }, { group: "help", title: "Help" },
];
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const SHORTCUT = isMac ? "⌘K" : "Ctrl K";
const isEditable = (el: Element | null) => !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);

/** 0: no match. Higher is better: title prefix, word prefix, substring, keyword, then letters in order. */
export function matchScore(query: string, title: string, keywords: readonly string[] = []): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const t = title.toLowerCase();
  if (t.startsWith(q)) return 100;
  if (t.split(/\s+/).some(w => w.startsWith(q))) return 80;
  if (t.includes(q)) return 60;
  if (keywords.some(k => k.toLowerCase().startsWith(q))) return 50;
  if (keywords.some(k => k.toLowerCase().includes(q))) return 40;
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length ? 10 : 0;
}

interface Row { id: string; label: string; detail?: string; can: Availability; shortcut?: string; section?: string; command?: CommandDef; option?: PickOption }

export function PaletteTrigger() {
  const { openPalette } = useApp();
  return (
    <div className="pal-trigger">
      <button type="button" className="pal-trigger-field" onClick={() => openPalette()} aria-label={`Search or do (${SHORTCUT})`} aria-keyshortcuts="Meta+K Control+K">
        <IconSearch size={16} /><span className="pal-trigger-text">Search or do…</span><kbd>{SHORTCUT}</kbd>
      </button>
      <button type="button" className="pal-trigger-menu" onClick={() => openPalette()} aria-label="Menu: every command"><IconMenu size={16} /></button>
    </div>
  );
}

/** The commands worth offering first, given where the game is. */
function suggestedIds(phase: string, host: boolean, players: number, openSteps: number): CommandId[] {
  if (phase === "home") return ["room.create", "room.join"];
  if (phase === "lobby") return host ? (players < 3 ? ["room.addBot", "ui.copyInvite"] : ["game.start", "setup.useRecommended"]) : ["ui.copyInvite", "ui.showRoles"];
  if (phase === "night") return openSteps ? ["night.planStep"] : ["ui.showRoles"];
  if (phase === "day") return ["day.vote", "chat.send", "chat.sendSigned", "chat.sendUnsigned"];
  return host ? ["game.playAgain"] : [];
}

export function Palette() {
  const { palette, openPalette, closePalette, ctx, view, exec, setDialog } = useApp();
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState<Page[]>([]);
  const [selected, setSelected] = useState(0);
  const [armed, setArmed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const page = stack[stack.length - 1];
  const env = useMemo(() => ({ view, exec, showKey: (fresh: FreshKey) => setDialog({ kind: "connect", fresh }) }), [view, exec, setDialog]);

  // Global keys: the palette itself, and the single-letter shortcuts the registry declares.
  useEffect(() => {
    const on = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.open ? closePalette() : openPalette(); return; }
      if (palette.open || isEditable(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector(".modal-overlay")) return;
      if (e.key === "/") { e.preventDefault(); openPalette(); return; }
      const cmd = COMMANDS.find(c => "shortcut" in c && c.shortcut?.toLowerCase() === e.key.toLowerCase());
      if (cmd && availability(cmd, ctx).ok && !PAGES[cmd.id] ) { e.preventDefault(); void exec(cmd.id).catch(() => {}); }
      else if (cmd && availability(cmd, ctx).ok) { e.preventDefault(); openPalette({ page: cmd.id }); }
    };
    addEventListener("keydown", on, true);
    return () => removeEventListener("keydown", on, true);
  }, [palette.open, ctx, exec, openPalette, closePalette]);

  useEffect(() => {
    if (!palette.open) return;
    const start = palette.init?.page ? PAGES[palette.init.page as CommandId]?.(env) : undefined;
    setStack(start ? [start] : []); setQuery(""); setSelected(0); setArmed(null); setError(null); setBusy(false);
    requestAnimationFrame(() => input.current?.focus());
  }, [palette.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo<Row[]>(() => {
    if (page?.kind === "pick") {
      return page.options.map(o => ({ o, s: matchScore(query, o.label, [o.detail ?? ""]) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s)
        .map(({ o }) => ({ id: o.id, label: o.label, detail: o.detail, can: o.unavailable ? { ok: false, reason: o.unavailable } : { ok: true }, option: o }));
    }
    if (page) return [];
    const scored = COMMANDS.filter(c => !(c as CommandDef).surfaces?.except.includes("palette")).map(c => ({ c: c as CommandDef, can: availability(c, ctx), s: matchScore(query, c.title, c.keywords) }))
      .filter(x => x.s > 0 && !(x.can.ok === false && x.can.hidden) && (query.trim() || x.can.ok || x.c.group === "play" || x.c.group === "setup"));
    const toRow = (x: (typeof scored)[number], section: string): Row => ({ id: x.c.id, label: x.c.title, detail: x.c.tooltip, can: x.can, shortcut: x.c.shortcut, section, command: x.c });
    if (query.trim()) return scored.sort((a, b) => Number(b.can.ok) - Number(a.can.ok) || b.s - a.s).map(x => toRow(x, "Results"));
    const suggested = suggestedIds(ctx.phase, ctx.host, ctx.players, ctx.openSteps.length).flatMap(id => scored.filter(x => x.c.id === id && x.can.ok));
    const shown = new Set(suggested.map(x => x.c.id));
    const out: Row[] = [];
    for (const { group, title } of SECTIONS) {
      const inGroup = group === "suggested" ? suggested : scored.filter(x => x.c.group === group && !shown.has(x.c.id)).sort((a, b) => Number(b.can.ok) - Number(a.can.ok));
      for (const x of inGroup) out.push(toRow(x, title));
    }
    return out;
  }, [page, query, ctx]);

  useEffect(() => { setSelected(0); setArmed(null); }, [query, stack.length]);
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }); }, [selected]);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(null), 5000); return () => clearTimeout(t); }, [armed]);

  if (!palette.open) return null;
  const current = rows[Math.min(selected, rows.length - 1)];

  const push = (p: Page) => { setStack(s => [...s, p]); setQuery(p.kind === "field" ? (p.initial ?? "") : ""); setError(null); requestAnimationFrame(() => input.current?.select()); };
  const back = () => { if (stack.length) { setStack(s => s.slice(0, -1)); setQuery(""); setError(null); } else closePalette(); };
  const settle = async (work: () => Page | void | Promise<Page | void>) => {
    setBusy(true); setError(null);
    try { const next = await work(); if (next) push(next); else closePalette(); }
    catch (e) { setError(e instanceof ConvexError ? String(e.data) : "That did not go through."); }
    finally { setBusy(false); }
  };
  const activate = (row: Row | undefined) => {
    if (busy) return;
    if (page?.kind === "field") { const err = page.validate?.(query) ?? null; if (err) setError(err); else void settle(() => page.onSubmit(query)); return; }
    if (page?.kind === "info") { back(); return; }
    if (!row || !row.can.ok) return;
    if (page?.kind === "pick") {
      if (row.option?.confirm && armed !== row.id) { setArmed(row.id); return; }
      void settle(() => page.onPick(row.id)); return;
    }
    const cmd = row.command!;
    const form = PAGES[cmd.id as CommandId];
    if (form) { push(form(env)); return; }
    if (cmd.confirm === "inline" && armed !== cmd.id) { setArmed(cmd.id); return; }
    void settle(async () => { await exec(cmd.id as CommandId); });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(i => Math.min(rows.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); activate(current); }
    else if (e.key === "Escape") { e.preventDefault(); back(); }
    else if (e.key === "Backspace" && !query && stack.length) { e.preventDefault(); back(); }
  };

  const chip = view ? `Room ${view.code} · ${ctx.host ? "host" : ctx.member ? "player" : "visitor"} · ${ctx.phase}` : "Front page";
  const placeholder = page?.kind === "field" ? (page.placeholder ?? page.label) : page?.kind === "pick" ? "Filter…" : page ? "" : "Search or do…";
  const detail = error ?? (page?.kind === "field" ? (page.validate?.(query) ?? "Press ↵ to confirm.")
    : !current ? "" : !current.can.ok ? current.can.reason : armed === current.id ? (current.option?.confirm ?? `Press ↵ again to ${current.label.toLowerCase()}.`) : (current.detail ?? ""));
  let lastSection = "";

  return (
    <div className="pal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) closePalette(); }}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="pal-head">
          <span className="pal-chip">{chip}</span>
          {stack.map((p, i) => <span key={i} className="pal-crumb">{p.title}</span>)}
        </div>
        <div className="pal-input">
          <IconSearch size={16} />
          {page?.kind === "field" && <label htmlFor="pal-in">{page.label}</label>}
          <input id="pal-in" ref={input} value={query} onChange={e => { setQuery(e.target.value); setError(null); }} onKeyDown={onKey} placeholder={placeholder}
            readOnly={page?.kind === "info"} role="combobox" aria-expanded aria-controls="pal-list" autoComplete="off" spellCheck={false} />
        </div>
        <div className="pal-list" id="pal-list" role="listbox" ref={listRef}>
          {page?.kind === "info" && <div className="pal-info">{page.lines.map((l, i) => <p key={i}>{l}</p>)}</div>}
          {page?.kind === "pick" && !rows.length && <div className="pal-empty">{page.options.length ? "Nothing matches." : (page.empty ?? "Nothing to choose.")}</div>}
          {!page && !rows.length && <div className="pal-empty">No command matches “{query}”.</div>}
          {rows.map((r, i) => {
            const head = r.section && r.section !== lastSection ? r.section : null;
            if (r.section) lastSection = r.section;
            return (
              <div key={r.id}>
                {head && <div className="pal-section">{head}</div>}
                <div role="option" aria-selected={i === selected} aria-disabled={!r.can.ok} className="pal-row" onMouseMove={() => setSelected(i)} onClick={() => activate(r)}>
                  <span className="pal-row-label">{r.label}</span>
                  {page?.kind === "pick" && r.detail && <span className="pal-row-detail">{r.detail}</span>}
                  {!r.can.ok && <span className="pal-row-why">{r.can.reason}</span>}
                  {armed === r.id && <span className="pal-row-armed">↵ again to confirm</span>}
                  {r.shortcut && r.can.ok && armed !== r.id && <kbd>{r.shortcut}</kbd>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="pal-foot">
          <span className={`pal-detail${error ? " is-error" : ""}`}>{busy ? "Working…" : detail}</span>
          <span className="pal-keys"><kbd>↑↓</kbd> move <kbd>↵</kbd> {page?.kind === "info" ? "back" : "run"} <kbd>esc</kbd> {stack.length ? "back" : "close"}</span>
        </div>
      </div>
    </div>
  );
}
