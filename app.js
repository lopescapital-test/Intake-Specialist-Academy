/* ============================================================
   NeuroSage Hub — Clinical Foundations
   Vanilla JS. No build step. Progress persists in-session only
   (module completion held in memory; survives view changes, not reload).
   ============================================================ */
(function () {
  "use strict";

  var COURSE = window.COURSE || { modules: [] };
  var modules = COURSE.modules;
  var completed = {};      // { moduleNumber: true }
  var quizState = {};      // { moduleNumber: { answered:{qi:letter}, correct:n } }

  var checkSVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5 L6.5 12 L13 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------- element refs ----------
  var pathway   = document.getElementById("pathway");
  var moduleGrid= document.getElementById("moduleGrid");
  var viewHome  = document.getElementById("view-home");
  var viewMod   = document.getElementById("view-module");
  var reader    = document.getElementById("reader");
  var quizEl    = document.getElementById("quiz");
  var moduleNav = document.getElementById("moduleNav");
  var progressNum = document.getElementById("progressNum");
  var main      = document.getElementById("main");
  var rail      = document.getElementById("rail");
  var railToggle= document.getElementById("railToggle");

  document.getElementById("homeCount").textContent = modules.length;
  document.getElementById("homeQCount").textContent =
    modules.reduce(function (s, m) { return s + m.questions.length; }, 0);
  var progressDen = document.querySelector(".progress-den");
  if (progressDen) progressDen.textContent = "/ " + modules.length + " modules complete";

  // ============================================================
  //  BUILD SIDEBAR PATHWAY
  // ============================================================
  function buildPathway() {
    pathway.innerHTML = "";
    modules.forEach(function (m) {
      var btn = document.createElement("button");
      btn.className = "path-item";
      btn.type = "button";
      btn.dataset.mod = m.number;
      btn.setAttribute("aria-label", "Module " + m.number + ": " + m.title);
      btn.innerHTML =
        '<span class="path-node">' + (completed[m.number] ? checkSVG : m.number) + '</span>' +
        '<span class="path-label">' +
          '<span class="pl-kicker">Module ' + m.number + '</span>' +
          '<span class="pl-title">' + escapeHTML(m.title) + '</span>' +
        '</span>';
      btn.addEventListener("click", function () { openModule(m.number); closeRail(); });
      pathway.appendChild(btn);
    });
  }

  // ============================================================
  //  BUILD HOME GRID
  // ============================================================
  function buildGrid() {
    moduleGrid.innerHTML = "";
    modules.forEach(function (m) {
      var card = document.createElement("button");
      card.className = "mod-card" + (completed[m.number] ? " done" : "");
      card.type = "button";
      card.dataset.mod = m.number;
      card.innerHTML =
        '<span class="mod-card-check">' + checkSVG + '</span>' +
        '<span class="mod-card-num">Module ' + m.number + '</span>' +
        '<h3 class="mod-card-title">' + escapeHTML(m.title) + '</h3>' +
        '<p class="mod-card-sub">' + escapeHTML(m.subtitle) + '</p>';
      card.addEventListener("click", function () { openModule(m.number); });
      moduleGrid.appendChild(card);
    });
  }

  // ============================================================
  //  OPEN A MODULE
  // ============================================================
  function openModule(num) {
    var m = modules.find(function (x) { return x.number === num; });
    if (!m) return;

    // reader
    reader.innerHTML =
      '<p class="reader-eyebrow">Module ' + m.number + ' of ' + modules.length + '</p>' +
      '<h1 class="reader-title">' + escapeHTML(m.title) + '</h1>' +
      '<p class="reader-sub">' + escapeHTML(m.subtitle) + '</p>' +
      m.html;

    buildQuiz(m);
    buildModuleNav(m);
    markActive(num);

    viewHome.hidden = true;
    viewMod.hidden = false;
    location.hash = "module-" + num;

    main.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
    setupReveal();
  }

  function goHome() {
    viewMod.hidden = true;
    viewHome.hidden = false;
    markActive(null);
    location.hash = "";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // ============================================================
  //  QUIZ
  // ============================================================
  function buildQuiz(m) {
    var qs = m.questions;
    if (!qs || !qs.length) { quizEl.innerHTML = ""; return; }

    if (!quizState[m.number]) quizState[m.number] = { answered: {}, correct: 0 };
    var state = quizState[m.number];

    var html =
      '<div class="quiz-head"><span class="quiz-eyebrow">Knowledge check</span></div>' +
      '<h2 class="quiz-title">Module ' + m.number + ' — check yourself</h2>' +
      '<p class="quiz-intro">' + qs.length + ' questions. Pick an answer to see whether it lands. ' +
        'Get them all to mark the module complete.</p>';

    qs.forEach(function (q, qi) {
      html += '<div class="q" data-qi="' + qi + '">' +
        '<div class="q-stem"><span class="q-num">' + (qi + 1) + '</span>' +
        '<span class="q-text">' + escapeHTML(q.stem) + '</span></div>';
      q.options.forEach(function (o) {
        html += '<button class="opt" type="button" data-letter="' + o.letter + '">' +
          '<span class="opt-letter">' + o.letter + '</span>' +
          '<span class="opt-text">' + escapeHTML(o.text) + '</span></button>';
      });
      html += '<p class="q-feedback"></p></div>';
    });

    html += '<div class="quiz-result" id="quizResult-' + m.number + '"></div>';
    quizEl.innerHTML = html;

    // wire options
    Array.prototype.forEach.call(quizEl.querySelectorAll(".q"), function (qDiv) {
      var qi = parseInt(qDiv.dataset.qi, 10);
      var q = qs[qi];
      qDiv.querySelectorAll(".opt").forEach(function (optBtn) {
        optBtn.addEventListener("click", function () {
          if (state.answered[qi]) return; // lock after first answer
          var chosen = optBtn.dataset.letter;
          state.answered[qi] = chosen;
          var fb = qDiv.querySelector(".q-feedback");

          // lock & mark all options
          qDiv.querySelectorAll(".opt").forEach(function (b) {
            b.disabled = true;
            if (b.dataset.letter === q.answer) b.classList.add("correct");
            if (b === optBtn && chosen !== q.answer) b.classList.add("wrong");
          });

          if (chosen === q.answer) {
            state.correct++;
            fb.textContent = "✓ Correct.";
            fb.className = "q-feedback show ok";
          } else {
            fb.textContent = "Not quite — the correct answer is " + q.answer + ".";
            fb.className = "q-feedback show no";
          }
          maybeFinishQuiz(m);
        });
      });
    });

    // restore prior answers if revisiting
    Object.keys(state.answered).forEach(function (qi) {
      var qDiv = quizEl.querySelector('.q[data-qi="' + qi + '"]');
      if (!qDiv) return;
      var q = qs[qi];
      var chosen = state.answered[qi];
      var fb = qDiv.querySelector(".q-feedback");
      qDiv.querySelectorAll(".opt").forEach(function (b) {
        b.disabled = true;
        if (b.dataset.letter === q.answer) b.classList.add("correct");
        if (b.dataset.letter === chosen && chosen !== q.answer) b.classList.add("wrong");
      });
      if (chosen === q.answer) { fb.textContent = "✓ Correct."; fb.className = "q-feedback show ok"; }
      else { fb.textContent = "Not quite — the correct answer is " + q.answer + "."; fb.className = "q-feedback show no"; }
    });
    maybeFinishQuiz(m, true);
  }

  function maybeFinishQuiz(m, silent) {
    var qs = m.questions;
    var state = quizState[m.number];
    var answeredCount = Object.keys(state.answered).length;
    if (answeredCount < qs.length) return;

    // count correct fresh (in case of restore)
    var correct = 0;
    qs.forEach(function (q, qi) { if (state.answered[qi] === q.answer) correct++; });

    var box = document.getElementById("quizResult-" + m.number);
    if (box) {
      var pct = Math.round((correct / qs.length) * 100);
      box.innerHTML =
        '<div class="qr-score">' + correct + " / " + qs.length + " correct · " + pct + "%</div>" +
        '<div class="qr-msg">' + resultMsg(pct) + "</div>";
      box.classList.add("show");
    }
    if (!completed[m.number]) {
      completed[m.number] = true;
      refreshProgress();
    }
  }

  function resultMsg(pct) {
    if (pct === 100) return "Full marks. This module is locked in.";
    if (pct >= 80) return "Strong. Skim the ones you missed and you're set.";
    if (pct >= 50) return "Worth a re-read before you move on — the misses matter on a call.";
    return "Take another pass through the module, then retry the check.";
  }

  // ============================================================
  //  MODULE FOOTER NAV
  // ============================================================
  function buildModuleNav(m) {
    var prev = modules.find(function (x) { return x.number === m.number - 1; });
    var next = modules.find(function (x) { return x.number === m.number + 1; });

    var html = "";
    if (prev) {
      html += '<button class="nav-btn prev" type="button" data-mod="' + prev.number + '">' +
        '<div class="nav-dir">← Module ' + prev.number + '</div>' +
        '<div class="nav-ttl">' + escapeHTML(prev.title) + '</div></button>';
    } else {
      html += '<button class="nav-btn prev" type="button" data-home="1">' +
        '<div class="nav-dir">← Overview</div>' +
        '<div class="nav-ttl">All modules</div></button>';
    }
    if (next) {
      html += '<button class="nav-btn next" type="button" data-mod="' + next.number + '">' +
        '<div class="nav-dir">Module ' + next.number + ' →</div>' +
        '<div class="nav-ttl">' + escapeHTML(next.title) + '</div></button>';
    } else {
      html += '<button class="nav-btn next" type="button" data-home="1">' +
        '<div class="nav-dir">Finish →</div>' +
        '<div class="nav-ttl">Back to overview</div></button>';
    }
    moduleNav.innerHTML = html;
    moduleNav.querySelectorAll(".nav-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.home) goHome();
        else openModule(parseInt(b.dataset.mod, 10));
      });
    });
  }

  // ============================================================
  //  PROGRESS + STATE
  // ============================================================
  function refreshProgress() {
    var n = Object.keys(completed).length;
    progressNum.textContent = n;
    // update sidebar nodes
    pathway.querySelectorAll(".path-item").forEach(function (item) {
      var num = parseInt(item.dataset.mod, 10);
      var node = item.querySelector(".path-node");
      if (completed[num]) {
        item.classList.add("done");
        node.innerHTML = checkSVG;
      } else {
        item.classList.remove("done");
        node.textContent = num;
      }
    });
    // update grid cards
    moduleGrid.querySelectorAll(".mod-card").forEach(function (card) {
      var num = parseInt(card.dataset.mod, 10);
      card.classList.toggle("done", !!completed[num]);
    });
  }

  function markActive(num) {
    pathway.querySelectorAll(".path-item").forEach(function (item) {
      item.classList.toggle("active", parseInt(item.dataset.mod, 10) === num);
    });
  }

  // ============================================================
  //  REVEAL ON SCROLL
  // ============================================================
  function setupReveal() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var targets = reader.querySelectorAll(".callout, .table-wrap, h3");
    if (!("IntersectionObserver" in window)) { targets.forEach(function (t){ t.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { t.classList.add("reveal"); io.observe(t); });
  }

  // ============================================================
  //  HELPERS + WIRING
  // ============================================================
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function openRail() { rail.classList.add("open"); railToggle.setAttribute("aria-expanded", "true"); }
  function closeRail() { rail.classList.remove("open"); railToggle.setAttribute("aria-expanded", "false"); }

  railToggle.addEventListener("click", function () {
    if (rail.classList.contains("open")) closeRail(); else openRail();
  });

  document.getElementById("startBtn").addEventListener("click", function () { openModule(1); });

  document.getElementById("resetBtn").addEventListener("click", function () {
    completed = {}; quizState = {};
    refreshProgress();
    buildGrid();
    goHome();
  });

  // deep-link support
  function fromHash() {
    var m = /module-(\d+)/.exec(location.hash);
    if (m) openModule(parseInt(m[1], 10));
    else goHome();
  }

  // ---------- init ----------
  buildPathway();
  buildGrid();
  refreshProgress();
  fromHash();
  window.addEventListener("hashchange", fromHash);
})();
