# ISHARD 자동 기획 — 매일 조사하고 기획서 쓰기

매일 아침 정기 작업이 이 문서를 따라 **조사 리포트**를 남기고 **기획서**를 작업실에 채웁니다.
원고는 그다음 `writer/AUTO-WRITER.md` 작업이 씁니다. 사람은 사이트에서 기획과 원고를 보고 확정합니다.

## 0. 원칙
- 관찰한 사실과 편집 가설을 섞지 않습니다. 모든 신호에 **출처 링크, 확인일, 한계**(예: "해외 데이터, 국내 일반화 금지", "조회수 기반, 구매·효능 아님")를 붙입니다.
- 출처를 찾지 못한 수치·순위·"요즘 뜬다"는 단정을 쓰지 않습니다. 못 찾았으면 "확인 못 함"이라고 적습니다.
- 다른 브랜드의 문구·제품 주장·영상은 **구조(첫 장면, 컷 리듬, 정보 순서)만** 참고하고, 문장과 효능 주장은 가져오지 않습니다.
- 제품 사실은 **그날 확인한 아이샤드 공식 상세페이지**에서만 가져옵니다.
- 확정·게시·이미지·영상은 하지 않습니다.

## 1. 현황 읽기
`read_branding_workspace`로 앞으로의 일정과 단계를 봅니다. 기획이 비었는지는 `read_content_brief`의 `plan`으로 확인합니다.

## 2. 조사 (매일)
아래 다섯 가지를 조사합니다. 도구가 안 되면 다른 경로로 대신하고, 끝까지 안 되면 리포트에 "확인 못 함"으로 남깁니다.

1. **뷰티 SNS 트렌드**: vidIQ의 인스타그램·틱톡 아웃라이어 검색과 트렌딩 영상(스킨케어, 세안, 클렌징 바/비누, 수분크림, 각질, 바디·풋케어 등 아이샤드 제품군 키워드). 무엇이 왜 반응을 얻는지(첫 2초, 형식, 길이, 자막 방식, 댓글 반응)를 적습니다.
2. **업계 동향**: 웹 검색으로 최근 7일 국내외 뷰티 업계 기사·리포트(화해 비즈니스 인사이트, 올리브영 트렌드 발표, 업계지 등). 규제·성분 이슈, 시즌 이슈(환절기, 건조, 연말 선물)를 포함합니다.
3. **키워드**: vidIQ 키워드 조사와 검색 결과로 아이샤드 제품과 이어지는 검색어·해시태그 흐름.
4. **레퍼런스 업체**: AdWhispr로 비슷한 카테고리 브랜드의 현재 집행 중인 광고, vidIQ로 브랜드 인스타 릴스. 마케팅센터 DB `reference_ads`(아래)도 참고합니다. 각 레퍼런스마다 링크, 관찰한 점, **빌려올 점**, **빌리면 안 되는 점**을 적습니다.
5. **고객 목소리**: 마케팅센터 DB(읽기 전용)의 리뷰·소구점·페르소나에서 이번 기획 제품과 관련된 실제 표현을 찾습니다. 리뷰는 "한 고객의 경험"으로만 인용하고 효능 근거로 쓰지 않습니다.

마케팅센터 DB (Cloudflare D1, 읽기만): `database_id = 04a1cfcc-bcee-4cbc-b51f-123244acaee5`
- `products`(제품명, source_url, spec_summary) / `reviews`(product_id, review_text, rating, review_date) / `appeal_points`(headline, inferred_need, mention_count) / `audience_personas`(pain_points, needs, objections, message_angles) / `reference_ads`(competitor_page_name, copy_text, hook_pattern, core_angle, running_days)
- 절대 쓰기·수정 쿼리를 실행하지 않습니다.

