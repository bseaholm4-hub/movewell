// Slow down hero video for cinematic feel
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) heroVideo.playbackRate = 0.7;

// Nav scroll state
const navEl = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navEl.classList.add('scrolled');
  } else {
    navEl.classList.remove('scrolled');
  }
});

// Interactive map — River North, Chicago
if (document.getElementById('map')) {
  const map = L.map('map', {
    center: [41.8925, -87.6310],
    zoom: 15,
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
  L.marker([41.8925, -87.6310], { icon: pin }).addTo(map)
    .bindPopup('<strong style="font-family:DM Sans,sans-serif;font-size:13px;color:#194e6e;">Movewell</strong><br><span style="font-family:DM Sans,sans-serif;font-size:12px;color:#777;">River North, Chicago</span>');
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
