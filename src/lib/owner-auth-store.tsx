import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { findCafeByOwner } from "./firebase-service";

export type OwnerSession = { cafeSlug: string; cafeName: string; phone: string };

type OwnerAuthContextType = {
  owner: OwnerSession | null;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const OwnerAuthContext = createContext<OwnerAuthContextType | undefined>(undefined);

const OWNER_STORAGE_KEY = "workspot_owner_session";

/** SHA-256 of phone digits + PIN, so the PIN is never stored in plain text. */
export async function hashOwnerPin(phone: string, pin: string): Promise<string> {
  const digits = phone.replace(/\D/g, "").slice(-10);
  const bytes = new TextEncoder().encode(`${digits}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<OwnerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OWNER_STORAGE_KEY);
      if (stored) setOwner(JSON.parse(stored) as OwnerSession);
    } catch {
      // Ignore malformed storage
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (phone: string, pin: string) => {
    if (phone.replace(/\D/g, "").length < 10 || pin.length < 4) {
      return { success: false, error: "Enter your 10-digit phone number and 4-digit PIN." };
    }
    const cafe = await findCafeByOwner(phone, await hashOwnerPin(phone, pin));
    if (!cafe) {
      return { success: false, error: "No café matches that phone number and PIN." };
    }
    const session: OwnerSession = { cafeSlug: cafe.slug, cafeName: cafe.name, phone };
    setOwner(session);
    try {
      window.localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }
    return { success: true };
  };

  const logout = () => {
    setOwner(null);
    try {
      window.localStorage.removeItem(OWNER_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <OwnerAuthContext.Provider value={{ owner, loading, login, logout }}>
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  const context = useContext(OwnerAuthContext);
  if (!context) {
    throw new Error("useOwnerAuth must be used within an OwnerAuthProvider");
  }
  return context;
}
