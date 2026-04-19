# TODO

다음 세션에서 고를 작업 메뉴. 현재 상태와 배경을 여기에 담음.

## 현재 지점

- **v1 (계산기) + 브랜드 1·2차 (비주얼·카피) + 4-스크린 리추얼 플로우 (Wall → Recipe → Brewing → Complete → Wall) 완료**
- 관련 문서: `CLAUDE.md`(규약), `docs/design.md`(원본 스펙), `docs/brand.md`(브랜드), `docs/design-tokens.md`(토큰), `docs/design_handoff/README.md`(핸드오프), `docs/superpowers/specs/2026-04-19-brewing-flow-design.md`(리추얼 플로우 스펙), `docs/superpowers/plans/*`(각 Phase 구현 플랜), `docs/superpowers/followups.md`(이월 minor 이슈)
- 주요 커밋 그룹:
  - v1 + 브랜드 1·2차 (3 커밋)
  - Phase 0~4 리추얼 플로우 (plan/impl/fix per phase, 12+ 커밋)
- 현재 테스트 123개, 11 파일, typecheck/build green
- 데스크톱·모바일 Playwright 시각 QA 전 플로우 통과

## 보류 결정 (기록용)

- **브랜드 3차 마감 (타이틀 `뜸` 교체 / Segmented shadow 제거 / 초기화 버튼 숨김)** — 불필요로 판단, 스킵.
- 메서드 설명/노트는 brand.md 버전(짧고 단정)이 아니라 기존(더 정확함) 유지.
- bloom 배지·고유명사(Kasuya/Hoffmann/Kalita Wave)는 원어 유지 — 브랜드 과잉 푸시 회피.
- Phase 1 시작 전 servings 모드(by-coffee/by-servings 토글) 제거 — 핸드오프에 없고 침묵 원칙과 맞음.
- 완료/중단 destination은 Phase 2→Recipe, Phase 3→Wall로 진화. Complete 스크린(Phase 4)이 완료 경로를 가로채고 최종적으로 Wall로 복귀.

---

## 옵션 메뉴

### A. 후속 마일스톤 (design-handoff Phase 5)

**A1. View Transitions 전이** — Wall ↔ Recipe ↔ Brewing ↔ Complete 간 morph. 현재 CSS `animate-slide-up`(Phase 3)을 네이티브 `document.startViewTransition`으로 교체. 드리퍼 shelf → top bar 앵커 이동 같은 정교한 전이 가능. prefers-reduced-motion 폴백.

**A2. Share PNG 카드 + Web Share API** — Square 1080×1080 / Story 1080×1920 두 포맷 렌더링. 현재 Complete의 `공유` 버튼 disabled → 활성화. Canvas 또는 html2canvas 라이브러리 도입. 네이티브 공유 시트 연동.

### B. 운영 / 배포

**B1. README** — 외부인용 최소 설명 + 실제 배포 URL.

**B2. 배포 (Vercel / Cloudflare Pages)** — 공유 URL이 실제 공유되려면 필요. 정적 SPA이므로 설정 단순.

**B3. PWA / 오프라인** — `vite-plugin-pwa` + manifest + 앱 아이콘. 부엌 wifi 불안정 시나리오와 브랜드 침묵 원칙에 맞음. 작업량: 중. 아이콘 디자인 결정 필요 (현재 favicon은 ☕ 이모지 — brand.md § 이모지 금지와 충돌).

### C. 기술 부채 / 품질

**C1. Dark mode 값 확정** — 현재 skeleton만 (`--neutral-800` 등 상속). brand가 light만 정의. 디자인 결정 필요.

**C2. Hoffmann grind 규칙 리서치** — 현재 boolean OR 해석(주석에 명시). Hoffmann 원전 재확인 후 필요 시 가산 방식으로 교체. `grindFor` 함수만 수정.

**C3. Kalita sweet/strong rounding 비대칭** — `[3,5,5,3]` 패턴 + drift-to-last-pulse가 `[53, 88, 88, 51]` 생성. 대칭 유지하는 정수 재분배 알고리즘 (cumulative-target rounding) 검토.

**C4. E2E 테스트 (Playwright)** — 전 플로우 회귀 방지. Wall → Recipe → Brewing → Complete → Wall 사이클, URL 공유 링크 진입, 중단 경로 등.

**C5. Followups 일괄 처리** — `docs/superpowers/followups.md`의 11개 minor 이슈 (P1-M1~M4, P2-M1~M6, P3-M1) 중 "touch시 자연스럽게" 처리. 예: DripperPopover Escape 핸들러, BrewingScreen 섹션 분해, scrim 토큰 도입 등.

### D. v2+ 도메인 확장 (design.md § v2 확장 지점)

**D2. Approach B (파라미터 직접 조절)** — 고수용 toggle. RecipeScreen에 `PourEditor` 추가 + 도메인에 직접 빌드 경로 추가. 핸드오프의 `고급 ›` 링크가 이 화면의 진입점.

**D3. 프리셋 저장 / 원두 라이브러리 / 레시피 히스토리** — 서버 필요 또는 최소 localStorage 기반 로컬 히스토리. 현재 `bloom-coffee:session:v1`이 마지막 세션 1개만 저장하므로 확장 훅은 준비됨.

**D4. 새 메서드 추가** — `src/domain/methods/` 플러그인 패턴 그대로. 예: April V60, Tetsu 6-pour 등. UI 변경 없음.

*(D1 실시간 타이머는 Phase 2에서 이미 완성 — `BrewingScreen`으로 구현됨)*

---

## 추천 조합

- **실사용 겨냥**: B2 (배포) → B1 (README) → B3 (PWA)
- **마감 감 주기**: A1 (View Transitions) → A2 (Share 카드) → B2
- **품질 다지기**: C4 (E2E) → C5 (followups) → C1 (dark mode)
- **도메인 확장 겨냥**: D4 (새 메서드) → D2 (Approach B)

## 다음 세션 시작 시

1. 이 문서 읽기
2. `CLAUDE.md` + `docs/brand.md` 재확인
3. `docs/superpowers/specs/2026-04-19-brewing-flow-design.md`로 리추얼 플로우 맥락 복원 (필요 시)
4. 옵션 선택 후 시작
