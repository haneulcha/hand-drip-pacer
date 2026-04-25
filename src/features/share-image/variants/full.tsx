import { brewMethods } from "@/domain/methods";
import { drippers } from "@/domain/drippers";
import { sessionDurationSec, type Feeling } from "@/domain/session";
import { cx } from "@/ui/cx";
import { formatGrindHint, formatTime } from "@/ui/format";
import { FeelingGlyph } from "@/features/complete/FeelingGlyph";
import type { ShareVariant, ShareVariantProps } from "./types";

const FEELING_LABEL: Record<Feeling, string> = {
  calm: "만족스러워요",
  neutral: "글쎄요",
  wave: "아쉬워요",
};

const formatShareDate = (epochMs: number): string => {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

export function Full({ session, photoUrl, color }: ShareVariantProps) {
  const { recipe } = session;
  const methodName = brewMethods[recipe.method].name;
  const dripperName = drippers[recipe.dripper].name;
  const isNegative = color === "negative";

  const cardBase = "backdrop-blur-md border";
  const cardColor = isNegative
    ? "bg-black/75 text-white border-white/10"
    : "bg-white/85 text-text-primary border-black/5";
  const dividerColor = isNegative ? "bg-white/15" : "bg-black/10";
  const labelColor = isNegative ? "text-white/60" : "text-text-muted";

  return (
    <div
      data-share-variant="full"
      data-color={color}
      className="relative h-full w-full overflow-hidden font-sans"
      style={{
        backgroundImage: `url(${photoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex h-full flex-col justify-end p-12">
        <div className={cx(cardBase, cardColor, "rounded-card p-10")}>
          <div className="flex items-baseline justify-between text-sm tracking-wide">
            <span className="font-semibold uppercase">{methodName}</span>
            <span className={cx("tabular-nums", labelColor)}>
              {formatShareDate(session.startedAt)}
            </span>
          </div>

          <div className={cx("my-6 h-px", dividerColor)} />

          <div className="flex flex-col items-center">
            <span className="text-7xl font-medium tabular-nums leading-none">
              {formatTime(sessionDurationSec(session))}
            </span>
            <span
              className={cx(
                "mt-3 text-xs uppercase tracking-widest",
                labelColor,
              )}
            >
              Total Time
            </span>
          </div>

          <div className={cx("my-6 h-px", dividerColor)} />

          <dl className="grid grid-cols-[7rem_1fr] gap-y-3 text-base tabular-nums">
            <dt className={labelColor}>드리퍼</dt>
            <dd>{dripperName}</dd>
            <dt className={labelColor}>원두 · 물</dt>
            <dd>{`${recipe.coffee} · ${recipe.totalWater} g`}</dd>
            <dt className={labelColor}>온도 · 분쇄</dt>
            <dd>{`${recipe.temperature}° · ${formatGrindHint(recipe.grindHint)}`}</dd>
          </dl>

          {session.feeling != null && (
            <>
              <div className={cx("my-6 h-px", dividerColor)} />
              <div className="flex items-center gap-3">
                <FeelingGlyph kind={session.feeling} size={28} />
                <span className="text-base">
                  {FEELING_LABEL[session.feeling]}
                </span>
              </div>
            </>
          )}
        </div>

        <div
          className={cx(
            "mt-6 text-center text-xs tracking-widest",
            isNegative ? "text-white/50" : "text-text-muted",
          )}
        >
          pourover.work
        </div>
      </div>
    </div>
  );
}

export const fullVariant: ShareVariant = {
  id: "full",
  name: "전체",
  Component: Full,
  exportSize: { width: 1080, height: 1350 },
};
