import { useEffect, useMemo, useState } from "react";
import { toast } from "../../lib/toast";
import { getUser } from "../../lib/auth";
import { createPaste, getPaste, type Paste, type Visibility } from "../../lib/api";
import SignInForm from "../SignInForm";
import LanguageSelect, { LANGUAGE_OPTIONS } from "../LanguageSelect";

const VISIBILITIES: { value: Visibility; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Anyone with the link (no login)" },
  { value: "webalive", label: "Webalive", hint: "Any signed-in @webalive.com.au user" },
  { value: "private", label: "Private", hint: "Only you" },
];

const EXPIRY_OPTIONS = [1, 7, 14, 30];

function siteBase(): string {
  return (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
}

function baseUrl(): string {
  return `${siteBase()}/tools/pastebin`;
}

// The webalive tier gets the real wordmark instead of the word. Its "Web" half is
// near-black, so the chip keeps a light plate in both themes — on the dark
// background that half would otherwise disappear and leave a floating "Alive".
function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  if (visibility === "webalive") {
    return (
      <span className="vis-badge vis-badge-logo" title="Visible to any signed-in @webalive.com.au user">
        <img src={`${siteBase()}/webalive-logo.png`} alt="Webalive" width={76} height={13} />
      </span>
    );
  }
  const hint =
    visibility === "public" ? "Anyone with the link, no login required" : "Only you can open this";
  return (
    <span className="vis-badge" title={hint}>
      {visibility}
    </span>
  );
}

export default function Pastebin() {
  const initialId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("id");
  }, []);

  if (initialId) return <PasteView id={initialId} />;
  return <PasteCreate />;
}

/* ---------------- Create ---------------- */

function PasteCreate() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [visibility, setVisibility] = useState<Visibility>("webalive");
  const [expiry, setExpiry] = useState(30);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function submit() {
    if (!content.trim()) {
      toast("Nothing to save", "error");
      return;
    }
    setBusy(true);
    try {
      const meta = await createPaste({
        content,
        title: title.trim() || null,
        language,
        visibility,
        expires_in_days: expiry,
      });
      setShareUrl(`${window.location.origin}${baseUrl()}?id=${meta.id}`);
      toast("Paste created");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  if (shareUrl) {
    return (
      <div
        className="mx-auto max-w-xl rounded-[var(--radius-card)] border p-6 text-center"
        style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Paste created</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Share this link. It expires in {expiry} day{expiry > 1 ? "s" : ""}.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input readOnly value={shareUrl} className="tool-input flex-1 px-3 py-2 text-sm" />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl).then(() => toast("Link copied"))}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Copy
          </button>
        </div>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <a href={shareUrl} style={{ color: "var(--brand)" }}>Open paste →</a>
          <button onClick={() => setShareUrl(null)} style={{ color: "var(--text-muted)" }}>New paste</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="flex min-h-[360px] flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="tool-input px-3 py-2 text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your text or code here…"
          spellCheck={false}
          className="tool-input w-full flex-1 resize-none p-4 text-sm leading-relaxed"
          style={{ fontFamily: "var(--font-mono)", minHeight: 300 }}
        />
      </div>

      <aside
        className="flex flex-col gap-5 self-start rounded-[var(--radius-card)] border p-5"
        style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      >
        <Field label="Visibility">
          <div className="flex flex-col gap-2">
            {VISIBILITIES.map((v) => (
              <label key={v.value} className="flex cursor-pointer items-start gap-2.5 text-sm" style={{ color: "var(--text)" }}>
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === v.value}
                  onChange={() => setVisibility(v.value)}
                  className="mt-0.5 accent-[var(--brand)]"
                />
                <span>
                  <span className="font-medium">{v.label}</span>
                  <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{v.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Language">
          <LanguageSelect value={language} onChange={setLanguage} />
        </Field>

        <Field label="Expires after (max 30 days)">
          <div className="grid grid-cols-4 gap-1.5">
            {EXPIRY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setExpiry(d)}
                className="rounded-md px-2 py-1.5 text-xs font-medium"
                style={{
                  background: expiry === d ? "var(--brand)" : "var(--bg-subtle)",
                  color: expiry === d ? "var(--brand-fg)" : "var(--text)",
                  border: `1px solid ${expiry === d ? "var(--brand)" : "var(--border)"}`,
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </Field>

        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
        >
          {busy ? "Saving…" : "Create paste"}
        </button>
      </aside>
    </div>
  );
}

/* ---------------- View ---------------- */

function PasteView({ id }: { id: string }) {
  const [paste, setPaste] = useState<Paste | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function copyContent() {
    if (!paste) return;
    try {
      await navigator.clipboard.writeText(paste.content);
      setCopied(true);
      toast("Copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Clipboard blocked by the browser", "error");
    }
  }

  // Press "c" to copy. Ignored while typing, and with a modifier held so the
  // native Ctrl/Cmd+C still copies whatever the user actually selected.
  useEffect(() => {
    if (!paste) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "c" && e.key !== "C") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (window.getSelection()?.toString()) return;
      e.preventDefault();
      copyContent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paste]);

  async function load() {
    setLoading(true);
    setNotFound(false);
    try {
      const p = await getPaste(id);
      if (p) setPaste(p);
      else setNotFound(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load paste", "error");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading paste…</div>;
  }

  if (notFound) {
    const signedIn = !!getUser();
    // RLS hides restricted pastes from anon users the same way it hides missing ones,
    // so an unauthenticated miss could be "needs sign-in". Offer it without leaking which.
    return (
      <div className="mx-auto max-w-sm rounded-[var(--radius-card)] border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Paste unavailable</h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
          {signedIn
            ? "This paste doesn't exist, has expired, or is private to someone else."
            : "It may not exist, may have expired, or may require signing in."}
        </p>
        {!signedIn && (
          <div className="mt-5">
            <SignInForm onDone={load} />
          </div>
        )}
        <a href={baseUrl()} className="mt-5 inline-block text-sm" style={{ color: "var(--brand)" }}>Create a new paste →</a>
      </div>
    );
  }

  if (!paste) return null;

  const expires = new Date(paste.expires_at);
  const lang = LANGUAGE_OPTIONS.find((o) => o.value === paste.language) ?? LANGUAGE_OPTIONS[0];
  const days = Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86_400_000));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{paste.title || "Untitled paste"}</h2>
        <VisibilityBadge visibility={paste.visibility} />
        <span
          className="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-[11px] font-medium"
          style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
        >
          <span
            className="lang-badge"
            style={{
              width: 16, height: 16, color: lang.color, fontSize: lang.mark.length > 2 ? 6 : 7.5,
              background: `color-mix(in srgb, ${lang.color} 22%, transparent)`,
            }}
            aria-hidden="true"
          >
            {lang.mark}
          </span>
          {lang.label}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="text-xs whitespace-nowrap"
            style={{ color: "var(--text-muted)" }}
            title={`Expires ${expires.toLocaleString()}`}
          >
            expires in {days}d
          </span>

          <button
            type="button"
            onClick={copyContent}
            className={`act-btn${copied ? " is-done" : ""}`}
            aria-label="Copy paste content"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 012-2h10" />
              </svg>
            )}
            {copied ? "Copied" : "Copy"}
            <kbd className="kbd">C</kbd>
          </button>

          <a href={baseUrl()} className="act-btn act-btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </a>
        </div>
      </div>
      <pre
        className="tool-input w-full overflow-auto p-4 text-sm leading-relaxed"
        style={{ fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", wordBreak: "break-word", minHeight: 300 }}
      >
        {paste.content}
      </pre>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
