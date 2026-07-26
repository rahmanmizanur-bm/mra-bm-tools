// Lorem / text generation engine - pure, framework-agnostic, client-side.
// Supports multiple word pools, unit types (words/sentences/paragraphs/lists/bytes),
// configurable lengths, the classic "Lorem ipsum..." opener, and HTML/Markdown output.

export type WordPool = "classic" | "cicero" | "hipster" | "bacon";
export type Unit = "paragraphs" | "sentences" | "words" | "lists" | "bytes";
export type Format = "plain" | "html" | "markdown";
export type Length = "short" | "medium" | "long" | "mixed";

export interface GenerateOptions {
  unit: Unit;
  count: number;
  pool: WordPool;
  customWords?: string; // whitespace/comma separated; used when provided
  length: Length; // controls sentences-per-paragraph + words-per-sentence
  startWithLorem: boolean;
  format: Format;
  html: HtmlOptions; // only applied when format === "html"
}

export interface HtmlOptions {
  wrapParagraphs: boolean; // <p>
  headers: boolean; // <h2> before some paragraphs
  boldItalic: boolean; // wrap some words in <b>/<i>
  links: boolean; // wrap some words in <a>
  lists: boolean; // insert <ul>/<ol>
  blockquote: boolean;
  code: boolean; // <pre><code>
}

export const POOLS: Record<WordPool, { label: string; words: string[] }> = {
  classic: {
    label: "Classic Latin",
    words: "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" "),
  },
  cicero: {
    label: "Cicero (full Latin)",
    words: "at vero eos accusamus iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores quas molestias excepturi sint occaecati cupiditate provident similique culpa officia deserunt mollitia animi laborum dolorum fuga harum quidem rerum facilis expedita distinctio nam libero tempore cum soluta nobis eligendi optio cumque nihil impedit quo minus quod maxime placeat facere possimus omnis voluptas assumenda dolor repellendus temporibus autem quibusdam officiis debitis necessitatibus saepe eveniet".split(" "),
  },
  hipster: {
    label: "Hipster",
    words: "artisan cred selvage banjo vinyl kale chips gastropub retro fixie ennui kombucha tote bag flannel gentrify humblebrag bespoke pour-over cold-pressed migas heirloom locavore mixtape wayfarers meditation portland vegan tattooed knausgaard schlitz meh polaroid brunch venmo cronut hashtag echo park kinfolk succulents lo-fi tousled synth mustache pabst raclette forage crucifix leggings".split(" "),
  },
  bacon: {
    label: "Bacon",
    words: "bacon ipsum dolor amet ribeye pork belly short loin ground round chuck brisket meatball sausage tenderloin drumstick turkey ham hock jerky sirloin cupim shank pancetta prosciutto salami bresaola landjaeger boudin pastrami capicola beef ribs flank filet mignon andouille kielbasa venison biltong chislic frankfurter jowl leberkas rump swine tri-tip".split(" "),
  },
};

// Length presets → [minSentencesPerParagraph, max], [minWordsPerSentence, max].
const LENGTH_PRESETS: Record<Exclude<Length, "mixed">, { s: [number, number]; w: [number, number] }> = {
  short: { s: [2, 3], w: [4, 8] },
  medium: { s: [4, 6], w: [6, 12] },
  long: { s: [7, 10], w: [9, 18] },
};

const LOREM_OPENER = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resolveWords(opts: GenerateOptions): string[] {
  const custom = (opts.customWords ?? "").trim();
  if (custom.length > 0) {
    const parsed = custom.split(/[\s,]+/).map((w) => w.trim()).filter(Boolean);
    if (parsed.length >= 3) return parsed;
  }
  return POOLS[opts.pool].words;
}

function lengthFor(opts: GenerateOptions): { s: [number, number]; w: [number, number] } {
  if (opts.length === "mixed") return pick([LENGTH_PRESETS.short, LENGTH_PRESETS.medium, LENGTH_PRESETS.long]);
  return LENGTH_PRESETS[opts.length];
}

function makeSentence(words: string[], wordRange: [number, number]): string {
  const n = rand(wordRange[0], wordRange[1]);
  const chosen: string[] = [];
  for (let i = 0; i < n; i++) chosen.push(pick(words));
  // sprinkle a comma somewhere in longer sentences
  let text = chosen.join(" ");
  if (n > 6 && Math.random() < 0.5) {
    const at = rand(2, n - 2);
    const parts = chosen.slice();
    parts[at] = parts[at] + ",";
    text = parts.join(" ");
  }
  return capitalize(text) + ".";
}

function makeParagraph(words: string[], preset: { s: [number, number]; w: [number, number] }): string[] {
  const n = rand(preset.s[0], preset.s[1]);
  const sentences: string[] = [];
  for (let i = 0; i < n; i++) sentences.push(makeSentence(words, preset.w));
  return sentences;
}

