/* ============================================================================
 * app.js  —  Family Learning Portal (single-page app, no backend needed)
 * v2: per-child development areas, 8-week plan, growth charts + stars.
 * ==========================================================================*/
(function () {
  "use strict";
  const CFG = window.PORTAL_CONFIG;
  const ENGINE = window.ContentEngine;
  const LESSONS = window.LESSONS || {};
  const $ = (sel, elm = document) => elm.querySelector(sel);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  const SUBJECTS = [
    { key: "math", label: "Maths", icon: "\u2797", color: "math" },
    { key: "english", label: "English", icon: "\u270D\uFE0F", color: "english" },
    { key: "science", label: "Science", icon: "\uD83D\uDD2C", color: "science" }
  ];

  /* ---------------- session + progress storage ------------------------- */
  const SKEY = "flp_session";
  const PKEY = (child) => "flp_progress_" + child;
  function getSession() { try { return JSON.parse(sessionStorage.getItem(SKEY)); } catch (e) { return null; } }
  function setSession(s) { sessionStorage.setItem(SKEY, JSON.stringify(s)); }
  function clearSession() { sessionStorage.removeItem(SKEY); }
  function loadProgress(child) { try { return JSON.parse(localStorage.getItem(PKEY(child))) || {}; } catch (e) { return {}; } }
  function saveProgress(child, p) {
    try {
      localStorage.setItem(PKEY(child), JSON.stringify(p));
      return true;
    } catch (e) {
      toast("\u26A0\uFE0F Could not save on this device. Progress may not stick in private/incognito mode.", true);
      return false;
    }
  }
  function progressMeta(p) { return p.__meta || (p.__meta = {}); }

  // Small "saved" confirmation toast (bottom-right).
  let toastTimer = null;
  function toast(msg, isErr) {
    let t = document.getElementById("flp-toast");
    if (!t) { t = el("div"); t.id = "flp-toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, isErr ? 5000 : 2600);
  }

  function timeAgo(ts) {
    if (!ts) return "\u2014";
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60); if (m < 60) return m + " min ago";
    const h = Math.floor(m / 60); if (h < 24) return h + " hr ago";
    const d = Math.floor(h / 24); if (d < 7) return d + " day" + (d > 1 ? "s" : "") + " ago";
    return new Date(ts).toLocaleDateString();
  }

  function recordAttempt(child, weekId, subject, result) {
    const p = loadProgress(child);
    const m = p[weekId] || { attempts: [], best: 0, passed: false, projectDone: false, stars: 0, subject };
    m.subject = subject;
    const now = Date.now();
    if (result.type === "quiz") {
      m.attempts.push({ t: now, score: result.score, total: result.total, pct: result.pct });
      m.best = Math.max(m.best, result.pct);
      if (result.passed) m.passed = true;
      const s = result.pct === 100 ? 3 : result.passed ? 2 : 1;
      m.stars = Math.max(m.stars || 0, s);
      m.lastAt = now;
    } else if (result.type === "project") {
      m.projectDone = true;
      m.attempts.push({ t: now, project: true });
      m.stars = Math.max(m.stars || 0, 2);
      m.lastAt = now;
    } else if (result.type === "train") {
      m.trainings = (m.trainings || 0) + 1;
      m.lastAt = now;
    }
    p[weekId] = m;
    progressMeta(p).lastActive = now;
    const ok = saveProgress(child, p);
    if (ok && result.type !== "train") toast("\u2705 Progress saved");
    return m;
  }

  /* ---------------- export / import (free cross-device sync) ----------- */
  function exportAllProgress() {
    const out = { app: "family-learning-portal", version: 2, exportedAt: Date.now(), children: {} };
    Object.keys(CFG.children).forEach(ck => { out.children[ck] = loadProgress(ck); });
    return JSON.stringify(out);
  }
  function mergeMeta(a, b) {
    if (!a) return b; if (!b) return a;
    const m = Object.assign({}, a);
    m.best = Math.max(a.best || 0, b.best || 0);
    m.stars = Math.max(a.stars || 0, b.stars || 0);
    m.trainings = Math.max(a.trainings || 0, b.trainings || 0);
    m.passed = !!(a.passed || b.passed);
    m.projectDone = !!(a.projectDone || b.projectDone);
    m.subject = a.subject || b.subject;
    m.attempts = (a.attempts || []).concat(b.attempts || []).sort((x, y) => (x.t || 0) - (y.t || 0));
    m.lastAt = Math.max(a.lastAt || 0, b.lastAt || 0);
    return m;
  }
  function importAllProgress(jsonText) {
    let data;
    try { data = JSON.parse(jsonText); } catch (e) { return { ok: false, msg: "That doesn't look like valid progress data." }; }
    if (!data || !data.children) return { ok: false, msg: "No progress found in that data." };
    let merged = 0;
    Object.keys(data.children).forEach(ck => {
      if (!CFG.children[ck]) return;
      const cur = loadProgress(ck);
      const inc = data.children[ck] || {};
      Object.keys(inc).forEach(k => {
        if (k === "__meta") { const cm = progressMeta(cur); cm.lastActive = Math.max(cm.lastActive || 0, (inc.__meta || {}).lastActive || 0); return; }
        cur[k] = mergeMeta(cur[k], inc[k]); merged++;
      });
      saveProgress(ck, cur);
    });
    return { ok: true, msg: "Imported and merged " + merged + " saved item" + (merged === 1 ? "" : "s") + ". \uD83C\uDF89" };
  }
  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------------- progress maths (growth + stars) -------------------- */
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function starStr(n) { return "\u2B50".repeat(n) + "\u2606".repeat(Math.max(0, 3 - n)); }

  // "Now%" for a development area: never below the report baseline; lifts as
  // the child passes quizzes / finishes projects that target that area.
  function devAreaNow(progress, subjData, area) {
    const basePct = pct(area.baseline[0], area.baseline[1]);
    let now = basePct;
    subjData.weeks.forEach(w => {
      const targets = w.area === area.id || (w.addresses && w.addresses.indexOf(area.id) >= 0);
      if (!targets) return;
      const mp = progress[w.id];
      if (!mp) return;
      if (mp.best) now = Math.max(now, mp.best);
      if (mp.projectDone) now = Math.max(now, 80);
    });
    now = Math.min(100, now);
    return { basePct, now, growth: now - basePct };
  }

  function subjectStars(progress, subjData) {
    let earned = 0, max = 0;
    subjData.weeks.forEach(w => {
      max += (w.type === "project") ? 2 : 3;
      const mp = progress[w.id];
      if (mp && mp.stars) earned += mp.stars;
    });
    return { earned, max };
  }

  function totalStars(child) {
    const data = CFG.children[child];
    const progress = loadProgress(child);
    let earned = 0, max = 0;
    SUBJECTS.forEach(sub => {
      const sd = data.subjects[sub.key]; if (!sd) return;
      const s = subjectStars(progress, sd); earned += s.earned; max += s.max;
    });
    return { earned, max };
  }

  function areaOf(subjData, id) { return subjData.devAreas.find(a => a.id === id); }
  function lessonKey(subKey, week) { return subKey + ":" + week.area; }
  function weekGoal(subjData, week) {
    const a = areaOf(subjData, week.area);
    return a ? a.label : week.title;
  }

  /* ---------------- root render router --------------------------------- */
  const app = $("#app");
  function render() {
    const s = getSession();
    if (!s) return renderLogin();
    if (s.role === "parent") return renderParent();
    return renderChildHome(s.child);
  }

  /* ---------------- LOGIN ---------------------------------------------- */
  function renderLogin() {
    app.innerHTML = "";
    const wrap = el("div", "login-wrap");
    const card = el("div", "card login-card");
    card.appendChild(el("div", "logo", "\uD83D\uDCDA"));
    card.appendChild(el("h1", null, "Family Learning Portal"));
    card.appendChild(el("p", "muted", "Summer road to Grade 7 \u2014 Youssef & Yassine"));

    const form = el("form", "login-form");
    const u = el("input"); u.placeholder = "Username"; u.autocomplete = "username"; u.required = true;
    const pw = el("input"); pw.type = "password"; pw.placeholder = "Password"; pw.autocomplete = "current-password"; pw.required = true;
    const err = el("div", "error"); err.style.display = "none";
    const btn = el("button", "btn primary", "Log in"); btn.type = "submit";
    form.append(u, pw, err, btn);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = u.value.trim().toLowerCase();
      const acc = CFG.users[name];
      if (!acc || acc.password !== pw.value) { err.textContent = "Wrong username or password. Try again."; err.style.display = "block"; return; }
      setSession({ user: name, role: acc.role, child: acc.child, display: acc.display });
      render();
    });
    card.appendChild(form);
    card.appendChild(el("div", "muted hint", "Accounts: youssef \u00B7 yassine \u00B7 parent  (passwords are set in js/config.js)"));
    wrap.appendChild(card);
    app.appendChild(wrap);
  }

  /* ---------------- shared header -------------------------------------- */
  function header(title, subtitle) {
    const h = el("header", "topbar");
    const left = el("div", "topbar-left");
    left.appendChild(el("span", "brand", "\uD83D\uDCDA Learning Portal"));
    if (title) left.appendChild(el("span", "crumb", "\u203A " + title));
    const right = el("div", "topbar-right");
    const s = getSession();
    right.appendChild(el("span", "who", (s.role === "parent" ? "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 " : "\uD83E\uDDD2 ") + s.display));
    const out = el("button", "btn ghost small", "Log out");
    out.addEventListener("click", () => { clearSession(); render(); });
    right.appendChild(out);
    h.append(left, right);
    const bar = el("div");
    bar.appendChild(h);
    if (subtitle) bar.appendChild(el("div", "subtitle", subtitle));
    return bar;
  }

  /* ---------------- growth panel (chart + table) ----------------------- */
  function growthPanel(progress, subjData) {
    const panel = el("div", "growth");
    const gh = el("div", "growth-head");
    gh.appendChild(el("h3", null, "\uD83D\uDCC8 My growth \u2014 areas I'm developing"));
    const st = subjectStars(progress, subjData);
    gh.appendChild(el("span", "stars-badge", starCount(st.earned) + " " + st.earned + " / " + st.max + " stars"));
    panel.appendChild(gh);

    subjData.devAreas.forEach(area => {
      const g = devAreaNow(progress, subjData, area);
      const row = el("div", "grow-row");
      const top = el("div", "grow-top");
      top.appendChild(el("span", "grow-label", area.label));
      top.appendChild(el("span", "grow-nums muted",
        "was " + area.baseline[0] + "/" + area.baseline[1] + " \u00B7 start " + g.basePct + "% \u2192 now " + g.now + "%" +
        (g.growth > 0 ? "  \uD83D\uDD3A +" + g.growth : "")));
      row.appendChild(top);

      const track = el("div", "grow-track");
      const now = el("div", "grow-now"); now.style.width = g.now + "%";
      if (g.growth > 0) now.classList.add("up");
      track.appendChild(now);
      const marker = el("div", "grow-start-marker"); marker.style.left = g.basePct + "%";
      marker.title = "Where you started (from your report)";
      track.appendChild(marker);
      row.appendChild(track);
      panel.appendChild(row);
    });
    panel.appendChild(el("div", "muted grow-note", "The dotted line \u2506 is where you started on your report. The coloured bar grows every time you pass a quiz \u2014 aim to push it to the right! \u2B50"));
    return panel;
  }
  function starCount(n) { return n > 0 ? "\u2B50".repeat(Math.min(n, 5)) + (n > 5 ? "\u00D7" + n : "") : "\u2606"; }

  /* ---------------- per-week report table (both dashboards) ------------ */
  function weekReportTable(progress, subjData) {
    const wrap = el("div", "report-table-wrap");
    const t = el("table", "report-table");
    const thead = el("tr");
    ["Week", "Topic", "Status", "Best", "Tries", "Practice", "Last"].forEach(h => thead.appendChild(el("th", null, h)));
    t.appendChild(thead);
    subjData.weeks.forEach(w => {
      const mp = progress[w.id] || {};
      const isProject = w.type === "project";
      const tr = el("tr");
      tr.appendChild(el("td", "rt-wk", "W" + w.week));
      tr.appendChild(el("td", "rt-topic", w.title));
      const done = mp.passed || mp.projectDone;
      const stTxt = mp.passed ? "\u2713 Achieved" : mp.projectDone ? "\u2713 Done" : mp.best ? "In progress" : "Not started";
      const stTd = el("td", "rt-status " + (done ? "ok" : (mp.best ? "prog" : "todo")), stTxt);
      tr.appendChild(stTd);
      tr.appendChild(el("td", null, isProject ? "\u2014" : (mp.best ? mp.best + "%" : "\u2014")));
      const quizTries = (mp.attempts || []).filter(a => !a.project).length;
      tr.appendChild(el("td", null, isProject ? (mp.projectDone ? "\u2713" : "\u2014") : String(quizTries)));
      tr.appendChild(el("td", null, mp.trainings ? String(mp.trainings) : "\u2014"));
      tr.appendChild(el("td", "muted", timeAgo(mp.lastAt)));
      t.appendChild(tr);
    });
    wrap.appendChild(t);
    return wrap;
  }

  /* ---------------- sync panel (export / import progress) -------------- */
  function syncPanel(opts) {
    opts = opts || {};
    const panel = el("div", "sync-panel card");
    panel.appendChild(el("h3", null, "\uD83D\uDD04 Save & share progress across devices"));
    panel.appendChild(el("p", "muted", opts.hint || "Progress is saved automatically on THIS device. To see it on another device (e.g. the parent's phone), Export here and Import it there."));
    const row = el("div", "sync-actions");
    const exp = el("button", "btn primary small", "\u2B07\uFE0F Export progress (download)");
    const imp = el("button", "btn ghost small", "\u2B06\uFE0F Import progress");
    const copyBtn = el("button", "btn ghost small", "\uD83D\uDCCB Copy code");
    row.append(exp, copyBtn, imp);
    panel.appendChild(row);

    const box = el("textarea", "sync-box");
    box.placeholder = "Progress code will appear here when you Export. To Import on another device, paste a code here and press Import.";
    panel.appendChild(box);
    const msg = el("div", "sync-msg muted");
    panel.appendChild(msg);

    exp.addEventListener("click", () => {
      const json = exportAllProgress();
      box.value = json;
      downloadText("learning-progress.json", json);
      msg.textContent = "Exported! A file was downloaded and the code is shown above \u2014 you can also Copy it.";
      msg.className = "sync-msg good";
    });
    copyBtn.addEventListener("click", () => {
      if (!box.value) box.value = exportAllProgress();
      box.select();
      try { navigator.clipboard.writeText(box.value); msg.textContent = "Copied to clipboard \u2014 paste it into the other device."; msg.className = "sync-msg good"; }
      catch (e) { document.execCommand && document.execCommand("copy"); msg.textContent = "Selected \u2014 press Ctrl/Cmd+C to copy."; msg.className = "sync-msg"; }
    });
    imp.addEventListener("click", () => {
      const res = importAllProgress(box.value.trim());
      msg.textContent = res.msg;
      msg.className = "sync-msg " + (res.ok ? "good" : "bad");
      if (res.ok && opts.onImport) setTimeout(opts.onImport, 700);
    });
    return panel;
  }

  /* ---------------- CHILD HOME ----------------------------------------- */
  function renderChildHome(child) {
    const data = CFG.children[child];
    const progress = loadProgress(child);
    app.innerHTML = "";
    app.appendChild(header());

    const container = el("div", "container");
    const hero = el("div", "hero card");
    hero.appendChild(el("h1", null, "Hi " + data.name + "! \uD83D\uDC4B"));
    hero.appendChild(el("p", "muted", data.motto));
    const ts = totalStars(child);
    const banner = el("div", "star-banner");
    banner.appendChild(el("span", "star-big", "\u2B50"));
    banner.appendChild(el("span", null, "You've earned "));
    banner.appendChild(el("b", null, ts.earned + " stars"));
    banner.appendChild(el("span", null, " so far \u2014 keep growing!"));
    hero.appendChild(banner);
    const meta = progressMeta(progress);
    hero.appendChild(el("div", "muted last-active", "\uD83D\uDCBE Your progress is saved automatically on this device \u00B7 last activity: " + timeAgo(meta.lastActive)));
    container.appendChild(hero);

    SUBJECTS.forEach(sub => {
      const sd = data.subjects[sub.key];
      if (!sd) return;
      const section = el("section", "subject-section");
      const head = el("div", "subject-head " + sub.color);
      head.appendChild(el("span", "subject-icon", sub.icon));
      const ht = el("div");
      ht.appendChild(el("h2", null, sub.label));
      ht.appendChild(el("div", "subject-meta", "Your result: " + sd.score + "/50 (" + sd.level + ") \u00B7 class avg " + sd.classAvg));
      if (sd.note) ht.appendChild(el("div", "subject-note", sd.note));
      head.appendChild(ht);
      section.appendChild(head);

      // growth chart + dev-area table
      section.appendChild(growthPanel(progress, sd));

      // weekly plan Week 1..8
      const strip = el("div", "week-strip");
      sd.weeks.forEach(w => {
        const mp = progress[w.id] || {};
        const isProject = w.type === "project";
        const done = mp.passed || mp.projectDone;
        const card = el("div", "card week-card" + (done ? " done" : ""));
        const wtop = el("div", "week-top");
        wtop.appendChild(el("span", "week-num", "Week " + w.week));
        const sb = el("span", "week-stars", mp.stars ? starStr(mp.stars) : (isProject ? "\u2606\u2606" : "\u2606\u2606\u2606"));
        wtop.appendChild(sb);
        card.appendChild(wtop);
        card.appendChild(el("h3", null, w.title));

        const area = areaOf(sd, w.area);
        const tag = el("div", "target-tag");
        tag.appendChild(el("span", "tag-dot " + sub.color, ""));
        tag.appendChild(el("span", null, "Targets: " + (area ? area.label : w.title) +
          (area ? " (was " + area.baseline[0] + "/" + area.baseline[1] + ")" : "")));
        card.appendChild(tag);

        const status = el("div", "status-badge " + (done ? "done" : (mp.best ? "prog" : "todo")));
        status.textContent = mp.passed ? "\u2713 Achieved" : mp.projectDone ? "\u2713 Done" : mp.best ? ("Best " + mp.best + "%") : "Not started";
        card.appendChild(status);

        const meta = el("div", "milestone-meta");
        meta.textContent = isProject ? "\u270F\uFE0F Writing task \u2014 check your own work"
          : ("\uD83C\uDFAF Pass mark: " + w.target[0] + "/" + w.target[1] + " \u00B7 \u267E\uFE0F Fresh questions every time");
        card.appendChild(meta);

        const actions = el("div", "actions");
        if (isProject) {
          const b = el("button", "btn primary small", "Open task \u270F\uFE0F");
          b.addEventListener("click", () => renderProject(child, sub, w));
          actions.appendChild(b);
        } else {
          const learn = el("button", "btn ghost small", "\u2460 Learn");
          learn.addEventListener("click", () => renderLearn(child, sub, w));
          const train = el("button", "btn ghost small", "\u2461 Train");
          train.addEventListener("click", () => renderTrain(child, sub, w));
          const quiz = el("button", "btn primary small", "\u2462 Quiz");
          quiz.addEventListener("click", () => renderQuiz(child, sub, w));
          actions.append(learn, train, quiz);
        }
        card.appendChild(actions);
        strip.appendChild(card);
      });
      section.appendChild(strip);

      // per-week detail so kids see exactly what they've done
      const rep = el("details", "week-report");
      rep.appendChild(el("summary", null, "\uD83D\uDCCB My weekly progress detail"));
      rep.appendChild(weekReportTable(progress, sd));
      section.appendChild(rep);

      container.appendChild(section);
    });
    container.appendChild(syncPanel({
      hint: "Your work is saved on this device. To let a parent see it on another device, press Export and send them the file or code.",
      onImport: () => renderChildHome(child)
    }));
    app.appendChild(container);
  }

  function backBtn(child) {
    const b = el("button", "btn ghost small back", "\u2190 Back");
    b.addEventListener("click", () => renderChildHome(child));
    return b;
  }

  /* ---------------- LEARN ---------------------------------------------- */
  function renderLearn(child, sub, week) {
    const sd = CFG.children[child].subjects[sub.key];
    app.innerHTML = "";
    app.appendChild(header(week.title, "\u2460 Learn \u2014 build up the idea"));
    const c = el("div", "container narrow");
    c.appendChild(backBtn(child));
    const card = el("div", "card lesson");
    card.appendChild(el("h1", null, sub.icon + " " + week.title));
    card.appendChild(el("p", "goal", "Targets: " + weekGoal(sd, week)));

    const lesson = LESSONS[lessonKey(sub.key, week)] || { html: "<p>Read the goal above, try the worked examples, then move on to Train.</p>" };
    const box = el("div", "lesson-body");
    box.innerHTML = lesson.html;
    card.appendChild(box);

    if (!ENGINE.isProject(week.generators)) {
      card.appendChild(el("h3", null, "Worked examples"));
      const items = ENGINE.generate(week.generators, 3, Date.now() & 0xffffff);
      items.forEach((it, i) => {
        const ex = el("div", "worked");
        ex.appendChild(el("div", "worked-q", "Example " + (i + 1) + ": " + it.q));
        ex.appendChild(el("div", "worked-a", "Answer: " + (it._fill ? it.answer : it.choices[it.answer])));
        if (it.explain) ex.appendChild(el("div", "worked-e", "\uD83D\uDCA1 " + it.explain));
        card.appendChild(ex);
      });
    }
    const go = el("button", "btn primary", "Now Train it \u2192");
    go.addEventListener("click", () => renderTrain(child, sub, week));
    card.appendChild(go);
    c.appendChild(card);
    app.appendChild(c);
  }

  /* ---------------- TRAIN ---------------------------------------------- */
  function renderTrain(child, sub, week) {
    app.innerHTML = "";
    app.appendChild(header(week.title, "\u2461 Train \u2014 practise as much as you like"));
    const c = el("div", "container narrow");
    c.appendChild(backBtn(child));
    const card = el("div", "card");
    const bar = el("div", "train-bar");
    const counter = el("span", "muted", "Score: 0 correct");
    const nextBtn = el("button", "btn ghost small", "New question \u21BB");
    bar.append(counter, nextBtn);
    card.appendChild(bar);
    const host = el("div");
    card.appendChild(host);
    c.appendChild(card);
    app.appendChild(c);

    let correct = 0, done = 0;
    function nextQ() {
      const it = ENGINE.generate(week.generators, 1, (Date.now() ^ (done * 2654435761)) & 0xffffffff)[0];
      host.innerHTML = "";
      const q = el("div", "question");
      q.appendChild(el("div", "q-text", it.q));
      const opts = el("div", "options");
      const fb = el("div", "feedback");
      it.choices.forEach((ch, i) => {
        const o = el("button", "option", ch);
        o.addEventListener("click", () => {
          if (o.disabled) return;
          Array.from(opts.children).forEach(x => x.disabled = true);
          done++;
          if (i === it.answer) { o.classList.add("correct"); correct++; fb.className = "feedback good"; fb.textContent = "\u2705 Correct! " + (it.explain || ""); }
          else { o.classList.add("wrong"); opts.children[it.answer].classList.add("correct"); fb.className = "feedback bad"; fb.textContent = "\u274C Not quite. " + (it.explain || ""); }
          counter.textContent = "Score: " + correct + " correct out of " + done;
          recordAttempt(child, week.id, sub.key, { type: "train" });
          const nb = el("button", "btn primary small", "Next question \u2192");
          nb.addEventListener("click", nextQ);
          fb.appendChild(document.createElement("br"));
          fb.appendChild(nb);
        });
        opts.appendChild(o);
      });
      q.appendChild(opts); q.appendChild(fb);
      host.appendChild(q);
    }
    nextBtn.addEventListener("click", nextQ);
    nextQ();
  }

  /* ---------------- QUIZ ----------------------------------------------- */
  function renderQuiz(child, sub, week) {
    const sd = CFG.children[child].subjects[sub.key];
    const total = week.target ? week.target[1] : 10;
    const passMark = week.target ? week.target[0] : Math.ceil(total * 0.8);
    const items = ENGINE.generate(week.generators, total, Date.now() & 0xffffffff);
    let idx = 0, score = 0;
    const answers = [];

    app.innerHTML = "";
    app.appendChild(header(week.title, "\u2462 Quiz \u2014 get " + passMark + "/" + total + " to achieve this week"));
    const c = el("div", "container narrow");
    c.appendChild(backBtn(child));
    const card = el("div", "card");
    c.appendChild(card);
    app.appendChild(c);

    function showQ() {
      const it = items[idx];
      card.innerHTML = "";
      const prog = el("div", "quiz-progress");
      prog.appendChild(el("span", "muted", "Question " + (idx + 1) + " of " + total));
      const pbar = el("div", "pbar"); const fillEl = el("div", "pbar-fill"); fillEl.style.width = (idx / total * 100) + "%"; pbar.appendChild(fillEl);
      prog.appendChild(pbar);
      card.appendChild(prog);
      const q = el("div", "question");
      q.appendChild(el("div", "q-text", it.q));
      const opts = el("div", "options");
      it.choices.forEach((ch, i) => {
        const o = el("button", "option", ch);
        o.addEventListener("click", () => {
          Array.from(opts.children).forEach(x => x.disabled = true);
          const ok = i === it.answer;
          if (ok) { o.classList.add("correct"); score++; }
          else { o.classList.add("wrong"); opts.children[it.answer].classList.add("correct"); }
          answers.push({ q: it.q, correct: ok, right: it.choices[it.answer], explain: it.explain });
          const fb = el("div", ok ? "feedback good" : "feedback bad");
          fb.textContent = (ok ? "\u2705 Correct! " : "\u274C Answer: " + it.choices[it.answer] + ". ") + (it.explain || "");
          const nb = el("button", "btn primary small", idx + 1 < total ? "Next \u2192" : "See my result \uD83C\uDF89");
          nb.addEventListener("click", () => { idx++; idx < total ? showQ() : showResult(); });
          fb.appendChild(document.createElement("br")); fb.appendChild(nb);
          q.appendChild(fb);
        });
        opts.appendChild(o);
      });
      q.appendChild(opts);
      card.appendChild(q);
    }

    function showResult() {
      const pctScore = Math.round(score / total * 100);
      const passed = score >= passMark;
      const m = recordAttempt(child, week.id, sub.key, { type: "quiz", score, total, pct: pctScore, passed });
      card.innerHTML = "";
      const r = el("div", "result " + (passed ? "pass" : "fail"));
      r.appendChild(el("div", "result-emoji", passed ? "\uD83C\uDFC6" : "\uD83D\uDCAA"));
      r.appendChild(el("h1", null, passed ? "Week achieved!" : "Good try \u2014 keep going!"));
      r.appendChild(el("div", "big-score", score + " / " + total + "  (" + pctScore + "%)"));
      // stars earned
      const starRow = el("div", "star-reward");
      starRow.appendChild(el("div", "star-reward-stars", starStr(m.stars)));
      starRow.appendChild(el("div", "muted", passed
        ? (pctScore === 100 ? "Perfect score \u2014 3 stars! \u2B50" : "You passed \u2014 stars earned!")
        : "You earned a star for trying. Learn & Train, then quiz again to reach the pass mark."));
      r.appendChild(starRow);
      const area = areaOf(sd, week.area);
      if (area && m.best) {
        const g = devAreaNow(loadProgress(child), sd, area);
        r.appendChild(el("p", "grow-callout", "\uD83D\uDCC8 " + area.label + ": now at " + g.now + "% (started at " + g.basePct + "%" + (g.growth > 0 ? ", +" + g.growth : "") + ")."));
      }
      const actions = el("div", "actions center");
      const again = el("button", "btn primary", "Try a new quiz \u21BB");
      again.addEventListener("click", () => renderQuiz(child, sub, week));
      const learn = el("button", "btn ghost", "Review the lesson");
      learn.addEventListener("click", () => renderLearn(child, sub, week));
      const home = el("button", "btn ghost", "Back to my subjects");
      home.addEventListener("click", () => renderChildHome(child));
      actions.append(again, learn, home);
      r.appendChild(actions);
      const wrong = answers.filter(a => !a.correct);
      if (wrong.length) {
        const rev = el("div", "review");
        rev.appendChild(el("h3", null, "Let's review these:"));
        wrong.forEach(w => {
          const it = el("div", "review-item");
          it.appendChild(el("div", "rq", w.q));
          it.appendChild(el("div", "ra", "Correct answer: " + w.right));
          if (w.explain) it.appendChild(el("div", "re", "\uD83D\uDCA1 " + w.explain));
          rev.appendChild(it);
        });
        r.appendChild(rev);
      }
      card.appendChild(r);
    }
    showQ();
  }

  /* ---------------- PROJECT -------------------------------------------- */
  function renderProject(child, sub, week) {
    const sd = CFG.children[child].subjects[sub.key];
    app.innerHTML = "";
    app.appendChild(header(week.title, "\u270F\uFE0F Writing task"));
    const c = el("div", "container narrow");
    c.appendChild(backBtn(child));
    const card = el("div", "card");
    const it = ENGINE.generate(week.generators, 1, Date.now() & 0xffffff)[0];
    card.appendChild(el("h1", null, "\u270F\uFE0F " + week.title));
    card.appendChild(el("p", "goal", "Targets: " + weekGoal(sd, week)));
    const prompt = el("div", "prompt-box");
    prompt.appendChild(el("div", "prompt-label", "Your writing prompt:"));
    prompt.appendChild(el("div", "prompt-text", it.q));
    const shuffle = el("button", "btn ghost small", "\uD83C\uDFB2 Give me a different prompt");
    shuffle.addEventListener("click", () => renderProject(child, sub, week));
    prompt.appendChild(shuffle);
    card.appendChild(prompt);

    const ta = el("textarea", "writing-area");
    ta.placeholder = "Write here\u2026 (your work stays on this device)";
    const draftKey = "flp_draft_" + child + "_" + week.id;
    ta.value = localStorage.getItem(draftKey) || "";
    const wc = el("div", "muted wordcount", countWords(ta.value) + " words");
    ta.addEventListener("input", () => { localStorage.setItem(draftKey, ta.value); wc.textContent = countWords(ta.value) + " words"; });
    card.appendChild(ta);
    card.appendChild(wc);

    const chk = el("div", "checklist");
    chk.appendChild(el("h3", null, "Before you finish, check your work:"));
    (it.checklist || []).forEach(item => {
      const row = el("label", "check-row");
      const cb = el("input"); cb.type = "checkbox";
      row.append(cb, el("span", null, item));
      chk.appendChild(row);
    });
    card.appendChild(chk);

    const done = el("button", "btn primary", "\u2713 I've finished & checked my work");
    done.addEventListener("click", () => {
      const m = recordAttempt(child, week.id, sub.key, { type: "project" });
      const ok = el("div", "feedback good");
      ok.textContent = "\uD83C\uDF89 Well done! " + starStr(m.stars) + " added. This task is marked done on your dashboard.";
      card.appendChild(ok);
      done.disabled = true;
    });
    card.appendChild(done);
    c.appendChild(card);
    app.appendChild(c);
  }
  function countWords(s) { const t = (s || "").trim(); return t ? t.split(/\s+/).length : 0; }

  /* ---------------- PARENT DASHBOARD ----------------------------------- */
  function renderParent() {
    app.innerHTML = "";
    app.appendChild(header(null, "Parent dashboard \u2014 growth for both boys"));
    const c = el("div", "container");
    c.appendChild(syncPanel({
      hint: "See your boys' latest scores below. If they used a different device, ask them to Export their progress and paste the code here, then press Import to pull it in.",
      onImport: () => renderParent()
    }));
    Object.keys(CFG.children).forEach(childKey => {
      const data = CFG.children[childKey];
      const progress = loadProgress(childKey);
      const card = el("div", "card parent-card");
      const head = el("div", "parent-head");
      head.appendChild(el("h2", null, "\uD83E\uDDD2 " + data.name));
      const ts = totalStars(childKey);
      head.appendChild(el("span", "stars-badge", starCount(ts.earned) + " " + ts.earned + " / " + ts.max + " stars"));
      head.appendChild(el("span", "muted", data.grade + " \u00B7 Learner " + data.learner));
      card.appendChild(head);
      card.appendChild(el("div", "muted last-active", "\uD83D\uDD52 Last activity: " + timeAgo(progressMeta(progress).lastActive)));

      const rr = el("div", "results-row");
      SUBJECTS.forEach(sub => {
        const sd = data.subjects[sub.key]; if (!sd) return;
        const chip = el("div", "result-chip " + sub.color);
        chip.appendChild(el("div", "rc-sub", sub.icon + " " + sub.label));
        chip.appendChild(el("div", "rc-score", sd.score + "/50"));
        chip.appendChild(el("div", "rc-level", sd.level));
        rr.appendChild(chip);
      });
      card.appendChild(rr);

      SUBJECTS.forEach(sub => {
        const sd = data.subjects[sub.key]; if (!sd) return;
        const weeksDone = sd.weeks.filter(w => { const mp = progress[w.id] || {}; return mp.passed || mp.projectDone; }).length;
        const sst = subjectStars(progress, sd);
        const sec = el("div", "parent-subject");
        const sh = el("div", "parent-subject-head");
        sh.appendChild(el("span", null, sub.icon + " " + sub.label));
        sh.appendChild(el("span", "muted", weeksDone + "/" + sd.weeks.length + " weeks \u00B7 " + sst.earned + "/" + sst.max + " \u2B50"));
        sec.appendChild(sh);

        // dev-area growth bars
        sd.devAreas.forEach(area => {
          const g = devAreaNow(progress, sd, area);
          const row = el("div", "grow-row small");
          const top = el("div", "grow-top");
          top.appendChild(el("span", "grow-label", area.label));
          top.appendChild(el("span", "grow-nums muted", "start " + g.basePct + "% \u2192 now " + g.now + "%" + (g.growth > 0 ? " (+" + g.growth + ")" : "")));
          row.appendChild(top);
          const track = el("div", "grow-track");
          const now = el("div", "grow-now" + (g.growth > 0 ? " up" : "")); now.style.width = g.now + "%"; track.appendChild(now);
          const marker = el("div", "grow-start-marker"); marker.style.left = g.basePct + "%"; track.appendChild(marker);
          row.appendChild(track);
          sec.appendChild(row);
        });
        // per-week detail table
        const rep = el("details", "week-report");
        rep.appendChild(el("summary", null, "Weekly detail \u2014 " + sub.label));
        rep.appendChild(weekReportTable(progress, sd));
        sec.appendChild(rep);
        card.appendChild(sec);
      });

      const reset = el("button", "btn ghost small", "Reset " + data.name + "'s progress");
      reset.addEventListener("click", () => { if (confirm("Clear all saved progress for " + data.name + "? This cannot be undone.")) { localStorage.removeItem(PKEY(childKey)); renderParent(); } });
      card.appendChild(reset);
      c.appendChild(card);
    });
    app.appendChild(c);
  }

  /* ---------------- boot ------------------------------------------------ */
  render();
})();