### 리포트 저장
`save_research_report`로 저장합니다. `id = ISHARD-RESEARCH-YYYYMMDD`(한국 날짜), 제목 예: "10/31 뷰티 SNS·업계 동향 리포트".
본문(마크다운) 구성:
1. 오늘의 신호 `S1, S2, …` — 관찰 사실 / 출처 / 확인일 / 한계 / 아이샤드와의 연결(가설)
2. 키워드 흐름
3. 레퍼런스 분석 — 링크 / 관찰 / 빌려올 점 / 빌리면 안 되는 점
4. 고객 목소리 — 짧은 인용과 제품, 해석의 한계
5. 기획 반영 제안 — 어떤 콘텐츠에 어떤 신호를 쓰는지
`links`에 사용한 출처 URL을 모두 넣습니다.

### 레퍼런스 탭 갱신
사이트 **레퍼런스** 탭은 주 단위(ISO 주, 예: `2026-W45`)로 보입니다.
1. `read_references`로 이번 주 데이터를 읽습니다(없으면 새로 시작, 월요일이면 새 주).
2. 오늘 분석한 콘텐츠를 `items`에 **추가**하고(같은 url은 갱신), `patterns`·`headline`·`typeShares`·`sources`를 이번 주 전체 기준으로 다시 씁니다. 지난 날의 항목을 지우지 않습니다.
   - item: `{handle, kind: fixed|outlier, format, url, views, ratio, postedAt, hook, type, flow, why, apply, ugc: direct|adapt|hard, ugcNote}`
   - `type`은 구매심리 유형: failure(실패 회피) / statusquo(현재 제품 유지) / tradeoff(조건 충돌) / burden(관리 부담) / proof(근거 확인) / confusion(정보 혼란)
3. 아이샤드에 바로 쓸 만한 것은 `drafts`에 기획 초안으로 넣습니다(하루 0~2개, 주 최대 6개): `{id: "W45-D1", title, product, format, hook, why, suggestedDate, facts[{id, fact, source}], inspiredBy[url], needsFact, scenes[{sec, visual, camera, text}], strategyV2}`. facts는 제품 근거 라이브러리 또는 그날 확인한 공식 상세페이지에서만 가져옵니다.
4. `save_reference_week`로 이번 주 전체를 저장합니다. 사람은 레퍼런스 탭에서 초안을 보고 "이 기획으로 콘텐츠 만들기"를 누를 수 있습니다.
5. 제품 근거 라이브러리(`read_references`의 `product_library`)에 없는 사실을 새로 확인했으면, 라이브러리 전체를 읽어 그 제품의 `facts`에 추가한 뒤 `save_product_library`로 저장합니다. 기존 항목을 지우지 않습니다.

## 3. 레퍼런스 기준으로 스케줄 짜기
스케줄의 출발점은 **레퍼런스**입니다. 트렌드·키워드·고객 목소리는 레퍼런스에서 고른 형식과 주제를 아이샤드 제품에 맞추는 데 씁니다.
모든 기획에는 실제로 분석한 레퍼런스(`referenceApplication`: url, 빌려온 점, 관찰일, 한계)가 1개 이상 있어야 하고, 없으면 서버가 저장을 거절합니다.

### 손댈 수 있는 범위
- 게시일이 **오늘+4일 이후이면서 2026-11-03 이후**인 콘텐츠만. (오늘~3일 뒤는 원고 작가가 쓰는 중이라 건드리지 않습니다.)
- 원고 초안이 없고, 확정·제작이 시작되지 않은 것만(서버도 막습니다).
- 앞으로 14일 범위만 봅니다.

### 순서
1. **슬롯 평가**: 범위 안의 콘텐츠마다 `read_content_brief`로 기획을 읽고 레퍼런스 근거를 평가합니다.
   - 강함: 이번 주 또는 지난주 레퍼런스(`read_references`) 항목을 구체적으로 빌렸고, 그 레퍼런스가 반응 근거(조회·평소 대비 배수 등)를 가짐 → **유지**
   - 약함: 레퍼런스 없음, 오래된(14일 넘은) 관찰 하나를 재사용, 또는 빌려온 점이 막연함 → **교체 대상**
