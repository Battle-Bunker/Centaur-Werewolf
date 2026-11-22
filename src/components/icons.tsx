/** A small set of line icons drawn for this app, 24-unit grid, stroke = currentColor. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const Icon = ({ size = 18, children, ...rest }: P & { children: React.ReactNode }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
);

export const IconSearch = (p: P) => <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></Icon>;
export const IconMenu = (p: P) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
export const IconMoon = (p: P) => <Icon {...p}><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" /></Icon>;
export const IconSun = (p: P) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Icon>;
export const IconChat = (p: P) => <Icon {...p}><path d="M4 5.5h16v10H9l-5 4v-14Z" /></Icon>;
export const IconUser = (p: P) => <Icon {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" /></Icon>;
export const IconPlug = (p: P) => <Icon {...p}><path d="M9 3v4M15 3v4M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v5" /></Icon>;
export const IconSpark = (p: P) => <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16Z" /></Icon>;
export const IconSeal = (p: P) => <Icon {...p}><circle cx="12" cy="10" r="6" /><path d="m9.5 10 1.8 1.8 3.4-3.6M8.5 15l-1.5 6 5-2.5 5 2.5-1.5-6" /></Icon>;
export const IconMask = (p: P) => <Icon {...p}><path d="M3 8c3-2 15-2 18 0 0 6-3 9-6 9-1.5 0-2-1.5-3-1.5S10.5 17 9 17c-3 0-6-3-6-9Z" /><path d="M7 11h3M14 11h3" /></Icon>;
export const IconCopy = (p: P) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="1" /><path d="M16 8V4H4v12h4" /></Icon>;
export const IconCheck = (p: P) => <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Icon>;
export const IconX = (p: P) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const IconBook = (p: P) => <Icon {...p}><path d="M4 5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0V5ZM12 5c2.5-1.5 5-1.5 8 0v15c-3-1.5-5.5-1.5-8 0" /></Icon>;
export const IconPanel = (p: P) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M15 4v16" /></Icon>;
export const IconSend = (p: P) => <Icon {...p}><path d="M4 12 20 4l-5 16-3-7-8-1Z" /></Icon>;
export const IconArrowRight = (p: P) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const IconEye = (p: P) => <Icon {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Icon>;
export const IconShuffle = (p: P) => <Icon {...p}><path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.5 0 2.7-1.3 3.7-3M14 9.5c1-1.5 2-2.5 3-2.5h3M18 4l2.5 3L18 10M18 14l2.5 3L18 20" /></Icon>;
export const IconVote = (p: P) => <Icon {...p}><path d="M4 13h16v7H4zM8 13V5h8v8M10 9l1.5 1.5L14 8" /></Icon>;
export const IconBot = (p: P) => <Icon {...p}><rect x="5" y="8" width="14" height="11" rx="2" /><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5" /></Icon>;
export const IconCrown = (p: P) => <Icon {...p}><path d="m4 8 4 4 4-7 4 7 4-4-2 11H6L4 8Z" /></Icon>;
export const IconKey = (p: P) => <Icon {...p}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l2 2M14 9l2 2" /></Icon>;
export const IconShield = (p: P) => <Icon {...p}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /></Icon>;
export const IconClock = (p: P) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></Icon>;
export const IconPlus = (p: P) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const IconMinus = (p: P) => <Icon {...p}><path d="M5 12h14" /></Icon>;
export const IconLink = (p: P) => <Icon {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>;
export const IconWarn = (p: P) => <Icon {...p}><path d="M12 4 2.5 20h19L12 4ZM12 10v4.5M12 17.5h.01" /></Icon>;
export const IconUndo = (p: P) => <Icon {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Icon>;
