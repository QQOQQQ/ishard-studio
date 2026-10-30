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

## 3. 기획서 쓰기
### 대상
1. **빈 일정 채우기**: 오늘부터 14일 동안 월~토 하루 1건씩 콘텐츠가 있어야 합니다. 빈 날이 있으면 `create_content`로 만들고 바로 `save_content_plan`으로 기획을 넣습니다.
   - ID: `ISHARD-<제품번호>-<YYYYMMDD>-<R|C|I>01` (R 릴스, C 캐러셀, I 이미지). 제품번호는 상세페이지 `product_no`.
   - 한 주 형식 비율은 대략 릴스 3 · 캐러셀 2 · 이미지 1.
   - 같은 제품을 3일 안에 반복하지 않고, 한 주에 같은 제품은 2번까지. 오늘 신호와 맞는 제품을 우선하되, 그동안 덜 다룬 제품도 돌아가며 넣습니다.
2. **빈 기획 채우기**: 일정은 있는데 `plan`이 비어 있는 콘텐츠.
3. **기획 보강(하루 최대 2건)**: 4~14일 뒤 콘텐츠 중 원고가 없고, 오늘 신호와 분명히 맞는데 트렌드·레퍼런스 근거가 비어 있는 것. 기존 기획의 좋은 내용은 유지하고 근거를 더합니다.
- 원고 초안이 이미 있는 콘텐츠, 확정·제작이 시작된 콘텐츠는 **건드리지 않습니다**(도구도 막습니다).

### 기획서 형식 (`save_content_plan`의 `plan`)
필수: `purpose`, `productFacts[{fact, source, checkedAt}]`(source는 아이샤드 공식 상세페이지 https 주소)
권장(사이트 기획 탭에 그대로 보입니다):
- `status`: "미승인 신규 기획", `category`: "동향 적용" 또는 "상시", `trendClassification`: "trend" | "evergreen"
- `trendReportId`: 오늘 리포트 ID, `signalIds`: 사용한 신호, `trendApplication`: 신호를 이 콘텐츠에 어떻게 썼는지와 한계
- `lifeContext`: {생활상황, 고민, 감정, 기존시도, 불만, 원하는변화, 망설임, 고려이유}
- `purchasePsychology`, `evidenceAppeal[]`
- `hookDirection[{angle, hookId?}]` 2~3개, `flow[]`(장면/장의 흐름), 캐러셀은 `slideCount`
- `sources[]`: 제품 페이지 + 트렌드 출처({url, type, checkedAt, publishedAt, period, limit})
- `referenceApplication[{id, url, observation, observedAt, reuseLimit}]`: 빌려온 레퍼런스 구조
- `forbiddenClaims[]`: 이 제품·주제에서 특히 조심할 표현
- `differentiator`: 같은 제품의 다른 콘텐츠와 무엇이 다른지
- `writerInstruction`: 길이(릴스 초 수), 톤, 꼭 피할 장면 등 작가에게 줄 지시
- `responseHypothesis`: {variable, metric, limit} — 무엇을 바꿔서 어떤 반응을 볼지

## 4. 결과 보고
짧게 남깁니다: 오늘 리포트 제목과 핵심 신호 3개, 새로 만든 콘텐츠(날짜·형식·제품·주제), 채우거나 보강한 기획, 조사하지 못한 항목. 확인 링크: https://ishard-studio.prettybe4468.workers.dev (기록 탭 → 조사 리포트)
