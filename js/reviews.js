// Google Reviews — pulls the latest reviews from Google (new Places API) and
// renders them into the existing testimonial cards (exact same styling). Falls
// back to the static cards already in the HTML if it can't find/load reviews,
// so the section is never empty.
(function () {
  // ── CONFIG ───────────────────────────────────────────────────────────────
  // Maps JavaScript API key (referrer-restricted to the movewell domain).
  var API_KEY = 'AIzaSyBlVKo0Z1wgFTxY7wDsVJi3CpIoAtRLHCc';
  // Once we know the Place ID, paste it here to skip discovery (cheaper + faster).
  var PLACE_ID = '';
  var PLACE_QUERY = 'Movewell Sports Medicine and Performance, Chicago';
  var GEO = { lat: 41.8966, lng: -87.6366 };
  var MAX_REVIEWS = 5;
  // ─────────────────────────────────────────────────────────────────────────

  if (!API_KEY) return;

  // Normal visitors make no API calls until we've hardcoded a PLACE_ID. To check
  // whether Google has indexed the listing yet, load the page with
  // "?reviews=discover" — that runs the lookup and logs the Place ID if found.
  var DISCOVER = new URLSearchParams(location.search).get('reviews') === 'discover';
  if (!PLACE_ID && !DISCOVER) return;

  window.__initGoogleReviews = async function () {
    try {
      var placesLib = await google.maps.importLibrary('places');
      var Place = placesLib.Place;

      var placeId = PLACE_ID;

      // Discovery (only when no hardcoded ID): find the listing by name, then
      // fall back to a location search at the address.
      if (!placeId) {
        var byName = await Place.searchByText({
          textQuery: PLACE_QUERY,
          fields: ['id', 'displayName'],
          maxResultCount: 5,
          locationBias: { center: GEO, radius: 8000 }
        });
        console.log('[MW] name matches:', byName && byName.places ? byName.places.map(function (p) { return { name: p.displayName, id: p.id }; }) : byName);
        if (byName && byName.places && byName.places.length) {
          placeId = byName.places[0].id;
        }
      }

      // 2) Fall back to a location search right at the address.
      if (!placeId) {
        var near = await Place.searchNearby({
          fields: ['id', 'displayName'],
          locationRestriction: { center: GEO, radius: 250 },
          maxResultCount: 20
        });
        var mw = (near && near.places ? near.places : []).filter(function (p) {
          return (p.displayName || '').toLowerCase().indexOf('movewell') !== -1;
        })[0];
        if (mw) placeId = mw.id;
      }

      console.log('[MW] using placeId:', placeId);
      if (!placeId) { console.log('[MW] listing not findable yet'); return; }

      var place = new Place({ id: placeId });
      await place.fetchFields({ fields: ['reviews', 'rating', 'userRatingCount'] });
      console.log('[MW] reviews:', place.reviews);
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

  var s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(API_KEY) +
          '&libraries=places&callback=__initGoogleReviews&loading=async&v=weekly';
  s.async = true;
  document.head.appendChild(s);
})();
