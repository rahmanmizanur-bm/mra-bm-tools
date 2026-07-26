import AuthGate from "./AuthGate";
import TextGenerator from "./tools/TextGenerator";
import Pastebin from "./tools/Pastebin";

// Single island per tool page: gates the tool behind Supabase sign-in, then
// renders the matching tool. Add one line per new tool.
export default function ToolHost({ slug }: { slug: string }) {
  const tool = renderTool(slug);

  // Exception: viewing an existing paste (?id=) must work without login so public
  // links are shareable. Row-Level Security still enforces visibility — a webalive
  // or private paste simply returns no row to an anonymous reader.
  const isPasteView =
    slug === "pastebin" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("id");

  if (isPasteView) return tool;
  return <AuthGate>{tool}</AuthGate>;
}

function renderTool(slug: string) {
  switch (slug) {
    case "text-generator":
      return <TextGenerator />;
    case "pastebin":
      return <Pastebin />;
    default:
      return null;
  }
}
