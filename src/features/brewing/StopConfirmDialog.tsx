type Props = {
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export function StopConfirmDialog({ onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-30">
      <button
        type="button"
        aria-label="다이얼로그 닫기"
        onClick={onCancel}
        className="absolute inset-0 bg-[rgba(42,36,30,0.45)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-dialog-title"
        className="absolute left-1/2 top-1/2 w-[calc(100%-56px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 id="stop-dialog-title" className="text-lg font-medium">
          브루잉을 중단할까요?
        </h2>
        <p className="mt-2 text-sm text-text-muted">기록은 남지 않습니다.</p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-border text-sm text-text-secondary transition-colors hover:bg-surface-inset"
          >
            계속하기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-xl border-[1.4px] border-text-primary bg-surface-subtle text-sm font-medium transition-colors hover:bg-surface-inset"
          >
            처음으로
          </button>
        </div>
      </div>
    </div>
  )
}
