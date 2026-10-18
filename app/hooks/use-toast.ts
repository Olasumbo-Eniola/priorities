import { useCallback, useEffect, useState } from "react";

export function useToast(duration = 3_500) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), duration);
    return () => clearTimeout(timer);
  }, [duration, message]);

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  return { toast: message, showToast };
}
