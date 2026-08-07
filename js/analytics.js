// Movewell site analytics — Google Analytics 4 (gtag.js)
// Loaded in <head> on every page. Bootstraps GA4 and forwards the Find Your
// Program funnel events (dispatched as `fyp:analytics` window events by
// find-your-program.js) into GA4 as custom events. Nothing else needs editing:
// adding a new track() call there automatically shows up in GA.
(function () {
  var GA_ID = 'G-6ZLCWLWRGH';

  // Standard gtag bootstrap.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  // Load the gtag library asynchronously.
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  // Forward Find Your Program funnel events into GA4. The event detail is
  // { event: '<name>', ...params }. GA4 reserves the `value` parameter for
  // numeric revenue, so triage answers (strings) are remapped to `answer`.
  window.addEventListener('fyp:analytics', function (e) {
    var d = (e && e.detail) || {};
    var name = d.event;
    if (!name || typeof gtag !== 'function') return;
    var params = {};
    for (var k in d) {
      if (k === 'event' || !Object.prototype.hasOwnProperty.call(d, k)) continue;
      params[k === 'value' ? 'answer' : k] = d[k];
    }
    gtag('event', name, params);
  });
})();
