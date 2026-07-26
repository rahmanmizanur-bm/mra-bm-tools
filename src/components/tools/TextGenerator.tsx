import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generate,
  POOLS,
  type Format,
  type GenerateResult,
  type HtmlOptions,
  type Length,
  type Unit,
  type WordPool,
} from "../../lib/lorem";
import { toast } from "../../lib/toast";

const UNITS: { value: Unit; label: string }[] = [
  { value: "paragraphs", label: "Paragraphs" },
  { value: "sentences", label: "Sentences" },
  { value: "words", label: "Words" },
  { value: "lists", label: "Lists" },
  { value: "bytes", label: "Bytes" },
];

const LENGTHS: { value: Length; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
  { value: "mixed", label: "Mixed" },
];

const FORMATS: { value: Format; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "html", label: "HTML" },
  { value: "markdown", label: "Markdown" },
];

const HTML_TOGGLES: { key: keyof HtmlOptions; label: string }[] = [
  { key: "wrapParagraphs", label: "<p> paragraphs" },
  { key: "headers", label: "<h2> headers" },
  { key: "boldItalic", label: "<b> / <i>" },
  { key: "links", label: "<a> links" },
  { key: "lists", label: "<ul> / <ol>" },
  { key: "blockquote", label: "<blockquote>" },
  { key: "code", label: "<pre><code>" },
];

const DEFAULT_HTML: HtmlOptions = {
  wrapParagraphs: true,
  headers: false,
  boldItalic: false,
  links: false,
  lists: false,
  blockquote: false,
  code: false,
};

// "custom" is a UI-only pool option; the engine reads customWords directly.
type PoolChoice = WordPool | "custom";

