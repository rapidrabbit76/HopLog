<p align="center">
<img src="assets/banner.webp" alt="HopLog Banner" width="100%">
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.ko.md">한국어</a>
</p>

# 🐰 HopLog

> 개발자가 쓰기 편하게 만든 심플한 블로그.
> 빠르게 글을 쓰고, 쉽게 커스터마이징하고, 편하게 읽을 수 있도록 만들었습니다.

HopLog는 Next.js 16과 Bun으로 만든 개발자 친화적인 블로그입니다. 빠른 시작 속도, 마크다운 기반 작성, 키보드 중심 탐색, 깔끔한 테마 시스템, 단순한 설정 구조에 집중합니다.

동시에 Jekyll 스타일 블로그의 단순함에서도 많은 영감을 받았습니다. 파일 기반 포스트 관리, frontmatter 중심 구성, 그리고 개발자에게 자연스러운 워크플로우를 그대로 녹여내려고 했습니다.

## ✨ 주요 특징

- **빠른 기본 성능**: Next.js 16(App Router)과 Tailwind CSS 4 기반으로 빠르게 동작합니다.
- **깔끔한 블로그 UI**: 불필요한 장식보다 글 자체에 집중할 수 있는 단순한 인터페이스를 제공합니다.
- **카테고리 기반 포스트 피드**: 홈 화면에서 카테고리 필터와 추가 로딩을 `/api/posts`로 처리합니다.
- **재귀 포스트 라우팅**: `content/posts/` 아래 중첩된 마크다운 파일이 그대로 `/posts/...` URL로 연결됩니다.
- **키보드 중심 탐색**: 커맨드 팔레트(⌘+⇧+P)와 전역 단축키를 지원합니다.
- **Git 활동 연동**: GitHub 기여도와 작성 밀도를 함께 보여줄 수 있습니다.
- **비공개 포스트 지원**: frontmatter 설정으로 초안이나 내부 글을 공개 영역에서 숨길 수 있습니다.
- **다국어 UI**: 영어, 한국어, 일본어, 중국어 UI 번역을 지원합니다.

## 🚀 빠른 시작

1. **저장소 클론**
   ```bash
   git clone https://github.com/rapidrabbit76/hoplog.git
   cd hoplog
   ```

2. **의존성 설치**
   ```bash
   bun install
   ```

3. **프로필 설정**
   ```bash
   cp content/profile.example.yml content/profile.yml
   ```
   `content/profile.yml`에서 이름, 소개, 소셜 링크, 경력, 기술 스택을 설정하세요.

4. **개발 서버 실행**
   ```bash
   bun dev
   ```

## 📝 글 작성

포스트는 `content/posts/` 아래 어디에나 둘 수 있습니다. 튜토리얼이나 시리즈처럼 폴더로 나눠도 자동으로 인식합니다.

예시:
- `content/posts/getting-started.md` → `/posts/getting-started`
- `content/posts/tutorial/advanced.md` → `/posts/tutorial/advanced`

### 포스트 메타데이터(frontmatter)

각 포스트는 YAML frontmatter를 사용합니다.

```yaml
---
title: "Your Post Title"
date: "2026.03.11"
category: ["Engineering", "Architecture"]
excerpt: "A brief summary for SEO and lists."
image: "/api/images/cover.jpg" # 선택
fontFamily: "'Noto Sans KR', sans-serif" # 선택
fontUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap" # 선택
visibility: "private" # 선택: 비공개 포스트
---
```

### 비공개 포스트

공개 사이트에서 포스트를 숨기려면 `visibility: "private"`를 사용하는 것을 권장합니다.

`public: false`도 이전 콘텐츠와의 호환을 위해 지원되지만, 앞으로는 `visibility` 형식을 쓰는 편이 더 명확합니다.

비공개 포스트는 다음에서 제외됩니다.

- 포스트 목록
- 정적 라우트 생성
- 메타데이터 생성
- `sitemap.xml`
- 직접 URL 접근

## 🎨 커스터마이징

### 사이트 설정
`content/config.yml`에서 사이트 메타데이터, hero 내용, 타이포그래피, title template을 설정합니다. 루트 SEO 설정은 `content/seo.yml`에서 관리합니다.

