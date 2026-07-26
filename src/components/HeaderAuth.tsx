import { useState } from "react";
import { isConfigured, signOut } from "../lib/auth";
import { useAuth } from "../lib/useAuth";
import { toast } from "../lib/toast";
import SignInForm from "./SignInForm";

// Header control: "Sign in" (opens a password popover) when logged out;
// initials + sign-out menu when logged in.
export default function HeaderAuth() {
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);

  async function doSignOut() {
    setOpen(false);
    await signOut();
    toast("Signed out");
  }

  if (!isConfigured) return null;
  if (!ready) return <div className="h-9 w-20" aria-hidden="true" />;

  if (!user) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Sign in
        </button>
        {open && (
          <div
            className="absolute right-0 mt-2 w-72 rounded-lg border p-4 shadow-lg"
            style={{ borderColor: "var(--border)", background: "var(--panel)" }}
          >
            <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Sign in with your webalive email.
            </p>
            <SignInForm onDone={() => setOpen(false)} />
          </div>
        )}
      </div>
    );
  }

  const initials = user.name
    .split(/[ .]/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold"
        style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
        title={user.email}
        aria-label="Account menu"
      >
        {initials || "?"}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg border p-1.5 text-sm shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="px-2.5 py-2" style={{ color: "var(--text)" }}>
            <div className="font-medium">{user.name}</div>
            <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={doSignOut}
            className="mt-1 w-full rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: "var(--text)" }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
