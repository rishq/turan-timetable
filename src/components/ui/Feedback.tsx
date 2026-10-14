import type { ReactNode } from 'react'

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-start gap-2 px-5 py-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {text && <p className="text-ink-2">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function PrimaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  )
}

export function Loading({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 px-5 py-10 text-ink-2">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent motion-reduce:animate-none" />
      {label}
    </div>
  )
}

export function PageHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-5 lg:px-8 lg:pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {aside}
    </header>
  )
}

export function Segmented<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={`min-h-9 rounded-sm px-3 text-sm transition-colors ${
            o.id === value ? 'bg-surface font-semibold shadow-[var(--shadow)]' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
