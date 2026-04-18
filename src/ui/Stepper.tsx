type Props = {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
  readonly min: number
  readonly max: number
  readonly step?: number
  readonly suffix?: string
}

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: Props) {
  const decDisabled = value <= min
  const incDisabled = value >= max
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={decDisabled}
        aria-label={`${label} 감소`}
        className="px-3 py-1.5 text-lg text-text-secondary disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-[3.5rem] border-x border-border px-2 py-1.5 text-center text-sm font-medium tabular-nums">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={incDisabled}
        aria-label={`${label} 증가`}
        className="px-3 py-1.5 text-lg text-text-secondary disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
