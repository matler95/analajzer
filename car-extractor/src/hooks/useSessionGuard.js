import { useEffect, useRef, useCallback } from "react";
import { getTokens, clearTokens } from "../api.js";

/**
 * useSessionGuard — intercepts 401 responses that survive the refresh attempt.
 *
 * FIX #2: Uses a ref flag (`firedRef`) to ensure onExpired is called at most
 * once per session, even when multiple parallel requests return 401 simultaneously.
 *
 * FIX #3: The fetch patch is installed once (no deps array) and cleans up on
 * unmount. Previous impl had [onExpired] in the dep array which, even with a
 * stable useCallback identity, caused the patch to stack whenever React ran
 * the effect twice in StrictMode. Using a ref for the callback sidesteps this.
 */
export function useSessionGuard({ onExpired }) {
  // Stable ref for the callback — avoids re-running the effect when the
  // parent re-renders even if onExpired identity somehow changes.
  const onExpiredRef = useRef(onExpired);
  useEffect(() => { onExpiredRef.current = onExpired; }, [onExpired]);

  // Guard flag: set to true after the first 401 fire so subsequent parallel
  // 401s don't call clearTokens / onExpired multiple times.
  const firedRef = useRef(false);

  useEffect(() => {
    const origFetch = window.fetch;

    window.fetch = async (...args) => {
      const res = await origFetch(...args);

      if (res.status === 401) {
        const { refresh } = getTokens();
        // Only fire if there is no refresh token left (apiFetch already tried
        // to refresh) and we haven't already triggered the modal.
        if (!refresh && !firedRef.current) {
          firedRef.current = true;
          clearTokens();
          onExpiredRef.current?.();
        }
      }

      return res;
    };

    return () => {
      window.fetch = origFetch;
      // Reset the guard when the guard itself is torn down (logout / remount).
      firedRef.current = false;
    };
  // Empty deps: install once, use refs for everything that can change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow the parent to reset the guard after a successful re-login.
  const resetGuard = useCallback(() => { firedRef.current = false; }, []);

  return { resetGuard };
}
