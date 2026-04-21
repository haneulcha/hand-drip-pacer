# Brewing Methods Expansion — Design

**Date**: 2026-04-21
**Branch**: `feat/brewing-methods-expansion`
**Status**: Draft → Review

## Scope & Goals

`docs/brewing-research.md`의 근거 있는 9개 레시피를 플러그인 레지스트리에 반영한다.
- 드리퍼 **3종** (`v60`, `kalita_wave`, **`kalita_102`** 신규)
- 메서드 **9종** (V60 3 / Wave 3 / 102 3)
- 기존 `kalita_pulse` 제거 (리서치 근거 약한 generic — Frothy Monkey로 대체)
- Kasuya 4:6 파라미터 보정 (온도/분쇄도)

**Non-goals**: Domain-UI 분리 구조, `Recipe`/`Pour`/branded types, 플러그인 레지스트리 구조, URL 공유 스키마 — 모두 불변.

## Domain Type Changes

```ts
// src/domain/types.ts
export type DripperId = "v60" | "kalita_wave" | "kalita_102";

export type BrewMethodId =
  | "kasuya_4_6"
  | "hoffmann_v60"
  | "scott_rao"
  | "april"
  | "kurasu_kyoto"
  | "frothy_monkey"
  | "standard_3_stage"
  | "caffe_luxxe"
  | "fuglen_tokyo";
// `kalita_pulse` 제거
```

## Method Specs

taste 매핑 철학: **안 1 — 메서드별 자유도 유지.** 푸어 구조가 고정적인 메서드는 `grindHint` + 뜸 시간에만 매핑, 여지 있는 메서드는 푸어 분배/개수에도 매핑.

### V60

| ID | ratio | 온도 L/M/D | 기본 grind | taste 매핑 | 비고 |
|---|---|---|---|---|---|
| `kasuya_4_6` | 1:15 | **94/88/83** | **coarse** | sweetness→첫 40% 분배, strength→후반 푸어 수 (기존) | 온도·grind 보정 |
| `hoffmann_v60` | 1:16.67 | 96/93/90 | medium-fine 기준 | grindHint 전용 (기존) | 변경 없음 |
| `scott_rao` | 1:16.5 | 97/94/91 | medium-fine | strength→grind, sweetness→뜸 시간(20/30/45s) | 구조: 50g 뜸 + 단일 연속 푸어 |

### Kalita Wave

| ID | ratio | 온도 L/M/D | 기본 grind | taste 매핑 | 비고 |
|---|---|---|---|---|---|
| `april` | 1:15.4 | 92/91/90 | medium-coarse | strength→grind, sweetness→푸어 간격(25/30/35s) | 구조: 50g×4 |
| `kurasu_kyoto` | 1:14.3 | 92/90/88 | coarse | strength→grind, sweetness→뜸 시간(30/40/50s) | 구조: 30/30/140 고정 누적 |
| `frothy_monkey` | 1:16 | 96/93/90 | medium-fine | strength→펄스 수(3/4/5), sweetness→뜸 시간(25/30/40s) | 구조: 50g 뜸 + 150g 메인 + 50g 펄스 |

### Kalita 102

| ID | ratio | 온도 L/M/D | 기본 grind | taste 매핑 | 비고 |
|---|---|---|---|---|---|
| `standard_3_stage` | 1:15 | 96/93/90 | medium | strength→마지막 푸어 비중(100/110/120), sweetness→뜸 시간(25/30/40s) | 구조: 40/80/80/100 |
| `caffe_luxxe` | 1:13.3 | 96/93/90 | medium | strength→grind, sweetness→뜸 지속(25/30/40s) | 구조: 100g 뜸 + 300g 연속 |
| `fuglen_tokyo` | 1:15.6 | 93/92/90 | medium-coarse | strength→grind, sweetness→뜸 지속(30/40/50s) | 구조: 40/40/170 |

**공통 규약**
- 기본 ratio는 리서치 레퍼런스 그대로. `coffee` 입력 변경 시 선형 스케일.
- 모든 메서드는 `notes` 배열에 "이 메서드는 taste를 X에 반영" 한 줄 포함.
- 푸어 라운딩 drift는 마지막 푸어로 흡수해 `totalWater` 정합성 보장 (기존 Kasuya/Kalita 패턴 따라감).

## UI & Peripheral Changes

### DripperIcon (`src/ui/DripperIcon.tsx`)
`kalita_102` 분기 추가. 사다리꼴 실루엣 + 하단 3홀 + 수직 리브. V60/Wave 스타일(`STROKE.hairline/thin/base`) 재사용.

### URL Codec (`src/features/share/urlCodec.ts`)
- `BREW_METHOD_IDS` 배열: `kalita_pulse` 제거, 7개 신규 id 추가
- `DRIPPER_IDS` 배열: `"kalita_102"` 추가
- 디코드 시 알 수 없는 id는 조용히 `DEFAULT_STATE`로 fallback

