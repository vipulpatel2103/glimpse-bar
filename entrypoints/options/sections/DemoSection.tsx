import { useState } from "react"

import { clearDemoData, seedDemoData } from "~/lib/demo/seed"

type Status = "idle" | "seeded" | "cleared" | "error"

export function DemoSection() {
  const [seeding, setSeeding]   = useState(false)
  const [clearing, setClearing] = useState(false)
  const [status, setStatus]     = useState<Status>("idle")

  async function handleSeed() {
    setSeeding(true)
    setStatus("idle")
    try {
      await seedDemoData()
      setStatus("seeded")
    } catch {
      setStatus("error")
    } finally {
      setSeeding(false)
    }
  }

  async function handleClear() {
    setClearing(true)
    setStatus("idle")
    try {
      await clearDemoData()
      setStatus("cleared")
    } catch {
      setStatus("error")
    } finally {
      setClearing(false)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Demo Data
      </h2>
      <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
        Inject realistic sample PRs and tasks for demo recordings. Replaces all existing data.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void handleSeed()}
          disabled={seeding || clearing}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {seeding ? "Loading…" : "Load demo data"}
        </button>
        <button
          onClick={() => void handleClear()}
          disabled={seeding || clearing}
          className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          {clearing ? "Clearing…" : "Clear all data"}
        </button>
      </div>
      {status === "seeded" && (
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">
          ✓ Demo data loaded — open Glimpse Bar to see it.
        </p>
      )}
      {status === "cleared" && (
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          ✓ All data cleared.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          ✗ Something went wrong. Check the extension console.
        </p>
      )}
    </section>
  )
}
