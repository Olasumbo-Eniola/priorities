import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "calendar"
  | "chat"
  | "check"
  | "chevron"
  | "clip"
  | "close"
  | "file"
  | "flag"
  | "grid"
  | "list"
  | "link"
  | "moon"
  | "menu"
  | "logout"
  | "plus"
  | "pencil"
  | "trash"
  | "sun";

const paths: Record<IconName, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: (
    <>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" />
    </>
  ),
  chevron: <path d="m7 9.5 5 5 5-5" />,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  pencil: <><path d="m16 3 5 5M3 21l5-1L21 7a2.1 2.1 0 0 0-5-5L3 15Z" /></>,
  link: <><path d="m10 14 4-4" /><path d="M14 7l2-2a3.54 3.54 0 0 1 5 5l-4 4a3.54 3.54 0 0 1-5 0M10 17l-2 2a3.54 3.54 0 0 1-5-5l4-4a3.54 3.54 0 0 1 5 0" /></>,
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v4m10-4v4M3 11h18m-13 5h1m6 0h1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  chat: <path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 19 0Z" />,
  clip: <path d="m9 16 8-8a3 3 0 0 0-4-4L4 13a5 5 0 0 0 7 7L21 10M7 15l8-8" />,
  file: (
    <>
      <path d="M14 2H5v20h14V7Z" />
      <path d="M14 2v6h5M8 13h8m-8 4h6" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0" />
    </>
  ),
  moon: <path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z" />,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
