const searchIndex = [
  {
    title: "Home",
    url: "index.html",
    description: "Welcome to Movewell. In Pursuit of Lifelong Performance. Sports Medicine and Performance in Chicago.",
    keywords: ["home", "movewell", "performance", "chicago", "sports medicine", "physical therapy"]
  },
  {
    title: "About Us",
    url: "about.html",
    description: "Meet the team at Movewell. We are physical therapists and performance coaches dedicated to your success.",
    keywords: ["about", "team", "staff", "who we are", "jimmy", "matt", "background", "philosophy"]
  },
  {
    title: "Services",
    url: "services.html",
    description: "Explore our services: Physical Therapy, Performance Training, Online Rehab Coaching, and more.",
    keywords: ["services", "physical therapy", "rehab", "performance training", "online coaching", "programming", "booking", "pricing", "cost"]
  },
  {
    title: "FAQ",
    url: "faq.html",
    description: "Frequently Asked Questions. Learn about cash-based physical therapy, insurance, HSA/FSA, and appointments.",
    keywords: ["faq", "questions", "insurance", "cost", "cash-based", "hsa", "fsa", "booking", "appointments", "cancellation", "what to expect"]
  },
  {
    title: "Get Started",
    url: "contact.html",
    description: "Ready to move better? Fill out our form to get in touch and start your journey.",
    keywords: ["contact", "apply", "get started", "book", "email", "phone", "schedule", "reach out"]
  },
  {
    title: "Education",
    url: "education.html",
    description: "The Movewell Guides: practical write-ups on running, training, and movement.",
    keywords: ["education", "guides", "running", "training", "series", "learn", "articles", "resources"]
  },
  {
    title: "The Types of Runs",
    url: "education/run-types.html",
    description: "Why easy, threshold, and hard runs each exist, and how much of each belongs in your week.",
    keywords: ["running", "run types", "easy run", "tempo", "threshold", "intervals", "long run", "fartlek", "strides", "hills", "guide"]
  },
  {
    title: "Gauging Intensity",
    url: "education/run-intensity.html",
    description: "Effort, pace, and heart rate, and why pace lies to you on a hot day.",
    keywords: ["running", "intensity", "effort", "rpe", "heart rate", "pace", "talk test", "zones", "guide"]
  },
  {
    title: "Building the Base",
    url: "education/run-base.html",
    description: "Volume, frequency, and the 80/20 split that makes your hard days actually hard.",
    keywords: ["running", "base", "volume", "mileage", "frequency", "80/20", "consistency", "base building", "guide"]
  },
  {
    title: "The Long Run",
    url: "education/run-long-run.html",
    description: "The anchor of a marathon week: what it trains, how long, how fast, and how to fuel it.",
    keywords: ["running", "long run", "marathon", "fueling", "fatigue resistance", "endurance", "guide"]
  }
];

function openSearch() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('search-input').focus(), 100);
  }
}

function closeSearch() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
  }
}

function performSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';
  
  if (!query.trim()) return;

  const lowerQuery = query.toLowerCase();
  
  const results = searchIndex.filter(page => {
    const titleMatch = page.title.toLowerCase().includes(lowerQuery);
    const descMatch = page.description.toLowerCase().includes(lowerQuery);
    const keywordMatch = page.keywords.some(kw => kw.toLowerCase().includes(lowerQuery));
    return titleMatch || descMatch || keywordMatch;
  });

  if (results.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results">No results found for "' + query + '"</div>';
    return;
  }

  results.forEach(res => {
    const a = document.createElement('a');
    a.href = res.url;
    a.className = 'search-result-item';
    a.innerHTML = `
      <div class="search-result-title">${res.title}</div>
      <div class="search-result-desc">${res.description}</div>
    `;
    a.onclick = () => closeSearch();
    resultsContainer.appendChild(a);
  });
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('search-modal');
  if (modal && modal.classList.contains('active')) {
    if (e.target === modal) {
      closeSearch();
    }
  }
});

// Escape key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSearch();
  }
});