또한 `content/config.yml`에서 `ga`, `metaPixel`, `sentry`를 켜거나 끌 수 있습니다. 각 provider는 개별 `enabled` 플래그를 가지므로 독립적으로 비활성화할 수 있고, 실제 값은 `GA_MEASUREMENT_ID`, `META_PIXEL_ID`, `SENTRY_DSN` 같은 env에서 읽습니다.

### 포스트 공유
`content/config.yml`의 `sharing:` 배열에 값이 하나라도 있으면 포스트 하단에 아이콘 전용 공유 버튼 줄이 렌더링됩니다. 배열 순서가 버튼 순서를 결정합니다.

`copyLink`는 현재 URL을 복사한 뒤 잠시 체크 아이콘으로 바뀌어 피드백을 줍니다.

현재 지원 provider:
- `twitter`
- `facebook`
- `linkedin`
- `copyLink`

### 선택형 Meilisearch
HopLog는 항상 내장 로컬 검색 경로를 가지고 있습니다. 저장소에 포함된 `content/config.yml`은 Meilisearch 구성을 미리 적어두지만, 필요한 host/key 환경변수가 없으면 제목/요약 기반 로컬 검색으로 자동 폴백합니다. Meilisearch를 제대로 사용하려면 `content/config.yml`에서 `search.provider`를 `meilisearch`로 유지한 채 `MEILISEARCH_HOST`, `MEILISEARCH_SEARCH_KEY`, `MEILISEARCH_ADMIN_KEY`를 설정하고 `bun run search:sync`를 실행하세요.

### 테마
테마는 `content/themes/` 아래 개별 YAML 파일로 정의합니다. 추가한 테마는 자동으로 로드되고 커맨드 팔레트(⌘+⇧+P)에 나타납니다.

### UI 번역
UI 문구는 `messages/*.json` 파일에 분리되어 있습니다. 애플리케이션 코드 수정 없이 번역 작업을 할 수 있습니다.

지원 로케일:
- `en` (영어)
- `ko` (한국어)
- `ja` (일본어)
- `zh` (중국어)

자세한 사용 흐름은 `content/posts/tutorial/` 아래 튜토리얼 문서에서 이어서 볼 수 있습니다.

- Analytics 설정 튜토리얼: `/posts/tutorial/site-configuration`

## 🔎 기술 정보

- **메타데이터 생성**: `sitemap.xml`, `robots.txt`를 자동 생성합니다.
- **커스텀 오류 페이지**: 전용 `404`, `500` UI를 제공합니다.
- **미디어 지원**: 이미지는 `/api/images/[...path]` 경로로 제공합니다.
- **기술 스택**: Next.js 16 (React 19), Tailwind CSS 4 (OKLCH), Bun, Zustand, Remark/Rehype

## 🐳 Docker

### 빠른 시작

```bash
docker compose up -d
```

첫 실행 시 `blog/` 디렉토리가 생성되고 기본 콘텐츠(포스트, 테마, 설정, FAQ)가 자동으로 복사됩니다. `blog/` 안의 파일을 수정하여 사이트를 커스터마이징하세요. 이후 실행에서는 기존 콘텐츠를 유지합니다.

`profile.yml`은 이미지에 포함되지 않습니다. 없을 경우 `profile.example.yml`에서 자동 생성됩니다.

### 환경 변수

모든 변수는 선택 사항이며 런타임에 읽으므로, 이미지 재빌드 없이 변경할 수 있습니다.

| 변수 | 설명 |
| :--- | :--- |
| `GA_MEASUREMENT_ID` | Google Analytics 측정 ID |
| `META_PIXEL_ID` | Meta Pixel ID |
| `SENTRY_DSN` | Sentry DSN |
| `SENTRY_ENVIRONMENT` | Sentry 환경 이름 |

### 선택 사항: Meilisearch

검색은 내장 로컬 인덱스로 기본 동작합니다. Meilisearch는 **필수가 아닙니다**.

활성화하려면:

```bash
docker compose --profile search up -d
```

이후 `blog/config.yml`에서 `search.provider`를 `meilisearch`로 변경하고 동기화합니다:

```bash
docker compose exec app bun run search:sync
```

Meilisearch 사용 시 추가 변수:

