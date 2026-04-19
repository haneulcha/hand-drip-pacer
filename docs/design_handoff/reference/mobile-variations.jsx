// Mobile-first wireframes — 3 variations, 375×812 (iPhone-ish)
// All prioritize: large time + large target cumulative grams (what shows on scale).
// Inputs collapsed/compact so they don't feel heavy.

const sampleMobilePours = [
  { t: 0, delta: 60, w: 60, bloom: true, label: "뜸" },
  { t: 45, delta: 60, w: 120 },
  { t: 90, delta: 90, w: 210 },
  { t: 135, delta: 90, w: 300 },
];

// ─── Compact input header (M1) ─────────────────────────────
function InputSummaryBar({ width, seed = 0 }) {
  return (
    <SketchBox width={width} height={44} seed={seed} radius={10}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          padding: "0 14px",
          gap: 8,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <Num size={14} weight={500}>
          20g
        </Num>
        <Label size={10} color={INK_FAINT}>
          ·
        </Label>
        <Label size={11} color={INK_SOFT}>
          V60 Kasuya
        </Label>
        <Label size={10} color={INK_FAINT}>
          ·
        </Label>
        <Label size={11} color={INK_SOFT}>
          균형/보통
        </Label>
        <div style={{ flex: 1 }} />
        <Label size={14} color={INK_SOFT}>
          ›
        </Label>
      </div>
    </SketchBox>
  );
}

