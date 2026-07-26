// Single source of truth for every tool. Homepage grid, search, and routing read this.
// Add a tool = add an entry here (+ its page/island when `status: "ready"`).

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: Category;
  tags: string[];
  status: "ready" | "soon";
  icon: string; // inline SVG path data (24x24, currentColor stroke)
}

export type Category = "Text" | "Encode" | "Format" | "Generate" | "Web";

export const CATEGORIES: Category[] = ["Text", "Generate", "Format", "Encode", "Web"];

export const TOOLS: Tool[] = [
  {
    slug: "text-generator",
    name: "Lorem Ipsum / Text Generator",
    description: "Generate placeholder text - paragraphs, sentences, words, lists or bytes. Classic, Hipster, Bacon, Cicero or your own words. Plain, HTML or Markdown output.",
    category: "Generate",
    tags: ["lorem", "ipsum", "placeholder", "dummy text", "filler", "hipster", "bacon"],
    status: "ready",
    icon: "M4 6h16M4 12h16M4 18h10",
  },
  {
    slug: "pastebin",
    name: "Pastebin",
    description: "Share text or code via a link. Public, webalive-only, or private. Auto-deletes after up to 30 days. Sign-in required to create.",
    category: "Web",
    tags: ["paste", "pastebin", "share", "snippet", "code", "gist"],
    status: "ready",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    slug: "character-counter",
    name: "Character & Word Counter",
    description: "Live counts for characters, words, sentences, lines and reading time.",
    category: "Text",
    tags: ["count", "words", "characters", "length"],
    status: "soon",
    icon: "M7 8h10M7 12h6M5 4h14a1 1 0 011 1v14l-4-3H5a1 1 0 01-1-1V5a1 1 0 011-1z",
  },
  {
    slug: "diff-checker",
    name: "Diff Checker",
    description: "Compare two texts side by side and highlight the differences.",
    category: "Text",
    tags: ["diff", "compare", "merge"],
    status: "soon",
    icon: "M8 4v16M16 4v16M4 8h8M12 16h8",
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    description: "UPPER, lower, Title, camelCase, snake_case, kebab-case and more.",
    category: "Text",
    tags: ["case", "camel", "snake", "kebab", "title"],
    status: "soon",
    icon: "M4 7V5h16v2M9 5v14M7 19h4",
  },
  {
    slug: "base64",
    name: "Base64 Encode / Decode",
    description: "Encode text to Base64 or decode it back, instantly in your browser.",
    category: "Encode",
    tags: ["base64", "encode", "decode"],
    status: "soon",
    icon: "M4 7l8-4 8 4v10l-8 4-8-4V7zM12 3v18",
  },
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    description: "Pretty-print, minify and validate JSON.",
    category: "Format",
    tags: ["json", "format", "prettify", "minify"],
    status: "soon",
    icon: "M8 4H6a2 2 0 00-2 2v3a2 2 0 01-2 2 2 2 0 012 2v3a2 2 0 002 2h2M16 4h2a2 2 0 012 2v3a2 2 0 002 2 2 2 0 00-2 2v3a2 2 0 01-2 2h-2",
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    description: "Generate one or many v4 UUIDs with a click.",
    category: "Generate",
    tags: ["uuid", "guid", "id", "random"],
    status: "soon",
    icon: "M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 100 8 4 4 0 000-8z",
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    description: "Strong random passwords with configurable length and character sets.",
    category: "Generate",
    tags: ["password", "random", "secure"],
    status: "soon",
    icon: "M7 11V8a5 5 0 0110 0v3M5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z",
  },
];

export const READY_TOOLS = TOOLS.filter((t) => t.status === "ready");

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
