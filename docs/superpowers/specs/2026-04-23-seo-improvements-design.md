# SEO 개선 설계

**작성일**: 2026-04-23
**스코프**: 정적 메타태그 보강(A) + SPA 상태 기반 동적 메타(C)
**스코프 외**: 브루잉 중 title 갱신, 프리렌더링/SSG, OG 이미지 디자인, 실제 도메인 확정

## 배경

Bloom Coffee(핸드드립 계산기)는 Vite + React 19 SPA이며, 현재 `index.html`에는 `<title>핸드드립 계산기</title>`와 charset/viewport만 있다. `description`, Open Graph, Twitter Card, canonical, 구조화 데이터, `robots.txt`, `sitemap.xml`이 모두 없다. 또한 앱 상태(선택된 메서드/원두량/취향)가 이미 URL 쿼리스트링(`c`, `d`, `m`, `r`, `sw`, `st`)으로 직렬화되어 `history.replaceState`로 동기화되고 있지만, `document.title`과 메타태그는 갱신되지 않아 공유 링크 미리보기에서 맥락이 사라진다.

## 목표

1. 검색엔진 크롤링에 필요한 기본 메타태그·구조화 데이터·크롤러 자산 확보.
2. 공유 링크(카톡/슬랙/트위터/iMessage) 미리보기에서 선택된 메서드·원두량·비율이 드러나도록 동적 메타 제공.
3. 도메인 확정·OG 이미지 제작은 이번 스코프 외. placeholder만 심어 둔다.

## 비목표

- 프리렌더링·SSG·SSR: ROI 낮음. 콘텐츠가 JS로 계산되는 단일 페이지라 크롤러가 봐야 할 HTML은 메타태그 수준에서 충분.
- 브루잉 중 실시간 title 갱신: 사용자가 브루잉 중 탭을 보지 않음. 탭 전환 깜박임만 유발.
- `react-helmet-async` 등 SEO 라이브러리 도입: 라우트가 단일하고 imperative 업데이트가 5줄로 해결됨.
- 다국어 `hreflang`: 콘텐츠는 한국어 UI.

## 아키텍처

변경 범위를 세 레이어로 나눈다.

### 1. 정적 메타 — `index.html`

다음을 추가한다.

- `<meta name="description" content="V60, Kalita, Kasuya 4:6 등 9가지 핸드드립 레시피를 원두량·로스팅·취향에 맞춰 자동 계산합니다.">`
- `<link rel="canonical" href="https://example.com/">` — **TODO**: 실제 도메인 확정 시 치환.
- Open Graph:
  - `og:type=website`
  - `og:site_name=Bloom Coffee`
  - `og:title=핸드드립 계산기 | V60 · Kalita · Kasuya 4:6`
  - `og:description=…` (description과 동일)
  - `og:url=https://example.com/` (TODO: 치환)
  - `og:image=https://example.com/og-image.png` (TODO: 1200×630 자산 생성)
  - `og:image:width=1200`, `og:image:height=630`, `og:image:alt=핸드드립 계산기`
  - `og:locale=ko_KR`
- Twitter Card:
  - `twitter:card=summary_large_image`
  - `twitter:title`, `twitter:description`, `twitter:image` (OG와 동일 값 미러)
- `<meta name="theme-color" content="…">` — `--color-primary` 토큰 값 하드 복사 (build time 값 불변). 토큰이 바뀌면 같이 갱신.
- `<title>` 갱신: `핸드드립 계산기 | V60 · Kalita · Kasuya 4:6 · Hoffmann`
- JSON-LD `<script type="application/ld+json">` 블록:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Bloom Coffee",
    "description": "…",
    "url": "https://example.com/",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "inLanguage": "ko-KR",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
  }
  ```

### 2. 동적 메타 — `src/features/seo/documentMeta.ts` (신규)

순수 함수 + 얇은 imperative 래퍼.

```ts
// 순수 — 테스트 대상
export type DocumentMeta = {
  title: string;
  description: string;
  canonical: string;
};

export const BASE_URL = "https://example.com"; // TODO: 도메인 확정 시 치환
export const DEFAULT_META: DocumentMeta = { /* wall/기본값 */ };

export function buildMeta(state: AppState, recipe: Recipe): DocumentMeta;

