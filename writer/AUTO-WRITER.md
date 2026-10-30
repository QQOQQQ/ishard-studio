# ISHARD 자동 원고 작가 — 작업 순서

매일 아침 정기 작업이 이 문서를 따라 원고 초안을 작업실에 올립니다. Claude와 ChatGPT 모두 같은 순서로 씁니다.
사람이 하는 일은 사이트에서 초안을 비교하고 **확정**하는 것뿐입니다.

## 0. Drive 폴더 미리 만들기 (원고 쓰기 전에)
게시일이 **오늘부터 3일 뒤까지**인 콘텐츠 중 `read_branding_workspace`의 `drive_folder`가 비어 있는 것마다:
1. Google Drive 연결로 폴더를 만듭니다. 이름은 콘텐츠 ID 그대로(예: `ISHARD-28-20261101-R01`).
   - 릴스: `ISHARD SNS/Reels` (폴더 ID `1P741cLl2JaMqwNU0yQaGsemnkLAb_CJG`)
   - 캐러셀·이미지: `ISHARD SNS/Carousels` (폴더 ID `1a7bwr2ERvZpY7hzEMxsb_dra6_5g2JLW`)
   - 같은 부모 아래에 그 콘텐츠 ID로 시작하는 폴더가 이미 있으면 새로 만들지 않고 그 폴더를 씁니다.
2. `set_content_drive_folder`로 `https://drive.google.com/drive/folders/<폴더ID>`를 연결합니다.
이렇게 하면 사람이 원고를 확정하고 이미지 제작 요청을 누를 때 저장 폴더가 이미 채워져 있습니다.

## 1. 대상 고르기
1. `read_branding_workspace`로 전체 목록을 읽습니다.
2. 아래를 모두 만족하는 콘텐츠만 씁니다.
   - 게시일이 **오늘(한국 시간)부터 3일 뒤까지**, 또는 이미 지났지만 아직 `done`이 아닌 것
   - `approved_version`이 없음 (확정 원고 없음)
3. 각 콘텐츠를 `read_content_brief`로 읽고, 다음이면 **건너뜁니다**.
   - `versions`에 이미 `Claude 초안`/`A안`/`B안`/`C안` 라벨이 있거나 사용자 직접 원고(`author: "user"`, 라벨 없음)가 있음 → 이미 초안이 있으니 중복 작성 금지
   - `open_revision_requests`가 있음 → 사람이 수정 요청한 상태이므로 자동 작성 금지
   - `plan`이 비어 있음 → 기획 없이 쓰지 않음. 결과 보고에 "기획 필요"로 남김

## 2. 쓰기 전에 읽을 것
- `writer/BRAND-RULES.md` (공통 기준)
- 형식별 스킬: 릴스 `writer/ishard-brand-reel-writer.md`, 캐러셀 `writer/ishard-carousel-writer.md`, 이미지 `writer/ishard-image-caption-writer.md`
- `read_content_brief`의 `plan`: 목적, 생활 장면(`lifeContext`/`persona`), 트렌드(`trendApplication`, 출처의 `limit`), 레퍼런스(`referenceApplication`), 후킹 방향(`hookDirection`), 흐름(`flow`), 제품 사실(`productFacts`), 금지 표현(`forbiddenClaims`), `writerInstruction`, `differentiator`
- `same_product_contents`: 같은 제품의 다른 콘텐츠 주제. 같은 장면·같은 도입을 반복하지 않습니다.

## 3. 쓰는 기준 (원고 요청 버튼의 기준을 그대로 옮김)
- **대본·캡션만** 씁니다. 스토리보드·카메라·컷·후편집 자막은 쓰지 않습니다.
- 첫 문장에 강한 후킹, 본문에 실제 정보 페이오프. 광고처럼 보이지 않는 네이티브 콘텐츠.
- **A/B/C는 서로 다른 이야기**(다른 생활 출발점과 전개). 제품 사실과 기획 목표는 같게.
- 제품 사실·출처는 확인용 근거입니다. "미백·주름개선 기능성으로 안내되는 제품이에요"처럼 **상세페이지를 중계하거나 기능성·제품 분류를 나열하지 않습니다.** 고객 상황에 필요한 사실만 자연스럽게 직접 설명합니다.
- 자연스럽게 고친다고 효과 보장·미검증 사용감·가짜 경험을 덧붙이지 않습니다.
- 트렌드 출처의 `limit`(예: "국내 수요 증가 아님")을 넘는 주장을 하지 않습니다.
- 비누는 손이나 거품망에서 거품을 내며, 얼굴에 직접 문지르는 묘사를 하지 않습니다.
- CTA는 하나: 저장 / 의미 있는 댓글 / 공식 상세 확인 중 본문과 이어지는 것.
- 형식
  - 릴스: 들리는 말 그대로의 대본. `writerInstruction`에 길이(예: 약 15초)가 있으면 따릅니다.
  - 캐러셀: **장과 장 사이를 빈 줄로** 나눕니다(사이트가 빈 줄 기준으로 장을 나눔). `plan.slideCount`가 있으면 그 장 수.
  - 이미지: 사진과 함께 읽는 짧은 문장 + 캡션.
- 바이럴·품질 점수를 지어내지 않습니다. 평가와 출처 메모는 원고 안에 넣지 않습니다.

## 4. 저장
- 콘텐츠마다 `save_script_draft`를 3번 호출합니다: `label` = `A`, `B`, `C`.
- `comments`에는 가상의 예상 댓글 3~4개(실제 후기처럼 쓰지 않음)를 넣을 수 있습니다.
- 이미지 형식은 기획에 A/B/C 요구가 없으면 A 하나만 써도 됩니다.
- 확정·승인·게시·이미지·영상 요청은 하지 않습니다(도구도 없습니다).

## 5. 결과 보고
마지막에 한 번 `SendUserMessage`(또는 최종 응답)로 짧게 남깁니다.
- Drive 폴더를 만든 콘텐츠
- 작성한 콘텐츠: 게시일 · 콘텐츠 ID · 주제 한 줄 · "A/B/C 저장"
- 건너뛴 콘텐츠와 이유(이미 초안 있음 / 수정 요청 중 / 기획 필요)
- 확인 링크: https://ishard-studio.prettybe4468.workers.dev
