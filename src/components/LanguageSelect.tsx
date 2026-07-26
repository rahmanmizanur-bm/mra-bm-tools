import { useEffect, useId, useMemo, useRef, useState } from "react";

// Accessible listbox replacing the native <select>, so the menu can be themed
// (a native option list is painted by the OS and ignores our tokens entirely).
// Each language carries a monogram badge tinted with its own signature colour —
// cheaper and sharper at 20px than real logo SVGs, and it stays legible in both
// themes because the tint is alpha-composited over the panel.

export interface LanguageOption {
  value: string;
  label: string;
  mark: string;
  color: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "plaintext",  label: "Plain text", mark: "TXT", color: "#8b93a1" },
  { value: "javascript", label: "JavaScript", mark: "JS",  color: "#e8b90b" },
  { value: "typescript", label: "TypeScript", mark: "TS",  color: "#3178c6" },
  { value: "python",     label: "Python",     mark: "PY",  color: "#3f7cad" },
  { value: "json",       label: "JSON",       mark: "{ }", color: "#9aa35c" },
  { value: "html",       label: "HTML",       mark: "<>",  color: "#e34c26" },
  { value: "css",        label: "CSS",        mark: "CSS", color: "#1572b6" },
  { value: "sql",        label: "SQL",        mark: "SQL", color: "#d08434" },
  { value: "bash",       label: "Bash",       mark: "$_",  color: "#4eaa25" },
  { value: "markdown",   label: "Markdown",   mark: "MD",  color: "#5a9bc4" },
  { value: "yaml",       label: "YAML",       mark: "YML", color: "#cb4b4b" },
  { value: "go",         label: "Go",         mark: "GO",  color: "#00add8" },
  { value: "rust",       label: "Rust",       mark: "RS",  color: "#c96442" },
  { value: "java",       label: "Java",       mark: "JV",  color: "#c1712f" },
];

function Badge({ opt, size = 20 }: { opt: LanguageOption; size?: number }) {
  return (
    <span
      className="lang-badge"
      style={{
        width: size,
        height: size,
        color: opt.color,
        // 22% tint of the language colour over whatever the panel is.
        background: `color-mix(in srgb, ${opt.color} 22%, transparent)`,
        fontSize: opt.mark.length > 2 ? size * 0.36 : size * 0.44,
      }}
      aria-hidden="true"
    >
      {opt.mark}
    </span>
  );
}

export default function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ buf: "", at: 0 });
  const id = useId();

  const selectedIndex = useMemo(() => {
    const i = LANGUAGE_OPTIONS.findIndex((o) => o.value === value);
    return i < 0 ? 0 : i;
  }, [value]);
  const selected = LANGUAGE_OPTIONS[selectedIndex];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row in view while arrowing through a scrolled list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLLIElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openAt(i: number) {
    setActive(i);
    setOpen(true);
  }

  function commit(i: number) {
    onChange(LANGUAGE_OPTIONS[i].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = LANGUAGE_OPTIONS.length - 1;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openAt(selectedIndex);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        return;
      case "Tab":
        setOpen(false);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        return;
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i >= last ? 0 : i + 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i <= 0 ? last : i - 1));
        return;
      case "Home":
        e.preventDefault();
        setActive(0);
        return;
      case "End":
        e.preventDefault();
        setActive(last);
        return;
    }

    // Type-ahead: "ja" jumps to Java, resetting after a second of silence.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = e.timeStamp;
      typed.current.buf = now - typed.current.at > 1000 ? e.key : typed.current.buf + e.key;
      typed.current.at = now;
      const q = typed.current.buf.toLowerCase();
      const hit = LANGUAGE_OPTIONS.findIndex((o) => o.label.toLowerCase().startsWith(q));
      if (hit >= 0) setActive(hit);
    }
  }

  return (
    <div ref={rootRef} className="lang-select">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={onKeyDown}
        className="tool-input lang-trigger"
      >
        <Badge opt={selected} />
        <span className="lang-trigger-label">{selected.label}</span>
        <svg
          className={`lang-chev${open ? " is-open" : ""}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label="Language"
          tabIndex={-1}
          className="lang-menu"
        >
          {LANGUAGE_OPTIONS.map((opt, i) => {
            const isSel = i === selectedIndex;
            return (
              <li
                key={opt.value}
                id={`${id}-opt-${i}`}
                data-idx={i}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(i)}
                className={`lang-option${i === active ? " is-active" : ""}`}
                style={{ animationDelay: `${Math.min(i, 8) * 14}ms` }}
              >
                <Badge opt={opt} size={22} />
                <span className="lang-option-label">{opt.label}</span>
                {isSel && (
                  <svg
                    width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
