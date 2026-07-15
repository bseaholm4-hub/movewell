/* ============================================================
   MoveWell triage — orientation, not a commitment.
   Every non-emergency path ends at the in-person assessment.
   Prototype; wording is meant to be redlined.

   INTERNAL NOTE: the two safety screens below are a distilled,
   patient-facing stand-in for the full clinical red-flag
   differential. They are intentionally short. The real screen
   is the in-person Performance & Injury Assessment.
   ============================================================ */
(function () {
  var root = document.getElementById('triage');
  if (!root) return;

  var LINK_ASSESS = 'contact.html';
  var LINK_ONLINE = 'pricing/online-rehab-coaching.html';
  var LINK_CONTACT = 'contact.html';

  var TIER_A = [
    'New loss of bladder or bowel control, or numbness around the groin or saddle area',
    'Chest pain, or pain into the jaw or left arm, with sweating or shortness of breath',
    'A sudden ‘worst-ever’ headache, face drooping, slurred speech, or one-sided weakness',
    'A joint that is hot, red, badly swollen and can’t bear weight, especially with a fever or chills',
    'Calf pain with swelling, warmth, or redness, especially after surgery, a cast, or a long flight'
  ];
  var TIER_B = [
    'A recent significant injury where you think something may be broken',
    'Unexplained weight loss, or fevers, chills, or night sweats',
    'Night pain that is constant and isn’t eased by changing position',
    'A history of cancer, or pain that doesn’t change at all with movement or rest',
    'No improvement after about four to six weeks of appropriate care'
  ];

  var answers = {};
  var history = [];
  var current = null;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function go(fn) { if (current) history.push(current); current = fn; fn(); scrollIntoView(); }
  function back() { if (history.length) { current = history.pop(); current(); scrollIntoView(); } }
  function restart() { answers = {}; history = []; current = stepStart; stepStart(); scrollIntoView(); }
  function scrollIntoView() {
    var y = root.getBoundingClientRect().top + window.pageYOffset - 90;
    if (window.pageYOffset > y || window.pageYOffset < y - 400) window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function shell(inner, opts) {
    opts = opts || {};
    root.innerHTML =
      '<div class="tri' + (opts.urgent ? ' urgent' : '') + '">' +
        '<div class="tri-head">' +
          '<span class="tri-eyebrow">' + (opts.eyebrow || 'Find your starting point') + '</span>' +
          (opts.progress ? '<span class="tri-progress">' + opts.progress + '</span>' : '') +
        '</div>' + inner +
      '</div>';
  }

  function optionsHTML(opts) {
    return '<div class="tri-opts">' + opts.map(function (o, i) {
      return '<button class="tri-opt" data-i="' + i + '"><span class="t">' + esc(o.t) + '</span>' +
        (o.s ? '<span class="s">' + esc(o.s) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function bindOptions(opts) {
    root.querySelectorAll('.tri-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var o = opts[+btn.getAttribute('data-i')];
        if (o.set) answers[o.set[0]] = o.set[1];
        o.next();
      });
    });
  }

  function navHTML() {
    return '<div class="tri-nav"><button class="tri-back"' + (history.length ? '' : ' hidden') + '>&larr; Back</button></div>';
  }
  function bindNav() {
    var b = root.querySelector('.tri-back');
    if (b) b.addEventListener('click', back);
  }

  /* ---------- Steps ---------- */
  function stepStart() {
    shell(
      '<p class="tri-q">Not sure which program fits? Let’s point you in the right direction.</p>' +
      '<p class="tri-help">A few quick questions to orient you. This is not a diagnosis and it doesn’t sign you up for anything, it just gives you a sense of what could be right. Every path starts with an in-person assessment where we confirm it together. Takes about a minute.</p>' +
      '<div class="tri-btnrow"><button class="tri-btn primary" id="tri-begin">Begin</button></div>'
    );
    root.querySelector('#tri-begin').addEventListener('click', function () { go(stepSafetyA); });
  }

  function safetyScreen(list, label, onNone, onYes) {
    shell(
      '<p class="tri-q">A quick safety check first.</p>' +
      '<p class="tri-help">Are you experiencing any of the following right now?</p>' +
      '<ul class="tri-safety">' + list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="tri-btnrow">' +
        '<button class="tri-btn ghost" id="tri-none">None of these</button>' +
        '<button class="tri-btn primary" id="tri-yes">Yes, one or more</button>' +
      '</div>' + navHTML(),
      { eyebrow: 'Safety check', progress: label }
    );
    root.querySelector('#tri-none').addEventListener('click', onNone);
    root.querySelector('#tri-yes').addEventListener('click', onYes);
    bindNav();
  }

  function stepSafetyA() {
    safetyScreen(TIER_A, 'Step 1 of 2',
      function () { go(stepSafetyB); },
      function () { go(function () { resultEmergency(); }); });
  }
  function stepSafetyB() {
    safetyScreen(TIER_B, 'Step 2 of 2',
      function () { go(stepP1); },
      function () { go(function () { resultDoctor(); }); });
  }

  function choiceStep(cfg) {
    return function () {
      shell(
        '<p class="tri-q">' + esc(cfg.q) + '</p>' +
        (cfg.help ? '<p class="tri-help">' + esc(cfg.help) + '</p>' : '') +
        optionsHTML(cfg.opts) + navHTML(),
        { progress: cfg.progress }
      );
      bindOptions(cfg.opts);
      bindNav();
    };
  }

  var stepP1 = choiceStep({
    q: 'What best describes your situation?',
    progress: 'Question 1 of 4',
    opts: [
      { t: 'A recent injury or flare-up', s: 'A sprain, strain, or tweak in the last few weeks', set: ['p1', 'acute'], next: function () { go(stepP2); } },
      { t: 'Something that keeps coming back, or has lingered for months', s: 'A recurring or long-standing issue', set: ['p1', 'chronic'], next: function () { go(stepP2); } },
      { t: 'Recovering from surgery, or surgery is part of the picture', s: 'Post-op, or a planned procedure', set: ['p1', 'surgery'], next: function () { go(stepP2); } },
      { t: 'I’ve done rehab already and want to close the last gap', s: 'Mostly back, but not all the way there', set: ['p1', 'finishing'], next: function () { go(stepP2); } },
      { t: 'I’m not really injured, I want to train for performance', s: 'No specific injury to work around', set: ['p1', 'performance'], next: function () { go(function () { resultTraining(); }); } }
    ]
  });

  var stepP2 = choiceStep({
    q: 'What are you mainly trying to get back to?',
    progress: 'Question 2 of 4',
    opts: [
      { t: 'Everyday life and general training', s: 'Feeling and moving well day to day', set: ['p2', 'everyday'], next: function () { go(stepTimeline); } },
      { t: 'A specific sport or competition', s: 'Getting back on the field, court, or start line', set: ['p2', 'sport'], next: function () { go(stepTimeline); } },
      { t: 'A specific exercise or activity I’m chasing', s: 'A lift, a run, a movement you want back', set: ['p2', 'exercise'], next: function () { go(stepTimeline); } },
      { t: 'Post-surgical recovery and return to sport', s: 'The full road back after an operation', set: ['p2', 'postsurg'], next: function () { go(stepTimeline); } }
    ]
  });

  var stepTimeline = choiceStep({
    q: 'Are you working toward a deadline?',
    progress: 'Question 3 of 4',
    opts: [
      { t: 'Yes, and it’s soon', s: 'An event or date a few weeks out', set: ['tl', 'weeks'], next: function () { go(stepAccess); } },
      { t: 'Yes, but it’s a way off', s: 'Months down the road', set: ['tl', 'months'], next: function () { go(stepAccess); } },
      { t: 'No specific deadline', s: 'I just want to get this right', set: ['tl', 'none'], next: function () { go(stepAccess); } }
    ]
  });

  var stepAccess = choiceStep({
    q: 'How would you like to work with us?',
    help: 'Our programs are an in-person and online hybrid, based in Chicago. We also coach fully online.',
    progress: 'Question 4 of 4',
    opts: [
      { t: 'In-person and online hybrid', s: 'I’m in the Chicago area and can come in', set: ['access', 'inperson'], next: function () { go(function () { resultProgram(); }); } },
      { t: 'Fully online', s: 'I’m not local, or I’d rather work remotely', set: ['access', 'online'], next: function () { go(function () { resultProgram(); }); } }
    ]
  });

  /* ---------- Scoring ---------- */
  function computeProgram() {
    var s = { restore: 0, build: 0, r2p: 0 };
    switch (answers.p1) {
      case 'acute': s.restore += 2; break;
      case 'chronic': s.build += 2; break;
      case 'surgery': s.r2p += 3; break;
      case 'finishing': s.restore += 2; break;
    }
    switch (answers.p2) {
      case 'everyday': s.restore += 1; s.build += 1; break;
      case 'sport': s.r2p += 2; break;
      case 'exercise': s.r2p += 2; break;
      case 'postsurg': s.r2p += 3; break;
    }
    if (answers.tl === 'weeks') s.restore += 1;
    else if (answers.tl === 'months') s.build += 1;
    else s.build += 1;
    // pick max; tie-break r2p > build > restore
    var order = ['r2p', 'build', 'restore'];
    var best = order[0];
    order.forEach(function (k) { if (s[k] > s[best]) best = k; });
    // guard: r2p only wins with a genuine signal (it only earns points from real signals, so this holds)
    return best;
  }

  /* ---------- Results ---------- */
  var DISCLAIMER = 'This is a starting point, not a diagnosis or a commitment. Every path begins with an in-person Performance &amp; Injury Assessment, where we confirm the right fit together. Nothing is locked in until then.';

  function resultShell(opts) {
    var cta = (opts.cta || []).map(function (c) {
      return '<a class="tri-btn ' + (c.kind || 'primary') + '" href="' + c.href + '">' + esc(c.label) + '</a>';
    }).join('');
    shell(
      '<p class="tri-rhead' + (opts.urgent ? ' urgent' : '') + '">' + opts.head + '</p>' +
      '<p class="tri-rwhy">' + opts.why + '</p>' +
      (opts.soft ? '<div class="tri-soft">' + opts.soft + '</div>' : '') +
      (opts.disclaimer ? '<p class="tri-disclaimer">' + opts.disclaimer + '</p>' : '') +
      '<div class="tri-cta">' + cta + '<button class="tri-startover">Start over</button></div>',
      { eyebrow: opts.eyebrow || 'Your starting point', urgent: opts.urgent }
    );
    root.querySelector('.tri-startover').addEventListener('click', restart);
  }

  function resultProgram() {
    var prog = computeProgram();
    var online = answers.access === 'online';

    if (online) {
      resultShell({
        head: 'Online Rehab Coaching looks like your starting point',
        why: 'Most rehab happens in a clinic for an hour and treats getting out of pain as the finish line, when for a lot of people that is really where the work starts. Getting out of pain matters, but on its own it is closer to a quarter of what it takes to actually be better and stay that way. The rest is the capacity you rebuild underneath it, and most of that gets built in the days between your sessions. Online Rehab Coaching is built around exactly that part, with a plan that keeps progressing as you do, real accountability between check-ins, and a direct line to a Doctor of Physical Therapy when something flares up.',
        soft: 'Getting out of pain is a quarter of the picture. Rebuilt capacity, built between sessions, is the rest.',
        disclaimer: 'This is a starting point, not a diagnosis or a commitment. Online coaching begins with a video consultation where we confirm it’s the right fit for you.',
        cta: [{ label: 'Explore Online Rehab Coaching', href: LINK_ONLINE }, { label: 'Get in touch', href: LINK_CONTACT, kind: 'ghost' }]
      });
      return;
    }

    var copy = {
      restore: {
        head: 'Restore looks like your starting point',
        why: 'What you’ve described sounds acute and fairly contained, the kind of thing a focused, front-loaded block is built to close out and get you back to full capacity.'
      },
      build: {
        head: 'Rebuild looks like your starting point',
        why: 'Something recurring, or that took real capacity away, usually needs genuine rebuilding rather than just calming down. That is exactly what Rebuild is for, with the testing to prove the capacity is actually there this time.'
      },
      r2p: {
        head: 'Return to Performance looks like your starting point',
        why: 'A post-surgical or return-to-sport goal means a longer, custom horizon with objective, criteria-based clearance. That’s our premium, custom-scoped path, and it’s built for exactly this.'
      }
    }[prog];

    resultShell({
      head: copy.head,
      why: copy.why,
      disclaimer: DISCLAIMER,
      cta: [{ label: 'Book your assessment', href: LINK_ASSESS }]
    });
  }

  function resultTraining() {
    resultShell({
      eyebrow: 'Your starting point',
      head: 'This sounds like training, not rehab',
      why: 'With no specific injury to work around, our Performance Training is likely the better home for what you’re after, ongoing capacity work rather than a rehab plan. Tell us what you’re chasing and we’ll map it out.',
      disclaimer: 'Still worth a conversation so we point you at the right block, nothing here is a commitment.',
      cta: [{ label: 'Get in touch', href: LINK_CONTACT }]
    });
  }

  function resultDoctor() {
    resultShell({
      eyebrow: 'A quick heads-up',
      head: 'Let’s have a physician take a look first',
      why: 'Based on your answers, we’d want a doctor to weigh in before starting a rehab program, just to be safe. Reach out and we’ll help you figure out the right next step, and we’ll be here when you’re cleared to go.',
      cta: [{ label: 'Get in touch', href: LINK_CONTACT }]
    });
  }

  function resultEmergency() {
    resultShell({
      urgent: true,
      eyebrow: 'Please seek care now',
      head: 'This needs urgent medical attention',
      why: 'A couple of your answers point to something that shouldn’t wait. Please call 911 or head to the nearest emergency room now. This is more urgent than a rehab program, and we’ll be here when you’re ready.'
    });
  }

  restart();
})();
