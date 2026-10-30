import qt from "./ui.html";
function __ishardUpdatePlan(e, t) {
  return v(e, (u) => {
    let id = String(t.id || "").trim(),
      c = u.contents.find((x) => x.id === id);
    if (!c) throw Error("콘텐츠를 찾지 못했습니다: " + id);
    if ((u.state.approvals && u.state.approvals[id]) || (u.state.approvalHolds && u.state.approvalHolds[id]))
      throw Error(
        "원고가 확정된 적 있는 콘텐츠는 이 연결로 주제·게시일을 바꿀 수 없습니다. 사이트에서 사람이 확인해주세요.",
      );
    if (
      (c.images || []).length ||
      (c.scenes || []).length ||
      (u.productionRequests || []).some((p) => p.snapshot && p.snapshot.contentId === id)
    )
      throw Error("제작이 시작된 콘텐츠는 이 연결로 주제·게시일을 바꿀 수 없습니다.");
    let ch = [];
    if (t.date !== void 0 && t.date !== null) {
      if (typeof t.date != "string" || !Or.test(t.date) || isNaN(Date.parse(t.date)))
        throw Error("게시일을 YYYY-MM-DD로 입력해주세요.");
      if (t.date !== c.date) {
        ch.push("게시일 " + c.date + " → " + t.date);
        c.date = t.date;
      }
    }
    if (t.topic !== void 0 && t.topic !== null) {
      let s = String(t.topic).trim();
      if (!s || s.length > 200) throw Error("주제는 1~200자로 입력해주세요.");
      if (s !== c.topic) {
        ch.push("주제 변경 (이전: " + c.topic + ")");
        c.topic = s;
      }
    }
    if (!ch.length) throw Error("바뀐 내용이 없습니다.");
    u.contents.sort((i, a) => i.date.localeCompare(a.date) || i.id.localeCompare(a.id));
    u.state.events.push({ at: new Date().toISOString(), message: id + " · " + ch.join(", ") });
    return { content_id: id, date: c.date, topic: c.topic, changes: ch };
  });
}
var jt = (e) => String(e).padStart(6, "0"),
  Le = [
    "approvals",
    "approvalHolds",
    "approvalHistory",
    "finals",
    "finalVideos",
    "storyboards",
    "higgsfieldPrompts",
    "publications",
    "notes",
    "events",
  ],
  ne = [
    "contents",
    "script_versions",
    "approvals",
    "approval_holds",
    "approval_history",
    "finals",
    "final_videos",
    "storyboards",
    "higgsfield_prompts",
    "publications",
    "notes",
    "events",
    "production_requests",
    "revision_requests",
    "trash",
    "reports",
    "state_misc",
  ],
  Lt = (e) => (/(ISHARD[-\w]+)/.exec(e || "") || [])[1] || null;
function Me(e) {
  let t = Object.fromEntries(ne.map((n) => [n, new Map()])),
    u = (n, i, a, C, d, c) =>
      t[n].set(i, { content_id: a ?? null, ord: C, data: JSON.stringify(d), extra: c }),
    r = e.state || {};
  e.contents.forEach((n, i) => {
    let { reviews: a, ...C } = n;
    (u("contents", n.id, n.id, i, C, { date: n.date, format: n.format }),
      (a || []).forEach((d, c) => u("script_versions", n.id + "|" + d.version, n.id, c, d)));
  });
  let s = (n, i) => Object.entries(i || {}).forEach(([a, C], d) => u(n, a, a, d, C));
  (s("approvals", r.approvals),
    s("approval_holds", r.approvalHolds),
    s("finals", r.finals),
    s("final_videos", r.finalVideos));
  let o = (n, i, a) => (i || []).forEach((C, d) => u(n, jt(d), a(C), d, C));
  (o("approval_history", r.approvalHistory, (n) => n.contentId),
    o("publications", r.publications, (n) => n.contentId),
    o("notes", r.notes, (n) => n.id),
    o("events", r.events, (n) => Lt(n.message)),
    o("reports", e.reports, (n) => n.contentId || null));
  for (let [n, i] of Object.entries(r.storyboards || {}))
    for (let [a, C] of Object.entries(i)) u("storyboards", n + "|" + a, n, 0, C);
  for (let [n, i] of Object.entries(r.higgsfieldPrompts || {}))
    for (let [a, C] of Object.entries(i))
      for (let [d, c] of Object.entries(C)) u("higgsfield_prompts", n + "|" + a + "|" + d, n, 0, c);
  ((e.productionRequests || []).forEach((n, i) =>
    u("production_requests", n.id, n.snapshot?.contentId, i, n),
  ),
    (e.revisionRequests || []).forEach((n, i) => u("revision_requests", n.id, n.contentId, i, n)),
    (e.trash || []).forEach((n, i) => u("trash", n.key, n.content?.id, i, n)));
  for (let [n, i] of Object.entries(r)) Le.includes(n) || u("state_misc", n, null, 0, i);
  for (let n of Le)
    r[n] !== void 0 &&
      !["approvals", "finals", "notes", "events"].includes(n) &&
      u("state_misc", "__present:" + n, null, 0, Array.isArray(r[n]) ? [] : {});
  return t;
}
function Mt(e) {
  let t = (C) =>
      (e[C] || [])
        .slice()
        .sort((d, c) => (d.ord ?? 0) - (c.ord ?? 0) || String(d.pk).localeCompare(String(c.pk))),
    u = (C) => JSON.parse(C.data),
    r = new Map();
  for (let C of t("script_versions")) {
    let [d] = C.pk.split("|");
    (r.get(d) || r.set(d, []).get(d)).push(u(C));
  }
  let s = t("contents").map((C) => ({ ...u(C), reviews: r.get(C.pk) || [] })),
    o = { approvals: {}, notes: [], finals: {}, events: [] },
    n = new Set(
      t("state_misc")
        .filter((C) => C.pk.startsWith("__present:"))
        .map((C) => C.pk.slice(10)),
    ),
    i = (C, d) => {
      let c = t(d);
      if (c.length || n.has(C) || o[C]) {
        o[C] = o[C] || {};
        for (let p of c) o[C][p.pk] = u(p);
      }
    };
  (i("approvals", "approvals"),
    i("approvalHolds", "approval_holds"),
    i("finals", "finals"),
    i("finalVideos", "final_videos"));
  let a = (C, d) => {
    let c = t(d);
    (c.length || n.has(C) || o[C]) && (o[C] = c.map(u));
  };
  (a("approvalHistory", "approval_history"),
    a("publications", "publications"),
    a("notes", "notes"),
    a("events", "events"));
  for (let C of t("storyboards")) {
    let [d, c] = C.pk.split("|");
    ((o.storyboards ||= {})[d] ||= {})[c] = u(C);
  }
  n.has("storyboards") && (o.storyboards ||= {});
  for (let C of t("higgsfield_prompts")) {
    let [d, c, p] = C.pk.split("|");
    (((o.higgsfieldPrompts ||= {})[d] ||= {})[c] ||= {})[p] = u(C);
  }
  n.has("higgsfieldPrompts") && (o.higgsfieldPrompts ||= {});
  for (let C of t("state_misc")) C.pk.startsWith("__present:") || (o[C.pk] = u(C));
  return {
    contents: s,
    state: o,
    productionRequests: t("production_requests").map(u),
    revisionRequests: t("revision_requests").map(u),
    reports: t("reports").map(u),
    trash: t("trash").map(u),
  };
}
function Ht(e, t) {
  let u = [];
  for (let r of ne) {
    let s = e[r],
      o = t[r];
    for (let [n, i] of o) {
      let a = s.get(n);
      (!a || a.data !== i.data || a.ord !== i.ord || a.content_id !== i.content_id) &&
        u.push({ t: r, pk: n, row: i });
    }
    for (let n of s.keys()) o.has(n) || u.push({ t: r, pk: n, del: !0 });
  }
  return u;
}
async function I(e) {
  let t = await e.batch([
      e.prepare("SELECT value FROM meta WHERE key='rev'"),
      ...ne.map((s) => e.prepare(`SELECT pk, content_id, ord, data FROM ${s}`)),
    ]),
    u = t[0].results[0]?.value || "0:init",
    r = Object.fromEntries(ne.map((s, o) => [s, t[o + 1].results]));
  return { rev: u, revision: Number(u.split(":")[0]), workspace: Mt(r) };
}
async function He(e, t, u, r) {
  let s = Ht(Me(u), Me(r)),
    o = Number(t.split(":")[0]) + 1,
    n = o + ":" + crypto.randomUUID(),
    i = "EXISTS (SELECT 1 FROM meta WHERE key='rev' AND value=?)",
    a = [e.prepare("UPDATE meta SET value=? WHERE key='rev' AND value=?").bind(n, t)];
  for (let d of s) {
    if (d.del) {
      a.push(e.prepare(`DELETE FROM ${d.t} WHERE pk=? AND ${i}`).bind(d.pk, n));
      continue;
    }
    let c = d.row;
    d.t === "contents"
      ? a.push(
          e
            .prepare(
              `INSERT INTO contents(pk, content_id, ord, data, date, format) SELECT ?, ?, ?, ?, ?, ? WHERE ${i} ON CONFLICT(pk) DO UPDATE SET content_id=excluded.content_id, ord=excluded.ord, data=excluded.data, date=excluded.date, format=excluded.format`,
            )
            .bind(d.pk, c.content_id, c.ord, c.data, c.extra.date, c.extra.format, n),
        )
      : a.push(
          e
            .prepare(
              `INSERT INTO ${d.t}(pk, content_id, ord, data) SELECT ?, ?, ?, ? WHERE ${i} ON CONFLICT(pk) DO UPDATE SET content_id=excluded.content_id, ord=excluded.ord, data=excluded.data`,
            )
            .bind(d.pk, c.content_id, c.ord, c.data, n),
        );
  }
  return (await e.batch(a))[0].meta.changes
    ? { conflict: !1, rev: n, revision: o, changed: s.length }
    : { conflict: !0 };
}
var Pe = (e) =>
    Uint8Array.from(atob(e.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((e.length + 3) % 4)), (t) =>
      t.charCodeAt(0),
    ),
  Je = (e) => JSON.parse(new TextDecoder().decode(Pe(e))),
  Q = { at: 0, keys: [] };
