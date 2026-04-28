import { ChevronDown, Sunrise } from "lucide-react"

interface TodoHeaderProps {
  theme: "light" | "dark"
  /** Active view label, e.g. "Today". */
  title: string
}

export function TodoHeader({ theme, title }: TodoHeaderProps) {
  // Compact-mode header. Step 3 ships a static title; the dropdown +
  // maximize + list-config affordances arrive in steps 4 and 8.
  return (
    <header
      className="flex h-11 shrink-0 items-center px-3"
      style={{
        borderBottom:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.06)"
      }}>
      <button
        type="button"
        // Click is a no-op in Step 3 — view dropdown wires up in Step 4.
        className={
          "flex items-center gap-1.5 rounded px-1.5 py-1 -ml-1.5 " +
          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        }
        aria-label={`${title} view — switch view (coming soon)`}
        aria-haspopup="listbox"
        aria-expanded={false}>
        <Sunrise size={14} strokeWidth={2} aria-hidden="true" />
        <span className="text-[14px] font-semibold leading-none">{title}</span>
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  )
}
