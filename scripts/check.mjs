// PR마다 돌리는 기본 검사: 문법, 필수 경로, 작업실 안전 규칙이 코드에서 사라지지 않았는지.
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const src = readFileSync("src/worker.js", "utf8") + "\n" + readFileSync("src/ui.html", "utf8");
const fail = [];

try {
  await build({ entryPoints: ["src/worker.js"], bundle: false, write: false, format: "esm", logLevel: "silent" });
} catch (e) {
  fail.push("문법 오류: " + (e.errors?.[0]?.text || e.message));
}

const must = {
  "기본 내보내기(export default)": /export\s*\{[^}]*as default/,
  "MCP 경로 /mcp": /"\/mcp"/,
  "OAuth 경로 /authorize, /token, /register": /"\/authorize"[\s\S]*"\/token"|"\/token"[\s\S]*"\/authorize"/,
  "작업실 로그인 확인(Cf-Access-Jwt-Assertion)": /Cf-Access-Jwt-Assertion/,
  "저장 상태 검증 함수(validState) 호출": /validState/,
  "원고 확정은 사이트에서만: MCP 설명 문구": /원고 확정, 이미지 확정, 영상 생성, 게시는 이 연결로 할 수 없습니다|\\uC6D0\\uACE0 \\uD655\\uC815/,
  "Higgsfield AUDIO 규칙(음성·음악 금지)": /AUDIO must allow only ambient sound/,
  "화면 파일 불러오기": /import qt from "\.\/ui\.html"/,
};
for (const [label, re] of Object.entries(must)) if (!re.test(src)) fail.push("빠짐: " + label);

if (fail.length) {
  console.error("검사 실패\n- " + fail.join("\n- "));
  process.exit(1);
}
console.log("검사 통과 (" + src.length.toLocaleString() + "자)");
