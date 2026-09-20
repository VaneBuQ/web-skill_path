/**
 * Sesión del usuario.
 *
 * El token se guarda en localStorage para sobrevivir a una recarga, y al
 * arrancar se valida contra `/auth/me`: si venció o la cuenta ya no existe, la
 * sesión se cierra sola en vez de dejar la app en un estado a medias.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api, setAuthToken } from "./api";
import type { Profile, Session } from "./types";

const STORAGE_KEY = "skillpath.token";

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Modo privado o almacenamiento bloqueado: la app funciona igual,
    // solo que la sesión no sobrevive a la recarga.
    return null;
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sin almacenamiento, nada que hacer */
  }
}

interface AuthValue {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    setAuthToken(null);
    storeToken(null);
    setUser(null);
  }, []);

  const adopt = useCallback((session: Session) => {
    setAuthToken(session.token);
    storeToken(session.token);
    setUser({
      userId: session.userId,
      name: session.name,
      email: session.email,
      initials: session.initials,
      createdAt: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setAuthToken(token);
    api
      .me()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch((error: unknown) => {
        // Token vencido o cuenta borrada: se limpia. Cualquier otro fallo
        // (la API caída) no debe borrar la sesión del usuario.
        if (cancelled) return;
        if (error instanceof ApiError && (error.isUnauthenticated || error.status === 404)) {
          signOut();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [signOut]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => adopt(await api.login(email, password)),
      signUp: async (name, email, password) => adopt(await api.register(name, email, password)),
      signOut,
    }),
    [user, loading, adopt, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return value;
}
