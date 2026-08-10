// Movewell — bridge Find Your Program funnel events into GA4.
// The GA4 base tag (gtag.js loader + config) is inlined in each page <head> so
// it's detectable in the raw HTML. This file only forwards the site's
// `fyp:analytics` window events to gtag as custom events, so any new track()
// call in find-your-program.js shows up in GA automatically.
(function () {
  window.addEventListener('fyp:analytics', function (e) {
    var d = (e && e.detail) || {};
    var name = d.event;
    if (!name || typeof window.gtag !== 'function') return;
    var params = {};
    for (var k in d) {
      if (k === 'event' || !Object.prototype.hasOwnProperty.call(d, k)) continue;
      // GA4 reserves the `value` parameter for numeric revenue; triage answers
      // are strings, so remap them to `answer`.
      params[k === 'value' ? 'answer' : k] = d[k];
    }
    window.gtag('event', name, params);
  });
})();