// ─── M1: Scale-native — pour steps as target-weight cards ───
function M1_ScaleNative({ width = 375, height = 812 }) {
  const w = width;
  return (
    <div
      style={{
        width: w,
        height,
        background: PAPER,
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        padding: "66px 20px 34px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflow: "hidden",
      }}
    >
      {/* brand + summary header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Num size={20} weight={500}>
          뜸
        </Num>
        <Label size={11} color={INK_FAINT}>
          링크 복사
        </Label>
      </div>
      <InputSummaryBar width={w - 40} seed={1} />

      {/* hero headline */}
      <div style={{ marginTop: 4 }}>
        <Label size={11} color={INK_FAINT}>
          총 · 300g · 3:30
        </Label>
      </div>

      {/* step cards — each shows target cumulative grams (what scale will read) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 2,
        }}
      >
        {sampleMobilePours.map((p, i) => (
          <SketchBox
            key={i}
            width={w - 40}
            height={92}
            seed={10 + i}
            radius={10}
            stroke={p.bloom ? OCHRE : INK}
            strokeWidth={p.bloom ? 1.4 : 1}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                padding: "0 16px",
                gap: 10,
              }}
            >
              <div style={{ width: 56 }}>
                <Label
                  size={10}
                  color={INK_FAINT}
                  style={{ letterSpacing: 0.6 }}
                >
                  {p.bloom ? "뜸" : `${i}차`}
                </Label>
                <div style={{ marginTop: 4 }}>
                  <Num size={20}>{formatTime(p.t)}</Num>
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <Label size={10} color={INK_FAINT}>
                  저울
                </Label>
                <div style={{ marginTop: 2 }}>
                  <Num size={36} weight={500}>
                    {p.w}
                  </Num>
                  <Label size={16} color={INK_FAINT} style={{ marginLeft: 3 }}>
                    g
                  </Label>
                </div>
              </div>
              <div style={{ width: 48, textAlign: "right" }}>
                <Label size={10} color={INK_FAINT}>
                  +붓기
                </Label>
                <div style={{ marginTop: 4 }}>
                  <Num size={14} color={INK_SOFT}>
                    +{p.delta}
                  </Num>
                </div>
              </div>
            </div>
          </SketchBox>
        ))}
      </div>

      {/* grind + note */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <Hand size={15} color={INK_SOFT}>
          분쇄 — 굵은 소금 정도 · 90°C
        </Hand>
        <Hand size={13} color={INK_FAINT}>
          주전자를 중심부터, 나선을 그리며.
        </Hand>
      </div>
    </div>
  );
}

// ─── M2: Vertical drip — metaphor-forward ───────────────────
function M2_VerticalDrip({ width = 375, height = 812 }) {
  const w = width;
  const cx = w / 2;
  const topY = 230;
  const bottomY = height - 180;
  const total = sampleMobilePours[sampleMobilePours.length - 1].t;
  const ty = (t) => topY + (t / total) * (bottomY - topY);

  return (
    <div
      style={{
        width: w,
        height,
        background: PAPER,
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        boxSizing: "border-box",
      }}
    >
      {/* top: brand + summary pill */}
      <div style={{ padding: "66px 20px 0", position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Num size={20} weight={500}>
            뜸
          </Num>
          <Label size={11} color={INK_FAINT}>
            복사
          </Label>
        </div>
        <InputSummaryBar width={w - 40} seed={1} />
      </div>

      {/* SVG drip diagram */}
      <svg
        width={w}
        height={height - 20}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        {/* dripper silhouette */}
        <g transform={`translate(${cx - 36}, ${topY - 40})`}>
          <path
            d="M 0 0 L 72 0 L 56 30 L 16 30 Z"
            fill="none"
            stroke={INK}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <line
            x1={27}
            y1={30}
            x2={27}
            y2={36}
            stroke={INK}
            strokeWidth={1.2}
          />
          <line
            x1={45}
            y1={30}
            x2={45}
            y2={36}
            stroke={INK}
            strokeWidth={1.2}
          />
        </g>
        {/* water column */}
        <line
          x1={cx}
          y1={topY - 4}
          x2={cx}
          y2={bottomY + 4}
          stroke={INK_FAINT}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        {/* pour markers */}
        {sampleMobilePours.map((p, i) => {
          const y = ty(p.t);
          return (
            <g key={i}>
              <line
                x1={cx - 30}
                y1={y}
                x2={cx + 30}
                y2={y}
                stroke={p.bloom ? OCHRE : INK}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              <circle
                cx={cx}
                cy={y}
                r={p.bloom ? 6 : 5}
                fill={p.bloom ? OCHRE : PAPER}
                stroke={INK}
                strokeWidth={1.2}
              />
              {/* left: time */}
              <text
                x={cx - 42}
                y={y + 5}
                fontSize={13}
                textAnchor="end"
                fill={INK}
                fontFamily="'Pretendard Variable',system-ui,sans-serif"
                style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}
              >
                {formatTime(p.t)}
              </text>
              <text
                x={cx - 42}
                y={y + 20}
                fontSize={10}
                textAnchor="end"
                fill={INK_FAINT}
                fontFamily="'Pretendard Variable',system-ui,sans-serif"
              >
                {p.bloom ? "뜸" : `${i}차`}
              </text>
              {/* right: target cumulative grams (BIG) */}
              <text
                x={cx + 42}
                y={y + 3}
                fontSize={26}
                fill={INK}
                fontFamily="'Pretendard Variable',system-ui,sans-serif"
                style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}
              >
                {p.w}
              </text>
              <text
                x={cx + 42 + 40}
                y={y + 3}
                fontSize={12}
                fill={INK_FAINT}
                fontFamily="'Pretendard Variable',system-ui,sans-serif"
              >
                g
              </text>
              <text
                x={cx + 42}
                y={y + 19}
                fontSize={11}
                fill={INK_FAINT}
                fontFamily="'Pretendard Variable',system-ui,sans-serif"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                +{p.delta}g
              </text>
            </g>
          );
        })}
        {/* scale silhouette at bottom */}
        <g transform={`translate(${cx - 44}, ${bottomY + 16})`}>
          <rect
            x={0}
            y={0}
            width={88}
            height={32}
            rx={4}
            fill="none"
            stroke={INK}
            strokeWidth={1.2}
          />
          <rect
            x={10}
            y={8}
            width={68}
            height={16}
            rx={2}
            fill={PAPER_SUBTLE}
            stroke={INK_FAINT}
            strokeWidth={0.8}
          />
          <text
            x={44}
            y={20}
            fontSize={11}
            textAnchor="middle"
            fill={INK_SOFT}
            fontFamily="'Pretendard Variable',system-ui,sans-serif"
          >
            저울
          </text>
        </g>
      </svg>

      {/* bottom note */}
      <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
        <SketchLine
          width={w - 40}
          stroke={INK_FAINT}
          strokeWidth={0.8}
          seed={40}
          style={{ marginBottom: 8 }}
        />
        <Hand size={14} color={INK_SOFT}>
          저울 숫자를 보며 부으면 됩니다.
        </Hand>
      </div>
    </div>
  );
}

// ─── M3: Step-cards (carousel) ──────────────────────────────
function M3_StepCards({ width = 375, height = 812 }) {
  const w = width;
  const cardW = w - 64;
  const cardH = 320;
  const active = sampleMobilePours[1];
  const next = sampleMobilePours[2];
  const progress = 1;

  return (
    <div
      style={{
        width: w,
        height,
        background: PAPER,
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        padding: "66px 0 34px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          marginBottom: 16,
        }}
      >
        <Num size={20} weight={500}>
          뜸
        </Num>
        <Label size={11} color={INK_FAINT}>
          복사 · 초기화
        </Label>
      </div>
      <div style={{ padding: "0 20px", marginBottom: 20 }}>
        <InputSummaryBar width={w - 40} seed={1} />
      </div>

      {/* progress rail */}
      <div style={{ padding: "0 32px", marginBottom: 18 }}>
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
                  background: i <= progress ? INK : INK_FAINT,
                  borderRadius: 2,
                }}
              />
              <Label
                size={9}
                color={i === progress ? INK : INK_FAINT}
                weight={i === progress ? 600 : 400}
              >
                {p.bloom ? "뜸" : `${i}차`}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* active card */}
      <div
        style={{ padding: "0 32px", marginBottom: 14, position: "relative" }}
      >
        <SketchBox width={cardW} height={cardH} seed={50} radius={14}>
          <div
            style={{
              padding: 24,
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Label size={11} color={INK_FAINT} weight={600}>
                1차 · 지금
              </Label>
              <Label size={11} color={INK_FAINT}>
                2 / 4
              </Label>
            </div>
            {/* time */}
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Label size={11} color={INK_FAINT}>
                시점
              </Label>
              <div>
                <Num size={42} weight={500}>
                  {formatTime(active.t)}
                </Num>
              </div>
            </div>
            {/* target grams — hero */}
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Label size={11} color={INK_FAINT}>
                저울 목표
              </Label>
              <div style={{ marginTop: 4 }}>
                <Num size={76} weight={500}>
                  {active.w}
                </Num>
                <Label size={28} color={INK_FAINT} style={{ marginLeft: 6 }}>
                  g
                </Label>
              </div>
              <div style={{ marginTop: 2 }}>
                <Hand size={16} color={INK_SOFT}>
                  (지금 물 +{active.delta}g)
                </Hand>
              </div>
            </div>
            <div style={{ flex: 1 }} />
          </div>
        </SketchBox>
        {/* nav dots */}
        <div
          style={{
            position: "absolute",
            right: -8,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <Label size={18} color={INK_FAINT}>
            ›
          </Label>
        </div>
        <div
          style={{
            position: "absolute",
            left: -8,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <Label size={18} color={INK_FAINT}>
            ‹
          </Label>
        </div>
      </div>

      {/* next peek */}
      <div style={{ padding: "0 32px" }}>
        <SketchBox
          width={cardW}
          height={54}
          seed={60}
          radius={10}
          stroke={INK_FAINT}
          strokeWidth={1}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              padding: "0 18px",
              gap: 12,
            }}
          >
            <Label size={10} color={INK_FAINT} weight={600}>
              다음
            </Label>
            <Num size={14} color={INK_SOFT}>
              {formatTime(next.t)}
            </Num>
            <div style={{ flex: 1 }} />
            <Num size={20}>
              {next.w}
              <Label size={11} color={INK_FAINT} style={{ marginLeft: 2 }}>
                g
              </Label>
            </Num>
          </div>
        </SketchBox>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 20px", textAlign: "center" }}>
        <Hand size={13} color={INK_FAINT}>
          좌우로 밀어 전체를 둘러봅니다.
        </Hand>
      </div>
    </div>
  );
}

// ─── Input sheet (shared annotation for all three) ─────────
function InputSheet({ width = 375, height = 520 }) {
  return (
    <div
      style={{
        width,
        height,
        background: PAPER,
        boxSizing: "border-box",
        fontFamily: '"Pretendard Variable",system-ui,sans-serif',
        padding: "12px 20px 24px",
        borderRadius: "16px 16px 0 0",
        border: `1px solid ${INK_FAINT}`,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* handle */}
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

      {/* coffee — big stepper with =person hint */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <Label size={11}>커피</Label>
          <Hand size={13} color={INK_FAINT}>
            = 약 1잔
          </Hand>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Stepper
            value={20}
            unit="g"
            width={width - 40}
            height={52}
            seed={1}
          />
        </div>
      </div>

      {/* dripper / method — icon row, fewer words */}
      <div>
        <div style={{ marginBottom: 8 }}>
          <Label size={11}>드리퍼 · 방식</Label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Segmented
            options={["V60", "Kalita"]}
            value="V60"
            width={width - 40}
            height={40}
            seed={2}
          />
          <Segmented
            options={["Kasuya", "Hoffmann"]}
            value="Kasuya"
            width={width - 40}
            height={40}
            seed={3}
          />
        </div>
      </div>

      {/* taste — one-liner per row */}
      <div>
        <div style={{ marginBottom: 8 }}>
          <Label size={11}>맛 · 강도</Label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Segmented
            options={["달게", "균형", "산뜻하게"]}
            value="균형"
            width={width - 40}
            height={40}
            seed={5}
          />
          <Segmented
            options={["연하게", "보통", "진하게"]}
            value="보통"
            width={width - 40}
            height={40}
            seed={6}
          />
        </div>
      </div>

      <Hand
        size={14}
        color={INK_FAINT}
        style={{ marginTop: "auto", textAlign: "center" }}
      >
        바꿔도 됩니다. 언제든.
      </Hand>
    </div>
  );
}

Object.assign(window, {
  M1_ScaleNative,
  M2_VerticalDrip,
  M3_StepCards,
  InputSheet,
  sampleMobilePours,
});
