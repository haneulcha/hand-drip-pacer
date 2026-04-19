// Sketch primitives — hand-drawn vibe (b&w + 1 ochre accent)
// Intentionally loose: slight rotations, wobbly strokes, handwritten font for labels.

const INK = '#2a241e';
const INK_SOFT = 'rgba(42,36,30,0.55)';
const INK_FAINT = 'rgba(42,36,30,0.18)';
const PAPER = '#fbf7ef';
const PAPER_SUBTLE = '#f5efe4';
const OCHRE = '#b8843f';

// little helper to jitter rotation a tiny amount based on a key
const wobble = (seed = 0) => {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 0.8; // ±0.4deg
};

// Handwritten label (short, used for hints/sticky notes, not body)
function Hand({ children, size = 14, color = INK_SOFT, style = {} }) {
  return (
    <span style={{
      fontFamily: '"Caveat", "Kalam", "Comic Sans MS", cursive',
      fontSize: size,
      color,
      lineHeight: 1.15,
      ...style,
    }}>{children}</span>
  );
}

// Printed label (for actual UI copy — keeps sketch from reading cartoonish)
function Label({ children, size = 12, color = INK_SOFT, weight = 500, style = {} }) {
  return (
    <span style={{
      fontFamily: '"Pretendard Variable","Pretendard",system-ui,sans-serif',
      fontSize: size,
      color,
      fontWeight: weight,
      letterSpacing: 0.2,
      ...style,
    }}>{children}</span>
  );
}

// Numeric display — tabular, the "real" UI element
function Num({ children, size = 28, weight = 500, color = INK, style = {} }) {
  return (
    <span style={{
      fontFamily: '"Pretendard Variable","Pretendard",system-ui,sans-serif',
      fontVariantNumeric: 'tabular-nums',
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing: -0.5,
      ...style,
    }}>{children}</span>
  );
}

// Sketchy rectangle — uses SVG so strokes can be wobbly
function SketchBox({ width = 100, height = 40, fill = 'none', stroke = INK, strokeWidth = 1.2, seed = 0, dashed = false, children, style = {}, radius = 6 }) {
  const w = width, h = height;
  const j = (n) => n + wobble(seed + n) * 1.2; // jitter per-corner
  // draw a loose rounded rect using a path with slight corner wobble
  const r = radius;
  const d = `
    M ${j(r)} ${j(0)}
    L ${j(w - r)} ${j(0)}
    Q ${j(w)} ${j(0)}, ${j(w)} ${j(r)}
    L ${j(w)} ${j(h - r)}
    Q ${j(w)} ${j(h)}, ${j(w - r)} ${j(h)}
    L ${j(r)} ${j(h)}
    Q ${j(0)} ${j(h)}, ${j(0)} ${j(h - r)}
    L ${j(0)} ${j(r)}
    Q ${j(0)} ${j(0)}, ${j(r)} ${j(0)}
    Z
  `;
  return (
    <div style={{ position: 'relative', width, height, ...style }}>
      <svg
        width={width} height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <path
          d={d}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dashed ? '4 3' : undefined}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );
}

// Loose underline (for emphasis / section dividers)
function SketchLine({ width = 100, stroke = INK, strokeWidth = 1, seed = 0, style = {} }) {
  const h = 6;
  const y0 = 3 + wobble(seed) * 1.2;
  const y1 = 3 + wobble(seed + 1) * 1.2;
  const y2 = 3 + wobble(seed + 2) * 1.2;
  const d = `M 0 ${y0} Q ${width * 0.5} ${y1}, ${width} ${y2}`;
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ overflow: 'visible', ...style }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// Segmented control — sketchy, 2-3 options
function Segmented({ options, value, width = 240, height = 36, seed = 0 }) {
  const cellW = width / options.length;
  return (
    <SketchBox width={width} height={height} seed={seed} radius={8}>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {options.map((opt, i) => (
          <div key={i} style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRight: i < options.length - 1 ? `1px solid ${INK_FAINT}` : 'none',
            background: opt === value ? 'rgba(42,36,30,0.08)' : 'transparent',
            position: 'relative',
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            <Label size={12} color={opt === value ? INK : INK_SOFT} weight={opt === value ? 600 : 400} style={{ whiteSpace: 'nowrap' }}>
              {opt}
            </Label>
            {opt === value && (
              <div style={{ position: 'absolute', bottom: 3, left: '25%', right: '25%' }}>
                <SketchLine width={cellW * 0.5} stroke={OCHRE} strokeWidth={1.4} seed={seed + i + 7} />
              </div>
            )}
          </div>
        ))}
      </div>
    </SketchBox>
  );
}

