import type { DripperId } from "@/domain/types";
import { cx } from "@/ui/cx";
import { DripperIcon } from "@/ui/DripperIcon";

type Option = {
  readonly id: DripperId;
  readonly name: string;
  readonly methodSubtitle: string;
};

type Props = {
  readonly options: readonly Option[];
  readonly selected: DripperId;
  readonly onSelect: (id: DripperId) => void;
  readonly onClose: () => void;
};

export function DripperPopover({
  options,
  selected,
  onSelect,
  onClose,
}: Props) {
  return (
    <div className="absolute inset-0 z-20">
      <button
        type="button"
        aria-label="팝오버 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-surface/45"
      />
      <div
        role="dialog"
        aria-label="드리퍼 선택"
        className="absolute right-4 top-[72px] min-w-[180px] rounded-card border border-border bg-surface p-1 shadow-lg"
      >
        {options.map((opt) => {
          const isSelected = opt.id === selected;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={opt.name}
              onClick={() => onSelect(opt.id)}
              className={cx(
                "flex w-full items-center gap-3 rounded-control-group px-2 py-2 text-left transition-colors",
                isSelected ? "bg-surface-inset" : "hover:bg-surface-inset/60",
              )}
            >
              <DripperIcon type={opt.id} size={32} selected={isSelected} />
              <div className="flex-1">
                <div
                  className={cx(
                    "text-sm",
                    isSelected ? "font-semibold" : "font-medium",
                  )}
                >
                  {opt.name}
                </div>
                <div className="text-[10px] text-text-muted">
                  {opt.methodSubtitle}
                </div>
              </div>
              {isSelected && (
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                >
                  <path
                    d="M 2 6 L 5 9 L 10 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
