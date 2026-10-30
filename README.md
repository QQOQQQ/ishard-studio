# ISHARD 콘텐츠 작업실

아이샤드 인스타그램 콘텐츠의 기획 → 원고 → 스토리보드 → 장면 이미지 → Higgsfield 영상 → 게시 기록을 한곳에서 관리하는 사이트입니다.

- 사이트: https://ishard-studio.prettybe4468.workers.dev (Cloudflare Access 로그인)
- AI 연결(MCP): `https://ishard-studio.prettybe4468.workers.dev/mcp` — Claude, ChatGPT 모두 같은 주소
- 구성: Cloudflare Worker 1개(`src/worker.js`) + D1 데이터베이스 `ishard-studio`

## 고치는 흐름
1. 브랜치를 만들어 고친다 (Claude는 `claude/…`, ChatGPT/Codex는 `codex/…`).
2. PR을 연다 → GitHub Actions가 코드 검사와 배포 시험을 돌린다.
3. 사람이 PR을 확인하고 `main`에 합친다 → 자동으로 운영 사이트에 배포된다.

AI 작업 규칙은 [AGENTS.md](AGENTS.md)에 있습니다.

## 처음 한 번 설정
- 저장소 **Settings → Secrets and variables → Actions → New repository secret**
  - 이름: `CLOUDFLARE_API_TOKEN`
  - 값: Cloudflare에서 만든 API 토큰 (템플릿 "Edit Cloudflare Workers", 계정 리소스는 이 계정만)
- 저장소 **Settings → Branches**에서 `main`에 "Require a pull request before merging"을 켜두면 AI가 실수로 바로 배포하는 일을 막을 수 있습니다.

## 로컬에서
```
npm install
npm run check
npx wrangler deploy --dry-run --outdir dist
```

## 기록
- 2026-10-30: 운영 배포본(빌드 sha256 07f22ceb…)을 가져와 줄바꿈만 정리해 첫 커밋. 압축 결과가 운영본과 동일함을 확인했습니다.
- `schema/baseline-20261030.sql`: 같은 날 운영 D1 스키마.
