/* ============================================================
   Find Your Program — triage flow (preview build)
   - No personal data captured during triage (client-side state only).
   - Only the application submit sends anything (Formspree email).
   - noindex + robots-disallowed + shared-secret gate for preview.
   ============================================================ */
(function () {
  'use strict';

  // ---- Preview access gate (shared secret in the URL) -------------------
  // Open with ?key=movewell to unlock; remembered in this browser.
  // Clear with ?key=off.  (GitHub Pages can't do true basic auth; this is
  // the static-hosting equivalent Jimmy can swap for a real secret.)
  var ACCESS_KEY = 'movewell';
  (function gate() {
    var params = new URLSearchParams(location.search);
    if (params.get('key') === 'off') localStorage.removeItem('mw_fyp');
    if (params.get('key') === ACCESS_KEY) localStorage.setItem('mw_fyp', 'on');
    var ok = localStorage.getItem('mw_fyp') === 'on';
    var gateEl = document.getElementById('fyp-gate');
    var appEl = document.getElementById('fyp-app');
    if (!gateEl || !appEl) return;
    gateEl.hidden = ok;
    appEl.hidden = !ok;
    window.__fypAuthorized = ok;
  })();
  if (!window.__fypAuthorized) return;

  // ---- Analytics --------------------------------------------------------
  function track(event, data) {
    var payload = Object.assign({ event: event }, data || {});
    if (window.dataLayer && window.dataLayer.push) window.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent('fyp:analytics', { detail: payload }));
    if (window.console) console.log('[fyp:analytics]', event, data || {});
  }

  // ---- Questions --------------------------------------------------------
  var QUESTIONS = {
    q1: {
      prompt: 'What brings you in?',
      options: [
        { label: 'A new injury or a recent flare-up', value: 'acute' },
        { label: 'Something that keeps coming back', value: 'recurring' },
        { label: "I'm recovering from surgery", value: 'postop' },
        { label: 'No injury, I want to get stronger or train better', value: 'performance' }
      ]
    },
    q2: {
      prompt: 'How long has this been going on?',
      options: [
        { label: 'Less than 6 weeks', value: 'under6' },
        { label: '6 weeks to 3 months', value: '6to12' },
        { label: 'More than 3 months', value: 'over3mo' }
      ]
    },
    q3: {
      prompt: 'In the last 12 months, have you had surgery, a fracture, or a tendon or ligament rupture related to this?',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ]
    },
    q4: {
      prompt: 'What are you trying to get back to?',
      options: [
        { label: 'Running or endurance training', value: 'endurance' },
        { label: 'Lifting or CrossFit', value: 'strength' },
        { label: 'A specific sport or event', value: 'sport' },
        { label: 'Everyday life without worrying about it', value: 'daily' }
      ]
    }
  };
  var ORDER = ['q1', 'q2', 'q3', 'q4'];

  function skips(key, answers) {
    // Q2 and Q3 are skipped for post-op and performance paths.
    return (key === 'q2' || key === 'q3') && (answers.q1 === 'postop' || answers.q1 === 'performance');
  }
  function nextQuestion(currentKey, answers) {
    var start = currentKey ? ORDER.indexOf(currentKey) + 1 : 0;
    for (var i = start; i < ORDER.length; i++) {
      if (!skips(ORDER[i], answers)) return ORDER[i];
    }
    return null; // no more questions -> result
  }
  function plannedTotal(answers) {
    return ORDER.filter(function (k) { return !skips(k, answers); }).length;
  }

  // ---- Routing (evaluate in order, stop at first match) -----------------
  function route(a) {
    if (a.q1 === 'performance') return 'OFF_RAMP';
    if (a.q1 === 'postop' || a.q3 === 'yes') return 'RETURN_TO_PERFORMANCE';
    if (a.q1 === 'recurring') return 'REBUILD';
    if (a.q1 === 'acute' && a.q2 === 'over3mo') return 'REBUILD';
    if (a.q1 === 'acute' && a.q2 === '6to12') return 'RESTORE_OR_REBUILD';
    if (a.q1 === 'acute' && a.q2 === 'under6') return 'RESTORE';
    return 'RESTORE';
  }

  // ---- Program data (name always before price in the UI) ----------------
  var FEAT_RESTORE = [
    'Eight weeks of progressive programming in the CoachRx app, updated as you adapt',
    'Direct messaging access to your provider between every visit',
    'Six one-on-one sessions across the eight weeks, front-loaded and tapering as your programming takes over',
    'Video demonstrations and coaching cues for each exercise',
    'Entry and exit testing on our VALD force plates, with a report card so you can see exactly how far you came'
  ];
  var FEAT_REBUILD = [
    'Twelve weeks of progressive programming in the CoachRx app, updated as you adapt',
    'Direct messaging access to your provider between every visit',
    'Ten one-on-one sessions across the twelve weeks, front-loaded and tapering as your programming takes over',
    'Video demonstrations and coaching cues for each exercise',
    'Entry, midpoint, and exit VALD testing, each with its own report card',
    'Criteria-based progression so you advance based on what the testing shows, not guesswork'
  ];
  var FEAT_RTP = [
    'Programming in the CoachRx app for the full length of your plan',
    'Direct messaging access and provider coordination throughout',
    'A 16-session minimum on a tapered cadence, weekly early and spreading out as you take over the work',
    'Regular VALD testing with a report card after every test, at a cadence set for your case',
    'Criteria-based return-to-sport clearance, decided on your data rather than the calendar'
  ];
  var DISCLAIMER = "This is a starting point based on what you've told us. Your assessment confirms the right scope, and we will tell you if something different fits better.";

  function featList(items) {
    return '<ul class="prog-feat">' + items.map(function (t) {
      return '<li><span class="prog-ck">&#10003;</span>' + t + '</li>';
    }).join('') + '</ul>';
  }
  function card(name, priceHtml, tagline, feats) {
    return '<div class="prog-card">' +
      '<h3 class="prog-name" style="font-size:26px;">' + name + '</h3>' +
      (tagline ? '<p class="prog-tagline">' + tagline + '</p>' : '') +
      '<div class="prog-scroll" style="overflow:visible;max-height:none;">' +
      featList(feats) +
      '</div>' +
      '<div class="prog-bottom"><span class="prog-price" style="float:none;font-size:30px;">' + priceHtml + '</span></div>' +
      '</div>';
  }

  // ---- Human labels (for prefill) ---------------------------------------
  var DURATION_LABEL = { under6: 'Less than 6 weeks', '6to12': '6 weeks to 3 months', over3mo: 'More than 3 months' };
  var GOAL_LABEL = { endurance: 'Running or endurance training', strength: 'Lifting or CrossFit', sport: 'A specific sport or event', daily: 'Everyday life without worrying about it' };
  var PROGRAM_LABEL = {
    RESTORE: 'Restore', REBUILD: 'Rebuild', RETURN_TO_PERFORMANCE: 'Return to Performance',
    RESTORE_OR_REBUILD: 'Restore or Rebuild (borderline)', OFF_RAMP: 'Off-ramp (training / online)'
  };

  // ---- State + persistence (session only; nothing personal) -------------
  var state = { screen: 'intro', qKey: null, answers: {}, result: null };
  function persist() { try { sessionStorage.setItem('mw_fyp_state', JSON.stringify(state)); } catch (e) {} }
  function restore() {
    try { var s = sessionStorage.getItem('mw_fyp_state'); if (s) state = JSON.parse(s); } catch (e) {}
  }

  // ---- Screen elements --------------------------------------------------
  var screens = {
    intro: document.getElementById('screen-intro'),
    triage: document.getElementById('screen-triage'),
    result: document.getElementById('screen-result'),
    application: document.getElementById('screen-application'),
    confirm: document.getElementById('screen-confirm')
  };
  function show(name) {
    Object.keys(screens).forEach(function (k) { if (screens[k]) screens[k].hidden = (k !== name); });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // ---- Renderers --------------------------------------------------------
  function paint() {
    if (state.screen === 'triage' && state.qKey) renderQuestion();
    else if (state.screen === 'result' && state.result) renderResult();
    else if (state.screen === 'application') prefillApplication();
    show(state.screen);
  }

  function renderQuestion() {
    var q = QUESTIONS[state.qKey];
    var idx = ORDER.filter(function (k, i) {
      return i <= ORDER.indexOf(state.qKey) && !skips(k, state.answers);
    }).length; // position in the asked sequence
    var total = plannedTotal(state.answers);
    document.getElementById('fyp-bar').style.width = Math.round((idx / total) * 100) + '%';
    document.getElementById('fyp-qnum').textContent = 'Question ' + idx + ' of ' + total;
    document.getElementById('fyp-question').textContent = q.prompt;
    var wrap = document.getElementById('fyp-options');
    wrap.innerHTML = '';
    q.options.forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fyp-option';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', state.answers[state.qKey] === opt.value ? 'true' : 'false');
      b.textContent = opt.label;
      b.addEventListener('click', function () { answer(opt.value); });
      wrap.appendChild(b);
    });
    document.getElementById('fyp-back').hidden = false;
  }

  function answer(value) {
    var key = state.qKey;
    state.answers[key] = value;
    var qNum = key.charAt(1);
    track('triage_q' + qNum + '_answered', { value: value });
    var nxt = nextQuestion(key, state.answers);
    if (nxt) { state.qKey = nxt; state.screen = 'triage'; }
    else {
      state.result = route(state.answers);
      state.screen = 'result';
      track('result_shown', { result: state.result });
    }
    advance();
  }

  function renderResult() {
    var el = screens.result;
    var r = state.result;
    var html = '<div class="fyp-result-head"><button type="button" class="fyp-back" id="fyp-result-back">&larr; Back</button></div>';

    if (r === 'RESTORE') {
      html += resultBlock('Restore looks like the right starting point.',
        '$1,695 · 6 one-on-one sessions · 8 weeks',
        'For a mostly healthy athlete dealing with a minor sprain or strain, or someone finishing the last stretch of a rehab they started elsewhere. Focused work to close the gap and get back to training at full capacity.',
        card('Restore', '$1,695', 'What runs the whole time', FEAT_RESTORE));
    } else if (r === 'REBUILD') {
      html += resultBlock('Rebuild looks like the right starting point.',
        '$2,695 · 10 one-on-one sessions · 12 weeks',
        'For anyone dealing with a recurring issue or coming back from something that took real capacity away. Twelve weeks to rebuild the strength and tissue tolerance to not just feel better, but genuinely trust your body under load again.',
        card('Rebuild', '$2,695', 'What runs the whole time', FEAT_REBUILD) +
        '<p class="fyp-result-desc" style="margin-top:12px;">Two-pay available (2 &times; $1,395).</p>');
    } else if (r === 'RETURN_TO_PERFORMANCE') {
      html += resultBlock('Return to Performance is the right path.',
        'From $4,295, custom-quoted at your assessment',
        'For the full return to sport, post-operative rehab, or anyone with a longer runway who wants to develop performance well beyond where they started. Scoped to your case at the assessment, with a defined horizon and clear exit criteria.',
        card('Return to Performance', '<span class="pre">from</span>$4,295', 'What runs the whole time', FEAT_RTP) +
        '<p class="fyp-result-desc" style="margin-top:12px;">Starts at 16 one-on-one sessions on a tapered cadence, with additional sessions available at $179 each as your plan needs them. Two-pay available (2 &times; $2,195).</p>');
    } else if (r === 'RESTORE_OR_REBUILD') {
      html += '<p class="fyp-eyebrow">Your recommendation</p>' +
        '<h2 class="fyp-result-name">You\'re between two programs.</h2>' +
        '<p class="fyp-result-price">Restore, $1,695 over 8 weeks, or Rebuild, $2,695 over 12 weeks.</p>' +
        '<p class="fyp-result-desc">Something that has been going on for a month or two can go either way. If the tissue is healing well and the capacity underneath is intact, eight weeks is enough. If the testing shows the capacity was never really there, twelve weeks is the honest answer. Your assessment is where we find out, and we will tell you which one before you commit to anything.</p>' +
        '<div class="fyp-result-cards two">' +
        card('Restore', '$1,695', '8 weeks · 6 sessions', FEAT_RESTORE) +
        card('Rebuild', '$2,695', '12 weeks · 10 sessions', FEAT_REBUILD) +
        '</div>' +
        '<p class="fyp-disclaimer">' + DISCLAIMER + '</p>' +
        '<div class="fyp-result-cta"><button type="button" class="btn-electric" id="fyp-to-apply">Apply and book your assessment</button></div>';
      el.innerHTML = html;
      wireResultButtons();
      return;
    } else if (r === 'OFF_RAMP') {
      html += '<p class="fyp-eyebrow">Where you fit</p>' +
        '<h2 class="fyp-result-name">You\'re not looking for rehab, you\'re looking for training.</h2>' +
        '<p class="fyp-result-desc">Our performance training runs in blocks of sessions rather than as a fixed-length program, because capacity work does not have a finish line. We also run online strength and conditioning for people who want the plan without the drive.</p>' +
        '<div class="fyp-offramp-actions">' +
        '<a class="btn-electric" href="../performance-training.html">Talk to us about training</a>' +
        '<a class="btn-ghost" href="../online-programming.html">See online coaching</a>' +
        '</div>';
      el.innerHTML = html;
      wireResultButtons();
      return;
    }

    el.innerHTML = html;
    wireResultButtons();
  }

  function resultBlock(name, price, desc, cardsHtml) {
    return '<p class="fyp-eyebrow">Your recommendation</p>' +
      '<h2 class="fyp-result-name">' + name + '</h2>' +
      '<p class="fyp-result-price">' + price + '</p>' +
      '<p class="fyp-result-desc">' + desc + '</p>' +
      '<div class="fyp-result-cards">' + cardsHtml + '</div>' +
      '<p class="fyp-disclaimer">' + DISCLAIMER + '</p>' +
      '<div class="fyp-result-cta"><button type="button" class="btn-electric" id="fyp-to-apply">Apply and book your assessment</button></div>';
  }

  function wireResultButtons() {
    var back = document.getElementById('fyp-result-back');
    if (back) back.addEventListener('click', function () { history.back(); });
    var apply = document.getElementById('fyp-to-apply');
    if (apply) apply.addEventListener('click', function () {
      state.screen = 'application';
      track('application_started', { result: state.result });
      advance();
    });
  }

  // ---- Application prefill ----------------------------------------------
  function prefillApplication() {
    var a = state.answers;
    document.getElementById('fyp-apply-eyebrow').textContent =
      state.result === 'RESTORE_OR_REBUILD' ? 'Restore or Rebuild — confirmed at your assessment' :
      'Your recommended program: ' + PROGRAM_LABEL[state.result];
    var dur = document.getElementById('fyp-duration');
    if (!dur.value) dur.value = DURATION_LABEL[a.q2] || '';
    var goal = document.getElementById('fyp-goal');
    if (!goal.value) goal.value = GOAL_LABEL[a.q4] || '';
    document.getElementById('fyp-hidden-program').value = PROGRAM_LABEL[state.result] || state.result;
    document.getElementById('fyp-hidden-answers').value = JSON.stringify(a);
    document.getElementById('fyp-hidden-borderline').value = (state.result === 'RESTORE_OR_REBUILD') ? 'true' : 'false';
    document.getElementById('fyp-hidden-subject').value =
      'New program application — ' + (PROGRAM_LABEL[state.result] || state.result);
  }

  // ---- Navigation with history (browser back = one step) ----------------
  function advance() {
    persist();
    history.pushState(clone(state), '');
    paint();
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.screen) { state = e.state; persist(); paint(); }
  });

  // ---- Wire the static bits ---------------------------------------------
  document.getElementById('fyp-start').addEventListener('click', function () {
    state = { screen: 'triage', qKey: nextQuestion(null, {}), answers: {}, result: null };
    track('triage_started', {});
    advance();
  });
  document.getElementById('fyp-back').addEventListener('click', function () { history.back(); });
  document.getElementById('fyp-apply-back').addEventListener('click', function () { history.back(); });

  // prior-care conditional field
  document.querySelectorAll('input[name="prior_care"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var detail = document.getElementById('fyp-prior-detail');
      detail.hidden = (this.value !== 'yes');
      if (this.value === 'yes') detail.setAttribute('required', 'required'); else detail.removeAttribute('required');
    });
  });

  // ---- Submit -----------------------------------------------------------
  var form = document.getElementById('fyp-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('fyp-submit');
    btn.disabled = true; btn.textContent = 'Sending…';
    track('application_submitted', { result: state.result });
    var data = new FormData(form);
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (res.ok) {
          var name = (document.getElementById('fyp-name').value || '').trim().split(' ')[0];
          document.getElementById('fyp-confirm-title').textContent =
            name ? 'Thanks ' + name + ', we\'ve got your application.' : 'Thanks, we\'ve got your application.';
          state.screen = 'confirm';
          sessionStorage.removeItem('mw_fyp_state');
          history.pushState(clone(state), '');
          paint();
        } else {
          throw new Error('submit failed');
        }
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Submit application';
        alert('Something went wrong. Please try again or email us at info@movewellsportsmed.com');
      });
  });

  // ---- Abandonment ------------------------------------------------------
  window.addEventListener('pagehide', function () {
    if (state.screen === 'triage') track('triage_abandoned', { last_question: state.qKey });
    else if (state.screen === 'result') track('triage_abandoned', { last_question: 'result:' + state.result });
  });

  // ---- Boot: restore prior state so refresh keeps you in place ----------
  restore();
  if (state.screen && state.screen !== 'intro') {
    history.replaceState(clone(state), '');
    paint();
  } else {
    state = { screen: 'intro', qKey: null, answers: {}, result: null };
    history.replaceState(clone(state), '');
    show('intro');
  }
})();
