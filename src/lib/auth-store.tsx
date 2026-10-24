import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  type User,
  type ConfirmationResult,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

export type AuthUser = {
  uid: string;
  phoneNumber: string | null;
  isDemo?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isFirebaseActive: boolean;
  confirmationPending: boolean;
  sendOtp: (phone: string, recaptchaContainerId?: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [demoPhone, setDemoPhone] = useState<string | null>(null);

  // Monitor live Firebase Auth state
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Check for persisted demo user in localStorage
      try {
        const savedDemoUser = window.localStorage.getItem("workspot-demo-user");
        if (savedDemoUser) {
          setUser(JSON.parse(savedDemoUser));
        }
      } catch {
        // ignore storage parse errors
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendOtp = useCallback(
    async (phone: string, recaptchaContainerId = "recaptcha-container"): Promise<{ success: boolean; error?: string }> => {
      // Normalize to E.164 (+91 for India if not prefixed)
      const digitsOnly = phone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("+")
        ? phone
        : digitsOnly.length === 10
        ? `+91${digitsOnly}`
        : `+${digitsOnly}`;

      if (!isFirebaseConfigured || !auth) {
        // Demo mode fallback
        setDemoPhone(formattedPhone);
        setConfirmationPending(true);
        return { success: true };
      }

      try {
        let appVerifier = (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier;
        if (!appVerifier) {
          appVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
            size: "invisible",
          });
          (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = appVerifier;
        }

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setConfirmationPending(true);
        return { success: true };
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Firebase sendOtp error:", error);
        return { success: false, error: error.message || "Failed to send OTP SMS" };
      }
    },
    []
  );

  const verifyOtp = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      if (!isFirebaseConfigured || !auth) {
        // Demo OTP verification: Accept code
        const mockUser: AuthUser = {
          uid: `demo-${demoPhone ? demoPhone.replace(/\D/g, "") : Math.random().toString(36).slice(2, 8)}`,
          phoneNumber: demoPhone || "+919876543210",
          isDemo: true,
        };
        setUser(mockUser);
        try {
          window.localStorage.setItem("workspot-demo-user", JSON.stringify(mockUser));
        } catch {
          // ignore
        }
        setConfirmationPending(false);
        return { success: true };
      }

      if (!confirmationResult) {
        return { success: false, error: "No OTP request pending. Please request an OTP first." };
      }

      try {
        const credential = await confirmationResult.confirm(code);
        if (credential.user) {
          setUser({
            uid: credential.user.uid,
            phoneNumber: credential.user.phoneNumber,
          });
        }
        setConfirmationResult(null);
        setConfirmationPending(false);
        return { success: true };
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Firebase verifyOtp error:", error);
        return { success: false, error: error.message || "Invalid OTP code" };
      }
    },
    [confirmationResult, demoPhone]
  );

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    } else {
      try {
        window.localStorage.removeItem("workspot-demo-user");
      } catch {
        // ignore
      }
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseActive: isFirebaseConfigured,
        confirmationPending,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
