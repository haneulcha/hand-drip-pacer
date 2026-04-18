import type { Recipe } from '@/domain/types'
import { formatTime } from '@/ui/format'

type Props = { readonly recipe: Recipe }

const VIEW_W = 600
const VIEW_H = 220
const PAD_L = 36
const PAD_R = 20
const PAD_T = 16
const PAD_B = 32

const CHART_W = VIEW_W - PAD_L - PAD_R
const CHART_H = VIEW_H - PAD_T - PAD_B
const BASELINE_Y = PAD_T + CHART_H

const TOP_Y_PCT = (PAD_T / VIEW_H) * 100
const BASELINE_Y_PCT = (BASELINE_Y / VIEW_H) * 100
const TIME_LABEL_Y_PCT = ((VIEW_H - PAD_B + 16) / VIEW_H) * 100
const Y_AXIS_EDGE_PCT = (PAD_L / VIEW_W) * 100

export function PourTimeline({ recipe }: Props) {
  const { totalWater, totalTimeSec, pours } = recipe

  const xScale = (t: number): number => PAD_L + (t / totalTimeSec) * CHART_W
  const yScale = (cum: number): number =>
    PAD_T + CHART_H - (cum / totalWater) * CHART_H
  const xPct = (t: number): number => (xScale(t) / VIEW_W) * 100

  const points: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    ...pours.map((p) => [p.atSec, p.cumulativeWater] as const),
    [totalTimeSec, totalWater],
  ]

  const lineD = points
    .map(
      ([t, cum], i) =>
        `${i === 0 ? 'M' : 'L'} ${xScale(t).toFixed(1)} ${yScale(cum).toFixed(1)}`,
    )
    .join(' ')

  const areaD = `${lineD} L ${xScale(totalTimeSec).toFixed(1)} ${BASELINE_Y} L ${xScale(
    0,
  ).toFixed(1)} ${BASELINE_Y} Z`

  const descText = pours
    .map(
      (p) => `${formatTime(p.atSec)} +${p.pourAmount}그램 누적 ${p.cumulativeWater}그램`,
    )
    .join(', ')

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="푸어 타임라인"
        className="block h-auto w-full"
      >
        <desc>
          총 {formatTime(totalTimeSec)}, 누적 {totalWater}그램. 푸어: {descText}.
        </desc>

        {pours.map((p) => (
          <line
            key={`grid-${p.index}`}
            x1={xScale(p.atSec)}
            y1={PAD_T}
            x2={xScale(p.atSec)}
            y2={BASELINE_Y}
            stroke="var(--color-timeline-grid)"
            strokeWidth="1"
          />
        ))}

        <line
          x1={PAD_L}
          y1={BASELINE_Y}
          x2={VIEW_W - PAD_R}
          y2={BASELINE_Y}
          stroke="var(--color-timeline-axis)"
          strokeWidth="1"
        />

        <path d={areaD} fill="var(--color-pour-main)" fillOpacity="0.12" />
        <path d={lineD} fill="none" stroke="var(--color-pour-main)" strokeWidth="2" />

        {pours.map((p) => (
          <circle
            key={`marker-${p.index}`}
            cx={xScale(p.atSec)}
            cy={yScale(p.cumulativeWater)}
            r={5}
            fill={
              p.label === 'bloom'
                ? 'var(--color-pour-bloom)'
                : 'var(--color-pour-main)'
            }
            stroke="var(--color-surface)"
            strokeWidth="2"
          >
            <title>{`${formatTime(p.atSec)} · +${p.pourAmount}g (누적 ${p.cumulativeWater}g)`}</title>
          </circle>
        ))}
      </svg>

      <span
        aria-hidden="true"
        style={{ top: `${TOP_Y_PCT}%`, left: `${Y_AXIS_EDGE_PCT}%` }}
        className="pointer-events-none absolute -translate-x-full -translate-y-1/2 pr-1.5 text-xs text-text-muted tabular-nums"
      >
        {totalWater}g
      </span>
      <span
        aria-hidden="true"
        style={{ top: `${BASELINE_Y_PCT}%`, left: `${Y_AXIS_EDGE_PCT}%` }}
        className="pointer-events-none absolute -translate-x-full -translate-y-1/2 pr-1.5 text-xs text-text-muted tabular-nums"
      >
        0
      </span>

      {pours.map((p) => (
        <span
          key={`tlabel-${p.index}`}
          aria-hidden="true"
          style={{ left: `${xPct(p.atSec)}%`, top: `${TIME_LABEL_Y_PCT}%` }}
          className="pointer-events-none absolute -translate-x-1/2 text-xs text-text-muted tabular-nums"
        >
          {formatTime(p.atSec)}
        </span>
      ))}
    </div>
  )
}
