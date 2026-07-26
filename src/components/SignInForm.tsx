import { useState } from "react";
import { ALLOWED_DOMAIN, emailAllowed, signIn } from "../lib/auth";
import { toast } from "../lib/toast";

// Email + password sign-in. Accounts are created by hand in the Supabase dashboard,
// so there is no signup path and no "forgot password" — both would need email we
// cannot deliver. See src/lib/auth.ts for why.
export default function SignInForm({ onDone }: { onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailAllowed(email)) {
      toast(`Only @${ALLOWED_DOMAIN} accounts are allowed`, "error");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      toast("Signed in");
      onDone?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not sign in", "error");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "tool-input w-full px-3 py-2 text-sm";

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 text-left">
      <input
        type="email"
        autoFocus
        required
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={`you@${ALLOWED_DOMAIN}`}
        className={inputCls}
      />
      <input
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className={inputCls}
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
