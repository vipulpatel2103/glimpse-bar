import { APPS } from "~/lib/apps/registry"
import { hiddenAppsItem, type AppId } from "~/lib/storage"
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"

/** Apps the user can toggle. "settings" is always visible and excluded here. */
const TOGGLEABLE = APPS.filter((a) => a.id !== "settings")

export function AppVisibilitySection() {
  const [hiddenApps, setHiddenApps] = useStorageItem(hiddenAppsItem)
  const hidden = hiddenApps as AppId[]

  async function toggle(id: AppId) {
    const next = hidden.includes(id)
      ? hidden.filter((h) => h !== id)
      : [...hidden, id]
    await setHiddenApps(next)
  }

  return (
    <section>
      <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Apps
      </h2>
      <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
        Choose which icons appear in the Glimpse Bar.
      </p>

      <ul className="space-y-2">
        {TOGGLEABLE.map((app) => {
          const visible = !hidden.includes(app.id)
          const Icon = app.Icon
          return (
            <li key={app.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`app-vis-${app.id}`}
                checked={visible}
                onChange={() => void toggle(app.id)}
                className="accent-blue-500"
              />
              <label
                htmlFor={`app-vis-${app.id}`}
                className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium"
              >
                {app.iconUrl ? (
                  <img
                    src={app.iconUrl}
                    alt=""
                    aria-hidden="true"
                    style={{ width: 14, height: 14, objectFit: "contain" }}
                  />
                ) : Icon ? (
                  <Icon size={14} strokeWidth={2} aria-hidden="true" />
                ) : null}
                {app.name}
              </label>
            </li>
          )
        })}

        {/* Settings — always visible, non-toggleable */}
        <li className="flex items-center gap-3 opacity-40">
          <input type="checkbox" checked disabled className="accent-blue-500" />
          <label className="flex flex-1 items-center gap-2 text-sm font-medium">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center">⚙</span>
            Settings
            <span className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
              (always visible)
            </span>
          </label>
        </li>
      </ul>
    </section>
  )
}
