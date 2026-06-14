/**
 * useReferral — captures ?ref=CODE from any URL, persists to localStorage,
 * and provides a helper to consume (clear) it after checkout.
 *
 * Usage:
 *   const { referralCode, clearReferral } = useReferral();
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "gag_ref";
const EXPIRY_KEY = "gag_ref_exp";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function readStored(): string | null {
  try {
    const exp = localStorage.getItem(EXPIRY_KEY);
    if (exp && Date.now() > Number(exp)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
  } catch {
    // localStorage blocked (private mode, etc.) — fail silently
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch {
    // ignore
  }
}

export function useReferral() {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | undefined>(
    () => readStored() ?? undefined,
  );

  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      writeStored(urlRef);
      setReferralCode(urlRef);
    } else {
      // Re-read from storage in case another tab wrote it
      const stored = readStored();
      if (stored) setReferralCode(stored);
    }
  }, [searchParams]);

  return { referralCode, clearReferral };
}
