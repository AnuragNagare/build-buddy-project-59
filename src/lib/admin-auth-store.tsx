import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

export const ADMIN_EMAIL = "anuragnagare77@gmail.com";
export const ADMIN_DEFAULT_PASSWORD = "cafe@02";

export type AdminUser = {
  email: string;
  role: "super_admin";
  authenticatedAt: string;
};

type AdminAuthContextType = {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = "workspot_admin_session";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate admin session on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADMIN_STORAGE_KEY) || window.sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminUser;
        if (parsed.email === ADMIN_EMAIL) {
          setAdmin(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check credentials against the specified admin credentials
    if (trimmedEmail !== ADMIN_EMAIL.toLowerCase() || pass !== ADMIN_DEFAULT_PASSWORD) {
      return { success: false, error: "Invalid admin email or password." };
    }

    // Attempt Firebase email sign in if configured
    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, trimmedEmail, pass);
      } catch (err: unknown) {
        // If the Firebase project doesn't have email-password provider enabled,
        // still permit admin login via verified master credentials
        console.warn("Firebase Email Auth warning (allowing master admin fallback):", err);
      }
    }

    const session: AdminUser = {
      email: trimmedEmail,
      role: "super_admin",
      authenticatedAt: new Date().toISOString(),
    };

    setAdmin(session);
    try {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }

    return { success: true };
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // Ignore
      }
    }
    setAdmin(null);
    try {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
      window.sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
