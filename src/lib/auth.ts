// Auth via Supabase email + password, locked to @webalive.com.au. Shared singleton
// so every island sees the same session.
//
// There is no self-signup and no email in this flow at all: accounts are created by
// hand in the Supabase dashboard (Authentication → Users → Add user). That is
// deliberate — webalive.com.au enforces DMARC p=reject with strict alignment, and we
// cannot authorise a sender on that domain, so no auth email we send would ever be
// delivered. See supabase/README.md.
//
// The domain check here is fast UX feedback only; the `enforce_email_domain` trigger
// on auth.users is what actually enforces it, and RLS enforces data access.
import type { Session } from "@supabase/supabase-js";
import { ALLOWED_DOMAIN, isConfigured, supabase } from "./supabase";

export { isConfigured, ALLOWED_DOMAIN };

export interface AuthUser {
  email: string;
  name: string;
}

let session: Session | null = null;
let ready: Promise<void> | null = null;
const listeners = new Set<(u: AuthUser | null) => void>();

function toUser(s: Session | null): AuthUser | null {
  const email = s?.user?.email;
  if (!email) return null;
  const name = (s.user.user_metadata?.name as string) || email.split("@")[0];
  return { email: email.toLowerCase(), name };
}

function notify() {
  const u = toUser(session);
  listeners.forEach((cb) => cb(u));
}

export function initAuth(): Promise<void> {
  if (!isConfigured) return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      const { data } = await supabase().auth.getSession();
      session = data.session;
      supabase().auth.onAuthStateChange((_event, s) => {
        session = s;
        notify();
      });
      notify();
    })();
  }
  return ready;
}

export function getUser(): AuthUser | null {
  return toUser(session);
}

export function onAuthChange(cb: (u: AuthUser | null) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emailAllowed(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@" + ALLOWED_DOMAIN);
}

/** Sign in with the password issued to you. Ask Rahman if you don't have an account. */
export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  if (!isConfigured) throw new Error("Auth is not configured");
  if (!emailAllowed(email)) throw new Error(`Only @${ALLOWED_DOMAIN} accounts are allowed`);

  const { data, error } = await supabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(error.message);

  session = data.session;
  notify();
  return toUser(session);
}

export async function signOut(): Promise<void> {
  if (!isConfigured) return;
  await supabase().auth.signOut();
  session = null;
  notify();
}
