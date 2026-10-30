-- 운영 D1(ishard-studio)의 2026-10-30 기준 스키마 그대로입니다.
-- 운영 DB에는 이미 적용되어 있으니 다시 실행하지 마세요. 새 테이블·컬럼 변경은 schema/ 아래에 날짜를 붙인 SQL 파일로 추가하고, PR에서 사람이 확인한 뒤 수동으로 적용합니다.

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE members (email TEXT PRIMARY KEY, role TEXT NOT NULL CHECK (role IN ('owner','editor','viewer')), added_at TEXT NOT NULL);

CREATE TABLE contents (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL, date TEXT, format TEXT);
CREATE TABLE script_versions     (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE approvals           (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE approval_holds      (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE approval_history    (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE finals              (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE final_videos        (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE storyboards         (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE higgsfield_prompts  (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE publications        (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE notes               (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE events              (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE production_requests (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE revision_requests   (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE trash               (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE reports             (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);
CREATE TABLE state_misc          (pk TEXT PRIMARY KEY, content_id TEXT, ord INTEGER, data TEXT NOT NULL);

CREATE TABLE oauth_clients (client_id TEXT PRIMARY KEY, data TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE oauth_pending (id TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE oauth_codes (hash TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE oauth_tokens (hash TEXT PRIMARY KEY, kind TEXT NOT NULL, email TEXT NOT NULL, client_id TEXT NOT NULL, scope TEXT NOT NULL, family TEXT NOT NULL, expires INTEGER NOT NULL, created INTEGER NOT NULL);

CREATE INDEX contents_date ON contents(date);
CREATE INDEX ev_content ON events(content_id);
CREATE INDEX sv_content ON script_versions(content_id);
CREATE INDEX pr_content ON production_requests(content_id);
CREATE INDEX rr_content ON revision_requests(content_id);
CREATE INDEX oauth_tokens_family ON oauth_tokens(family);