// --- HTML decoration helpers ---
function decorateInline(sentence: string, html: HtmlOptions): string {
  if (!html.boldItalic && !html.links) return sentence;
  const tokens = sentence.split(" ");
  return tokens
    .map((tok) => {
      const r = Math.random();
      if (html.links && r < 0.04) return `<a href="#">${tok}</a>`;
      if (html.boldItalic && r < 0.08) return `<b>${tok}</b>`;
      if (html.boldItalic && r < 0.12) return `<i>${tok}</i>`;
      return tok;
    })
    .join(" ");
}

// --- Output builders per format ---

function buildPlain(paras: string[][]): string {
  return paras.map((s) => s.join(" ")).join("\n\n");
}

function buildMarkdown(paras: string[][], words: string[]): string {
  const out: string[] = [];
  paras.forEach((sentences, i) => {
    if (i > 0 && i % 3 === 0) out.push(`## ${capitalize(pick(words))} ${pick(words)}`);
    out.push(sentences.join(" "));
  });
  return out.join("\n\n");
}

function buildHtml(paras: string[][], words: string[], html: HtmlOptions): string {
  const out: string[] = [];
  paras.forEach((sentences, i) => {
    if (html.headers && i > 0 && i % 3 === 0) {
      out.push(`<h2>${capitalize(pick(words))} ${pick(words)}</h2>`);
    }
    const body = sentences.map((s) => decorateInline(s, html)).join(" ");

    if (html.blockquote && i > 0 && i % 5 === 0) {
      out.push(`<blockquote>\n  <p>${body}</p>\n</blockquote>`);
      return;
    }
    if (html.wrapParagraphs) out.push(`<p>${body}</p>`);
    else out.push(body);

    if (html.lists && i % 4 === 3) {
      const tag = Math.random() < 0.5 ? "ul" : "ol";
      const items = Array.from({ length: rand(3, 5) }, () => `  <li>${capitalize(pick(words))} ${pick(words)} ${pick(words)}</li>`);
      out.push(`<${tag}>\n${items.join("\n")}\n</${tag}>`);
    }
    if (html.code && i % 6 === 5) {
      out.push(`<pre><code>${pick(words)}(${pick(words)}, ${pick(words)});</code></pre>`);
    }
  });
  return out.join("\n");
}

export interface GenerateResult {
  text: string;
  stats: { words: number; sentences: number; paragraphs: number; chars: number };
}

export function generate(opts: GenerateOptions): GenerateResult {
  const words = resolveWords(opts);
  const preset = lengthFor(opts);
  const count = Math.max(1, Math.min(opts.count, 2000));

  let paras: string[][] = [];

  switch (opts.unit) {
    case "words": {
      const flat: string[] = [];
      for (let i = 0; i < count; i++) flat.push(pick(words));
      let joined = capitalize(flat.join(" ")) + ".";
      if (opts.startWithLorem) joined = injectOpener(joined, "words");
      paras = [[joined]];
      break;
    }
    case "sentences": {
      const s: string[] = [];
      for (let i = 0; i < count; i++) s.push(makeSentence(words, preset.w));
      if (opts.startWithLorem) s[0] = LOREM_OPENER + ".";
      paras = [s];
      break;
    }
    case "lists": {
      // each "list" = a block of items; render as paragraphs of single-line items
      for (let i = 0; i < count; i++) {
        const items = Array.from({ length: rand(4, 7) }, () => "- " + capitalize(makeSentence(words, preset.w)).replace(/\.$/, ""));
        paras.push([items.join("\n")]);
      }
      break;
    }
    case "bytes": {
      // generate until we hit ~count bytes
      const target = count;
      let acc = "";
      while (acc.length < target) acc += makeSentence(words, preset.w) + " ";
      acc = acc.slice(0, target).trimEnd();
      if (opts.startWithLorem) acc = injectOpener(acc, "bytes");
      paras = [[acc]];
      break;
    }
    case "paragraphs":
    default: {
      for (let i = 0; i < count; i++) paras.push(makeParagraph(words, preset));
      if (opts.startWithLorem && paras[0]?.length) {
        paras[0][0] = LOREM_OPENER + ", " + lowerFirst(paras[0][0]);
      }
      break;
    }
  }

  let text: string;
  if (opts.format === "html") text = buildHtml(paras, words, opts.html);
  else if (opts.format === "markdown") text = buildMarkdown(paras, words);
  else text = buildPlain(paras);

  return { text, stats: computeStats(paras, text) };
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function injectOpener(text: string, unit: "words" | "bytes"): string {
  if (unit === "words") return LOREM_OPENER + " " + lowerFirst(text);
  return LOREM_OPENER + ". " + text;
}

function computeStats(paras: string[][], text: string): GenerateResult["stats"] {
  const flatText = paras.map((s) => s.join(" ")).join(" ");
  const words = (flatText.match(/[A-Za-z]+/g) ?? []).length;
  const sentences = (flatText.match(/[.!?]+/g) ?? []).length;
  return {
    words,
    sentences: Math.max(sentences, 0),
    paragraphs: paras.length,
    chars: text.length,
  };
}
