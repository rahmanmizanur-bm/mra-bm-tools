import { type ReactNode } from "react";
import { ALLOWED_DOMAIN, isConfigured } from "../lib/auth";
import { useAuth } from "../lib/useAuth";
import SignInForm from "./SignInForm";

// Gates a tool: children render only for a signed-in @webalive.com.au user.
export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();

  if (user) return <>{children}</>;

  if (!ready) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Checking sign-in…
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-sm rounded-[var(--radius-card)] border p-8 text-center"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <div
        className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full"
        style={{ background: "var(--bg-subtle)", color: "var(--brand)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
        Sign in to use this tool
      </h2>
      <p className="mt-1.5 mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
        Tools are for <strong>@{ALLOWED_DOMAIN}</strong> accounts. Ask Rahman for a login.
      </p>

      {isConfigured ? (
        <SignInForm />
      ) : (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Auth is not configured yet (missing <code>PUBLIC_SUPABASE_*</code> env).
        </p>
      )}
    </div>
  );
}