// imperative — 테스트 제외
export function applyMeta(meta: DocumentMeta): void;
```

**`buildMeta` 로직**

- `state.screen === "wall"` → `DEFAULT_META` 반환.
- 그 외:
  - `title`: `${dripperLabel} · ${methodLabel} (${coffee}g · 1:${ratio}) | 핸드드립 계산기`
    - 예: `V60 · Kasuya 4:6 (15g · 1:15) | 핸드드립 계산기`
    - dripper/method 라벨은 `domain/methods` 레지스트리와 `domain/drippers`에서 가져옴 (한글 label).
  - `description`: 레시피 요약 — `${roastLabel}배전 ${coffee}g · 물 ${totalWater}g · ${pours.length}차 푸어. ${sweetness}/${strength}.`
    - 예: `중배전 15g · 물 225g · 3차 푸어. 밸런스/미디엄.`
    - 160자 이하 보장 (현실적으로 한참 아래). 만약 초과 시 말줄임표로 절단.
  - `canonical`: `${BASE_URL}/?${encodeState(state)}` — 기존 `urlCodec.encodeState` 재사용.

**`applyMeta` 로직**

- `document.title = meta.title`.
- `meta[name="description"]`, `link[rel="canonical"]`, `meta[property="og:title"]`, `meta[property="og:description"]`, `meta[property="og:url"]`, `meta[name="twitter:title"]`, `meta[name="twitter:description"]` 의 `content`/`href` 갱신.
- 해당 태그가 없을 경우 no-op이 아니라 `document.head.appendChild`로 생성 후 갱신 — 테스트 환경(JSDOM)이나 향후 `index.html` 편집 누락 대비.

### 3. AppRoot 연결 — `src/features/app/AppRoot.tsx`

기존 URL-sync `useEffect` 내부에 한 줄 추가.

```ts
useEffect(() => {
  const params = encodeState(state);
  // ... 기존 history.replaceState / saveParams 로직 ...
  applyMeta(buildMeta(state, recipe));
}, [state, recipe]);
```

- `recipe`는 이미 `useMemo`로 파생됨. deps에 추가.
- wall 스크린은 `buildMeta` 내부에서 `DEFAULT_META` 분기 — AppRoot는 분기 인지 불필요.

### 4. 크롤러 자산 — `public/`

- `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://example.com/sitemap.xml
  ```
- `public/sitemap.xml`: 홈 URL 하나만.
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://example.com/</loc>
      <changefreq>monthly</changefreq>
      <priority>1.0</priority>
    </url>
  </urlset>
  ```
- 두 파일 모두 placeholder URL. **TODO**: 도메인 확정 시 치환.

## 테스트

- `src/features/seo/documentMeta.test.ts`
  - 각 `BrewMethodId`에 대해 `buildMeta`가 유효한 title을 생성 (메서드명 포함, 포맷 일관).
  - `state.screen === "wall"` → `DEFAULT_META` 반환.
  - description 길이 <= 160.
  - `canonical`이 `BASE_URL`로 시작하고 쿼리스트링 포함.
- `applyMeta`는 테스트 제외 (DOM 직접 조작, 가치 대비 비용 과함).
- 기존 `urlCodec.test.ts`·`invariants.test.ts` 영향 없음.

## TODO (도메인/자산 확정 후)

스펙에 명시하여 실제 론칭 전 체크리스트로 사용한다.

1. ~~`https://example.com` → 실제 도메인으로 일괄 치환.~~ **완료 (2026-04-24)**: `https://pourover.work`로 치환. 대상 — `index.html`(canonical, og:url, og:image, JSON-LD url), `public/robots.txt`, `public/sitemap.xml`, `src/features/seo/documentMeta.ts`의 `BASE_URL`.
2. `/public/og-image.png` 생성 (1200×630, 한국어 타이포 + 커피 비주얼).
3. `<title>`·description 카피 최종 리뷰 (마케팅 관점).

## 수락 기준

- `bun run build`·`bun run test:run` 통과.
- `dist/index.html`에 description·canonical·OG·Twitter·JSON-LD 존재.
- `dist/robots.txt`·`dist/sitemap.xml` 생성됨.
- 개발 서버에서 메서드 변경 시 `document.title` 동적 갱신 확인.
- wall 스크린 진입 시 기본 메타로 복원 확인.
