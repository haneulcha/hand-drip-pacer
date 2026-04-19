// Wall flow — 3 screens: Wall → Dripper sheet (with schedule preview) → Brewing mode

// mini preview of pour schedule (sparkline-ish, fits in sheet)
function PourMiniPreview({ pours, width = 300, height = 60, seed = 0 }) {
  const total = pours[pours.length - 1].t;
  const maxW = pours[pours.length - 1].w;
  const pad = 8;
  const tx = (t) => pad + (t / total) * (width - pad * 2);
  const wy = (w) => height - pad - (w / maxW) * (height - pad * 2 - 8);
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke={INK_FAINT}
        strokeWidth={0.8}
      />
      <path
        d={pours
          .map((p, i) => `${i === 0 ? "M" : "L"} ${tx(p.t)} ${wy(p.w)}`)
          .join(" ")}
        fill="none"
        stroke={INK}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pours.map((p, i) => (
        <circle
          key={i}
          cx={tx(p.t)}
          cy={wy(p.w)}
          r={p.bloom ? 3 : 2.5}
          fill={p.bloom ? OCHRE : PAPER}
          stroke={INK}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

// Vertical pour schedule — time flows top→bottom (the direction water pours)
// Each step: time on left · node · horizontal bar (length ∝ delta) · weight label
function PourVerticalPreview({ pours, width = 300, height = 200, seed = 0 }) {
  const total = pours[pours.length - 1].t;
  const padT = 10,
    padB = 10;
  const axisX = 44; // timeline column (narrower — time label on the left)
  const ty = (t) => padT + (t / total) * (height - padT - padB);
  const maxDelta = Math.max(...pours.map((p) => p.delta));
  const barMaxW = width - axisX - 16 - 70; // reserve right side for +delta label
  const nodeR = 3.5;

  return (
    <svg
      width={width}
      height={height}
      style={{ overflow: "visible", display: "block" }}
    >
      {/* vertical axis line */}
      <line
        x1={axisX}
        y1={padT}
        x2={axisX}
        y2={height - padB}
        stroke={INK_FAINT}
        strokeWidth={0.8}
      />

      {pours.map((p, i) => {
        const y = ty(p.t);
        const barW = (p.delta / maxDelta) * barMaxW;
        const barStart = axisX + nodeR + 4;
        return (
          <g key={i}>
            {/* time label (left of axis) */}
            <text
              x={axisX - 8}
              y={y + 3}
              fontSize={10}
              fill={INK_SOFT}
              textAnchor="end"
              fontFamily='"Pretendard Variable", sans-serif'
            >
              {formatTime(p.t)}
            </text>
            {/* node */}
            <circle
              cx={axisX}
              cy={y}
              r={nodeR}
              fill={p.bloom ? OCHRE : INK}
              stroke={p.bloom ? OCHRE : INK}
              strokeWidth={1}
            />
            {/* horizontal bar — this is the pour, reaching right */}
            <line
              x1={barStart}
              y1={y}
              x2={barStart + barW}
              y2={y}
              stroke={p.bloom ? OCHRE : INK}
              strokeWidth={p.bloom ? 2.2 : 2}
              strokeLinecap="round"
              opacity={p.bloom ? 1 : 0.88}
            />
            {/* delta label (right of bar) */}
            <text
              x={barStart + barW + 8}
              y={y + 3.5}
              fontSize={11}
              fill={INK}
              fontFamily='"Pretendard Variable", sans-serif'
              fontWeight={500}
            >
              +{p.delta}g
            </text>
            {/* bloom marker */}
            {p.bloom && (
              <text
                x={width - 4}
                y={y + 3.5}
                fontSize={9}
                fill={OCHRE}
                textAnchor="end"
                fontFamily='"Pretendard Variable", sans-serif'
                fontWeight={600}
                letterSpacing={0.4}
              >
                뜸
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function FeelingGlyph({ kind, color = "#2a241e", size = 34 }) {
  if (kind === "calm") {
    // still circle
    return (
      <svg width={size} height={size} viewBox="0 0 34 34">
        <circle
          cx={17}
          cy={17}
          r={11}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
        />
        <circle cx={17} cy={17} r={2} fill={color} />
      </svg>
    );
  }
  if (kind === "neutral") {
    // horizontal line with tick
    return (
      <svg width={size} height={size} viewBox="0 0 34 34">
        <line
          x1={5}
          y1={17}
          x2={29}
          y2={17}
          stroke={color}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <line
          x1={17}
          y1={13}
          x2={17}
          y2={21}
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.6}
        />
      </svg>
    );
  }
  // wave — unsettled
  return (
    <svg width={size} height={size} viewBox="0 0 34 34">
      <path
        d="M 4 14 Q 10 8, 17 14 T 30 14"
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <path
        d="M 4 20 Q 10 26, 17 20 T 30 20"
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}

function DripperSVG({ type = "v60", size = 90, selected = false }) {
  const stroke = selected ? INK : INK_SOFT;
  const sw = selected ? 1.6 : 1.2;
  if (type === "v60") {
    return (
      <svg width={size} height={size} viewBox="0 0 90 90">
        <path
          d="M 12 20 L 78 20 L 50 70 L 40 70 Z"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <line
          x1={42}
          y1={70}
          x2={42}
          y2={78}
          stroke={stroke}
          strokeWidth={sw}
        />
        <line
          x1={48}
          y1={70}
          x2={48}
          y2={78}
          stroke={stroke}
          strokeWidth={sw}
        />
        <line
          x1={20}
          y1={26}
          x2={70}
          y2={26}
          stroke={stroke}
          strokeWidth={0.8}
          opacity={0.5}
        />
      </svg>
    );
  }
  // kalita wave
  return (
    <svg width={size} height={size} viewBox="0 0 90 90">
      <path
        d="M 14 22 L 76 22 L 62 64 L 28 64 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <line x1={30} y1={64} x2={30} y2={72} stroke={stroke} strokeWidth={sw} />
      <line x1={45} y1={64} x2={45} y2={72} stroke={stroke} strokeWidth={sw} />
      <line x1={60} y1={64} x2={60} y2={72} stroke={stroke} strokeWidth={sw} />
      {/* wave ridges */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${20 + i * 4} ${30 + i * 10} Q ${45} ${26 + i * 10}, ${70 - i * 4} ${30 + i * 10}`}
          fill="none"
          stroke={stroke}
          strokeWidth={0.8}
          opacity={0.5}
        />
      ))}
    </svg>
  );
}

// ─── Screen 1: Wall ─────────────────────────────────────────
function WallScreen({ width = 375, height = 812 }) {
  return (
    <div
      style={{
        width,
        height,
        background: "#ede5d5",
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        position: "relative",
        overflow: "hidden",
        padding: "66px 0 34px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* wall texture hint: faint horizontal banding */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, opacity: 0.5 }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <line
            key={i}
            x1={0}
            y1={i * 22 + Math.random() * 2}
            x2={width}
            y2={i * 22 + Math.random() * 2}
            stroke="rgba(42,36,30,0.04)"
            strokeWidth={0.5}
          />
        ))}
      </svg>

      {/* brand */}
      <div
        style={{
          textAlign: "center",
          marginTop: 40,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Num size={44} weight={500}>
          뜸
        </Num>
        <div style={{ marginTop: 8 }}>
          <Hand size={16} color={INK_SOFT}>
            저만 믿고 따라오세요
          </Hand>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* shelf */}
      <div style={{ position: "relative", paddingBottom: 60 }}>
        {/* drippers on shelf */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 40,
            alignItems: "flex-end",
            marginBottom: 12,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <DripperSVG type="v60" size={96} selected />
            <div style={{ marginTop: 8 }}>
              <Label size={12} weight={600}>
                V60
              </Label>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <DripperSVG type="kalita" size={96} />
            <div style={{ marginTop: 8 }}>
              <Label size={12} color={INK_SOFT}>
                Kalita
              </Label>
            </div>
          </div>
        </div>
        {/* shelf plank */}
        <svg
          width={width}
          height={16}
          style={{ position: "absolute", bottom: 44, left: 0 }}
        >
          <line
            x1={20}
            y1={2}
            x2={width - 20}
            y2={2}
            stroke={INK}
            strokeWidth={1.2}
          />
          <line
            x1={20}
            y1={2}
            x2={width - 20}
            y2={5}
            stroke={INK_FAINT}
            strokeWidth={0.8}
          />
        </svg>
        <div
          style={{
            textAlign: "center",
            marginTop: 28,
            position: "relative",
            zIndex: 2,
          }}
        >
          <Hand size={13} color={INK_FAINT}>
            커피 내릴 드리퍼를 들어볼까요?
          </Hand>
        </div>
      </div>

      {/* tiny escape hatch to recipe view */}
      <div
        style={{
          position: "absolute",
          bottom: 42,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <Label size={11} color={INK_FAINT}>
          레시피 먼저 보기 ›
        </Label>
      </div>
    </div>
  );
}

// ─── Screen 2a: Morph transition (mid-frame) ────────────────
// Captures the moment between Wall tap and Recipe screen —
// V60 flies from shelf position to top anchor; wall fades; recipe canvas rising from below.
function MorphTransitionScreen({ width = 375, height = 812 }) {
  // progress 0..1 — pick ~0.55 for a readable mid-frame
  const p = 0.55;

  // start position (on shelf, left of center)
  const startX = width / 2 - 60;
  const startY = height - 180;
  const startSize = 96;
  // end position (top anchor, centered)
  const endX = width / 2;
  const endY = 140;
  const endSize = 72;

  const cx = startX + (endX - startX) * p;
  const cy = startY + (endY - startY) * p;
  const size = startSize + (endSize - startSize) * p;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        background: "#ede5d5",
      }}
    >
      {/* fading wall */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - p * 0.6,
          pointerEvents: "none",
        }}
      >
        <svg width={width} height={height} style={{ opacity: 0.5 }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={i * 22 + 1}
              x2={width}
              y2={i * 22 + 1}
              stroke="rgba(42,36,30,0.04)"
              strokeWidth={0.5}
            />
          ))}
        </svg>
        {/* ghosted shelf */}
        <svg
          width={width}
          height={16}
          style={{ position: "absolute", bottom: 104, left: 0 }}
        >
          <line
            x1={20}
            y1={2}
            x2={width - 20}
            y2={2}
            stroke={INK_FAINT}
            strokeWidth={1}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            left: width / 2 + 10,
            bottom: 120,
            opacity: 0.3,
          }}
        >
          <DripperSVG type="kalita" size={96} />
        </div>
      </div>

      {/* rising recipe canvas (from below) — peek */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: height * p * 0.8,
          background: PAPER,
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 32px rgba(42,36,30,0.08)",
          opacity: p,
        }}
      />

      {/* moving dripper */}
      <div
        style={{
          position: "absolute",
          left: cx - size / 2,
          top: cy - size / 2,
          transition: "none",
        }}
      >
        <DripperSVG type="v60" size={size} selected />
      </div>

      {/* motion trail — sketch lines behind the dripper */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <path
          d={`M ${startX} ${startY} Q ${(startX + endX) / 2 - 30} ${(startY + endY) / 2}, ${cx} ${cy}`}
          fill="none"
          stroke={INK_FAINT}
          strokeWidth={0.8}
          strokeDasharray="3 4"
          opacity={0.5}
        />
      </svg>

      {/* progress caption (wireframe annotation — not in real UI) */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <Label size={10} color={INK_FAINT} style={{ letterSpacing: 1 }}>
          MORPH · t = {Math.round(p * 100)}%
        </Label>
      </div>
    </div>
  );
}

// ─── Screen 2b-alt: Recipe with dripper change popover ──────
function RecipeScreenWithPopover({ width = 375, height = 812 }) {
  const anchorSize = 56;
  const innerW = width - 40;

  return (
    <div
      style={{
        width,
        height,
        background: PAPER,
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        padding: "52px 0 28px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* base recipe screen, dimmed */}
      <div style={{ opacity: 0.45, pointerEvents: "none" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 14,
          }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14">
            <path
              d="M 7 2 L 2 7 L 7 12 M 2 7 L 16 7"
              fill="none"
              stroke={INK_SOFT}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <DripperSVG type="v60" size={anchorSize} selected />
          <div style={{ flex: 1 }}>
            <Num size={18} weight={500}>
              V60
            </Num>
            <div>
              <Label size={11} color={INK_SOFT}>
                Kasuya 4:6
              </Label>
            </div>
          </div>
          <Label
            size={11}
            color={INK}
            weight={600}
            style={{ whiteSpace: "nowrap" }}
          >
            바꾸기 ›
          </Label>
        </div>
        <div style={{ padding: "20px 20px 14px" }}>
          <SketchLine width={innerW} stroke={INK_FAINT} seed={200} />
          <div style={{ height: 200 }} />
          <SketchLine width={innerW} stroke={INK_FAINT} seed={201} />
        </div>
      </div>

      {/* popover — small, anchored near '바꾸기' */}
      <div
        style={{
          position: "absolute",
          top: 82,
          right: 16,
          background: PAPER,
          borderRadius: 12,
          padding: "10px 10px",
          boxShadow:
            "0 8px 24px rgba(42,36,30,0.18), 0 2px 6px rgba(42,36,30,0.08)",
          border: `1px solid ${INK_FAINT}`,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 150,
        }}
      >
        {/* arrow pointing up-right */}
        <div
          style={{
            position: "absolute",
            top: -6,
            right: 28,
            width: 10,
            height: 10,
            background: PAPER,
            borderLeft: `1px solid ${INK_FAINT}`,
            borderTop: `1px solid ${INK_FAINT}`,
            transform: "rotate(45deg)",
          }}
        />
        {[
          { type: "v60", name: "V60", sub: "Kasuya 4:6", selected: true },
          { type: "kalita", name: "Kalita", sub: "Wave", selected: false },
        ].map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 8px",
              borderRadius: 8,
              background: d.selected ? "rgba(42,36,30,0.05)" : "transparent",
            }}
          >
            <DripperSVG type={d.type} size={32} selected={d.selected} />
            <div style={{ flex: 1 }}>
              <Num
                size={13}
                weight={d.selected ? 600 : 400}
                color={d.selected ? INK : INK_SOFT}
              >
                {d.name}
              </Num>
              <div>
                <Label size={9} color={INK_FAINT}>
                  {d.sub}
                </Label>
              </div>
            </div>
            {d.selected && (
              <svg width="12" height="10" viewBox="0 0 12 10">
                <path
                  d="M 1 5 L 5 9 L 11 1"
                  fill="none"
                  stroke={INK}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen 2b: Recipe (full screen — absorbs sheet's role) ──
// 컨트롤 + 세로 스케줄 모두 한 화면에서. 시트 없음.
function RecipeScreen({ width = 375, height = 812 }) {
  const anchorSize = 56;
  const innerW = width - 40;

  return (
    <div
      style={{
        width,
        height,
        background: PAPER,
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        padding: "52px 0 28px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* top bar: back + bean/method */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 14,
        }}
      >
        <svg width="18" height="14" viewBox="0 0 18 14">
          <path
            d="M 7 2 L 2 7 L 7 12 M 2 7 L 16 7"
            fill="none"
            stroke={INK_SOFT}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <DripperSVG type="v60" size={anchorSize} selected />
        <div style={{ flex: 1 }}>
          <Num size={18} weight={500}>
            V60
          </Num>
          <div>
            <Label size={11} color={INK_SOFT}>
              Kasuya 4:6
            </Label>
          </div>
        </div>
        <Label size={11} color={INK_FAINT} style={{ whiteSpace: "nowrap" }}>
          바꾸기 ›
        </Label>
      </div>

      {/* controls area */}
      <div
        style={{
          padding: "20px 20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <SketchLine width={innerW} stroke={INK_FAINT} seed={100} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Label size={11}>커피</Label>
          <Stepper
            value={20}
            unit="g"
            width={innerW - 54}
            height={38}
            seed={2}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Label size={11}>맛</Label>
          <Segmented
            options={["달게", "균형", "산뜻하게"]}
            value="균형"
            width={innerW - 54}
            height={34}
            seed={3}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Label size={11}>강도</Label>
          <Segmented
            options={["연하게", "보통", "진하게"]}
            value="보통"
            width={innerW - 54}
            height={34}
            seed={4}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Label size={11}>분쇄</Label>
          <Segmented
            options={["가늘게", "중간", "굵게"]}
            value="중간"
            width={innerW - 54}
            height={34}
            seed={5}
          />
        </div>

        {/* recommended chips + advanced */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
          }}
        >
          <Label size={10} color={INK_FAINT} style={{ whiteSpace: "nowrap" }}>
            권장
          </Label>
          <div
            style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}
          >
            <Num size={11} color={INK_SOFT} style={{ whiteSpace: "nowrap" }}>
              90°
            </Num>
            <Label size={10} color={INK_FAINT}>
              ·
            </Label>
            <Num size={11} color={INK_SOFT} style={{ whiteSpace: "nowrap" }}>
              1:15
            </Num>
            <Label size={10} color={INK_FAINT}>
              ·
            </Label>
            <Num size={11} color={INK_SOFT} style={{ whiteSpace: "nowrap" }}>
              3:30
            </Num>
          </div>
          <Label size={10} color={INK_FAINT} style={{ whiteSpace: "nowrap" }}>
            고급 ›
          </Label>
        </div>

        <SketchLine width={innerW} stroke={INK_FAINT} seed={101} />
      </div>

      {/* pour schedule — vertical, uses remaining space */}
      <div
        style={{
          padding: "4px 20px 0",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Label
            size={11}
            color={INK_FAINT}
            weight={600}
            style={{ letterSpacing: 0.5 }}
          >
            푸어 스케줄
          </Label>
          <Num size={12} color={INK_SOFT} style={{ whiteSpace: "nowrap" }}>
            300g · 3:30 · 4 pours
          </Num>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <PourVerticalPreview
            pours={sampleMobilePours}
            width={innerW}
            height={230}
            seed={110}
          />
        </div>
      </div>

      {/* start button */}
      <div style={{ padding: "12px 20px 0" }}>
        <SketchBox
          width={innerW}
          height={56}
          seed={120}
          radius={12}
          stroke={INK}
          strokeWidth={1.6}
          fill="rgba(42,36,30,0.04)"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16">
              <path d="M 2 2 L 12 8 L 2 14 Z" fill={INK} />
            </svg>
            <Num size={18} weight={500}>
              시작
            </Num>
          </div>
        </SketchBox>
      </div>
    </div>
  );
}

// ─── Screen 2: Dripper sheet (modal with preview) ───────────
function DripperSheetScreen({ width = 375, height = 812 }) {
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        background: "#ede5d5",
      }}
    >
      {/* dimmed wall behind */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(42,36,30,0.35)",
        }}
      />

      {/* sheet */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: PAPER,
          borderRadius: "16px 16px 0 0",
          padding: "12px 20px 34px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: INK_FAINT,
            borderRadius: 2,
            alignSelf: "center",
            marginBottom: 4,
          }}
        />

        {/* dripper header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <DripperSVG type="v60" size={56} selected />
          <div style={{ flex: 1 }}>
            <Num size={20} weight={500}>
              V60
            </Num>
            <div>
              <Label size={11} color={INK_SOFT}>
                Kasuya 4:6
              </Label>
            </div>
          </div>
          <Label size={11} color={INK_FAINT} style={{ whiteSpace: "nowrap" }}>
            바꾸기 ›
          </Label>
        </div>

        <SketchLine width={width - 40} stroke={INK_FAINT} seed={1} />

        {/* compact inputs — 2 rows only */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Label size={11}>커피</Label>
            <Stepper
              value={20}
              unit="g"
              width={width - 40 - 54}
              height={38}
              seed={2}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Label size={11}>맛</Label>
            <Segmented
              options={["달게", "균형", "산뜻하게"]}
              value="균형"
              width={width - 40 - 54}
              height={34}
              seed={3}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Label size={11}>강도</Label>
            <Segmented
              options={["연하게", "보통", "진하게"]}
              value="보통"
              width={width - 40 - 54}
              height={34}
              seed={4}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Label size={11}>분쇄</Label>
            <Segmented
              options={["가늘게", "중간", "굵게"]}
              value="중간"
              width={width - 40 - 54}
              height={34}
              seed={5}
            />
          </div>
        </div>

        {/* recommended values — read-only chips + advanced escape */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Label size={10} color={INK_FAINT} style={{ whiteSpace: "nowrap" }}>
            권장
          </Label>
          <div
            style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}
          >
            <Num size={11} color={INK_SOFT} style={{ whiteSpace: "nowrap" }}>
              90°
            </Num>
            <Label size={10} color={INK_FAINT}>
              ·
            </Label>
            <Num size={11} color={INK_SOFT} style={{ whiteSpace: "nowrap" }}>
              1:15
            </Num>
            <Label size={10} color={INK_FAINT}>
              ·
            </Label>
            <Num size={11} color={INK_SOFT} style={{ whiteSpace: "nowrap" }}>
              3:30
            </Num>
          </div>
          <Label size={10} color={INK_FAINT} style={{ whiteSpace: "nowrap" }}>
            고급 ›
          </Label>
        </div>

        {/* schedule preview — miniature */}
        <div
          style={{ background: PAPER_SUBTLE, borderRadius: 10, padding: 14 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
              gap: 10,
            }}
          >
            <Label size={10} color={INK_FAINT} style={{ whiteSpace: "nowrap" }}>
              레시피 미리보기
            </Label>
            <Num size={13} style={{ whiteSpace: "nowrap" }}>
              300g · 3:30 · 90°
            </Num>
          </div>
          <PourVerticalPreview
            pours={sampleMobilePours}
            width={width - 68}
            height={172}
            seed={10}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 6,
            }}
          >
            <Label size={10} color={INK_FAINT}>
              펼쳐보기 ›
            </Label>
          </div>
        </div>

        {/* start button */}
        <SketchBox
          width={width - 40}
          height={56}
          seed={20}
          radius={12}
          stroke={INK}
          strokeWidth={1.6}
          fill="rgba(42,36,30,0.04)"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16">
              <path d="M 2 2 L 12 8 L 2 14 Z" fill={INK} />
            </svg>
            <Num size={18} weight={500}>
              시작
            </Num>
          </div>
        </SketchBox>
      </div>
    </div>
  );
}

// ─── Screen 3: Brewing mode ─────────────────────────────────
function BrewingScreen({ width = 375, height = 812 }) {
  const active = sampleMobilePours[1];
  const activeIdx = 1;
  const elapsed = 52; // seconds into brewing

  return (
    <div
      style={{
        width,
        height,
        background: PAPER,
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        padding: "66px 20px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflow: "hidden",
      }}
    >
      {/* top: elapsed + exit */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Label size={10} color={INK_FAINT}>
            경과
          </Label>
          <div>
            <Num size={26} weight={500}>
              {formatTime(elapsed)}
            </Num>
          </div>
        </div>
        <Label size={11} color={INK_FAINT}>
          중단
        </Label>
      </div>

      {/* progress rail */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {sampleMobilePours.map((p, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: "100%",
                height: 3,
                background:
                  i < activeIdx ? INK : i === activeIdx ? OCHRE : INK_FAINT,
                borderRadius: 2,
              }}
            />
            <Label
              size={9}
              color={i === activeIdx ? INK : INK_FAINT}
              weight={i === activeIdx ? 600 : 400}
            >
              {p.bloom ? "뜸" : `${i}차`}
            </Label>
          </div>
        ))}
      </div>

      {/* hero: active step, huge */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Label
          size={11}
          color={OCHRE}
          weight={600}
          style={{ letterSpacing: 1 }}
        >
          지금
        </Label>
        <div style={{ marginTop: 6 }}>
          <Label size={11} color={INK_FAINT}>
            저울 목표
          </Label>
          <div style={{ marginTop: 4 }}>
            <Num size={96} weight={500}>
              {active.w}
            </Num>
            <Label size={32} color={INK_FAINT} style={{ marginLeft: 4 }}>
              g
            </Label>
          </div>
          <div style={{ marginTop: 6 }}>
            <Hand size={18} color={INK_SOFT}>
              +{active.delta}g 붓기
            </Hand>
          </div>
        </div>
      </div>

      {/* time marker */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <Label size={10} color={INK_FAINT}>
          시점
        </Label>
        <div>
          <Num size={22} color={INK_SOFT}>
            {formatTime(active.t)}
          </Num>
        </div>
      </div>

      {/* next preview */}
      <div style={{ marginTop: "auto" }}>
        <SketchLine
          width={width - 40}
          stroke={INK_FAINT}
          seed={5}
          style={{ marginBottom: 10 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Label size={10} color={INK_FAINT} weight={600}>
            다음
          </Label>
          <Num size={13} color={INK_SOFT}>
            {formatTime(sampleMobilePours[2].t)}
          </Num>
          <div style={{ flex: 1 }} />
          <Num size={18}>
            {sampleMobilePours[2].w}
            <Label size={11} color={INK_FAINT}>
              g
            </Label>
          </Num>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 4: Stop confirm dialog ──────────────────────────
function StopConfirmScreen({ width = 375, height = 812 }) {
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        background: PAPER,
      }}
    >
      {/* dimmed brewing screen behind */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          pointerEvents: "none",
        }}
      >
        <BrewingScreen width={width} height={height} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(42,36,30,0.45)",
        }}
      />

      {/* dialog */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: width - 56,
          background: PAPER,
          borderRadius: 14,
          padding: "26px 22px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Num size={18} weight={500}>
          브루잉을 중단할까요?
        </Num>
        <Hand size={13} color={INK_SOFT}>
          기록은 남지 않습니다.
        </Hand>

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <SketchBox
            width={(width - 56 - 44 - 10) / 2}
            height={44}
            seed={30}
            radius={10}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Label size={13} color={INK_SOFT}>
                중단
              </Label>
            </div>
          </SketchBox>
          <SketchBox
            width={(width - 56 - 44 - 10) / 2}
            height={44}
            seed={31}
            radius={10}
            stroke={INK}
            strokeWidth={1.4}
            fill="rgba(42,36,30,0.06)"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Num size={14} weight={500}>
                처음으로
              </Num>
            </div>
          </SketchBox>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 5: Complete ─────────────────────────────────────
function CompleteScreen({ width = 375, height = 812 }) {
  const totalTime = 208; // 3:28

  return (
    <div
      style={{
        width,
        height,
        background: PAPER,
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        padding: "66px 24px 34px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* quiet header with date / time */}
      <div style={{ textAlign: "center" }}>
        <Label
          size={11}
          color={OCHRE}
          weight={600}
          style={{ letterSpacing: 1 }}
        >
          완료
        </Label>
        <div style={{ marginTop: 6 }}>
          <Label size={11} color={INK_FAINT}>
            2026 · 03 · 14 · 오전 7:42
          </Label>
        </div>
      </div>

      {/* total time — the hero */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Label size={11} color={INK_FAINT}>
          오늘의 한 잔
        </Label>
        <div style={{ marginTop: 6 }}>
          <Num size={72} weight={500}>
            {formatTime(totalTime)}
          </Num>
        </div>
        <div style={{ marginTop: 4 }}>
          <Hand size={14} color={INK_SOFT}>
            잘 내렸습니다.
          </Hand>
        </div>
      </div>

      {/* recipe summary */}
      <div style={{ marginTop: 28 }}>
        <SketchLine width={width - 48} stroke={INK_FAINT} seed={40} />
        <div
          style={{
            padding: "16px 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            rowGap: 12,
          }}
        >
          <div>
            <Label size={10} color={INK_FAINT}>
              드리퍼
            </Label>
            <div>
              <Num size={16}>V60</Num>
            </div>
          </div>
          <div>
            <Label size={10} color={INK_FAINT}>
              레시피
            </Label>
            <div>
              <Num size={13} color={INK_SOFT}>
                Kasuya 4:6
              </Num>
            </div>
          </div>
          <div>
            <Label size={10} color={INK_FAINT}>
              원두 · 물
            </Label>
            <div>
              <Num size={16}>
                20 · 300
                <Label size={11} color={INK_FAINT}>
                  g
                </Label>
              </Num>
            </div>
          </div>
          <div>
            <Label size={10} color={INK_FAINT}>
              온도 · 분쇄
            </Label>
            <div>
              <Num size={13} color={INK_SOFT}>
                90° · 중간
              </Num>
            </div>
          </div>
        </div>
        <SketchLine width={width - 48} stroke={INK_FAINT} seed={41} />
      </div>

      {/* feeling — 3 sketched glyph options */}
      <div style={{ marginTop: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <Hand size={13} color={INK_SOFT}>
            오늘의 시간은 어땠나요?
          </Hand>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "만족스러워요", glyph: "calm" },
            { label: "글쎄요", glyph: "neutral" },
            { label: "아쉬워요", glyph: "wave" },
          ].map((opt, i) => {
            const selected = i === 0;
            const w = (width - 48 - 16) / 3;
            return (
              <div key={i} style={{ flex: 1 }}>
                <SketchBox
                  width={w}
                  height={78}
                  seed={50 + i}
                  radius={10}
                  stroke={selected ? INK : INK_FAINT}
                  strokeWidth={selected ? 1.4 : 1}
                  fill={selected ? "rgba(42,36,30,0.05)" : "transparent"}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: 6,
                    }}
                  >
                    <FeelingGlyph
                      kind={opt.glyph}
                      color={selected ? INK : INK_SOFT}
                    />
                    <Label
                      size={11}
                      color={selected ? INK : INK_SOFT}
                      weight={selected ? 600 : 400}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {opt.label}
                    </Label>
                  </div>
                </SketchBox>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* home (primary, wide) + share (icon only) */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <SketchBox
            width={width - 48 - 60 - 10}
            height={52}
            seed={61}
            radius={11}
            stroke={INK}
            strokeWidth={1.6}
            fill="rgba(42,36,30,0.04)"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Num size={15} weight={500}>
                처음으로
              </Num>
            </div>
          </SketchBox>
        </div>
        <SketchBox width={60} height={52} seed={60} radius={11}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18">
              <path
                d="M 8 2 L 8 12 M 4 6 L 8 2 L 12 6"
                fill="none"
                stroke={INK_SOFT}
                strokeWidth={1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 2 12 L 2 15 L 14 15 L 14 12"
                fill="none"
                stroke={INK_SOFT}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </SketchBox>
      </div>
    </div>
  );
}

// ─── Share cards ────────────────────────────────────────────
// Square (1:1, feed) — 1080 canvas scaled
function ShareCardSquare({ size = 400 }) {
  const W = size,
    H = size;
  const pad = Math.round(size * 0.08);
  return (
    <div
      style={{
        width: W,
        height: H,
        background: PAPER,
        boxSizing: "border-box",
        padding: pad,
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* wordmark */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Num size={Math.round(size * 0.055)} weight={500}>
          뜸
        </Num>
        <Label size={Math.round(size * 0.025)} color={INK_FAINT}>
          2026 · 03 · 14
        </Label>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
        }}
      >
        <DripperSVG type="v60" size={Math.round(size * 0.22)} selected />
        <Label size={Math.round(size * 0.028)} color={INK_FAINT}>
          V60 · Kasuya 4:6
        </Label>
        <div style={{ marginTop: 10 }}>
          <Num size={Math.round(size * 0.14)} weight={500}>
            3:28
          </Num>
        </div>
        <Hand size={Math.round(size * 0.03)} color={INK_SOFT}>
          고요한 한 잔
        </Hand>
      </div>

      {/* recipe strip */}
      <div style={{ marginTop: pad * 0.4 }}>
        <SketchLine width={W - pad * 2} stroke={INK_FAINT} seed={80} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
          }}
        >
          {[
            ["원두", "20g"],
            ["물", "300g"],
            ["온도", "90°"],
            ["분쇄", "중간"],
          ].map(([k, v], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <Label size={Math.round(size * 0.022)} color={INK_FAINT}>
                {k}
              </Label>
              <div>
                <Num size={Math.round(size * 0.035)}>{v}</Num>
              </div>
            </div>
          ))}
        </div>
        <SketchLine width={W - pad * 2} stroke={INK_FAINT} seed={81} />
      </div>
    </div>
  );
}

// Story (9:16) — vertical, more breath, pour schedule visible
function ShareCardStory({ width = 340, height = 604 }) {
  const pad = 28;
  return (
    <div
      style={{
        width,
        height,
        background: PAPER,
        boxSizing: "border-box",
        padding: pad,
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* faint wall banding */}
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: 0.4,
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <line
            key={i}
            x1={0}
            y1={i * 22 + Math.random() * 2}
            x2={width}
            y2={i * 22 + Math.random() * 2}
            stroke="rgba(42,36,30,0.035)"
            strokeWidth={0.5}
          />
        ))}
      </svg>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* top: brand + date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Num size={22} weight={500}>
            뜸
          </Num>
          <Label size={10} color={INK_FAINT}>
            2026 · 03 · 14 · 오전 7:42
          </Label>
        </div>

        {/* dripper + label */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <DripperSVG type="v60" size={90} selected />
          <div style={{ marginTop: 8 }}>
            <Label size={11} color={INK_FAINT}>
              V60 · Kasuya 4:6
            </Label>
          </div>
        </div>

        {/* total time */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Label size={10} color={INK_FAINT}>
            오늘의 한 잔
          </Label>
          <div style={{ marginTop: 4 }}>
            <Num size={68} weight={500}>
              3:28
            </Num>
          </div>
          <div style={{ marginTop: 2 }}>
            <Hand size={12} color={INK_SOFT}>
              고요한 아침이었다.
            </Hand>
          </div>
        </div>

        {/* pour schedule */}
        <div
          style={{
            marginTop: 24,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Label size={9} color={INK_FAINT} style={{ letterSpacing: 0.5 }}>
            푸어 스케줄
          </Label>
          <div style={{ marginTop: 8, flex: 1, minHeight: 0 }}>
            <PourVerticalPreview
              pours={sampleMobilePours}
              width={width - pad * 2}
              height={180}
              seed={90}
            />
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* bottom recipe */}
        <div>
          <SketchLine width={width - pad * 2} stroke={INK_FAINT} seed={91} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
            }}
          >
            {[
              ["원두", "20g"],
              ["물", "300g"],
              ["온도", "90°"],
              ["분쇄", "중간"],
            ].map(([k, v], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <Label size={9} color={INK_FAINT}>
                  {k}
                </Label>
                <div>
                  <Num size={14}>{v}</Num>
                </div>
              </div>
            ))}
          </div>
          <SketchLine width={width - pad * 2} stroke={INK_FAINT} seed={92} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  WallScreen,
  DripperSheetScreen,
  BrewingScreen,
  StopConfirmScreen,
  CompleteScreen,
  ShareCardSquare,
  ShareCardStory,
  PourMiniPreview,
  PourVerticalPreview,
  DripperSVG,
  FeelingGlyph,
  MorphTransitionScreen,
  RecipeScreen,
  RecipeScreenWithPopover,
});
