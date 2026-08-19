document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedMovie = urlParams.get('movie') || 'Inception';

  const heading = document.getElementById('discover-heading');
  const subheading = document.getElementById('discover-subheading');
  const queryBadge = document.getElementById('query-badge');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const errorMessage = document.getElementById('error-message');
  const movieGrid = document.getElementById('movieGrid');
  const searchForm = document.getElementById('discover-search-form');
  const searchInput = document.getElementById('discover-search-input');

  if (searchInput) searchInput.value = selectedMovie;

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) {
        window.location.href = `discover.html?movie=${encodeURIComponent(val)}`;
      }
    });
  }

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://vanta-ai-movie-recommendation-system-1.onrender.com';

  fetchRecommendations(selectedMovie);

  async function fetchRecommendations(movieTitle) {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    movieGrid.classList.add('hidden');
    movieGrid.replaceChildren();

    queryBadge.textContent = `BECAUSE YOU LOVED "${movieTitle.toUpperCase()}"`;
    heading.textContent = `Recommendations for "${movieTitle}"`;
    subheading.textContent = `Curated atmospheric selections balancing narrative depth, visual craft, and thematic resonance.`;

    try {
      const response = await fetch(`${API_BASE}/recommend?movie=${encodeURIComponent(movieTitle)}&limit=10`);
      const payload = await response.json();

      if (!response.ok || !payload.found) {
        throw new Error(payload.message || `Title "${movieTitle}" is not present in the current VANTA library.`);
      }

      heading.textContent = `Selections for "${payload.movie_title}"`;
      renderMovieCards(payload.recommendations);
    } catch (err) {
      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
      errorMessage.textContent = err.message.includes('Failed to fetch')
        ? 'Could not connect to backend API. Ensure http://localhost:8000 is running.'
        : err.message;
    }
  }

  function renderMovieCards(movies) {
    loadingState.classList.add('hidden');
    movieGrid.classList.remove('hidden');

    const gradientPresets = [
      'from-slate-900 via-indigo-950 to-black',
      'from-neutral-900 via-zinc-900 to-black',
      'from-stone-900 via-neutral-950 to-black',
      'from-blue-950 via-slate-900 to-black',
      'from-purple-950 via-slate-950 to-black'
    ];

    movies.forEach((film, index) => {
      const card = document.createElement('a');
      card.href = `movie.html?title=${encodeURIComponent(film.title)}`;
      card.className = 'movie-card group block bg-surface-container-low stagger-fade-in aspect-[2/3] relative cursor-pointer';

      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.animationDelay = `${index * 0.08}s`;

      const preset = gradientPresets[index % gradientPresets.length];
      const genresHtml = (film.genres || []).slice(0, 2).map(g => 
        `<span class="bg-surface-container-high/90 text-on-surface px-2 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wider">${g}</span>`
      ).join('');

      const ratingBadge = film.rating 
        ? `<span class="bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-label text-[10px] flex items-center gap-0.5">★ ${film.rating}</span>`
        : '';

      const yearBadge = film.year 
        ? `<span class="bg-surface-container-high/90 text-on-surface-variant px-2 py-0.5 rounded-full font-label text-[10px]">${film.year}</span>`
        : '';

      const posterContent = film.poster_url
        ? `<img src="${film.poster_url}" alt="${film.title}" class="w-full h-full object-cover" loading="lazy" />`
        : `<div class="w-full h-full bg-gradient-to-br ${preset} p-4 flex flex-col justify-between border border-white/5">
             <span class="font-label text-xs text-secondary/60">#${String(index + 1).padStart(2, '0')}</span>
             <div>
               <h4 class="font-display font-semibold text-lg text-white mb-1 leading-tight">${film.title}</h4>
               <p class="font-label text-xs text-on-surface-variant">${film.year || ''}</p>
             </div>
           </div>`;

      card.innerHTML = `
        <div class="movie-card-img-wrapper">
          ${posterContent}
        </div>
        <div class="movie-card-overlay">
          <div class="movie-card-content flex flex-col gap-2">
            <div class="flex flex-wrap gap-1.5 mb-1">
              ${genresHtml}
              ${yearBadge}
              ${ratingBadge}
            </div>
            <h3 class="font-display font-semibold text-lg text-white leading-snug">${film.title}</h3>
            <p class="font-body text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
              ${film.overview || 'Atmospheric recommendation matched by VANTA hybrid taste vector.'}
            </p>
          </div>
        </div>
      `;

      movieGrid.appendChild(card);
    });
  }

  // Scroll Parallax for Header
  const pageHeader = document.getElementById('page-header');
  window.addEventListener('scroll', () => {
    if (!pageHeader) return;
    const scrollPosition = window.scrollY;
    if (scrollPosition < 300) {
      const opacity = 1 - (scrollPosition / 300);
      pageHeader.style.opacity = Math.max(0, opacity);
      pageHeader.style.transform = `translateY(${scrollPosition * 0.15}px)`;
    }
  });
});
