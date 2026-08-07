/* ============================================================
   Find Your Program — triage flow (preview build)
   - No personal data captured during triage (client-side state only).
   - Only the application submit sends anything (Formspree email).
   - noindex + robots-disallowed + shared-secret gate for preview.
   ============================================================ */
(function () {
  'use strict';

  // ---- Preview access gate (shared secret in the URL) -------------------
  var ACCESS_KEY = 'movewell';
  (function gate() {
    var params = new URLSearchParams(location.search);
    if (params.get('key') === 'off') localStorage.removeItem('mw_fyp');
    if (params.get('key') === ACCESS_KEY) localStorage.setItem('mw_fyp', 'on');
    var gateEl = document.getElementById('fyp-gate');
    var appEl = document.getElementById('fyp-app');
    if (!appEl) return;
    // The public page has no gate element, so it is open to everyone.
    // The private preview keeps its gate and still needs the shared key.
    var ok = !gateEl || localStorage.getItem('mw_fyp') === 'on';
    if (gateEl) gateEl.hidden = ok;
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
        { label: 'No injury, I want to get stronger, train better, or have guidance in my corner', value: 'performance' }
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
      prompt: 'What are you working toward?',
      options: [
        { label: 'Everyday life without worrying about it', value: 'daily' },
        { label: 'General fitness and exercise-related hobbies', value: 'fitness' },
        { label: 'Running or endurance training', value: 'endurance' },
        { label: 'Lifting or higher-level fitness', value: 'strength' },
        { label: 'A specific sport or event', value: 'sport' }
      ]
    }
  };
  var ORDER = ['q1', 'q2', 'q3', 'q4'];

  function skips(key, answers) {
    return (key === 'q2' || key === 'q3') && (answers.q1 === 'postop' || answers.q1 === 'performance');
  }
  function nextQuestion(currentKey, answers) {
    var start = currentKey ? ORDER.indexOf(currentKey) + 1 : 0;
    for (var i = start; i < ORDER.length; i++) {
      if (!skips(ORDER[i], answers)) return ORDER[i];
    }
    return null;
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

  // ---- Program data -----------------------------------------------------
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

  var PROGRAMS = {
    RESTORE: { name: 'Restore', price: '$1,695', meta: '8 weeks &middot; 6 sessions', tagline: 'For Acute and Minor Injuries', feats: FEAT_RESTORE },
    REBUILD: { name: 'Rebuild', price: '$2,695', meta: '12 weeks &middot; 10 sessions', tagline: 'For Serious and Recurring Injuries', feats: FEAT_REBUILD },
    RTP: { name: 'Return to Performance', price: '<span class="pre">from</span>$4,295', meta: 'Custom-Scoped', tagline: 'Post-Op and Long-Horizon Return to Sport', feats: FEAT_RTP }
  };
  var STAGE_ORDER = ['RESTORE', 'REBUILD', 'RTP'];

  function featList(items) {
    return '<ul class="prog-feat">' + items.map(function (t) {
      return '<li><span class="prog-ck">&#10003;</span>' + t + '</li>';
    }).join('') + '</ul>';
  }

  // The stage: all three programs in a line; the recommended one(s) pop
  // forward, the others sit back but stay visible.
  function stageHtml(featured) {
    return '<div class="fyp-stage">' + STAGE_ORDER.map(function (k) {
      var p = PROGRAMS[k];
      var isF = featured.indexOf(k) !== -1;
      return '<div class="prog-card fyp-stage-card ' + (isF ? 'is-featured' : 'is-muted') + '">' +
        (isF ? '<span class="fyp-rec-tag">Recommended</span>' : '') +
        '<h3 class="prog-name" style="font-size:24px;">' + p.name + '</h3>' +
        '<p class="prog-tagline">' + p.tagline + '</p>' +
        '<p class="prog-duration">' + p.meta + '</p>' +
        '<div class="prog-scroll" style="overflow:visible;max-height:none;">' + featList(p.feats) + '</div>' +
        '<div class="prog-bottom"><span class="prog-price" style="float:none;font-size:28px;">' + p.price + '</span></div>' +
        '</div>';
    }).join('') + '</div>';
  }

  // ---- Human labels (for prefill) ---------------------------------------
  var DURATION_LABEL = { under6: 'Less than 6 weeks', '6to12': '6 weeks to 3 months', over3mo: 'More than 3 months' };
  var GOAL_LABEL = {
    daily: 'Everyday life without worrying about it',
    fitness: 'General fitness and exercise-related hobbies',
    endurance: 'Running or endurance training',
    strength: 'Lifting or higher-level fitness',
    sport: 'A specific sport or event'
  };
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
    }).length;
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
    track('triage_q' + key.charAt(1) + '_answered', { value: value });
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
    var topbar = '<div class="fyp-result-topbar"><button type="button" class="fyp-back" id="fyp-result-back">&larr; Back</button></div>';

    if (r === 'OFF_RAMP') {
      el.innerHTML = topbar + '<div class="fyp-result-wrap">' +
        '<p class="fyp-eyebrow">Where you fit</p>' +
        '<h2 class="fyp-result-name">You\'re not looking for rehab. Here\'s where you fit.</h2>' +
        '<p class="fyp-result-desc">You\'re healthy and want to keep building. Here are the ways we work with people who aren\'t coming back from an injury.</p>' +
        '<div class="fyp-paths">' +
          '<a class="fyp-path" href="/training.html"><h3>Performance Training</h3><p>Coached strength and conditioning, in person, online, or a hybrid of both.</p><span class="go">See training</span></a>' +
          '<a class="fyp-path" href="/in-your-corner.html"><h3>In Your Corner</h3><p>In a race build or a big training block? A physical therapist keeping you healthy the whole way through.</p><span class="go">See In Your Corner</span></a>' +
        '</div>' +
        '</div>';
      wireResultButtons();
      return;
    }

    var featured, name, desc;
    if (r === 'RESTORE') {
      featured = ['RESTORE'];
      name = 'Restore looks like the right starting point.';
      desc = 'For a mostly healthy athlete dealing with a minor sprain or strain, or someone finishing the last stretch of a rehab they started elsewhere. Focused work to close the gap and get back to training at full capacity.';
    } else if (r === 'REBUILD') {
      featured = ['REBUILD'];
      name = 'Rebuild looks like the right starting point.';
      desc = 'For anyone dealing with a recurring issue or coming back from something that took real capacity away. Twelve weeks to rebuild the strength and tissue tolerance to not just feel better, but genuinely trust your body under load again.';
    } else if (r === 'RETURN_TO_PERFORMANCE') {
      featured = ['RTP'];
      name = 'Return to Performance is the right path.';
      desc = 'For the full return to sport, post-operative rehab, or anyone with a longer runway who wants to develop performance well beyond where they started. Scoped to your case at the assessment, with a defined horizon and clear exit criteria.';
    } else { // RESTORE_OR_REBUILD
      featured = ['RESTORE', 'REBUILD'];
      name = "You're between two programs.";
      desc = 'Something that has been going on for a month or two can go either way. If the tissue is healing well and the capacity underneath is intact, eight weeks is enough. If the testing shows the capacity was never really there, twelve weeks is the honest answer. Your assessment is where we find out, and we will tell you which one before you commit to anything.';
    }

    var priceStr = featured.map(function (k) { return PROGRAMS[k].price; }).join(' or ');
    el.innerHTML = topbar + '<div class="fyp-result-wrap">' +
      '<p class="fyp-eyebrow">Your recommendation</p>' +
      '<h2 class="fyp-result-name">' + name + '</h2>' +
      '<p class="fyp-result-desc">' + desc + '</p>' +
      stageHtml(featured) +
      '<p class="fyp-disclaimer">' + DISCLAIMER + '</p>' +
      '<div class="fyp-result-cta"><span class="fyp-rec-price">' + priceStr + '</span><button type="button" class="btn-electric" id="fyp-to-apply">Get started</button></div>' +
      '</div>';
    wireResultButtons();
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

  // Build a plain-English triage summary for the application email.
  function readableTriage(a) {
    function lbl(qKey, val) {
      var opts = QUESTIONS[qKey].options;
      for (var i = 0; i < opts.length; i++) if (opts[i].value === val) return opts[i].label;
      return val;
    }
    var parts = [];
    if (a.q1) parts.push('What brings you in: ' + lbl('q1', a.q1));
    if (a.q2) parts.push('How long: ' + lbl('q2', a.q2));
    if (a.q3) parts.push('Recent surgery, fracture, or rupture: ' + (a.q3 === 'yes' ? 'Yes' : 'No'));
    if (a.q4) parts.push('Working toward: ' + lbl('q4', a.q4));
    return parts.join('  |  ');
  }

  // ---- Application prefill ----------------------------------------------
  function prefillApplication() {
    var a = state.answers;
    document.getElementById('fyp-apply-eyebrow').textContent =
      state.result === 'RESTORE_OR_REBUILD' ? 'Restore or Rebuild, confirmed at your assessment' :
      'Your recommended program: ' + PROGRAM_LABEL[state.result];
    var dur = document.getElementById('fyp-duration');
    if (!dur.value) dur.value = DURATION_LABEL[a.q2] || '';
    var goal = document.getElementById('fyp-goal');
    if (!goal.value) goal.value = GOAL_LABEL[a.q4] || '';
    document.getElementById('fyp-hidden-program').value = PROGRAM_LABEL[state.result] || state.result;
    document.getElementById('fyp-hidden-answers').value = readableTriage(a);
    document.getElementById('fyp-hidden-borderline').value = (state.result === 'RESTORE_OR_REBUILD') ? 'true' : 'false';
    document.getElementById('fyp-hidden-subject').value =
      'New program inquiry: ' + (PROGRAM_LABEL[state.result] || state.result);
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
            name ? 'Thanks ' + name + ', we\'ve got your details.' : 'Thanks, we\'ve got your details.';
          state.screen = 'confirm';
          sessionStorage.removeItem('mw_fyp_state');
          history.pushState(clone(state), '');
          paint();
        } else { throw new Error('submit failed'); }
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Send my details';
        alert('Something went wrong. Please try again or email us at info@movewellsportsmed.com');
      });
  });

  // ---- Abandonment ------------------------------------------------------
  window.addEventListener('pagehide', function () {
    if (state.screen === 'triage') track('triage_abandoned', { last_question: state.qKey });
    else if (state.screen === 'result') track('triage_abandoned', { last_question: 'result:' + state.result });
  });

  // ---- Boot -------------------------------------------------------------
  // Always start fresh at the intro on a new page load, so returning to this
  // page (e.g. from "Learn more about Physical Therapy") restarts the flow
  // rather than dropping you back on the result you left on.
  function bootFresh() {
    try { sessionStorage.removeItem('mw_fyp_state'); } catch (e) {}
    state = { screen: 'intro', qKey: null, answers: {}, result: null };
    history.replaceState(clone(state), '');
    show('intro');
  }
  bootFresh();
  // Also reset when the page is served from the back/forward (bfcache) cache.
  window.addEventListener('pageshow', function (e) { if (e.persisted) bootFresh(); });
})();
