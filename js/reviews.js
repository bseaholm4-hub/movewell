// Google Reviews — pulls the latest reviews from Google and renders them into
// the existing testimonial cards (exact same styling). Falls back to the static
// cards already in the HTML if the API key isn't set yet or the request fails,
// so the section is never empty.
(function () {
  // ── CONFIG ───────────────────────────────────────────────────────────────
  // Maps JavaScript API key. Client-side Maps keys are public by design — the
  // protection is the HTTP-referrer restriction you set on the key in Google
  // Cloud (limit it to movewellsportsmed.com / www.movewellsportsmed.com).
  var API_KEY = '';   // <-- paste your Google Maps API key here
  // Optional: paste the Place ID to skip the name lookup (faster + cheaper).
  var PLACE_ID = '';
  var PLACE_QUERY = 'Movewell Sports Medicine and Performance, 820 N Orleans St, Chicago, IL';
  var MAX_REVIEWS = 5;
  // ─────────────────────────────────────────────────────────────────────────

  if (!API_KEY) return; // No key yet → leave the static cards in place.

  window.__initGoogleReviews = function () {
    var svc = new google.maps.places.PlacesService(document.createElement('div'));
    var fields = ['reviews', 'rating', 'user_ratings_total'];

    function getDetails(placeId) {
      svc.getDetails({ placeId: placeId, fields: fields }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.reviews) {
          renderReviews(place.reviews);
        }
      });
    }

    if (PLACE_ID) {
      getDetails(PLACE_ID);
    } else {
      svc.findPlaceFromQuery({ query: PLACE_QUERY, fields: ['place_id'] }, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          getDetails(results[0].place_id);
        }
      });
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
      return (b.time || 0) - (a.time || 0);
    }).slice(0, MAX_REVIEWS);
    if (!sorted.length) return;

    track.innerHTML = sorted.map(function (r) {
      var rating = Math.round(r.rating || 5);
      var stars = '';
      for (var i = 1; i <= 5; i++) stars += star(i <= rating);
      return '' +
        '<div class="testimonial-card">' +
          '<div class="review-top">' +
            '<div><span class="review-author">' + esc(r.author_name) + '</span></div>' +
            '<span class="review-date">' + esc(r.relative_time_description) + '</span>' +
          '</div>' +
          '<div class="review-stars">' + stars + '</div>' +
          '<div class="review-body">' + esc(r.text) + '</div>' +
          '<div class="review-tag">Google Review</div>' +
        '</div>';
    }).join('');
  }

  // Load the Maps JS API (Places library), then init via the callback.
  var s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(API_KEY) +
          '&libraries=places&callback=__initGoogleReviews&loading=async';
  s.async = true;
  document.head.appendChild(s);
})();