async function Jt(e, t) {
  if (Date.now() - Q.at < 600 * 1e3 && Q.keys.length) return Q.keys;
  let u = await t(`https://${e.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!u.ok)
    throw Error("Access \uACF5\uAC1C\uD0A4\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  return ((Q = { at: Date.now(), keys: (await u.json()).keys || [] }), Q.keys);
}
async function Pt(e, t, u = fetch) {
  if (!e || !t.ACCESS_TEAM_DOMAIN || !t.ACCESS_AUD) return null;
  let r = e.split(".");
  if (r.length !== 3) return null;
  let s, o;
  try {
    ((s = Je(r[0])), (o = Je(r[1])));
  } catch {
    return null;
  }
  if (s.alg !== "RS256") return null;
  let n = (await Jt(t, u)).find((c) => c.kid === s.kid);
  if (!n) return null;
  let i = await crypto.subtle.importKey("jwk", n, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, !1, [
    "verify",
  ]);
  if (
    !(await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      i,
      Pe(r[2]),
      new TextEncoder().encode(r[0] + "." + r[1]),
    ))
  )
    return null;
  let C = Math.floor(Date.now() / 1e3);
  return !(Array.isArray(o.aud) ? o.aud : [o.aud]).includes(t.ACCESS_AUD) ||
    !(o.exp > C) ||
    (o.nbf && o.nbf > C + 60) ||
    o.iss !== `https://${t.ACCESS_TEAM_DOMAIN}`
    ? null
    : typeof o.email == "string" && o.email.includes("@")
      ? o.email.toLowerCase()
      : null;
}
async function Z(e, t, u) {
  let r = new URL(e.url).hostname;
  if (t.DEV_MODE === "true" && (r === "localhost" || r === "127.0.0.1")) {
    let s = (e.headers.get("x-dev-user") || t.DEV_USER_EMAIL || "").toLowerCase();
    return s.includes("@") ? s : null;
  }
  return Pt(e.headers.get("Cf-Access-Jwt-Assertion"), t, u);
}
async function ee(e, t, u) {
  return u
    ? t.OWNER_EMAIL && u === t.OWNER_EMAIL.toLowerCase()
      ? "owner"
      : (await e.prepare("SELECT role FROM members WHERE email=?").bind(u).first())?.role || null
    : null;
}
var zt = Object.freeze({
    failure: "\uC2E4\uD328 \uD68C\uD53C\uD615",
    statusquo: "\uD604\uC7AC \uC81C\uD488 \uC720\uC9C0\uD615",
    tradeoff: "\uC870\uAC74 \uCDA9\uB3CC\uD615",
    burden: "\uAD00\uB9AC \uBD80\uB2F4\uD615",
    proof: "\uADFC\uAC70 \uD655\uC778\uD615",
    confusion: "\uC815\uBCF4 \uD63C\uB780\uD615",
  }),
  ze = Object.freeze(["empathy", "barrier", "reframe", "product_evidence", "decision"]),
  Gt = Object.freeze(["psychology", "fit", "evidence", "flow", "novelty"]),
  Kt = 2e4,
  h = (e, t = 1200) => (typeof e == "string" ? e.trim().slice(0, t) : ""),
  R = (e) => e !== null && typeof e == "object" && !Array.isArray(e),
  Wt = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
function Ge(e) {
  if (!R(e) || JSON.stringify(e).length > Kt)
    throw Error(
      "\uAE30\uD68D JSON \uAC1D\uCCB4 \uB610\uB294 20KB \uC774\uD558 \uC6A9\uB7C9\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  let t = e.core || {},
    u = e.persona || {},
    r = e.fit || {},
    s = e.quality || {};
  if (!R(t) || !R(u) || !R(r) || !R(s))
    throw Error("\uAE30\uD68D \uD56D\uBAA9\uC740 \uAC1D\uCCB4\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
  let o = h(u.type, 32);
  if (!Wt(zt, o))
    throw Error(
      "6\uAC00\uC9C0 \uAD6C\uB9E4\uC2EC\uB9AC \uC720\uD615 \uC911 \uD558\uB098\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
    );
  let n = Array.isArray(e.flow) ? e.flow : [];
  if (n.length > 5 || n.some((f, l) => !R(f) || ze[l] !== f.stage))
    throw Error(
      "\uCF58\uD150\uCE20 \uC804\uAC1C\uB294 \uC815\uD574\uC9C4 \uC21C\uC11C\uC758 5\uB2E8\uACC4\uB97C \uC0AC\uC6A9\uD574\uC8FC\uC138\uC694.",
    );
  let i = {},
    a = R(s.scores) ? s.scores : {};
  for (let f of Gt) {
    let l = a[f] ?? 0;
    if (!Number.isInteger(l) || l < 0 || l > 20)
      throw Error(
        "\uAE30\uD68D \uD3C9\uAC00\uB294 \uD56D\uBAA9\uBCC4 0~20\uC810\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4.",
      );
    i[f] = l;
  }
  let C = h(r.verification, 32) || "pending";
  if (!["pending", "verified", "insufficient"].includes(C))
    throw Error(
      "\uC81C\uD488 \uAC80\uC99D \uC0C1\uD0DC\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    );
  let d = h(s.claimReview, 20) || "pending",
    c = h(s.duplicateReview, 20) || "pending";
  if (!["pending", "pass", "fail"].includes(d) || !["pending", "pass", "fail"].includes(c))
    throw Error("\uAC80\uC218 \uC0C1\uD0DC\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  let p = h(u.evidenceStatus, 32) || "hypothesis";
  if (!["hypothesis", "customer_data"].includes(p))
    throw Error("\uACE0\uAC1D \uADFC\uAC70 \uAD6C\uBD84\uC774 \uC798\uBABB\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  return {
    version: 2,
    core: {
      objective: h(t.objective),
      purchaseQuestion: h(t.purchaseQuestion),
      barrier: h(t.barrier),
      answer: h(t.answer),
      cta: h(t.cta),
    },
    persona: {
      type: o,
      trigger: h(u.trigger),
      desired: h(u.desired),
      preserve: h(u.preserve),
      currentAlternative: h(u.currentAlternative),
      objection: h(u.objection),
      evidenceStatus: p,
    },
    fit: {
      customerCondition: h(r.customerCondition),
      productFeature: h(r.productFeature),
      selectionReason: h(r.selectionReason),
      verification: C,
      claimLimit: h(r.claimLimit),
      sourceIds: Array.isArray(r.sourceIds)
        ? r.sourceIds
            .filter((f) => typeof f == "string")
            .slice(0, 12)
            .map((f) => h(f, 250))
        : [],
    },
    flow: ze.map((f, l) => ({ stage: f, text: h(n[l]?.text) })),
    quality: { scores: i, claimReview: d, duplicateReview: c, humanConfirmed: s.humanConfirmed === !0 },
  };
}
function me(e, t = []) {
  if (!e)
    return {
      ready: !1,
      reasons: ["\uC0C8 \uAD6C\uB9E4\uC2EC\uB9AC \uAE30\uD68D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."],
    };
  let u = Ge(e),
    r = [];
  ((!u.core.purchaseQuestion || !u.core.barrier || !u.core.answer) &&
    r.push(
      "\uD575\uC2EC \uAD6C\uB9E4 \uC9C8\uBB38\xB7\uC7A5\uBCBD\xB7\uB2F5\uBCC0\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    ),
    (!u.persona.objection || !u.persona.desired) &&
      r.push(
        "\uACE0\uAC1D\uC758 \uC6D0\uD558\uB294 \uC870\uAC74\uACFC \uAD6C\uB9E4 \uBC18\uB860\uC744 \uC791\uC131\uD574\uC8FC\uC138\uC694.",
      ),
    (!u.fit.productFeature || !u.fit.selectionReason) &&
      r.push(
        "\uC544\uC774\uC0E4\uB4DC \uC81C\uD488 \uD2B9\uC9D5\uACFC \uC120\uD0DD \uC774\uC720\uB97C \uC791\uC131\uD574\uC8FC\uC138\uC694.",
      ),
    u.fit.verification !== "verified" &&
      r.push(
        "\uC81C\uD488\uACFC \uACE0\uAC1D\uC758 \uC5F0\uACB0 \uADFC\uAC70\uB97C \uAC80\uC99D\uD574\uC8FC\uC138\uC694.",
      ),
    (Array.isArray(t) ? t.filter((i) => R(i) && h(i.fact) && h(i.source)) : []).some(
      (i) => u.fit.sourceIds.includes(h(i.source, 250)) || u.fit.sourceIds.includes(h(i.id, 250)),
    ) ||
      r.push(
        "\uAE30\uC874 \uACF5\uC2DD \uC81C\uD488 \uC0AC\uC2E4\xB7\uCD9C\uCC98\uC640 \uC77C\uCE58\uD558\uB294 sourceIds\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
      ),
    u.flow.some((i) => !i.text) &&
      r.push("5\uB2E8\uACC4 \uC804\uAC1C\uB97C \uBAA8\uB450 \uC791\uC131\uD574\uC8FC\uC138\uC694."),
    (u.quality.claimReview !== "pass" || u.quality.duplicateReview !== "pass") &&
      r.push(
        "\uD45C\uD604 \uAC80\uC218\uC640 \uC911\uBCF5 \uAC80\uC218\uB97C \uC644\uB8CC\uD574\uC8FC\uC138\uC694.",
      ),
    u.quality.humanConfirmed !== !0 &&
      r.push(
        "\uAC80\uC99D\uB41C \uADFC\uAC70\uC640 \uD45C\uD604\uC744 \uC0AC\uC6A9\uC790 \uBCF8\uC778\uC774 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
      ));
  let n = Object.values(u.quality.scores).reduce((i, a) => i + a, 0);
  return (
    n < 80 &&
      r.push(
        "\uAE30\uD68D \uD488\uC9C8 \uD3C9\uAC00 80\uC810 \uC774\uC0C1\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
      ),
    { ready: r.length === 0, score: n, reasons: r }
  );
}
function ve(e, { content_id: t, strategy: u }) {
  let r = e.contents.find((n) => n.id === t);
  if (!r) throw Error("\uC218\uC815\uD560 \uAE30\uD68D\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  let s = Ge(u),
    o = R(r.plan) ? r.plan : {};
  return (
    (r.plan = { ...o, strategyV2: s }),
    { content_id: r.id, planning_readiness: me(s, r.plan.productFacts) }
  );
}
function te(e) {
  if (!Array.isArray(e) || e.length < 1 || e.length > 20)
    throw Error(
      "storyboard: \uC7A5\uBA74\uC744 1~20\uAC1C \uBC30\uC5F4\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  let t = 0,
    u = e.map((r, s) => {
      let o = "storyboard[" + s + "]";
      if (!r || typeof r != "object" || Array.isArray(r))
        throw Error(o + ": \uC7A5\uBA74 \uAC1D\uCCB4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
      let n = Object.keys(r).filter((i) => !["scene_id", "duration_seconds", "image", "motion"].includes(i));
      if (n.length) throw Error(o + ": \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD56D\uBAA9 " + n.join(", "));
      if (r.scene_id !== "scene-" + (s + 1))
        throw Error(
          o +
            ".scene_id: \uC7A5\uBA74 \uC21C\uC11C\uB300\uB85C scene-" +
            (s + 1) +
            "\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
        );
      if (
        typeof r.duration_seconds != "number" ||
        !Number.isFinite(r.duration_seconds) ||
        r.duration_seconds < 0.1 ||
        r.duration_seconds > 60
      )
        throw Error(
          o + ".duration_seconds: 0.1~60\uCD08\uC758 \uC22B\uC790\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.",
        );
      for (let i of ["image", "motion"])
        if (typeof r[i] != "string" || !r[i].trim() || r[i].length > 2e3)
          throw Error(
            o + "." + i + ": 1~2,000\uC790\uC758 \uC124\uBA85\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
          );
      return (
        (t += r.duration_seconds),
        { scene_id: r.scene_id, duration_seconds: r.duration_seconds, image: r.image, motion: r.motion }
      );
    });
  if (t > 60 + 1e-9)
    throw Error(
      "storyboard: \uC7A5\uBA74 \uC2DC\uAC04\uC758 \uD569\uACC4\uB294 60\uCD08 \uC774\uB0B4\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  return u;
}
function ge(e) {
  return e.map(
    (t, u) =>
      "\uC7A5\uBA74 " +
      (u + 1) +
      " \xB7 " +
      t.scene_id +
      " \xB7 " +
      t.duration_seconds +
      `\uCD08
\uC774\uBBF8\uC9C0: ` +
      t.image +
      `
\uC601\uC0C1 \uC6C0\uC9C1\uC784: ` +
      t.motion,
  ).join(`

`);
}
function Yt(e, t = "") {
  if (!e || typeof e != "object" || Array.isArray(e))
    throw Error(
      "JSON \uD55C \uAC1C\uC758 \uAC1D\uCCB4\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694. A/B/C \uC911 \uD55C \uC548\uC529 \uAC00\uC838\uC62C \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    );
  let u = Object.keys(e).filter((s) => !["content_id", "script", "caption", "storyboard"].includes(s));
  if (u.length)
    throw Error(
      "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD56D\uBAA9: " +
        u.join(", ") +
        ". content_id, script, caption\uB9CC \uC0AC\uC6A9\uD574\uC8FC\uC138\uC694. \uACFC\uAC70 storyboard \uD0A4\uB294 \uAC00\uC838\uC624\uAE30\uB97C \uC9C0\uC6D0\uD569\uB2C8\uB2E4.",
    );
  if (e.content_id !== void 0 && (typeof e.content_id != "string" || !e.content_id.trim()))
    throw Error(
      "content_id: \uCF58\uD150\uCE20 ID\uB97C \uBB38\uC790\uC5F4\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  if (t && e.content_id !== void 0 && e.content_id !== t)
    throw Error(
      "content_id \uBD88\uC77C\uCE58: \uD604\uC7AC \uCF58\uD150\uCE20\uB294 " +
        t +
        "\uC785\uB2C8\uB2E4. \uB2E4\uB978 \uCF58\uD150\uCE20\uC758 JSON\uC740 \uC785\uB825\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    );
  if (typeof e.script != "string" || !e.script.trim() || e.script.length > 2e4)
    throw Error(
      "script: \uB300\uBCF8\uC744 1~20,000\uC790\uC758 \uBB38\uC790\uC5F4\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  if (typeof e.caption != "string" || e.caption.length > 8e3)
    throw Error(
      'caption: 8,000\uC790 \uC774\uB0B4\uC758 \uBB38\uC790\uC5F4\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. \uCEA1\uC158\uC774 \uC5C6\uC73C\uBA74 ""\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.',
    );
  let r = e.storyboard === void 0 ? null : te(e.storyboard);
  if (r && ge(r).length > 2e4)
    throw Error(
      "storyboard: \uC7A5\uBA74 \uC124\uBA85 \uC804\uCCB4\uB294 20,000\uC790 \uC774\uB0B4\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  return {
    content_id: t || e.content_id || "",
    script: e.script,
    caption: e.caption,
    ...(r ? { storyboard: r } : {}),
  };
}
function De(e, t = "") {
  if (typeof e != "string" || !e.trim())
    throw Error("JSON \uCF54\uB4DC\uB97C \uBA3C\uC800 \uBD99\uC5EC\uB123\uC5B4\uC8FC\uC138\uC694.");
  if (e.length > 12e4)
    throw Error(
      "JSON \uCF54\uB4DC\uB294 120,000\uC790 \uC774\uB0B4\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  let u = e.trim();
  if (u.startsWith("```")) {
    let s = /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/i.exec(
      u.replace(
        /\r\n/g,
        `
`,
      ),
    );
    if (!s)
      throw Error(
        "JSON \uCF54\uB4DC\uBE14\uB85D \uD55C \uAC1C\uB9CC \uBD99\uC5EC\uB123\uC5B4\uC8FC\uC138\uC694. A/B/C\uB97C \uD55C\uAEBC\uBC88\uC5D0 \uAC00\uC838\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
      );
    u = s[1];
  }
  let r;
  try {
    r = JSON.parse(u);
  } catch (s) {
    throw Error(
      "JSON \uD615\uC2DD \uC624\uB958: " +
        s.message +
        " \u2014 \uD070\uB530\uC634\uD45C\xB7\uC27C\uD45C\xB7\uAD04\uD638\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  }
  return Yt(r, t);
}
function he(e) {
  let t = 0;
  return e.map((u) => {
    let r = t;
    t += u.duration_seconds;
    let s = (o) => String(Number(o.toPrecision(12)));
    return {
      timing: s(r) + "s-" + s(t) + "s",
      visual: u.image,
      motion: u.motion,
      sourceSceneId: u.scene_id,
      subtitle: "",
      prompt: "",
      reference: "",
    };
  });
}
function Ke(e, t) {
  return !!e?.approvalHolds?.[t];
}
function We(e, t, u = new Date().toISOString()) {
  let r = (e.contents || []).find((n) => n.id === t.content_id);
  if (!r) throw Error("\uCF58\uD150\uCE20\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  if (e.state.approvalHolds?.[r.id])
    throw Error("\uC774\uBBF8 \uD655\uC815\uC774 \uD574\uC81C\uB41C \uC6D0\uACE0\uC785\uB2C8\uB2E4.");
  let s = e.state.approvals?.[r.id],
    o =
      s &&
      r.reviews.some(
        (n) => n.version === s.version && JSON.stringify(n.sections) === JSON.stringify(s.sections),
      )
        ? s
        : r.reviews.find((n) => n.version === r.originalVersion && n.sourceApproved);
  if (!o) throw Error("\uD574\uC81C\uD560 \uD655\uC815 \uC6D0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (typeof t.version != "string" || o.version !== t.version)
    throw Error(
      "\uD655\uC815 \uC6D0\uACE0\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC0C8\uB85C\uACE0\uCE68 \uD6C4 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  return (
    (e.state.approvalHolds ||= {}),
    (e.state.approvalHolds[r.id] = { version: o.version, at: u }),
    s &&
      ((e.state.approvalHistory ||= []),
      e.state.approvalHistory.push({ contentId: r.id, ...structuredClone(s) })),
    delete e.state.approvals[r.id],
    e.state.events.push({
      at: u,
      message:
        r.product +
        " \xB7 " +
        o.version +
        " \uC6D0\uACE0 \uD655\uC815 \uD574\uC81C (\uC6D0\uACE0\xB7\uC81C\uC791\uBB3C \uC720\uC9C0)",
    }),
    { content_id: r.id, version: o.version, released: !0 }
  );
}
function Ae(e, t) {
  e.approvalHolds && delete e.approvalHolds[t];
}
function Ee(e, t, u = new Date().toISOString()) {
  let r = (e.contents || []).find((f) => f.id === t.content_id);
  if (!r) throw Error("\uCF58\uD150\uCE20\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  let s = t.script,
    o = t.caption ?? "",
    n = t.storyboard_scenes === void 0 ? null : te(t.storyboard_scenes);
  if (n && r.format !== "Reel")
    throw Error(
      "\uC7A5\uBA74 JSON\uC740 \uB9B4\uC2A4\uC5D0\uC11C\uB9CC \uC785\uB825\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    );
  let i = n ? ge(n) : "",
    a = t.storyboard_text ?? i;
  if (typeof s != "string" || !s.trim() || s.length > 2e4)
    throw Error("\uB300\uBCF8\uC740 1~20,000\uC790\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
  if (typeof o != "string" || o.length > 8e3)
    throw Error("\uCEA1\uC158\uC740 8,000\uC790 \uC774\uB0B4\uB85C \uC791\uC131\uD574\uC8FC\uC138\uC694.");
  if (typeof a != "string" || a.length > 2e4)
    throw Error(
      "\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\uAE00\uC740 20,000\uC790 \uC774\uB0B4\uB85C \uC791\uC131\uD574\uC8FC\uC138\uC694.",
    );
  if (n && a !== i)
    throw Error(
      "\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\uAE00\uACFC \uC7A5\uBA74 JSON\uC774 \uB2E4\uB985\uB2C8\uB2E4. JSON\uC744 \uB2E4\uC2DC \uBD84\uB9AC\uD558\uAC70\uB098 \uC9C1\uC811 \uC785\uB825\uD55C \uAE00\uB85C \uC800\uC7A5\uD574\uC8FC\uC138\uC694.",
    );
  let C = "USER-" + u.replace(/[^0-9]/g, "").slice(0, 14),
    d = C,
    c = 2;
  for (; r.reviews.some((f) => f.version === d);) d = C + "-" + c++;
  let p =
    r.format === "Carousel"
      ? s
          .split(/\n\s*\n/)
          .filter((f) => f.trim())
          .map((f, l) => ({
            number: l + 1,
            heading: l === 0 ? "\uD45C\uC9C0" : "\uC2AC\uB77C\uC774\uB4DC " + (l + 1),
            text: f,
          }))
      : [];
  if (p.length > 30)
    throw Error(
      "\uCE90\uB7EC\uC140\uC740 \uCD5C\uB300 30\uC7A5\uAE4C\uC9C0 \uC785\uB825\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    );
  let m = [{ heading: "\uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 \uC791\uC131\uD55C \uB300\uBCF8", text: s }];
  return (
    r.reviews.push({
      version: d,
      sections: m,
      slides: p,
      caption: o,
      ...(r.format === "Reel" && a ? { storyboardText: a } : {}),
      ...(n ? { storyboardScenes: n } : {}),
      sourceApproved: !1,
      author: "user",
      createdAt: u,
    }),
    e.state.events.push({
      at: u,
      message:
        r.product +
        " \xB7 \uC9C1\uC811 \uC791\uC131\uD55C \uB300\uBCF8 " +
        d +
        " \uC800\uC7A5 (\uC2B9\uC778 \uB300\uAE30)",
    }),
    { content_id: r.id, version: d, format: r.format }
  );
}
var re = (e, t) => JSON.stringify(e) === JSON.stringify(t);
function y(e, t) {
  if (e.state?.approvalHolds?.[t.id]) return null;
  let u = e.state.approvals[t.id];
  if (u) return t.reviews.some((s) => s.version === u.version && re(s.sections, u.sections)) ? u : null;
  let r = t.reviews.find((s) => s.version === t.originalVersion && s.sourceApproved);
  return r ? { version: r.version, sections: r.sections, source: "legacy" } : null;
}
function O(e, t) {
  let u = e.filter(
      (C) =>
        C.snapshot?.contentId === t.snapshot.contentId &&
        C.snapshot.version === t.snapshot.version &&
        !C.cancelledAt &&
        !["cancelled", "changed"].includes(C.status),
    ),
    r =
      u
        .filter((C) => !C.parentId)
        .sort((C, d) => d.slots.length - C.slots.length || d.createdAt.localeCompare(C.createdAt))[0] || t,
    s = [
      r,
      ...u
        .filter((C) => C.id !== r.id)
        .sort((C, d) => C.createdAt.localeCompare(d.createdAt) || C.id.localeCompare(d.id)),
    ],
    n = [...new Set(s.flatMap((C) => C.slots.map((d) => d.id)))].map((C) => {
      let d = s.flatMap((B) => B.slots).find((B) => B.id === C),
        c = [];
      for (let B of s) {
        let D = B.slots.find((S) => S.id === C && S.asset?.driveUrl);
        D && (c.some((S) => S.slot.asset.driveUrl === D.asset.driveUrl) || c.push({ request: B, slot: D }));
      }
      c.sort(
        (B, D) =>
          (B.request.id === r.id ? -1 : D.request.id === r.id ? 1 : 0) ||
          (B.slot.asset.savedAt || B.request.createdAt).localeCompare(
            D.slot.asset.savedAt || D.request.createdAt,
          ) ||
          B.request.createdAt.localeCompare(D.request.createdAt),
      );
      let p = s.filter((B) => B.slots.some((D) => D.id === C)),
        m = JSON.stringify(
          p
            .map((B) => {
              let D = B.slots.find((S) => S.id === C);
              return [B.id, D.asset?.previewKey || "", D.asset?.driveUrl || ""];
            })
            .sort((B, D) => B[0].localeCompare(D[0])),
        ),
        f = r.imageSelections?.[C] || r.selectedImages?.[C],
        l =
          f &&
          c.find(
            (B) =>
              B.request.id === f.requestId && (!f.previewKey || B.slot.asset.previewKey === f.previewKey),
          ),
        E = p
          .flatMap((B) => {
            let D = B.slots.find((S) => S.id === C);
            return B.parentId ? [D.asset?.savedAt || B.createdAt] : [];
          })
          .filter(Boolean)
          .sort()
          .at(-1),
        x =
          l &&
          (f.candidateSignature
            ? f.candidateSignature === m
            : f.seenRevisionIds
              ? re(
                  f.seenRevisionIds,
                  p
                    .filter((B) => B.parentId)
                    .map((B) => B.id)
                    .sort(),
                )
              : !E || (!!f.selectedAt && f.selectedAt >= E)),
        _ = f ? (x ? l : null) : c.length === 1 && !p.some((B) => B.parentId) ? c[0] : null,
        X = _ || c[c.length - 1] || { request: r, slot: d };
      return {
        id: C,
        original: d,
        candidates: c,
        selected: _,
        display: X,
        candidateSignature: m,
        pending: p.some((B) => !B.slots.find((D) => D.id === C)?.asset),
      };
    }),
    i = u.find((C) => !C.slots.length || C.slots.some((d) => !d.asset)),
    a = n.some((C) => !C.selected);
  return {
    root: r,
    family: u,
    slots: n,
    pending: i,
    needsSelection: a,
    ready: n.length > 0 && !i && !a && !!r.reviewedAt,
  };
}
function T(e, t, u) {
  let r = (e.productionRequests || []).filter(
      (d) =>
        d.snapshot?.contentId === t.id &&
        d.snapshot.version === u.version &&
        !["cancelled", "changed"].includes(d.status) &&
        !d.cancelledAt,
    ),
    s = r.find((d) => !d.parentId);
  if (s) {
    let d = O(r, s);
    return {
      ...d,
      unchecked: d.needsSelection || !d.root.reviewedAt ? d.root : null,
      urls: d.slots.map((c) => c.selected?.slot.asset.driveUrl).filter(Boolean),
    };
  }
  let o = e.state.finals[t.id],
    n = t.images || [],
    i = !!(
      n.length &&
      t.originalVersion === u.version &&
      o?.version === u.version &&
      re(
        o.files,
        n.map((d) => d.id),
      ) &&
      n.every((d) => d.url)
    ),
    a = e.state.finalVideos?.[t.id],
    C =
      (e.dashboardSummary && t.legacyVideoUrl) ||
      (a?.version === u.version && re(a.sections, u.sections) ? a.driveUrl : null);
  return {
    root: null,
    family: [],
    pending: null,
    unchecked: null,
    urls: n.map((d) => d.url).filter(Boolean),
    ready: i,
    legacyImages: n.length,
    legacyConfirmed: i,
    finalVideoUrl: C,
  };
}
var ye = (e) => JSON.stringify([...e.urls, e.root?.finalVideoUrl || e.finalVideoUrl || ""]);
function J(e, t, u, r) {
  return e.dashboardSummary && t.publicationUrl
    ? { url: t.publicationUrl }
    : (e.state.publications || []).findLast(
        (s) =>
          s.contentId === t.id &&
          s.version === u.version &&
          re(s.sections, u.sections) &&
          s.mediaSignature === ye(r),
      ) || null;
}
var ie = (e, t, u, r) =>
  r.ready &&
  (t.format !== "Reel" ||
    !!(r.root
      ? r.root.finalVideoUrl &&
        r.root.finalVideoAt &&
        r.family.every((s) => s.id === r.root.id || s.createdAt <= r.root.finalVideoAt)
      : r.finalVideoUrl));
var Ye = (e, t) => JSON.stringify(e) === JSON.stringify(t),
  we = (e, t) =>
    structuredClone({
      contentId: e.id,
      version: t.version,
      product: e.product,
      date: e.date,
      format: e.format,
      sections: t.sections,
      slides: t.slides,
      caption: t.caption,
    }),
  be = (e, t = 4e3) => typeof e == "string" && e.trim().length > 0 && e.length <= t;
function xe(e, t) {
  if (t.withdrawnAt || t.kind !== "script" || !t.responseVersion) return null;
  let u = e.contents.find((i) => i.id === t.contentId),
    r = e.state?.approvals?.[t.contentId],
    s = u?.reviews.find((i) => i.version === r?.version);
  if (r?.source !== "site" || !s || !Ye(r.sections, s.sections)) return null;
  let o = [t.responseVersion],
    n = new Set([t.version]);
  for (let i = 0; i < o.length; i++) {
    let a = o[i];
    if (n.has(a)) continue;
    n.add(a);
    let C = u.reviews.find((d) => d.version === a);
    if (C) {
      if (a === r.version) return a;
      for (let d of e.revisionRequests || [])
        d.id !== t.id &&
          d.contentId === t.contentId &&
          d.kind === "script" &&
          !d.withdrawnAt &&
          d.version === a &&
          d.responseVersion &&
          d.snapshot &&
          Ye(d.snapshot, we(u, C)) &&
          o.push(d.responseVersion);
    }
  }
  return null;
}
function k(e, t) {
  return t.withdrawnAt
    ? "withdrawn"
    : t.responseVersion
      ? xe(e, t)
        ? "approved"
        : "review"
      : t.status === "processing" && Date.now() - Date.parse(t.startedAt) > 36e5
        ? "blocked"
        : t.status || "received";
}
function P(e) {
  e.revisionRequests ||= [];
  for (let [t, u] of (e.state?.notes || []).entries()) {
    let r = u.requestId || `REV-${u.id}-${Date.parse(u.at)}-${t + 1}`;
    if (e.revisionRequests.some((c) => c.id === r)) continue;
    let s = e.contents.find((c) => c.id === u.id);
    if (!s) continue;
    let o = u.version || u.target.split(" \xB7 ")[0],
      n = s.reviews.find((c) => c.version === o),
      i = u.kind || (/이미지|프롬프트/.test(u.target) ? "image" : "script"),
      a = {
        id: r,
        contentId: s.id,
        version: o,
        kind: i,
        target: u.target,
        text: u.text,
        createdAt: u.at,
        status: n && i === "script" ? "received" : "blocked",
        issue:
          n && i === "script"
            ? ""
            : "\uC774\uBBF8\uC9C0\xB7\uD504\uB86C\uD504\uD2B8 \uC218\uC815 \uB610\uB294 \uC6D0\uBB38 \uC5F0\uACB0 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
        snapshot: n ? we(s, n) : null,
        events: [{ at: u.at, message: "\uC218\uC815 \uC694\uCCAD \uC811\uC218" }],
      },
      C =
        s.id === "ISHARD-23-20261012-R01" &&
        o === "V4-A" &&
        u.at === "2026-10-15T11:30:56.866Z" &&
        u.text === "30\uCD08 \uC774\uB0B4\uC758 \uB300\uBCF8\uC73C\uB85C \uC904\uC5EC\uC92D",
      d = (e.reports || []).find((c) => c.id === "REVISION-ISHARD-23-20261012-R01-V4-A-30s-r1");
    (C &&
      d &&
      s.reviews.some((c) => c.version === "V4-A-30s-r1") &&
      ((a.responseVersion = "V4-A-30s-r1"),
      (a.changeSummary =
        "30\uCD08 \uC774\uB0B4 \uC694\uCCAD\uC5D0 \uB300\uD55C \uAE30\uC874 \uC218\uC815\uBCF8\uC744 \uC5F0\uACB0\uD588\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C \uB0AD\uB3C5 \uC2DC\uAC04\uC740 \uBBF8\uCE21\uC815\uC774\uBA70 \uC0AC\uC6A9\uC790 \uC2B9\uC778\uC744 \uAE30\uB2E4\uB9BD\uB2C8\uB2E4."),
      (a.completedAt = d.at),
      (a.status = "review"),
      a.events.push({
        at: d.at,
        message: "\uAE30\uC874 \uC218\uC815\uBCF8 \uC5F0\uACB0 \xB7 \uC2B9\uC778 \uB300\uAE30",
      })),
      e.revisionRequests.push(a));
  }
  return e;
}
function ae(e, t) {
  return (
    P(e),
    e.revisionRequests.find(
      (u) => u.contentId === t && u.kind === "script" && !["approved", "withdrawn"].includes(k(e, u)),
    )
  );
}
function _e(e, t) {
  P(e);
  let u = e.revisionRequests.find((r) => r.id === t);
  if (!u) throw Error("\uC218\uC815 \uC694\uCCAD\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  return u;
}
function Xe(e, t, u = new Date().toISOString()) {
  P(e);
  let r = e.contents.find((d) => d.id === t.content_id),
    s = r?.reviews.find((d) => d.version === t.version);
  if (!s || !be(t.text))
    throw Error(
      "\uC218\uC815\uD560 \uC6D0\uACE0 \uBC84\uC804\uACFC \uC694\uCCAD \uB0B4\uC6A9\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  let o = t.kind || "script";
  if (!["script", "image"].includes(o))
    throw Error("\uC798\uBABB\uB41C \uC218\uC815 \uC885\uB958\uC785\uB2C8\uB2E4.");
  let n = e.revisionRequests.find(
    (d) =>
      d.contentId === r.id &&
      d.version === s.version &&
      d.kind === o &&
      d.text === t.text.trim() &&
      !["approved", "withdrawn"].includes(k(e, d)),
  );
  if (n) return { request: n, reused: !0 };
  let i = "REV-" + u.slice(0, 10).replaceAll("-", "") + "-" + crypto.randomUUID().slice(0, 8),
    a = t.target || s.version + " \xB7 \uC6D0\uACE0";
  if (!be(a, 200)) throw Error("\uC218\uC815 \uB300\uC0C1\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
  let C = {
    id: i,
    contentId: r.id,
    version: s.version,
    kind: o,
    target: a,
    text: t.text.trim(),
    snapshot: we(r, s),
    createdAt: u,
    status: o === "script" ? "received" : "blocked",
    issue:
      o === "script"
        ? ""
        : "\uAE30\uC874 \uC774\uBBF8\uC9C0 \uC218\uC815 \uC694\uCCAD\uC785\uB2C8\uB2E4. \uB300\uC0C1 \uC774\uBBF8\uC9C0\uC640 \uC81C\uC791 \uACBD\uB85C\uB97C \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4.",
    events: [{ at: u, message: "\uC218\uC815 \uC694\uCCAD \uC811\uC218" }],
  };
  return (
    e.revisionRequests.push(C),
    e.state.notes.push({
      id: r.id,
      requestId: i,
      version: s.version,
      kind: o,
      target: a,
      text: C.text,
      at: u,
    }),
    { request: C, reused: !1 }
  );
}
function Qe(e, t) {
  let u = _e(e, t);
  if (["review", "approved"].includes(k(e, u))) return { request: u, reused: !0 };
  if (k(e, u) !== "received" || u.kind !== "script")
    throw Error(
      "\uC811\uC218 \uC0C1\uD0DC\uC758 \uC6D0\uACE0 \uC694\uCCAD\uB9CC \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC911\uB2E8\uB41C \uC791\uC5C5\uC740 \uACB0\uACFC\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  return (
    (u.status = "processing"),
    (u.claim = crypto.randomUUID()),
    (u.startedAt = new Date().toISOString()),
    u.events.push({ at: u.startedAt, message: "\uC6D0\uACE0 \uC218\uC815 \uC2DC\uC791" }),
    { request: u, reused: !1 }
  );
}
function Ze(e, t) {
  let u = _e(e, t.request_id);
  if (u.responseVersion) {
    if (u.responseVersion === t.response_version && u.changeSummary === t.change_summary) return u;
    throw Error(
      "\uC5F0\uACB0\uB41C \uC218\uC815\uBCF8\uC740 \uB36E\uC5B4\uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    );
  }
  if (!u.claim || u.claim !== t.claim || u.withdrawnAt)
    throw Error(
      "\uC774 \uC694\uCCAD\uC758 \uCC98\uB9AC \uC2DC\uC791 \uAE30\uB85D\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  let r = e.contents.find((o) => o.id === u.contentId),
    s = r?.reviews.find((o) => o.version === t.response_version);
  if (!s || s.version === u.version || !be(t.change_summary))
    throw Error(
      "\uBCC4\uB3C4\uB85C \uC800\uC7A5\uD55C \uC0C8 \uC6D0\uACE0 \uBC84\uC804\uACFC \uBCC0\uACBD \uC694\uC57D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    );
  return (
    (u.responseVersion = s.version),
    (u.changeSummary = t.change_summary),
    (u.completedAt = new Date().toISOString()),
    (u.status = "review"),
    (u.issue = ""),
    u.events.push({
      at: u.completedAt,
      message: "\uC218\uC815\uBCF8 \uC5F0\uACB0 \xB7 \uC0AC\uC6A9\uC790 \uAC80\uD1A0 \uB300\uAE30",
    }),
    u
  );
}
function et(e, t) {
  let u = _e(e, t);
  return (
    (u.withdrawnAt = new Date().toISOString()),
    u.events.push({ at: u.withdrawnAt, message: "\uC0AC\uC6A9\uC790\uAC00 \uC694\uCCAD \uCCA0\uD68C" }),
    u
  );
}
var Xt = (e, t) => JSON.stringify(e) === JSON.stringify(t);
function Se(e, t, u) {
  let r = e.contents.find((a) => a.id === t);
  if (!r) throw new Error("CONTENT_NOT_FOUND");
  let s = r.reviews.find((a) => a.version === u);
  if (!s) throw new Error("DRAFT_NOT_FOUND");
  if (Ke(e.state, t)) throw new Error("APPROVAL_REQUIRED");
  let o = e.state.approvals[t];
  if (
    (o && r.reviews.some((a) => a.version === o.version && Xt(a.sections, o.sections))
      ? o.version
      : r.reviews.find((a) => a.version === r.originalVersion && a.sourceApproved)?.version) !== u
  )
    throw new Error("APPROVAL_REQUIRED");
  return { content: r, draft: s };
}
var Fe =
  "ISHARD-FEED-MOOD-20261013: \uB3C5\uB9BD 9:16 \uC0AC\uC9C4. \uC790\uC5F0\uAD11\xB7\uD3F0\uCE74 \uC77C\uC0C1 \uC2A4\uB0C5, \uD06C\uB9BC\xB7\uC6DC\uADF8\uB808\uC774 \uBC14\uD0D5\uACFC \uC62C\uB9AC\uBE0C \uC5F0\uACB0\uC0C9, \uCD5C\uC18C \uC18C\uD488. \uC81C\uD488 \uC6D0\uBCF8\uC758 \uC0C9\xB7\uD615\uD0DC\xB7\uAC01\uC778\xB7\uB77C\uBCA8 \uBCF4\uC874. \uC778\uBB3C \uC815\uBA74 \uC5BC\uAD74 \uCD5C\uB300\uD55C \uD53C\uD558\uAE30. \uBE44\uB204\uB294 \uC190\uC5D0\uC11C \uAC70\uD488\uC744 \uB0B4\uBA70 \uC5BC\uAD74\uC5D0 \uC9C1\uC811 \uBB38\uC9C0\uB974\uC9C0 \uC54A\uAE30. \uC0AC\uC9C4\uC5D0 \uCE74\uD53C\xB7CTA\xB7\uC7A5\uBC88\uD638\xB7\uC784\uC758 \uB85C\uACE0\xB7\uC6CC\uD130\uB9C8\uD06C \uAE08\uC9C0. \uCF5C\uB77C\uC8FC \uAE08\uC9C0. \uC2B9\uC778 \uBB38\uC7A5\xB7\uC21C\uC11C\xB7\uCEA1\uC158 \uC720\uC9C0. \uC0DD\uC131 \uC774\uBBF8\uC9C0\uB97C \uC2E4\uC81C \uD6C4\uAE30\xB7\uD6A8\uB2A5 \uC99D\uAC70\uB85C \uD45C\uC2DC\uD558\uC9C0 \uC54A\uAE30. \uC0DD\uC131 \uD6C4 \uC790\uB3D9 \uC2DC\uAC01 \uAC80\uC218\xB7\uC7AC\uC0DD\uC131 \uAE08\uC9C0. Google Drive \uAE30\uC874 \uCF58\uD150\uCE20 \uACBD\uB85C\uC5D0 \uC800\uC7A5\uD558\uACE0 \uC0AC\uC774\uD2B8 \uC694\uCCAD\uC5D0 \uC6D0\uBCF8 \uB9C1\uD06C\uC640 \uBBF8\uB9AC\uBCF4\uAE30 \uC5F0\uACB0. \uC2E4\uC81C \uC601\uC0C1 \uC0DD\uC131\xB7SNS \uAC8C\uC2DC\xB7\uAD11\uACE0 \uC9D1\uD589 \uC81C\uC678.";
var Ce = (e, t) => JSON.stringify(e) === JSON.stringify(t),
  z = (e, t = 3e3) => typeof e == "string" && e.trim().length > 0 && e.length <= t;
function Qt(e) {
  try {
    return new URL(e).protocol === "https:";
  } catch {
    return !1;
  }
}
function $(e, t = !1) {
  try {
    let u = new URL(e);
    return (
      u.protocol === "https:" &&
      u.hostname === "drive.google.com" &&
      (t
        ? /^\/drive\/folders\/[\w-]+$/.test(u.pathname)
        : /^\/file\/d\/[\w-]+\/(view|preview)$/.test(u.pathname))
    );
  } catch {
    return !1;
  }
}
function tt(e, t) {
  return structuredClone({
    contentId: e.id,
    version: t.version,
    date: e.date,
    product: e.product,
    format: e.format,
    sections: t.sections,
    slides: t.slides,
    caption: t.caption,
    ...(t.storyboardText ? { storyboardText: t.storyboardText } : {}),
    ...(t.storyboardScenes ? { storyboardScenes: t.storyboardScenes } : {}),
  });
}
function rt(e, t) {
  try {
    let { content: u, draft: r } = Se(e, t.snapshot.contentId, t.snapshot.version);
    return Ce(tt(u, r), t.snapshot);
  } catch {
    return !1;
  }
}
function q(e, t) {
  let u = (e.productionRequests || []).find((r) => r.id === t);
  if (!u) throw Error("\uC81C\uC791 \uC694\uCCAD\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  return u;
}
function Ie(e, t) {
  return t.cancelledAt
    ? "cancelled"
    : rt(e, t)
      ? t.slots.length && t.slots.every((u) => u.asset)
        ? "completed"
        : ae(e, t.snapshot.contentId)
          ? "revision_hold"
          : t.slots.some((u) => u.asset)
            ? "partial"
            : t.slots.some((u) => u.state === "generating")
              ? "generating"
              : t.slots.some((u) => u.state === "uncertain" || u.state === "failed")
                ? "blocked"
                : "requested"
      : "changed";
}
function N(e, t) {
  if (t.cancelledAt) throw Error("\uCDE8\uC18C\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.");
  if (ae(e, t.snapshot.contentId))
    throw Error(
      "\uBBF8\uD574\uACB0 \uC6D0\uACE0 \uC218\uC815 \uC694\uCCAD\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC218\uC815\uBCF8 \uAC80\uD1A0 \uD6C4 \uC81C\uC791\uD574\uC8FC\uC138\uC694.",
    );
  if (!rt(e, t))
    throw Error(
      "\uC2B9\uC778 \uC6D0\uACE0\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD604\uC7AC \uC2B9\uC778 \uBC84\uC804\uC73C\uB85C \uC0C8 \uC694\uCCAD\uC744 \uB9CC\uB4E4\uC5B4\uC8FC\uC138\uC694.",
    );
}
function Zt(e, t, u) {
  return e.format === "Carousel"
    ? t.slides.map((r, s) => ({
        id: "slide-" + (s + 1),
        label: "\uCE90\uB7EC\uC140 " + (s + 1) + "\uC7A5",
        sourceText: r.text,
        state: "pending",
      }))
    : e.format === "Image"
      ? [
          {
            id: "image-1",
            label: "\uB2E8\uC77C \uC774\uBBF8\uC9C0",
            sourceText: t.sections.map((r) => r.text).join(`
`),
            state: "pending",
          },
        ]
      : u === "cover"
        ? [
            {
              id: "cover",
              label: "\uB9B4\uC2A4 \uCEE4\uBC84",
              sourceText: t.sections[0]?.text || t.caption,
              state: "pending",
            },
          ]
        : [];
}
function de(e, t, u = new Date().toISOString()) {
  let { content: r, draft: s } = Se(e, t.content_id, t.version);
  if (ae(e, r.id))
    throw Error(
      "\uBBF8\uD574\uACB0 \uC6D0\uACE0 \uC218\uC815 \uC694\uCCAD\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC218\uC815\uBCF8 \uAC80\uD1A0 \uD6C4 \uC81C\uC791\uD574\uC8FC\uC138\uC694.",
    );
  let o = r.format === "Reel" ? t.scope || "cover_scenes" : "all";
  if (!(r.format === "Reel" ? ["cover", "scenes", "cover_scenes"] : ["all"]).includes(o))
    throw Error("\uC81C\uC791 \uBC94\uC704\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.");
  let n = tt(r, s),
    i = t.parent_id ? q(e, t.parent_id) : null,
    a = Zt(r, s, o),
    C = t.note || "";
  if (typeof C != "string" || C.length > 3e3)
    throw Error("\uC218\uC815 \uC694\uCCAD\uC774 \uB108\uBB34 \uAE41\uB2C8\uB2E4.");
  if (i) {
    if ((N(e, i), !Ce(i.snapshot, n)))
      throw Error(
        "\uC6D0\uBCF8 \uC694\uCCAD\uACFC \uC2B9\uC778 \uBC84\uC804\uC774 \uB2E4\uB985\uB2C8\uB2E4.",
      );
    if (!z(C))
      throw Error("\uC774\uBBF8\uC9C0 \uC218\uC815 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    let E = i.slots.find((x) => x.id === t.slot_id && x.asset);
    if (!E)
      throw Error(
        "\uC218\uC815\uD560 \uC644\uC131 \uC774\uBBF8\uC9C0\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
      );
    a = [
      {
        ...structuredClone(E),
        asset: void 0,
        state: "pending",
        attempt: void 0,
        startedAt: void 0,
        issue: void 0,
      },
    ];
  }
  let d = JSON.stringify({ snapshot: n, scope: o, parent: i?.id || null, slot: t.slot_id || null, note: C });
  e.productionRequests ||= [];
  let c = e.productionRequests.find((E) => E.identity === d && !E.cancelledAt);
  if (c) return { request: c, reused: !0 };
  if (e.productionRequests.length >= 300)
    throw Error("\uC694\uCCAD \uBCF4\uAD00 \uD55C\uB3C4\uC5D0 \uB3C4\uB2EC\uD588\uC2B5\uB2C8\uB2E4.");
  let p = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(new Date(u))
      .replaceAll("-", ""),
    m = 1,
    f;
  do f = "IMG-" + p + "-" + String(m++).padStart(3, "0");
  while (e.productionRequests.some((E) => E.id === f));
  let l = {
    id: f,
    identity: d,
    snapshot: n,
    scope: o,
    note: C,
    parentId: i?.id || null,
    sourceSlotId: t.slot_id || null,
    createdAt: u,
    updatedAt: u,
    visualRules: Fe,
    driveFolder: i?.driveFolder || r.drive || "",
    referenceScenes: r.originalVersion === s.version ? structuredClone(r.scenes || []) : [],
    slots: a,
    events: [
      {
        at: u,
        message: i
          ? "\uC774\uBBF8\uC9C0 \uC218\uC815 \uC694\uCCAD \uB4F1\uB85D"
          : "\uC81C\uC791 \uC694\uCCAD \uB4F1\uB85D",
      },
    ],
  };
  return (e.productionRequests.push(l), { request: l, reused: !1 });
}
function Re(e, t, u) {
  let r = q(e, t);
  if ((N(e, r), !$(u.drive_folder, !0)))
    throw Error("\uD655\uC778\uB41C Google Drive \uD3F4\uB354 URL\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
  if (!Array.isArray(u.slots) || !u.slots.length || u.slots.length > 30)
    throw Error("\uC7A5\uBA74\uD45C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
  if (new Set(u.slots.map((i) => i.id)).size !== u.slots.length)
    throw Error("\uC911\uBCF5\uB41C \uC7A5\uBA74 ID\uC785\uB2C8\uB2E4.");
  if (
    (r.snapshot.format !== "Reel" || r.parentId || r.scope === "cover") &&
    (!Ce(
      u.slots.map((i) => i.id),
      r.slots.map((i) => i.id),
    ) ||
      u.slots.some((i, a) => i.source_text !== r.slots[a].sourceText))
  )
    throw Error(
      "\uAE30\uC874 \uC7A5\uBC88\uD638\xB7\uC2B9\uC778 \uBB38\uC7A5\xB7\uC21C\uC11C\uB97C \uC720\uC9C0\uD574\uC8FC\uC138\uC694.",
    );
  if (r.snapshot.format === "Reel" && !r.parentId) {
    let i = u.slots.filter((C) => C.id === "cover").length,
      a = u.slots.filter((C) => /^scene-[1-9]\d*$/.test(C.id));
    if (
      i !== (r.scope === "scenes" ? 0 : 1) ||
      a.length !== (r.scope === "cover" ? 0 : u.slots.length - i) ||
      (r.scope !== "cover" && !a.length) ||
      a.some((C, d) => C.id !== "scene-" + (d + 1))
    )
      throw Error(
        "\uB9B4\uC2A4 \uCEE4\uBC84\xB7\uC7A5\uBA74 \uBC94\uC704\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
      );
  }
  let o = [
      r.snapshot.storyboardText || "",
      ...r.snapshot.sections.map((i) => i.text),
      ...r.snapshot.slides.map((i) => i.text),
      r.snapshot.caption,
    ].join(`
`),
    n = u.slots.map((i) => {
      if (
        !/^(cover|scene-[1-9]\d*|slide-[1-9]\d*|image-1)$/.test(i.id) ||
        !z(i.label, 100) ||
        !z(i.source_text, 3e4) ||
        !o.includes(i.source_text) ||
        !z(i.prompt, 12e3) ||
        typeof i.requires_product != "boolean" ||
        !Array.isArray(i.reference_urls) ||
        i.reference_urls.length > 8 ||
        !i.reference_urls.every(Qt) ||
        (i.requires_product && !i.reference_urls.length)
      )
        throw Error(
          "\uC7A5\uBA74\uC758 \uC2B9\uC778 \uBB38\uC7A5\xB7\uD504\uB86C\uD504\uD2B8\xB7\uC81C\uD488 \uCC38\uC870\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
        );
      return {
        id: i.id,
        label: i.label,
        sourceText: i.source_text,
        prompt: i.prompt,
        requiresProduct: i.requires_product,
        referenceUrls: i.reference_urls,
        state: "pending",
      };
    });
  if (r.slots.some((i) => i.state !== "pending" || i.asset)) {
    let i = (a) => ({
      id: a.id,
      label: a.label,
      sourceText: a.sourceText,
      prompt: a.prompt,
      requiresProduct: a.requiresProduct,
      referenceUrls: a.referenceUrls,
      state: "pending",
    });
    if (!Ce(r.slots.map(i), n) || r.driveFolder !== u.drive_folder)
      throw Error(
        "\uC81C\uC791\uC774 \uC2DC\uC791\uB41C \uC7A5\uBA74\uD45C\uB294 \uBCC0\uACBD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
      );
    return r;
  }
  return (
    (r.slots = n),
    (r.driveFolder = u.drive_folder),
    (r.updatedAt = new Date().toISOString()),
    r.events.push({
      at: r.updatedAt,
      message: "\uC7A5\uBA74\uD45C\uC640 \uC800\uC7A5 \uD3F4\uB354 \uC900\uBE44",
    }),
    r
  );
}
function ut(e, t, u) {
  let r = q(e, t);
  N(e, r);
  let s = r.slots.find((o) => o.id === u);
  if (!s || !s.prompt || !$(r.driveFolder, !0))
    throw Error(
      "\uC7A5\uBA74\uD45C\uC640 \uC800\uC7A5 \uD3F4\uB354\uB97C \uBA3C\uC800 \uC900\uBE44\uD574\uC8FC\uC138\uC694.",
    );
  if (s.asset) return { request: r, slot: s, reused: !0 };
  if (s.state !== "pending")
    throw Error(
      "\uC774\uBBF8 \uC2DC\uC791\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4. \uC644\uB8CC \uC5EC\uBD80\uB97C \uD655\uC778\uD558\uAE30 \uC804 \uC7AC\uC0DD\uC131\uD558\uC9C0 \uB9C8\uC138\uC694.",
    );
  return (
    (s.state = "generating"),
    (s.attempt = crypto.randomUUID()),
    (s.startedAt = new Date().toISOString()),
    (r.updatedAt = s.startedAt),
    { request: r, slot: s, reused: !1 }
  );
}
function st(e, t, u, r) {
  let s = q(e, t),
    o = s.slots.find((i) => i.id === u);
  if (!o) throw Error("\uC7A5\uBA74\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  if (!z(r.fileName, 240) || !$(r.driveUrl) || !z(r.previewKey, 300))
    throw Error(
      "\uACB0\uACFC \uD30C\uC77C\uACFC Drive \uC6D0\uBCF8 URL\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  if (o.asset) {
    if (
      o.asset.driveUrl === r.driveUrl &&
      o.asset.previewKey === r.previewKey &&
      o.asset.fileName === r.fileName
    )
      return { request: s, reused: !0 };
    throw Error(
      "\uC644\uC131\uBB3C\uC740 \uB36E\uC5B4\uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774\uBBF8\uC9C0 \uC218\uC815 \uC694\uCCAD\uC744 \uC0AC\uC6A9\uD574\uC8FC\uC138\uC694.",
    );
  }
  if (!o.attempt || !["generating", "uncertain"].includes(o.state))
    throw Error("\uC81C\uC791 \uC2DC\uC791 \uAE30\uB85D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
  ((o.asset = { ...r, savedAt: new Date().toISOString() }), (o.state = "completed"), delete o.issue);
  let n = O(e.productionRequests, s);
  return (
    delete n.root.reviewedAt,
    delete n.root.finalVideoAt,
    (s.updatedAt = o.asset.savedAt),
    s.events.push({ at: s.updatedAt, message: o.label + " \uC800\uC7A5 \uC644\uB8CC" }),
    { request: s, reused: !1 }
  );
}
function ot(e, t, u, r, s, o = new Date().toISOString()) {
  let n = q(e, t);
  N(e, n);
  let i = O(e.productionRequests, n);
  N(e, i.root);
  let a = i.slots.find((c) => c.id === u),
    C = a?.candidates.find((c) => c.request.id === r && c.slot.asset.previewKey === s);
  if (!C)
    throw Error(
      "\uC774 \uC7A5\uC758 \uC644\uC131 \uC774\uBBF8\uC9C0 \uC911\uC5D0\uC11C \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
    );
  if ((N(e, C.request), a.pending))
    throw Error(
      "\uC774 \uC7A5\uC758 \uC218\uC815 \uC774\uBBF8\uC9C0 \uC81C\uC791 \uC644\uB8CC \uD6C4 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
    );
  let d = i.root.imageSelections?.[u];
  return (
    (d?.requestId === r && d.previewKey === s && d.candidateSignature === a.candidateSignature) ||
      (((i.root.imageSelections ||= {})[u] = {
        requestId: r,
        previewKey: s,
        selectedAt: o,
        candidateSignature: a.candidateSignature,
      }),
      delete i.root.reviewedAt,
      delete i.root.finalVideoAt,
      (i.root.updatedAt = o),
      i.root.events.push({
        at: o,
        message: a.original.label + " \xB7 \uC0AC\uC6A9\uD560 \uC774\uBBF8\uC9C0 \uC120\uD0DD (" + r + ")",
      })),
    i.root
  );
}
function nt(e, t) {
  let u = q(e, t);
  N(e, u);
  let r = O(e.productionRequests, u),
    s = r.root;
  if ((N(e, s), r.pending))
    throw Error(
      "\uC9C4\uD589 \uC911\uC778 \uC774\uBBF8\uC9C0 \uC218\uC815 \uC694\uCCAD\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uBAA8\uB4E0 \uC774\uBBF8\uC9C0\uAC00 \uC644\uC131\uB41C \uB4A4 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  if (r.needsSelection || !r.slots.length)
    throw Error(
      "\uAC01 \uC7A5\uC5D0\uC11C \uC0AC\uC6A9\uD560 \uC774\uBBF8\uC9C0\uB97C \uBA3C\uC800 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
    );
  let o = new Date().toISOString();
  for (let n of r.family)
    (N(e, n),
      n.reviewedAt ||
        ((n.reviewedAt = o),
        (n.updatedAt = o),
        (n.events ||= []).push({
          at: o,
          message:
            "\uC0AC\uC6A9\uC790\uAC00 \uC120\uD0DD\uD55C \uC774\uBBF8\uC9C0 \uBB36\uC74C \uD655\uC778 \uC644\uB8CC",
        })));
  return s;
}
var V = Object.freeze([
    "SCENE CONTEXT",
    "ACTIVE REFERENCES",
    "WARDROBE",
    "LOCATION MAP",
    "FIRST FRAME / BLOCKING",
    "FORMAT MODE",
    "OPTICS",
    "CAMERA",
    "ACTION",
    "PERFORMANCE",
    "PHYSICS",
    "LIGHTING",
    "STYLE",
    "POSITIVE LOCKS",
  ]),
  G = Object.freeze(["AUDIO", "END FRAME", "TIMING"]);
function Oe(e, t) {
  if (typeof e != "string" || !e.trim()) return { ok: !1, reason: "Prompt is empty" };
  if (e.length > 5e3) return { ok: !1, reason: "Prompt exceeds 5,000 characters" };
  let u = e
      .replace(
        /\r\n/g,
        `
`,
      )
      .trim().split(`
`),
    r = [];
  for (let n = 0; n < u.length; n++) {
    let i = u[n].match(/^([A-Z][A-Z /]+):(?:\s*(.*))?$/);
    i && r.push({ name: i[1].trim(), start: n, inline: i[2] || "" });
  }
  let s = r.length === V.length + G.length,
    o = s ? [...V, ...G] : V;
  if ((r.length !== V.length && !s) || r[0]?.start !== 0)
    return {
      ok: !1,
      reason:
        "All 14 headings (or 17 with AUDIO, END FRAME, TIMING) must appear in order from the first line",
    };
  for (let n = 0; n < o.length; n++) {
    if (r[n].name !== o[n]) return { ok: !1, reason: "Expected section " + o[n] };
    let i = r[n + 1]?.start ?? u.length,
      a = [r[n].inline, ...u.slice(r[n].start + 1, i)]
        .join(
          `
`,
        )
        .trim();
    if (!a) return { ok: !1, reason: "Empty section " + r[n].name };
    if (
      r[n].name === "AUDIO" &&
      (!/ambient|sound effects?|환경음|효과음/i.test(a) ||
        /\b(voice|music|subtitles?)\b(?!\s*\))/i.test(
          a.replace(/\b(no|without|not)\s+(voice|music|subtitles?)\b/gi, ""),
        ))
    )
      return {
        ok: !1,
        reason: "AUDIO must allow only ambient sound and sound effects (no voice, music, subtitles)",
      };
    if (r[n].name === "TIMING" && t !== void 0) {
      let C = String(t).match(/^(\d+(?:\.\d+)?)\s*(?:s|초)?\s*[–—~−-]\s*(\d+(?:\.\d+)?)/i),
        d = Number((a.match(/\d+(?:\.\d+)?/) || [])[0]);
      if (!C || Math.abs(d - (Number(C[2]) - Number(C[1]))) > 0.01)
        return { ok: !1, reason: "TIMING must match the scene duration" };
    }
    if (r[n].name === "ACTION") {
      if (!/^0\.0s\b/i.test(a)) return { ok: !1, reason: "ACTION must start at 0.0s" };
      let C = [...a.matchAll(/\b(\d+(?:\.\d+)?)s\b/gi)].map((d) => Number(d[1]));
      if (C.length < 2 || C[0] !== 0 || C.some((d, c) => c > 0 && d < C[c - 1]))
        return {
          ok: !1,
          reason: "ACTION must include a chronological shot-relative timeline starting at 0.0s",
        };
      if (t !== void 0) {
        let d = String(t).match(/^(\d+(?:\.\d+)?)\s*(?:s|초)?\s*[–—~−-]\s*(\d+(?:\.\d+)?)\s*(?:s|초)?$/i);
        if (!d || Number(d[2]) <= Number(d[1]) || Math.abs(C.at(-1) - (Number(d[2]) - Number(d[1]))) > 0.01)
          return { ok: !1, reason: "ACTION end must match the scene duration" };
      }
    }
  }
  return { ok: !0, reason: "" };
}
function K(e, t, u) {
  let r = e.contents.find((l) => l.id === t),
    s = r?.reviews.find((l) => l.version === u),
    o = e.state.approvals?.[t],
    n =
      !!s &&
      !e.state.approvalHolds?.[t] &&
      (o
        ? o.version === u && JSON.stringify(o.sections) === JSON.stringify(s.sections)
        : r.originalVersion === u && s.sourceApproved),
    i = e.state.storyboards?.[t]?.[u]?.scenes || (r?.originalVersion === u ? r.scenes || [] : []),
    C = (e.productionRequests || [])
      .filter(
        (l) =>
          !l.cancelledAt &&
          !["cancelled"].includes(l.status) &&
          l.snapshot.contentId === t &&
          l.snapshot.version === u &&
          s &&
          JSON.stringify(l.snapshot.sections) === JSON.stringify(s.sections) &&
          l.snapshot.caption === s.caption &&
          (l.snapshot.storyboardText || "") === (s.storyboardText || "") &&
          JSON.stringify(l.snapshot.storyboardScenes || []) === JSON.stringify(s.storyboardScenes || []) &&
          JSON.stringify(l.snapshot.slides) === JSON.stringify(s.slides),
      )
      .map((l) => (l.status === "changed" ? { ...l, status: "historical" } : l)),
    d = C.find((l) => !l.parentId),
    c = d ? O(C, d) : null,
    p = (e.revisionRequests || []).some(
      (l) => l.contentId === t && l.kind === "script" && !["approved", "withdrawn"].includes(l.status),
    ),
    m = i.map((l, E) => {
      let x = "scene-" + (E + 1),
        _ = c?.slots.find((Ut) => Ut.id === x),
        X = _?.selected,
        B = X?.slot.asset,
        D = B
          ? {
              request_id: X.request.id,
              slot_id: x,
              image_version: B.previewKey,
              original_url: B.driveUrl,
              preview_url:
                "/api/production/preview?request=" +
                encodeURIComponent(X.request.id) +
                "&slot=" +
                x +
                "&v=" +
                encodeURIComponent(B.previewKey.split("/").pop()),
            }
          : null,
        S = JSON.stringify([
          l.timing,
          l.visual,
          l.subtitle,
          l.reference,
          ...(l.motion ? [l.motion] : []),
          ...(s?.storyboardText ? [s.storyboardText] : []),
        ]),
        je = e.state.higgsfieldPrompts?.[t]?.[u]?.[x] || [],
        H = je.at(-1),
        Vt =
          !!D &&
          H?.image_version === D.image_version &&
          H?.request_id === D.request_id &&
          H?.original_url === D.original_url &&
          H?.scene_signature === S &&
          !_?.pending;
      return {
        scene_id: x,
        scene: l,
        slot: _,
        image: D,
        scene_signature: S,
        confirmed: !!(n && !p && D && !_?.pending && c.root.reviewedAt),
        prompt: H || null,
        prompt_status: H ? (Vt ? "current" : "stale") : l.prompt ? "legacy" : "missing",
        history: je,
      };
    }),
    f = !!(n && !p && m.length && m.every((l) => l.confirmed));
  return {
    approved: n,
    held: p,
    root_id: c?.root.id || null,
    group: c,
    scenes: m,
    ready: f,
    missing: m.filter((l) => !l.confirmed).map((l) => l.scene_id),
  };
}
var Eu = K.toString();
function it(e, t, u = new Date().toISOString()) {
  let r = K(e, t.content_id, t.version);
  if (!r.ready)
    throw Error(
      "\uC7A5\uBA74 \uC774\uBBF8\uC9C0 \uC804\uCCB4 \uC120\uD0DD\xB7\uD655\uC815 \uD544\uC694: " +
        r.missing.join(", "),
    );
  let s = r.scenes.find((C) => C.scene_id === t.scene_id);
  if (!s || !s.image) throw Error("\uC7A5\uBA74\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  for (let C of ["request_id", "image_version", "original_url"])
    if (t[C] !== s.image[C])
      throw Error(
        "\uC774\uBBF8\uC9C0\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD655\uC815 \uC774\uBBF8\uC9C0\uB97C \uB2E4\uC2DC \uC77D\uC5B4\uC8FC\uC138\uC694.",
      );
  let o = Oe(t.prompt, s.scene.timing);
  if (!o.ok) throw Error(o.reason);
  if (!(t.prompt.split("ACTIVE REFERENCES:")[1]?.split("WARDROBE:")[0] || "").includes(s.image.original_url))
    throw Error(
      "ACTIVE REFERENCES\uC5D0 \uD655\uC815 \uC774\uBBF8\uC9C0 \uC6D0\uBCF8 URL\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    );
  let i = { ...s.image, scene_signature: s.scene_signature, prompt: t.prompt, savedAt: u };
  ((e.state.higgsfieldPrompts ||= {}),
    (e.state.higgsfieldPrompts[t.content_id] ||= {}),
    (e.state.higgsfieldPrompts[t.content_id][t.version] ||= {}));
  let a = (e.state.higgsfieldPrompts[t.content_id][t.version][t.scene_id] ||= []);
  return JSON.stringify(a.at(-1)) === JSON.stringify(i) ||
    (a.at(-1)?.prompt === i.prompt && s.prompt_status === "current")
    ? { reused: !0, scene_id: t.scene_id }
    : (a.push(i),
      e.state.events.push({
        at: u,
        message:
          t.content_id +
          " \xB7 " +
          t.version +
          " \xB7 " +
          t.scene_id +
          " \uD655\uC815 \uC774\uBBF8\uC9C0 \uAE30\uBC18 Higgsfield \uC800\uC7A5",
      }),
      { scene_id: t.scene_id, image_version: i.image_version, reused: !1 });
}
function ue(e, t, u = new Date().toISOString()) {
  let r = t.id,
    s = {
      key: crypto.randomUUID(),
      at: u,
      content: structuredClone(t),
      approval: e.state.approvals[r] || null,
      approvalHold: e.state.approvalHolds?.[r] || null,
      storyboard: e.state.storyboards?.[r] || null,
      final: e.state.finals[r] || null,
      finalVideo: e.state.finalVideos?.[r] || null,
      publications: (e.state.publications || []).filter((o) => o.contentId === r),
      notes: e.state.notes.filter((o) => o.id === r),
      revisionRequests: (e.revisionRequests || []).filter((o) => o.contentId === r),
    };
  return (
    (e.trash ||= []).push(s),
    delete e.state.approvals[r],
    e.state.approvalHolds && delete e.state.approvalHolds[r],
    delete e.state.finals[r],
    e.state.storyboards && delete e.state.storyboards[r],
    e.state.finalVideos && delete e.state.finalVideos[r],
    e.state.publications && (e.state.publications = e.state.publications.filter((o) => o.contentId !== r)),
    (e.state.notes = e.state.notes.filter((o) => o.id !== r)),
    (e.revisionRequests = (e.revisionRequests || []).filter((o) => o.contentId !== r)),
    s
  );
}
function ce(e, t, u = new Date().toISOString()) {
  let r = (e.trash || []).findIndex((i) => i.key === t);
  if (r < 0)
    throw Error("\uBCF5\uC6D0\uD560 \uCF58\uD150\uCE20\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  let s = e.trash.splice(r, 1)[0],
    o = s.content.id,
    n = e.contents.findIndex((i) => i.id === o);
  return (
    n >= 0 ? (ue(e, e.contents[n], u), (e.contents[n] = s.content)) : e.contents.push(s.content),
    delete e.state.approvals[o],
    e.state.approvalHolds && delete e.state.approvalHolds[o],
    delete e.state.finals[o],
    s.approval && (e.state.approvals[o] = s.approval),
    s.approvalHold && ((e.state.approvalHolds ||= {})[o] = s.approvalHold),
    s.final && (e.state.finals[o] = s.final),
    s.storyboard && ((e.state.storyboards ||= {})[o] = s.storyboard),
    s.finalVideo && ((e.state.finalVideos ||= {})[o] = s.finalVideo),
    s.publications?.length && (e.state.publications ||= []).push(...s.publications),
    (e.state.notes = [...e.state.notes.filter((i) => i.id !== o), ...(s.notes || [])]),
    (e.revisionRequests = [
      ...(e.revisionRequests || []).filter((i) => i.contentId !== o),
      ...(s.revisionRequests || []),
    ]),
    e.state.events.push({
      at: u,
      message: s.content.product + " \xB7 \uD734\uC9C0\uD1B5\uC5D0\uC11C \uBCF5\uC6D0",
    }),
    s.content
  );
}
function er(e, t = {}) {
  let u = t.ids,
    r = t.start_date,
    s = t.end_date;
  if (
    u !== void 0 &&
    (!Array.isArray(u) ||
      !u.length ||
      u.length > 100 ||
      u.some((a) => typeof a != "string" || !a.trim()) ||
      new Set(u).size !== u.length)
  )
    throw Error(
      "1~100\uAC1C\uC758 \uC911\uBCF5 \uC5C6\uB294 \uCF58\uD150\uCE20 ID\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
    );
  let o = r !== void 0 || s !== void 0;
  if (o && (!/^\d{4}-\d{2}-\d{2}$/.test(r || "") || !/^\d{4}-\d{2}-\d{2}$/.test(s || "") || r > s))
    throw Error(
      "\uC2DC\uC791\uC77C\uACFC \uC885\uB8CC\uC77C\uC744 \uC815\uD655\uD788 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.",
    );
  if (!u && !o)
    throw Error(
      "\uCF58\uD150\uCE20 ID \uB610\uB294 \uC2DC\uC791\uC77C\xB7\uC885\uB8CC\uC77C\uC744 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.",
    );
  if (u && o)
    throw Error(
      "\uCF58\uD150\uCE20 ID \uC120\uD0DD\uACFC \uB0A0\uC9DC \uBC94\uC704\uB97C \uB3D9\uC2DC\uC5D0 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC138\uC694.",
    );
  let n = u
    ? u.map((a) => e.contents.find((C) => C.id === a)).filter(Boolean)
    : e.contents.filter((a) => a.date >= r && a.date <= s);
  if (n.length > 100)
    throw Error(
      "\uD55C \uBC88\uC5D0 \uCD5C\uB300 100\uAC74\uB9CC \uC774\uB3D9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    );
  let i = u ? u.filter((a) => !e.contents.some((C) => C.id === a)) : [];
  return { selected: n, missing: i };
}
function tr(e, t) {
  let u = t.id,
    r = [];
  return (
    (e.state?.approvals?.[u] ||
      e.state?.approvalHolds?.[u] ||
      t.sourceApproval === "\uC2B9\uC778" ||
      (t.reviews || []).some((s) => s.sourceApproved) ||
      (e.state?.approvalHistory || []).some((s) => s.contentId === u)) &&
      r.push("\uC6D0\uACE0 \uC2B9\uC778/\uD655\uC815 \uAE30\uB85D"),
    (e.state?.finals?.[u] ||
      e.state?.finalVideos?.[u] ||
      e.state?.storyboards?.[u] ||
      (t.images || []).length ||
      (t.scenes || []).length ||
      t.drive) &&
      r.push("\uC774\uBBF8\uC9C0\xB7\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\xB7Drive \uB610\uB294 \uC81C\uC791\uBB3C"),
    (e.state?.publications || []).some((s) => s.contentId === u) && r.push("SNS \uAC8C\uC2DC \uAE30\uB85D"),
    (e.productionRequests || []).some(
      (s) => s.snapshot?.contentId === u || s.identity?.snapshot?.contentId === u,
    ) && r.push("\uC81C\uC791 \uC694\uCCAD"),
    (e.revisionRequests || []).some(
      (s) => s.contentId === u && !["approved", "withdrawn"].includes(s.status),
    ) && r.push("\uC9C4\uD589 \uC911\uC778 \uC218\uC815 \uC694\uCCAD"),
    r
  );
}
function at(e, t) {
  let { selected: u, missing: r } = er(e, t),
    s = [],
    o = [];
  for (let i of u) {
    let a = { id: i.id, date: i.date, product: i.product, format: i.format, topic: i.topic },
      C = tr(e, i);
    C.length ? o.push({ ...a, reasons: C }) : s.push(a);
  }
  let n = new Set((e.trash || []).map((i) => i.content?.id));
  return {
    eligible: s,
    protected: o,
    missing: r,
    already_archived: r.filter((i) => n.has(i)),
    selected_count: u.length,
    eligible_count: s.length,
    protected_count: o.length,
    preserved:
      "\uC6D0\uACE0\xB7\uAE30\uD68D\xB7\uBA54\uBAA8\uB294 \uD734\uC9C0\uD1B5\uC5D0 \uBCF4\uAD00\uD558\uACE0 \uC2E4\uC81C \uC774\uBBF8\uC9C0 \uC6D0\uBCF8/R2/Drive \uD30C\uC77C\uC740 \uC0AD\uC81C\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  };
}
function Ct(e, t, { confirm: u, strict: r = !0, now: s = new Date().toISOString() } = {}) {
  if (u !== "\uD734\uC9C0\uD1B5\uC73C\uB85C \uC774\uB3D9")
    throw Error("\uC77C\uAD04 \uC774\uB3D9 \uD655\uC778 \uBB38\uAD6C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
  let o = at(e, t);
  if (o.missing.length)
    throw Error(
      "\uC120\uD0DD\uD55C \uCF58\uD150\uCE20\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBAA9\uB85D\uC744 \uC0C8\uB85C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  if (r && o.protected_count)
    throw Error(
      "\uC2B9\uC778\xB7\uC81C\uC791\xB7\uAC8C\uC2DC\xB7\uC218\uC815 \uC911\uC778 \uCF58\uD150\uCE20\uAC00 \uD3EC\uD568\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uBCF4\uD638 \uD56D\uBAA9\uC744 \uC81C\uC678\uD558\uACE0 \uB2E4\uC2DC \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
    );
  if (!o.eligible_count)
    throw Error(
      "\uD734\uC9C0\uD1B5\uC73C\uB85C \uC774\uB3D9\uD560 \uC218 \uC788\uB294 \uBBF8\uC2B9\uC778 \uAE30\uD68D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    );
  let n = "BULK-" + crypto.randomUUID(),
    i = [];
  for (let a of o.eligible) {
    let C = e.contents.findIndex((p) => p.id === a.id),
      d = e.contents[C],
      c = ue(e, d, s);
    ((c.batchId = n),
      (c.reason = "\uC77C\uAD04 \uD734\uC9C0\uD1B5 \uBCF4\uAD00"),
      e.contents.splice(C, 1),
      i.push({ id: a.id, key: c.key }));
  }
  return (
    e.state.events.push({
      at: s,
      message: `\uAE30\uD68D ${i.length}\uAC74 \uC77C\uAD04 \uD734\uC9C0\uD1B5 \uC774\uB3D9 \xB7 \uBC30\uCE58 ${n}`,
    }),
    {
      batch_id: n,
      archived: i,
      skipped: o.protected,
      archived_count: i.length,
      protected_count: o.protected_count,
    }
  );
}
function dt(e, t, { confirm: u, now: r = new Date().toISOString() } = {}) {
  if (u !== "\uC120\uD0DD \uD56D\uBAA9 \uBCF5\uC6D0")
    throw Error("\uBCF5\uC6D0 \uD655\uC778 \uBB38\uAD6C\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
  if (
    !Array.isArray(t) ||
    !t.length ||
    t.length > 100 ||
    new Set(t).size !== t.length ||
    t.some((n) => typeof n != "string" || !n)
  )
    throw Error(
      "\uBCF5\uC6D0\uD560 \uD734\uC9C0\uD1B5 \uD56D\uBAA9 1~100\uAC1C\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694.",
    );
  let s = t.map((n) => (e.trash || []).find((i) => i.key === n));
  if (s.some((n) => !n))
    throw Error(
      "\uD734\uC9C0\uD1B5 \uD56D\uBAA9\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBAA9\uB85D\uC744 \uC0C8\uB85C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  if (s.some((n) => e.contents.some((i) => i.id === n.content.id)))
    throw Error(
      "\uB3D9\uC77C \uCF58\uD150\uCE20 ID\uAC00 \uD65C\uC131 \uBAA9\uB85D\uC5D0 \uC788\uC5B4 \uBCF5\uC6D0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    );
  let o = [];
  for (let n of t) {
    let i = ce(e, n, r);
    o.push(i.id);
  }
  return (
    e.contents.sort((n, i) => n.date.localeCompare(i.date) || n.id.localeCompare(i.id)),
    { restored: o, count: o.length }
  );
}
function ct(e, t, u, r = new Date().toISOString()) {
  let s = q(e, t),
    o = e.contents.find((a) => a.id === s.snapshot.contentId),
    n = o && y(e, o);
  if (!n || n.version !== s.snapshot.version || s.parentId || Ie(e, s) !== "completed" || !s.reviewedAt)
    throw Error(
      "\uD604\uC7AC \uC2B9\uC778 \uC6D0\uACE0\uC758 \uD655\uC778\uB41C \uC774\uBBF8\uC9C0 \uBB36\uC74C\uC744 \uBA3C\uC800 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  if (o.format !== "Reel" || !$(u))
    throw Error(
      "\uCD5C\uC885 \uC601\uC0C1\uC758 Google Drive \uC6D0\uBCF8 \uB9C1\uD06C\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  let i = T(e, o, n);
  if (i.pending || i.unchecked)
    throw Error(
      "\uC9C4\uD589 \uC911\uC778 \uC774\uBBF8\uC9C0 \uC218\uC815\uBCF8\uC744 \uBA3C\uC800 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  return s.finalVideoUrl === u &&
    s.finalVideoAt &&
    i.family.every((a) => a.id === s.id || a.createdAt <= s.finalVideoAt)
    ? { request: s, reused: !0 }
    : ((s.finalVideoUrl = u),
      (s.finalVideoAt = r),
      (s.updatedAt = r),
      s.events.push({
        at: r,
        message: "\uC0AC\uC6A9\uC790\uAC00 \uCD5C\uC885 \uC601\uC0C1 \uC6D0\uBCF8 \uB9C1\uD06C \uC5F0\uACB0",
      }),
      { request: s, reused: !1 });
}
function lt(e, t, u, r = new Date().toISOString()) {
  let s = e.contents.find((C) => C.id === t),
    o = s && y(e, s);
  if (!o || s.format !== "Reel" || !$(u))
    throw Error(
      "\uC2B9\uC778\uB41C \uB9B4\uC2A4\uC640 \uCD5C\uC885 \uC601\uC0C1\uC758 Google Drive \uC6D0\uBCF8 \uB9C1\uD06C\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  let n = T(e, s, o);
  if (n.root || !n.legacyConfirmed)
    throw Error(
      "\uAE30\uC874 \uC774\uBBF8\uC9C0 \uBB36\uC74C\uC758 \uD655\uC778 \uAE30\uB85D\uC744 \uBA3C\uC800 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
    );
  let i = e.state.finalVideos?.[t];
  if (
    i?.version === o.version &&
    i.driveUrl === u &&
    JSON.stringify(i.sections) === JSON.stringify(o.sections)
  )
    return { video: i, reused: !0 };
  let a = { version: o.version, sections: structuredClone(o.sections), driveUrl: u, at: r };
  return (
    ((e.state.finalVideos ||= {})[t] = a),
    e.state.events.push({
      at: r,
      message:
        s.product +
        " \xB7 \uC0AC\uC6A9\uC790\uAC00 \uCD5C\uC885 \uC601\uC0C1 \uC6D0\uBCF8 \uB9C1\uD06C \uC5F0\uACB0",
    }),
    { video: a, reused: !1 }
  );
}
function pt(e, t, u, r = new Date().toISOString()) {
  let s = e.contents.find((d) => d.id === t),
    o = s && y(e, s);
  if (!o) throw Error("\uC2B9\uC778\uB41C \uC6D0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  let n = T(e, s, o);
  if (!ie(e, s, o, n))
    throw Error(
      "\uCD5C\uC885 \uC774\uBBF8\uC9C0 \uD655\uC778\uACFC \uC601\uC0C1 \uC6D0\uBCF8 \uC5F0\uACB0\uC744 \uBA3C\uC800 \uB9C8\uCCD0\uC8FC\uC138\uC694.",
    );
  let i;
  try {
    i = new URL(u);
  } catch {}
  if (
    !i ||
    i.protocol !== "https:" ||
    ![
      "instagram.com",
      "www.instagram.com",
      "tiktok.com",
      "www.tiktok.com",
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
    ].includes(i.hostname) ||
    i.pathname === "/" ||
    i.pathname.length < 3 ||
    u.length > 600
  )
    throw Error(
      "\uC2E4\uC81C SNS \uAC8C\uC2DC\uBB3C\uC758 \uB9C1\uD06C\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  let a = J(e, s, o, n);
  if (a?.url === i.href) return { publication: a, reused: !0 };
  let C = {
    contentId: t,
    version: o.version,
    sections: structuredClone(o.sections),
    mediaSignature: ye(n),
    url: i.href,
    at: r,
    source: "user",
  };
  return (
    (e.state.publications ||= []).push(C),
    e.state.events.push({
      at: r,
      message: s.product + " \xB7 SNS \uAC8C\uC2DC\uBB3C \uB9C1\uD06C \uC9C1\uC811 \uB4F1\uB85D",
    }),
    { publication: C, reused: !1 }
  );
}
function ft(e) {
  return (
    e !== null &&
    typeof e == "object" &&
    !Array.isArray(e) &&
    Object.keys(e).every((t) => ["Reel", "Carousel", "Image"].includes(t)) &&
    ["Reel", "Carousel", "Image"].every(
      (t) => typeof e[t] == "string" && e[t].trim().length > 0 && e[t].length <= 12e3,
    )
  );
}
function le(e, t) {
  let u = (o) => o !== null && typeof o == "object" && !Array.isArray(o),
    r = (o) => typeof o == "string",
    s = (o) => r(o) && Number.isFinite(Date.parse(o));
  if (
    !u(e) ||
    !u(e.approvals) ||
    !u(e.finals) ||
    !Array.isArray(e.notes) ||
    !Array.isArray(e.events) ||
    (e.writingPrompts !== void 0 && !ft(e.writingPrompts))
  )
    return !1;
  if (e.approvalHolds !== void 0) {
    if (!u(e.approvalHolds)) return !1;
    for (let [o, n] of Object.entries(e.approvalHolds)) {
      let i = t.find((a) => a.id === o);
      if (
        !i ||
        !u(n) ||
        !r(n.version) ||
        !i.reviews.some((a) => a.version === n.version) ||
        !s(n.at) ||
        e.approvals[o]
      )
        return !1;
    }
  }
  for (let [o, n] of Object.entries(e.approvals)) {
    let i = t.find((a) => a.id === o);
    if (
      !i ||
      !u(n) ||
      !s(n.at) ||
      n.source !== "site" ||
      !i.reviews.some(
        (a) => a.version === n.version && JSON.stringify(a.sections) === JSON.stringify(n.sections),
      )
    )
      return !1;
  }
  for (let [o, n] of Object.entries(e.finals)) {
    let i = t.find((a) => a.id === o);
    if (
      !i ||
      !u(n) ||
      !s(n.at) ||
      n.version !== i.originalVersion ||
      JSON.stringify(n.files) !== JSON.stringify(i.images.map((a) => a.id))
    )
      return !1;
  }
  if (
    !e.notes.every(
      (o) => u(o) && t.some((n) => n.id === o.id) && r(o.target) && r(o.text) && o.text.trim() && s(o.at),
    ) ||
    (e.publications !== void 0 &&
      (!Array.isArray(e.publications) ||
        !e.publications.every(
          (o) =>
            u(o) &&
            r(o.contentId) &&
            r(o.version) &&
            Array.isArray(o.sections) &&
            r(o.mediaSignature) &&
            r(o.url) &&
            s(o.at) &&
            o.source === "user",
        ))) ||
    (e.finalVideos !== void 0 &&
      (!u(e.finalVideos) ||
        !Object.values(e.finalVideos).every(
          (o) => u(o) && r(o.version) && Array.isArray(o.sections) && r(o.driveUrl) && s(o.at),
        )))
  )
    return !1;
  if (e.storyboards !== void 0) {
    if (!u(e.storyboards)) return !1;
    for (let [o, n] of Object.entries(e.storyboards)) {
      let i = t.find((a) => a.id === o);
      if (!i || !u(n)) return !1;
      for (let [a, C] of Object.entries(n))
        if (
          !i.reviews.some((d) => d.version === a) ||
          !u(C) ||
          !s(C.updatedAt) ||
          !Array.isArray(C.scenes) ||
          C.scenes.length < 1 ||
          C.scenes.length > 20 ||
          !C.scenes.every(
            (d) =>
              u(d) &&
              r(d.timing) &&
              d.timing.length <= 60 &&
              r(d.visual) &&
              d.visual.length <= 2e3 &&
              r(d.subtitle) &&
              d.subtitle.length <= 2e3 &&
              r(d.prompt) &&
              d.prompt.length <= 5e3 &&
              r(d.reference) &&
              d.reference.length <= 1e3 &&
              (d.motion === void 0 || (r(d.motion) && d.motion.length <= 2e3)),
          )
        )
          return !1;
    }
  }
  return e.events.every((o) => u(o) && s(o.at) && r(o.message));
}
var w = (e, t) =>
  e.contents.find((u) => u.id === t) ||
  (() => {
    throw Error("\uCF58\uD150\uCE20\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  })();
function v(e, t) {
  let u = structuredClone(e),
    r = t(u);
  if (!le(u.state, u.contents))
    throw Error("\uC800\uC7A5 \uC0C1\uD0DC \uAC80\uC99D \uC2E4\uD328(validState)");
  return { w: u, result: r };
}
function rr(e, t, u) {
  let r;
  try {
    r = JSON.parse(u);
  } catch (o) {
    throw Error("JSON \uD615\uC2DD \uC624\uB958: " + o.message);
  }
  if (r.content_id !== t) throw Error("content_id \uBD88\uC77C\uCE58");
  let s = structuredClone(r.strategyV2 || {});
  return (
    (s.quality = { ...(s.quality || {}), humanConfirmed: !1 }),
    v(e, (o) => ve(o, { content_id: t, strategy: s }))
  );
}
function ur(e, t, u) {
  return v(e, (r) => {
    let s = w(r, t),
      o = structuredClone(s.plan.strategyV2);
    return (u(o, s), ve(r, { content_id: t, strategy: o }));
  });
}
var sr = (e, t, u) =>
    v(e, (r) => {
      let s = w(r, t);
      (s.plan.productFacts ||= []).push(u);
    }),
  Bt = (e) =>
    e.plan?.strategyV2 ? me(e.plan.strategyV2, e.plan.productFacts) : { ready: !0, legacy: !0, reasons: [] };
function or(e) {
  if (typeof e != "string" || !e.trim()) return "";
  let t = e.replace(/\.json$/i, "").trim(),
    u = t.match(/(?:^|[_\-\s.])([ABC])(?:안)?$/i);
  return u ? u[1].toUpperCase() + "\uC548" : t.slice(0, 30);
}
var mt = (e, t, u, r) => {
  let s = w(e, t).reviews.find((o) => o.version === u);
  s && r && (s.label = r);
};
function vt(e) {
  if (typeof e != "string") return { rest: e, comments: null };
  let t = e.trim(),
    u = /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/i.exec(
      t.replace(
        /\r\n/g,
        `
`,
      ),
    );
  u && (t = u[1]);
  let r;
  try {
    r = JSON.parse(t);
  } catch {
    return { rest: e, comments: null };
  }
  if (!r || typeof r != "object" || Array.isArray(r) || !("comments" in r))
    return { rest: e, comments: null };
  let s = r.comments;
  delete r.comments;
  let o = Array.isArray(s)
    ? s.map((n) => (typeof n == "string" ? n : n && typeof n.text == "string" ? n.text : null))
    : null;
  if (!o || o.length > 10 || o.some((n) => typeof n != "string" || !n.trim() || n.length > 300))
    throw Error(
      "comments: \uC608\uC0C1 \uB313\uAE00\uC740 1~300\uC790 \uBB38\uC790\uC5F4 \uBAA9\uB85D(\uCD5C\uB300 10\uAC1C)\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.",
    );
  return { rest: JSON.stringify(r), comments: o.map((n) => n.trim()) };
}
var nr = (e, t, u, r = "") =>
  v(e, (s) => {
    let { rest: o, comments: n } = vt(u),
      i = De(o, t),
      a = Ee(s, {
        content_id: t,
        script: i.script,
        caption: i.caption,
        ...(i.storyboard ? { storyboard_scenes: i.storyboard } : {}),
      });
    return (
      mt(s, t, a.version, or(r)),
      n?.length && (w(s, t).reviews.find((C) => C.version === a.version).expectedComments = n),
      a
    );
  });
var pe = (e, t) => {
  let u = e.reviews.find((r) => r.version === t);
  return u?.label ? u.label : t;
};
function ir(e, t, u) {
  return v(e, (r) => {
    let s = w(r, t),
      o = Bt(s);
    if (!o.ready) throw Error("\uAE30\uD68D \uAC8C\uC774\uD2B8 \uBBF8\uD1B5\uACFC: " + o.reasons.join(" / "));
    let n = s.reviews.find((C) => C.version === u);
    if (!n) throw Error("\uC6D0\uACE0 \uBC84\uC804\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    Ae(r.state, t);
    let i = r.state.approvals[t];
    i && (r.state.approvalHistory ||= []).push({ contentId: t, ...structuredClone(i) });
    let a = new Date().toISOString();
    ((r.state.approvals[t] = { version: u, sections: structuredClone(n.sections), at: a, source: "site" }),
      r.state.events.push({ at: a, message: s.product + " \xB7 " + u + " \uC6D0\uACE0 \uD655\uC815" }),
      P(r));
    for (let C of r.revisionRequests)
      C.contentId !== t ||
        C.kind !== "script" ||
        ["approved", "withdrawn"].includes(k(r, C)) ||
        xe(r, C) ||
        ((C.status = "withdrawn"),
        (C.withdrawnAt = a),
        (C.events ||= []).push({
          at: a,
          message:
            "\uC0AC\uC6A9\uC790\uAC00 " +
            u +
            "\uB97C \uD655\uC815\uD558\uC5EC \uC774\uC804 \uC218\uC815 \uC694\uCCAD \uC885\uB8CC (\uC6D0\uBB38\xB7\uC218\uC815\uBCF8 \uBCF4\uC874)",
        }));
    gt(r);
  });
}
function gt(e) {
  for (let t of e.revisionRequests || []) {
    let u = k(e, t);
    (u === "approved" || u === "withdrawn") && t.status !== u && (t.status = u);
  }
}
var ar = (e, t, u) => v(e, (r) => We(r, { content_id: t, version: u })),
  Dt = [
    "purpose",
    "action",
    "camera_angle",
    "shot_size",
    "composition",
    "product_position",
    "start_frame",
    "end_frame",
    "image_criteria",
  ];
function Cr(e, t) {
  if (!e || typeof e != "object") return null;
  let u = {};
  for (let r of Dt)
    if (e[r] !== void 0) {
      if (typeof e[r] != "string" || !e[r].trim() || e[r].length > 600)
        throw Error(
          `storyboard[${t}].${r}: 1~600\uC790 \uBB38\uC790\uC5F4\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.`,
        );
      u[r] = e[r].trim();
    }
  return Object.keys(u).length ? u : null;
}
function dr(e, t, u) {
  let r;
  try {
    r = JSON.parse(u);
  } catch (s) {
    throw Error("JSON \uD615\uC2DD \uC624\uB958: " + s.message);
  }
  return v(e, (s) => {
    let o = w(s, t),
      n = y(s, o);
    if (!n) throw Error("\uD655\uC815\uB41C \uC6D0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
    if (r.content_id !== t || r.script_version !== n.version)
      throw Error(
        "content_id/script_version\uC774 \uD655\uC815 \uC6D0\uACE0(" +
          n.version +
          ")\uC640 \uB2E4\uB985\uB2C8\uB2E4.",
      );
    if (!Array.isArray(r.storyboard))
      throw Error("storyboard: \uC7A5\uBA74 \uBC30\uC5F4\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
    let i = r.storyboard.map((c, p) => Cr(c, p)),
      a = r.storyboard.map((c) =>
        Object.fromEntries(Object.entries(c || {}).filter(([p]) => !Dt.includes(p))),
      ),
      C = te(a),
      d = he(C).map((c, p) => (i[p] ? { ...c, shot: i[p] } : c));
    ((s.state.storyboards ||= {})[t] ||= {})[n.version] = {
      scenes: d,
      updatedAt: new Date().toISOString(),
      source: "storyboard-json",
    };
  });
}
var ke = (e, t, u) =>
    e.state.storyboards?.[t.id]?.[u.version] ||
    (t.originalVersion === u.version && (t.scenes || []).length ? { scenes: t.scenes, legacy: !0 } : null),
  cr = (e, t, u) => !u.root && !!u.legacyImages && e.originalVersion === t.version;
function lr(e, t, u) {
  return v(e, (r) => {
    let s = w(r, t),
      o = y(r, s);
    if (!o) throw Error("\uD655\uC815\uB41C \uC6D0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
    if (s.format === "Reel") {
      let i = r.state.storyboards?.[t]?.[o.version];
      if (!i)
        throw Error(
          "\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\uB97C \uBA3C\uC800 \uC800\uC7A5\uD574\uC8FC\uC138\uC694.",
        );
      let a = de(r, { content_id: t, version: o.version, scope: "scenes" }).request,
        C = o.sections.map((d) => d.text).join(`
`);
      return (
        Re(r, a.id, {
          drive_folder: u,
          slots: i.scenes.map((d, c) => ({
            id: "scene-" + (c + 1),
            label: "\uC7A5\uBA74 " + (c + 1),
            source_text: C,
            prompt: d.visual,
            requires_product: !1,
            reference_urls: [],
          })),
        }),
        a.id
      );
    }
    let n = de(r, { content_id: t, version: o.version }).request;
    if (!n.slots.length)
      throw Error(
        s.format === "Carousel"
          ? "\uCE90\uB7EC\uC140 \uC6D0\uACE0\uC5D0 \uC7A5 \uAD6C\uBD84(\uBE48 \uC904)\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC6D0\uACE0\uB97C \uC7A5\uBCC4\uB85C \uB098\uB220 \uB2E4\uC2DC \uAC00\uC838\uC640\uC8FC\uC138\uC694."
          : "\uC774\uBBF8\uC9C0 \uC6D0\uACE0\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
      );
    return (
      Re(r, n.id, {
        drive_folder: u,
        slots: n.slots.map((i) => ({
          id: i.id,
          label: i.label,
          source_text: i.sourceText,
          prompt:
            Fe.slice(0, 400) +
            `
\uC7A5 \uB0B4\uC6A9: ` +
            i.sourceText.slice(0, 2e3),
          requires_product: !1,
          reference_urls: [],
        })),
      }),
      n.id
    );
  });
}
function pr(e, t) {
  return v(e, (u) => {
    let r = w(u, t),
      s = y(u, r);
    if (!s || s.version !== r.originalVersion)
      throw Error(
        "\uD604\uC7AC \uD655\uC815 \uC6D0\uACE0\uC5D0 \uD574\uB2F9\uD558\uB294 \uAE30\uC874 \uC774\uBBF8\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
      );
    if (!(r.images || []).length || r.images.some((n) => !n.url))
      throw Error(
        "Drive \uC6D0\uBCF8\uC774 \uBAA8\uB450 \uC5F0\uACB0\uB41C \uC774\uBBF8\uC9C0\uC5D0\uC11C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
      );
    let o = new Date().toISOString();
    ((u.state.finals[t] = { version: r.originalVersion, files: r.images.map((n) => n.id), at: o }),
      u.state.events.push({
        at: o,
        message: r.product + " \xB7 " + r.originalVersion + " \uC774\uBBF8\uC9C0 \uBB36\uC74C \uD655\uC778",
      }));
  });
}
var fr = (e, t, u) => v(e, (r) => lt(r, t, u));
function ht(e, t) {
  let u = (C, d, c = "", p = "action") => ({ k: C, l: d, why: c, lane: p }),
    r = Bt(t);
  if (!r.ready)
    return u("plan", "\uAE30\uD68D \uAC80\uC218", r.reasons[0], t.plan?.strategyV2 ? "action" : "waiting");
  let s = y(e, t);
  if (!s)
    return t.reviews.length
      ? u("script", "\uC6D0\uACE0 \uD655\uC815")
      : u(
          "script",
          "\uC6D0\uACE0 \uC791\uC131 \uB300\uAE30",
          "\uC6D0\uACE0 JSON \uAC00\uC838\uC624\uAE30 \uD544\uC694",
          "waiting",
        );
  let o = (e.revisionRequests || []).find(
    (C) => C.contentId === t.id && C.kind === "script" && !["approved", "withdrawn"].includes(k(e, C)),
  );
  if (o)
    return k(e, o) === "review"
      ? u(
          "script",
          "\uC218\uC815\uBCF8 \uAC80\uD1A0",
          "\uC218\uC815\uBCF8\uC744 \uBE44\uAD50\uD55C \uB4A4 \uD655\uC815\uD558\uAC70\uB098 \uCCA0\uD68C\uD558\uC138\uC694",
        )
      : u(
          "script",
          "\uC218\uC815\uBCF8 \uB300\uAE30",
          "\uC791\uAC00 \uC218\uC815\uBCF8\uC744 \uAE30\uB2E4\uB9AC\uB294 \uC911 \xB7 \uC694\uCCAD: " +
            o.text.slice(0, 40),
          "waiting",
        );
  let n = t.format === "Reel",
    i = T(e, t, s),
    a = cr(t, s, i);
  if (n && !a && !i.root && !ke(e, t, s))
    return u(
      "storyboard",
      "\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC \uC791\uC131 \uB300\uAE30",
      "\uD655\uC815 \uC6D0\uACE0 \uAE30\uC900 \uC2A4\uD1A0\uB9AC\uBCF4\uB4DC JSON \uD544\uC694",
      "waiting",
    );
  if (i.root) {
    if (i.pending)
      return u(
        "images",
        "\uC774\uBBF8\uC9C0 \uC81C\uC791 \uB300\uAE30",
        "\uC81C\uC791 \uB610\uB294 \uC218\uC815\uBCF8 \uB300\uAE30",
        "waiting",
      );
    if (i.needsSelection)
      return u(
        "images",
        "\uC774\uBBF8\uC9C0 \uC120\uD0DD",
        "\uCEF7\uB9C8\uB2E4 \uC0AC\uC6A9\uD560 \uC774\uBBF8\uC9C0\uB97C \uACE8\uB77C\uC8FC\uC138\uC694",
      );
    if (!i.ready) return u("images", "\uC774\uBBF8\uC9C0 \uC804\uCCB4 \uD655\uC815");
  } else if (a) {
    if (!i.legacyConfirmed)
      return u(
        "images",
        "\uAE30\uC874 \uC774\uBBF8\uC9C0 \uD655\uC778",
        "\uAE30\uC874 \uC774\uBBF8\uC9C0 " +
          i.legacyImages +
          "\uC7A5\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694",
      );
  } else return u("images", "\uC774\uBBF8\uC9C0 \uC81C\uC791 \uC694\uCCAD");
  if (n) {
    if (i.root) {
      if (!K(e, t.id, s.version).scenes.every((d) => d.prompt_status === "current"))
        return u(
          "video",
          "Higgsfield \uD504\uB86C\uD504\uD2B8",
          "\uCEF7\uBCC4 \uD504\uB86C\uD504\uD2B8 \uAC80\uC99D\xB7\uC800\uC7A5 \uD544\uC694",
        );
      if (!i.root.finalVideoUrl)
        return u(
          "video",
          "\uC601\uC0C1 \uB9C1\uD06C \uAE30\uB85D",
          "\uC644\uC131 \uC601\uC0C1\uC758 Drive \uC6D0\uBCF8 \uB9C1\uD06C \uD544\uC694",
        );
    } else if (!i.finalVideoUrl)
      return u(
        "video",
        "\uC601\uC0C1 \uB9C1\uD06C \uAE30\uB85D",
        "\uC644\uC131 \uC601\uC0C1\uC758 Drive \uC6D0\uBCF8 \uB9C1\uD06C \uD544\uC694",
      );
  }
  return ie(e, t, s, i)
    ? J(e, t, s, i)
      ? u("done", "\uC644\uB8CC", "", "done")
      : u(
          "publish",
          "\uAC8C\uC2DC \uB9C1\uD06C \uAE30\uB85D",
          "\uC2E4\uC81C \uAC8C\uC2DC \uD6C4 \uB9C1\uD06C\uB97C \uAE30\uB85D\uD558\uC138\uC694",
        )
    : u("video", "\uC601\uC0C1 \uB9C1\uD06C \uD655\uC778");
}
function Br(e, t, u, r) {
  return v(e, (s) => {
    let o = s.productionRequests.find((n) => n.id === t);
    (!o.slots.find((n) => n.id === u)?.asset &&
      o.slots.find((n) => n.id === u)?.state === "pending" &&
      ut(s, t, u),
      st(s, t, u, r));
  });
}
var mr = (e, t, u, r, s) => v(e, (o) => ot(o, t, u, r, s)),
  vr = (e, t) => v(e, (u) => nt(u, t)),
  Ne = (e, t, u) => K(e, t, u);
function gr(e, t) {
  return v(e, (u) => {
    let r = u.productionRequests.find((d) => d.id === t);
    if (!r)
      throw Error(
        "\uC774\uBBF8\uC9C0 \uC81C\uC791 \uC694\uCCAD\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
      );
    let s = O(u.productionRequests, r),
      o = s.root;
    if (!s.family.some((d) => d.reviewedAt))
      throw Error("\uD655\uC815\uB41C \uC774\uBBF8\uC9C0 \uBB36\uC74C\uC774 \uC544\uB2D9\uB2C8\uB2E4.");
    let n = w(u, o.snapshot.contentId),
      i = y(u, n);
    if (i && i.version === o.snapshot.version && J(u, n, i, T(u, n, i)))
      throw Error(
        "\uC774\uBBF8 \uAC8C\uC2DC \uAE30\uB85D\uC774 \uC788\uC5B4 \uC774\uBBF8\uC9C0 \uD655\uC815\uC744 \uD574\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
      );
    let a = new Date().toISOString(),
      C = !!o.finalVideoAt;
    for (let d of s.family)
      d.reviewedAt &&
        (delete d.reviewedAt,
        (d.updatedAt = a),
        (d.events ||= []).push({
          at: a,
          message: "\uC0AC\uC6A9\uC790\uAC00 \uC774\uBBF8\uC9C0 \uD655\uC815 \uD574\uC81C",
        }));
    (delete o.finalVideoAt,
      u.state.events.push({
        at: a,
        message:
          n.product +
          " \xB7 \uC774\uBBF8\uC9C0 \uD655\uC815 \uD574\uC81C" +
          (C
            ? " (\uC601\uC0C1 \uB9C1\uD06C\uB294 \uB2E4\uC2DC \uD655\uC815 \uD6C4 \uC7AC\uAE30\uB85D \uD544\uC694)"
            : ""),
      }));
  });
}
function Dr(e, t) {
  return v(e, (u) => {
    let r = w(u, t),
      s = y(u, r);
    if (!u.state.finals[t])
      throw Error(
        "\uD655\uC778\uB41C \uAE30\uC874 \uC774\uBBF8\uC9C0 \uBB36\uC74C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
      );
    if (s && J(u, r, s, T(u, r, s)))
      throw Error(
        "\uC774\uBBF8 \uAC8C\uC2DC \uAE30\uB85D\uC774 \uC788\uC5B4 \uD655\uC778\uC744 \uD574\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
      );
    (delete u.state.finals[t],
      u.state.events.push({
        at: new Date().toISOString(),
        message: r.product + " \xB7 \uAE30\uC874 \uC774\uBBF8\uC9C0 \uBB36\uC74C \uD655\uC778 \uD574\uC81C",
      }));
  });
}
function At(e) {
  let t = e.scene.timing.match(/([\d.]+)s?\s*[–—~−-]\s*([\d.]+)/),
    u = Number(t[2]) - Number(t[1]),
    r = "[\uC9C1\uC811 \uD655\uC778 \uD6C4 \uC791\uC131]",
    s = e.scene.shot || {},
    o = (...i) => i.filter(Boolean).join(" / ") || r,
    n = {
      "SCENE CONTEXT": o(s.purpose && "\uBAA9\uC801: " + s.purpose, e.scene.visual),
      "ACTIVE REFERENCES": "\uD655\uC815 \uC774\uBBF8\uC9C0 \uC6D0\uBCF8 " + e.image.original_url,
      WARDROBE: r,
      "LOCATION MAP": r,
      "FIRST FRAME / BLOCKING": o(
        s.start_frame,
        s.composition,
        s.product_position && "\uC81C\uD488: " + s.product_position,
      ),
      "FORMAT MODE": "9:16 vertical",
      OPTICS: r,
      CAMERA: o(s.camera_angle, s.shot_size),
      ACTION: "0.0s " + e.scene.motion + " / " + u.toFixed(1) + "s",
      PERFORMANCE: r,
      PHYSICS: r,
      LIGHTING: "natural light, low-saturation cream/warm-gray/olive",
      STYLE: "smartphone-shot daily life photo feel",
      "POSITIVE LOCKS": "no text, logo, subtitle, watermark; product shape from original reference",
      AUDIO: "ambient sound and sound effects only; no voice, no music, no subtitles",
      "END FRAME": s.end_frame || r,
      TIMING: u.toFixed(1) + "s",
    };
  return [...V, ...G].map((i) => i + ": " + n[i]).join(`
`);
}
var hr = (e, t, u, r, s) =>
    v(e, (o) =>
      it(o, {
        content_id: t,
        version: u,
        scene_id: r.scene_id,
        request_id: r.image.request_id,
        image_version: r.image.image_version,
        original_url: r.image.original_url,
        prompt: s,
      }),
    ),
  Ar = (e, t, u) => v(e, (r) => ct(r, t, u)),
  Er = (e, t, u) => v(e, (r) => pt(r, t, u)),
  yr = (e, t, u, r, s) =>
    v(e, (o) => {
      let n = y(o, w(o, t));
      return de(o, { content_id: t, version: n.version, parent_id: u, slot_id: r, note: s }).request.id;
    }),
  br = (e, t, u = "\uC0AC\uC6A9\uC790 \uBCF4\uAD00") =>
    v(e, (r) => {
      let s = r.contents.findIndex((n) => n.id === t);
      if (s < 0)
        throw Error(
          "\uBCF4\uAD00\uD560 \uCF58\uD150\uCE20\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        );
      let o = ue(r, r.contents[s]);
      return ((o.reason = u), r.contents.splice(s, 1), o.key);
    }),
  wr = (e, t) => v(e, (u) => ce(u, t)),
  xr = (e, t, u, r) => v(e, (s) => Xe(s, { content_id: t, version: u, text: r, kind: "script" }).request.id);
function _r(e, t, u, r) {
  return v(e, (s) => {
    P(s);
    let o = s.revisionRequests.find((c) => c.id === t);
    if (!o) throw Error("\uC218\uC815 \uC694\uCCAD\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    if (typeof r != "string" || !r.trim())
      throw Error("\uBCC0\uACBD \uC694\uC57D\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    let { rest: n, comments: i } = vt(u),
      a = De(n, o.contentId),
      C = Ee(s, { content_id: o.contentId, script: a.script, caption: a.caption });
    (i?.length && (w(s, o.contentId).reviews.find((c) => c.version === C.version).expectedComments = i),
      mt(s, o.contentId, C.version, "\uC218\uC815\uBCF8 (" + pe(w(s, o.contentId), o.version) + ")"));
    let d = Qe(s, t).request;
    return (
      Ze(s, { request_id: t, claim: d.claim, response_version: C.version, change_summary: r.trim() }),
      C.version
    );
  });
}
var Sr = (e, t) =>
  v(e, (u) => {
    (et(u, t), gt(u));
  });
var Fr = (e, t) =>
    v(e, (u) => Ct(u, t, { confirm: "\uD734\uC9C0\uD1B5\uC73C\uB85C \uC774\uB3D9", strict: !0 })),
  Ir = (e, t) => v(e, (u) => dt(u, t, { confirm: "\uC120\uD0DD \uD56D\uBAA9 \uBCF5\uC6D0" })),
  Rr = /^ISHARD[-\w]+$/,
  Or = /^\d{4}-\d{2}-\d{2}$/;
function kr(e, t) {
  return v(e, (u) => {
    let r = String(t.id || "").trim(),
      s = String(t.topic || "").trim(),
      o = String(t.product || "").trim(),
      n = String(t.drive || "").trim();
    if (!Rr.test(r) || r.length > 80)
      throw Error(
        "\uCF58\uD150\uCE20 ID\uB294 ISHARD\uB85C \uC2DC\uC791\uD558\uACE0 \uC601\uBB38\xB7\uC22B\uC790\xB7-\xB7_\uB9CC \uC0AC\uC6A9\uD574\uC8FC\uC138\uC694.",
      );
    if (u.contents.some((i) => i.id === r) || (u.trash || []).some((i) => i.content?.id === r))
      throw Error(
        "\uC774\uBBF8 \uC788\uB294 \uCF58\uD150\uCE20 ID\uC785\uB2C8\uB2E4(\uD734\uC9C0\uD1B5 \uD3EC\uD568).",
      );
    if (!Or.test(t.date || "") || isNaN(Date.parse(t.date)))
      throw Error("\uAC8C\uC2DC\uC77C\uC744 YYYY-MM-DD\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
    if (!["Reel", "Carousel", "Image"].includes(t.format))
      throw Error(
        "\uD615\uC2DD\uC740 \uB9B4\uC2A4\xB7\uCE90\uB7EC\uC140\xB7\uC774\uBBF8\uC9C0 \uC911 \uD558\uB098\uC785\uB2C8\uB2E4.",
      );
    if (!s || s.length > 200 || o.length > 100)
      throw Error(
        "\uC8FC\uC81C(1~200\uC790)\uC640 \uC81C\uD488\uBA85(100\uC790 \uC774\uB0B4)\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
      );
    if (n && !$(n, !0))
      throw Error(
        "Drive \uD3F4\uB354 \uB9C1\uD06C\uB294 https://drive.google.com/drive/folders/\u2026 \uD615\uC2DD\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.",
      );
    return (
      u.contents.push({
        id: r,
        date: t.date,
        product: o || "-",
        format: t.format,
        topic: s,
        plan: {},
        reviews: [],
        originalVersion: "",
        sourceApproval: "\uB300\uAE30",
        production: "\uBBF8\uCC29\uC218",
        drive: n,
        images: [],
        scenes: [],
      }),
      u.contents.sort((i, a) => i.date.localeCompare(a.date) || i.id.localeCompare(a.id)),
      u.state.events.push({
        at: new Date().toISOString(),
        message: r + " \xB7 \uC0C8 \uCF58\uD150\uCE20 \uB4F1\uB85D",
      }),
      r
    );
  });
}
function Nr(e, t, u, r) {
  return ur(e, t, (s, o) => {
    let n = s.quality;
    if (u === "fit") {
      let i = o.plan.productFacts || [];
      if (!i.length)
        throw Error("\uACF5\uC2DD \uADFC\uAC70\uB97C \uBA3C\uC800 \uB4F1\uB85D\uD558\uC138\uC694.");
      ((s.fit.verification = "verified"), (s.fit.sourceIds = i.map((a) => a.id)));
    } else if (u === "text") ((n.claimReview = "pass"), (n.duplicateReview = "pass"));
    else if (u === "human") n.humanConfirmed = !0;
    else if (u === "score") {
      if (!r || typeof r != "object") throw Error("\uC810\uC218\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      n.scores = r;
    } else throw Error("\uC54C \uC218 \uC5C6\uB294 \uAC80\uC218 \uB3D9\uC791\uC785\uB2C8\uB2E4.");
  });
}
function $r(e, t, u, r, s = "") {
  let o = /\/file\/d\/([\w-]+)/.exec(String(r || ""));
  if (!o || !$(r))
    throw Error(
      "Drive \uD30C\uC77C \uB9C1\uD06C(https://drive.google.com/file/d/\u2026/view)\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
    );
  return Br(e, t, u, {
    fileName: String(s || u + ".png").slice(0, 200),
    driveUrl: r,
    previewKey: "drive/" + o[1],
  });
}
function Tr(e, t, u, r) {
  let s = w(e, t),
    o = y(e, s);
  if (!o) throw Error("\uD655\uC815\uB41C \uC6D0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  let n = K(e, t, o.version).scenes.find((i) => i.scene_id === u);
  if (!n || !n.image)
    throw Error(
      "\uD655\uC815\uB41C \uC7A5\uBA74 \uC774\uBBF8\uC9C0\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    );
  if (String(r).includes("[\uC9C1\uC811 \uD655\uC778 \uD6C4 \uC791\uC131]"))
    throw Error(
      '"[\uC9C1\uC811 \uD655\uC778 \uD6C4 \uC791\uC131]" \uD56D\uBAA9\uC744 \uBA3C\uC800 \uCC44\uC6CC\uC8FC\uC138\uC694.',
    );
  return hr(e, t, o.version, n, r);
}
var $e = {
  createContent: (e, t) => kr(e, t),
  importStrategy: (e, t) => rr(e, t.id, t.text),
  addFact: (e, t) =>
    sr(e, t.id, {
      id: String(t.fact?.id || "").trim(),
      fact: String(t.fact?.fact || "").trim(),
      source: String(t.fact?.source || "").trim(),
    }),
  reviewStrategy: (e, t) => Nr(e, t.id, t.kind, t.scores),
  importScript: (e, t) => nr(e, t.id, t.text, t.fileName),
  approve: (e, t) => ir(e, t.id, t.version),
  release: (e, t) => ar(e, t.id, t.version),
  requestScriptRevision: (e, t) => xr(e, t.id, t.version, t.text),
  answerRevision: (e, t) => _r(e, t.requestId, t.text, t.summary),
  withdrawScriptRevision: (e, t) => Sr(e, t.requestId),
  saveStoryboard: (e, t) => dr(e, t.id, t.text),
  requestImages: (e, t) => lr(e, t.id, t.folder),
  registerImage: (e, t) => $r(e, t.requestId, t.slotId, t.url, t.fileName),
  pick: (e, t) => mr(e, t.rootId, t.slotId, t.candidateId, t.previewKey),
  confirmImages: (e, t) => vr(e, t.rootId),
  unconfirmImages: (e, t) => gr(e, t.rootId),
  requestRevision: (e, t) => yr(e, t.id, t.rootId, t.slotId, t.note),
  confirmLegacyImages: (e, t) => pr(e, t.id),
  unconfirmLegacyImages: (e, t) => Dr(e, t.id),
  saveHiggsScene: (e, t) => Tr(e, t.id, t.sceneId, t.prompt),
  finalVideo: (e, t) => Ar(e, t.rootId, t.url),
  legacyVideo: (e, t) => fr(e, t.id, t.url),
  publish: (e, t) => Er(e, t.id, t.url),
  archive: (e, t) => br(e, t.id),
  restore: (e, t) => wr(e, t.key),
  bulkArchive: (e, t) => Fr(e, { ids: t.ids }),
  bulkRestore: (e, t) => Ir(e, t.keys),
  updatePlan: (e, t) => __ishardUpdatePlan(e, t),
};
var b = class extends Error {
  constructor(t, u = 400, r = {}) {
    (super(t), (this.status = u), (this.extra = r));
  }
};
async function se(e, { name: t, args: u, revision: r, actor: s }) {
  let o = Object.prototype.hasOwnProperty.call($e, t) ? $e[t] : null;
  if (!o) throw new b("\uC54C \uC218 \uC5C6\uB294 \uB3D9\uC791\uC785\uB2C8\uB2E4.");
  for (let n = 0; n < 3; n++) {
    let i = await I(e);
    if (r !== void 0 && r !== i.revision)
      throw new b(
        "\uB2E4\uB978 \uC0AC\uB78C\uC774 \uBA3C\uC800 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uB0B4\uC6A9\uC73C\uB85C \uB2E4\uC2DC \uD655\uC778\uD574\uC8FC\uC138\uC694.",
        409,
        { conflict: !0, revision: i.revision, workspace: i.workspace },
      );
    let a;
    try {
      a = o(i.workspace, { ...(u || {}) });
    } catch (d) {
      throw new b(d.message);
    }
    if (!le(a.w.state, a.w.contents)) throw new b("\uC800\uC7A5 \uC0C1\uD0DC \uAC80\uC99D \uC2E4\uD328");
    a.w.state.events.push({ at: new Date().toISOString(), message: `${s} \xB7 ${t}` });
    let C = await He(e, i.rev, i.workspace, a.w);
    if (!C.conflict)
      return { revision: C.revision, workspace: a.w, result: a.result ?? null, changed: C.changed };
    if (r !== void 0) {
      let d = await I(e);
      throw new b(
        "\uB2E4\uB978 \uC0AC\uB78C\uC774 \uBA3C\uC800 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uB0B4\uC6A9\uC73C\uB85C \uB2E4\uC2DC \uD655\uC778\uD574\uC8FC\uC138\uC694.",
        409,
        { conflict: !0, revision: d.revision, workspace: d.workspace },
      );
    }
  }
  throw new b(
    "\uC800\uC7A5\uC774 \uACC4\uC18D \uACB9\uCCD0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.",
    409,
  );
}
var Et = 3600,
  qr = 720 * 3600,
  Vr = 300,
  Ur = 600,
  U = () => Math.floor(Date.now() / 1e3),
  W = (e = 32) => {
    let t = new Uint8Array(e);
    return (
      crypto.getRandomValues(t),
      btoa(String.fromCharCode(...t))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
    );
  },
  M = async (e) => {
    let t = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(e)));
    return btoa(String.fromCharCode(...t))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  },
  Te = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin" },
  qe = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Protocol-Version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  },
  Ve = (e, t = 200, u = {}) =>
    new Response(JSON.stringify(e), {
      status: t,
      headers: { "Content-Type": "application/json", ...Te, ...qe, ...u },
    }),
  F = (e, t, u = 400) => Ve({ error: e, error_description: t }, u),
  oe = (e) =>
    String(e ?? "").replace(
      /[&<>"']/g,
      (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[t],
    ),
  fe = ["studio.read", "studio.write"];
var bt = (e) => ({
    issuer: e,
    authorization_endpoint: e + "/authorize",
    token_endpoint: e + "/token",
    registration_endpoint: e + "/register",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: fe,
  }),
  wt = (e) => ({
    resource: e + "/mcp",
    authorization_servers: [e],
    scopes_supported: fe,
    bearer_methods_supported: ["header"],
    resource_name: "ISHARD \uC791\uC5C5\uC2E4",
  });
function jr(e) {
  try {
    let t = new URL(e);
    return t.hash || t.username || t.password
      ? !1
      : t.protocol === "https:" ||
          (t.protocol === "http:" && ["localhost", "127.0.0.1"].includes(t.hostname));
  } catch {
    return !1;
  }
}
var Lr = (e, t) => e.includes(t);
async function xt(e, t) {
  let u;
  try {
    u = await e.json();
  } catch {
    return F("invalid_client_metadata", "JSON \uD615\uC2DD \uC624\uB958");
  }
  let r = u.redirect_uris;
  if (
    !Array.isArray(r) ||
    !r.length ||
    r.length > 5 ||
    !r.every((a) => typeof a == "string" && a.length <= 500 && jr(a))
  )
    return F(
      "invalid_redirect_uri",
      "redirect_uris\uB294 https \uC8FC\uC18C 1~5\uAC1C\uC5EC\uC57C \uD569\uB2C8\uB2E4.",
    );
  let s = typeof u.client_name == "string" ? u.client_name.trim().slice(0, 100) : "";
  if ((await t.prepare("SELECT COUNT(*) AS n FROM oauth_clients").first()).n >= 500)
    return F("invalid_client_metadata", "\uB4F1\uB85D \uD55C\uB3C4 \uCD08\uACFC", 429);
  let o = "mcp_" + W(18),
    n = U(),
    i = { client_name: s || "\uC774\uB984 \uC5C6\uB294 \uC571", redirect_uris: r };
  return (
    await t
      .prepare("INSERT INTO oauth_clients(client_id, data, created) VALUES(?,?,?)")
      .bind(o, JSON.stringify(i), n)
      .run(),
    Ve(
      {
        client_id: o,
        client_id_issued_at: n,
        ...i,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
      201,
    )
  );
}
var L = (e, t, u = 200, r = "") =>
  new Response(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${oe(e)}</title><style>body{margin:0;font:15px/1.5 -apple-system,"Noto Sans KR",sans-serif;background:#f6f3ec;color:#2b2a26}main{max-width:440px;margin:40px auto;padding:20px}.card{background:#fff;border:1px solid #e3ddd0;border-radius:14px;padding:18px}h1{font-size:18px;margin:0 0 10px}.mut{color:#6f6b60;font-size:13px}ul{padding-left:18px}.row{display:flex;gap:8px;margin-top:14px}button{font:inherit;min-height:44px;padding:8px 16px;border-radius:10px;border:1px solid #e3ddd0;background:#fff;cursor:pointer;flex:1}button.p{background:#5f6849;border-color:#5f6849;color:#fff}code{word-break:break-all}@media(prefers-color-scheme:dark){body{background:#1d1c19;color:#ece8dc}.card,button{background:#262520;border-color:#3a382f;color:#ece8dc}.mut{color:#a7a293}button.p{background:#a5b07f;color:#1d1c19}}</style></head><body><main><div class="card">${t}</div></main></body></html>`,
    {
      status: u,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...Te,
        "X-Frame-Options": "DENY",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'" +
          (r ? " " + r : "") +
          "; frame-ancestors 'none'",
      },
    },
  );
async function _t(e, t, u, r) {
  let s = new URL(e.url),
    o = Object.fromEntries(s.searchParams),
    n = s.origin,
    i = await u
      .prepare("SELECT data FROM oauth_clients WHERE client_id=?")
      .bind(o.client_id || "")
      .first();
  if (!i)
    return L(
      "\uC5F0\uACB0 \uC624\uB958",
      '<h1>\uC5F0\uACB0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4</h1><p class="mut">\uB4F1\uB85D\uB418\uC9C0 \uC54A\uC740 \uC571\uC785\uB2C8\uB2E4.</p>',
      400,
    );
  let a = JSON.parse(i.data);
  if (!o.redirect_uri || !Lr(a.redirect_uris, o.redirect_uri))
    return L(
      "\uC5F0\uACB0 \uC624\uB958",
      '<h1>\uC5F0\uACB0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4</h1><p class="mut">\uB4F1\uB85D\uB41C \uC8FC\uC18C\uC640 \uB2E4\uB978 \uACF3\uC73C\uB85C \uB3CC\uC544\uAC00\uB824\uB294 \uC694\uCCAD\uC785\uB2C8\uB2E4.</p>',
      400,
    );
  let C = (E, x) => {
    let _ = new URL(o.redirect_uri);
    return (
      _.searchParams.set("error", E),
      x && _.searchParams.set("error_description", x),
      o.state && _.searchParams.set("state", o.state),
      _.searchParams.set("iss", n),
      Response.redirect(_.toString(), 302)
    );
  };
  if (o.response_type !== "code") return C("unsupported_response_type");
  if (
    !o.code_challenge ||
    o.code_challenge_method !== "S256" ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(o.code_challenge)
  )
    return C("invalid_request", "PKCE(S256) \uD544\uC694");
  if (o.resource && o.resource !== n + "/mcp") return C("invalid_target");
  let d = (o.scope || fe.join(" ")).split(/\s+/).filter(Boolean);
  if (!d.every((E) => fe.includes(E))) return C("invalid_scope");
  let c = await Z(e, t, r).catch(() => null);
  if (!c)
    return L(
      "\uB85C\uADF8\uC778 \uD544\uC694",
      '<h1>\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4</h1><p class="mut">\uC791\uC5C5\uC2E4 \uB85C\uADF8\uC778(Cloudflare Access)\uC744 \uBA3C\uC800 \uC644\uB8CC\uD574\uC8FC\uC138\uC694.</p>',
      401,
    );
  let p = await ee(u, t, c);
  if (!p) return C("access_denied", "\uC791\uC5C5\uC2E4 \uAD6C\uC131\uC6D0\uC774 \uC544\uB2D9\uB2C8\uB2E4");
  let m = p === "viewer" ? d.filter((E) => E !== "studio.write") : d,
    f = W(24);
  await u
    .prepare("INSERT INTO oauth_pending(id, data, expires) VALUES(?,?,?)")
    .bind(
      f,
      JSON.stringify({
        client_id: o.client_id,
        redirect_uri: o.redirect_uri,
        state: o.state || "",
        code_challenge: o.code_challenge,
        scope: m.join(" "),
        email: c,
      }),
      U() + Ur,
    )
    .run();
  let l = new URL(o.redirect_uri).host;
  return L(
    "ISHARD \uC791\uC5C5\uC2E4 \uC5F0\uACB0",
    `<h1>${oe(a.client_name)}\uC774(\uAC00) \uC791\uC5C5\uC2E4 \uC5F0\uACB0\uC744 \uC694\uCCAD\uD569\uB2C8\uB2E4</h1>
<p class="mut">\uB85C\uADF8\uC778: ${oe(c)} (${{ owner: "\uC18C\uC720\uC790", editor: "\uD3B8\uC9D1\uC790", viewer: "\uBCF4\uAE30 \uC804\uC6A9" }[p]})<br>\uB3CC\uC544\uAC08 \uC8FC\uC18C: <code>${oe(l)}</code></p>
<ul><li>\uCF58\uD150\uCE20\xB7\uD655\uC815 \uC6D0\uACE0\xB7\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\xB7\uD655\uC815 \uC774\uBBF8\uC9C0 \uB9C1\uD06C \uC77D\uAE30</li>${m.includes("studio.write") ? "<li>새 콘텐츠 추가, 원고 초안 저장(확정 아님), 확정 전 콘텐츠의 주제·게시일 변경</li><li>\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\uC640 Higgsfield \uD504\uB86C\uD504\uD2B8 \uC800\uC7A5(\uC11C\uBC84 \uADDC\uCE59 \uAC80\uC0AC\uB97C \uD1B5\uACFC\uD560 \uB54C\uB9CC)</li>" : ""}</ul>
<p class="mut">\uC6D0\uACE0 \uD655\uC815, \uC774\uBBF8\uC9C0 \uD655\uC815, \uC601\uC0C1 \uC0DD\uC131, \uAC8C\uC2DC\uB294 \uC774 \uC5F0\uACB0\uB85C \uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC5F0\uACB0\uC740 \uC5B8\uC81C\uB4E0 \uD574\uC81C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
<form method="post" action="/authorize"><input type="hidden" name="pending" value="${oe(f)}"><div class="row"><button name="decision" value="deny">\uAC70\uBD80</button><button class="p" name="decision" value="allow">\uD5C8\uC6A9</button></div></form>`,
    200,
    new URL(o.redirect_uri).origin,
  );
}
async function St(e, t, u, r) {
  let s = new URL(e.url).origin,
    o = e.headers.get("Origin"),
    n = e.headers.get("Sec-Fetch-Site");
  if (!(o === s || ((!o || o === "null") && n === "same-origin")))
    return L(
      "\uC5F0\uACB0 \uC624\uB958",
      "<h1>\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uC694\uCCAD\uC785\uB2C8\uB2E4</h1>",
      403,
    );
  let i = await e.formData(),
    a = String(i.get("pending") || ""),
    C = String(i.get("decision") || ""),
    d = await u.prepare("SELECT data, expires FROM oauth_pending WHERE id=?").bind(a).first();
  if (!d || d.expires < U())
    return L(
      "\uC5F0\uACB0 \uC624\uB958",
      '<h1>\uC694\uCCAD\uC774 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4</h1><p class="mut">\uC571\uC5D0\uC11C \uB2E4\uC2DC \uC5F0\uACB0\uD574\uC8FC\uC138\uC694.</p>',
      400,
    );
  await u.prepare("DELETE FROM oauth_pending WHERE id=?").bind(a).run();
  let c = JSON.parse(d.data),
    p = await Z(e, t, r).catch(() => null);
  if (!p || p !== c.email)
    return L(
      "\uC5F0\uACB0 \uC624\uB958",
      "<h1>\uB85C\uADF8\uC778\uD55C \uC0AC\uC6A9\uC790\uAC00 \uB2E4\uB985\uB2C8\uB2E4</h1>",
      403,
    );
  let m = new URL(c.redirect_uri);
  if ((c.state && m.searchParams.set("state", c.state), m.searchParams.set("iss", s), C !== "allow"))
    return (m.searchParams.set("error", "access_denied"), Response.redirect(m.toString(), 302));
  let f = W(32);
  return (
    await u
      .prepare("INSERT INTO oauth_codes(hash, data, expires) VALUES(?,?,?)")
      .bind(await M(f), JSON.stringify(c), U() + Vr)
      .run(),
    m.searchParams.set("code", f),
    Response.redirect(m.toString(), 302)
  );
}
async function yt(e, { email: t, client_id: u, scope: r }, s = W(16)) {
  let o = W(32),
    n = W(32),
    i = U();
  return (
    await e.batch([
      e
        .prepare(
          "INSERT INTO oauth_tokens(hash, kind, email, client_id, scope, family, expires, created) VALUES(?,?,?,?,?,?,?,?)",
        )
        .bind(await M(o), "access", t, u, r, s, i + Et, i),
      e
        .prepare(
          "INSERT INTO oauth_tokens(hash, kind, email, client_id, scope, family, expires, created) VALUES(?,?,?,?,?,?,?,?)",
        )
        .bind(await M(n), "refresh", t, u, r, s, i + qr, i),
      e.prepare("DELETE FROM oauth_tokens WHERE expires < ?").bind(i),
      e.prepare("DELETE FROM oauth_codes WHERE expires < ?").bind(i),
      e.prepare("DELETE FROM oauth_pending WHERE expires < ?").bind(i),
    ]),
    Ve({ access_token: o, token_type: "Bearer", expires_in: Et, refresh_token: n, scope: r })
  );
}
async function Ft(e, t) {
  let u;
  try {
    u = await e.formData();
  } catch {
    return F("invalid_request", "form \uD615\uC2DD \uD544\uC694");
  }
  let r = String(u.get("grant_type") || ""),
    s = String(u.get("client_id") || "");
  if (!(await t.prepare("SELECT 1 AS x FROM oauth_clients WHERE client_id=?").bind(s).first()))
    return F("invalid_client", "\uB4F1\uB85D\uB418\uC9C0 \uC54A\uC740 \uC571", 401);
  if (r === "authorization_code") {
    let o = String(u.get("code") || ""),
      n = await M(o),
      i = await t.prepare("SELECT data, expires FROM oauth_codes WHERE hash=?").bind(n).first();
    if (!i)
      return F("invalid_grant", "\uCF54\uB4DC\uAC00 \uC5C6\uAC70\uB098 \uC774\uBBF8 \uC0AC\uC6A9\uB428");
    await t.prepare("DELETE FROM oauth_codes WHERE hash=?").bind(n).run();
    let a = JSON.parse(i.data);
    if (i.expires < U() || a.client_id !== s || a.redirect_uri !== String(u.get("redirect_uri") || ""))
      return F("invalid_grant", "\uCF54\uB4DC \uC815\uBCF4\uAC00 \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4");
    let C = String(u.get("code_verifier") || "");
    return !/^[A-Za-z0-9._~-]{43,128}$/.test(C) || (await M(C)) !== a.code_challenge
      ? F("invalid_grant", "PKCE \uD655\uC778 \uC2E4\uD328")
      : yt(t, a);
  }
  if (r === "refresh_token") {
    let o = await M(String(u.get("refresh_token") || "")),
      n = await t.prepare("SELECT * FROM oauth_tokens WHERE hash=? AND kind='refresh'").bind(o).first();
    return !n || n.client_id !== s
      ? F(
          "invalid_grant",
          "\uAC31\uC2E0 \uD1A0\uD070\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
        )
      : n.expires < U()
        ? F("invalid_grant", "\uAC31\uC2E0 \uD1A0\uD070 \uB9CC\uB8CC")
        : (await t.prepare("DELETE FROM oauth_tokens WHERE family=?").bind(n.family).run(),
          yt(t, n, n.family));
  }
  return F("unsupported_grant_type", "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBC29\uC2DD");
}
async function It(e, t, u) {
  let r = /^Bearer\s+([A-Za-z0-9_-]{20,200})$/.exec(e.headers.get("Authorization") || "");
  if (!r) return null;
  let s = await u
    .prepare("SELECT email, client_id, scope, expires FROM oauth_tokens WHERE hash=? AND kind='access'")
    .bind(await M(r[1]))
    .first();
  if (!s || s.expires < U()) return null;
  let o = await ee(u, t, s.email);
  if (!o) return null;
  let n =
      o === "viewer"
        ? s.scope
            .split(" ")
            .filter((a) => a !== "studio.write")
            .join(" ")
        : s.scope,
    i = await u.prepare("SELECT data FROM oauth_clients WHERE client_id=?").bind(s.client_id).first();
  return {
    email: s.email,
    role: o,
    scope: n,
    client_id: s.client_id,
    client_name: i ? JSON.parse(i.data).client_name : "",
  };
}
var Rt = (e) =>
    new Response(
      JSON.stringify({
        error: "invalid_token",
        error_description: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...Te,
          ...qe,
          "WWW-Authenticate": `Bearer resource_metadata="${e}/.well-known/oauth-protected-resource"`,
        },
      },
    ),
  Ot = () => new Response(null, { status: 204, headers: { ...qe, "Access-Control-Max-Age": "600" } });
var kt = ["2025-06-18", "2025-03-26", "2024-11-05"],
  A = { type: "string" },
  Hr = [
    "9:16 \uC138\uB85C, \uCEF7\uBCC4 \uBCC4\uB3C4 \uC601\uC0C1. \uD655\uC815 \uC774\uBBF8\uC9C0\uB97C \uCCAB \uD504\uB808\uC784 \uCC38\uC870\uB85C \uC0AC\uC6A9.",
    "\uC601\uC0C1 \uC548 \uAE00\uC528\xB7\uB85C\uACE0\xB7\uC790\uB9C9\xB7\uC6CC\uD130\uB9C8\uD06C \uAE08\uC9C0. \uC74C\uC131\xB7\uC74C\uC545 \uAE08\uC9C0, \uD658\uACBD\uC74C\xB7\uD6A8\uACFC\uC74C\uB9CC.",
    "\uC2A4\uB9C8\uD2B8\uD3F0\uC73C\uB85C \uCC0D\uC740 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uC0DD\uD65C \uC601\uC0C1, \uC790\uC5F0\uAD11, \uC800\uCC44\uB3C4 \uD06C\uB9BC\xB7\uC6DC\uADF8\uB808\uC774\xB7\uC62C\uB9AC\uBE0C \uC0C9\uAC10. \uACFC\uD55C \uC2A4\uD29C\uB514\uC624 \uAD11\uACE0 \uC5F0\uCD9C \uAE08\uC9C0.",
    "\uC2E4\uC81C \uC81C\uD488\uC740 \uC6D0\uBCF8 \uCC38\uACE0 \uC774\uBBF8\uC9C0\uC758 \uD615\uD0DC\xB7\uC0C9\xB7\uB77C\uBCA8\uC744 \uBC14\uAFB8\uC9C0 \uC54A\uC74C. \uC815\uBA74 \uC5BC\uAD74\uC740 \uAC00\uAE09\uC801 \uD53C\uD568.",
    "\uD6A8\uB2A5\xB7\uD6C4\uAE30\xB7\uCE58\uB8CC \uD6A8\uACFC\uB97C \uC5F0\uAE30\uB85C \uC554\uC2DC\uD558\uC9C0 \uC54A\uC74C.",
    "17\uC139\uC158 \uC601\uC5B4 \uD504\uB86C\uD504\uD2B8: 14\uAC1C \uAE30\uBCF8 \uC139\uC158 + AUDIO \xB7 END FRAME \xB7 TIMING. ACTION\uC740 0.0s\uC5D0\uC11C \uC2DC\uC791\uD574 \uCEF7 \uAE38\uC774\uC5D0\uC11C \uB05D\uB0A8. ACTIVE REFERENCES\uC5D0 \uD655\uC815 \uC774\uBBF8\uC9C0 original_url \uADF8\uB300\uB85C \uD3EC\uD568.",
  ],
  Nt = [
    {
      name: "read_branding_workspace",
      title: "\uC791\uC5C5\uC2E4 \uD604\uD669 \uC77D\uAE30",
      annotations: { readOnlyHint: !0 },
      description:
        "Read a compact list of ISHARD contents with date, format, topic, current stage and the approved script version. Use read_storyboard_context for one content in detail. Does not change data.",
      inputSchema: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            description: "Optional filter: plan, script, storyboard, images, video, publish, done",
          },
        },
        additionalProperties: !1,
      },
    },
    {
      name: "read_storyboard_context",
      title: "\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\xB7\uD655\uC815 \uC774\uBBF8\uC9C0 \uC77D\uAE30",
      annotations: { readOnlyHint: !0 },
      description:
        "Read one Reel: approved script and caption (never edit them), storyboard scenes with shot details, the selected and confirmed image per scene (Drive original_url), saved Higgsfield prompts, brand rules and a 17-section prompt template. version defaults to the approved version. Before writing prompts, open each confirmed image (e.g. via a Google Drive connector using drive_file_id) and describe what is actually visible.",
      inputSchema: {
        type: "object",
        properties: { content_id: A, version: A },
        required: ["content_id"],
        additionalProperties: !1,
      },
    },
    {
      name: "read_content_brief",
      title: "기획·원고 현황 읽기",
      annotations: { readOnlyHint: !0 },
      description:
        "Read one content's full planning brief before writing a script: plan (purpose, life context, trend signals and sources, reference videos, hook directions, verified product facts, forbidden claims, response hypothesis), existing script versions with their text, open revision requests and the approved version. Also lists other contents of the same product so a new draft does not repeat the same scene or opening. Does not change data.",
      inputSchema: {
        type: "object",
        properties: { content_id: { type: "string" } },
        required: ["content_id"],
        additionalProperties: !1,
      },
    },
    {
      name: "save_higgsfield_scene_prompt",
      title: "Higgsfield \uD504\uB86C\uD504\uD2B8 \uC800\uC7A5",
      annotations: { readOnlyHint: !1, destructiveHint: !1, idempotentHint: !0 },
      description:
        'Save one final English Higgsfield prompt (17 sections: 14 base + AUDIO, END FRAME, TIMING) for one scene of the approved Reel version, bound to its confirmed image. All scene images must be confirmed by a person first. ACTION starts at 0.0s and ends at the scene duration; ACTIVE REFERENCES must include the exact original_url; AUDIO allows ambient sound and sound effects only. No "[\uC9C1\uC811 \uD655\uC778 \uD6C4 \uC791\uC131]" placeholders. Saving does not generate video or spend credits; a person reviews it on the site. History is append-only.',
      inputSchema: {
        type: "object",
        properties: {
          content_id: A,
          scene_id: A,
          prompt: A,
          version: A,
          request_id: A,
          image_version: A,
          original_url: A,
          revision: { type: "integer" },
        },
        required: ["content_id", "scene_id", "prompt"],
        additionalProperties: !1,
      },
    },
    {
      name: "save_storyboard",
      title: "\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC \uC800\uC7A5",
      annotations: { readOnlyHint: !1, destructiveHint: !1 },
      description:
        'Save a storyboard for the approved script version of a Reel (replaces the board for that version). Scenes: scene_id "scene-N" in order, duration_seconds (total \u2264 60), image (what the frame shows), motion, and optional shot fields: purpose, action, camera_angle, shot_size, composition, product_position, start_frame, end_frame, image_criteria. Vary camera angles (front, 45\xB0, POV, top view, over-the-shoulder, skin-texture close-up); do not assign one cut per script sentence mechanically. Never changes the script or approval.',
      inputSchema: {
        type: "object",
        properties: {
          content_id: A,
          script_version: A,
          storyboard: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: {
              type: "object",
              properties: {
                scene_id: A,
                duration_seconds: { type: "number" },
                image: A,
                motion: A,
                purpose: A,
                action: A,
                camera_angle: A,
                shot_size: A,
                composition: A,
                product_position: A,
                start_frame: A,
                end_frame: A,
                image_criteria: A,
              },
              required: ["scene_id", "duration_seconds", "image", "motion"],
              additionalProperties: !1,
            },
          },
        },
        required: ["content_id", "storyboard"],
        additionalProperties: !1,
      },
    },
    {
      name: "create_content",
      title: "새 콘텐츠 추가",
      annotations: { readOnlyHint: !1, destructiveHint: !1 },
      description:
        "Add one new ISHARD content plan item (date, format, product, topic). content_id must start with ISHARD and be unique, e.g. ISHARD-<productNo>-<YYYYMMDD>-<R|C|I><NN> as in read_branding_workspace. Does not write a script and never approves anything.",
      inputSchema: {
        type: "object",
        properties: {
          content_id: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD" },
          format: { type: "string", enum: ["Reel", "Carousel", "Image"] },
          product: { type: "string", description: "Product name as used on the site, max 100 chars" },
          topic: { type: "string", description: "1-200 chars" },
        },
        required: ["content_id", "date", "format", "product", "topic"],
        additionalProperties: !1,
      },
    },
    {
      name: "save_script_draft",
      title: "원고 초안 저장",
      annotations: { readOnlyHint: !1, destructiveHint: !1 },
      description:
        "Save a new script draft (spoken script or slide text, plus caption) for one content. Each call appends a new version labelled as a Claude draft; earlier versions, approvals and production stay unchanged. Never approves: a person reviews and confirms the script on the site. Write within ISHARD brand rules: no medical or treatment claims, no exaggerated before/after, only facts verifiable from the product page.",
      inputSchema: {
        type: "object",
        properties: {
          content_id: { type: "string" },
          script: { type: "string", description: "Full script text, 1-20,000 chars" },
          caption: { type: "string", description: "Instagram caption, max 8,000 chars" },
          label: {
            type: "string",
            description: "Optional variant label shown on the site: A, B or C",
            enum: ["A", "B", "C"],
          },
          comments: {
            type: "array",
            description: "Optional expected viewer comments (fictional examples, not real reviews), up to 10, each max 300 chars",
            items: { type: "string" },
            maxItems: 10,
          },
        },
        required: ["content_id", "script"],
        additionalProperties: !1,
      },
    },
    {
      name: "update_content_plan",
      title: "주제·게시일 변경",
      annotations: { readOnlyHint: !1, destructiveHint: !1 },
      description:
        "Change the topic and/or date of one content whose script has never been confirmed and whose production has not started. content_id stays the same. Give at least one of topic or date.",
      inputSchema: {
        type: "object",
        properties: {
          content_id: { type: "string" },
          date: { type: "string", description: "New date, YYYY-MM-DD" },
          topic: { type: "string", description: "New topic, 1-200 chars" },
        },
        required: ["content_id"],
        additionalProperties: !1,
      },
    },
  ],
  Jr = new Set([
    "save_higgsfield_scene_prompt",
    "save_storyboard",
    "create_content",
    "save_script_draft",
    "update_content_plan",
  ]),
  Be = (e) => ({
    content: [{ type: "text", text: typeof e == "string" ? e : JSON.stringify(e) }],
    ...(typeof e == "object" ? { structuredContent: e } : {}),
  }),
  j = (e) => ({ content: [{ type: "text", text: e }], isError: !0 }),
  Pr = (e) => (/\/file\/d\/([\w-]+)/.exec(e || "") || [])[1] || null;
function contentBrief(e, t) {
  let c = e.contents.find((x) => x.id === t);
  if (!c) throw new b("콘텐츠를 찾지 못했습니다: " + t);
  let st = ht(e, c),
    ap = y(e, c),
    open = (e.revisionRequests || []).filter(
      (x) => x.contentId === c.id && !["approved", "withdrawn"].includes(k(e, x)),
    );
  return {
    content_id: c.id,
    date: c.date,
    format: c.format,
    product: c.product,
    topic: c.topic,
    stage: st.k,
    next: st.l,
    plan: c.plan || {},
    approved_version: ap?.version || null,
    versions: (c.reviews || []).map((v) => ({
      version: v.version,
      label: v.label || null,
      author: v.author || null,
      created_at: v.createdAt || null,
      script: (v.sections || []).map((x) => x.text).join("\n"),
      caption: v.caption || "",
    })),
    open_revision_requests: open.map((x) => ({ id: x.id, version: x.version, kind: x.kind, text: x.text })),
    same_product_contents: e.contents
      .filter((x) => x.id !== c.id && x.product === c.product)
      .map((x) => ({ content_id: x.id, date: x.date, format: x.format, topic: x.topic })),
    writing_rules:
      "대본·캡션만 작성(스토리보드·카메라·컷 제외). 제품 사실은 plan.productFacts 범위 안에서 고객 상황에 필요한 것만 직접 설명하고, 상세페이지를 중계하는 말투('~로 안내되는 제품이에요')나 기능성·분류 나열은 쓰지 않는다. 효과 보장·미검증 사용감·가짜 경험·후기 창작 금지. A/B/C는 서로 다른 생활 출발점과 전개. 저장은 save_script_draft(label A/B/C)로 초안만, 확정은 사람이 사이트에서 한다.",
  };
}
function zr(e, t) {
  return {
    contents: e.contents
      .map((u) => {
        let r = ht(e, u),
          s = y(e, u);
        return {
          content_id: u.id,
          date: u.date,
          format: u.format,
          product: u.product,
          topic: u.topic,
          stage: r.k,
          next: r.l,
          needs_person: r.lane === "action",
          approved_version: s?.version || null,
          approved_label: s ? pe(u, s.version) : null,
        };
      })
      .filter((u) => !t || u.stage === t),
  };
}
function $t(e, t, u) {
  let r = e.contents.find((d) => d.id === t);
  if (!r) throw new b("\uCF58\uD150\uCE20\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: " + t);
  if (r.format !== "Reel")
    throw new b(
      "\uB9B4\uC2A4\uB9CC \uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\xB7\uC601\uC0C1 \uB2E8\uACC4\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
    );
  let s = y(e, r),
    o = u || s?.version;
  if (!o)
    throw new b(
      "\uD655\uC815\uB41C \uC6D0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0AC\uB78C\uC774 \uC0AC\uC774\uD2B8\uC5D0\uC11C \uC6D0\uACE0\uB97C \uBA3C\uC800 \uD655\uC815\uD574\uC57C \uD569\uB2C8\uB2E4.",
    );
  let n = r.reviews.find((d) => d.version === o);
  if (!n) throw new b("\uC6D0\uACE0 \uBC84\uC804\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: " + o);
  let i = s && s.version === o ? ke(e, r, s) : e.state.storyboards?.[r.id]?.[o] || null,
    a = Ne(e, r.id, o),
    C = (i?.scenes || []).map((d, c) => {
      let p = a.scenes[c];
      return {
        scene_id: "scene-" + (c + 1),
        timing: d.timing,
        visual: d.visual,
        motion: d.motion || "",
        shot: d.shot || null,
        image: p?.image
          ? {
              request_id: p.image.request_id,
              image_version: p.image.image_version,
              original_url: p.image.original_url,
              drive_file_id: Pr(p.image.original_url),
            }
          : null,
        image_confirmed: !!p?.confirmed,
        prompt_status: p?.prompt_status || "missing",
        saved_prompt: p?.prompt?.prompt || null,
        prompt_template: p?.image ? At(p) : null,
      };
    });
  return {
    content_id: r.id,
    product: r.product,
    date: r.date,
    topic: r.topic,
    version: o,
    version_label: pe(r, o),
    approved: s?.version === o,
    script: n.sections.map((d) => d.text).join(`
`),
    caption: n.caption || "",
    storyboard_saved: !!i,
    scenes: C,
    images_ready: a.ready,
    missing: a.missing,
    held_by_script_revision: a.held,
    next_step: i
      ? a.ready
        ? "\uAC01 \uD655\uC815 \uC774\uBBF8\uC9C0\uB97C \uC9C1\uC811 \uD655\uC778\uD55C \uB4A4 \uCEF7\uBCC4\uB85C save_higgsfield_scene_prompt\uB97C \uD638\uCD9C\uD558\uC138\uC694."
        : "\uC0AC\uB78C\uC774 \uC0AC\uC774\uD2B8\uC5D0\uC11C \uC7A5\uBA74 \uC774\uBBF8\uC9C0\uB97C \uBAA8\uB450 \uC120\uD0DD\xB7\uD655\uC815\uD574\uC57C \uD504\uB86C\uD504\uD2B8\uB97C \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      : "\uC2A4\uD1A0\uB9AC\uBCF4\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4(save_storyboard).",
    higgsfield_prompt_sections: [...V, ...G],
    brand_rules: Hr,
  };
}
async function Gr(e, t, u, r) {
  if (u === "read_branding_workspace") return Be(zr((await I(e)).workspace, r.stage));
  if (u === "read_storyboard_context") return Be($t((await I(e)).workspace, r.content_id, r.version));
  if (u === "read_content_brief") return Be(contentBrief((await I(e)).workspace, r.content_id));
  if (!t.scope.split(" ").includes("studio.write"))
    return j(
      "\uBCF4\uAE30 \uC804\uC6A9 \uC5F0\uACB0\uC774\uB77C \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    );
  let s = `${t.email} \xB7 MCP(${t.client_name || t.client_id})`;
  if (u === "create_content") {
    let o = await se(e, {
      name: "createContent",
      args: {
        id: r.content_id,
        date: r.date,
        format: r.format,
        product: r.product,
        topic: r.topic,
        drive: "",
      },
      actor: s,
    });
    return Be({
      saved: !0,
      content_id: o.result,
      date: r.date,
      format: r.format,
      next: "save_script_draft로 원고 초안을 저장할 수 있습니다. 원고 확정은 사이트에서 사람이 합니다.",
    });
  }
  if (u === "save_script_draft") {
    let o = await se(e, {
      name: "importScript",
      args: {
        id: r.content_id,
        text: JSON.stringify({
          content_id: r.content_id,
          script: r.script,
          caption: r.caption ?? "",
          ...(Array.isArray(r.comments) && r.comments.length ? { comments: r.comments } : {}),
        }),
        fileName: ["A", "B", "C"].includes(r.label) ? "Claude 초안 " + r.label : "Claude 초안",
      },
      actor: s,
    });
    return Be({
      saved: !0,
      content_id: r.content_id,
      version: o.result && o.result.version,
      approved: !1,
      next: "사이트에서 사람이 원고를 검토하고 확정합니다.",
    });
  }
  if (u === "update_content_plan") {
    if (r.date === void 0 && r.topic === void 0) return j("topic 또는 date 중 하나 이상을 입력해주세요.");
    let o = await se(e, {
      name: "updatePlan",
      args: { id: r.content_id, date: r.date, topic: r.topic },
      actor: s,
    });
    return Be({ saved: !0, ...o.result });
  }
  if (u === "save_higgsfield_scene_prompt") {
    let o = (await I(e)).workspace,
      n = $t(o, r.content_id);
    if (r.version && r.version !== n.version)
      return j(
        "\uD655\uC815 \uC6D0\uACE0 \uBC84\uC804(" +
          n.version +
          ")\uC758 \uD504\uB86C\uD504\uD2B8\uB9CC \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
      );
    let i = n.scenes.find((d) => d.scene_id === r.scene_id);
    if (!i) return j("\uC7A5\uBA74\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: " + r.scene_id);
    for (let d of ["request_id", "image_version", "original_url"])
      if (r[d] !== void 0 && i.image && r[d] !== i.image[d])
        return j(
          "\uD655\uC815 \uC774\uBBF8\uC9C0\uAC00 \uBC14\uB00C\uC5C8\uC2B5\uB2C8\uB2E4. read_storyboard_context\uB85C \uB2E4\uC2DC \uC77D\uC5B4\uC8FC\uC138\uC694.",
        );
    let a = await se(e, {
        name: "saveHiggsScene",
        args: { id: r.content_id, sceneId: r.scene_id, prompt: r.prompt },
        actor: s,
      }),
      C = Ne(a.workspace, r.content_id, n.version).scenes.find((d) => d.scene_id === r.scene_id);
    return Be({
      saved: !0,
      content_id: r.content_id,
      version: n.version,
      scene_id: r.scene_id,
      prompt_status: C?.prompt_status,
      review:
        "\uC0AC\uC774\uD2B8\uC758 \uC601\uC0C1 \uD0ED\uC5D0\uC11C \uC0AC\uB78C\uC774 \uD655\uC778\uD569\uB2C8\uB2E4. \uC601\uC0C1 \uC0DD\uC131\xB7\uBE44\uC6A9\uC740 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.",
    });
  }
  if (u === "save_storyboard") {
    let o = (await I(e)).workspace,
      n = o.contents.find((a) => a.id === r.content_id),
      i = n && y(o, n);
    return i
      ? r.script_version && r.script_version !== i.version
        ? j(
            "\uD655\uC815 \uC6D0\uACE0 \uBC84\uC804(" +
              i.version +
              ")\uC5D0\uB9CC \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
          )
        : (await se(e, {
            name: "saveStoryboard",
            args: {
              id: r.content_id,
              text: JSON.stringify({
                content_id: r.content_id,
                script_version: i.version,
                storyboard: r.storyboard,
              }),
            },
            actor: s,
          }),
          Be({
            saved: !0,
            content_id: r.content_id,
            version: i.version,
            scene_count: r.storyboard.length,
            next: "\uC0AC\uB78C\uC774 \uC0AC\uC774\uD2B8\uC5D0\uC11C \uC774\uBBF8\uC9C0 \uC81C\uC791 \uC694\uCCAD\uC744 \uB9CC\uB4E4\uACE0 \uC774\uBBF8\uC9C0\uB97C \uD655\uC815\uD569\uB2C8\uB2E4.",
          }))
      : j("\uD655\uC815\uB41C \uC6D0\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  return null;
}
async function Tt(e, t, u, r) {
  let s = u?.id ?? null,
    o = (a) => ({ jsonrpc: "2.0", id: s, result: a }),
    n = (a, C) => ({ jsonrpc: "2.0", id: s, error: { code: a, message: C } });
  if (!u || u.jsonrpc !== "2.0" || typeof u.method != "string") return n(-32600, "Invalid Request");
  if (u.id === void 0) return null;
  let i = u.params || {};
  switch (u.method) {
    case "initialize":
      return o({
        protocolVersion: kt.includes(i.protocolVersion) ? i.protocolVersion : kt[0],
        capabilities: { tools: { listChanged: !1 } },
        serverInfo: { name: "ishard-studio", title: "ISHARD \uC791\uC5C5\uC2E4", version: "1.0.0" },
        instructions:
          "ISHARD \uCF58\uD150\uCE20 \uC791\uC5C5\uC2E4. \uC77D\uAE30: read_branding_workspace, read_storyboard_context. \uC800\uC7A5: create_content, save_script_draft(원고 초안, 확정 아님), update_content_plan(확정 전 주제·게시일), save_storyboard, save_higgsfield_scene_prompt(\uC11C\uBC84 \uADDC\uCE59 \uAC80\uC0AC). \uC6D0\uACE0\xB7\uC774\uBBF8\uC9C0 \uD655\uC815, \uC601\uC0C1 \uC0DD\uC131, \uAC8C\uC2DC\uB294 \uC0AC\uB78C\uC774 \uC0AC\uC774\uD2B8\uC5D0\uC11C\uB9CC \uD569\uB2C8\uB2E4. \uC0AC\uC774\uD2B8: " +
          r,
      });
    case "ping":
      return o({});
    case "tools/list":
      return o({ tools: Nt.filter((a) => !Jr.has(a.name) || t.scope.includes("studio.write")) });
    case "tools/call": {
      let a = Nt.find((m) => m.name === i.name);
      if (!a) return n(-32602, "Unknown tool: " + i.name);
      let C = i.arguments || {};
      if (typeof C != "object" || Array.isArray(C)) return n(-32602, "arguments must be an object");
      let d = new Set(Object.keys(a.inputSchema.properties)),
        c = Object.keys(C).filter((m) => !d.has(m)),
        p = (a.inputSchema.required || []).filter((m) => C[m] === void 0 || C[m] === "");
      if (c.length || p.length)
        return o(
          j(
            `\uC785\uB825 \uD56D\uBAA9 \uD655\uC778: ${c.length ? "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD56D\uBAA9 " + c.join(", ") : ""}${p.length ? " \uB204\uB77D " + p.join(", ") : ""}`.trim(),
          ),
        );
      try {
        return o(await Gr(e, t, i.name, C));
      } catch (m) {
        if (m instanceof b) return o(j(m.message));
        throw m;
      }
    }
    default:
      return n(-32601, "Method not found: " + u.method);
  }
}
var Y = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "DENY",
  },
  g = (e, t = 200) =>
    new Response(JSON.stringify(e), {
      status: t,
      headers: { "Content-Type": "application/json; charset=utf-8", ...Y },
    }),
  Wr = new Set(["owner", "editor"]),
  Ue = 2e6,
  ds = {
    async fetch(e, t, u) {
      return Xr(e, t);
    },
  },
  Yr = new Set([
    "/mcp",
    "/token",
    "/register",
    "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/mcp",
  ]);
async function Xr(e, t, u = fetch) {
  let r = new URL(e.url),
    s = t.DB;
  if (Yr.has(r.pathname))
    return e.method === "OPTIONS"
      ? Ot()
      : r.pathname === "/.well-known/oauth-authorization-server" && e.method === "GET"
        ? g(bt(r.origin))
        : r.pathname.startsWith("/.well-known/oauth-protected-resource") && e.method === "GET"
          ? g(wt(r.origin))
          : r.pathname === "/register" && e.method === "POST"
            ? xt(e, s)
            : r.pathname === "/token" && e.method === "POST"
              ? Ft(e, s)
              : r.pathname === "/mcp"
                ? Zr(e, t, s, r)
                : g({ error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uBC29\uC2DD" }, 405);
  if (r.pathname === "/authorize") return e.method === "POST" ? St(e, t, s, u) : _t(e, t, s, u);
  let o = await Z(e, t, u).catch(() => null);
  if (!o)
    return r.pathname.startsWith("/api/")
      ? g({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401)
      : new Response("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", { status: 401, headers: Y });
  let n = await ee(s, t, o);
  if (!n)
    return r.pathname.startsWith("/api/")
      ? g(
          {
            error:
              "\uC774 \uC791\uC5C5\uC2E4\uC758 \uAD6C\uC131\uC6D0\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC18C\uC720\uC790\uC5D0\uAC8C \uCD08\uB300\uB97C \uC694\uCCAD\uD558\uC138\uC694.",
          },
          403,
        )
      : new Response("\uC811\uADFC \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", {
          status: 403,
          headers: Y,
        });
  if (e.method === "GET" && r.pathname === "/")
    return new Response(qt, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...Y,
        "Content-Security-Policy":
          "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://drive.google.com https://lh3.googleusercontent.com; connect-src 'self'; frame-ancestors 'none'",
      },
    });
  if (e.method === "GET" && r.pathname === "/api/me") return g({ email: o, role: n });
  if (e.method === "GET" && r.pathname === "/api/workspace") {
    let { revision: i, workspace: a } = await I(s);
    return g({ revision: i, workspace: a });
  }
  if (e.method === "POST") {
    if (
      e.headers.get("Origin") !== r.origin ||
      !(e.headers.get("Content-Type") || "").startsWith("application/json")
    )
      return g({ error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uC694\uCCAD\uC785\uB2C8\uB2E4." }, 403);
    if (Number(e.headers.get("Content-Length") || 0) > Ue)
      return g({ error: "\uC694\uCCAD\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4." }, 413);
    let a;
    try {
      let C = await e.text();
      if (C.length > Ue) return g({ error: "\uC694\uCCAD\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4." }, 413);
      a = JSON.parse(C);
    } catch {
      return g({ error: "JSON \uD615\uC2DD \uC624\uB958" }, 400);
    }
    if (r.pathname === "/api/action") {
      if (!Wr.has(n))
        return g(
          {
            error:
              "\uBCF4\uAE30 \uC804\uC6A9 \uACC4\uC815\uC740 \uBCC0\uACBD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
          },
          403,
        );
      if (!Number.isInteger(a.revision))
        return g({ error: "revision\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 400);
      try {
        let C = await se(s, { name: a.name, args: a.args, revision: a.revision, actor: o });
        return g({ revision: C.revision, workspace: C.workspace, result: C.result, changed: C.changed });
      } catch (C) {
        if (C instanceof b) return g({ error: C.message, ...C.extra }, C.status);
        throw C;
      }
    }
    if (r.pathname === "/api/members") {
      if (n !== "owner")
        return g(
          {
            error:
              "\uC18C\uC720\uC790\uB9CC \uAD6C\uC131\uC6D0\uC744 \uAD00\uB9AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
          },
          403,
        );
      let C = String(a.email || "")
        .trim()
        .toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(C))
        return g(
          { error: "\uC774\uBA54\uC77C \uD615\uC2DD\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694." },
          400,
        );
      if (t.OWNER_EMAIL && C === t.OWNER_EMAIL.toLowerCase())
        return g(
          {
            error:
              "\uC18C\uC720\uC790 \uC5ED\uD560\uC740 \uC124\uC815\uC5D0\uC11C\uB9CC \uBC14\uAFC0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
          },
          400,
        );
      if (a.role === "remove") await s.prepare("DELETE FROM members WHERE email=?").bind(C).run();
      else if (["editor", "viewer"].includes(a.role))
        await s
          .prepare(
            "INSERT INTO members(email, role, added_at) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET role=excluded.role",
          )
          .bind(C, a.role, new Date().toISOString())
          .run();
      else
        return g(
          { error: "\uC5ED\uD560\uC740 editor\xB7viewer\xB7remove \uC911 \uD558\uB098\uC785\uB2C8\uB2E4." },
          400,
        );
    }
  }
  if (r.pathname === "/api/members" && (e.method === "GET" || e.method === "POST")) {
    if (n !== "owner")
      return g(
        {
          error: "\uC18C\uC720\uC790\uB9CC \uAD6C\uC131\uC6D0\uC744 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        },
        403,
      );
    let { results: i } = await s.prepare("SELECT email, role, added_at FROM members ORDER BY email").all();
    return g({ owner: t.OWNER_EMAIL || null, members: i });
  }
  return g({ error: "\uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
}
var Qr = (e) =>
  new Set([
    "https://claude.ai",
    "https://chatgpt.com",
    "https://chat.openai.com",
    ...String(e.MCP_ALLOWED_ORIGINS || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  ]);
async function Zr(e, t, u, r) {
  if (e.method !== "POST")
    return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...Y } });
  let s = e.headers.get("Origin");
  if (s && s !== r.origin && !Qr(t).has(s))
    return g({ error: "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uCD9C\uCC98" }, 403);
  let o = await It(e, t, u);
  if (!o) return Rt(r.origin);
  let n;
  try {
    let C = await e.text();
    if (C.length > Ue) return g({ error: "\uC694\uCCAD\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4." }, 413);
    n = JSON.parse(C);
  } catch {
    return g({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }
  let i = Array.isArray(n) ? n : [n];
  if (!i.length || i.length > 20)
    return g({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }, 400);
  let a = [];
  for (let C of i)
    try {
      let d = await Tt(u, o, C, r.origin);
      d && a.push(d);
    } catch {
      a.push({ jsonrpc: "2.0", id: C?.id ?? null, error: { code: -32603, message: "Internal error" } });
    }
  return a.length ? g(Array.isArray(n) ? a : a[0]) : new Response(null, { status: 202, headers: Y });
}
export { ds as default, Xr as handle };
