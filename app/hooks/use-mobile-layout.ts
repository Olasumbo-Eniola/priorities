import { useSyncExternalStore } from "react";

const mobileLayoutQuery = "(max-width: 768px)";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(mobileLayoutQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(mobileLayoutQuery).matches;
}

function getServerSnapshot() {
  return false;
}

export function useMobileLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
