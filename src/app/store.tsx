/**
 * The app's one store: the room subscription, the command runner, and this person's layout. Every change to the game
 * goes through `exec(commandId, args)`, which is the registry's `run` mutation for server commands and a local
 * handler for `ui.*` commands; components never call a mutation directly.
 */
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import { availability, COMMAND, HOME_CONTEXT, type Availability, type CommandContext, type CommandDef, type CommandId } from "../../shared/commands";
import type { Slot } from "../../shared/roles";
import { codeFromHash, readNumber, saveNumber, TOKEN } from "./session";

export type View = NonNullable<FunctionReturnType<typeof api.rooms.view>>;

/** Targets on the table that can be clicked right now, and what clicking one does. */
export interface Picker { legal: Slot[]; chosen: Slot[]; hint: string; onPick(slot: Slot): void }
export interface Ui { assistant: boolean; sidebar: boolean; dock: number }
export interface PaletteInit { page?: string }

interface App {
  code: string | null;
  /** undefined: loading. null: no such room. */
  view: View | null | undefined;
  ctx: CommandContext;
  exec(id: CommandId, args?: Record<string, unknown>): Promise<unknown>;
  go(code: string | null): void;
  ui: Ui;
  setUi(patch: Partial<Ui>): void;
  picker: Picker | null;
  setPicker(p: Picker | null): void;
  palette: { open: boolean; init?: PaletteInit };
  openPalette(init?: PaletteInit): void;
  closePalette(): void;
  toasts: { id: number; text: string }[];
  toast(text: string): void;
}

const Ctx = createContext<App | null>(null);
export const useApp = () => useContext(Ctx)!;

export function AppProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState(codeFromHash);
  useEffect(() => { const on = () => setCode(codeFromHash()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  const go = useCallback((c: string | null) => { location.hash = c ? `#/${c}` : ""; setCode(c); }, []);

  const view = useQuery(api.rooms.view, code ? { code, token: TOKEN } : "skip");
  const mutate = useMutation(api.commands.run);

  const [ui, setUiState] = useState<Ui>(() => ({ assistant: false, sidebar: true, dock: readNumber("cw.dock", 220) }));
  const setUi = useCallback((patch: Partial<Ui>) => setUiState(u => { if (patch.dock) saveNumber("cw.dock", patch.dock); return { ...u, ...patch }; }), []);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [palette, setPalette] = useState<{ open: boolean; init?: PaletteInit }>({ open: false });
  const openPalette = useCallback((init?: PaletteInit) => setPalette({ open: true, init }), []);
  const closePalette = useCallback(() => setPalette({ open: false }), []);

  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const nextToast = useRef(1);
  const toast = useCallback((text: string) => {
    const id = nextToast.current++;
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const ctx = view?.context ?? HOME_CONTEXT;
  const exec = useCallback(async (id: CommandId, args: Record<string, unknown> = {}) => {
    const cmd = COMMAND[id];
    if (cmd.runs === "client") {
      if (id === "ui.toggleAssistant") setUiState(u => ({ ...u, assistant: !u.assistant }));
      if (id === "ui.toggleSidebar") setUiState(u => ({ ...u, sidebar: !u.sidebar }));
      if (id === "ui.showRoles") openPalette({ page: "ui.showRoles" });
      if (id === "ui.goHome") go(null);
      if (id === "ui.copyInvite") { await navigator.clipboard?.writeText(location.href).catch(() => {}); toast("Invite link copied."); }
      return null;
    }
    try {
      const result = await mutate({ id, token: TOKEN, code: code ?? undefined, args });
      if (id === "room.create" || id === "room.join") go((result as { code: string }).code);
      if (id === "room.leave") go(null);
      return result;
    } catch (e) {
      toast(e instanceof ConvexError ? String(e.data) : "That did not go through. Try again.");
      throw e;
    }
  }, [mutate, code, go, toast, openPalette]);

  const app = useMemo<App>(() => ({ code, view, ctx, exec, go, ui, setUi, picker, setPicker, palette, openPalette, closePalette, toasts, toast }),
    [code, view, ctx, exec, go, ui, setUi, picker, palette, openPalette, closePalette, toasts, toast]);
  return <Ctx.Provider value={app}>{children}</Ctx.Provider>;
}

/** One command as a control sees it: its registry entry, whether it can run now (and why not), and how to run it. */
export function useCommand(id: CommandId, args?: Record<string, unknown>): { def: CommandDef; can: Availability; run(extra?: Record<string, unknown>): Promise<unknown> } {
  const { ctx, exec } = useApp();
  const def = COMMAND[id];
  return { def, can: availability(def, ctx, args), run: extra => exec(id, { ...args, ...extra }).catch(() => null) };
}

/** A clock that re-renders its caller, for countdowns. */
export function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
