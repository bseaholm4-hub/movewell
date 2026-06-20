// Google Reviews — pulls the latest reviews from Google (new Places API) and
// renders them into the existing testimonial cards (exact same styling). Falls
// back to the static cards already in the HTML if it's not configured yet or the
// request fails, so the section is never empty.
//
// STATUS: waiting on a valid PLACE_ID. Movewell's Google Business Profile isn't
// currently in Google's Places index (confirmed — it doesn't appear in name or
// location search), so reviews can't be pulled yet. Once the Google Business
// Profile is verified/published and findable, drop its Place ID into PLACE_ID
// below and this turns on automatically (a single, cheap Place Details call).
(function () {
  // ── CONFIG ───────────────────────────────────────────────────────────────
  // Maps JavaScript API key. Client-side Maps keys are public by design — the
  // protection is the HTTP-referrer restriction set on the key in Google Cloud.
  var API_KEY = 'AIzaSyBlVKo0Z1wgFTxY7wDsVJi3CpIoAtRLHCc';
  var PLACE_ID = '';   // <-- paste the Google Place ID here once the profile is live
  var MAX_REVIEWS = 5;
  // ─────────────────────────────────────────────────────────────────────────

  // No key or no Place ID yet → leave the static cards in place (and make no
  // billable API calls).
  if (!API_KEY || !PLACE_ID) return;

  window.__initGoogleReviews = async function () {
    try {
      var placesLib = await google.maps.importLibrary('places');
      var Place = placesLib.Place;
      var place = new Place({ id: PLACE_ID });
      await place.fetchFields({ fields: ['reviews', 'rating', 'userRatingCount'] });
      if (place.reviews && place.reviews.length) {
        renderReviews(place.reviews);
      }
    } catch (e) {
      console.warn('Google reviews could not load:', e);
    }
  };

  function star(filled) {
    return '<svg viewBox="0 0 24 24" fill="' + (filled ? '#111' : '#d9d9d9') + '">' +
      '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function renderReviews(reviews) {
    var track = document.getElementById('testimonials');
    if (!track) return;

    var sorted = reviews.slice().sort(function (a, b) {
      var ta = a.publishTime ? a.publishTime.getTime() : 0;
      var tb = b.publishTime ? b.publishTime.getTime() : 0;
      return tb - ta;
    }).slice(0, MAX_REVIEWS);
    if (!sorted.length) return;

    track.innerHTML = sorted.map(function (r) {
      var name = (r.authorAttribution && r.authorAttribution.displayName) || 'Google user';
      var date = r.relativePublishTimeDescription || '';
      var text = r.text || '';
      var rating = Math.round(r.rating || 5);
      var stars = '';
      for (var i = 1; i <= 5; i++) stars += star(i <= rating);
      return '' +
        '<div class="testimonial-card">' +
          '<div class="review-top">' +
            '<div><span class="review-author">' + esc(name) + '</span></div>' +
            '<span class="review-date">' + esc(date) + '</span>' +
          '</div>' +
          '<div class="review-stars">' + stars + '</div>' +
          '<div class="review-body">' + esc(text) + '</div>' +
          '<div class="review-tag">Google Review</div>' +
        '</div>';
    }).join('');
  }

  // Load the Maps JS API, then init via the callback.
  var s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(API_KEY) +
          '&libraries=places&callback=__initGoogleReviews&loading=async&v=weekly';
  s.async = true;
  document.head.appendChild(s);
})();