export default function TextGenerator() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(5);
  const [poolChoice, setPoolChoice] = useState<PoolChoice>("classic");
  const [customWords, setCustomWords] = useState("");
  const [length, setLength] = useState<Length>("medium");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [format, setFormat] = useState<Format>("plain");
  const [html, setHtml] = useState<HtmlOptions>(DEFAULT_HTML);
  const [nonce, setNonce] = useState(0); // bump to force a fresh shuffle
  const [copied, setCopied] = useState(false);
  // The output is editable: generated text seeds it, but the user can freely rewrite.
  const [output, setOutput] = useState("");

  const result: GenerateResult = useMemo(() => {
    return generate({
      unit,
      count,
      pool: poolChoice === "custom" ? "classic" : poolChoice,
      customWords: poolChoice === "custom" ? customWords : "",
      length,
      startWithLorem,
      format,
      html,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, count, poolChoice, customWords, length, startWithLorem, format, html, nonce]);

  // Any option change / regenerate overwrites the editable output with fresh text.
  useEffect(() => {
    setOutput(result.text);
  }, [result.text]);

  // Stats track the CURRENT (possibly hand-edited) text, not just the generated output.
  const stats = useMemo(() => {
    const words = (output.match(/[A-Za-z]+/g) ?? []).length;
    const sentences = (output.match(/[.!?]+/g) ?? []).length;
    return { words, sentences, chars: output.length };
  }, [output]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const supportsLength = unit === "paragraphs" || unit === "sentences";
  const supportsHtml = format === "html";
  const unitHint = unit === "bytes" ? "bytes" : unit === "lists" ? "lists" : unit;

  // Keep latest output in a ref so the keyboard listener stays bound once (no re-add per keystroke).
  const textRef = useRef(output);
  useEffect(() => {
    textRef.current = output;
  }, [output]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textRef.current);
      setCopied(true);
      toast("Copied to clipboard");
    } catch {
      toast("Copy failed", "error");
    }
  }, []);

  function download() {
    const ext = format === "html" ? "html" : format === "markdown" ? "md" : "txt";
    const mime = format === "html" ? "text/html" : format === "markdown" ? "text/markdown" : "text/plain";
    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorem-ipsum.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded lorem-ipsum.${ext}`);
  }

  // Press "c" to copy — ignored while typing in a field, and Ctrl/Cmd+C stays native.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "c" && e.key !== "C") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      e.preventDefault();
      void copy();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* ---------- Controls ---------- */}
      <aside
        className="flex flex-col gap-5 rounded-[var(--radius-card)] border p-5"
        style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      >
        {/* Unit */}
        <Field label="Generate">
          <div className="grid grid-cols-3 gap-1.5">
            {UNITS.map((u) => (
              <Segment key={u.value} active={unit === u.value} onClick={() => setUnit(u.value)}>
                {u.label}
              </Segment>
            ))}
          </div>
        </Field>

        {/* Count */}
        <Field label={`How many (${unitHint})`}>
          <div className="flex items-center gap-2">
            <StepBtn onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="Decrease">
              −
            </StepBtn>
            <input
              type="number"
              min={1}
              max={2000}
              value={count}
              onChange={(e) => setCount(clamp(parseInt(e.target.value || "1", 10), 1, 2000))}
              className="tool-input w-full px-3 py-2 text-center text-sm"
            />
            <StepBtn onClick={() => setCount((c) => Math.min(2000, c + 1))} aria-label="Increase">
              +
            </StepBtn>
          </div>
        </Field>

        {/* Word pool */}
        <Field label="Word set">
          <select
            value={poolChoice}
            onChange={(e) => setPoolChoice(e.target.value as PoolChoice)}
            className="tool-input w-full px-3 py-2 text-sm"
          >
            {(Object.keys(POOLS) as WordPool[]).map((k) => (
              <option key={k} value={k}>
                {POOLS[k].label}
              </option>
            ))}
            <option value="custom">Custom words…</option>
          </select>
          {poolChoice === "custom" && (
            <textarea
              value={customWords}
              onChange={(e) => setCustomWords(e.target.value)}
              placeholder="Paste your own words (space or comma separated). Min 3 words."
              rows={3}
              className="tool-input mt-2 w-full px-3 py-2 text-sm"
            />
          )}
        </Field>

        {/* Length */}
        {supportsLength && (
          <Field label="Length">
            <div className="grid grid-cols-4 gap-1.5">
              {LENGTHS.map((l) => (
                <Segment key={l.value} active={length === l.value} onClick={() => setLength(l.value)}>
                  {l.label}
                </Segment>
              ))}
            </div>
          </Field>
        )}

        {/* Format */}
        <Field label="Output format">
          <div className="grid grid-cols-3 gap-1.5">
            {FORMATS.map((f) => (
              <Segment key={f.value} active={format === f.value} onClick={() => setFormat(f.value)}>
                {f.label}
              </Segment>
            ))}
          </div>
        </Field>

        {/* HTML options */}
        {supportsHtml && (
          <Field label="HTML elements">
            <div className="flex flex-col gap-2">
              {HTML_TOGGLES.map((t) => (
                <Check
                  key={t.key}
                  checked={html[t.key]}
                  onChange={(v) => setHtml((h) => ({ ...h, [t.key]: v }))}
                  label={t.label}
                />
              ))}
            </div>
          </Field>
        )}

        {/* Start with lorem */}
        <Check
          checked={startWithLorem}
          onChange={setStartWithLorem}
          label={'Start with "Lorem ipsum…"'}
        />
      </aside>

      {/* ---------- Output ---------- */}
      <section className="flex min-h-[420px] flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNonce((n) => n + 1)}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            ↻ Regenerate
          </button>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {copied ? (
              "✓ Copied"
            ) : (
              <>
                Copy
                <span
                  className="rounded border px-1 py-px font-mono text-[10px] leading-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  c
                </span>
              </>
            )}
          </button>
          <button
            onClick={download}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Download
          </button>

          <div className="ml-auto flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <Stat label="words" value={stats.words} />
            <Stat label="sentences" value={stats.sentences} />
            <Stat label="chars" value={stats.chars} />
          </div>
        </div>

        <textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          spellCheck={false}
          aria-label="Generated text (editable)"
          className="tool-input w-full flex-1 resize-none p-4 text-sm leading-relaxed"
          style={{ fontFamily: format === "plain" ? "inherit" : "var(--font-mono)" }}
        />
      </section>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

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

function Segment({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: active ? "var(--brand)" : "var(--bg-subtle)",
        color: active ? "var(--brand-fg)" : "var(--text)",
        border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
      }}
    >
      {children}
    </button>
  );
}

function StepBtn({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      {...rest}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-lg transition-colors hover:bg-[var(--bg-subtle)]"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      {children}
    </button>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none" style={{ color: "var(--text)" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--brand)]"
      />
      <span className="font-mono text-xs">{label}</span>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="font-semibold" style={{ color: "var(--text)" }}>
        {value.toLocaleString()}
      </span>{" "}
      {label}
    </span>
  );
}
