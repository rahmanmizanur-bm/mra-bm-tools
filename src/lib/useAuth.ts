import { useEffect, useState } from "react";
import { getUser, initAuth, onAuthChange, type AuthUser } from "./auth";

export interface AuthState {
  user: AuthUser | null;
  ready: boolean; // Supabase finished restoring any cached session
}

/** Subscribe a React component to the shared Supabase auth singleton. */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const off = onAuthChange(setUser);
    initAuth().finally(() => {
      setUser(getUser());
      setReady(true);
    });
    return off;
  }, []);

  return { user, ready };
}