### State (`src/features/app/state.ts`)
- `DEFAULT_STATE` 변경 없음 (v60 + kasuya_4_6 유지)
- `mergeState`의 `methodsForDripper` 기반 폴백은 이미 정상 동작

### RecipeScreen / DripperPopover
코드 변경 없음. 레지스트리 데이터 기반. Segmented에 메서드 3개 라벨이 들어가는지 **수동 시각 확인** 항목으로 관리.

## Testing (린 버전)

CLAUDE.md § Testing 문구를 완화: **필수 = 메서드당 1 스냅샷 + 공유 invariant 스위프. 엣지 케이스는 선택.**

1. **메서드당 스냅샷 1개** — 리서치 기본 케이스로 `compute()` 출력 전체 스냅샷. 드리프트 즉시 감지.
2. **공유 invariant 스위프** (`src/domain/methods/index.test.ts`, 신규) — `methodList` 전체에 대해 3~4개 입력 조합으로:
   - `totalWater === sum(pourAmount)`
   - `cumulativeWater[i] === cumulativeWater[i-1] + pourAmount[i]`
   - `pours[0].atSec === 0`
3. **드롭**: 메서드별 5g/50g/극단 taste 전수 테스트.

## Migration

- 기존 URL/localStorage의 `kalita_pulse`는 디코드 단계에서 `DEFAULT_STATE`로 fallback. 사용자 알림 없음 (v1 초기 단계).
- `docs/design.md` § Scope v1 문구 업데이트 (드리퍼·메서드 개수).
- `CLAUDE.md` § Testing 기준 문구 완화.

## Phases (레이어별)

피처 브랜치 내에서 점진적으로 진행. 각 Phase는 독립 커밋 1개 이상.

| Phase | 내용 | 완료 조건 |
|---|---|---|
| **P1. Kasuya 보정** | Kasuya 온도(`{94,88,83}`) · grind(`coarse`) 수정 + 스냅샷 재생성. Hoffmann은 리서치와 대조만 (현재 값이 범위 내면 no-op) | `bun run test:run` 통과 |
| **P2. 신규 7개 메서드** | 순차 서브태스크 7개. 각각 `BrewMethodId`에 id 1개 추가 + compute 파일 + 레지스트리 등록 + 스냅샷 1개. **standard_3_stage 서브태스크에 `kalita_102` 드리퍼 추가 + `DripperIcon` 사다리꼴 SVG 포함** | 서브태스크별 스냅샷 통과, `bun run typecheck` |
| **P3. `kalita_pulse` 제거 + invariant 스위프 + urlCodec** | `kalita_pulse.ts`·테스트·`BrewMethodId`의 id 제거. `methods/index.test.ts` 공유 invariant 스위프 작성. `urlCodec.ts`의 `BREW_METHOD_IDS`/`DRIPPER_IDS` 전체 재정비, 알 수 없는 id → default fallback 검증 | 전체 테스트 통과, URL 왕복 테스트 통과 |
| **P4. 문서** | `docs/design.md` § Scope v1 드리퍼·메서드 개수 갱신, `CLAUDE.md` § Testing 문구 완화 (메서드당 1 스냅샷 + 공유 invariant 스위프 필수, 엣지 케이스 선택) | 리뷰 |

**P2 서브태스크 순서** (문서 기반 진행 관리):

- [ ] `scott_rao.ts` (v60)
- [ ] `april.ts` (kalita_wave)
- [ ] `kurasu_kyoto.ts` (kalita_wave)
- [ ] `frothy_monkey.ts` (kalita_wave) — *`kalita_pulse`와 잠시 공존. P3에서 제거*
- [ ] `standard_3_stage.ts` (kalita_102) — *드리퍼 신설 + 아이콘 SVG 동반*
- [ ] `caffe_luxxe.ts` (kalita_102)
- [ ] `fuglen_tokyo.ts` (kalita_102)

**스텁 회피 설계**: P2 서브태스크마다 union 확장·compute·registry를 동시에 더하므로 `brewMethods: Record<BrewMethodId, BrewMethod>` 정합성이 각 커밋에서 유지됨. 스텁 compute를 두지 않음.

## Open Decisions

- **Segmented 메서드 라벨**: 한글 라벨 3개가 한 줄에 들어가지 않으면 `BrewMethod`에 `shortName?` 필드 추가. P4에서 시각 확인 후 결정.
- **아이콘 디테일**: kalita_102 SVG의 리브 개수·사다리꼴 각도는 디자인 감각 이슈. P4 구현 시 한 번에 확정.

## Out of Scope

- 실시간 타이머 / 브루잉 가이드 (v2)
- 추가 드리퍼 (Origami, Chemex, Blue Bottle, Melitta 전통형) — 국내 가용성 이슈로 제외
- 레퍼런스 전량 반영 (선별된 9개만)
