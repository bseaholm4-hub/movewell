// Slow down hero video for cinematic feel
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) heroVideo.playbackRate = 0.7;

// Nav scroll state
const navEl = document.querySelector('nav');
const hasHero = document.querySelector('.hero');

// Mobile nav dropdown — wrap the nav links and add a hamburger toggle.
// Done in JS so every page (incl. nested /pricing pages) gets it without
// touching their markup.
const navLeft = document.querySelector('.nav-left');
if (navLeft && !navLeft.querySelector('.nav-toggle')) {
  const links = document.createElement('div');
  links.className = 'nav-links';
  while (navLeft.firstChild) links.appendChild(navLeft.firstChild);

  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span></span><span></span><span></span>';

  navLeft.appendChild(toggle);
  navLeft.appendChild(links);

  const setOpen = (open) => {
    navLeft.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!navLeft.classList.contains('open'));
  });
  // Close when tapping outside the menu
  document.addEventListener('click', (e) => {
    if (!navLeft.contains(e.target)) setOpen(false);
  });
}

// Stack the "Get Started" pill onto two lines (mobile shows the break via CSS).
// Keep the .ko span so the see-through/knockout letter styling still applies.
const navPill = document.querySelector('.nav-pill');
if (navPill && navPill.textContent.trim() === 'Get Started') {
  navPill.innerHTML = '<span class="ko">Get <br class="pill-break">Started</span>';
}

// Private "Education" tab — only appears on browsers where it's been enabled,
// so the public never sees it while it's being built out.
//   Enable:  visit any page with ?edu=on   (remembered in this browser)
//   Disable: visit any page with ?edu=off
(function () {
  const p = new URLSearchParams(location.search);
  if (p.get('edu') === 'on') localStorage.setItem('mw_edu', 'on');
  if (p.get('edu') === 'off') localStorage.removeItem('mw_edu');
  if (localStorage.getItem('mw_edu') !== 'on') return;
  const linksContainer = document.querySelector('.nav-links') || document.querySelector('.nav-left');
  if (!linksContainer || linksContainer.querySelector('.nav-edu')) return;
  const inPricing = location.pathname.indexOf('/pricing/') !== -1;
  const edu = document.createElement('a');
  edu.href = inPricing ? '../education.html' : 'education.html';
  edu.textContent = 'Education';
  edu.className = 'nav-edu';
  linksContainer.appendChild(edu);
})();

// Private "Programs" tab — same gating as Education.
//   Enable:  visit any page with ?programs=on   (remembered in this browser)
//   Disable: visit any page with ?programs=off
(function () {
  const p = new URLSearchParams(location.search);
  if (p.get('programs') === 'on') localStorage.setItem('mw_programs', 'on');
  if (p.get('programs') === 'off') localStorage.removeItem('mw_programs');
  if (localStorage.getItem('mw_programs') !== 'on') return;
  const linksContainer = document.querySelector('.nav-links') || document.querySelector('.nav-left');
  if (!linksContainer || linksContainer.querySelector('.nav-programs')) return;
  const inPricing = location.pathname.indexOf('/pricing/') !== -1;
  const prog = document.createElement('a');
  prog.href = inPricing ? '../programs.html' : 'programs.html';
  prog.textContent = 'Programs';
  prog.className = 'nav-programs';
  linksContainer.appendChild(prog);
})();

// On subpages without a full hero, start nav in scrolled (dark) state
if (!hasHero) {
  navEl.classList.add('scrolled');
}

window.addEventListener('scroll', () => {
  if (!hasHero || window.scrollY > 60) {
    navEl.classList.add('scrolled');
  } else {
    navEl.classList.remove('scrolled');
  }
});

// Interactive map — 820 N Orleans St, Suite 100, Chicago, IL 60610
if (document.getElementById('map')) {
  const movewellLatLng = [41.8966, -87.6366];
  const map = L.map('map', {
    center: movewellLatLng,
    zoom: 16,
    scrollWheelZoom: false
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  }).addTo(map);

  const pin = L.divIcon({
    className: '',
    html: '<div style="width:32px;height:32px;background:#194e6e;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><div style="width:12px;height:12px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
  L.marker(movewellLatLng, { icon: pin }).addTo(map)
    .bindPopup('<strong style="font-family:DM Sans,sans-serif;font-size:13px;color:#194e6e;">Movewell</strong><br><span style="font-family:DM Sans,sans-serif;font-size:12px;color:#777;">820 N Orleans St, Suite 100<br>Chicago, IL 60610</span>')
    .openPopup();
}

// Testimonial carousel scroll
function scrollTestimonials(dir) {
  const track = document.getElementById('testimonials');
  const card = track.querySelector('.testimonial-card');
  const scrollAmt = card.offsetWidth + 16;
  track.scrollBy({ left: dir * scrollAmt, behavior: 'smooth' });
}

// Drag to scroll testimonials
const track = document.getElementById('testimonials');
if (track) {
  let isDown = false, startX, scrollLeft;

  track.addEventListener('mousedown', e => {
    isDown = true;
    track.classList.add('grabbing');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  track.addEventListener('mouseleave', () => { isDown = false; track.classList.remove('grabbing'); });
  track.addEventListener('mouseup', () => { isDown = false; track.classList.remove('grabbing'); });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
}
