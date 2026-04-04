import { useEffect, useState, useCallback } from "react";
import { getTokens, clearTokens } from "../api.js";

/**
 * useSessionGuard — intercepts 401 responses that survive the refresh attempt.
 *
 * Monkey-patches window.fetch so every response is inspected.
 * When a 401 is received after a refresh attempt has already failed
 * (i.e. no refresh token stored), sets `sessionExpired = true`.
 *
 * The host component renders a recovery modal when this flag is true.
 * After the user re-logs-in the flag is cleared and they continue.
 */
export function useSessionGuard({ onExpired }) {
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const origFetch = window.fetch;

    window.fetch = async (...args) => {
      const res = await origFetch(...args);

      // If we got 401 and there's no refresh token left,
      // the normal apiFetch refresh chain already ran and failed.
      if (res.status === 401) {
        const { refresh } = getTokens();
        if (!refresh) {
          clearTokens();
          setSessionExpired(true);
          onExpired?.();
        }
      }

      return res;
    };

    return () => {
      window.fetch = origFetch;
    };
  }, [onExpired]);

  const clearExpired = useCallback(() => setSessionExpired(false), []);

  return { sessionExpired, clearExpired };
}
