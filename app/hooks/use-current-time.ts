import { useEffect, useState } from "react";

export function useCurrentTime(refreshInterval = 30_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  return now;
}