// Stepper — [ - N + ]
function Stepper({ value, unit = '', width = 140, height = 40, seed = 0 }) {
  return (
    <SketchBox width={width} height={height} seed={seed} radius={8}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <div style={{ flex: '0 0 36px', textAlign: 'center' }}>
          <Label size={18} weight={400} color={INK_SOFT}>−</Label>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Num size={18}>{value}</Num>
          {unit && <Label size={11} style={{ marginLeft: 2 }}>{unit}</Label>}
        </div>
        <div style={{ flex: '0 0 36px', textAlign: 'center' }}>
          <Label size={18} weight={400} color={INK_SOFT}>+</Label>
        </div>
      </div>
    </SketchBox>
  );
}

// Slider — track with wobbly line, handle, min/max
function Slider({ value, min = 0, max = 100, unit = 'g', width = 280, seed = 0 }) {
  const pct = (value - min) / (max - min);
  const handleX = 10 + pct * (width - 20);
  return (
    <div style={{ width, position: 'relative', paddingTop: 4 }}>
      <svg width={width} height={24} viewBox={`0 0 ${width} 24`} style={{ overflow: 'visible' }}>
        {/* track */}
        <path
          d={`M 10 12 Q ${width * 0.33} ${12 + wobble(seed) * 0.8}, ${width * 0.66} ${12 + wobble(seed + 1) * 0.8} T ${width - 10} 12`}
          fill="none" stroke={INK_FAINT} strokeWidth={2} strokeLinecap="round"
        />
        {/* filled */}
        <path
          d={`M 10 12 L ${handleX} 12`}
          fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round"
        />
        {/* handle */}
        <circle cx={handleX} cy={12} r={7} fill={PAPER} stroke={INK} strokeWidth={1.4} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <Label size={10} color={INK_FAINT}>{min}{unit}</Label>
        <Num size={14}>{value}<Label size={10} color={INK_SOFT} style={{ marginLeft: 2 }}>{unit}</Label></Num>
        <Label size={10} color={INK_FAINT}>{max}{unit}</Label>
      </div>
    </div>
  );
}

