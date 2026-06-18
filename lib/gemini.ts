import { marked } from "marked";
import DOMPurify from "dompurify";
import katex from "katex";

// localStorage keys — key, model, prompt template and the cached model list
// all persist per browser.
export const KEY_STORAGE = "geminiApiKey";
export const MODEL_STORAGE = "geminiModel";
export const MODELS_STORAGE = "geminiModels";
export const PROMPT_STORAGE = "geminiPromptTemplate";

// The editable auto-send prompt. {topic} and {paperName} are substituted at
// send time.
export const DEFAULT_PROMPT_TEMPLATE =
  'Explain "{topic}" in reference to {paperName}. ' +
  "Cover the key concepts in simple, clear terms, and add reference points " +
  "(key definitions, formulas, and where to read more) I should remember.";

export const TOPIC_VAR = "{topic}";
export const PAPER_VAR = "{paperName}";

export interface GeminiModel {
  id: string;
  label: string;
}

// Shown until the live list loads (or if the fetch fails).
export const FALLBACK_MODELS: GeminiModel[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

// Default preference: Gemini 3.1 Flash Lite, then any flash-lite, then any
// flash, else the first available.
export function pickDefaultModel(list: GeminiModel[]): string {
  const pick =
    list.find((m) => m.id === "gemini-3.1-flash-lite") ||
    list.find((m) => m.id.includes("flash-lite")) ||
    list.find((m) => m.id.includes("flash")) ||
    list[0];
  return pick?.id || FALLBACK_MODELS[0].id;
}

// Ask the Gemini API which models this key can actually use — always current,
// reflects the user's own plan/access. Falls back to the static list on error.
export async function fetchGeminiModels(apiKey: string): Promise<GeminiModel[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1000`
    );
    if (!res.ok) return FALLBACK_MODELS;
    const data = await res.json();
    const models: GeminiModel[] = (data?.models || [])
      .filter(
        (m: { name?: string; supportedGenerationMethods?: string[] }) =>
          m.name?.startsWith("models/gemini") &&
          m.supportedGenerationMethods?.includes("generateContent")
      )
      .map((m: { name: string; displayName?: string }) => ({
        id: m.name.replace(/^models\//, ""),
        label: (m.displayName || m.name.replace(/^models\//, "")).replace(/^Gemini\s*/i, "Gemini "),
      }));

    if (!models.length) return FALLBACK_MODELS;

    // Newest/most useful first: higher version, then pro/flash, demote dated/preview snapshots.
    const score = (id: string) => {
      let s = 0;
      const ver = id.match(/gemini-(\d+(?:\.\d+)?)/);
      if (ver) s += parseFloat(ver[1]) * 100;
      if (id.includes("pro")) s += 30;
      else if (id.includes("flash")) s += 20;
      if (id.includes("latest")) s += 5;
      if (/\d{3,}/.test(id.replace(/gemini-\d+(?:\.\d+)?/, ""))) s -= 10;
      if (id.includes("preview") || id.includes("exp")) s -= 5;
      return s;
    };
    return models.sort((a, b) => score(b.id) - score(a.id));
  } catch {
    return FALLBACK_MODELS;
  }
}

export function getPromptTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_PROMPT_TEMPLATE;
  return localStorage.getItem(PROMPT_STORAGE) || DEFAULT_PROMPT_TEMPLATE;
}

export function setPromptTemplate(value: string) {
  localStorage.setItem(PROMPT_STORAGE, value);
}

export function fillTemplate(
  template: string,
  vars: { topic?: string | null; paper?: string | null }
): string {
  const topic = vars.topic?.trim() || "this topic";
  const paper = vars.paper?.trim() || "this subject";
  return template
    .split("{topic name}") // legacy variable name
    .join(topic)
    .split(TOPIC_VAR)
    .join(topic)
    .split(PAPER_VAR)
    .join(paper);
}

// Marks resource HTML that was produced from Gemini markdown, so the viewer
// renders it directly (with math) instead of routing it through tiptap, which
// can't display KaTeX.
export const MD_MARKER = "<!--gemini-md-->";

export function withMarker(html: string): string {
  return MD_MARKER + html;
}
export function isRenderedMarkdown(s?: string | null): boolean {
  return !!s && s.startsWith(MD_MARKER);
}
export function stripMarker(s: string): string {
  return s.startsWith(MD_MARKER) ? s.slice(MD_MARKER.length) : s;
}

// Child-element styling for rendered markdown (no typography plugin needed).
// The "gemini-md" hook lets globals.css own code/highlight colors so they stay
// readable in dark mode (arbitrary variants below dodge the dark utility remap).
export const MARKDOWN_CLASS =
  "gemini-md text-sm leading-relaxed break-words " +
  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
  "[&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:my-2 [&_h3]:font-semibold [&_h3]:my-2 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 " +
  "[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em] [&_code]:font-mono " +
  "[&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_a]:text-purple-600 [&_a]:underline [&_strong]:font-semibold " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_blockquote]:my-2 " +
  "[&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-gray-300 [&_th]:px-2 [&_th]:py-1 [&_th]:whitespace-nowrap [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 " +
  "[&_hr]:my-3 [&_hr]:border-gray-200 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1";

// Render Gemini's markdown (incl. LaTeX math) to safe HTML. Used for the live
// chat bubbles and for the HTML stored when saving messages to resources.
marked.setOptions({ gfm: true, breaks: true });

// Pull math out before markdown parsing (so marked doesn't mangle it), render
// each piece with KaTeX, then splice the trusted KaTeX HTML back in after
// sanitizing the surrounding markdown.
function extractMath(src: string, store: (expr: string, display: boolean) => string): string {
  return src
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, e) => store(e, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, e) => store(e, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, e) => store(e, false))
    .replace(/\$(?!\s)([^\n$]+?)(?<!\s)\$/g, (_, e) => store(e, false));
}

export function markdownToHtml(md: string): string {
  const pieces: string[] = [];
  const token = (i: number) => `%%GEMINIMATH${i}%%`;
  const store = (expr: string, display: boolean) => {
    try {
      pieces.push(katex.renderToString(expr.trim(), { throwOnError: false, displayMode: display }));
    } catch {
      pieces.push(expr);
    }
    return token(pieces.length - 1);
  };

  const withTokens = extractMath(md ?? "", store);
  let html = marked.parse(withTokens, { async: false }) as string;
  if (typeof window !== "undefined") html = DOMPurify.sanitize(html);
  // Restore KaTeX HTML (trusted: generated by us, default trust:false escapes input).
  html = html.replace(/%%GEMINIMATH(\d+)%%/g, (_, i) => pieces[Number(i)] ?? "");
  return html;
}
