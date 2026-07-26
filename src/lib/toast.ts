// Global toast — framework-agnostic so any tool island (or inline script) can call it.
// Islands don't share a React tree, so this lives in the DOM, not in React context.
//
//   import { toast } from "@/lib/toast";
//   toast("Copied to clipboard");
//   toast("Something failed", "error");

export type ToastType = "success" | "error" | "info";

const CONTAINER_ID = "toast-root";

function ensureContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null; // SSR guard
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    el.setAttribute("aria-live", "polite");
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  return el;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

export function toast(message: string, type: ToastType = "success", duration = 2200): void {
  const root = ensureContainer();
  if (!root) return;

  const item = document.createElement("div");
  item.className = `toast toast-${type}`;

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = ICONS[type];

  const text = document.createElement("span");
  text.textContent = message;

  item.appendChild(icon);
  item.appendChild(text);
  root.appendChild(item);

  // trigger enter transition on next frame
  requestAnimationFrame(() => item.classList.add("toast-show"));

  const remove = () => {
    item.classList.remove("toast-show");
    item.addEventListener("transitionend", () => item.remove(), { once: true });
    // hard fallback in case transitionend never fires
    setTimeout(() => item.remove(), 300);
  };

  setTimeout(remove, duration);
}
