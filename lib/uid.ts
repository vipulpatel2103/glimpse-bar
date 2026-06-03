// Secure-context-safe v4 UUID generator.
//
// crypto.randomUUID is **secure-context-only** — for content scripts the host
// page's origin determines the context, so a panel rendered on an http:// site
// has no randomUUID and would throw. crypto.getRandomValues, however, is
// available on insecure contexts too. Build a v4 UUID by hand from it.
//
// (TODO + GitHub notif modules carry their own private copies of this. They can
// be refactored to import this shared helper in a follow-up — out of Phase 03
// scope.)
export function uid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