2. **교체할 기획 고르기** (우선순위)
   1) 레퍼런스 탭 이번 주 `drafts` 중 아직 일정에 없는 것(사이트에서 `plan.sourceDraft`가 같은 콘텐츠가 없는 것)
   2) 이번 주 `items`·`patterns`에서 반응이 큰 형식(평소 대비 배수가 높은 것, 얼굴·목소리 없이 만들 수 있는 `ugc: direct|adapt` 우선)을 아이샤드 제품에 맞춘 새 기획
3. **교체 실행**: `replace_content_plan`
   - 같은 제품·형식이면 주제와 기획만 바뀌고 콘텐츠 ID는 그대로입니다.
   - 제품이나 형식이 바뀌면 `product_no`를 넣습니다. 기존 콘텐츠는 휴지통(복원 가능)으로 가고 같은 날짜에 새 ID가 생깁니다.
   - 레퍼런스 탭 초안을 넣을 때는 `source_draft: "<주>/<초안 id>"`(예: `2026-W44/W44-D1`)를 넣어야 레퍼런스 탭에서 "만든 콘텐츠 열기"로 이어집니다.
   - `reason`에 한 줄로 이유를 적습니다(예: "W44 '습관 판정형' 레퍼런스 기준 재기획").
   - **하루 최대 3건**만 교체합니다. 첫 실행(2026-10-30·31)은 최대 6건까지.
4. **빈 날 채우기**: 14일 안 월~토 빈 날은 `create_content` 후 `save_content_plan`(레퍼런스 필수).
5. **스케줄 균형** (교체·생성 후 전체를 다시 봅니다)
   - 한 주 형식: 릴스 3 · 캐러셀 2 · 이미지 1 정도
   - 같은 제품 3일 안 반복 금지, 한 주 같은 제품 최대 2번
   - 같은 레퍼런스 형식(예: O/X 판정형)을 한 주에 2번 넘게 쓰지 않기
   - 주력 제품(라이브러리 `sns: 주력`)을 우선하되 확장·순환 제품도 돌아가며

### 기획서 형식 (`save_content_plan` / `replace_content_plan`의 `plan`)
필수: `purpose`, `productFacts[{fact, source, checkedAt}]`(아이샤드 공식 상세페이지 https), `referenceApplication[{id, url, observation, observedAt, reuseLimit}]`
권장(사이트 기획 탭에 그대로 보입니다):
- `status`: "미승인 신규 기획", `category`: "레퍼런스 적용", `trendClassification`: "trend" | "evergreen"
- `trendReportId`: 오늘 리포트 ID 또는 `REFWEEK-<주>`, `signalIds`, `trendApplication`: 신호를 이 콘텐츠에 어떻게 썼는지와 한계
- `lifeContext`: {생활상황, 고민, 감정, 기존시도, 불만, 원하는변화, 망설임, 고려이유}
- `purchasePsychology`, `evidenceAppeal[]`
- `hookDirection[{angle, hookId?}]` 2~3개 — 레퍼런스의 첫 문장 **구조**를 빌려 아이샤드 상황으로 새로 씁니다
- `flow[]`, 캐러셀은 `slideCount`, 릴스는 `sceneHint[{sec, visual, camera, text}]`(레퍼런스의 컷 리듬 참고, 얼굴·목소리 없이 가능한 장면)
- `sources[]`: 제품 페이지 + 트렌드 출처({url, type, checkedAt, publishedAt, period, limit})
- `forbiddenClaims[]`: 제품 라이브러리 `forbidden` 포함
- `differentiator`: 같은 제품의 다른 콘텐츠와 무엇이 다른지
- `writerInstruction`: 길이(릴스 초 수), 톤, 꼭 피할 장면
- `responseHypothesis`: {variable, metric, limit}

## 4. 결과 보고
짧게 남깁니다: 오늘 리포트 제목과 핵심 신호 3개, 교체한 콘텐츠(날짜·이전 주제 → 새 주제·사용한 레퍼런스), 새로 만든 콘텐츠, 유지한 콘텐츠 수, 조사하지 못한 항목. 확인 링크: https://ishard-studio.prettybe4468.workers.dev (기록 탭 → 조사 리포트)
