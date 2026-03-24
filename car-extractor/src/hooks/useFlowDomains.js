import { useMemo } from "react";

export function useAuthDomain(me) {
  return useMemo(
    () => ({
      isLoggedIn: Boolean(me),
      email: me?.email || null,
    }),
    [me],
  );
}

export function useAnalysisDomain({ url, loading, data }) {
  return useMemo(
    () => ({
      hasUrl: Boolean((url || "").trim()),
      isAnalyzing: loading,
      hasResult: Boolean(data),
    }),
    [url, loading, data],
  );
}

export function useHistoryDomain({ history, histLoading }) {
  return useMemo(
    () => ({
      hasHistory: Array.isArray(history) && history.length > 0,
      isHistoryLoading: histLoading,
      historyCount: Array.isArray(history) ? history.length : 0,
    }),
    [history, histLoading],
  );
}

export function useVerificationDomain({ me, data, cepik, cepikLoading, normalizeDateForCepik }) {
  return useMemo(() => {
    const hasPlate = Boolean((data?.licensePlate || "").trim());
    const hasVin = Boolean((data?.vin || "").trim());
    const hasFirstRegistration = Boolean(normalizeDateForCepik(data?.firstRegistration || ""));
    return {
      isLoggedIn: Boolean(me),
      isVerifying: cepikLoading,
      isVerified: Boolean(cepik),
      hasPlate,
      hasVin,
      hasFirstRegistration,
      canVerify: Boolean(me) && hasPlate && hasVin && hasFirstRegistration,
    };
  }, [me, data, cepik, cepikLoading, normalizeDateForCepik]);
}
