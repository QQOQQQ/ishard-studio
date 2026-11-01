---
name: ishard-image-maker
description: ISHARD 작업실의 이미지 제작 요청을 읽고, 장마다 9:16 사진을 만들어 Google Drive 콘텐츠 폴더에 저장한 뒤 작업실에 후보로 등록한다. "아이샤드 이미지 만들어줘", "이미지 요청 처리해줘", 콘텐츠 ID와 함께 이미지·수정본을 요청할 때 사용.
---

# ISHARD 이미지 제작

사람이 작업실 사이트(https://ishard-studio.prettybe4468.workers.dev)에서 원고를 확정하고 **이미지 제작 요청 만들기**를 누르면 요청이 생깁니다. 이 스킬은 그 요청을 처리합니다.
**고르기·이미지 확정·게시는 사람이 사이트에서만 합니다.** 이 스킬은 후보 등록까지만 합니다.

## 쓰는 연결
- **ISHARD 작업실** (MCP `https://ishard-studio.prettybe4468.workers.dev/mcp`): `read_production_requests`, `save_production_image`
- **Google Drive**: 이미지 파일 업로드

`read_production_requests`가 보이지 않으면: ChatGPT 설정 → 앱(커넥터) → ISHARD 작업실 → **새로고침**(Refresh)으로 도구 목록을 갱신해 달라고 사람에게 한 줄로 안내하고 멈춥니다.

## 1. 요청 읽기
`read_production_requests`를 호출합니다. 사람이 콘텐츠 ID를 말했으면 `content_id`를 넣습니다.
- 요청이 없으면: "작업실에 열린 이미지 요청이 없어요. 사이트에서 원고 확정 → 이미지 제작 요청 만들기를 먼저 눌러 주세요."라고 말하고 끝냅니다.
- 처리 대상: `slots` 중 `done: false`인 장, 그리고 `revision_requests` 중 `done: false`인 장.
- 장이 많으면(5장 이상) 한 번에 다 만들지 말고 2~3장씩 나눠 만들고, 장마다 바로 저장·등록합니다.

## 2. 장마다 사진 1장 만들기
각 장의 `source_text`(확정 원고 문장)와 `prompt`, 요청의 `visual_rules`, `product_library`를 기준으로 만듭니다.
- **9:16 세로 독립 사진 1장.** 콜라주·분할 화면 금지.
- 사진 안에 글씨·자막·장 번호·로고·워터마크·CTA를 넣지 않습니다(카피는 사이트에서 따로 얹습니다).
- 자연광, 폰으로 찍은 듯한 일상 스냅. 크림·웜그레이 바탕에 작은 올리브 연결색. 소품은 최소.
- 사람 정면 얼굴은 가급적 피합니다(손·발·뒷모습·탑뷰 위주).
- `requires_product: true`이거나 제품이 나오면 `product_library.url`(공식 상세페이지)와 `reference_urls`의 실제 제품 사진을 보고 **모양·색·뚜껑·라벨을 그대로** 표현합니다. 가짜 패키지·임의 로고 금지. 확인이 어려우면 라벨이 안 보이는 각도로.
- 비누는 손이나 거품망에서 거품을 내는 장면만. 얼굴에 비누를 직접 문지르는 장면 금지.
- 손이 나오면 손가락 5개, 왼손·오른손 개수와 팔 연결이 자연스럽게.
- 전후 비교, 효능 암시(피부가 확 달라진 모습 등), 후기 화면·별점 화면 금지.
- 수정 요청(`revision_requests`)은 `parent_image_url`의 원본을 기준으로 `note`에 적힌 부분만 고칩니다.

## 3. Drive에 저장
1. 파일 이름: `<content_id>_<slot_id>.png` (수정본은 `<content_id>_<slot_id>_r1.png`, 두 번째 수정이면 `_r2`).
2. 요청의 `drive_folder`(`https://drive.google.com/drive/folders/<폴더ID>`)의 폴더 ID 안에 Google Drive 연결로 업로드합니다. 다른 폴더나 내 드라이브 최상위에 올리지 않습니다.
3. 업로드 결과의 파일 ID로 링크를 만듭니다: `https://drive.google.com/file/d/<파일ID>/view`.
4. `drive_folder`가 비어 있으면 업로드하지 말고, 사람에게 사이트에서 Drive 폴더를 연결해 달라고 안내합니다.

**Drive 업로드가 안 될 때(연결 없음·권한 오류):** 만든 이미지를 대화에 보여 주고, 파일 이름과 올릴 폴더 링크를 표로 알려 줍니다. "이 이름 그대로 폴더에 올려 주시면 1시간 안에 작업실에 자동 등록돼요."라고 안내하고 4단계는 건너뜁니다.

## 4. 작업실에 등록
장마다 `save_production_image`를 호출합니다.
- `request_id`: 원래 장은 요청의 `request_id`, 수정본은 해당 `revision_requests`의 `request_id`
- `slot_id`, `drive_file_url`(위 `/view` 링크), `file_name`
- 이미 `done: true`인 장은 다시 등록하지 않습니다(덮어쓰기 불가).

## 5. 보고
마지막에 짧게:
- 콘텐츠 ID · 등록한 장 목록(예: slide-1~slide-4) · 남은 장
- "사이트 이미지 탭에서 골라 확정해 주세요 → https://ishard-studio.prettybe4468.workers.dev"
- 업로드가 안 된 장이 있으면 파일 이름과 폴더 링크

## 하지 않는 것
이미지 고르기·확정, 원고 수정, 영상 생성, SNS 게시, 사이트 설정 변경. 이미지를 실제 후기나 효능 증거처럼 설명하지 않습니다.
