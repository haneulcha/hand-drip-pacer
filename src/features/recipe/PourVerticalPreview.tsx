import type { Pour } from '@/domain/types'
import { formatTime } from '@/ui/format'

type Props = {
  readonly pours: readonly Pour[]
  readonly totalTimeSec: number
  readonly width?: number
  readonly height?: number
}

export function PourVerticalPreview({
  pours,
  totalTimeSec,
  width = 340,
  height = 230,
}: Props) {
  if (pours.length === 0 || totalTimeSec <= 0) return null

  const padT = 10
  const padB = 10
  const axisX = 44
  const nodeR = 3.5
  const rightLabelWidth = 70
  const barMaxW = width - axisX - 16 - rightLabelWidth

  const maxDelta = Math.max(...pours.map((p) => p.pourAmount))
  const ty = (t: number): number =>
    padT + (t / totalTimeSec) * (height - padT - padB)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block max-w-full"
      role="img"
      aria-label="푸어 스케줄"
    >
      <desc>
        {pours
          .map(
            (p) =>
              `${formatTime(p.atSec)} +${p.pourAmount}그램${p.label === 'bloom' ? ' (뜸)' : ''}`,
          )
          .join(', ')}
      </desc>

      <line
        x1={axisX}
        y1={padT}
        x2={axisX}
        y2={height - padB}
        stroke="var(--color-border)"
        strokeWidth={0.8}
      />

      {pours.map((p) => {
        const y = ty(p.atSec)
        const barW = (p.pourAmount / maxDelta) * barMaxW
        const barStart = axisX + nodeR + 4
        const bloom = p.label === 'bloom'
        const color = bloom ? 'var(--color-pour-bloom)' : 'var(--color-pour-main)'

        return (
          <g key={p.index}>
            <text
              x={axisX - 8}
              y={y + 3}
              fontSize={10}
              fill="var(--color-text-secondary)"
              textAnchor="end"
              className="tabular-nums"
            >
              {formatTime(p.atSec)}
            </text>
            <circle cx={axisX} cy={y} r={nodeR} fill={color} stroke={color} />
            <line
              x1={barStart}
              y1={y}
              x2={barStart + barW}
              y2={y}
              stroke={color}
              strokeWidth={bloom ? 2.2 : 2}
              strokeLinecap="round"
              opacity={bloom ? 1 : 0.88}
            />
            <text
              x={barStart + barW + 8}
              y={y + 3.5}
              fontSize={11}
              fill="var(--color-text-primary)"
              fontWeight={500}
              className="tabular-nums"
            >
              +{p.pourAmount}g
            </text>
            {bloom && (
              <text
                x={width - 4}
                y={y + 3.5}
                fontSize={9}
                fill="var(--color-pour-bloom)"
                textAnchor="end"
                fontWeight={600}
                letterSpacing={0.4}
              >
                bloom
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
