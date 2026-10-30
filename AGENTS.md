# ISHARD 작업실 — AI 작업 규칙 (Claude · ChatGPT/Codex 공통)

이 저장소는 운영 중인 **ISHARD 콘텐츠 작업실**(https://ishard-studio.prettybe4468.workers.dev) 코드입니다.
`main`에 합쳐지면 GitHub Actions가 곧바로 운영 사이트에 배포합니다. 그래서 아래 규칙을 꼭 지킵니다.

## 작업 방식
1. `main`에 직접 푸시하지 않습니다. 브랜치를 만들고 PR을 엽니다.
   - 브랜치 이름: `claude/<짧은-설명>` 또는 `codex/<짧은-설명>`
2. PR 설명에 **무엇을, 왜 바꿨는지, 사용자가 사이트에서 무엇이 달라 보이는지**를 한국어로 씁니다.
3. PR을 열기 전에 `npm run check`와 `npx wrangler deploy --dry-run --outdir dist`가 통과해야 합니다.
4. 합치기(merge)는 사람이 합니다. AI는 PR까지만 엽니다.
5. 다른 AI가 연 PR이 있으면 같은 부분을 동시에 고치지 말고, 그 PR에 리뷰나 댓글로 의견을 남깁니다.

## 절대 바꾸지 않는 것
- **원고 확정·이미지 확정·영상 생성·게시는 사람만 사이트에서 한다**는 구조. MCP 연결 도구에 확정·게시 기능을 추가하지 않습니다.
- 확정된 원고·캡션을 덮어쓰는 동작. 원고는 항상 새 버전으로 쌓입니다.
- 로그인(Cloudflare Access JWT 검증)과 구성원 권한(owner/editor/viewer) 확인.
- `wrangler.toml`의 이름·D1 연결·변수 값 (운영 설정과 같아야 함).
- 운영 D1 데이터. 스키마 변경이 필요하면 `schema/`에 날짜 붙인 SQL을 추가하고 PR에 "수동 적용 필요"라고 적습니다. 자동으로 실행하지 않습니다.

## 브랜드·콘텐츠 규칙 (코드에 들어 있는 기준)
- 효능·치료·실제 후기를 암시하는 표현 금지, 불안·구매 압박을 키우는 표현 금지.
- 제품 설명은 기획에 연결된 공식 제품 사실과 출처 범위 안에서만.
- 이미지: 자연광·폰카 일상 스냅, 크림·웜그레이 바탕과 올리브 연결색, 최소 소품, 정면 얼굴 피하기, 사진 속 글씨·로고·워터마크 금지.
- Higgsfield 프롬프트: 17섹션, AUDIO는 환경음·효과음만(음성·음악·자막 금지), ACTION은 0.0s에서 시작해 컷 길이에서 끝남.

## 코드 구조 (`src/worker.js` + `src/ui.html`)
운영 배포본을 그대로 옮긴 파일이라 변수 이름이 짧습니다. 고칠 때는 아래 위치를 기준으로 찾으세요.

| 하는 일 | 찾는 법 |
|---|---|
| D1 ↔ 작업 데이터 변환·저장(충돌 시 409) | `function Me`, `async function I(`, `async function He` |
| 로그인(Access JWT)·권한 | `async function Pt`, `async function ee` |
| 구매심리 기획 검사(80점 게이트 등) | `function Ge`, `function me` |
| 이미지 비주얼 규칙 문구 | `var Fe =` |
| Higgsfield 17섹션 검사 | `var V = Object.freeze`, `function Oe` |
| 콘텐츠 다음 단계 판단(오늘 할 일) | `function ht` |
| 사이트 버튼 동작 목록 | `var $e = {` |
| 동작 실행·저장 | `async function se` |
| OAuth(앱 등록·허용 화면·토큰) | `async function xt`, `async function _t`, `async function Ft`, `async function It` |
| MCP 도구 목록·설명 | `Nt = [`, 실행 `async function Gr`, 기획 읽기 `function contentBrief` |
| 사이트 화면(HTML/CSS/JS) | `src/ui.html` (worker.js가 `import qt from "./ui.html"`로 불러옴). 오늘 할 일 `function ts`, 검토함 `function rs`, 작업표 `function os`, 기획 탭 `function vs`·`function planBrief` |
| 요청 경로 분기 | `ds = {`, `async function Xr` |

업무 규칙의 읽기 쉬운 원본(옛 ChatGPT 사이트)은 `QQOQQQ/creative-agent` 저장소의
`feat/ishard-psychology-planning-v2-20261028` 브랜치 `branding-hosted/lib/*.mjs`에 있습니다.
여기 코드와 대응되므로, 규칙을 이해할 때 참고하세요.

## 원고 자동 작성
매일 조사·레퍼런스 기준 스케줄은 `writer/AUTO-PLANNER.md`(MCP `save_research_report`, `save_reference_week`, `replace_content_plan`, `create_content`, `save_content_plan` — 기획에 레퍼런스 필수), 원고 초안 작성 기준과 순서는 `writer/AUTO-WRITER.md`(공통 기준 `writer/BRAND-RULES.md`, 형식별 작가 `writer/ishard-*.md`)에 있습니다. 원고를 쓰는 AI는 이 문서를 따르고, 저장은 MCP `save_script_draft`(label A/B/C)로 초안만 합니다.

## 화면 확인 방법
`scripts/fixtures/contents.json`으로 로컬 D1을 채우고 `npx wrangler dev --local --var DEV_MODE:true --var DEV_USER_EMAIL:prettybe4468@gmail.com`로 띄우면 로그인 없이 화면을 볼 수 있습니다. 화면을 바꾼 PR은 스크린샷이나 확인한 내용을 PR에 적습니다.

## 점진적 정리
한 PR에서 큰 리팩터링을 하지 않습니다. 기능을 고치는 김에 그 부분만 `src/` 아래 모듈로 분리하고, 동작이 같다는 근거를 PR에 적습니다.
