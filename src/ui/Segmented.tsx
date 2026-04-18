import { cx } from './cx'

export type SegmentedOption<T extends string> = {
  readonly value: T
  readonly label: string
  readonly disabled?: boolean
}

type Props<T extends string> = {
  readonly name: string
  readonly label: string
  readonly value: T
  readonly options: readonly SegmentedOption<T>[]
  readonly onChange: (value: T) => void
}

export function Segmented<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-md border border-border bg-surface-inset p-0.5"
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <label
            key={opt.value}
            className={cx(
              'relative cursor-pointer select-none rounded px-3 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary',
              opt.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}
