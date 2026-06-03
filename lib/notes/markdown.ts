// Markdown helpers for the Notes phase.
//
// Two paths, deliberately split so the card grid never pays the bundle cost:
//   - stripMd()        — cheap, synchronous, regex-only. Used for card previews.
//                        Never imports `marked` / `dompurify`.
//   - renderMarkdown() — lazy-imports `marked` + `dompurify` on first call.
//                        Used only inside the editor's View mode.

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "code",
  "pre",
  "blockquote",
  "a",
  "hr",
  "br"
]

const ALLOWED_URI_REGEXP = /^(https?:|mailto:|tel:)/i

/**
 * Plaintext extractor for card previews. Strips the common Markdown delimiters
 * so a preview never shows raw `#`, `*`, `>` etc. Intentionally lossy and cheap
 * — this is a preview, not a renderer.
 */
export function stripMd(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/^#{1,6}\s+/gm, "") // ATX headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // unordered bullets
    .replace(/^\s*\d+\.\s+/gm, "") // ordered bullets
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1") // emphasis
    .replace(/^\s*[-*_]{3,}\s*$/gm, " ") // horizontal rules
    .replace(/\n{2,}/g, "\n") // collapse blank lines
    .trim()
}

/**
 * Render Markdown to sanitized HTML. Lazy-imports `marked` + `dompurify` so the
 * cold content-script bundle never carries them. Every anchor in the output is
 * forced to open in a new tab with a safe `rel`.
 */
export async function renderMarkdown(body: string): Promise<string> {
  const [{ marked }, { default: DOMPurify }] = await Promise.all([
    import("marked"),
    import("dompurify")
  ])

  const rawHtml = await marked.parse(body, { async: true, breaks: true })

  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href"],
    FORBID_TAGS: ["img", "iframe", "video", "audio", "script", "style"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
    ALLOWED_URI_REGEXP
  })

  return hardenLinks(clean)
}

/** Post-sanitize pass: force `target="_blank" rel="noreferrer noopener"` on links. */
function hardenLinks(html: string): string {
  if (typeof document === "undefined") return html
  const tpl = document.createElement("template")
  tpl.innerHTML = html
  tpl.content.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank")
    a.setAttribute("rel", "noreferrer noopener")
  })
  return tpl.innerHTML
}