| 변수 | 설명 |
| :--- | :--- |
| `MEILISEARCH_HOST` | Meilisearch 엔드포인트 URL |
| `MEILISEARCH_SEARCH_KEY` | 공개 검색 키 |
| `MEILISEARCH_ADMIN_KEY` | 관리 키 |

## 🛠 명령어

| 명령어 | 설명 |
| :--- | :--- |
| `bun dev` | 개발 서버 실행 |
| `bun run lint` | ESLint 검사 |
| `bun run build` | 프로덕션 빌드 |
| `bun start` | 프로덕션 서버 실행 |
| `bun run test:unit` | 단위 테스트 실행 (Vitest) |
| `bun run test:e2e` | E2E 테스트 실행 (Playwright) |
| `bun run search:sync` | Meilisearch 인덱스 동기화 |
| `bun run import:velog -- <username>` | Velog 포스트 가져오기 |

## 🔒 보안

HopLog은 스택 전반에 걸쳐 계층화된 보안 방식을 적용합니다:

| 영역 | 조치 사항 |
| :--- | :--- |
| **CSP** | `Content-Security-Policy`가 강제 적용됩니다 (Report-Only 아님). `script-src`, `img-src`, `connect-src`는 명시된 허용 목록으로 제한됩니다. |
| **SVG 서빙** | SVG 파일은 콘텐츠 내 `<script>`를 통한 저장형 XSS를 방지하기 위해 `application/octet-stream`으로 서빙됩니다. |
| **테마 검증** | YAML 테마 색상 값은 CSS 응답에 작성되기 전에 허용 목록 정규식(`isSafeCssColor`)을 통해 검증됩니다. |
| **로그 인젝션** | 사용자 제공 쿼리 문자열 및 카테고리 파라미터는 서버 로그에 기록되기 전에 정제(`sanitizeLogValue`)됩니다. |
| **API 입력** | `/api/giscus-theme`의 `themeId` 및 `mode` 쿼리 파라미터는 화이트리스트 검증을 거칩니다. 외부 API 응답(Meilisearch, GitHub Contributions)은 사용 전 런타임 타입 검증을 수행합니다. |
| **경로 탐색** | 이미지 서빙 라우트는 확인된 경로가 예상되는 콘텐츠 디렉토리 내에 있는지 검증합니다. |
| **비공개 포스트** | 비공개 포스트는 모든 공개 라우트, API 응답, 사이트맵 및 메타데이터에서 필터링됩니다. |

## 🖥️ 서버 배포

### 최초 설정

```bash
# 1. 서버에서 저장소 클론
git clone https://github.com/hang-in/HopLog.git
cd HopLog

# 2. 프로필 복사 및 편집
cp content/profile.example.yml content/profile.yml

# 3. .env 파일에 비밀값 설정 (선택 사항 — 모두 런타임 전용)
cat > .env <<'EOF'
GA_MEASUREMENT_ID=G-XXXXXXXXXX
META_PIXEL_ID=
SENTRY_DSN=
# 'search' 프로필 사용 시에만 필요:
MEILISEARCH_ADMIN_KEY=your-secure-random-key
MEILISEARCH_SEARCH_KEY=your-public-search-key
EOF

# 4. 앱 시작
docker compose up -d
```

### 업데이트 (pull & 재배포)

```bash
cd HopLog

# 최신 변경 사항 가져오기
git pull origin main

# 이미지 재빌드 및 컨테이너 재시작
# ./blog/의 블로그 콘텐츠는 자동으로 보존됩니다.
docker compose up -d --build
```

> **참고:** `blog/` 콘텐츠는 볼륨으로 마운트되며 업데이트 시 덮어쓰여지지 않습니다.
> 애플리케이션 코드가 변경된 경우에만 재빌드(`--build`)가 필요합니다.

### 선택 사항: Meilisearch 검색 활성화

```bash
# search 프로필(Meilisearch + 동기화 사이드카)로 시작
MEILISEARCH_ADMIN_KEY=your-key MEILISEARCH_SEARCH_KEY=your-key \
  docker compose --profile search up -d --build

# Meilisearch 인덱스에 포스트 동기화
docker compose exec app bun run search:sync
```

### 상태 확인 (Health Check)

```bash
curl http://localhost:3000/api/health
```

---

## 📜 라이선스

[MIT License](LICENSE)로 배포합니다. 기여는 언제든 환영합니다.
