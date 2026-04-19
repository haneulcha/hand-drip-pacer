# Brewing — Skip to Next Step

**Date:** 2026-04-19
**Status:** Design
**Scope:** `src/features/brewing/BrewingScreen.tsx` + tests

## Context

`BrewingScreen`의 활성 스텝은 실시간 경과 시간(`elapsed`)에서 파생됨 (`activeStepIdx(pours, elapsed)`). 사용자가 레시피 타이밍보다 빠르게 물을 부었을 때, 다음 스텝 지시를 수동으로 앞당길 방법이 없다.

## Goal

현재 스텝에서 다음 스텝으로 수동 전진할 수 있는 "건너뛰기" 버튼을 추가한다. 마지막 스텝에서의 건너뛰기는 브루잉 완료로 처리한다. 경과 시간 타이머는 실제 시간을 유지한다(완료된 세션 기록의 정확도 보존).

## Non-Goals

- Undo / 뒤로 가기.
- 세션 기록에 스킵 횟수/스킵 시점 저장 (v2 확장 지점으로 남김).
- Complete / Wall / Recipe 스크린 변경.
- 도메인 레이어(`session.ts`, `methods/*`) 변경.

## Design

### Behavior

- `BrewingScreen`에 로컬 상태 `manualStepFloor: number` 추가, 초기값 `0`.
- 활성 스텝 유효 인덱스는 클럭 파생값과 수동 floor의 합성으로 계산한다:
  ```
  clockIdx  = activeStepIdx(pours, elapsed)
  activeIdx = min(pours.length - 1, max(clockIdx, manualStepFloor))
  ```
  수동 floor는 monotonic increasing이며, 시계가 자연스럽게 따라잡아도 뒤로 돌아가지 않는다.
- "건너뛰기 >" 탭 핸들러:
  ```ts
  setManualStepFloor((prev) => Math.max(prev, clockIdx) + 1);
  ```
  함수형 업데이트로 연타 시에도 정확히 한 칸씩 전진한다.
- 완료 판정:
  ```
  done = elapsed >= totalTimeSec || manualStepFloor >= pours.length
  ```
  기존의 `useEffect(done → onComplete)` 경로를 그대로 사용한다. 마지막 스텝에서 스킵 시 `manualStepFloor === pours.length` → `done` → `onComplete` 트리거.
- 경과 타이머(`useElapsed`)는 건드리지 않는다. `startedAt` 기반 실시간 유지.

### UI

현재 Hero 아래 레이아웃에 삽입:

```
Hero (목표 XXXg / +Xg 붓기)
  mt-4
  시점 / 0:XX
  ↓ [건너뛰기 ›]   ← 신규, 중앙 정렬
  mt-auto (spacer)
Next preview
```

- 버튼: ghost 스타일.
  - 색: `text-text-secondary`, hover `text-text-primary`.
  - 탭 타겟: `py-3 px-5` 이상으로 44px 확보.
  - 라벨: `건너뛰기` + `›` chevron. 마지막 스텝에서도 동일 라벨 유지.
- `manualStepFloor >= pours.length` (완료로 점프한 프레임) 에서는 버튼 비렌더.

### Accessibility

- 기존 `AriaLiveStep`은 `activeIdx` 변화를 감지해 "`n차: NNN그램까지`"를 재생한다. 스킵으로 `activeIdx`가 바뀌면 자동으로 새 스텝이 안내됨. 추가 로직 없음.
- 버튼: `aria-label="다음 스텝으로 건너뛰기"`.
- 버튼 `type="button"` 명시.

## Testing

`src/features/brewing/BrewingScreen.test.tsx`에 테스트 추가:

1. 스킵 탭 → Hero 숫자(`hero-weight`)가 다음 푸어의 `cumulativeWater`로 즉시 변경.
2. 마지막 스텝에서 스킵 → `onComplete`가 호출됨.
3. 스킵 후, 경과 시간이 같은 스텝에 자연 도달해도 `activeIdx`가 되돌려지지 않음(회귀).
4. 연타 시 클릭 횟수만큼 정확히 전진.

도메인 / `session.ts`는 손대지 않으므로 기존 테스트 그대로 유지.

## Out of Scope (v2 Hooks)

- 세션 기록에 스킵 이벤트 저장 → `BrewSession` 타입에 `skipEvents?: readonly { atSec: Seconds; fromIdx: number }[]` 추가로 확장 가능.
- 뒤로 가기(undo): `manualStepFloor`를 이미 분리된 상태로 두었으므로 감소시키는 버튼 추가만으로 구현 가능.

## Implementation Notes

- `manualStepFloor` 합성 로직(2줄)은 BrewingScreen 내부에 둔다. 도메인으로 끌어올릴 만큼 복잡하지 않고, CLAUDE.md의 "Domain / UI 완전 분리" 원칙에도 부합(도메인은 `activeStepIdx` 원시만 노출, UI가 합성).
- 버튼 삽입 위치는 "시점" 시각 블록 직후, `mt-auto` spacer 위. 기존 Hero/Next 간격 비례 유지.
