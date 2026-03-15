---
title: "HopLog 시작하기"
date: "2026.03.12"
category: ["KO", "Guide", "HopLog"]
excerpt: "설치부터 첫 포스트 작성까지. 프로젝트 구조, 프론트매터, 키보드 단축키, 다국어 UI를 다룹니다."
image: "./images/hero-bg.webp"
---

## Docker로 빠른 시작 (권장)

HopLog를 가장 빠르게 실행하는 방법은 Docker입니다. `content/` 디렉토리에 포스트와 설정을 준비한 후:

```bash
docker run -p 3000:3000 \
  -v $(pwd)/content:/app/content \
  rapidrabbit76/hoplog:latest
```

`http://localhost:3000`을 열면 블로그가 바로 동작합니다. Meilisearch 검색이 필요하면 Docker Compose를 사용하세요:

```bash
docker compose --profile search up -d
```

서비스 구성, 환경변수, search-sync 사이드카에 대한 자세한 내용은 [배포](/posts/tutorial/ko/deployment) 가이드를 참고하세요.

## 로컬 개발

HopLog를 직접 개발하거나 커스터마이징하려면:

```bash
bun install
bun run dev
```

프로덕션: `bun run build && bun start`

## 프로젝트 구조

```text
content/
  config.yml          # 사이트 메타데이터, 히어로, 타이포그래피, 검색, 댓글, 분석
  profile.yml         # 프로필, 소셜 링크, 경력, 기술
  seo.yml             # SEO, OpenGraph, Twitter, robots 정책
  posts/              # Markdown 포스트 (재귀 스캔)
  themes/             # 컬러 테마 YAML 파일
  images/             # 이미지 (/api/images/ 경로로 서빙)
  faq/                # FAQ 다국어 파일 (en.yml, ko.yml, ...)
messages/
  en.json             # UI 번역 (en, ko, ja, zh)
  ko.json
  ja.json
  zh.json
```

## 포스트 작성

`content/posts/` 아래에 `.md` 파일을 생성하면 자동으로 인식됩니다. 중첩 경로도 지원합니다.

```text
content/posts/tutorial/getting-started.md → /posts/tutorial/getting-started
content/posts/my-first-post.md            → /posts/my-first-post
```

### 프론트매터

```yaml
---
title: "포스트 제목"                        # 필수
date: "2026.03.12"                         # 필수
category: ["KO", "Dev", "Guide"]                 # 필수
excerpt: "간단한 요약"                      # 선택 (없으면 본문에서 자동 생성)
image: "./images/thumbnail.jpg"            # 선택 (포스트 로컬 썸네일, OG 이미지)
fontFamily: "'Noto Sans KR', sans-serif"   # 선택 (포스트별 폰트 오버라이드)
fontUrl: "https://fonts.googleapis.com/..."# 선택
visibility: "private"                      # 선택 (비공개 포스트)
seo:                                       # 선택 (포스트별 SEO 오버라이드)
  title: "SEO 제목"
  description: "메타 설명"
  keywords: ["키워드1", "키워드2"]
  noindex: false
---
```

### 포스트별 로컬 이미지

이 문서는 실제로 포스트 옆의 `images/` 폴더에 있는 이미지를 사용합니다. `content/posts/tutorial/ko/getting-started/images/hero-bg.webp` 파일을 두고, 마크다운에서는 아래처럼 상대경로로 바로 참조할 수 있습니다.

```md
![포스트 로컬 이미지 예시](./images/hero-bg.webp)
```

![포스트 로컬 이미지 예시](./images/hero-bg.webp)

### 비공개 포스트

`visibility: "private"`를 설정하면 포스트 목록, 라우트 생성, 사이트맵, 직접 URL 접근에서 모두 제외됩니다. 레거시 호환을 위해 `public: false`도 지원합니다.

## 홈 포스트 피드

홈 화면은 첫 페이지 분량의 포스트로 시작하고, 카테고리 필터와 “Load more” 버튼으로 추가 포스트를 점진적으로 불러옵니다. 이 후속 요청은 `/api/posts`를 통해 처리됩니다.

## Markdown 기능

- **코드 블록**: 구문 강조 + 호버 시 복사 버튼 자동 생성
- **수식**: KaTeX 지원 (`remark-math` + `rehype-katex`)
- **GFM 테이블**: GitHub Flavored Markdown 테이블
- **목차 (ToC)**: 넓은 화면에서 오른쪽 사이드바에 자동 생성, 스크롤 위치 추적
- **이미지**: 전역 이미지는 `content/images/` + `/api/images/...`, 포스트 전용 이미지는 문서 옆 `images/` 폴더 + `./images/...`
- **포스트 공유**: `content/config.yml`의 `sharing:` 설정으로 포스트 하단 아이콘 전용 공유 버튼을 제어 (`twitter`, `facebook`, `linkedin`, `copyLink`)

## 키보드 단축키

| 키                        | 동작                |
| ------------------------- | ------------------- |
| `?`                       | 단축키 도움말       |
| `⌘⇧P` / `Ctrl+Shift+P`  | 커맨드 팔레트       |
| `T`                       | 다크/라이트 전환    |
| `W`                       | 와이드 모드 전환    |
| `G H`                     | 홈으로 이동         |
| `G B`                     | About 페이지        |
| `G F`                     | FAQ 페이지          |

## 다국어 UI

UI 텍스트는 `messages/*.json` 파일로 관리됩니다. 영어, 한국어, 일본어, 중국어를 지원하며, 헤더 드롭다운 또는 커맨드 팔레트에서 전환할 수 있습니다.

각 파일은 동일한 키 구조를 공유합니다: `header`, `postList`, `error`, `common`, `command`, `activity`.

---

다음: [사이트 설정](/posts/tutorial/ko/site-configuration) | [테마와 타이포그래피](/posts/tutorial/ko/themes-and-typography) | [검색](/posts/tutorial/ko/search) | [배포](/posts/tutorial/ko/deployment)
