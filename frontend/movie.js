document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const movieTitle = urlParams.get('title') || 'Inception';

  const backBtn = document.getElementById('back-btn');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const errorMessage = document.getElementById('error-message');
  const detailsContent = document.getElementById('details-content');

  const heroBg = document.getElementById('hero-bg');
  const metadataPills = document.getElementById('metadata-pills');
  const titleEl = document.getElementById('movie-title');
  const overviewEl = document.getElementById('movie-overview');

  const aiMoodDesc = document.getElementById('ai-mood-description');
  const aiMoodTags = document.getElementById('ai-mood-tags');

  const directorEl = document.getElementById('movie-director');
  const castList = document.getElementById('movie-cast');

  const recommendCtaSubtext = document.getElementById('recommend-cta-subtext');
  const recommendCtaBtn = document.getElementById('recommend-cta-btn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (document.referrer && document.referrer.includes('discover.html')) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://vanta-ai-movie-recommendation-system-1.onrender.com';

  fetchMovieDetails(movieTitle);

  async function fetchMovieDetails(title) {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    detailsContent.classList.add('hidden');

    try {
      const response = await fetch(`${API_BASE}/movie/details?title=${encodeURIComponent(title)}`);
      const payload = await response.json();

      if (!response.ok || !payload.found) {
        throw new Error(payload.message || `Film "${title}" was not found in the VANTA library.`);
      }

      renderPage(payload);
    } catch (err) {
      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
      errorMessage.textContent = err.message.includes('Failed to fetch')
        ? 'Could not connect to backend API.'
        : err.message;
    }
  }

  function renderPage(movie) {
    document.title = `${movie.title} — VANTA`;

    // Hero background
    const bgUrl = movie.backdrop_url || movie.poster_url;
    if (bgUrl) {
      heroBg.style.backgroundImage = `url("${bgUrl}")`;
    } else {
      heroBg.style.background = 'linear-gradient(135deg, #1e1f24 0%, #0d0e12 100%)';
    }

    // Title & Overview
    titleEl.textContent = movie.title.toUpperCase();
    overviewEl.textContent = movie.overview || 'An extraordinary cinematic piece exploring deep narrative and visual themes.';

    // Watch Trailer YouTube link
    const trailerBtn = document.getElementById('trailer-btn');
    if (trailerBtn) {
      const query = `${movie.title} ${movie.year || ''} official trailer`;
      trailerBtn.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    }

    // Metadata Pills
    metadataPills.replaceChildren();
    
    (movie.genres || []).forEach(g => {
      const span = document.createElement('span');
      span.className = 'bg-primary/10 text-primary font-label text-xs px-3 py-1 rounded-full border border-primary/20 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-primary/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]';
      span.textContent = g;
      metadataPills.appendChild(span);
    });

    if (movie.rating) {
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'flex items-center gap-1 text-secondary bg-white/5 border border-white/10 px-3 py-1 rounded transition-all duration-300 hover:scale-105 hover:bg-white/10';
      ratingDiv.innerHTML = `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">star</span><span class="font-label text-xs font-bold text-on-surface">${movie.rating}</span>`;
      metadataPills.appendChild(ratingDiv);
    }

    if (movie.year) {
      const yearDiv = document.createElement('div');
      yearDiv.className = 'bg-white/5 border border-white/10 px-3 py-1 rounded text-on-surface-variant font-label text-xs';
      yearDiv.textContent = movie.year;
      metadataPills.appendChild(yearDiv);
    }

    if (movie.runtime) {
      const runtimeDiv = document.createElement('div');
      runtimeDiv.className = 'bg-white/5 border border-white/10 px-3 py-1 rounded text-on-surface-variant font-label text-xs';
      runtimeDiv.textContent = movie.runtime;
      metadataPills.appendChild(runtimeDiv);
    }

    // AI Mood & Tone Analysis
    const moodSummaries = [
      `Dominant themes include deep psychological tension and atmospheric lighting. Pacing is deliberate, building immersion through soundscape and cinematography.`,
      `Resonates with existential mystery, surreal imagery, and character-driven gravity. Ideal for viewers seeking thoughtful narrative depth.`,
      `Blends high-concept world-building with intense emotional resonance and striking visual architecture.`
    ];
    aiMoodDesc.textContent = moodSummaries[Math.abs(movie.title.length) % moodSummaries.length];

    aiMoodTags.replaceChildren();
    const defaultTags = ['Atmospheric', 'Cerebral', 'Visually Stunning', 'Pacing: Deliberate'];
    defaultTags.forEach(tag => {
      const tSpan = document.createElement('span');
      tSpan.className = 'bg-surface-container text-on-surface-variant font-label text-[11px] px-2.5 py-1 rounded-full border border-white/5';
      tSpan.textContent = tag;
      aiMoodTags.appendChild(tSpan);
    });

    // Director & Cast
    directorEl.textContent = movie.directors || 'Not Credited';

    castList.replaceChildren();
    if (movie.cast && movie.cast.length > 0) {
      movie.cast.forEach(actor => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between border-b border-white/5 pb-2 text-sm';
        li.innerHTML = `<span class="text-on-surface font-medium">${actor}</span><span class="text-on-surface-variant text-xs font-label">Principal</span>`;
        castList.appendChild(li);
      });
    } else {
      castList.innerHTML = `<li class="text-on-surface-variant text-xs">Cast details unavailable</li>`;
    }

    // Bottom Aesthetic Recommendation CTA
    recommendCtaSubtext.textContent = `Follow the atmosphere, tone, and cinematic resonance of "${movie.title}" into 10 curated recommendations.`;
    recommendCtaBtn.href = `discover.html?movie=${encodeURIComponent(movie.title)}`;

    // Watchlist Toggle Logic
    const watchlistBtn = document.getElementById('watchlist-btn');
    if (watchlistBtn) {
      updateWatchlistBtnState(movie, watchlistBtn);

      watchlistBtn.onclick = () => {
        watchlistBtn.style.transform = 'scale(0.95)';
        setTimeout(() => watchlistBtn.style.transform = 'scale(1)', 150);

        let list = [];
        try {
          list = JSON.parse(localStorage.getItem('vanta_watchlist')) || [];
        } catch {
          list = [];
        }

        const existingIdx = list.findIndex(item => item.title.toLowerCase() === movie.title.toLowerCase());
        if (existingIdx >= 0) {
          list.splice(existingIdx, 1);
        } else {
          list.push({
            title: movie.title,
            year: movie.year,
            genres: movie.genres,
            overview: movie.overview,
            poster_url: movie.poster_url,
            rating: movie.rating
          });
        }
        localStorage.setItem('vanta_watchlist', JSON.stringify(list));
        updateWatchlistBtnState(movie, watchlistBtn);
      };
    }

    loadingState.classList.add('hidden');
    detailsContent.classList.remove('hidden');
  }

  function updateWatchlistBtnState(movie, btn) {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('vanta_watchlist')) || [];
    } catch {
      list = [];
    }
    const isSaved = list.some(item => item.title.toLowerCase() === movie.title.toLowerCase());

    if (isSaved) {
      btn.className = 'bg-secondary/20 text-secondary text-sm font-medium px-7 py-3 rounded border border-secondary/40 shadow-[0_0_15px_rgba(124,208,255,0.2)] flex items-center gap-2 transition-all duration-300';
      btn.innerHTML = `<span class="material-symbols-outlined text-lg">bookmark_added</span><span>Saved in Vault</span>`;
    } else {
      btn.className = 'bg-transparent text-white/70 text-sm font-medium px-7 py-3 rounded border border-white/10 hover:border-white hover:text-white transition-all duration-300 flex items-center gap-2';
      btn.innerHTML = `<span class="material-symbols-outlined text-lg">bookmark_add</span><span>+ Watchlist</span>`;
    }
  }

  // Parallax background effect on scroll
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (heroBg && scrolled < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrolled * 0.25}px) scale(${1.05 - (scrolled * 0.0001)})`;
    }
  });
});

