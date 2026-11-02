# ISHARD 이미지 제작 — ChatGPT 플러그인

ChatGPT가 작업실(https://ishard-studio.prettybe4468.workers.dev)의 이미지 제작 요청을 읽고, 사진을 만들어 Drive에 저장하고, 작업실에 후보로 등록합니다.

## 올리는 법
1. 이 폴더를 압축(최상위에 `plugin.json`)해 ChatGPT **Plugin Creator**에서 기존 아이샤드 이미지 플러그인의 새 버전으로 올립니다.
2. ChatGPT 설정 → 앱 → **ISHARD 작업실** 연결을 **새로고침**해 `read_production_requests`·`save_production_image`가 보이게 합니다.
3. Google Drive 앱이 연결돼 있어야 업로드까지 됩니다. 안 되면 ChatGPT가 파일 이름을 알려주고, 사람이 폴더에 올리면 1시간 안에 자동 등록됩니다.

작업 기준은 `skills/ishard-image-maker/SKILL.md`, 원본 규칙은 저장소의 `writer/CHATGPT-IMAGES.md`.