// Dial (for variation C — a big value control)
function Dial({ value, label, size = 120, seed = 0 }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 6;
  // tick marks
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(a) * (r - 4);
    const y1 = cy + Math.sin(a) * (r - 4);
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    const hv = i % 6 === 0;
    ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={hv ? INK : INK_FAINT} strokeWidth={hv ? 1.2 : 0.8} strokeLinecap="round" />);
  }
  // handle at ~67%
  const a = 0.67 * Math.PI * 2 - Math.PI / 2;
  const hx = cx + Math.cos(a) * (r - 10);
  const hy = cy + Math.sin(a) * (r - 10);
  return (
    <div style={{ width: size, textAlign: 'center' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={r + wobble(seed)} fill="none" stroke={INK} strokeWidth={1.2} />
        {ticks}
        <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={3.5} fill={OCHRE} stroke={INK} strokeWidth={1} />
      </svg>
      <div style={{ marginTop: -size / 2 - 8, pointerEvents: 'none' }}>
        <Num size={22}>{value}</Num>
      </div>
      <div style={{ marginTop: size / 2 - 12 }}>
        <Label size={11} color={INK_SOFT}>{label}</Label>
      </div>
    </div>
  );
}

// Pour timeline — horizontal, with area (wireframe-y)
function PourTimelineH({ pours = [], width = 420, height = 120, seed = 0 }) {
  const total = pours[pours.length - 1]?.t || 240;
  const maxW = pours[pours.length - 1]?.w || 300;
  const pad = 12;
  const tx = (t) => pad + (t / total) * (width - pad * 2);
  const wy = (w) => height - pad - (w / maxW) * (height - pad * 2 - 12);

  // area path through cumulative points
  let d = `M ${tx(0)} ${height - pad}`;
  pours.forEach(p => { d += ` L ${tx(p.t)} ${wy(p.w)}`; });
  d += ` L ${tx(total)} ${height - pad} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* baseline */}
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={INK_FAINT} strokeWidth={1} />
      {/* area */}
      <path d={d} fill={OCHRE} fillOpacity={0.12} stroke="none" />
      {/* stroked top */}
      <path
        d={pours.map((p, i) => `${i === 0 ? 'M' : 'L'} ${tx(p.t)} ${wy(p.w)}`).join(' ')}
        fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* markers */}
      {pours.map((p, i) => (
        <g key={i}>
          <circle cx={tx(p.t)} cy={wy(p.w)} r={p.bloom ? 5 : 4} fill={p.bloom ? OCHRE : PAPER} stroke={INK} strokeWidth={1.2} />
          <line x1={tx(p.t)} y1={wy(p.w)} x2={tx(p.t)} y2={height - pad} stroke={INK_FAINT} strokeWidth={0.8} strokeDasharray="2 2" />
          <text x={tx(p.t)} y={height - pad + 14} fontSize={10} textAnchor="middle" fill={INK_SOFT} fontFamily="'Pretendard Variable',system-ui,sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(p.t)}
          </text>
          <text x={tx(p.t)} y={wy(p.w) - 8} fontSize={10} textAnchor="middle" fill={INK} fontFamily="'Pretendard Variable',system-ui,sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {p.w}g
          </text>
        </g>
      ))}
    </svg>
  );
}

// Pour timeline — vertical (dripper metaphor: water falling)
function PourTimelineV({ pours = [], width = 200, height = 360, seed = 0 }) {
  const total = pours[pours.length - 1]?.t || 240;
  const maxW = pours[pours.length - 1]?.w || 300;
  const pad = 16;
  const ty = (t) => pad + 24 + (t / total) * (height - pad * 2 - 24);
  // x is cumulative water (width)
  const cx = width / 2;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* central axis */}
      <line x1={cx} y1={pad + 24} x2={cx} y2={height - pad} stroke={INK_FAINT} strokeWidth={1} />
      {/* dripper silhouette at top */}
      <g transform={`translate(${cx - 28}, ${pad - 4})`}>
        <path d="M 0 0 L 56 0 L 44 22 L 12 22 Z" fill="none" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
        <line x1={22} y1={22} x2={22} y2={26} stroke={INK} strokeWidth={1.2} />
        <line x1={34} y1={22} x2={34} y2={26} stroke={INK} strokeWidth={1.2} />
      </g>
      {/* pours */}
      {pours.map((p, i) => {
        const y = ty(p.t);
        const barW = (p.delta / maxW) * (width - pad * 2) * 0.85;
        return (
          <g key={i}>
            <line x1={cx - 30} y1={y} x2={cx + 30} y2={y} stroke={p.bloom ? OCHRE : INK} strokeWidth={1.2} strokeLinecap="round" />
            <circle cx={cx} cy={y} r={p.bloom ? 5 : 4} fill={p.bloom ? OCHRE : PAPER} stroke={INK} strokeWidth={1.2} />
            {/* time on left */}
            <text x={cx - 38} y={y + 4} fontSize={11} textAnchor="end" fill={INK_SOFT} fontFamily="'Pretendard Variable',system-ui,sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(p.t)}
            </text>
            {/* amounts on right */}
            <text x={cx + 38} y={y + 4} fontSize={12} fill={INK} fontFamily="'Pretendard Variable',system-ui,sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
              +{p.delta}g
            </text>
            <text x={cx + 38} y={y + 17} fontSize={10} fill={INK_FAINT} fontFamily="'Pretendard Variable',system-ui,sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
              ({p.w}g)
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

Object.assign(window, {
  INK, INK_SOFT, INK_FAINT, PAPER, PAPER_SUBTLE, OCHRE,
  Hand, Label, Num,
  SketchBox, SketchLine,
  Segmented, Stepper, Slider, Dial,
  PourTimelineH, PourTimelineV,
  formatTime,
});
