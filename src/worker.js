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
        text: JSON.stringify({ content_id: r.content_id, script: r.script, caption: r.caption ?? "" }),
        fileName: "Claude 초안",
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
var qt =
  '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>ISHARD \uC791\uC5C5\uC2E4</title><style>\n:root{--bg:#f6f3ec;--fg:#2b2a26;--mut:#6f6b60;--card:#fff;--ln:#e3ddd0;--ac:#5f6849;--acs:#eef0e6;--bad:#a4402f;--badbg:#fbeeea;--warn:#8a6a1c;--warnbg:#fbf5e4;--ok:#3f6b3a;--okbg:#eef5ea;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);color-scheme:light}\n@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1d1c19;--fg:#ece8dc;--mut:#a7a293;--card:#262520;--ln:#3a382f;--ac:#a5b07f;--acs:#2f3326;--bad:#e08a78;--badbg:#3a2621;--warn:#d9b867;--warnbg:#352d1a;--ok:#9cc48f;--okbg:#22301f;color-scheme:dark}}\n:root[data-theme="dark"]{--bg:#1d1c19;--fg:#ece8dc;--mut:#a7a293;--card:#262520;--ln:#3a382f;--ac:#a5b07f;--acs:#2f3326;--bad:#e08a78;--badbg:#3a2621;--warn:#d9b867;--warnbg:#352d1a;--ok:#9cc48f;--okbg:#22301f;color-scheme:dark}\n*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,"Noto Sans KR","Malgun Gothic",sans-serif}\nmain{max-width:860px;margin:0 auto;padding:14px 16px 32px}h1{font-size:18px;margin:4px 0 12px}h2{font-size:14px;margin:14px 0 4px;color:var(--mut)}\n.card{background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:12px;margin:8px 0}.mut{color:var(--mut);font-size:13px}.bad{color:var(--bad)}.warn{color:var(--warn);font-size:13px}\n#msg{background:var(--badbg);color:var(--bad);position:sticky;top:env(safe-area-inset-top,0px);z-index:5}.okm{background:var(--okbg);color:var(--ok);border-color:transparent}\n.lock{color:var(--mut);background:transparent;border-style:dashed}.warnbox{background:var(--warnbg);color:var(--warn);border-color:transparent;font-size:13px}\nbutton,select{font:inherit;border:1px solid var(--ln);background:var(--card);color:var(--fg);border-radius:8px;padding:8px 12px;min-height:40px;cursor:pointer}button:disabled,input:disabled,textarea:disabled{opacity:.45;cursor:not-allowed}button.p{background:var(--ac);border-color:var(--ac);color:#fff}\n@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) button.p{color:#1d1c19}}:root[data-theme="dark"] button.p{color:#1d1c19}\nbutton:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:2px solid var(--ac);outline-offset:2px}\ntextarea,input[type=text]{width:100%;font:inherit;background:var(--bg);color:var(--fg);border:1px solid var(--ln);border-radius:8px;padding:8px;margin:4px 0}textarea{min-height:90px;font-size:13px}input[type=checkbox]{width:20px;height:20px;accent-color:var(--ac)}\n.tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}.tabs button{white-space:nowrap}.tabs .on{background:var(--ac);color:#fff;border-color:var(--ac)}.tabs.top{margin-bottom:8px}\n.n{display:inline-block;min-width:18px;padding:0 5px;border-radius:9px;background:var(--bad);color:#fff;font-size:11px;line-height:18px;text-align:center;margin-left:2px}\n.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tag{font-size:12px;border:1px solid var(--ln);border-radius:99px;padding:1px 8px;white-space:nowrap}.tag.done{background:var(--okbg);color:var(--ok);border-color:transparent}.tag.wait{color:var(--mut);border-style:dashed}.tag.bad{color:var(--bad);border-color:var(--bad)}\n.cid{overflow-wrap:anywhere}.next{margin:4px 0 8px}.hdr{display:flex;gap:8px;align-items:center}.hdr b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pre{white-space:pre-wrap;overflow-wrap:anywhere}.vid{font-size:11px;overflow-wrap:anywhere}.ver.appr{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac) inset}\n.seg{display:inline-flex;border:1px solid var(--ln);border-radius:10px;overflow:hidden;margin:6px 0}.seg button{border:0;border-radius:0}.seg .on{background:var(--acs);font-weight:600}\n.cmp{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(260px,1fr);gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px}.cmp>.card{scroll-snap-align:start;margin:0}.cmp.two{grid-auto-columns:minmax(220px,1fr);margin:8px 0}\n.kv{display:grid;grid-template-columns:max-content 1fr;gap:2px 10px;margin:8px 0 0;font-size:13px}.kv dt{color:var(--mut)}.kv dd{margin:0}\n.sw{width:64px;aspect-ratio:9/16;border-radius:8px;border:2px solid var(--ln);display:flex;align-items:end;justify-content:center;font-size:10px;padding:2px;text-align:center;color:#2b2a26}.sw.sel{border-color:var(--ac);outline:2px solid var(--ac)}\n.cand{display:flex;flex-direction:column;gap:4px;width:84px;align-items:stretch}.cand button{white-space:nowrap;padding:8px 4px;font-size:14px}.cand .sw{width:84px}.note{font-size:11px;line-height:1.3}\ninput[type=number]{width:100%;font:inherit;background:var(--bg);color:var(--fg);border:1px solid var(--ln);border-radius:8px;padding:8px;margin-top:2px}.scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:6px;margin-top:8px;align-items:end}.scores label,.ncg label{display:flex;flex-direction:column;font-size:12px;color:var(--mut)}.ncg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px 8px;margin:8px 0}.ncg .w{grid-column:1/-1}.ncg select{width:100%}.regrow{display:flex;gap:6px;align-items:center;margin:4px 0}.regrow input{margin:0}.who{text-align:right;margin:-4px 0 4px}details.ec{margin-top:8px;font-size:14px}details.ec ul{margin:6px 0;padding-left:18px}details.ec li{margin:2px 0}details.rv{margin-top:6px}details summary{cursor:pointer}details.rv summary{display:inline-flex;align-items:center;min-height:40px;padding:0 12px;border:1px solid var(--ln);border-radius:8px;list-style:none}details.rv summary::-webkit-details-marker{display:none}details.rv[open] summary{margin-bottom:6px}\n.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px}.cal>div{min-height:64px;border:1px solid var(--ln);border-radius:6px;padding:2px;font-size:11px;overflow:hidden;min-width:0}.cal .h{min-height:0;border:0;text-align:center;color:var(--mut)}\n.chip{display:block;width:100%;font-size:10px;min-height:0;padding:2px;margin-top:2px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chip.action{border-color:var(--ac)}.chip.waiting{border-style:dashed;color:var(--mut)}\n.tablewrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px}td,th{border-bottom:1px solid var(--ln);padding:6px 4px;text-align:left;vertical-align:top}th{color:var(--mut);font-weight:500}td button{white-space:nowrap;padding:8px 10px}\n.sel{background:var(--acs);border-color:transparent}.bp{display:grid;gap:8px;margin-top:8px}\n.feed{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.tile{aspect-ratio:3/4;border-radius:4px;border:1px dashed var(--ln);background:var(--card);display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;padding:6px;min-height:0;color:var(--fg)}.tile span{font-size:11px;color:var(--mut)}.tile small{font-size:11px;background:var(--card);border-radius:4px;padding:1px 4px}\n.logrow{display:grid;grid-template-columns:96px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid var(--ln);font-size:13px}\n.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 8px}.stats button{display:flex;flex-direction:column;align-items:flex-start;padding:10px 12px;min-height:64px}.stats b{font-size:22px;line-height:1.1}.stats span{font-size:12px;color:var(--mut)}\n.agenda{display:grid;grid-template-columns:64px 1fr auto;gap:8px;align-items:center;width:100%;text-align:left;margin:4px 0;padding:10px}.agenda .ad{font-size:13px;color:var(--mut)}.agenda .at{min-width:0;overflow:hidden}.agenda small{display:block;color:var(--mut);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.bnav,.sheet{display:none}\n@media(max-width:700px){main{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}.tabs.top{display:none}\n .bnav{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;left:0;right:0;bottom:0;z-index:10;background:var(--card);border-top:1px solid var(--ln);padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px))}\n .bnav button{border:0;background:transparent;min-height:48px;font-size:14px;border-radius:10px}.bnav .on{background:var(--acs);color:var(--ac);font-weight:600}\n .sheet{display:grid;gap:6px;position:fixed;left:8px;right:8px;bottom:calc(68px + env(safe-area-inset-bottom,0px));z-index:11;background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:8px;box-shadow:0 8px 24px rgba(0,0,0,.12)}.sheet button{text-align:left;min-height:48px}\n .cmp{grid-auto-columns:86%}.cmp.two{grid-auto-flow:row;grid-auto-columns:auto;overflow:visible}.cmp.two>.card+.card{margin-top:0}}\n</style></head><body><main id="app"></main><script>\n(()=>{var xe=Object.freeze({failure:"\\uC2E4\\uD328 \\uD68C\\uD53C\\uD615",statusquo:"\\uD604\\uC7AC \\uC81C\\uD488 \\uC720\\uC9C0\\uD615",tradeoff:"\\uC870\\uAC74 \\uCDA9\\uB3CC\\uD615",burden:"\\uAD00\\uB9AC \\uBD80\\uB2F4\\uD615",proof:"\\uADFC\\uAC70 \\uD655\\uC778\\uD615",confusion:"\\uC815\\uBCF4 \\uD63C\\uB780\\uD615"}),it=Object.freeze(["empathy","barrier","reframe","product_evidence","decision"]),or=Object.freeze(["psychology","fit","evidence","flow","novelty"]),nr=2e4,E=(e,t=1200)=>typeof e=="string"?e.trim().slice(0,t):"",L=e=>e!==null&&typeof e=="object"&&!Array.isArray(e),ir=(e,t)=>Object.prototype.hasOwnProperty.call(e,t);function at(e){if(!L(e)||JSON.stringify(e).length>nr)throw Error("\\uAE30\\uD68D JSON \\uAC1D\\uCCB4 \\uB610\\uB294 20KB \\uC774\\uD558 \\uC6A9\\uB7C9\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let t=e.core||{},r=e.persona||{},s=e.fit||{},o=e.quality||{};if(!L(t)||!L(r)||!L(s)||!L(o))throw Error("\\uAE30\\uD68D \\uD56D\\uBAA9\\uC740 \\uAC1D\\uCCB4\\uC5EC\\uC57C \\uD569\\uB2C8\\uB2E4.");let n=E(r.type,32);if(!ir(xe,n))throw Error("6\\uAC00\\uC9C0 \\uAD6C\\uB9E4\\uC2EC\\uB9AC \\uC720\\uD615 \\uC911 \\uD558\\uB098\\uB97C \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");let i=Array.isArray(e.flow)?e.flow:[];if(i.length>5||i.some((m,f)=>!L(m)||it[f]!==m.stage))throw Error("\\uCF58\\uD150\\uCE20 \\uC804\\uAC1C\\uB294 \\uC815\\uD574\\uC9C4 \\uC21C\\uC11C\\uC758 5\\uB2E8\\uACC4\\uB97C \\uC0AC\\uC6A9\\uD574\\uC8FC\\uC138\\uC694.");let a={},c=L(o.scores)?o.scores:{};for(let m of or){let f=c[m]??0;if(!Number.isInteger(f)||f<0||f>20)throw Error("\\uAE30\\uD68D \\uD3C9\\uAC00\\uB294 \\uD56D\\uBAA9\\uBCC4 0~20\\uC810\\uB9CC \\uAC00\\uB2A5\\uD569\\uB2C8\\uB2E4.");a[m]=f}let d=E(s.verification,32)||"pending";if(!["pending","verified","insufficient"].includes(d))throw Error("\\uC81C\\uD488 \\uAC80\\uC99D \\uC0C1\\uD0DC\\uAC00 \\uC62C\\uBC14\\uB974\\uC9C0 \\uC54A\\uC2B5\\uB2C8\\uB2E4.");let l=E(o.claimReview,20)||"pending",p=E(o.duplicateReview,20)||"pending";if(!["pending","pass","fail"].includes(l)||!["pending","pass","fail"].includes(p))throw Error("\\uAC80\\uC218 \\uC0C1\\uD0DC\\uAC00 \\uC62C\\uBC14\\uB974\\uC9C0 \\uC54A\\uC2B5\\uB2C8\\uB2E4.");let h=E(r.evidenceStatus,32)||"hypothesis";if(!["hypothesis","customer_data"].includes(h))throw Error("\\uACE0\\uAC1D \\uADFC\\uAC70 \\uAD6C\\uBD84\\uC774 \\uC798\\uBABB\\uB418\\uC5C8\\uC2B5\\uB2C8\\uB2E4.");return{version:2,core:{objective:E(t.objective),purchaseQuestion:E(t.purchaseQuestion),barrier:E(t.barrier),answer:E(t.answer),cta:E(t.cta)},persona:{type:n,trigger:E(r.trigger),desired:E(r.desired),preserve:E(r.preserve),currentAlternative:E(r.currentAlternative),objection:E(r.objection),evidenceStatus:h},fit:{customerCondition:E(s.customerCondition),productFeature:E(s.productFeature),selectionReason:E(s.selectionReason),verification:d,claimLimit:E(s.claimLimit),sourceIds:Array.isArray(s.sourceIds)?s.sourceIds.filter(m=>typeof m=="string").slice(0,12).map(m=>E(m,250)):[]},flow:it.map((m,f)=>({stage:m,text:E(i[f]?.text)})),quality:{scores:a,claimReview:l,duplicateReview:p,humanConfirmed:o.humanConfirmed===!0}}}function Oe(e,t=[]){if(!e)return{ready:!1,reasons:["\\uC0C8 \\uAD6C\\uB9E4\\uC2EC\\uB9AC \\uAE30\\uD68D\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4."]};let r=at(e),s=[];(!r.core.purchaseQuestion||!r.core.barrier||!r.core.answer)&&s.push("\\uD575\\uC2EC \\uAD6C\\uB9E4 \\uC9C8\\uBB38\\xB7\\uC7A5\\uBCBD\\xB7\\uB2F5\\uBCC0\\uC744 \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694."),(!r.persona.objection||!r.persona.desired)&&s.push("\\uACE0\\uAC1D\\uC758 \\uC6D0\\uD558\\uB294 \\uC870\\uAC74\\uACFC \\uAD6C\\uB9E4 \\uBC18\\uB860\\uC744 \\uC791\\uC131\\uD574\\uC8FC\\uC138\\uC694."),(!r.fit.productFeature||!r.fit.selectionReason)&&s.push("\\uC544\\uC774\\uC0E4\\uB4DC \\uC81C\\uD488 \\uD2B9\\uC9D5\\uACFC \\uC120\\uD0DD \\uC774\\uC720\\uB97C \\uC791\\uC131\\uD574\\uC8FC\\uC138\\uC694."),r.fit.verification!=="verified"&&s.push("\\uC81C\\uD488\\uACFC \\uACE0\\uAC1D\\uC758 \\uC5F0\\uACB0 \\uADFC\\uAC70\\uB97C \\uAC80\\uC99D\\uD574\\uC8FC\\uC138\\uC694."),(Array.isArray(t)?t.filter(a=>L(a)&&E(a.fact)&&E(a.source)):[]).some(a=>r.fit.sourceIds.includes(E(a.source,250))||r.fit.sourceIds.includes(E(a.id,250)))||s.push("\\uAE30\\uC874 \\uACF5\\uC2DD \\uC81C\\uD488 \\uC0AC\\uC2E4\\xB7\\uCD9C\\uCC98\\uC640 \\uC77C\\uCE58\\uD558\\uB294 sourceIds\\uB97C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694."),r.flow.some(a=>!a.text)&&s.push("5\\uB2E8\\uACC4 \\uC804\\uAC1C\\uB97C \\uBAA8\\uB450 \\uC791\\uC131\\uD574\\uC8FC\\uC138\\uC694."),(r.quality.claimReview!=="pass"||r.quality.duplicateReview!=="pass")&&s.push("\\uD45C\\uD604 \\uAC80\\uC218\\uC640 \\uC911\\uBCF5 \\uAC80\\uC218\\uB97C \\uC644\\uB8CC\\uD574\\uC8FC\\uC138\\uC694."),r.quality.humanConfirmed!==!0&&s.push("\\uAC80\\uC99D\\uB41C \\uADFC\\uAC70\\uC640 \\uD45C\\uD604\\uC744 \\uC0AC\\uC6A9\\uC790 \\uBCF8\\uC778\\uC774 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let i=Object.values(r.quality.scores).reduce((a,c)=>a+c,0);return i<80&&s.push("\\uAE30\\uD68D \\uD488\\uC9C8 \\uD3C9\\uAC00 80\\uC810 \\uC774\\uC0C1\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694."),{ready:s.length===0,score:i,reasons:s}}function ke(e,{content_id:t,strategy:r}){let s=e.contents.find(i=>i.id===t);if(!s)throw Error("\\uC218\\uC815\\uD560 \\uAE30\\uD68D\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");let o=at(r),n=L(s.plan)?s.plan:{};return s.plan={...n,strategyV2:o},{content_id:s.id,planning_readiness:Oe(o,s.plan.productFacts)}}function ce(e){if(!Array.isArray(e)||e.length<1||e.length>20)throw Error("storyboard: \\uC7A5\\uBA74\\uC744 1~20\\uAC1C \\uBC30\\uC5F4\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");let t=0,r=e.map((s,o)=>{let n="storyboard["+o+"]";if(!s||typeof s!="object"||Array.isArray(s))throw Error(n+": \\uC7A5\\uBA74 \\uAC1D\\uCCB4\\uAC00 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");let i=Object.keys(s).filter(a=>!["scene_id","duration_seconds","image","motion"].includes(a));if(i.length)throw Error(n+": \\uC9C0\\uC6D0\\uD558\\uC9C0 \\uC54A\\uB294 \\uD56D\\uBAA9 "+i.join(", "));if(s.scene_id!=="scene-"+(o+1))throw Error(n+".scene_id: \\uC7A5\\uBA74 \\uC21C\\uC11C\\uB300\\uB85C scene-"+(o+1)+"\\uC744 \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");if(typeof s.duration_seconds!="number"||!Number.isFinite(s.duration_seconds)||s.duration_seconds<.1||s.duration_seconds>60)throw Error(n+".duration_seconds: 0.1~60\\uCD08\\uC758 \\uC22B\\uC790\\uAC00 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");for(let a of["image","motion"])if(typeof s[a]!="string"||!s[a].trim()||s[a].length>2e3)throw Error(n+"."+a+": 1~2,000\\uC790\\uC758 \\uC124\\uBA85\\uC744 \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");return t+=s.duration_seconds,{scene_id:s.scene_id,duration_seconds:s.duration_seconds,image:s.image,motion:s.motion}});if(t>60+1e-9)throw Error("storyboard: \\uC7A5\\uBA74 \\uC2DC\\uAC04\\uC758 \\uD569\\uACC4\\uB294 60\\uCD08 \\uC774\\uB0B4\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");return r}function Ne(e){return e.map((t,r)=>"\\uC7A5\\uBA74 "+(r+1)+" \\xB7 "+t.scene_id+" \\xB7 "+t.duration_seconds+`\\uCD08\n\\uC774\\uBBF8\\uC9C0: `+t.image+`\n\\uC601\\uC0C1 \\uC6C0\\uC9C1\\uC784: `+t.motion).join(`\n\n`)}function ar(e,t=""){if(!e||typeof e!="object"||Array.isArray(e))throw Error("JSON \\uD55C \\uAC1C\\uC758 \\uAC1D\\uCCB4\\uB97C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694. A/B/C \\uC911 \\uD55C \\uC548\\uC529 \\uAC00\\uC838\\uC62C \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.");let r=Object.keys(e).filter(o=>!["content_id","script","caption","storyboard"].includes(o));if(r.length)throw Error("\\uC9C0\\uC6D0\\uD558\\uC9C0 \\uC54A\\uB294 \\uD56D\\uBAA9: "+r.join(", ")+". content_id, script, caption\\uB9CC \\uC0AC\\uC6A9\\uD574\\uC8FC\\uC138\\uC694. \\uACFC\\uAC70 storyboard \\uD0A4\\uB294 \\uAC00\\uC838\\uC624\\uAE30\\uB97C \\uC9C0\\uC6D0\\uD569\\uB2C8\\uB2E4.");if(e.content_id!==void 0&&(typeof e.content_id!="string"||!e.content_id.trim()))throw Error("content_id: \\uCF58\\uD150\\uCE20 ID\\uB97C \\uBB38\\uC790\\uC5F4\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");if(t&&e.content_id!==void 0&&e.content_id!==t)throw Error("content_id \\uBD88\\uC77C\\uCE58: \\uD604\\uC7AC \\uCF58\\uD150\\uCE20\\uB294 "+t+"\\uC785\\uB2C8\\uB2E4. \\uB2E4\\uB978 \\uCF58\\uD150\\uCE20\\uC758 JSON\\uC740 \\uC785\\uB825\\uD558\\uC9C0 \\uC54A\\uC2B5\\uB2C8\\uB2E4.");if(typeof e.script!="string"||!e.script.trim()||e.script.length>2e4)throw Error("script: \\uB300\\uBCF8\\uC744 1~20,000\\uC790\\uC758 \\uBB38\\uC790\\uC5F4\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");if(typeof e.caption!="string"||e.caption.length>8e3)throw Error(\'caption: 8,000\\uC790 \\uC774\\uB0B4\\uC758 \\uBB38\\uC790\\uC5F4\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4. \\uCEA1\\uC158\\uC774 \\uC5C6\\uC73C\\uBA74 ""\\uB97C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.\');let s=e.storyboard===void 0?null:ce(e.storyboard);if(s&&Ne(s).length>2e4)throw Error("storyboard: \\uC7A5\\uBA74 \\uC124\\uBA85 \\uC804\\uCCB4\\uB294 20,000\\uC790 \\uC774\\uB0B4\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");return{content_id:t||e.content_id||"",script:e.script,caption:e.caption,...s?{storyboard:s}:{}}}function Ce(e,t=""){if(typeof e!="string"||!e.trim())throw Error("JSON \\uCF54\\uB4DC\\uB97C \\uBA3C\\uC800 \\uBD99\\uC5EC\\uB123\\uC5B4\\uC8FC\\uC138\\uC694.");if(e.length>12e4)throw Error("JSON \\uCF54\\uB4DC\\uB294 120,000\\uC790 \\uC774\\uB0B4\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");let r=e.trim();if(r.startsWith("```")){let o=/^```(?:json)?\\s*\\n([\\s\\S]*?)\\n```\\s*$/i.exec(r.replace(/\\r\\n/g,`\n`));if(!o)throw Error("JSON \\uCF54\\uB4DC\\uBE14\\uB85D \\uD55C \\uAC1C\\uB9CC \\uBD99\\uC5EC\\uB123\\uC5B4\\uC8FC\\uC138\\uC694. A/B/C\\uB97C \\uD55C\\uAEBC\\uBC88\\uC5D0 \\uAC00\\uC838\\uC62C \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");r=o[1]}let s;try{s=JSON.parse(r)}catch(o){throw Error("JSON \\uD615\\uC2DD \\uC624\\uB958: "+o.message+" \\u2014 \\uD070\\uB530\\uC634\\uD45C\\xB7\\uC27C\\uD45C\\xB7\\uAD04\\uD638\\uB97C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.")}return ar(s,t)}function De(e){let t=0;return e.map(r=>{let s=t;t+=r.duration_seconds;let o=n=>String(Number(n.toPrecision(12)));return{timing:o(s)+"s-"+o(t)+"s",visual:r.image,motion:r.motion,sourceSceneId:r.scene_id,subtitle:"",prompt:"",reference:""}})}function ct(e,t){return!!e?.approvalHolds?.[t]}function dt(e,t,r=new Date().toISOString()){let s=(e.contents||[]).find(i=>i.id===t.content_id);if(!s)throw Error("\\uCF58\\uD150\\uCE20\\uB97C \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");if(e.state.approvalHolds?.[s.id])throw Error("\\uC774\\uBBF8 \\uD655\\uC815\\uC774 \\uD574\\uC81C\\uB41C \\uC6D0\\uACE0\\uC785\\uB2C8\\uB2E4.");let o=e.state.approvals?.[s.id],n=o&&s.reviews.some(i=>i.version===o.version&&JSON.stringify(i.sections)===JSON.stringify(o.sections))?o:s.reviews.find(i=>i.version===s.originalVersion&&i.sourceApproved);if(!n)throw Error("\\uD574\\uC81C\\uD560 \\uD655\\uC815 \\uC6D0\\uACE0\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");if(typeof t.version!="string"||n.version!==t.version)throw Error("\\uD655\\uC815 \\uC6D0\\uACE0\\uAC00 \\uBCC0\\uACBD\\uB418\\uC5C8\\uC2B5\\uB2C8\\uB2E4. \\uC0C8\\uB85C\\uACE0\\uCE68 \\uD6C4 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");return e.state.approvalHolds||={},e.state.approvalHolds[s.id]={version:n.version,at:r},o&&(e.state.approvalHistory||=[],e.state.approvalHistory.push({contentId:s.id,...structuredClone(o)})),delete e.state.approvals[s.id],e.state.events.push({at:r,message:s.product+" \\xB7 "+n.version+" \\uC6D0\\uACE0 \\uD655\\uC815 \\uD574\\uC81C (\\uC6D0\\uACE0\\xB7\\uC81C\\uC791\\uBB3C \\uC720\\uC9C0)"}),{content_id:s.id,version:n.version,released:!0}}function qe(e,t){e.approvalHolds&&delete e.approvalHolds[t]}function Ve(e,t,r=new Date().toISOString()){let s=(e.contents||[]).find(m=>m.id===t.content_id);if(!s)throw Error("\\uCF58\\uD150\\uCE20\\uB97C \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");let o=t.script,n=t.caption??"",i=t.storyboard_scenes===void 0?null:ce(t.storyboard_scenes);if(i&&s.format!=="Reel")throw Error("\\uC7A5\\uBA74 JSON\\uC740 \\uB9B4\\uC2A4\\uC5D0\\uC11C\\uB9CC \\uC785\\uB825\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.");let a=i?Ne(i):"",c=t.storyboard_text??a;if(typeof o!="string"||!o.trim()||o.length>2e4)throw Error("\\uB300\\uBCF8\\uC740 1~20,000\\uC790\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");if(typeof n!="string"||n.length>8e3)throw Error("\\uCEA1\\uC158\\uC740 8,000\\uC790 \\uC774\\uB0B4\\uB85C \\uC791\\uC131\\uD574\\uC8FC\\uC138\\uC694.");if(typeof c!="string"||c.length>2e4)throw Error("\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uAE00\\uC740 20,000\\uC790 \\uC774\\uB0B4\\uB85C \\uC791\\uC131\\uD574\\uC8FC\\uC138\\uC694.");if(i&&c!==a)throw Error("\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uAE00\\uACFC \\uC7A5\\uBA74 JSON\\uC774 \\uB2E4\\uB985\\uB2C8\\uB2E4. JSON\\uC744 \\uB2E4\\uC2DC \\uBD84\\uB9AC\\uD558\\uAC70\\uB098 \\uC9C1\\uC811 \\uC785\\uB825\\uD55C \\uAE00\\uB85C \\uC800\\uC7A5\\uD574\\uC8FC\\uC138\\uC694.");let d="USER-"+r.replace(/[^0-9]/g,"").slice(0,14),l=d,p=2;for(;s.reviews.some(m=>m.version===l);)l=d+"-"+p++;let h=s.format==="Carousel"?o.split(/\\n\\s*\\n/).filter(m=>m.trim()).map((m,f)=>({number:f+1,heading:f===0?"\\uD45C\\uC9C0":"\\uC2AC\\uB77C\\uC774\\uB4DC "+(f+1),text:m})):[];if(h.length>30)throw Error("\\uCE90\\uB7EC\\uC140\\uC740 \\uCD5C\\uB300 30\\uC7A5\\uAE4C\\uC9C0 \\uC785\\uB825\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.");let I=[{heading:"\\uC0AC\\uC6A9\\uC790\\uAC00 \\uC9C1\\uC811 \\uC791\\uC131\\uD55C \\uB300\\uBCF8",text:o}];return s.reviews.push({version:l,sections:I,slides:h,caption:n,...s.format==="Reel"&&c?{storyboardText:c}:{},...i?{storyboardScenes:i}:{},sourceApproved:!1,author:"user",createdAt:r}),e.state.events.push({at:r,message:s.product+" \\xB7 \\uC9C1\\uC811 \\uC791\\uC131\\uD55C \\uB300\\uBCF8 "+l+" \\uC800\\uC7A5 (\\uC2B9\\uC778 \\uB300\\uAE30)"}),{content_id:s.id,version:l,format:s.format}}var de=(e,t)=>JSON.stringify(e)===JSON.stringify(t);function R(e,t){if(e.state?.approvalHolds?.[t.id])return null;let r=e.state.approvals[t.id];if(r)return t.reviews.some(o=>o.version===r.version&&de(o.sections,r.sections))?r:null;let s=t.reviews.find(o=>o.version===t.originalVersion&&o.sourceApproved);return s?{version:s.version,sections:s.sections,source:"legacy"}:null}function P(e,t){let r=e.filter(d=>d.snapshot?.contentId===t.snapshot.contentId&&d.snapshot.version===t.snapshot.version&&!d.cancelledAt&&!["cancelled","changed"].includes(d.status)),s=r.filter(d=>!d.parentId).sort((d,l)=>l.slots.length-d.slots.length||l.createdAt.localeCompare(d.createdAt))[0]||t,o=[s,...r.filter(d=>d.id!==s.id).sort((d,l)=>d.createdAt.localeCompare(l.createdAt)||d.id.localeCompare(l.id))],i=[...new Set(o.flatMap(d=>d.slots.map(l=>l.id)))].map(d=>{let l=o.flatMap(g=>g.slots).find(g=>g.id===d),p=[];for(let g of o){let S=g.slots.find(T=>T.id===d&&T.asset?.driveUrl);S&&(p.some(T=>T.slot.asset.driveUrl===S.asset.driveUrl)||p.push({request:g,slot:S}))}p.sort((g,S)=>(g.request.id===s.id?-1:S.request.id===s.id?1:0)||(g.slot.asset.savedAt||g.request.createdAt).localeCompare(S.slot.asset.savedAt||S.request.createdAt)||g.request.createdAt.localeCompare(S.request.createdAt));let h=o.filter(g=>g.slots.some(S=>S.id===d)),I=JSON.stringify(h.map(g=>{let S=g.slots.find(T=>T.id===d);return[g.id,S.asset?.previewKey||"",S.asset?.driveUrl||""]}).sort((g,S)=>g[0].localeCompare(S[0]))),m=s.imageSelections?.[d]||s.selectedImages?.[d],f=m&&p.find(g=>g.request.id===m.requestId&&(!m.previewKey||g.slot.asset.previewKey===m.previewKey)),D=h.flatMap(g=>{let S=g.slots.find(T=>T.id===d);return g.parentId?[S.asset?.savedAt||g.createdAt]:[]}).filter(Boolean).sort().at(-1),F=f&&(m.candidateSignature?m.candidateSignature===I:m.seenRevisionIds?de(m.seenRevisionIds,h.filter(g=>g.parentId).map(g=>g.id).sort()):!D||!!m.selectedAt&&m.selectedAt>=D),Y=m?F?f:null:p.length===1&&!h.some(g=>g.parentId)?p[0]:null,ae=Y||p[p.length-1]||{request:s,slot:l};return{id:d,original:l,candidates:p,selected:Y,display:ae,candidateSignature:I,pending:h.some(g=>!g.slots.find(S=>S.id===d)?.asset)}}),a=r.find(d=>!d.slots.length||d.slots.some(l=>!l.asset)),c=i.some(d=>!d.selected);return{root:s,family:r,slots:i,pending:a,needsSelection:c,ready:i.length>0&&!a&&!c&&!!s.reviewedAt}}function q(e,t,r){let s=(e.productionRequests||[]).filter(l=>l.snapshot?.contentId===t.id&&l.snapshot.version===r.version&&!["cancelled","changed"].includes(l.status)&&!l.cancelledAt),o=s.find(l=>!l.parentId);if(o){let l=P(s,o);return{...l,unchecked:l.needsSelection||!l.root.reviewedAt?l.root:null,urls:l.slots.map(p=>p.selected?.slot.asset.driveUrl).filter(Boolean)}}let n=e.state.finals[t.id],i=t.images||[],a=!!(i.length&&t.originalVersion===r.version&&n?.version===r.version&&de(n.files,i.map(l=>l.id))&&i.every(l=>l.url)),c=e.state.finalVideos?.[t.id],d=e.dashboardSummary&&t.legacyVideoUrl||(c?.version===r.version&&de(c.sections,r.sections)?c.driveUrl:null);return{root:null,family:[],pending:null,unchecked:null,urls:i.map(l=>l.url).filter(Boolean),ready:a,legacyImages:i.length,legacyConfirmed:a,finalVideoUrl:d}}var Te=e=>JSON.stringify([...e.urls,e.root?.finalVideoUrl||e.finalVideoUrl||""]);function W(e,t,r,s){return e.dashboardSummary&&t.publicationUrl?{url:t.publicationUrl}:(e.state.publications||[]).findLast(o=>o.contentId===t.id&&o.version===r.version&&de(o.sections,r.sections)&&o.mediaSignature===Te(s))||null}var pe=(e,t,r,s)=>s.ready&&(t.format!=="Reel"||!!(s.root?s.root.finalVideoUrl&&s.root.finalVideoAt&&s.family.every(o=>o.id===s.root.id||o.createdAt<=s.root.finalVideoAt):s.finalVideoUrl));var lt=(e,t)=>JSON.stringify(e)===JSON.stringify(t),Fe=(e,t)=>structuredClone({contentId:e.id,version:t.version,product:e.product,date:e.date,format:e.format,sections:t.sections,slides:t.slides,caption:t.caption}),Ue=(e,t=4e3)=>typeof e=="string"&&e.trim().length>0&&e.length<=t;function je(e,t){if(t.withdrawnAt||t.kind!=="script"||!t.responseVersion)return null;let r=e.contents.find(a=>a.id===t.contentId),s=e.state?.approvals?.[t.contentId],o=r?.reviews.find(a=>a.version===s?.version);if(s?.source!=="site"||!o||!lt(s.sections,o.sections))return null;let n=[t.responseVersion],i=new Set([t.version]);for(let a=0;a<n.length;a++){let c=n[a];if(i.has(c))continue;i.add(c);let d=r.reviews.find(l=>l.version===c);if(d){if(c===s.version)return c;for(let l of e.revisionRequests||[])l.id!==t.id&&l.contentId===t.contentId&&l.kind==="script"&&!l.withdrawnAt&&l.version===c&&l.responseVersion&&l.snapshot&&lt(l.snapshot,Fe(r,d))&&n.push(l.responseVersion)}}return null}function j(e,t){return t.withdrawnAt?"withdrawn":t.responseVersion?je(e,t)?"approved":"review":t.status==="processing"&&Date.now()-Date.parse(t.startedAt)>36e5?"blocked":t.status||"received"}function B(e){e.revisionRequests||=[];for(let[t,r]of(e.state?.notes||[]).entries()){let s=r.requestId||`REV-${r.id}-${Date.parse(r.at)}-${t+1}`;if(e.revisionRequests.some(p=>p.id===s))continue;let o=e.contents.find(p=>p.id===r.id);if(!o)continue;let n=r.version||r.target.split(" \\xB7 ")[0],i=o.reviews.find(p=>p.version===n),a=r.kind||(/\uC774\uBBF8\uC9C0|\uD504\uB86C\uD504\uD2B8/.test(r.target)?"image":"script"),c={id:s,contentId:o.id,version:n,kind:a,target:r.target,text:r.text,createdAt:r.at,status:i&&a==="script"?"received":"blocked",issue:i&&a==="script"?"":"\\uC774\\uBBF8\\uC9C0\\xB7\\uD504\\uB86C\\uD504\\uD2B8 \\uC218\\uC815 \\uB610\\uB294 \\uC6D0\\uBB38 \\uC5F0\\uACB0 \\uD655\\uC778\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.",snapshot:i?Fe(o,i):null,events:[{at:r.at,message:"\\uC218\\uC815 \\uC694\\uCCAD \\uC811\\uC218"}]},d=o.id==="ISHARD-23-20261012-R01"&&n==="V4-A"&&r.at==="2026-10-15T11:30:56.866Z"&&r.text==="30\\uCD08 \\uC774\\uB0B4\\uC758 \\uB300\\uBCF8\\uC73C\\uB85C \\uC904\\uC5EC\\uC92D",l=(e.reports||[]).find(p=>p.id==="REVISION-ISHARD-23-20261012-R01-V4-A-30s-r1");d&&l&&o.reviews.some(p=>p.version==="V4-A-30s-r1")&&(c.responseVersion="V4-A-30s-r1",c.changeSummary="30\\uCD08 \\uC774\\uB0B4 \\uC694\\uCCAD\\uC5D0 \\uB300\\uD55C \\uAE30\\uC874 \\uC218\\uC815\\uBCF8\\uC744 \\uC5F0\\uACB0\\uD588\\uC2B5\\uB2C8\\uB2E4. \\uC2E4\\uC81C \\uB0AD\\uB3C5 \\uC2DC\\uAC04\\uC740 \\uBBF8\\uCE21\\uC815\\uC774\\uBA70 \\uC0AC\\uC6A9\\uC790 \\uC2B9\\uC778\\uC744 \\uAE30\\uB2E4\\uB9BD\\uB2C8\\uB2E4.",c.completedAt=l.at,c.status="review",c.events.push({at:l.at,message:"\\uAE30\\uC874 \\uC218\\uC815\\uBCF8 \\uC5F0\\uACB0 \\xB7 \\uC2B9\\uC778 \\uB300\\uAE30"})),e.revisionRequests.push(c)}return e}function fe(e,t){return B(e),e.revisionRequests.find(r=>r.contentId===t&&r.kind==="script"&&!["approved","withdrawn"].includes(j(e,r)))}function Je(e,t){B(e);let r=e.revisionRequests.find(s=>s.id===t);if(!r)throw Error("\\uC218\\uC815 \\uC694\\uCCAD\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");return r}function ut(e,t,r=new Date().toISOString()){B(e);let s=e.contents.find(l=>l.id===t.content_id),o=s?.reviews.find(l=>l.version===t.version);if(!o||!Ue(t.text))throw Error("\\uC218\\uC815\\uD560 \\uC6D0\\uACE0 \\uBC84\\uC804\\uACFC \\uC694\\uCCAD \\uB0B4\\uC6A9\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let n=t.kind||"script";if(!["script","image"].includes(n))throw Error("\\uC798\\uBABB\\uB41C \\uC218\\uC815 \\uC885\\uB958\\uC785\\uB2C8\\uB2E4.");let i=e.revisionRequests.find(l=>l.contentId===s.id&&l.version===o.version&&l.kind===n&&l.text===t.text.trim()&&!["approved","withdrawn"].includes(j(e,l)));if(i)return{request:i,reused:!0};let a="REV-"+r.slice(0,10).replaceAll("-","")+"-"+crypto.randomUUID().slice(0,8),c=t.target||o.version+" \\xB7 \\uC6D0\\uACE0";if(!Ue(c,200))throw Error("\\uC218\\uC815 \\uB300\\uC0C1\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let d={id:a,contentId:s.id,version:o.version,kind:n,target:c,text:t.text.trim(),snapshot:Fe(s,o),createdAt:r,status:n==="script"?"received":"blocked",issue:n==="script"?"":"\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uC218\\uC815 \\uC694\\uCCAD\\uC785\\uB2C8\\uB2E4. \\uB300\\uC0C1 \\uC774\\uBBF8\\uC9C0\\uC640 \\uC81C\\uC791 \\uACBD\\uB85C\\uB97C \\uD655\\uC778\\uD574\\uC57C \\uD569\\uB2C8\\uB2E4.",events:[{at:r,message:"\\uC218\\uC815 \\uC694\\uCCAD \\uC811\\uC218"}]};return e.revisionRequests.push(d),e.state.notes.push({id:s.id,requestId:a,version:o.version,kind:n,target:c,text:d.text,at:r}),{request:d,reused:!1}}function pt(e,t){let r=Je(e,t);if(["review","approved"].includes(j(e,r)))return{request:r,reused:!0};if(j(e,r)!=="received"||r.kind!=="script")throw Error("\\uC811\\uC218 \\uC0C1\\uD0DC\\uC758 \\uC6D0\\uACE0 \\uC694\\uCCAD\\uB9CC \\uC2DC\\uC791\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4. \\uC911\\uB2E8\\uB41C \\uC791\\uC5C5\\uC740 \\uACB0\\uACFC\\uB97C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");return r.status="processing",r.claim=crypto.randomUUID(),r.startedAt=new Date().toISOString(),r.events.push({at:r.startedAt,message:"\\uC6D0\\uACE0 \\uC218\\uC815 \\uC2DC\\uC791"}),{request:r,reused:!1}}function ft(e,t){let r=Je(e,t.request_id);if(r.responseVersion){if(r.responseVersion===t.response_version&&r.changeSummary===t.change_summary)return r;throw Error("\\uC5F0\\uACB0\\uB41C \\uC218\\uC815\\uBCF8\\uC740 \\uB36E\\uC5B4\\uC4F8 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.")}if(!r.claim||r.claim!==t.claim||r.withdrawnAt)throw Error("\\uC774 \\uC694\\uCCAD\\uC758 \\uCC98\\uB9AC \\uC2DC\\uC791 \\uAE30\\uB85D\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let s=e.contents.find(n=>n.id===r.contentId),o=s?.reviews.find(n=>n.version===t.response_version);if(!o||o.version===r.version||!Ue(t.change_summary))throw Error("\\uBCC4\\uB3C4\\uB85C \\uC800\\uC7A5\\uD55C \\uC0C8 \\uC6D0\\uACE0 \\uBC84\\uC804\\uACFC \\uBCC0\\uACBD \\uC694\\uC57D\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");return r.responseVersion=o.version,r.changeSummary=t.change_summary,r.completedAt=new Date().toISOString(),r.status="review",r.issue="",r.events.push({at:r.completedAt,message:"\\uC218\\uC815\\uBCF8 \\uC5F0\\uACB0 \\xB7 \\uC0AC\\uC6A9\\uC790 \\uAC80\\uD1A0 \\uB300\\uAE30"}),r}function mt(e,t){let r=Je(e,t);return r.withdrawnAt=new Date().toISOString(),r.events.push({at:r.withdrawnAt,message:"\\uC0AC\\uC6A9\\uC790\\uAC00 \\uC694\\uCCAD \\uCCA0\\uD68C"}),r}var cr=(e,t)=>JSON.stringify(e)===JSON.stringify(t);function Me(e,t,r){let s=e.contents.find(c=>c.id===t);if(!s)throw new Error("CONTENT_NOT_FOUND");let o=s.reviews.find(c=>c.version===r);if(!o)throw new Error("DRAFT_NOT_FOUND");if(ct(e.state,t))throw new Error("APPROVAL_REQUIRED");let n=e.state.approvals[t];if((n&&s.reviews.some(c=>c.version===n.version&&cr(c.sections,n.sections))?n.version:s.reviews.find(c=>c.version===s.originalVersion&&c.sourceApproved)?.version)!==r)throw new Error("APPROVAL_REQUIRED");return{content:s,draft:o}}var Le="ISHARD-FEED-MOOD-20261013: \\uB3C5\\uB9BD 9:16 \\uC0AC\\uC9C4. \\uC790\\uC5F0\\uAD11\\xB7\\uD3F0\\uCE74 \\uC77C\\uC0C1 \\uC2A4\\uB0C5, \\uD06C\\uB9BC\\xB7\\uC6DC\\uADF8\\uB808\\uC774 \\uBC14\\uD0D5\\uACFC \\uC62C\\uB9AC\\uBE0C \\uC5F0\\uACB0\\uC0C9, \\uCD5C\\uC18C \\uC18C\\uD488. \\uC81C\\uD488 \\uC6D0\\uBCF8\\uC758 \\uC0C9\\xB7\\uD615\\uD0DC\\xB7\\uAC01\\uC778\\xB7\\uB77C\\uBCA8 \\uBCF4\\uC874. \\uC778\\uBB3C \\uC815\\uBA74 \\uC5BC\\uAD74 \\uCD5C\\uB300\\uD55C \\uD53C\\uD558\\uAE30. \\uBE44\\uB204\\uB294 \\uC190\\uC5D0\\uC11C \\uAC70\\uD488\\uC744 \\uB0B4\\uBA70 \\uC5BC\\uAD74\\uC5D0 \\uC9C1\\uC811 \\uBB38\\uC9C0\\uB974\\uC9C0 \\uC54A\\uAE30. \\uC0AC\\uC9C4\\uC5D0 \\uCE74\\uD53C\\xB7CTA\\xB7\\uC7A5\\uBC88\\uD638\\xB7\\uC784\\uC758 \\uB85C\\uACE0\\xB7\\uC6CC\\uD130\\uB9C8\\uD06C \\uAE08\\uC9C0. \\uCF5C\\uB77C\\uC8FC \\uAE08\\uC9C0. \\uC2B9\\uC778 \\uBB38\\uC7A5\\xB7\\uC21C\\uC11C\\xB7\\uCEA1\\uC158 \\uC720\\uC9C0. \\uC0DD\\uC131 \\uC774\\uBBF8\\uC9C0\\uB97C \\uC2E4\\uC81C \\uD6C4\\uAE30\\xB7\\uD6A8\\uB2A5 \\uC99D\\uAC70\\uB85C \\uD45C\\uC2DC\\uD558\\uC9C0 \\uC54A\\uAE30. \\uC0DD\\uC131 \\uD6C4 \\uC790\\uB3D9 \\uC2DC\\uAC01 \\uAC80\\uC218\\xB7\\uC7AC\\uC0DD\\uC131 \\uAE08\\uC9C0. Google Drive \\uAE30\\uC874 \\uCF58\\uD150\\uCE20 \\uACBD\\uB85C\\uC5D0 \\uC800\\uC7A5\\uD558\\uACE0 \\uC0AC\\uC774\\uD2B8 \\uC694\\uCCAD\\uC5D0 \\uC6D0\\uBCF8 \\uB9C1\\uD06C\\uC640 \\uBBF8\\uB9AC\\uBCF4\\uAE30 \\uC5F0\\uACB0. \\uC2E4\\uC81C \\uC601\\uC0C1 \\uC0DD\\uC131\\xB7SNS \\uAC8C\\uC2DC\\xB7\\uAD11\\uACE0 \\uC9D1\\uD589 \\uC81C\\uC678.";var me=(e,t)=>JSON.stringify(e)===JSON.stringify(t),ee=(e,t=3e3)=>typeof e=="string"&&e.trim().length>0&&e.length<=t;function dr(e){try{return new URL(e).protocol==="https:"}catch{return!1}}function G(e,t=!1){try{let r=new URL(e);return r.protocol==="https:"&&r.hostname==="drive.google.com"&&(t?/^\\/drive\\/folders\\/[\\w-]+$/.test(r.pathname):/^\\/file\\/d\\/[\\w-]+\\/(view|preview)$/.test(r.pathname))}catch{return!1}}function vt(e,t){return structuredClone({contentId:e.id,version:t.version,date:e.date,product:e.product,format:e.format,sections:t.sections,slides:t.slides,caption:t.caption,...t.storyboardText?{storyboardText:t.storyboardText}:{},...t.storyboardScenes?{storyboardScenes:t.storyboardScenes}:{}})}function gt(e,t){try{let{content:r,draft:s}=Me(e,t.snapshot.contentId,t.snapshot.version);return me(vt(r,s),t.snapshot)}catch{return!1}}function K(e,t){let r=(e.productionRequests||[]).find(s=>s.id===t);if(!r)throw Error("\\uC81C\\uC791 \\uC694\\uCCAD\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");return r}function Pe(e,t){return t.cancelledAt?"cancelled":gt(e,t)?t.slots.length&&t.slots.every(r=>r.asset)?"completed":fe(e,t.snapshot.contentId)?"revision_hold":t.slots.some(r=>r.asset)?"partial":t.slots.some(r=>r.state==="generating")?"generating":t.slots.some(r=>r.state==="uncertain"||r.state==="failed")?"blocked":"requested":"changed"}function H(e,t){if(t.cancelledAt)throw Error("\\uCDE8\\uC18C\\uB41C \\uC694\\uCCAD\\uC785\\uB2C8\\uB2E4.");if(fe(e,t.snapshot.contentId))throw Error("\\uBBF8\\uD574\\uACB0 \\uC6D0\\uACE0 \\uC218\\uC815 \\uC694\\uCCAD\\uC774 \\uC788\\uC2B5\\uB2C8\\uB2E4. \\uC218\\uC815\\uBCF8 \\uAC80\\uD1A0 \\uD6C4 \\uC81C\\uC791\\uD574\\uC8FC\\uC138\\uC694.");if(!gt(e,t))throw Error("\\uC2B9\\uC778 \\uC6D0\\uACE0\\uAC00 \\uBCC0\\uACBD\\uB418\\uC5C8\\uC2B5\\uB2C8\\uB2E4. \\uD604\\uC7AC \\uC2B9\\uC778 \\uBC84\\uC804\\uC73C\\uB85C \\uC0C8 \\uC694\\uCCAD\\uC744 \\uB9CC\\uB4E4\\uC5B4\\uC8FC\\uC138\\uC694.")}function lr(e,t,r){return e.format==="Carousel"?t.slides.map((s,o)=>({id:"slide-"+(o+1),label:"\\uCE90\\uB7EC\\uC140 "+(o+1)+"\\uC7A5",sourceText:s.text,state:"pending"})):e.format==="Image"?[{id:"image-1",label:"\\uB2E8\\uC77C \\uC774\\uBBF8\\uC9C0",sourceText:t.sections.map(s=>s.text).join(`\n`),state:"pending"}]:r==="cover"?[{id:"cover",label:"\\uB9B4\\uC2A4 \\uCEE4\\uBC84",sourceText:t.sections[0]?.text||t.caption,state:"pending"}]:[]}function ve(e,t,r=new Date().toISOString()){let{content:s,draft:o}=Me(e,t.content_id,t.version);if(fe(e,s.id))throw Error("\\uBBF8\\uD574\\uACB0 \\uC6D0\\uACE0 \\uC218\\uC815 \\uC694\\uCCAD\\uC774 \\uC788\\uC2B5\\uB2C8\\uB2E4. \\uC218\\uC815\\uBCF8 \\uAC80\\uD1A0 \\uD6C4 \\uC81C\\uC791\\uD574\\uC8FC\\uC138\\uC694.");let n=s.format==="Reel"?t.scope||"cover_scenes":"all";if(!(s.format==="Reel"?["cover","scenes","cover_scenes"]:["all"]).includes(n))throw Error("\\uC81C\\uC791 \\uBC94\\uC704\\uB97C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let i=vt(s,o),a=t.parent_id?K(e,t.parent_id):null,c=lr(s,o,n),d=t.note||"";if(typeof d!="string"||d.length>3e3)throw Error("\\uC218\\uC815 \\uC694\\uCCAD\\uC774 \\uB108\\uBB34 \\uAE41\\uB2C8\\uB2E4.");if(a){if(H(e,a),!me(a.snapshot,i))throw Error("\\uC6D0\\uBCF8 \\uC694\\uCCAD\\uACFC \\uC2B9\\uC778 \\uBC84\\uC804\\uC774 \\uB2E4\\uB985\\uB2C8\\uB2E4.");if(!ee(d))throw Error("\\uC774\\uBBF8\\uC9C0 \\uC218\\uC815 \\uB0B4\\uC6A9\\uC744 \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");let D=a.slots.find(F=>F.id===t.slot_id&&F.asset);if(!D)throw Error("\\uC218\\uC815\\uD560 \\uC644\\uC131 \\uC774\\uBBF8\\uC9C0\\uB97C \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");c=[{...structuredClone(D),asset:void 0,state:"pending",attempt:void 0,startedAt:void 0,issue:void 0}]}let l=JSON.stringify({snapshot:i,scope:n,parent:a?.id||null,slot:t.slot_id||null,note:d});e.productionRequests||=[];let p=e.productionRequests.find(D=>D.identity===l&&!D.cancelledAt);if(p)return{request:p,reused:!0};if(e.productionRequests.length>=300)throw Error("\\uC694\\uCCAD \\uBCF4\\uAD00 \\uD55C\\uB3C4\\uC5D0 \\uB3C4\\uB2EC\\uD588\\uC2B5\\uB2C8\\uB2E4.");let h=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(r)).replaceAll("-",""),I=1,m;do m="IMG-"+h+"-"+String(I++).padStart(3,"0");while(e.productionRequests.some(D=>D.id===m));let f={id:m,identity:l,snapshot:i,scope:n,note:d,parentId:a?.id||null,sourceSlotId:t.slot_id||null,createdAt:r,updatedAt:r,visualRules:Le,driveFolder:a?.driveFolder||s.drive||"",referenceScenes:s.originalVersion===o.version?structuredClone(s.scenes||[]):[],slots:c,events:[{at:r,message:a?"\\uC774\\uBBF8\\uC9C0 \\uC218\\uC815 \\uC694\\uCCAD \\uB4F1\\uB85D":"\\uC81C\\uC791 \\uC694\\uCCAD \\uB4F1\\uB85D"}]};return e.productionRequests.push(f),{request:f,reused:!1}}function He(e,t,r){let s=K(e,t);if(H(e,s),!G(r.drive_folder,!0))throw Error("\\uD655\\uC778\\uB41C Google Drive \\uD3F4\\uB354 URL\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");if(!Array.isArray(r.slots)||!r.slots.length||r.slots.length>30)throw Error("\\uC7A5\\uBA74\\uD45C\\uAC00 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");if(new Set(r.slots.map(a=>a.id)).size!==r.slots.length)throw Error("\\uC911\\uBCF5\\uB41C \\uC7A5\\uBA74 ID\\uC785\\uB2C8\\uB2E4.");if((s.snapshot.format!=="Reel"||s.parentId||s.scope==="cover")&&(!me(r.slots.map(a=>a.id),s.slots.map(a=>a.id))||r.slots.some((a,c)=>a.source_text!==s.slots[c].sourceText)))throw Error("\\uAE30\\uC874 \\uC7A5\\uBC88\\uD638\\xB7\\uC2B9\\uC778 \\uBB38\\uC7A5\\xB7\\uC21C\\uC11C\\uB97C \\uC720\\uC9C0\\uD574\\uC8FC\\uC138\\uC694.");if(s.snapshot.format==="Reel"&&!s.parentId){let a=r.slots.filter(d=>d.id==="cover").length,c=r.slots.filter(d=>/^scene-[1-9]\\d*$/.test(d.id));if(a!==(s.scope==="scenes"?0:1)||c.length!==(s.scope==="cover"?0:r.slots.length-a)||s.scope!=="cover"&&!c.length||c.some((d,l)=>d.id!=="scene-"+(l+1)))throw Error("\\uB9B4\\uC2A4 \\uCEE4\\uBC84\\xB7\\uC7A5\\uBA74 \\uBC94\\uC704\\uB97C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.")}let n=[s.snapshot.storyboardText||"",...s.snapshot.sections.map(a=>a.text),...s.snapshot.slides.map(a=>a.text),s.snapshot.caption].join(`\n`),i=r.slots.map(a=>{if(!/^(cover|scene-[1-9]\\d*|slide-[1-9]\\d*|image-1)$/.test(a.id)||!ee(a.label,100)||!ee(a.source_text,3e4)||!n.includes(a.source_text)||!ee(a.prompt,12e3)||typeof a.requires_product!="boolean"||!Array.isArray(a.reference_urls)||a.reference_urls.length>8||!a.reference_urls.every(dr)||a.requires_product&&!a.reference_urls.length)throw Error("\\uC7A5\\uBA74\\uC758 \\uC2B9\\uC778 \\uBB38\\uC7A5\\xB7\\uD504\\uB86C\\uD504\\uD2B8\\xB7\\uC81C\\uD488 \\uCC38\\uC870\\uB97C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");return{id:a.id,label:a.label,sourceText:a.source_text,prompt:a.prompt,requiresProduct:a.requires_product,referenceUrls:a.reference_urls,state:"pending"}});if(s.slots.some(a=>a.state!=="pending"||a.asset)){let a=c=>({id:c.id,label:c.label,sourceText:c.sourceText,prompt:c.prompt,requiresProduct:c.requiresProduct,referenceUrls:c.referenceUrls,state:"pending"});if(!me(s.slots.map(a),i)||s.driveFolder!==r.drive_folder)throw Error("\\uC81C\\uC791\\uC774 \\uC2DC\\uC791\\uB41C \\uC7A5\\uBA74\\uD45C\\uB294 \\uBCC0\\uACBD\\uD560 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");return s}return s.slots=i,s.driveFolder=r.drive_folder,s.updatedAt=new Date().toISOString(),s.events.push({at:s.updatedAt,message:"\\uC7A5\\uBA74\\uD45C\\uC640 \\uC800\\uC7A5 \\uD3F4\\uB354 \\uC900\\uBE44"}),s}function ht(e,t,r){let s=K(e,t);H(e,s);let o=s.slots.find(n=>n.id===r);if(!o||!o.prompt||!G(s.driveFolder,!0))throw Error("\\uC7A5\\uBA74\\uD45C\\uC640 \\uC800\\uC7A5 \\uD3F4\\uB354\\uB97C \\uBA3C\\uC800 \\uC900\\uBE44\\uD574\\uC8FC\\uC138\\uC694.");if(o.asset)return{request:s,slot:o,reused:!0};if(o.state!=="pending")throw Error("\\uC774\\uBBF8 \\uC2DC\\uC791\\uD55C \\uC791\\uC5C5\\uC785\\uB2C8\\uB2E4. \\uC644\\uB8CC \\uC5EC\\uBD80\\uB97C \\uD655\\uC778\\uD558\\uAE30 \\uC804 \\uC7AC\\uC0DD\\uC131\\uD558\\uC9C0 \\uB9C8\\uC138\\uC694.");return o.state="generating",o.attempt=crypto.randomUUID(),o.startedAt=new Date().toISOString(),s.updatedAt=o.startedAt,{request:s,slot:o,reused:!1}}function bt(e,t,r,s){let o=K(e,t),n=o.slots.find(a=>a.id===r);if(!n)throw Error("\\uC7A5\\uBA74\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");if(!ee(s.fileName,240)||!G(s.driveUrl)||!ee(s.previewKey,300))throw Error("\\uACB0\\uACFC \\uD30C\\uC77C\\uACFC Drive \\uC6D0\\uBCF8 URL\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");if(n.asset){if(n.asset.driveUrl===s.driveUrl&&n.asset.previewKey===s.previewKey&&n.asset.fileName===s.fileName)return{request:o,reused:!0};throw Error("\\uC644\\uC131\\uBB3C\\uC740 \\uB36E\\uC5B4\\uC4F8 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4. \\uC774\\uBBF8\\uC9C0 \\uC218\\uC815 \\uC694\\uCCAD\\uC744 \\uC0AC\\uC6A9\\uD574\\uC8FC\\uC138\\uC694.")}if(!n.attempt||!["generating","uncertain"].includes(n.state))throw Error("\\uC81C\\uC791 \\uC2DC\\uC791 \\uAE30\\uB85D\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");n.asset={...s,savedAt:new Date().toISOString()},n.state="completed",delete n.issue;let i=P(e.productionRequests,o);return delete i.root.reviewedAt,delete i.root.finalVideoAt,o.updatedAt=n.asset.savedAt,o.events.push({at:o.updatedAt,message:n.label+" \\uC800\\uC7A5 \\uC644\\uB8CC"}),{request:o,reused:!1}}function yt(e,t,r,s,o,n=new Date().toISOString()){let i=K(e,t);H(e,i);let a=P(e.productionRequests,i);H(e,a.root);let c=a.slots.find(p=>p.id===r),d=c?.candidates.find(p=>p.request.id===s&&p.slot.asset.previewKey===o);if(!d)throw Error("\\uC774 \\uC7A5\\uC758 \\uC644\\uC131 \\uC774\\uBBF8\\uC9C0 \\uC911\\uC5D0\\uC11C \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");if(H(e,d.request),c.pending)throw Error("\\uC774 \\uC7A5\\uC758 \\uC218\\uC815 \\uC774\\uBBF8\\uC9C0 \\uC81C\\uC791 \\uC644\\uB8CC \\uD6C4 \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");let l=a.root.imageSelections?.[r];return l?.requestId===s&&l.previewKey===o&&l.candidateSignature===c.candidateSignature||((a.root.imageSelections||={})[r]={requestId:s,previewKey:o,selectedAt:n,candidateSignature:c.candidateSignature},delete a.root.reviewedAt,delete a.root.finalVideoAt,a.root.updatedAt=n,a.root.events.push({at:n,message:c.original.label+" \\xB7 \\uC0AC\\uC6A9\\uD560 \\uC774\\uBBF8\\uC9C0 \\uC120\\uD0DD ("+s+")"})),a.root}function St(e,t){let r=K(e,t);H(e,r);let s=P(e.productionRequests,r),o=s.root;if(H(e,o),s.pending)throw Error("\\uC9C4\\uD589 \\uC911\\uC778 \\uC774\\uBBF8\\uC9C0 \\uC218\\uC815 \\uC694\\uCCAD\\uC774 \\uC788\\uC2B5\\uB2C8\\uB2E4. \\uBAA8\\uB4E0 \\uC774\\uBBF8\\uC9C0\\uAC00 \\uC644\\uC131\\uB41C \\uB4A4 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");if(s.needsSelection||!s.slots.length)throw Error("\\uAC01 \\uC7A5\\uC5D0\\uC11C \\uC0AC\\uC6A9\\uD560 \\uC774\\uBBF8\\uC9C0\\uB97C \\uBA3C\\uC800 \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");let n=new Date().toISOString();for(let i of s.family)H(e,i),i.reviewedAt||(i.reviewedAt=n,i.updatedAt=n,(i.events||=[]).push({at:n,message:"\\uC0AC\\uC6A9\\uC790\\uAC00 \\uC120\\uD0DD\\uD55C \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C \\uD655\\uC778 \\uC644\\uB8CC"}));return o}var te=Object.freeze(["SCENE CONTEXT","ACTIVE REFERENCES","WARDROBE","LOCATION MAP","FIRST FRAME / BLOCKING","FORMAT MODE","OPTICS","CAMERA","ACTION","PERFORMANCE","PHYSICS","LIGHTING","STYLE","POSITIVE LOCKS"]),ge=Object.freeze(["AUDIO","END FRAME","TIMING"]);function Ge(e,t){if(typeof e!="string"||!e.trim())return{ok:!1,reason:"Prompt is empty"};if(e.length>5e3)return{ok:!1,reason:"Prompt exceeds 5,000 characters"};let r=e.replace(/\\r\\n/g,`\n`).trim().split(`\n`),s=[];for(let i=0;i<r.length;i++){let a=r[i].match(/^([A-Z][A-Z /]+):(?:\\s*(.*))?$/);a&&s.push({name:a[1].trim(),start:i,inline:a[2]||""})}let o=s.length===te.length+ge.length,n=o?[...te,...ge]:te;if(s.length!==te.length&&!o||s[0]?.start!==0)return{ok:!1,reason:"All 14 headings (or 17 with AUDIO, END FRAME, TIMING) must appear in order from the first line"};for(let i=0;i<n.length;i++){if(s[i].name!==n[i])return{ok:!1,reason:"Expected section "+n[i]};let a=s[i+1]?.start??r.length,c=[s[i].inline,...r.slice(s[i].start+1,a)].join(`\n`).trim();if(!c)return{ok:!1,reason:"Empty section "+s[i].name};if(s[i].name==="AUDIO"&&(!/ambient|sound effects?|\uD658\uACBD\uC74C|\uD6A8\uACFC\uC74C/i.test(c)||/\\b(voice|music|subtitles?)\\b(?!\\s*\\))/i.test(c.replace(/\\b(no|without|not)\\s+(voice|music|subtitles?)\\b/gi,""))))return{ok:!1,reason:"AUDIO must allow only ambient sound and sound effects (no voice, music, subtitles)"};if(s[i].name==="TIMING"&&t!==void 0){let d=String(t).match(/^(\\d+(?:\\.\\d+)?)\\s*(?:s|\uCD08)?\\s*[\u2013\u2014~\u2212-]\\s*(\\d+(?:\\.\\d+)?)/i),l=Number((c.match(/\\d+(?:\\.\\d+)?/)||[])[0]);if(!d||Math.abs(l-(Number(d[2])-Number(d[1])))>.01)return{ok:!1,reason:"TIMING must match the scene duration"}}if(s[i].name==="ACTION"){if(!/^0\\.0s\\b/i.test(c))return{ok:!1,reason:"ACTION must start at 0.0s"};let d=[...c.matchAll(/\\b(\\d+(?:\\.\\d+)?)s\\b/gi)].map(l=>Number(l[1]));if(d.length<2||d[0]!==0||d.some((l,p)=>p>0&&l<d[p-1]))return{ok:!1,reason:"ACTION must include a chronological shot-relative timeline starting at 0.0s"};if(t!==void 0){let l=String(t).match(/^(\\d+(?:\\.\\d+)?)\\s*(?:s|\uCD08)?\\s*[\u2013\u2014~\u2212-]\\s*(\\d+(?:\\.\\d+)?)\\s*(?:s|\uCD08)?$/i);if(!l||Number(l[2])<=Number(l[1])||Math.abs(d.at(-1)-(Number(l[2])-Number(l[1])))>.01)return{ok:!1,reason:"ACTION end must match the scene duration"}}}}return{ok:!0,reason:""}}function re(e,t,r){let s=e.contents.find(f=>f.id===t),o=s?.reviews.find(f=>f.version===r),n=e.state.approvals?.[t],i=!!o&&!e.state.approvalHolds?.[t]&&(n?n.version===r&&JSON.stringify(n.sections)===JSON.stringify(o.sections):s.originalVersion===r&&o.sourceApproved),a=e.state.storyboards?.[t]?.[r]?.scenes||(s?.originalVersion===r?s.scenes||[]:[]),d=(e.productionRequests||[]).filter(f=>!f.cancelledAt&&!["cancelled"].includes(f.status)&&f.snapshot.contentId===t&&f.snapshot.version===r&&o&&JSON.stringify(f.snapshot.sections)===JSON.stringify(o.sections)&&f.snapshot.caption===o.caption&&(f.snapshot.storyboardText||"")===(o.storyboardText||"")&&JSON.stringify(f.snapshot.storyboardScenes||[])===JSON.stringify(o.storyboardScenes||[])&&JSON.stringify(f.snapshot.slides)===JSON.stringify(o.slides)).map(f=>f.status==="changed"?{...f,status:"historical"}:f),l=d.find(f=>!f.parentId),p=l?P(d,l):null,h=(e.revisionRequests||[]).some(f=>f.contentId===t&&f.kind==="script"&&!["approved","withdrawn"].includes(f.status)),I=a.map((f,D)=>{let F="scene-"+(D+1),Y=p?.slots.find(sr=>sr.id===F),ae=Y?.selected,g=ae?.slot.asset,S=g?{request_id:ae.request.id,slot_id:F,image_version:g.previewKey,original_url:g.driveUrl,preview_url:"/api/production/preview?request="+encodeURIComponent(ae.request.id)+"&slot="+F+"&v="+encodeURIComponent(g.previewKey.split("/").pop())}:null,T=JSON.stringify([f.timing,f.visual,f.subtitle,f.reference,...f.motion?[f.motion]:[],...o?.storyboardText?[o.storyboardText]:[]]),nt=e.state.higgsfieldPrompts?.[t]?.[r]?.[F]||[],Z=nt.at(-1),rr=!!S&&Z?.image_version===S.image_version&&Z?.request_id===S.request_id&&Z?.original_url===S.original_url&&Z?.scene_signature===T&&!Y?.pending;return{scene_id:F,scene:f,slot:Y,image:S,scene_signature:T,confirmed:!!(i&&!h&&S&&!Y?.pending&&p.root.reviewedAt),prompt:Z||null,prompt_status:Z?rr?"current":"stale":f.prompt?"legacy":"missing",history:nt}}),m=!!(i&&!h&&I.length&&I.every(f=>f.confirmed));return{approved:i,held:h,root_id:p?.root.id||null,group:p,scenes:I,ready:m,missing:I.filter(f=>!f.confirmed).map(f=>f.scene_id)}}var Ls=re.toString();function wt(e,t,r=new Date().toISOString()){let s=re(e,t.content_id,t.version);if(!s.ready)throw Error("\\uC7A5\\uBA74 \\uC774\\uBBF8\\uC9C0 \\uC804\\uCCB4 \\uC120\\uD0DD\\xB7\\uD655\\uC815 \\uD544\\uC694: "+s.missing.join(", "));let o=s.scenes.find(d=>d.scene_id===t.scene_id);if(!o||!o.image)throw Error("\\uC7A5\\uBA74\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");for(let d of["request_id","image_version","original_url"])if(t[d]!==o.image[d])throw Error("\\uC774\\uBBF8\\uC9C0\\uAC00 \\uBCC0\\uACBD\\uB418\\uC5C8\\uC2B5\\uB2C8\\uB2E4. \\uD655\\uC815 \\uC774\\uBBF8\\uC9C0\\uB97C \\uB2E4\\uC2DC \\uC77D\\uC5B4\\uC8FC\\uC138\\uC694.");let n=Ge(t.prompt,o.scene.timing);if(!n.ok)throw Error(n.reason);if(!(t.prompt.split("ACTIVE REFERENCES:")[1]?.split("WARDROBE:")[0]||"").includes(o.image.original_url))throw Error("ACTIVE REFERENCES\\uC5D0 \\uD655\\uC815 \\uC774\\uBBF8\\uC9C0 \\uC6D0\\uBCF8 URL\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");let a={...o.image,scene_signature:o.scene_signature,prompt:t.prompt,savedAt:r};e.state.higgsfieldPrompts||={},e.state.higgsfieldPrompts[t.content_id]||={},e.state.higgsfieldPrompts[t.content_id][t.version]||={};let c=e.state.higgsfieldPrompts[t.content_id][t.version][t.scene_id]||=[];return JSON.stringify(c.at(-1))===JSON.stringify(a)||c.at(-1)?.prompt===a.prompt&&o.prompt_status==="current"?{reused:!0,scene_id:t.scene_id}:(c.push(a),e.state.events.push({at:r,message:t.content_id+" \\xB7 "+t.version+" \\xB7 "+t.scene_id+" \\uD655\\uC815 \\uC774\\uBBF8\\uC9C0 \\uAE30\\uBC18 Higgsfield \\uC800\\uC7A5"}),{scene_id:t.scene_id,image_version:a.image_version,reused:!1})}function le(e,t,r=new Date().toISOString()){let s=t.id,o={key:crypto.randomUUID(),at:r,content:structuredClone(t),approval:e.state.approvals[s]||null,approvalHold:e.state.approvalHolds?.[s]||null,storyboard:e.state.storyboards?.[s]||null,final:e.state.finals[s]||null,finalVideo:e.state.finalVideos?.[s]||null,publications:(e.state.publications||[]).filter(n=>n.contentId===s),notes:e.state.notes.filter(n=>n.id===s),revisionRequests:(e.revisionRequests||[]).filter(n=>n.contentId===s)};return(e.trash||=[]).push(o),delete e.state.approvals[s],e.state.approvalHolds&&delete e.state.approvalHolds[s],delete e.state.finals[s],e.state.storyboards&&delete e.state.storyboards[s],e.state.finalVideos&&delete e.state.finalVideos[s],e.state.publications&&(e.state.publications=e.state.publications.filter(n=>n.contentId!==s)),e.state.notes=e.state.notes.filter(n=>n.id!==s),e.revisionRequests=(e.revisionRequests||[]).filter(n=>n.contentId!==s),o}function he(e,t,r=new Date().toISOString()){let s=(e.trash||[]).findIndex(a=>a.key===t);if(s<0)throw Error("\\uBCF5\\uC6D0\\uD560 \\uCF58\\uD150\\uCE20\\uB97C \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");let o=e.trash.splice(s,1)[0],n=o.content.id,i=e.contents.findIndex(a=>a.id===n);return i>=0?(le(e,e.contents[i],r),e.contents[i]=o.content):e.contents.push(o.content),delete e.state.approvals[n],e.state.approvalHolds&&delete e.state.approvalHolds[n],delete e.state.finals[n],o.approval&&(e.state.approvals[n]=o.approval),o.approvalHold&&((e.state.approvalHolds||={})[n]=o.approvalHold),o.final&&(e.state.finals[n]=o.final),o.storyboard&&((e.state.storyboards||={})[n]=o.storyboard),o.finalVideo&&((e.state.finalVideos||={})[n]=o.finalVideo),o.publications?.length&&(e.state.publications||=[]).push(...o.publications),e.state.notes=[...e.state.notes.filter(a=>a.id!==n),...o.notes||[]],e.revisionRequests=[...(e.revisionRequests||[]).filter(a=>a.contentId!==n),...o.revisionRequests||[]],e.state.events.push({at:r,message:o.content.product+" \\xB7 \\uD734\\uC9C0\\uD1B5\\uC5D0\\uC11C \\uBCF5\\uC6D0"}),o.content}function ur(e,t={}){let r=t.ids,s=t.start_date,o=t.end_date;if(r!==void 0&&(!Array.isArray(r)||!r.length||r.length>100||r.some(c=>typeof c!="string"||!c.trim())||new Set(r).size!==r.length))throw Error("1~100\\uAC1C\\uC758 \\uC911\\uBCF5 \\uC5C6\\uB294 \\uCF58\\uD150\\uCE20 ID\\uB97C \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");let n=s!==void 0||o!==void 0;if(n&&(!/^\\d{4}-\\d{2}-\\d{2}$/.test(s||"")||!/^\\d{4}-\\d{2}-\\d{2}$/.test(o||"")||s>o))throw Error("\\uC2DC\\uC791\\uC77C\\uACFC \\uC885\\uB8CC\\uC77C\\uC744 \\uC815\\uD655\\uD788 \\uC9C0\\uC815\\uD574\\uC8FC\\uC138\\uC694.");if(!r&&!n)throw Error("\\uCF58\\uD150\\uCE20 ID \\uB610\\uB294 \\uC2DC\\uC791\\uC77C\\xB7\\uC885\\uB8CC\\uC77C\\uC744 \\uC9C0\\uC815\\uD574\\uC8FC\\uC138\\uC694.");if(r&&n)throw Error("\\uCF58\\uD150\\uCE20 ID \\uC120\\uD0DD\\uACFC \\uB0A0\\uC9DC \\uBC94\\uC704\\uB97C \\uB3D9\\uC2DC\\uC5D0 \\uC0AC\\uC6A9\\uD558\\uC9C0 \\uB9C8\\uC138\\uC694.");let i=r?r.map(c=>e.contents.find(d=>d.id===c)).filter(Boolean):e.contents.filter(c=>c.date>=s&&c.date<=o);if(i.length>100)throw Error("\\uD55C \\uBC88\\uC5D0 \\uCD5C\\uB300 100\\uAC74\\uB9CC \\uC774\\uB3D9\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.");let a=r?r.filter(c=>!e.contents.some(d=>d.id===c)):[];return{selected:i,missing:a}}function pr(e,t){let r=t.id,s=[];return(e.state?.approvals?.[r]||e.state?.approvalHolds?.[r]||t.sourceApproval==="\\uC2B9\\uC778"||(t.reviews||[]).some(o=>o.sourceApproved)||(e.state?.approvalHistory||[]).some(o=>o.contentId===r))&&s.push("\\uC6D0\\uACE0 \\uC2B9\\uC778/\\uD655\\uC815 \\uAE30\\uB85D"),(e.state?.finals?.[r]||e.state?.finalVideos?.[r]||e.state?.storyboards?.[r]||(t.images||[]).length||(t.scenes||[]).length||t.drive)&&s.push("\\uC774\\uBBF8\\uC9C0\\xB7\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\xB7Drive \\uB610\\uB294 \\uC81C\\uC791\\uBB3C"),(e.state?.publications||[]).some(o=>o.contentId===r)&&s.push("SNS \\uAC8C\\uC2DC \\uAE30\\uB85D"),(e.productionRequests||[]).some(o=>o.snapshot?.contentId===r||o.identity?.snapshot?.contentId===r)&&s.push("\\uC81C\\uC791 \\uC694\\uCCAD"),(e.revisionRequests||[]).some(o=>o.contentId===r&&!["approved","withdrawn"].includes(o.status))&&s.push("\\uC9C4\\uD589 \\uC911\\uC778 \\uC218\\uC815 \\uC694\\uCCAD"),s}function Be(e,t){let{selected:r,missing:s}=ur(e,t),o=[],n=[];for(let a of r){let c={id:a.id,date:a.date,product:a.product,format:a.format,topic:a.topic},d=pr(e,a);d.length?n.push({...c,reasons:d}):o.push(c)}let i=new Set((e.trash||[]).map(a=>a.content?.id));return{eligible:o,protected:n,missing:s,already_archived:s.filter(a=>i.has(a)),selected_count:r.length,eligible_count:o.length,protected_count:n.length,preserved:"\\uC6D0\\uACE0\\xB7\\uAE30\\uD68D\\xB7\\uBA54\\uBAA8\\uB294 \\uD734\\uC9C0\\uD1B5\\uC5D0 \\uBCF4\\uAD00\\uD558\\uACE0 \\uC2E4\\uC81C \\uC774\\uBBF8\\uC9C0 \\uC6D0\\uBCF8/R2/Drive \\uD30C\\uC77C\\uC740 \\uC0AD\\uC81C\\uD558\\uC9C0 \\uC54A\\uC2B5\\uB2C8\\uB2E4."}}function It(e,t,{confirm:r,strict:s=!0,now:o=new Date().toISOString()}={}){if(r!=="\\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uC774\\uB3D9")throw Error("\\uC77C\\uAD04 \\uC774\\uB3D9 \\uD655\\uC778 \\uBB38\\uAD6C\\uAC00 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");let n=Be(e,t);if(n.missing.length)throw Error("\\uC120\\uD0DD\\uD55C \\uCF58\\uD150\\uCE20\\uAC00 \\uBCC0\\uACBD\\uB418\\uC5C8\\uC2B5\\uB2C8\\uB2E4. \\uBAA9\\uB85D\\uC744 \\uC0C8\\uB85C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");if(s&&n.protected_count)throw Error("\\uC2B9\\uC778\\xB7\\uC81C\\uC791\\xB7\\uAC8C\\uC2DC\\xB7\\uC218\\uC815 \\uC911\\uC778 \\uCF58\\uD150\\uCE20\\uAC00 \\uD3EC\\uD568\\uB418\\uC5B4 \\uC788\\uC2B5\\uB2C8\\uB2E4. \\uBCF4\\uD638 \\uD56D\\uBAA9\\uC744 \\uC81C\\uC678\\uD558\\uACE0 \\uB2E4\\uC2DC \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");if(!n.eligible_count)throw Error("\\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uC774\\uB3D9\\uD560 \\uC218 \\uC788\\uB294 \\uBBF8\\uC2B9\\uC778 \\uAE30\\uD68D\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");let i="BULK-"+crypto.randomUUID(),a=[];for(let c of n.eligible){let d=e.contents.findIndex(h=>h.id===c.id),l=e.contents[d],p=le(e,l,o);p.batchId=i,p.reason="\\uC77C\\uAD04 \\uD734\\uC9C0\\uD1B5 \\uBCF4\\uAD00",e.contents.splice(d,1),a.push({id:c.id,key:p.key})}return e.state.events.push({at:o,message:`\\uAE30\\uD68D ${a.length}\\uAC74 \\uC77C\\uAD04 \\uD734\\uC9C0\\uD1B5 \\uC774\\uB3D9 \\xB7 \\uBC30\\uCE58 ${i}`}),{batch_id:i,archived:a,skipped:n.protected,archived_count:a.length,protected_count:n.protected_count}}function Et(e,t,{confirm:r,now:s=new Date().toISOString()}={}){if(r!=="\\uC120\\uD0DD \\uD56D\\uBAA9 \\uBCF5\\uC6D0")throw Error("\\uBCF5\\uC6D0 \\uD655\\uC778 \\uBB38\\uAD6C\\uAC00 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");if(!Array.isArray(t)||!t.length||t.length>100||new Set(t).size!==t.length||t.some(i=>typeof i!="string"||!i))throw Error("\\uBCF5\\uC6D0\\uD560 \\uD734\\uC9C0\\uD1B5 \\uD56D\\uBAA9 1~100\\uAC1C\\uB97C \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.");let o=t.map(i=>(e.trash||[]).find(a=>a.key===i));if(o.some(i=>!i))throw Error("\\uD734\\uC9C0\\uD1B5 \\uD56D\\uBAA9\\uC774 \\uBCC0\\uACBD\\uB418\\uC5C8\\uC2B5\\uB2C8\\uB2E4. \\uBAA9\\uB85D\\uC744 \\uC0C8\\uB85C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");if(o.some(i=>e.contents.some(a=>a.id===i.content.id)))throw Error("\\uB3D9\\uC77C \\uCF58\\uD150\\uCE20 ID\\uAC00 \\uD65C\\uC131 \\uBAA9\\uB85D\\uC5D0 \\uC788\\uC5B4 \\uBCF5\\uC6D0\\uD560 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");let n=[];for(let i of t){let a=he(e,i,s);n.push(a.id)}return e.contents.sort((i,a)=>i.date.localeCompare(a.date)||i.id.localeCompare(a.id)),{restored:n,count:n.length}}function $t(e,t,r,s=new Date().toISOString()){let o=K(e,t),n=e.contents.find(c=>c.id===o.snapshot.contentId),i=n&&R(e,n);if(!i||i.version!==o.snapshot.version||o.parentId||Pe(e,o)!=="completed"||!o.reviewedAt)throw Error("\\uD604\\uC7AC \\uC2B9\\uC778 \\uC6D0\\uACE0\\uC758 \\uD655\\uC778\\uB41C \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C\\uC744 \\uBA3C\\uC800 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");if(n.format!=="Reel"||!G(r))throw Error("\\uCD5C\\uC885 \\uC601\\uC0C1\\uC758 Google Drive \\uC6D0\\uBCF8 \\uB9C1\\uD06C\\uB97C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");let a=q(e,n,i);if(a.pending||a.unchecked)throw Error("\\uC9C4\\uD589 \\uC911\\uC778 \\uC774\\uBBF8\\uC9C0 \\uC218\\uC815\\uBCF8\\uC744 \\uBA3C\\uC800 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");return o.finalVideoUrl===r&&o.finalVideoAt&&a.family.every(c=>c.id===o.id||c.createdAt<=o.finalVideoAt)?{request:o,reused:!0}:(o.finalVideoUrl=r,o.finalVideoAt=s,o.updatedAt=s,o.events.push({at:s,message:"\\uC0AC\\uC6A9\\uC790\\uAC00 \\uCD5C\\uC885 \\uC601\\uC0C1 \\uC6D0\\uBCF8 \\uB9C1\\uD06C \\uC5F0\\uACB0"}),{request:o,reused:!1})}function At(e,t,r,s=new Date().toISOString()){let o=e.contents.find(d=>d.id===t),n=o&&R(e,o);if(!n||o.format!=="Reel"||!G(r))throw Error("\\uC2B9\\uC778\\uB41C \\uB9B4\\uC2A4\\uC640 \\uCD5C\\uC885 \\uC601\\uC0C1\\uC758 Google Drive \\uC6D0\\uBCF8 \\uB9C1\\uD06C\\uB97C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let i=q(e,o,n);if(i.root||!i.legacyConfirmed)throw Error("\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C\\uC758 \\uD655\\uC778 \\uAE30\\uB85D\\uC744 \\uBA3C\\uC800 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let a=e.state.finalVideos?.[t];if(a?.version===n.version&&a.driveUrl===r&&JSON.stringify(a.sections)===JSON.stringify(n.sections))return{video:a,reused:!0};let c={version:n.version,sections:structuredClone(n.sections),driveUrl:r,at:s};return(e.state.finalVideos||={})[t]=c,e.state.events.push({at:s,message:o.product+" \\xB7 \\uC0AC\\uC6A9\\uC790\\uAC00 \\uCD5C\\uC885 \\uC601\\uC0C1 \\uC6D0\\uBCF8 \\uB9C1\\uD06C \\uC5F0\\uACB0"}),{video:c,reused:!1}}function Rt(e,t,r,s=new Date().toISOString()){let o=e.contents.find(l=>l.id===t),n=o&&R(e,o);if(!n)throw Error("\\uC2B9\\uC778\\uB41C \\uC6D0\\uACE0\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");let i=q(e,o,n);if(!pe(e,o,n,i))throw Error("\\uCD5C\\uC885 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC778\\uACFC \\uC601\\uC0C1 \\uC6D0\\uBCF8 \\uC5F0\\uACB0\\uC744 \\uBA3C\\uC800 \\uB9C8\\uCCD0\\uC8FC\\uC138\\uC694.");let a;try{a=new URL(r)}catch{}if(!a||a.protocol!=="https:"||!["instagram.com","www.instagram.com","tiktok.com","www.tiktok.com","youtube.com","www.youtube.com","youtu.be"].includes(a.hostname)||a.pathname==="/"||a.pathname.length<3||r.length>600)throw Error("\\uC2E4\\uC81C SNS \\uAC8C\\uC2DC\\uBB3C\\uC758 \\uB9C1\\uD06C\\uB97C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");let c=W(e,o,n,i);if(c?.url===a.href)return{publication:c,reused:!0};let d={contentId:t,version:n.version,sections:structuredClone(n.sections),mediaSignature:Te(i),url:a.href,at:s,source:"user"};return(e.state.publications||=[]).push(d),e.state.events.push({at:s,message:o.product+" \\xB7 SNS \\uAC8C\\uC2DC\\uBB3C \\uB9C1\\uD06C \\uC9C1\\uC811 \\uB4F1\\uB85D"}),{publication:d,reused:!1}}function _t(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)&&Object.keys(e).every(t=>["Reel","Carousel","Image"].includes(t))&&["Reel","Carousel","Image"].every(t=>typeof e[t]=="string"&&e[t].trim().length>0&&e[t].length<=12e3)}function xt(e,t){let r=n=>n!==null&&typeof n=="object"&&!Array.isArray(n),s=n=>typeof n=="string",o=n=>s(n)&&Number.isFinite(Date.parse(n));if(!r(e)||!r(e.approvals)||!r(e.finals)||!Array.isArray(e.notes)||!Array.isArray(e.events)||e.writingPrompts!==void 0&&!_t(e.writingPrompts))return!1;if(e.approvalHolds!==void 0){if(!r(e.approvalHolds))return!1;for(let[n,i]of Object.entries(e.approvalHolds)){let a=t.find(c=>c.id===n);if(!a||!r(i)||!s(i.version)||!a.reviews.some(c=>c.version===i.version)||!o(i.at)||e.approvals[n])return!1}}for(let[n,i]of Object.entries(e.approvals)){let a=t.find(c=>c.id===n);if(!a||!r(i)||!o(i.at)||i.source!=="site"||!a.reviews.some(c=>c.version===i.version&&JSON.stringify(c.sections)===JSON.stringify(i.sections)))return!1}for(let[n,i]of Object.entries(e.finals)){let a=t.find(c=>c.id===n);if(!a||!r(i)||!o(i.at)||i.version!==a.originalVersion||JSON.stringify(i.files)!==JSON.stringify(a.images.map(c=>c.id)))return!1}if(!e.notes.every(n=>r(n)&&t.some(i=>i.id===n.id)&&s(n.target)&&s(n.text)&&n.text.trim()&&o(n.at))||e.publications!==void 0&&(!Array.isArray(e.publications)||!e.publications.every(n=>r(n)&&s(n.contentId)&&s(n.version)&&Array.isArray(n.sections)&&s(n.mediaSignature)&&s(n.url)&&o(n.at)&&n.source==="user"))||e.finalVideos!==void 0&&(!r(e.finalVideos)||!Object.values(e.finalVideos).every(n=>r(n)&&s(n.version)&&Array.isArray(n.sections)&&s(n.driveUrl)&&o(n.at))))return!1;if(e.storyboards!==void 0){if(!r(e.storyboards))return!1;for(let[n,i]of Object.entries(e.storyboards)){let a=t.find(c=>c.id===n);if(!a||!r(i))return!1;for(let[c,d]of Object.entries(i))if(!a.reviews.some(l=>l.version===c)||!r(d)||!o(d.updatedAt)||!Array.isArray(d.scenes)||d.scenes.length<1||d.scenes.length>20||!d.scenes.every(l=>r(l)&&s(l.timing)&&l.timing.length<=60&&s(l.visual)&&l.visual.length<=2e3&&s(l.subtitle)&&l.subtitle.length<=2e3&&s(l.prompt)&&l.prompt.length<=5e3&&s(l.reference)&&l.reference.length<=1e3&&(l.motion===void 0||s(l.motion)&&l.motion.length<=2e3)))return!1}}return e.events.every(n=>r(n)&&o(n.at)&&s(n.message))}var Ke=e=>({contents:e,state:{approvals:{},notes:[],finals:{},events:[]},productionRequests:[],revisionRequests:[],reports:[],trash:[]}),N=(e,t)=>e.contents.find(r=>r.id===t)||(()=>{throw Error("\\uCF58\\uD150\\uCE20\\uB97C \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.")})();function y(e,t){let r=structuredClone(e),s=t(r);if(!xt(r.state,r.contents))throw Error("\\uC800\\uC7A5 \\uC0C1\\uD0DC \\uAC80\\uC99D \\uC2E4\\uD328(validState)");return{w:r,result:s}}function fr(e,t,r){let s;try{s=JSON.parse(r)}catch(n){throw Error("JSON \\uD615\\uC2DD \\uC624\\uB958: "+n.message)}if(s.content_id!==t)throw Error("content_id \\uBD88\\uC77C\\uCE58");let o=structuredClone(s.strategyV2||{});return o.quality={...o.quality||{},humanConfirmed:!1},y(e,n=>ke(n,{content_id:t,strategy:o}))}function mr(e,t,r){return y(e,s=>{let o=N(s,t),n=structuredClone(o.plan.strategyV2);return r(n,o),ke(s,{content_id:t,strategy:n})})}var vr=(e,t,r)=>y(e,s=>{let o=N(s,t);(o.plan.productFacts||=[]).push(r)}),be=e=>e.plan?.strategyV2?Oe(e.plan.strategyV2,e.plan.productFacts):{ready:!0,legacy:!0,reasons:[]};function gr(e){if(typeof e!="string"||!e.trim())return"";let t=e.replace(/\\.json$/i,"").trim(),r=t.match(/(?:^|[_\\-\\s.])([ABC])(?:\uC548)?$/i);return r?r[1].toUpperCase()+"\\uC548":t.slice(0,30)}var Ot=(e,t,r,s)=>{let o=N(e,t).reviews.find(n=>n.version===r);o&&s&&(o.label=s)};function kt(e){if(typeof e!="string")return{rest:e,comments:null};let t=e.trim(),r=/^```(?:json)?\\s*\\n([\\s\\S]*?)\\n```\\s*$/i.exec(t.replace(/\\r\\n/g,`\n`));r&&(t=r[1]);let s;try{s=JSON.parse(t)}catch{return{rest:e,comments:null}}if(!s||typeof s!="object"||Array.isArray(s)||!("comments"in s))return{rest:e,comments:null};let o=s.comments;delete s.comments;let n=Array.isArray(o)?o.map(i=>typeof i=="string"?i:i&&typeof i.text=="string"?i.text:null):null;if(!n||n.length>10||n.some(i=>typeof i!="string"||!i.trim()||i.length>300))throw Error("comments: \\uC608\\uC0C1 \\uB313\\uAE00\\uC740 1~300\\uC790 \\uBB38\\uC790\\uC5F4 \\uBAA9\\uB85D(\\uCD5C\\uB300 10\\uAC1C)\\uC774\\uC5B4\\uC57C \\uD569\\uB2C8\\uB2E4.");return{rest:JSON.stringify(s),comments:n.map(i=>i.trim())}}var hr=(e,t,r,s="")=>y(e,o=>{let{rest:n,comments:i}=kt(r),a=Ce(n,t),c=Ve(o,{content_id:t,script:a.script,caption:a.caption,...a.storyboard?{storyboard_scenes:a.storyboard}:{}});return Ot(o,t,c.version,gr(s)),i?.length&&(N(o,t).reviews.find(d=>d.version===c.version).expectedComments=i),c}),Ye=(e,t)=>{let r=e.reviews.find(s=>s.version===t);return{content_id:e.id,script:r.sections.map(s=>s.text).join(`\n`),caption:r.caption||"",...r.expectedComments?.length?{comments:r.expectedComments}:{}}},z=(e,t)=>{let r=e.reviews.find(s=>s.version===t);return r?.label?r.label:t};function br(e,t,r){return y(e,s=>{let o=N(s,t),n=be(o);if(!n.ready)throw Error("\\uAE30\\uD68D \\uAC8C\\uC774\\uD2B8 \\uBBF8\\uD1B5\\uACFC: "+n.reasons.join(" / "));let i=o.reviews.find(d=>d.version===r);if(!i)throw Error("\\uC6D0\\uACE0 \\uBC84\\uC804\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");qe(s.state,t);let a=s.state.approvals[t];a&&(s.state.approvalHistory||=[]).push({contentId:t,...structuredClone(a)});let c=new Date().toISOString();s.state.approvals[t]={version:r,sections:structuredClone(i.sections),at:c,source:"site"},s.state.events.push({at:c,message:o.product+" \\xB7 "+r+" \\uC6D0\\uACE0 \\uD655\\uC815"}),B(s);for(let d of s.revisionRequests)d.contentId!==t||d.kind!=="script"||["approved","withdrawn"].includes(j(s,d))||je(s,d)||(d.status="withdrawn",d.withdrawnAt=c,(d.events||=[]).push({at:c,message:"\\uC0AC\\uC6A9\\uC790\\uAC00 "+r+"\\uB97C \\uD655\\uC815\\uD558\\uC5EC \\uC774\\uC804 \\uC218\\uC815 \\uC694\\uCCAD \\uC885\\uB8CC (\\uC6D0\\uBB38\\xB7\\uC218\\uC815\\uBCF8 \\uBCF4\\uC874)"}));Nt(s)})}function Nt(e){for(let t of e.revisionRequests||[]){let r=j(e,t);(r==="approved"||r==="withdrawn")&&t.status!==r&&(t.status=r)}}var yr=(e,t,r)=>y(e,s=>dt(s,{content_id:t,version:r})),ye=["purpose","action","camera_angle","shot_size","composition","product_position","start_frame","end_frame","image_criteria"],Ct={purpose:"\\uBAA9\\uC801",action:"\\uD589\\uB3D9",camera_angle:"\\uC575\\uAE00",shot_size:"\\uC0F7 \\uD06C\\uAE30",composition:"\\uAD6C\\uB3C4\\xB7\\uC6C0\\uC9C1\\uC784",product_position:"\\uC81C\\uD488 \\uC704\\uCE58",start_frame:"\\uC2DC\\uC791 \\uD504\\uB808\\uC784",end_frame:"\\uC885\\uB8CC \\uD504\\uB808\\uC784",image_criteria:"\\uC774\\uBBF8\\uC9C0 \\uAE30\\uC900"};function Sr(e,t){if(!e||typeof e!="object")return null;let r={};for(let s of ye)if(e[s]!==void 0){if(typeof e[s]!="string"||!e[s].trim()||e[s].length>600)throw Error(`storyboard[${t}].${s}: 1~600\\uC790 \\uBB38\\uC790\\uC5F4\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.`);r[s]=e[s].trim()}return Object.keys(r).length?r:null}function Dt(e){let t=e?.scenes||[],r=t.map(n=>n.shot?.camera_angle).filter(Boolean),s=[];t.length>=3&&r.length===t.length&&new Set(r).size===1&&s.push("\\uBAA8\\uB4E0 \\uCEF7\\uC758 \\uCE74\\uBA54\\uB77C \\uC575\\uAE00\\uC774 \\uAC19\\uC2B5\\uB2C8\\uB2E4("+r[0]+"). \\uC815\\uBA74\\xB745\\uB3C4\\xB7POV\\xB7\\uD0D1\\uBDF0\\xB7\\uC624\\uBC84\\uC204\\uB354\\xB7\\uD074\\uB85C\\uC988\\uC5C5 \\uB4F1\\uC744 \\uC11E\\uB294 \\uAC83\\uC744 \\uAD8C\\uC7A5\\uD569\\uB2C8\\uB2E4.");let o=t.filter(n=>!n.shot).length;return o&&o<t.length&&s.push(o+"\\uAC1C \\uCEF7\\uC5D0 \\uAD6C\\uB3C4 \\uC815\\uBCF4\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4."),s}function wr(e,t,r){let s;try{s=JSON.parse(r)}catch(o){throw Error("JSON \\uD615\\uC2DD \\uC624\\uB958: "+o.message)}return y(e,o=>{let n=N(o,t),i=R(o,n);if(!i)throw Error("\\uD655\\uC815\\uB41C \\uC6D0\\uACE0\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");if(s.content_id!==t||s.script_version!==i.version)throw Error("content_id/script_version\\uC774 \\uD655\\uC815 \\uC6D0\\uACE0("+i.version+")\\uC640 \\uB2E4\\uB985\\uB2C8\\uB2E4.");if(!Array.isArray(s.storyboard))throw Error("storyboard: \\uC7A5\\uBA74 \\uBC30\\uC5F4\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.");let a=s.storyboard.map((p,h)=>Sr(p,h)),c=s.storyboard.map(p=>Object.fromEntries(Object.entries(p||{}).filter(([h])=>!ye.includes(h)))),d=ce(c),l=De(d).map((p,h)=>a[h]?{...p,shot:a[h]}:p);((o.state.storyboards||={})[t]||={})[i.version]={scenes:l,updatedAt:new Date().toISOString(),source:"storyboard-json"}})}var Se=(e,t,r)=>e.state.storyboards?.[t.id]?.[r.version]||(t.originalVersion===r.version&&(t.scenes||[]).length?{scenes:t.scenes,legacy:!0}:null),qt=(e,t,r)=>!r.root&&!!r.legacyImages&&e.originalVersion===t.version;function Ir(e,t,r){return y(e,s=>{let o=N(s,t),n=R(s,o);if(!n)throw Error("\\uD655\\uC815\\uB41C \\uC6D0\\uACE0\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");if(o.format==="Reel"){let a=s.state.storyboards?.[t]?.[n.version];if(!a)throw Error("\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uB97C \\uBA3C\\uC800 \\uC800\\uC7A5\\uD574\\uC8FC\\uC138\\uC694.");let c=ve(s,{content_id:t,version:n.version,scope:"scenes"}).request,d=n.sections.map(l=>l.text).join(`\n`);return He(s,c.id,{drive_folder:r,slots:a.scenes.map((l,p)=>({id:"scene-"+(p+1),label:"\\uC7A5\\uBA74 "+(p+1),source_text:d,prompt:l.visual,requires_product:!1,reference_urls:[]}))}),c.id}let i=ve(s,{content_id:t,version:n.version}).request;if(!i.slots.length)throw Error(o.format==="Carousel"?"\\uCE90\\uB7EC\\uC140 \\uC6D0\\uACE0\\uC5D0 \\uC7A5 \\uAD6C\\uBD84(\\uBE48 \\uC904)\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4. \\uC6D0\\uACE0\\uB97C \\uC7A5\\uBCC4\\uB85C \\uB098\\uB220 \\uB2E4\\uC2DC \\uAC00\\uC838\\uC640\\uC8FC\\uC138\\uC694.":"\\uC774\\uBBF8\\uC9C0 \\uC6D0\\uACE0\\uAC00 \\uBE44\\uC5B4 \\uC788\\uC2B5\\uB2C8\\uB2E4.");return He(s,i.id,{drive_folder:r,slots:i.slots.map(a=>({id:a.id,label:a.label,source_text:a.sourceText,prompt:Le.slice(0,400)+`\n\\uC7A5 \\uB0B4\\uC6A9: `+a.sourceText.slice(0,2e3),requires_product:!1,reference_urls:[]}))}),i.id})}function Er(e,t){return y(e,r=>{let s=N(r,t),o=R(r,s);if(!o||o.version!==s.originalVersion)throw Error("\\uD604\\uC7AC \\uD655\\uC815 \\uC6D0\\uACE0\\uC5D0 \\uD574\\uB2F9\\uD558\\uB294 \\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");if(!(s.images||[]).length||s.images.some(i=>!i.url))throw Error("Drive \\uC6D0\\uBCF8\\uC774 \\uBAA8\\uB450 \\uC5F0\\uACB0\\uB41C \\uC774\\uBBF8\\uC9C0\\uC5D0\\uC11C \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let n=new Date().toISOString();r.state.finals[t]={version:s.originalVersion,files:s.images.map(i=>i.id),at:n},r.state.events.push({at:n,message:s.product+" \\xB7 "+s.originalVersion+" \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C \\uD655\\uC778"})})}var $r=(e,t,r)=>y(e,s=>At(s,t,r));function Vt(e,t){let r=(d,l,p="",h="action")=>({k:d,l,why:p,lane:h}),s=be(t);if(!s.ready)return r("plan","\\uAE30\\uD68D \\uAC80\\uC218",s.reasons[0],t.plan?.strategyV2?"action":"waiting");let o=R(e,t);if(!o)return t.reviews.length?r("script","\\uC6D0\\uACE0 \\uD655\\uC815"):r("script","\\uC6D0\\uACE0 \\uC791\\uC131 \\uB300\\uAE30","\\uC6D0\\uACE0 JSON \\uAC00\\uC838\\uC624\\uAE30 \\uD544\\uC694","waiting");let n=(e.revisionRequests||[]).find(d=>d.contentId===t.id&&d.kind==="script"&&!["approved","withdrawn"].includes(j(e,d)));if(n)return j(e,n)==="review"?r("script","\\uC218\\uC815\\uBCF8 \\uAC80\\uD1A0","\\uC218\\uC815\\uBCF8\\uC744 \\uBE44\\uAD50\\uD55C \\uB4A4 \\uD655\\uC815\\uD558\\uAC70\\uB098 \\uCCA0\\uD68C\\uD558\\uC138\\uC694"):r("script","\\uC218\\uC815\\uBCF8 \\uB300\\uAE30","\\uC791\\uAC00 \\uC218\\uC815\\uBCF8\\uC744 \\uAE30\\uB2E4\\uB9AC\\uB294 \\uC911 \\xB7 \\uC694\\uCCAD: "+n.text.slice(0,40),"waiting");let i=t.format==="Reel",a=q(e,t,o),c=qt(t,o,a);if(i&&!c&&!a.root&&!Se(e,t,o))return r("storyboard","\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC \\uC791\\uC131 \\uB300\\uAE30","\\uD655\\uC815 \\uC6D0\\uACE0 \\uAE30\\uC900 \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC JSON \\uD544\\uC694","waiting");if(a.root){if(a.pending)return r("images","\\uC774\\uBBF8\\uC9C0 \\uC81C\\uC791 \\uB300\\uAE30","\\uC81C\\uC791 \\uB610\\uB294 \\uC218\\uC815\\uBCF8 \\uB300\\uAE30","waiting");if(a.needsSelection)return r("images","\\uC774\\uBBF8\\uC9C0 \\uC120\\uD0DD","\\uCEF7\\uB9C8\\uB2E4 \\uC0AC\\uC6A9\\uD560 \\uC774\\uBBF8\\uC9C0\\uB97C \\uACE8\\uB77C\\uC8FC\\uC138\\uC694");if(!a.ready)return r("images","\\uC774\\uBBF8\\uC9C0 \\uC804\\uCCB4 \\uD655\\uC815")}else if(c){if(!a.legacyConfirmed)return r("images","\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC778","\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 "+a.legacyImages+"\\uC7A5\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694")}else return r("images","\\uC774\\uBBF8\\uC9C0 \\uC81C\\uC791 \\uC694\\uCCAD");if(i){if(a.root){if(!re(e,t.id,o.version).scenes.every(l=>l.prompt_status==="current"))return r("video","Higgsfield \\uD504\\uB86C\\uD504\\uD2B8","\\uCEF7\\uBCC4 \\uD504\\uB86C\\uD504\\uD2B8 \\uAC80\\uC99D\\xB7\\uC800\\uC7A5 \\uD544\\uC694");if(!a.root.finalVideoUrl)return r("video","\\uC601\\uC0C1 \\uB9C1\\uD06C \\uAE30\\uB85D","\\uC644\\uC131 \\uC601\\uC0C1\\uC758 Drive \\uC6D0\\uBCF8 \\uB9C1\\uD06C \\uD544\\uC694")}else if(!a.finalVideoUrl)return r("video","\\uC601\\uC0C1 \\uB9C1\\uD06C \\uAE30\\uB85D","\\uC644\\uC131 \\uC601\\uC0C1\\uC758 Drive \\uC6D0\\uBCF8 \\uB9C1\\uD06C \\uD544\\uC694")}return pe(e,t,o,a)?W(e,t,o,a)?r("done","\\uC644\\uB8CC","","done"):r("publish","\\uAC8C\\uC2DC \\uB9C1\\uD06C \\uAE30\\uB85D","\\uC2E4\\uC81C \\uAC8C\\uC2DC \\uD6C4 \\uB9C1\\uD06C\\uB97C \\uAE30\\uB85D\\uD558\\uC138\\uC694"):r("video","\\uC601\\uC0C1 \\uB9C1\\uD06C \\uD655\\uC778")}var We=(e,t)=>{let r=R(e,t);return r?{a:r,m:q(e,t,r),legacy:qt(t,r,q(e,t,r))}:null};function Tt(e,t,r,s){return y(e,o=>{let n=o.productionRequests.find(i=>i.id===t);!n.slots.find(i=>i.id===r)?.asset&&n.slots.find(i=>i.id===r)?.state==="pending"&&ht(o,t,r),bt(o,t,r,s)})}var Ar=(e,t,r,s,o)=>y(e,n=>yt(n,t,r,s,o)),Rr=(e,t)=>y(e,r=>St(r,t)),Ut=(e,t,r)=>re(e,t,r);function _r(e,t){return y(e,r=>{let s=r.productionRequests.find(l=>l.id===t);if(!s)throw Error("\\uC774\\uBBF8\\uC9C0 \\uC81C\\uC791 \\uC694\\uCCAD\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");let o=P(r.productionRequests,s),n=o.root;if(!o.family.some(l=>l.reviewedAt))throw Error("\\uD655\\uC815\\uB41C \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C\\uC774 \\uC544\\uB2D9\\uB2C8\\uB2E4.");let i=N(r,n.snapshot.contentId),a=R(r,i);if(a&&a.version===n.snapshot.version&&W(r,i,a,q(r,i,a)))throw Error("\\uC774\\uBBF8 \\uAC8C\\uC2DC \\uAE30\\uB85D\\uC774 \\uC788\\uC5B4 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC815\\uC744 \\uD574\\uC81C\\uD560 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");let c=new Date().toISOString(),d=!!n.finalVideoAt;for(let l of o.family)l.reviewedAt&&(delete l.reviewedAt,l.updatedAt=c,(l.events||=[]).push({at:c,message:"\\uC0AC\\uC6A9\\uC790\\uAC00 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC815 \\uD574\\uC81C"}));delete n.finalVideoAt,r.state.events.push({at:c,message:i.product+" \\xB7 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC815 \\uD574\\uC81C"+(d?" (\\uC601\\uC0C1 \\uB9C1\\uD06C\\uB294 \\uB2E4\\uC2DC \\uD655\\uC815 \\uD6C4 \\uC7AC\\uAE30\\uB85D \\uD544\\uC694)":"")})})}function xr(e,t){return y(e,r=>{let s=N(r,t),o=R(r,s);if(!r.state.finals[t])throw Error("\\uD655\\uC778\\uB41C \\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");if(o&&W(r,s,o,q(r,s,o)))throw Error("\\uC774\\uBBF8 \\uAC8C\\uC2DC \\uAE30\\uB85D\\uC774 \\uC788\\uC5B4 \\uD655\\uC778\\uC744 \\uD574\\uC81C\\uD560 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");delete r.state.finals[t],r.state.events.push({at:new Date().toISOString(),message:s.product+" \\xB7 \\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C \\uD655\\uC778 \\uD574\\uC81C"})})}function Ft(e){let t=e.scene.timing.match(/([\\d.]+)s?\\s*[\u2013\u2014~\u2212-]\\s*([\\d.]+)/),r=Number(t[2])-Number(t[1]),s="[\\uC9C1\\uC811 \\uD655\\uC778 \\uD6C4 \\uC791\\uC131]",o=e.scene.shot||{},n=(...a)=>a.filter(Boolean).join(" / ")||s,i={"SCENE CONTEXT":n(o.purpose&&"\\uBAA9\\uC801: "+o.purpose,e.scene.visual),"ACTIVE REFERENCES":"\\uD655\\uC815 \\uC774\\uBBF8\\uC9C0 \\uC6D0\\uBCF8 "+e.image.original_url,WARDROBE:s,"LOCATION MAP":s,"FIRST FRAME / BLOCKING":n(o.start_frame,o.composition,o.product_position&&"\\uC81C\\uD488: "+o.product_position),"FORMAT MODE":"9:16 vertical",OPTICS:s,CAMERA:n(o.camera_angle,o.shot_size),ACTION:"0.0s "+e.scene.motion+" / "+r.toFixed(1)+"s",PERFORMANCE:s,PHYSICS:s,LIGHTING:"natural light, low-saturation cream/warm-gray/olive",STYLE:"smartphone-shot daily life photo feel","POSITIVE LOCKS":"no text, logo, subtitle, watermark; product shape from original reference",AUDIO:"ambient sound and sound effects only; no voice, no music, no subtitles","END FRAME":o.end_frame||s,TIMING:r.toFixed(1)+"s"};return[...te,...ge].map(a=>a+": "+i[a]).join(`\n`)}var Or=(e,t,r,s,o)=>y(e,n=>wt(n,{content_id:t,version:r,scene_id:s.scene_id,request_id:s.image.request_id,image_version:s.image.image_version,original_url:s.image.original_url,prompt:o})),kr=(e,t,r)=>y(e,s=>$t(s,t,r)),Nr=(e,t,r)=>y(e,s=>Rt(s,t,r)),Cr=(e,t,r,s,o)=>y(e,n=>{let i=R(n,N(n,t));return ve(n,{content_id:t,version:i.version,parent_id:r,slot_id:s,note:o}).request.id}),Dr=(e,t,r="\\uC0AC\\uC6A9\\uC790 \\uBCF4\\uAD00")=>y(e,s=>{let o=s.contents.findIndex(i=>i.id===t);if(o<0)throw Error("\\uBCF4\\uAD00\\uD560 \\uCF58\\uD150\\uCE20\\uB97C \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");let n=le(s,s.contents[o]);return n.reason=r,s.contents.splice(o,1),n.key}),qr=(e,t)=>y(e,r=>he(r,t)),Vr=(e,t,r,s)=>y(e,o=>ut(o,{content_id:t,version:r,text:s,kind:"script"}).request.id);function Tr(e,t,r,s){return y(e,o=>{B(o);let n=o.revisionRequests.find(p=>p.id===t);if(!n)throw Error("\\uC218\\uC815 \\uC694\\uCCAD\\uC744 \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");if(typeof s!="string"||!s.trim())throw Error("\\uBCC0\\uACBD \\uC694\\uC57D\\uC744 \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");let{rest:i,comments:a}=kt(r),c=Ce(i,n.contentId),d=Ve(o,{content_id:n.contentId,script:c.script,caption:c.caption});a?.length&&(N(o,n.contentId).reviews.find(p=>p.version===d.version).expectedComments=a),Ot(o,n.contentId,d.version,"\\uC218\\uC815\\uBCF8 ("+z(N(o,n.contentId),n.version)+")");let l=pt(o,t).request;return ft(o,{request_id:t,claim:l.claim,response_version:d.version,change_summary:s.trim()}),d.version})}var Ur=(e,t)=>y(e,r=>{mt(r,t),Nt(r)}),jt=(e,t)=>{let r=B(structuredClone(e));return r.revisionRequests.filter(s=>s.contentId===t&&s.kind==="script").map(s=>({...s,status:j(r,s)}))};function ze(e,t){let r=B(structuredClone(e)),s=r.revisionRequests.find(a=>a.id===t),o=r.contents.find(a=>a.id===s.contentId),n=o.reviews.find(a=>a.version===s.version),i=o.plan?.strategyV2;return["[ISHARD \\uC6D0\\uACE0 \\uC218\\uC815 \\uC694\\uCCAD "+s.id+"]","\\uCF58\\uD150\\uCE20: "+o.id+" ("+o.format+", \\uAC8C\\uC2DC\\uC77C "+o.date+")",i?"\\uAD6C\\uB9E4 \\uC9C8\\uBB38: "+i.core.purchaseQuestion+`\n\\uC2EC\\uB9AC \\uC7A5\\uBCBD: `+i.core.barrier+`\n\\uC120\\uD0DD \\uC774\\uC720: `+i.fit.selectionReason+`\n\\uD45C\\uD604 \\uD55C\\uACC4: `+(i.fit.claimLimit||"-"):"\\uAE30\\uD68D: \\uAD6C\\uD615(\\uC694\\uC57D \\uC5C6\\uC74C)","","\\uC6D0\\uBCF8 \\uBC84\\uC804: "+s.version,"--- \\uB300\\uBCF8 ---",n.sections.map(a=>a.text).join(`\n`),"--- \\uCEA1\\uC158 ---",n.caption||"","","\\uC694\\uCCAD: "+s.text,"","\\uADDC\\uCE59: \\uD655\\uC778\\uB41C \\uACF5\\uC2DD \\uADFC\\uAC70\\uB9CC \\uC0AC\\uC6A9, \\uD5C8\\uC704 \\uD6C4\\uAE30\\xB7\\uACFC\\uC7A5 \\uD6A8\\uB2A5\\xB7\\uCE58\\uB8CC \\uD6A8\\uACFC \\uAE08\\uC9C0, \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\xB7\\uD654\\uBA74 \\uC5F0\\uCD9C\\uC740 \\uC4F0\\uC9C0 \\uC54A\\uC74C.","\\uCD9C\\uB825: \\uC544\\uB798 JSON \\uD55C \\uAC1C\\uB9CC",JSON.stringify({content_id:o.id,script:"\\uC218\\uC815\\uD55C \\uB300\\uBCF8",caption:"\\uC218\\uC815\\uD55C \\uCEA1\\uC158"})].join(`\n`)}var Jt=(e,t)=>Be(structuredClone(e),t),Fr=(e,t)=>y(e,r=>It(r,t,{confirm:"\\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uC774\\uB3D9",strict:!0})),jr=(e,t)=>y(e,r=>Et(r,t,{confirm:"\\uC120\\uD0DD \\uD56D\\uBAA9 \\uBCF5\\uC6D0"})),Jr=/^ISHARD[-\\w]+$/,Mr=/^\\d{4}-\\d{2}-\\d{2}$/;function Lr(e,t){return y(e,r=>{let s=String(t.id||"").trim(),o=String(t.topic||"").trim(),n=String(t.product||"").trim(),i=String(t.drive||"").trim();if(!Jr.test(s)||s.length>80)throw Error("\\uCF58\\uD150\\uCE20 ID\\uB294 ISHARD\\uB85C \\uC2DC\\uC791\\uD558\\uACE0 \\uC601\\uBB38\\xB7\\uC22B\\uC790\\xB7-\\xB7_\\uB9CC \\uC0AC\\uC6A9\\uD574\\uC8FC\\uC138\\uC694.");if(r.contents.some(a=>a.id===s)||(r.trash||[]).some(a=>a.content?.id===s))throw Error("\\uC774\\uBBF8 \\uC788\\uB294 \\uCF58\\uD150\\uCE20 ID\\uC785\\uB2C8\\uB2E4(\\uD734\\uC9C0\\uD1B5 \\uD3EC\\uD568).");if(!Mr.test(t.date||"")||isNaN(Date.parse(t.date)))throw Error("\\uAC8C\\uC2DC\\uC77C\\uC744 YYYY-MM-DD\\uB85C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");if(!["Reel","Carousel","Image"].includes(t.format))throw Error("\\uD615\\uC2DD\\uC740 \\uB9B4\\uC2A4\\xB7\\uCE90\\uB7EC\\uC140\\xB7\\uC774\\uBBF8\\uC9C0 \\uC911 \\uD558\\uB098\\uC785\\uB2C8\\uB2E4.");if(!o||o.length>200||n.length>100)throw Error("\\uC8FC\\uC81C(1~200\\uC790)\\uC640 \\uC81C\\uD488\\uBA85(100\\uC790 \\uC774\\uB0B4)\\uC744 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");if(i&&!G(i,!0))throw Error("Drive \\uD3F4\\uB354 \\uB9C1\\uD06C\\uB294 https://drive.google.com/drive/folders/\\u2026 \\uD615\\uC2DD\\uC774\\uC5B4\\uC57C \\uD569\\uB2C8\\uB2E4.");return r.contents.push({id:s,date:t.date,product:n||"-",format:t.format,topic:o,plan:{},reviews:[],originalVersion:"",sourceApproval:"\\uB300\\uAE30",production:"\\uBBF8\\uCC29\\uC218",drive:i,images:[],scenes:[]}),r.contents.sort((a,c)=>a.date.localeCompare(c.date)||a.id.localeCompare(c.id)),r.state.events.push({at:new Date().toISOString(),message:s+" \\xB7 \\uC0C8 \\uCF58\\uD150\\uCE20 \\uB4F1\\uB85D"}),s})}function Pr(e,t,r,s){return mr(e,t,(o,n)=>{let i=o.quality;if(r==="fit"){let a=n.plan.productFacts||[];if(!a.length)throw Error("\\uACF5\\uC2DD \\uADFC\\uAC70\\uB97C \\uBA3C\\uC800 \\uB4F1\\uB85D\\uD558\\uC138\\uC694.");o.fit.verification="verified",o.fit.sourceIds=a.map(c=>c.id)}else if(r==="text")i.claimReview="pass",i.duplicateReview="pass";else if(r==="human")i.humanConfirmed=!0;else if(r==="score"){if(!s||typeof s!="object")throw Error("\\uC810\\uC218\\uB97C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");i.scores=s}else throw Error("\\uC54C \\uC218 \\uC5C6\\uB294 \\uAC80\\uC218 \\uB3D9\\uC791\\uC785\\uB2C8\\uB2E4.")})}function Hr(e,t,r,s,o=""){let n=/\\/file\\/d\\/([\\w-]+)/.exec(String(s||""));if(!n||!G(s))throw Error("Drive \\uD30C\\uC77C \\uB9C1\\uD06C(https://drive.google.com/file/d/\\u2026/view)\\uB97C \\uC785\\uB825\\uD574\\uC8FC\\uC138\\uC694.");return Tt(e,t,r,{fileName:String(o||r+".png").slice(0,200),driveUrl:s,previewKey:"drive/"+n[1]})}function Gr(e,t,r,s){let o=N(e,t),n=R(e,o);if(!n)throw Error("\\uD655\\uC815\\uB41C \\uC6D0\\uACE0\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.");let i=re(e,t,n.version).scenes.find(a=>a.scene_id===r);if(!i||!i.image)throw Error("\\uD655\\uC815\\uB41C \\uC7A5\\uBA74 \\uC774\\uBBF8\\uC9C0\\uB97C \\uCC3E\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4.");if(String(s).includes("[\\uC9C1\\uC811 \\uD655\\uC778 \\uD6C4 \\uC791\\uC131]"))throw Error(\'"[\\uC9C1\\uC811 \\uD655\\uC778 \\uD6C4 \\uC791\\uC131]" \\uD56D\\uBAA9\\uC744 \\uBA3C\\uC800 \\uCC44\\uC6CC\\uC8FC\\uC138\\uC694.\');return Or(e,t,n.version,i,s)}var Mt={createContent:(e,t)=>Lr(e,t),importStrategy:(e,t)=>fr(e,t.id,t.text),addFact:(e,t)=>vr(e,t.id,{id:String(t.fact?.id||"").trim(),fact:String(t.fact?.fact||"").trim(),source:String(t.fact?.source||"").trim()}),reviewStrategy:(e,t)=>Pr(e,t.id,t.kind,t.scores),importScript:(e,t)=>hr(e,t.id,t.text,t.fileName),approve:(e,t)=>br(e,t.id,t.version),release:(e,t)=>yr(e,t.id,t.version),requestScriptRevision:(e,t)=>Vr(e,t.id,t.version,t.text),answerRevision:(e,t)=>Tr(e,t.requestId,t.text,t.summary),withdrawScriptRevision:(e,t)=>Ur(e,t.requestId),saveStoryboard:(e,t)=>wr(e,t.id,t.text),requestImages:(e,t)=>Ir(e,t.id,t.folder),registerImage:(e,t)=>Hr(e,t.requestId,t.slotId,t.url,t.fileName),pick:(e,t)=>Ar(e,t.rootId,t.slotId,t.candidateId,t.previewKey),confirmImages:(e,t)=>Rr(e,t.rootId),unconfirmImages:(e,t)=>_r(e,t.rootId),requestRevision:(e,t)=>Cr(e,t.id,t.rootId,t.slotId,t.note),confirmLegacyImages:(e,t)=>Er(e,t.id),unconfirmLegacyImages:(e,t)=>xr(e,t.id),saveHiggsScene:(e,t)=>Gr(e,t.id,t.sceneId,t.prompt),finalVideo:(e,t)=>kr(e,t.rootId,t.url),legacyVideo:(e,t)=>$r(e,t.id,t.url),publish:(e,t)=>Nr(e,t.id,t.url),archive:(e,t)=>Dr(e,t.id),restore:(e,t)=>qr(e,t.key),bulkArchive:(e,t)=>Fr(e,{ids:t.ids}),bulkRestore:(e,t)=>jr(e,t.keys)},Lt={addImage:(e,t)=>Tt(e,t.requestId,t.slotId,t.asset)};function Pt(e,t){return{revision:e.revision,contents:e.contents.filter(r=>r.date.startsWith(t)).map(r=>{let s=R(e,r),o=s?q(e,r,s):null,i=(o?.ready&&o.slots?.find(d=>/cover|\uCEE4\uBC84/i.test((d.original?.label||"")+" "+d.id)))?.selected||(o?.ready?o.slots?.[0]?.selected:null),a=i?.slot.asset,c=a?.previewKey?"/api/production/preview?request="+encodeURIComponent(i.request.id)+"&slot="+encodeURIComponent(i.slot.id)+"&v="+encodeURIComponent(a.previewKey.split("/").pop()):r.images?.[0]?.src;return{id:r.id,date:r.date,product:r.product,format:r.format,feedPreview:c?{src:c,label:i?"\\uC120\\uD0DD\\xB7\\uD655\\uC778\\uD55C \\uC81C\\uC791 \\uC774\\uBBF8\\uC9C0":"\\uAE30\\uC874 \\uC81C\\uC791 \\uC774\\uBBF8\\uC9C0"}:null}})}}var Wt="ishard-studio-v3",u=e=>String(e??"").replace(/[&<>"\']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;","\'":"&#39;"})[t]),we=(e,t={})=>({id:e,date:"2026-11-04",product:"(\\uB370\\uBAA8)",format:"Reel",topic:"\\uB370\\uBAA8",plan:{},reviews:[],originalVersion:"",sourceApproval:"\\uB300\\uAE30",production:"\\uBBF8\\uCC29\\uC218",drive:"",images:[],scenes:[],...t}),Kr=()=>we("ISHARD-DEMO-20261020-R00",{date:"2026-11-02",topic:"(\\uB370\\uBAA8) \\uAD6C\\uD615 \\uB9B4\\uC2A4 \\u2014 \\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC778 \\uD750\\uB984",originalVersion:"V1-B",sourceApproval:"\\uC2B9\\uC778",production:"\\uC644\\uB8CC",drive:"https://drive.google.com/drive/folders/DEMOLEGACY",reviews:[{version:"V1-A",sourceApproved:!1,sections:[{heading:"\\uBCF8\\uBB38",text:"(\\uB370\\uBAA8) \\uAD6C\\uD615 A\\uC548 \\uB300\\uBCF8"}],caption:"(\\uB370\\uBAA8) A\\uC548 \\uCEA1\\uC158",slides:[]},{version:"V1-B",sourceApproved:!0,sections:[{heading:"\\uBCF8\\uBB38",text:"(\\uB370\\uBAA8) \\uAD6C\\uD615 B\\uC548 \\uB300\\uBCF8 \\u2014 \\uC6D0\\uBCF8 \\uC2B9\\uC778 \\uBC84\\uC804"}],caption:"(\\uB370\\uBAA8) B\\uC548 \\uCEA1\\uC158",slides:[]}],images:[1,2,3].map(e=>({name:"DEMO-R00_B_0"+e+".png",id:"DEMOLEG"+e,url:"https://drive.google.com/file/d/DEMOLEG"+e+"/view",src:"/media/demo"+e+".jpg",version:"V1-B"})),scenes:[1,2,3].map(e=>({number:e,timing:(e-1)*3+"\\u2013"+e*3+"\\uCD08",subtitle:"",visual:"(\\uB370\\uBAA8) \\uAD6C\\uD615 \\uC7A5\\uBA74 "+e,prompt:"(\\uB370\\uBAA8) \\uAD6C\\uD615 \\uC774\\uBBF8\\uC9C0 \\uD504\\uB86C\\uD504\\uD2B8 "+e,reference:""}))}),et=()=>Ke([we("ISHARD-DEMO-20261104-R01",{topic:"\\uC0C8 \\uC81C\\uD488 \\uC120\\uD0DD \\uAE30\\uC900"}),we("ISHARD-DEMO-20261106-C01",{date:"2026-11-06",format:"Carousel",topic:"(\\uB370\\uBAA8) \\uCE90\\uB7EC\\uC140 \\u2014 \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC \\uC5C6\\uC774 \\uC7A5\\uBCC4 \\uC774\\uBBF8\\uC9C0"}),Kr(),we("ISHARD-LEGACY-DEMO-02",{topic:"\\uAD6C\\uD615 \\uAE30\\uD68D(strategyV2 \\uC5C6\\uC74C)",format:"Carousel",plan:{persona:"\\uAD6C\\uD615"}})]),C=!0,v=Ke([]);if(!C)try{v=JSON.parse(localStorage.getItem(Wt))||et()}catch{v=et()}var Ie=0,Q=null,Ee=!1,zt=!C,_="",V="",$e="",w=null,Re=null,ue="today",_e="all",Ae="list",se=!1,k=null,ie=(()=>{let e=new Date;return e.getFullYear()*12+e.getMonth()})(),U=new Set,J=new Set,Yr="https://drive.google.com/drive/folders/DEMOFOLDER",Qt=()=>{if(!C)try{localStorage.setItem(Wt,JSON.stringify(v))}catch{}},oe=()=>v.contents.find(e=>e.id===w),ne=e=>document.getElementById(e),x=e=>(ne(e)?.value||"").trim();async function Ht(e){let t=await fetch(e,{headers:{Accept:"application/json"}}),r=await t.json().catch(()=>({}));if(!t.ok)throw Error(r.error||"\\uC11C\\uBC84 \\uC624\\uB958 "+t.status);return r}async function Wr(){if(C){try{let[e,t]=await Promise.all([Ht("/api/me"),Ht("/api/workspace")]);Q=e,v=t.workspace,Ie=t.revision}catch(e){_="\\u26A0 "+e.message}zt=!0}A()}function b(e,t,r,s){if(!C){try{let n=(Mt[e]||Lt[e])(v,t);v=n.w,Qt(),_="",V=r||"",s?.(n.result)}catch(o){_="\\u26A0 "+o.message,V=""}return A()}Ee||(Ee=!0,A(),fetch("/api/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:e,args:t,revision:Ie})}).then(async o=>{let n=await o.json().catch(()=>({error:"\\uC11C\\uBC84 \\uC751\\uB2F5\\uC744 \\uC77D\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4."}));o.ok?(v=n.workspace,Ie=n.revision,_="",V=r||"",s?.(n.result)):(n.conflict&&n.workspace&&(v=n.workspace,Ie=n.revision),_="\\u26A0 "+(n.error||"\\uC800\\uC7A5\\uD558\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4."),V="")}).catch(()=>{_="\\u26A0 \\uC11C\\uBC84\\uC5D0 \\uC5F0\\uACB0\\uD558\\uC9C0 \\uBABB\\uD588\\uC2B5\\uB2C8\\uB2E4. \\uC800\\uC7A5\\uB418\\uC9C0 \\uC54A\\uC558\\uC2B5\\uB2C8\\uB2E4.",V=""}).finally(()=>{Ee=!1,A()}))}var O=e=>Vt(v,e),M=e=>e.k==="done"?"publish":e.k,Qe=(e,t)=>{let r=e.files[0];r&&r.text().then(s=>t(s,r.name));try{e.value=""}catch{}},tt=null;try{window.claude?.use&&window.claude.use("downloads").then(e=>{tt=e}).catch(()=>{})}catch{}async function zr(e,t){let r=JSON.stringify(t,null,2);if(tt){try{await tt.save({filename:e,data:r}),V=e+" \\uC800\\uC7A5",_=""}catch(s){s?.code!=="declined"&&(_="\\u26A0 \\uC774 \\uD654\\uBA74\\uC5D0\\uC11C\\uB294 \\uD30C\\uC77C \\uC800\\uC7A5\\uC744 \\uC4F8 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4. JSON \\uBCF5\\uC0AC\\uB97C \\uC0AC\\uC6A9\\uD574\\uC8FC\\uC138\\uC694.")}return A()}if(window.claude?.use)return _="\\u26A0 \\uC774 \\uD654\\uBA74\\uC5D0\\uC11C\\uB294 \\uD30C\\uC77C \\uC800\\uC7A5\\uC744 \\uC4F8 \\uC218 \\uC5C6\\uC2B5\\uB2C8\\uB2E4. JSON \\uBCF5\\uC0AC\\uB97C \\uC0AC\\uC6A9\\uD574\\uC8FC\\uC138\\uC694.",A();try{let s=document.createElement("a");s.href=URL.createObjectURL(new Blob([r],{type:"application/json"})),s.download=e,document.body.appendChild(s),s.click(),s.remove(),V=e+" \\uB2E4\\uC6B4\\uB85C\\uB4DC"}catch{_="\\u26A0 \\uB2E4\\uC6B4\\uB85C\\uB4DC\\uAC00 \\uB9C9\\uD78C \\uD658\\uACBD\\uC785\\uB2C8\\uB2E4. JSON \\uBCF5\\uC0AC\\uB97C \\uC0AC\\uC6A9\\uD574\\uC8FC\\uC138\\uC694."}A()}async function Xe(e,t){try{await navigator.clipboard.writeText(e),V=t+" \\uBCF5\\uC0AC\\uB428"}catch{_="\\u26A0 \\uBCF5\\uC0AC \\uAD8C\\uD55C\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4. \\uD3BC\\uCCD0\\uC9C4 \\uB0B4\\uC6A9\\uC744 \\uC9C1\\uC811 \\uC120\\uD0DD\\uD574 \\uBCF5\\uC0AC\\uD574\\uC8FC\\uC138\\uC694."}A()}var Xt=[["psychology","\\uAD6C\\uB9E4\\uC2EC\\uB9AC"],["fit","\\uC81C\\uD488 \\uC801\\uD569"],["evidence","\\uADFC\\uAC70"],["flow","\\uC124\\uB4DD \\uD750\\uB984"],["novelty","\\uC0C8\\uB85C\\uC6C0"]];Object.assign(window,{view(e){ue=e,w=null,se=!1,A()},more(){se=!se,A()},month(e){ie+=e,A()},thisMonth(){let e=new Date;ie=e.getFullYear()*12+e.getMonth(),A()},filt(e){_e=e,A()},logq(e){$e=e,A();let t=ne("lq");t&&(t.focus(),t.setSelectionRange(e.length,e.length))},go(e,t){w=e;let r=e&&v.contents.find(s=>s.id===e);Re=t||(r?M(O(r)):null),se=!1,_="",V="",A();try{window.scrollTo(0,0)}catch{}},tab(e){Re=e,A()},mode(e){Ae=e,A()},reset(){C||confirm("\\uB370\\uBAA8 \\uB370\\uC774\\uD130\\uB97C \\uCD08\\uAE30\\uD654\\uD560\\uAE4C\\uC694?")&&(v=et(),Qt(),w=null,_=V="",U.clear(),J.clear(),k=null,A())},newContent(){b("createContent",{id:x("nc-id"),date:x("nc-date"),format:x("nc-format"),product:x("nc-product"),topic:x("nc-topic"),drive:x("nc-drive")},"\\uC0C8 \\uCF58\\uD150\\uCE20\\uB97C \\uB9CC\\uB4E4\\uC5C8\\uC2B5\\uB2C8\\uB2E4.",e=>go(e,"plan"))},archive(){confirm("\\uC774 \\uCF58\\uD150\\uCE20\\uB97C \\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uBCF4\\uAD00\\uD560\\uAE4C\\uC694? \\uC6D0\\uACE0\\xB7\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\xB7\\uC774\\uBBF8\\uC9C0\\xB7\\uB9C1\\uD06C \\uAE30\\uB85D\\uC774 \\uD568\\uAED8 \\uBCF4\\uAD00\\uB418\\uBA70 \\uBCF5\\uC6D0\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.")&&b("archive",{id:w},"\\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uBCF4\\uAD00\\uD588\\uC2B5\\uB2C8\\uB2E4.")},restoreT(e){b("restore",{key:e},"\\uBCF5\\uC6D0\\uD588\\uC2B5\\uB2C8\\uB2E4.",()=>J.delete(e))},impStrategy(e){Qe(e,t=>b("importStrategy",{id:w,text:t},"\\uAE30\\uD68D\\uC744 \\uAC00\\uC838\\uC654\\uC2B5\\uB2C8\\uB2E4. \\uC0AC\\uB78C \\uAC80\\uC218\\uAC00 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4."))},addFact(){b("addFact",{id:w,fact:{id:x("fi"),fact:x("ff"),source:x("fs")}},"\\uACF5\\uC2DD \\uADFC\\uAC70\\uB97C \\uB4F1\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.")},review(e){let t=e==="score"?Object.fromEntries(Xt.map(([r])=>[r,Number(x("sc-"+r))])):void 0;b("reviewStrategy",{id:w,kind:e,scores:t},{fit:"\\uADFC\\uAC70 \\uAC80\\uC99D\\uC744 \\uAE30\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.",text:"\\uD45C\\uD604\\xB7\\uC911\\uBCF5 \\uAC80\\uC218 \\uD1B5\\uACFC\\uB97C \\uAE30\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.",human:"\\uC0AC\\uB78C \\uD655\\uC778\\uC744 \\uAE30\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.",score:"\\uD488\\uC9C8 \\uC810\\uC218\\uB97C \\uC800\\uC7A5\\uD588\\uC2B5\\uB2C8\\uB2E4."}[e])},impScript(e){Qe(e,(t,r)=>b("importScript",{id:w,text:t,fileName:r},"\\uC6D0\\uACE0\\uB97C \\uAC00\\uC838\\uC654\\uC2B5\\uB2C8\\uB2E4."))},approve(e){b("approve",{id:w,version:e},z(oe(),e)+" \\uD655\\uC815")},release(e){b("release",{id:w,version:e},"\\uD655\\uC815\\uC744 \\uD574\\uC81C\\uD588\\uC2B5\\uB2C8\\uB2E4. \\uC6D0\\uACE0\\xB7\\uC81C\\uC791\\uBB3C\\uC740 \\uADF8\\uB300\\uB85C \\uC788\\uC2B5\\uB2C8\\uB2E4.")},dl(e){let t=oe(),r=t.reviews.find(s=>s.version===e);zr(t.id+"_"+(r.label||e).replace(/[^\\w\uAC00-\uD7A3()-]+/g,"_")+".json",Ye(t,e))},cp(e){let t=oe();Xe(JSON.stringify(Ye(t,e),null,2),z(t,e)+" JSON")},cpc(e){let t=oe().reviews.find(r=>r.version===e);Xe(t.expectedComments.join(`\n`),"\\uC608\\uC0C1 \\uB313\\uAE00")},askRev(e){b("requestScriptRevision",{id:w,version:e,text:x("rq-"+e)},"\\uC218\\uC815 \\uC694\\uCCAD\\uC744 \\uB4F1\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4. \\uC791\\uAC00\\uC6A9 \\uC694\\uCCAD\\uBB38\\uC744 \\uBCF5\\uC0AC\\uD574 \\uC804\\uB2EC\\uD558\\uC138\\uC694.")},brief(e){Xe(ze(v,e),"\\uC791\\uAC00\\uC6A9 \\uC694\\uCCAD\\uBB38")},answer(e){let t=ne("ra-"+e)?.files[0],r=x("rs-"+e);if(!t){_="\\u26A0 \\uC218\\uC815\\uBCF8 JSON \\uD30C\\uC77C\\uC744 \\uC120\\uD0DD\\uD574\\uC8FC\\uC138\\uC694.",A();return}t.text().then(s=>b("answerRevision",{requestId:e,text:s,summary:r},"\\uC218\\uC815\\uBCF8\\uC744 \\uC5F0\\uACB0\\uD588\\uC2B5\\uB2C8\\uB2E4. \\uBE44\\uAD50 \\uD6C4 \\uD655\\uC815\\uD558\\uC138\\uC694."))},withdraw(e){confirm("\\uC774 \\uC218\\uC815 \\uC694\\uCCAD\\uC744 \\uCCA0\\uD68C\\uD560\\uAE4C\\uC694? \\uC6D0\\uACE0\\uB294 \\uADF8\\uB300\\uB85C \\uB0A8\\uC2B5\\uB2C8\\uB2E4.")&&b("withdrawScriptRevision",{requestId:e},"\\uC694\\uCCAD\\uC744 \\uCCA0\\uD68C\\uD588\\uC2B5\\uB2C8\\uB2E4.")},impBoard(e){Qe(e,t=>b("saveStoryboard",{id:w,text:t},"\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uB97C \\uC800\\uC7A5\\uD588\\uC2B5\\uB2C8\\uB2E4."))},reqImages(){b("requestImages",{id:w,folder:x("df")},"\\uC774\\uBBF8\\uC9C0 \\uC81C\\uC791 \\uC694\\uCCAD\\uC744 \\uB9CC\\uB4E4\\uC5C8\\uC2B5\\uB2C8\\uB2E4.")},regImg(e,t){b("registerImage",{requestId:e,slotId:t,url:x("iu-"+t)},t+" \\uC774\\uBBF8\\uC9C0\\uB97C \\uB4F1\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.")},demoImg(e,t){if(C)return;let r=Date.now().toString(36)+Math.random().toString(36).slice(2,8);b("addImage",{requestId:e,slotId:t,asset:{fileName:t+".png",driveUrl:"https://drive.google.com/file/d/DEMO"+r+"/view",previewKey:"production/"+e+"/"+t+"-"+r}})},choose(e,t,r,s){b("pick",{rootId:e,slotId:t,candidateId:r,previewKey:s})},confirmImg(e){b("confirmImages",{rootId:e},"\\uC774\\uBBF8\\uC9C0 \\uC804\\uCCB4\\uB97C \\uD655\\uC815\\uD588\\uC2B5\\uB2C8\\uB2E4.")},unconfirmImg(e){confirm(`\\uC774\\uBBF8\\uC9C0 \\uC804\\uCCB4 \\uD655\\uC815\\uC744 \\uD574\\uC81C\\uD560\\uAE4C\\uC694?\n\\uC120\\uD0DD\\uD55C \\uC774\\uBBF8\\uC9C0\\uC640 \\uC6D0\\uBCF8\\xB7\\uC218\\uC815\\uBCF8, \\uC800\\uC7A5\\uB41C \\uD504\\uB86C\\uD504\\uD2B8 \\uAE30\\uB85D\\uC740 \\uADF8\\uB300\\uB85C \\uB0A8\\uC2B5\\uB2C8\\uB2E4. \\uB2E4\\uC2DC \\uACE0\\uB978 \\uB4A4 \\uC804\\uCCB4 \\uD655\\uC815\\uC744 \\uB20C\\uB7EC\\uC57C \\uC601\\uC0C1 \\uB2E8\\uACC4\\uB85C \\uB118\\uC5B4\\uAC11\\uB2C8\\uB2E4. \\uC601\\uC0C1 \\uB9C1\\uD06C\\uB97C \\uAE30\\uB85D\\uD588\\uB2E4\\uBA74 \\uB2E4\\uC2DC \\uD655\\uC815\\uD55C \\uB4A4 \\uB2E4\\uC2DC \\uAE30\\uB85D\\uD574\\uC57C \\uD569\\uB2C8\\uB2E4.`)&&b("unconfirmImages",{rootId:e},"\\uC774\\uBBF8\\uC9C0 \\uD655\\uC815\\uC744 \\uD574\\uC81C\\uD588\\uC2B5\\uB2C8\\uB2E4.")},revise(e,t){b("requestRevision",{id:w,rootId:e,slotId:t,note:x("rv-"+t)},"\\uC774\\uBBF8\\uC9C0 \\uC218\\uC815 \\uC694\\uCCAD\\uC744 \\uB4F1\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.")},legacyUndo(){confirm("\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C \\uD655\\uC778\\uC744 \\uD574\\uC81C\\uD560\\uAE4C\\uC694? \\uC774\\uBBF8\\uC9C0\\uC640 \\uB9C1\\uD06C\\uB294 \\uADF8\\uB300\\uB85C \\uB0A8\\uC2B5\\uB2C8\\uB2E4.")&&b("unconfirmLegacyImages",{id:w},"\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC778\\uC744 \\uD574\\uC81C\\uD588\\uC2B5\\uB2C8\\uB2E4.")},legacyOk(){confirm("\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C\\uC744 \\uC774 \\uC6D0\\uACE0\\uC758 \\uCD5C\\uC885 \\uC774\\uBBF8\\uC9C0\\uB85C \\uD655\\uC778\\uD560\\uAE4C\\uC694? \\uAC8C\\uC2DC\\uD558\\uC9C0\\uB294 \\uC54A\\uC2B5\\uB2C8\\uB2E4.")&&b("confirmLegacyImages",{id:w},"\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uD655\\uC778 \\uAE30\\uB85D\\uC744 \\uB0A8\\uACBC\\uC2B5\\uB2C8\\uB2E4.")},saveH(e){b("saveHiggsScene",{id:w,sceneId:e,prompt:ne("h-"+e).value},e+" \\uD504\\uB86C\\uD504\\uD2B8 \\uC800\\uC7A5")},video(e){let t=x("vu");e?b("finalVideo",{rootId:e,url:t},"\\uC601\\uC0C1 \\uB9C1\\uD06C\\uB97C \\uAE30\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4."):b("legacyVideo",{id:w,url:t},"\\uC601\\uC0C1 \\uB9C1\\uD06C\\uB97C \\uAE30\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.")},pub(){b("publish",{id:w,url:x("pu")},"\\uAC8C\\uC2DC \\uB9C1\\uD06C\\uB97C \\uAE30\\uB85D\\uD588\\uC2B5\\uB2C8\\uB2E4.")},tick(e,t){t?U.add(e):U.delete(e),k=null,A()},tickAll(e){er().forEach(({c:t})=>e?U.add(t.id):U.delete(t.id)),k=null,A()},bulkCheck(){try{k=Jt(v,{ids:[...U]}),_=""}catch(e){_="\\u26A0 "+e.message}A()},bulkGo(){let e=k.eligible.map(t=>t.id);confirm(`\\uBBF8\\uC2B9\\uC778 \\uAE30\\uD68D ${e.length}\\uAC74\\uC744 \\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uC774\\uB3D9\\uD560\\uAE4C\\uC694? \\uBCF5\\uC6D0\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.`)&&b("bulkArchive",{ids:e},`${e.length}\\uAC74\\uC744 \\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uC774\\uB3D9\\uD588\\uC2B5\\uB2C8\\uB2E4.`,()=>{U.clear(),k=null})},ttick(e,t){t?J.add(e):J.delete(e),A()},bulkRestore(){let e=J.size;b("bulkRestore",{keys:[...J]},`${e}\\uAC74\\uC744 \\uBCF5\\uC6D0\\uD588\\uC2B5\\uB2C8\\uB2E4.`,()=>J.clear())}});var rt=[["today","\\uC624\\uB298"],["inbox","\\uAC80\\uD1A0\\uD568"],["table","\\uC791\\uC5C5\\uD45C"],["cal","\\uCE98\\uB9B0\\uB354"],["feed","\\uD53C\\uB4DC"],["log","\\uAE30\\uB85D"],["trash","\\uD734\\uC9C0\\uD1B5"]],Gt=e=>e==="inbox"?v.contents.filter(t=>O(t).lane==="action").length:e==="trash"?(v.trash||[]).length:0,st=(e,t)=>t+(Gt(e)?` <span class="n">${Gt(e)}</span>`:""),Qr=()=>`<nav class="tabs top">${rt.map(([e,t])=>`<button class="${e===ue&&!w?"on":""}" onclick="view(\'${e}\')">${st(e,t)}</button>`).join("")}</nav>`,Ze=["today","inbox","cal"],Xr=()=>`<nav class="bnav">${Ze.map(e=>{let t=rt.find(r=>r[0]===e)[1];return`<button class="${e===ue&&!w?"on":""}" onclick="view(\'${e}\')">${st(e,t)}</button>`}).join("")}<button class="${se||!Ze.includes(ue)&&!w?"on":""}" onclick="more()">\\uB354\\uBCF4\\uAE30</button></nav>`+(se?`<div class="sheet">${rt.filter(e=>!Ze.includes(e[0])).map(([e,t])=>`<button onclick="view(\'${e}\')">${st(e,t)}</button>`).join("")}</div>`:"");function A(){w&&!oe()&&(w=null);let e=(_?`<div class="card bad" id="msg" role="alert">${u(_)}</div>`:"")+(V?`<div class="card okm" id="note" role="status">${u(V)}</div>`:"");if(!zt){ne("app").innerHTML=\'<p class="mut">\\uBD88\\uB7EC\\uC624\\uB294 \\uC911\\u2026</p>\';return}let t=C&&Q?`<div class="who mut">${u(Q.email)} \\xB7 ${{owner:"\\uC18C\\uC720\\uC790",editor:"\\uD3B8\\uC9D1\\uC790",viewer:"\\uBCF4\\uAE30 \\uC804\\uC6A9"}[Q.role]||Q.role}${Ee?" \\xB7 \\uC800\\uC7A5 \\uC911\\u2026":""}</div>`:"",r=C&&Q?.role==="viewer"?\'<div class="card lock">\\uBCF4\\uAE30 \\uC804\\uC6A9 \\uACC4\\uC815\\uC785\\uB2C8\\uB2E4. \\uB0B4\\uC6A9 \\uD655\\uC778\\xB7\\uBCF5\\uC0AC\\xB7\\uB2E4\\uC6B4\\uB85C\\uB4DC\\uB9CC \\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.</div>\':"";ne("app").innerHTML=Qr()+t+r+e+(w?ms():{today:ts,inbox:rs,table:os,cal:as,feed:ls,log:us,trash:ps}[ue]())+Xr(),C&&Q?.role==="viewer"&&es()}var Zr=/\\b(newContent|archive|restoreT|addFact|review|approve|release|askRev|answer|withdraw|reqImages|regImg|choose|confirmImg|revise|legacyOk|saveH|video|pub|bulkGo|bulkRestore|bulkCheck|impStrategy|impScript|impBoard)\\(/;function es(){document.querySelectorAll("#app [onclick], #app [onchange]").forEach(e=>{Zr.test(e.getAttribute("onclick")||e.getAttribute("onchange")||"")&&(e.disabled=!0,e.title="\\uBCF4\\uAE30 \\uC804\\uC6A9")}),document.querySelectorAll("#app textarea, #app input:not(#lq), #app details.nc, #app details.rv").forEach(e=>{e.tagName==="DETAILS"?e.style.display="none":e.disabled=!0})}var Zt=(e,t,r)=>`<button class="p" onclick="go(\'${u(e.id)}\',\'${M(t)}\')">${u(r||t.l+" \\uC5F4\\uAE30")}</button>`,X=e=>`<div class="card lock">${e}</div>`,$=(e,t="")=>`<span class="tag ${t}">${u(e)}</span>`;function ts(){let e=r=>v.contents.filter(s=>O(s).lane===r).length,t={action:0,waiting:1,done:2};return`<h1>\\uC624\\uB298 \\uD560 \\uC77C</h1><div class="stats"><button onclick="view(\'inbox\')"><b>${e("action")}</b><span>\\uACB0\\uC815 \\uD544\\uC694</span></button><button onclick="view(\'inbox\')"><b>${e("waiting")}</b><span>\\uC81C\\uC791 \\uB300\\uAE30</span></button><button onclick="view(\'table\')"><b>${e("done")}</b><span>\\uC644\\uB8CC</span></button></div>${C?"":\'<p class="mut">\\uBBF8\\uB9AC\\uBCF4\\uAE30 \\xB7 \\uB370\\uC774\\uD130\\uB294 \\uC774 \\uBE0C\\uB77C\\uC6B0\\uC800\\uC5D0\\uB9CC \\uC800\\uC7A5 \\xB7 \\uC2E4\\uC81C AI\\xB7\\uC774\\uBBF8\\uC9C0\\xB7\\uC601\\uC0C1 \\uD638\\uCD9C \\uC5C6\\uC74C \\xB7 \\uAE30\\uC874 \\uC5D4\\uC9C4 \\uADDC\\uCE59 \\uC0AC\\uC6A9</p>\'}`+[...v.contents].sort((r,s)=>t[O(r).lane]-t[O(s).lane]||r.date.localeCompare(s.date)).map(r=>{let s=O(r);return`<div class="card"><div class="row"><b class="cid">${u(r.id)}</b>${$(r.format)}</div><div>${u(r.topic)}</div><div class="mut">${u(r.date)} \\xB7 ${$(s.l,s.lane==="waiting"?"wait":s.lane==="done"?"done":"")}</div>${s.why?`<div class="${s.lane==="action"?"warn":"mut"}">${u(s.why)}</div>`:""}<div class="row" style="margin-top:8px">${s.lane==="action"?Zt(r,s):`<button onclick="go(\'${u(r.id)}\',\'${M(s)}\')">\\uC5F4\\uAE30</button>`}</div></div>`}).join("")+(C?"":\'<button onclick="reset()">\\uB370\\uBAA8 \\uCD08\\uAE30\\uD654</button>\')}function rs(){let e=v.contents.filter(r=>O(r).lane==="action").sort((r,s)=>r.date.localeCompare(s.date)),t=v.contents.filter(r=>O(r).lane==="waiting");return\'<h1>\\uAC80\\uD1A0\\uD568</h1><p class="mut">\\uB0B4\\uAC00 \\uACB0\\uC815\\uD574\\uC57C \\uD558\\uB294 \\uC77C\\uB9CC \\uBAA8\\uC558\\uC2B5\\uB2C8\\uB2E4. \\uAC8C\\uC2DC\\uC77C\\uC774 \\uAC00\\uAE4C\\uC6B4 \\uC21C\\uC11C\\uC785\\uB2C8\\uB2E4.</p>\'+(e.map(r=>{let s=O(r);return`<div class="card"><div class="row"><b>${u(s.l)}</b>${$(r.format)}<span class="mut">${u(r.date)}</span></div><div>${u(r.topic)}</div><div class="mut">${u(r.id)}${s.why?" \\xB7 "+u(s.why):""}</div><div class="row" style="margin-top:6px">${Zt(r,s,"\\uAC80\\uD1A0\\uD558\\uAE30")}</div></div>`}).join("")||\'<p class="mut">\\uC9C0\\uAE08 \\uACB0\\uC815\\uD560 \\uC77C\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\')+(t.length?`<h2>\\uC81C\\uC791 \\uB300\\uAE30 (${t.length})</h2>`+t.map(r=>{let s=O(r);return`<div class="card mut"><div class="row"><span>${u(s.l)}</span>${$(r.format)}<span>${u(r.date)}</span></div><div>${u(r.topic)}</div>${s.why?`<div>${u(s.why)}</div>`:""}<button onclick="go(\'${u(r.id)}\',\'${M(s)}\')">\\uC5F4\\uAE30</button></div>`}).join(""):"")}var ss=[["plan","\\uAE30\\uD68D"],["script","\\uC6D0\\uACE0"],["storyboard","\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC"],["images","\\uC774\\uBBF8\\uC9C0"],["video","\\uC601\\uC0C1"],["publish","\\uAC8C\\uC2DC"],["done","\\uC644\\uB8CC"]],er=()=>[...v.contents].sort((e,t)=>e.date.localeCompare(t.date)).map(e=>({c:e,s:O(e)})).filter(e=>_e==="all"||e.s.k===_e);function os(){let e=er(),t=e.length&&e.every(({c:s})=>U.has(s.id)),r=U.size?`<div class="card sel"><div class="row"><b>${U.size}\\uAC74 \\uC120\\uD0DD</b><button onclick="bulkCheck()">\\uBCF4\\uAD00 \\uBBF8\\uB9AC\\uBCF4\\uAE30</button><button onclick="tickAll(false)">\\uC120\\uD0DD \\uD574\\uC81C</button></div>${k?is():\'<p class="mut">\\uBCF4\\uAD00 \\uC804\\uC5D0 \\uBBF8\\uB9AC\\uBCF4\\uAE30\\uB85C \\uBCF4\\uD638 \\uB300\\uC0C1(\\uC2B9\\uC778\\xB7\\uC81C\\uC791\\xB7\\uAC8C\\uC2DC \\uAE30\\uB85D)\\uC744 \\uBA3C\\uC800 \\uD655\\uC778\\uD569\\uB2C8\\uB2E4.</p>\'}</div>`:"";return ns()+`<div class="row" style="margin-bottom:8px"><label class="mut" for="fs-st">\\uB2E8\\uACC4</label><select id="fs-st" onchange="filt(this.value)"><option value="all">\\uC804\\uCCB4</option>${ss.map(([s,o])=>`<option value="${s}" ${_e===s?"selected":""}>${o}</option>`).join("")}</select><span class="mut">${e.length}\\uAC74</span></div>${r}\n  <div class="tablewrap"><table><thead><tr><th><input type="checkbox" aria-label="\\uBCF4\\uC774\\uB294 \\uD56D\\uBAA9 \\uC804\\uCCB4 \\uC120\\uD0DD" ${t?"checked":""} onchange="tickAll(this.checked)"></th><th>\\uAC8C\\uC2DC\\uC77C</th><th>\\uCF58\\uD150\\uCE20</th><th>\\uB2E8\\uACC4</th><th></th></tr></thead><tbody>${e.map(({c:s,s:o})=>`<tr><td><input type="checkbox" aria-label="${u(s.id)} \\uC120\\uD0DD" ${U.has(s.id)?"checked":""} onchange="tick(\'${u(s.id)}\',this.checked)"></td><td>${u(s.date.slice(5))}<div class="mut">${u(s.format)}</div></td><td>${u(s.topic)}<div class="mut">${u(s.id)}</div></td><td>${u(o.l)}${o.why?`<div class="mut" style="font-size:12px">${u(o.why)}</div>`:""}</td><td><button onclick="go(\'${u(s.id)}\',\'${M(o)}\')">\\uC5F4\\uAE30</button></td></tr>`).join("")||\'<tr><td colspan="5" class="mut">\\uD574\\uB2F9 \\uB2E8\\uACC4\\uC758 \\uCF58\\uD150\\uCE20\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</td></tr>\'}</tbody></table></div>`}function ns(){let e=new Date(Date.now()+324e5).toISOString().slice(0,10);return`<details class="card nc"><summary><b>+ \\uC0C8 \\uCF58\\uD150\\uCE20</b></summary><div class="ncg"><label>\\uCF58\\uD150\\uCE20 ID<input type="text" id="nc-id" placeholder="ISHARD-30-${e.replaceAll("-","")}-R01"></label><label>\\uAC8C\\uC2DC\\uC77C<input type="text" id="nc-date" value="${e}" inputmode="numeric"></label><label>\\uD615\\uC2DD<select id="nc-format"><option value="Reel">\\uB9B4\\uC2A4</option><option value="Carousel">\\uCE90\\uB7EC\\uC140</option><option value="Image">\\uC774\\uBBF8\\uC9C0</option></select></label><label>\\uC81C\\uD488<input type="text" id="nc-product" placeholder="\\uC81C\\uD488\\uBA85"></label><label class="w">\\uC8FC\\uC81C<input type="text" id="nc-topic" placeholder="\\uC774\\uBC88 \\uCF58\\uD150\\uCE20\\uC758 \\uD575\\uC2EC"></label><label class="w">Drive \\uD3F4\\uB354(\\uC120\\uD0DD)<input type="text" id="nc-drive" placeholder="https://drive.google.com/drive/folders/\\u2026"></label></div><button class="p" onclick="newContent()">\\uB9CC\\uB4E4\\uAE30</button></details>`}function is(){return`<div class="bp"><div><b>\\uC774\\uB3D9 \\uAC00\\uB2A5 ${k.eligible_count}\\uAC74</b> <span class="mut">(\\uBBF8\\uC2B9\\uC778 \\uAE30\\uD68D)</span>${k.eligible.map(e=>`<div class="mut">\\xB7 ${u(e.id)} ${u(e.topic||"")}</div>`).join("")}</div>`+(k.protected_count?`<div><b>\\uBCF4\\uD638 ${k.protected_count}\\uAC74</b> <span class="mut">(\\uC774\\uB3D9\\uD558\\uC9C0 \\uC54A\\uC74C)</span>${k.protected.map(e=>`<div class="mut">\\xB7 ${u(e.id)} \\u2014 ${u(e.reasons.join(", "))}</div>`).join("")}</div>`:"")+`<p class="mut">${u(k.preserved)}</p>${k.eligible_count?`<button class="p" onclick="bulkGo()">\\uBBF8\\uC2B9\\uC778 ${k.eligible_count}\\uAC74 \\uD734\\uC9C0\\uD1B5\\uC73C\\uB85C \\uC774\\uB3D9</button>`:\'<p class="mut">\\uC774\\uB3D9\\uD560 \\uC218 \\uC788\\uB294 \\uD56D\\uBAA9\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\'}</div>`}function as(){let e=Math.floor(ie/12),t=ie%12,r=new Date(e,t,1).getDay(),s=new Date(e,t+1,0).getDate(),o=i=>String(i).padStart(2,"0"),n=["\\uC77C","\\uC6D4","\\uD654","\\uC218","\\uBAA9","\\uAE08","\\uD1A0"].map(i=>`<div class="h">${i}</div>`);for(let i=0;i<r;i++)n.push(\'<div style="border:0"></div>\');for(let i=1;i<=s;i++){let a=e+"-"+o(t+1)+"-"+o(i),c=v.contents.filter(d=>d.date.slice(0,10)===a);n.push(`<div><b>${i}</b>${c.map(d=>{let l=O(d);return`<button class="chip ${l.lane}" onclick="go(\'${u(d.id)}\',\'${M(l)}\')">${u(d.format[0])} ${u(l.l)}</button>`}).join("")}</div>`)}return`<div class="row" style="margin-bottom:8px"><button onclick="month(-1)" aria-label="\\uC774\\uC804 \\uB2EC">\\u2039</button><b>${e}\\uB144 ${t+1}\\uC6D4</b><button onclick="month(1)" aria-label="\\uB2E4\\uC74C \\uB2EC">\\u203A</button><button onclick="thisMonth()">\\uC774\\uBC88 \\uB2EC</button></div><div class="cal">${n.join("")}</div><p class="mut">R=\\uB9B4\\uC2A4 \\xB7 C=\\uCE90\\uB7EC\\uC140 \\xB7 I=\\uC774\\uBBF8\\uC9C0. \\uAC8C\\uC2DC\\uC77C \\uAE30\\uC900\\uC774\\uBA70 \\uC2E4\\uC81C SNS \\uAC8C\\uC2DC \\uD604\\uD669\\uC774 \\uC544\\uB2D9\\uB2C8\\uB2E4.</p>`+cs(e+"-"+o(t+1))}function cs(e){let t=v.contents.filter(r=>r.date.startsWith(e)).sort((r,s)=>r.date.localeCompare(s.date));return`<h2>\\uC774 \\uB2EC \\uC77C\\uC815 (${t.length})</h2>`+(t.map(r=>{let s=O(r),o=new Date(r.date+"T00:00:00");return`<button class="agenda" onclick="go(\'${u(r.id)}\',\'${M(s)}\')"><span class="ad">${o.getMonth()+1}/${o.getDate()} ${"\\uC77C\\uC6D4\\uD654\\uC218\\uBAA9\\uAE08\\uD1A0"[o.getDay()]}</span><span class="at">${u(r.topic)}<small>${u(r.format)} \\xB7 ${u(r.id)}</small></span>${$(s.l,s.lane==="waiting"?"wait":"")}</button>`}).join("")||\'<p class="mut">\\uC774 \\uB2EC\\uC5D0 \\uC608\\uC815\\uB41C \\uCF58\\uD150\\uCE20\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\')}var Bt=["#d9cfb8","#c4c9a8","#cfc2b0","#b9bfa1","#e0d6c4","#cbc4b3"],ds=e=>{let t=0;for(let r of e)t=t*31+r.charCodeAt(0)>>>0;return Bt[t%Bt.length]};function ls(){let e=Math.floor(ie/12),t=ie%12,r=e+"-"+String(t+1).padStart(2,"0"),s=Pt(v,r).contents.sort((n,i)=>i.date.localeCompare(n.date)),o=s.filter(n=>n.feedPreview).length;return`<div class="row" style="margin-bottom:6px"><button onclick="month(-1)" aria-label="\\uC774\\uC804 \\uB2EC">\\u2039</button><b>${e}\\uB144 ${t+1}\\uC6D4 \\uD53C\\uB4DC</b><button onclick="month(1)" aria-label="\\uB2E4\\uC74C \\uB2EC">\\u203A</button><button onclick="thisMonth()">\\uC774\\uBC88 \\uB2EC</button></div><p class="mut">${s.length}\\uAC1C \\uC911 ${o}\\uAC1C \\uC774\\uBBF8\\uC9C0 \\uD655\\uC815 \\xB7 \\uAC8C\\uC2DC\\uC77C \\uAE30\\uC900 \\uBC30\\uCE58 \\uC2DC\\uBBAC\\uB808\\uC774\\uC158\\uC774\\uBA70 \\uC2E4\\uC81C \\uC778\\uC2A4\\uD0C0\\uADF8\\uB7A8 \\uD604\\uD669\\uC774 \\uC544\\uB2D9\\uB2C8\\uB2E4. \\uD655\\uC815\\uB418\\uC9C0 \\uC54A\\uC740 \\uC774\\uBBF8\\uC9C0\\uB294 \\uD45C\\uC2DC\\uD558\\uC9C0 \\uC54A\\uC2B5\\uB2C8\\uB2E4.</p>`+(s.length?`<div class="feed">${s.map(n=>{let i=v.contents.find(d=>d.id===n.id),a=O(i),c=a.k==="done";return`<button class="tile" onclick="go(\'${u(n.id)}\',\'${M(a)}\')" style="${n.feedPreview?"background:"+ds(n.feedPreview.src):""}">${n.feedPreview?"":"<span>\\uC774\\uBBF8\\uC9C0 \\uBBF8\\uD655\\uC815</span>"}<small>${u(n.date.slice(5))} ${u(n.format[0])}${c?" \\xB7 \\uAC8C\\uC2DC\\uB428":""}</small></button>`}).join("")}</div><p class="mut">\\uB370\\uBAA8\\uC5D0\\uC11C\\uB294 \\uD655\\uC815 \\uC774\\uBBF8\\uC9C0\\uB97C \\uC0C9 \\uBE14\\uB85D\\uC73C\\uB85C \\uD45C\\uC2DC\\uD569\\uB2C8\\uB2E4. \\uC2E4\\uC81C \\uC6B4\\uC601\\uC5D0\\uC11C\\uB294 \\uC120\\uD0DD\\xB7\\uD655\\uC815\\uD55C \\uCEE4\\uBC84(\\uC5C6\\uC73C\\uBA74 \\uCCAB \\uC7A5\\uBA74) \\uBBF8\\uB9AC\\uBCF4\\uAE30\\uAC00 \\uB4E4\\uC5B4\\uAC11\\uB2C8\\uB2E4.</p>`:\'<p class="mut">\\uC774 \\uB2EC\\uC5D0 \\uC608\\uC815\\uB41C \\uCF58\\uD150\\uCE20\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\')}function us(){let e=[...v.state.events.map(r=>({...r,src:""})),...v.productionRequests.flatMap(r=>(r.events||[]).map(s=>({...s,src:r.id+" \\xB7 "+r.snapshot.contentId}))),...(v.revisionRequests||[]).flatMap(r=>(r.events||[]).map(s=>({...s,src:r.id+" \\xB7 "+r.contentId})))].filter(r=>!$e||(r.message+r.src).toLowerCase().includes($e.toLowerCase())).sort((r,s)=>s.at.localeCompare(r.at)).slice(0,200),t=r=>{let s=new Date(r);return isNaN(s)?r:s.toLocaleString("ko-KR",{timeZone:"Asia/Seoul",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})};return`<h1>\\uC81C\\uC791 \\uAE30\\uB85D</h1><input type="text" id="lq" value="${u($e)}" placeholder="\\uCF58\\uD150\\uCE20 ID\\xB7\\uC81C\\uD488\\xB7\\uC694\\uCCAD\\uBC88\\uD638\\uB85C \\uCC3E\\uAE30" aria-label="\\uAE30\\uB85D \\uAC80\\uC0C9" oninput="logq(this.value)"><p class="mut">\\uD655\\uC815\\xB7\\uD574\\uC81C\\xB7\\uC774\\uBBF8\\uC9C0 \\uC120\\uD0DD\\xB7\\uC218\\uC815 \\uC694\\uCCAD\\xB7\\uB9C1\\uD06C \\uAE30\\uB85D \\uB4F1 \\uC5D4\\uC9C4\\uC774 \\uB0A8\\uAE34 \\uAE30\\uB85D\\uC785\\uB2C8\\uB2E4. \\uCD5C\\uADFC 200\\uAC74.</p>`+(e.map(r=>`<div class="logrow"><span class="mut">${u(t(r.at))}</span><span>${u(r.message)}${r.src?`<span class="mut"> \\xB7 ${u(r.src)}</span>`:""}</span></div>`).join("")||\'<p class="mut">\\uAE30\\uB85D\\uC774 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\')}function ps(){let e=v.trash||[];return e.length?`<h1>\\uD734\\uC9C0\\uD1B5</h1>${J.size?`<div class="card sel row"><b>${J.size}\\uAC74 \\uC120\\uD0DD</b><button class="p" onclick="bulkRestore()">\\uC120\\uD0DD \\uD56D\\uBAA9 \\uBCF5\\uC6D0</button></div>`:""}`+e.map(t=>`<div class="card"><label class="row"><input type="checkbox" aria-label="${u(t.content.id)} \\uC120\\uD0DD" ${J.has(t.key)?"checked":""} onchange="ttick(\'${u(t.key)}\',this.checked)"><b class="cid">${u(t.content.id)}</b>${$(t.content.format)}</label><div class="mut">${u(t.content.topic)} \\xB7 \\uBCF4\\uAD00 ${u(t.at.slice(0,10))}${t.reason?" \\xB7 "+u(t.reason):""}</div><div class="mut">\\uC6D0\\uACE0 ${t.content.reviews.length}\\uAC1C${t.approval?" \\xB7 \\uD655\\uC815 \\uAE30\\uB85D \\uC788\\uC74C":""}${t.storyboard?" \\xB7 \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC \\uC788\\uC74C":""}</div><button onclick="restoreT(\'${u(t.key)}\')">\\uBCF5\\uC6D0</button></div>`).join(""):\'<h1>\\uD734\\uC9C0\\uD1B5</h1><p class="mut">\\uD734\\uC9C0\\uD1B5\\uC774 \\uBE44\\uC5B4 \\uC788\\uC2B5\\uB2C8\\uB2E4. \\uBCF4\\uAD00\\uD55C \\uCF58\\uD150\\uCE20\\uB294 \\uC6D0\\uACE0\\xB7\\uC774\\uBBF8\\uC9C0 \\uAE30\\uB85D\\uACFC \\uD568\\uAED8 \\uBCF5\\uC6D0\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.</p>\'}var fs=e=>e.format==="Reel"?[["plan","\\uAE30\\uD68D"],["script","\\uC6D0\\uACE0"],["storyboard","\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC"],["images","\\uC774\\uBBF8\\uC9C0"],["video","\\uC601\\uC0C1"],["publish","\\uAC8C\\uC2DC"]]:[["plan","\\uAE30\\uD68D"],["script","\\uC6D0\\uACE0"],["images","\\uC774\\uBBF8\\uC9C0"],["publish","\\uAC8C\\uC2DC"]];function ms(){let e=oe(),t=O(e),r=R(v,e),s=fs(e),o=Re==="done"?"publish":Re||M(t);return s.some(n=>n[0]===o)||(o="images"),`<div class="hdr"><button onclick="go(null)">\\u2190 \\uBAA9\\uB85D</button><b title="${u(e.id)}">${u(e.id)}</b><button onclick="archive()">\\uBCF4\\uAD00</button></div>\n  <div class="mut">${u(e.format)} \\xB7 ${u(e.date)} \\xB7 \\uD655\\uC815 \\uC6D0\\uACE0 ${u(r?z(e,r.version):"\\uC5C6\\uC74C")}</div><div class="next">\\uB2E4\\uC74C: <b>${u(t.l)}</b>${t.why?` <span class="mut">\\u2014 ${u(t.why)}</span>`:""}</div>\n  <div class="tabs">${s.map(([n,i])=>`<button class="${n===o?"on":""}" onclick="tab(\'${n}\')">${i}${n===M(t)&&t.k!=="done"?" \\u2022":""}</button>`).join("")}</div>`+{plan:vs,script:gs,storyboard:bs,images:ys,video:Ss,publish:ws}[o](e,r)}function vs(e){let t=e.plan.strategyV2,r=be(e);return`<div class="card"><b>\\uAD6C\\uB9E4\\uC2EC\\uB9AC \\uAE30\\uD68D V2</b> ${t?$(xe[t.persona.type])+$(t.persona.evidenceStatus==="customer_data"?"\\uACE0\\uAC1D \\uB370\\uC774\\uD130 \\uADFC\\uAC70":"\\uAC00\\uC124"):""}${r.legacy?\'<p class="mut">\\uAD6C\\uD615 \\uAE30\\uD68D \\u2014 \\uBCC0\\uD658\\xB7\\uCC28\\uB2E8\\uD558\\uC9C0 \\uC54A\\uC2B5\\uB2C8\\uB2E4.</p>\':`<p>\\uC810\\uC218 ${r.score}/100 \\xB7 \\uC6D0\\uACE0 \\uC804\\uB2EC ${r.ready?"<b>\\uAC00\\uB2A5</b>":\'<b class="bad">\\uC7A0\\uAE40</b>\'}</p>${r.reasons.map(s=>`<div class="bad">\\u2022 ${u(s)}</div>`).join("")}`}${t?`<dl class="kv"><dt>\\uAD6C\\uB9E4 \\uC9C8\\uBB38</dt><dd>${u(t.core.purchaseQuestion)}</dd><dt>\\uC2EC\\uB9AC \\uC7A5\\uBCBD</dt><dd>${u(t.core.barrier)}</dd><dt>\\uC9C0\\uAE08 \\uC4F0\\uB294 \\uB300\\uC548</dt><dd>${u(t.persona.currentAlternative)}</dd><dt>\\uD3EC\\uAE30 \\uBABB \\uD558\\uB294 \\uC870\\uAC74</dt><dd>${u(t.persona.preserve)}</dd><dt>ISHARD \\uC120\\uD0DD \\uC774\\uC720</dt><dd>${u(t.fit.selectionReason)}</dd></dl>`:""}</div>\n  <div class="card"><b>\\uAE30\\uD68D JSON \\uAC00\\uC838\\uC624\\uAE30</b> <span class="mut">(\\uC800\\uC7A5\\uB9CC \\xB7 \\uC0AC\\uB78C \\uD655\\uC778\\uC740 \\uD56D\\uC0C1 \\uD574\\uC81C \\uC0C1\\uD0DC)</span><br><input type="file" accept=".json" aria-label="\\uAE30\\uD68D JSON \\uD30C\\uC77C" onchange="impStrategy(this)"></div>`+(t?`<div class="card"><b>\\uACF5\\uC2DD \\uADFC\\uAC70 \\uB4F1\\uB85D</b> <span class="mut">(\\uC0C1\\uC138\\uD398\\uC774\\uC9C0 \\uB4F1 \\uC2E4\\uC81C \\uCD9C\\uCC98\\uB9CC)</span><input type="text" id="fi" placeholder="ID \\uC608: F1" aria-label="\\uADFC\\uAC70 ID"><input type="text" id="ff" placeholder="\\uC0AC\\uC2E4" aria-label="\\uC0AC\\uC2E4"><input type="text" id="fs" placeholder="\\uCD9C\\uCC98 URL/\\uC790\\uB8CC\\uBA85" aria-label="\\uCD9C\\uCC98"><button onclick="addFact()">\\uB4F1\\uB85D</button>${(e.plan.productFacts||[]).map(s=>`<div class="mut">${u(s.id)}: ${u(s.fact)} (${u(s.source)})</div>`).join("")}</div><div class="card"><b>\\uC0AC\\uB78C \\uAC80\\uC218</b><div class="row"><button onclick="review(\'fit\')">\\uADFC\\uAC70 \\uAC80\\uC99D \\uC644\\uB8CC</button><button onclick="review(\'text\')">\\uD45C\\uD604\\xB7\\uC911\\uBCF5 \\uAC80\\uC218 \\uD1B5\\uACFC</button><button class="p" onclick="review(\'human\')">\\uB0B4\\uAC00 \\uD655\\uC778\\uD568</button></div></div><div class="scores">${Xt.map(([s,o])=>`<label>${o}<input type="number" min="0" max="20" step="1" id="sc-${s}" value="${t.quality.scores?.[s]??""}" inputmode="numeric"></label>`).join("")}<button onclick="review(\'score\')">\\uC810\\uC218 \\uC800\\uC7A5</button></div><p class="mut">\\uD56D\\uBAA9\\uBCC4 0~20\\uC810, \\uD569\\uACC4 80\\uC810 \\uC774\\uC0C1\\uC774\\uC5B4\\uC57C \\uC6D0\\uACE0\\uB85C \\uB118\\uC5B4\\uAC11\\uB2C8\\uB2E4. \\uC810\\uC218\\uB294 AI\\xB7\\uB0B4\\uBD80 \\uD3C9\\uAC00\\uC774\\uBA70 \\uC2E4\\uC81C \\uC131\\uACFC \\uC608\\uCE21\\uC774 \\uC544\\uB2D9\\uB2C8\\uB2E4.</p></div>`:"")}var ot=e=>e.sections.map(t=>t.text).join(`\n`),tr={received:"\\uC811\\uC218",processing:"\\uC791\\uC131 \\uC911",review:"\\uAC80\\uD1A0 \\uB300\\uAE30",blocked:"\\uBCF4\\uB958",approved:"\\uD655\\uC815\\uB428",withdrawn:"\\uCCA0\\uD68C"};function gs(e,t){let r=jt(v,e.id),s=r.filter(i=>!["approved","withdrawn"].includes(i.status)),o=[...e.reviews].sort((i,a)=>(t&&a.version===t.version)-(t&&i.version===t.version)),n=(i,a)=>{let c=t&&t.version===i.version;return`<div class="card ver ${c?"appr":""}"><div class="row"><b>${u(i.label||i.version)}</b>${c?$("\\uD655\\uC815","done"):""}${i.author==="user"?"":$("\\uAE30\\uC874")}</div>${i.label?`<div class="mut vid">${u(i.version)}</div>`:""}<h2>\\uB300\\uBCF8</h2><div class="pre">${u(ot(i))}</div><h2>\\uCEA1\\uC158</h2><div class="pre">${u(i.caption||"")}</div>${i.expectedComments?.length?`<details class="ec"><summary>\\uC608\\uC0C1 \\uB313\\uAE00 ${i.expectedComments.length}\\uAC1C <span class="mut">(\\uAC00\\uC0C1 \\uC2DC\\uCCAD\\uC790 \\uBC18\\uC751 \\uC608\\uC2DC \\xB7 \\uC2E4\\uC81C \\uD6C4\\uAE30 \\uC544\\uB2D8)</span></summary><ul>${i.expectedComments.map(d=>`<li>${u(d)}</li>`).join("")}</ul><button onclick="cpc(\'${u(i.version)}\')">\\uC608\\uC0C1 \\uB313\\uAE00 \\uBCF5\\uC0AC</button></details>`:""}\n    <div class="row" style="margin-top:8px">${c?`<button onclick="release(\'${u(i.version)}\')">\\uD655\\uC815 \\uD574\\uC81C</button>`:`<button class="p" onclick="approve(\'${u(i.version)}\')">\\uC774 \\uC6D0\\uACE0\\uB85C \\uD655\\uC815</button>`}<button onclick="dl(\'${u(i.version)}\')">JSON \\uBC1B\\uAE30</button><button onclick="cp(\'${u(i.version)}\')">JSON \\uBCF5\\uC0AC</button></div>\n    ${a?"":`<details class="rv"><summary>\\uC774 \\uBC84\\uC804 \\uC218\\uC815 \\uC694\\uCCAD</summary><textarea id="rq-${u(i.version)}" placeholder="\\uBB34\\uC5C7\\uC744 \\uBC14\\uAFC0\\uC9C0 \\uAD6C\\uCCB4\\uC801\\uC73C\\uB85C (\\uC608: \\uCCAB 3\\uCD08 \\uBB38\\uC7A5\\uC744 12\\uC790 \\uC774\\uB0B4\\uB85C)"></textarea><button onclick="askRev(\'${u(i.version)}\')">\\uC218\\uC815 \\uC694\\uCCAD \\uB4F1\\uB85D</button></details>`}</div>`};return\'<div class="card"><div class="row"><b>\\uC6D0\\uACE0 JSON \\uAC00\\uC838\\uC624\\uAE30</b><span class="mut">A/B/C\\uB97C \\uD30C\\uC77C \\uD558\\uB098\\uC529 \\xB7 \\uB300\\uBCF8\\xB7\\uCEA1\\uC158\\uB9CC</span></div><input type="file" accept=".json" aria-label="\\uC6D0\\uACE0 JSON \\uD30C\\uC77C" onchange="impScript(this)"></div>\'+s.map(i=>hs(e,i)).join("")+(e.reviews.length?(e.reviews.length>1?`<div class="seg" role="group" aria-label="\\uBCF4\\uAE30 \\uBC29\\uC2DD"><button class="${Ae==="list"?"on":""}" onclick="mode(\'list\')">\\uBAA9\\uB85D</button><button class="${Ae==="compare"?"on":""}" onclick="mode(\'compare\')">\\uB098\\uB780\\uD788 \\uBE44\\uAD50 (${e.reviews.length})</button></div>`:"")+(Ae==="compare"&&e.reviews.length>1?`<div class="cmp">${o.map(i=>n(i,!0)).join("")}</div><p class="mut">\\uC606\\uC73C\\uB85C \\uB118\\uACA8 \\uBE44\\uAD50\\uD558\\uC138\\uC694.</p>`:o.map((i,a)=>(a===1?`<h2>\\uB2E4\\uB978 \\uBC84\\uC804 (${o.length-1})</h2>`:"")+n(i,!1)).join("")):\'<p class="mut">\\uAC00\\uC838\\uC628 \\uC6D0\\uACE0\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\')+(r.length>s.length?`<details class="card"><summary>\\uC9C0\\uB09C \\uC218\\uC815 \\uC694\\uCCAD (${r.length-s.length})</summary>${r.filter(i=>!s.includes(i)).map(i=>`<div class="mut">${u(i.id)} \\xB7 ${u(i.version)} \\xB7 ${u(tr[i.status]||i.status)} \\u2014 ${u(i.text)}</div>`).join("")}</details>`:"")+\'<p class="mut">\\uC6D0\\uACE0 JSON \\uD615\\uC2DD: content_id \\xB7 script \\xB7 caption, \\uC120\\uD0DD \\uD56D\\uBAA9 comments(\\uC608\\uC0C1 \\uB313\\uAE00, \\uAC00\\uC0C1 \\uC608\\uC2DC \\uCD5C\\uB300 10\\uAC1C).</p>\'}function hs(e,t){let r=e.reviews.find(o=>o.version===t.version),s=t.responseVersion&&e.reviews.find(o=>o.version===t.responseVersion);return`<div class="card rev"><div class="row"><b>\\uC6D0\\uACE0 \\uC218\\uC815 \\uC694\\uCCAD</b>${$(tr[t.status]||t.status,t.status==="review"?"":"wait")}<span class="mut">${u(t.id)}</span></div><div>\\uC694\\uCCAD: ${u(t.text)}</div><div class="mut">\\uB300\\uC0C1 ${u(z(e,t.version))} \\xB7 \\uBBF8\\uD574\\uACB0 \\uC694\\uCCAD\\uC774 \\uC788\\uB294 \\uB3D9\\uC548 \\uC774\\uBBF8\\uC9C0 \\uC81C\\uC791\\uC740 \\uBCF4\\uB958\\uB429\\uB2C8\\uB2E4.</div>`+(s?`<div class="cmp two"><div class="card ver appr"><b>\\uC218\\uC815\\uBCF8</b> <span class="mut vid">${u(s.version)}</span><div class="pre">${u(ot(s))}</div><div class="mut">\\uBCC0\\uACBD \\uC694\\uC57D: ${u(t.changeSummary)}</div></div><div class="card ver"><b>\\uC6D0\\uBCF8 ${u(z(e,r.version))}</b> <span class="mut vid">${u(r.version)}</span><div class="pre">${u(ot(r))}</div></div></div><div class="row"><button class="p" onclick="approve(\'${u(s.version)}\')">\\uC218\\uC815\\uBCF8\\uC73C\\uB85C \\uD655\\uC815</button><button onclick="withdraw(\'${u(t.id)}\')">\\uCCA0\\uD68C</button></div>`:`<div class="row"><button onclick="brief(\'${u(t.id)}\')">\\uC791\\uAC00\\uC6A9 \\uC694\\uCCAD\\uBB38 \\uBCF5\\uC0AC</button><button onclick="withdraw(\'${u(t.id)}\')">\\uCCA0\\uD68C</button></div><details class="rv"><summary>\\uC218\\uC815\\uBCF8 \\uAC00\\uC838\\uC624\\uAE30</summary><input type="file" id="ra-${u(t.id)}" accept=".json" aria-label="\\uC218\\uC815\\uBCF8 JSON"><input type="text" id="rs-${u(t.id)}" placeholder="\\uBCC0\\uACBD \\uC694\\uC57D (\\uC608: \\uCCAB \\uBB38\\uC7A5 12\\uC790\\uB85C \\uCD95\\uC18C)" aria-label="\\uBCC0\\uACBD \\uC694\\uC57D"><button class="p" onclick="answer(\'${u(t.id)}\')">\\uC218\\uC815\\uBCF8 \\uC5F0\\uACB0</button></details><details><summary class="mut">\\uC694\\uCCAD\\uBB38 \\uBBF8\\uB9AC\\uBCF4\\uAE30</summary><div class="pre mut">${u(ze(v,t.id))}</div></details>`)+"</div>"}function bs(e,t){if(!t)return X("\\uC6D0\\uACE0\\uB97C \\uBA3C\\uC800 \\uD655\\uC815\\uD558\\uC138\\uC694.");let r=Se(v,e,t),s=Dt(r),o=`<details class="card"><summary>\\uAE30\\uC900 \\uC6D0\\uACE0 ${u(t.version)} (\\uC77D\\uAE30 \\uC804\\uC6A9)</summary><div class="pre mut">${u(t.sections.map(n=>n.text).join(`\n`))}</div></details>`;return r?.legacy?o+\'<p class="mut">\\uAE30\\uC874 \\uC571\\uC5D0\\uC11C \\uB9CC\\uB4E0 \\uC7A5\\uBA74\\uD45C\\uC785\\uB2C8\\uB2E4(\\uC77D\\uAE30 \\uC804\\uC6A9). \\uC0C8\\uB85C \\uB9CC\\uB4E4\\uB824\\uBA74 \\uB2E4\\uB978 \\uC6D0\\uACE0 \\uBC84\\uC804\\uC744 \\uD655\\uC815\\uD55C \\uB4A4 \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC JSON\\uC744 \\uAC00\\uC838\\uC624\\uC138\\uC694.</p>\'+r.scenes.map(n=>`<div class="card"><b>${u(n.number)}</b> ${$(n.timing)}<div class="pre">${u(n.visual)}</div></div>`).join(""):o+\'<div class="card"><b>\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC JSON \\uAC00\\uC838\\uC624\\uAE30</b> <span class="mut">\\uAE30\\uC874 4\\uD544\\uB4DC \\uB610\\uB294 \\uAD6C\\uB3C4 \\uC815\\uBCF4 \\uD3EC\\uD568 \\uD655\\uC7A5 \\uD615\\uC2DD</span><br><input type="file" accept=".json" aria-label="\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC JSON \\uD30C\\uC77C" onchange="impBoard(this)"></div>\'+s.map(n=>`<div class="card warnbox">${u(n)}</div>`).join("")+(r?r.scenes.map((n,i)=>`<div class="card"><div class="row"><b>scene-${i+1}</b>${$(n.timing)}${n.shot?.camera_angle?$(n.shot.camera_angle):""}${n.shot?.shot_size?$(n.shot.shot_size):""}</div><div>${u(n.visual)}</div><div class="mut">\\uC6C0\\uC9C1\\uC784: ${u(n.motion)}</div>${n.shot?`<dl class="kv">${ye.filter(a=>n.shot[a]&&!["camera_angle","shot_size"].includes(a)).map(a=>`<dt>${Ct[a]}</dt><dd>${u(n.shot[a])}</dd>`).join("")}</dl>`:\'<div class="mut">\\uAD6C\\uB3C4 \\uC815\\uBCF4 \\uC5C6\\uC74C</div>\'}</div>`).join(""):\'<p class="mut">\\uC544\\uC9C1 \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uAC00 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\')}var Kt=(e,t,r)=>`<div class="regrow"><input type="text" id="iu-${u(t)}" placeholder="\\uACB0\\uACFC \\uC774\\uBBF8\\uC9C0 Drive \\uB9C1\\uD06C" aria-label="${u(t)} Drive \\uB9C1\\uD06C"><button onclick="regImg(\'${e}\',\'${u(t)}\')">\\uB4F1\\uB85D</button></div>`+(C?"":`<button onclick="demoImg(\'${e}\',\'${u(t)}\')">${r}</button>`),Yt=["#d9cfb8","#c4c9a8","#cfc2b0","#b9bfa1","#e0d6c4"];function ys(e,t){if(!t)return X("\\uC6D0\\uACE0\\uB97C \\uBA3C\\uC800 \\uD655\\uC815\\uD558\\uC138\\uC694.");let r=We(v,e),s=r.m;if(r.legacy){let n=s.legacyConfirmed;return`<p class="mut">\\uAE30\\uC874 \\uC571\\uC5D0\\uC11C \\uB9CC\\uB4E0 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C\\uC785\\uB2C8\\uB2E4. \\uC774 \\uC6D0\\uACE0(${u(t.version)})\\uC758 \\uCD5C\\uC885 \\uC774\\uBBF8\\uC9C0\\uB85C \\uC4F8\\uC9C0 \\uD655\\uC778\\uD569\\uB2C8\\uB2E4.</p><div class="card"><div class="row"><b>\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 ${s.legacyImages}\\uC7A5</b>${n?$("\\uD655\\uC778\\uB428","done"):$("\\uD655\\uC778 \\uD544\\uC694")}</div><div class="row" style="margin:8px 0;align-items:flex-start">${e.images.map((i,a)=>`<div class="cand"><div class="sw" style="background:${Yt[a%5]}">${a+1}</div><a class="mut note" href="${u(i.url)}" target="_blank" rel="noopener">Drive \\uC6D0\\uBCF8</a></div>`).join("")}</div>${n?\'<button onclick="legacyUndo()">\\uD655\\uC778 \\uD574\\uC81C</button>\':\'<button class="p" onclick="legacyOk()">\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C \\uD655\\uC778</button>\'}</div><p class="mut">\\uB370\\uBAA8 \\uBBF8\\uB9AC\\uBCF4\\uAE30\\uC5D0\\uC11C\\uB294 \\uC2E4\\uC81C \\uC0AC\\uC9C4 \\uB300\\uC2E0 \\uC0C9 \\uBE14\\uB85D\\uC744 \\uBCF4\\uC5EC\\uC90D\\uB2C8\\uB2E4.</p>`}if(!s.root)return e.format==="Reel"&&!Se(v,e,t)?X("\\uD655\\uC815 \\uC6D0\\uACE0\\uC758 \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uAC00 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4."):`<div class="card"><p>${e.format==="Reel"?"\\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uC758 \\uCEF7\\uB9C8\\uB2E4":e.format==="Carousel"?"\\uC6D0\\uACE0\\uC758 \\uC7A5(\\uBE48 \\uC904\\uB85C \\uAD6C\\uBD84)\\uB9C8\\uB2E4":"\\uC774\\uBBF8\\uC9C0 \\uD55C \\uC7A5\\uC5D0 \\uB300\\uD574"} \\uC81C\\uC791 \\uC2AC\\uB86F\\uC744 \\uB9CC\\uB4ED\\uB2C8\\uB2E4. (\\uB370\\uBAA8: \\uC2E4\\uC81C \\uC0DD\\uC131 \\uC5C6\\uC74C)</p><input type="text" id="df" value="${u(e.drive||(C?"":Yr))}" placeholder="Drive \\uC800\\uC7A5 \\uD3F4\\uB354 \\uB9C1\\uD06C (https://drive.google.com/drive/folders/\\u2026)" aria-label="Drive \\uC800\\uC7A5 \\uD3F4\\uB354"><button class="p" onclick="reqImages()">\\uC774\\uBBF8\\uC9C0 \\uC81C\\uC791 \\uC694\\uCCAD \\uB9CC\\uB4E4\\uAE30</button></div>`;let o=s.root.id;return\'<p class="mut">\\uC6D0\\uBCF8\\uACFC \\uBAA8\\uB4E0 \\uC218\\uC815\\uBCF8\\uC740 \\uBCF4\\uC874\\uB429\\uB2C8\\uB2E4. \\uD6C4\\uBCF4\\uAC00 \\uD558\\uB098\\uBFD0\\uC774\\uBA74 \\uAE30\\uBCF8\\uC73C\\uB85C \\uC0AC\\uC6A9\\uB418\\uACE0, \\uC218\\uC815\\uBCF8\\uC774 \\uC0DD\\uAE30\\uBA74 \\uC9C1\\uC811 \\uB2E4\\uC2DC \\uACE8\\uB77C\\uC57C \\uD569\\uB2C8\\uB2E4. \\u2018\\uC774\\uBBF8\\uC9C0 \\uC804\\uCCB4 \\uD655\\uC815\\u2019\\uC740 \\uD56D\\uC0C1 \\uC9C1\\uC811 \\uB204\\uB985\\uB2C8\\uB2E4.</p>\'+s.slots.map(n=>{let i=n.candidates||[],a=n.selected,c=!!s.root.imageSelections?.[n.id]&&!!a,d=!!s.root.reviewedAt&&!s.pending&&!s.needsSelection,l=s.family.find(I=>I.parentId&&I.slots.some(m=>m.id===n.id&&!m.asset)),p=!i.length&&!l,h=I=>I.request.id===o?"\\uC6D0\\uBCF8":"\\uC218\\uC815 "+(i.filter(m=>m.request.id!==o).indexOf(I)+1);return`<div class="card"><div class="row"><b>${u(n.original.label||n.id)}</b><span class="mut">${u(n.id)}</span>${d?$("\\uD655\\uC815","done"):c?$("\\uC120\\uD0DD\\uB428"):a?$("\\uD6C4\\uBCF4 1\\uAC1C \\xB7 \\uAE30\\uBCF8 \\uC0AC\\uC6A9"):i.length?$("\\uC120\\uD0DD \\uD544\\uC694","bad"):""}${l?$("\\uC218\\uC815 \\uC9C4\\uD589 \\uC911","wait"):""}</div>\n      <div class="row" style="margin:6px 0;align-items:flex-start">${i.map((I,m)=>{let f=a&&a.request.id===I.request.id;return`<div class="cand"><div class="sw ${f?"sel":""}" style="background:${Yt[m%5]}">${h(I)}</div><button onclick="choose(\'${o}\',\'${u(n.id)}\',\'${I.request.id}\',\'${u(I.slot.asset.previewKey)}\')">${f?c?"\\u2714 \\uC0AC\\uC6A9":"\\uAE30\\uBCF8 \\uC0AC\\uC6A9":"\\uC120\\uD0DD"}</button>${I.request.note?`<div class="mut note">${u(I.request.note)}</div>`:""}</div>`}).join("")||\'<span class="mut">\\uD6C4\\uBCF4 \\uC5C6\\uC74C</span>\'}</div>`+(p?Kt(o,n.id,"\\uB370\\uBAA8 \\uC774\\uBBF8\\uC9C0 \\uCD94\\uAC00"):l?`<div class="mut">\\uC218\\uC815 \\uC694\\uCCAD: ${u(l.note)}</div>`+Kt(l.id,n.id,"\\uC218\\uC815\\uBCF8 \\uB370\\uBAA8 \\uCD94\\uAC00"):`<details class="rv"><summary>\\uC218\\uC815 \\uC694\\uCCAD</summary><textarea id="rv-${u(n.id)}" placeholder="\\uC218\\uC815\\uD560 \\uB0B4\\uC6A9 (\\uC608: \\uBE5B\\uC744 \\uB354 \\uBD80\\uB4DC\\uB7FD\\uAC8C)" style="min-height:52px"></textarea><button onclick="revise(\'${o}\',\'${u(n.id)}\')">\\uC218\\uC815 \\uC694\\uCCAD \\uBCF4\\uB0B4\\uAE30</button></details>`)+"</div>"}).join("")+(s.ready?`${$("\\uD655\\uC815\\uB428","done")} <button onclick="unconfirmImg(\'${o}\')">\\uD655\\uC815 \\uD574\\uC81C</button>`:`<button class="p" onclick="confirmImg(\'${o}\')">\\uC774\\uBBF8\\uC9C0 \\uC804\\uCCB4 \\uD655\\uC815</button>`)}function Ss(e,t){if(e.format!=="Reel")return X("\\uB9B4\\uC2A4\\uB9CC \\uC601\\uC0C1 \\uB2E8\\uACC4\\uAC00 \\uC788\\uC2B5\\uB2C8\\uB2E4.");let r=t&&We(v,e);if(!r)return X("\\uC6D0\\uACE0\\uB97C \\uBA3C\\uC800 \\uD655\\uC815\\uD558\\uC138\\uC694.");if(r.legacy)return r.m.legacyConfirmed?`<p class="mut">\\uAE30\\uC874 \\uC571\\uC5D0\\uC11C \\uB9CC\\uB4E0 \\uCF58\\uD150\\uCE20\\uC785\\uB2C8\\uB2E4. \\uC7A5\\uBA74\\uD45C\\uC640 \\uAE30\\uC874 \\uD504\\uB86C\\uD504\\uD2B8\\uB294 \\uCC38\\uACE0\\uC6A9\\uC73C\\uB85C\\uB9CC \\uBCF4\\uC5EC\\uC90D\\uB2C8\\uB2E4.</p><details class="card"><summary>\\uAE30\\uC874 \\uC7A5\\uBA74 \\uD504\\uB86C\\uD504\\uD2B8 (${e.scenes.length})</summary>${e.scenes.map(n=>`<div class="pre mut">${u(n.timing)} \\xB7 ${u(n.prompt||n.visual)}</div>`).join("")}</details><div class="card"><b>\\uCD5C\\uC885 \\uC601\\uC0C1 Drive \\uB9C1\\uD06C</b><input type="text" id="vu" value="${u(r.m.finalVideoUrl||"")}" placeholder="https://drive.google.com/file/d/\\u2026/view" aria-label="\\uC601\\uC0C1 Drive \\uB9C1\\uD06C"><button onclick="video(\'\')">\\uB9C1\\uD06C \\uAE30\\uB85D</button></div>`:X("\\uAE30\\uC874 \\uC774\\uBBF8\\uC9C0 \\uBB36\\uC74C\\uC744 \\uBA3C\\uC800 \\uD655\\uC778\\uD574\\uC8FC\\uC138\\uC694.");let s=Ut(v,e.id,t.version);if(!s.ready)return X("\\uC774\\uBBF8\\uC9C0 \\uC804\\uCCB4 \\uD655\\uC815 \\uD6C4 \\uC0AC\\uC6A9\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.");let o=v.productionRequests.find(n=>n.id===s.root_id);return\'<p class="mut">17\\uC139\\uC158(\\uAE30\\uBCF8 14 + AUDIO\\xB7END FRAME\\xB7TIMING)\\uC744 \\uC5D4\\uC9C4\\uC774 \\uAC80\\uC99D\\uD569\\uB2C8\\uB2E4. \\uC2A4\\uD1A0\\uB9AC\\uBCF4\\uB4DC\\uC758 \\uAD6C\\uB3C4 \\uC815\\uBCF4\\uAC00 \\uC788\\uC73C\\uBA74 CAMERA\\xB7FIRST FRAME\\xB7END FRAME\\uC5D0 \\uBBF8\\uB9AC \\uCC44\\uC6CC\\uC9D1\\uB2C8\\uB2E4. \\uD658\\uACBD\\uC74C\\xB7\\uD6A8\\uACFC\\uC74C\\uB9CC \\uD5C8\\uC6A9\\uD558\\uBA70, \\uC2E4\\uC81C \\uC601\\uC0C1 \\uC0DD\\uC131\\xB7\\uBE44\\uC6A9 \\uBC1C\\uC0DD\\uC740 \\uC5C6\\uC2B5\\uB2C8\\uB2E4.</p>\'+s.scenes.map(n=>`<div class="card"><div class="row"><b>${n.scene_id}</b>${$(n.prompt_status==="current"?"\\uC800\\uC7A5\\uB428":n.prompt_status==="stale"?"\\uC774\\uBBF8\\uC9C0 \\uBCC0\\uACBD\\uB428 \\xB7 \\uB2E4\\uC2DC \\uC800\\uC7A5":"\\uBBF8\\uC791\\uC131",n.prompt_status==="current"?"done":"")}</div><textarea id="h-${n.scene_id}" style="min-height:220px" aria-label="${n.scene_id} \\uD504\\uB86C\\uD504\\uD2B8">${u(n.prompt?n.prompt.prompt:Ft(n))}</textarea><button class="p" onclick="saveH(\'${n.scene_id}\')">\\uAC80\\uC99D \\uD6C4 \\uC800\\uC7A5</button></div>`).join("")+`<div class="card"><b>\\uCD5C\\uC885 \\uC601\\uC0C1 Drive \\uB9C1\\uD06C</b><input type="text" id="vu" value="${u(o.finalVideoUrl||"")}" placeholder="https://drive.google.com/file/d/\\u2026/view" aria-label="\\uC601\\uC0C1 Drive \\uB9C1\\uD06C"><button onclick="video(\'${o.id}\')">\\uB9C1\\uD06C \\uAE30\\uB85D</button></div>`}function ws(e){let t=O(e),r=(v.state.publications||[]).findLast(s=>s.contentId===e.id);return`<div class="card"><b>\\uC2E4\\uC81C \\uAC8C\\uC2DC \\uD6C4 SNS \\uC6D0\\uBB38 URL \\uAE30\\uB85D</b><p class="mut">\\uC790\\uB3D9 \\uAC8C\\uC2DC\\uD558\\uC9C0 \\uC54A\\uC2B5\\uB2C8\\uB2E4. ${e.format==="Reel"?"\\uC601\\uC0C1 \\uB9C1\\uD06C \\uAE30\\uB85D \\uD6C4\\uC5D0\\uB9CC":"\\uC774\\uBBF8\\uC9C0 \\uD655\\uC815 \\uD6C4\\uC5D0\\uB9CC"} \\uAE30\\uB85D\\uD560 \\uC218 \\uC788\\uC2B5\\uB2C8\\uB2E4.</p><input type="text" id="pu" value="${u(r?r.url:"")}" placeholder="https://www.instagram.com/p/\\u2026" aria-label="\\uAC8C\\uC2DC\\uBB3C \\uB9C1\\uD06C"><button class="p" onclick="pub()">\\uB9C1\\uD06C \\uAE30\\uB85D</button>${t.k==="done"?"<p>\\u2714 \\uAC8C\\uC2DC \\uB9C1\\uD06C \\uAE30\\uB85D\\uB428</p>":r?\'<p class="mut">\\uC774\\uC804\\uC5D0 \\uAE30\\uB85D\\uD55C \\uB9C1\\uD06C\\uAC00 \\uC788\\uC73C\\uB098 \\uC6D0\\uACE0\\uB098 \\uC774\\uBBF8\\uC9C0\\uAC00 \\uBC14\\uB00C\\uC5B4 \\uB2E4\\uC2DC \\uAE30\\uB85D\\uC774 \\uD544\\uC694\\uD569\\uB2C8\\uB2E4.</p>\':""}</div>`}Wr();})();\n<\/script></body></html>\n';
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
