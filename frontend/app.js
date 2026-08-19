const form = document.querySelector('#recommend-form');
const input = document.querySelector('#movie');
const status = document.querySelector('#form-status');
const results = document.querySelector('#discover');
const list = document.querySelector('#recommendation-list');
const suggestions = document.querySelector('#movie-suggestions');
let activeSuggestion = -1;
let autocompleteTimer;

const entrance = document.querySelector('#entrance');

// Update top nav Watchlist count badge
const navWatchlistCount = document.querySelector('#nav-watchlist-count');
if (navWatchlistCount) {
  try {
    const savedList = JSON.parse(localStorage.getItem('vanta_watchlist')) || [];
    navWatchlistCount.textContent = savedList.length;
  } catch {
    navWatchlistCount.textContent = '0';
  }
}

// Let the five letters land, then use the Stitch-inspired cinematic surge to
// carry the viewer from the identity screen into the discovery experience.
if (entrance) {
  window.setTimeout(() => entrance.classList.add('is-zooming'), 2400);
  window.setTimeout(() => entrance.classList.add('is-complete'), 3600);
}

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8000'
  : 'https://vanta-ai-movie-recommendation-system-1.onrender.com';

const tasteNotes = document.querySelector('#taste-notes');
const chainTrack = tasteNotes ? tasteNotes.querySelector('.film-chain-track') : null;

function attachFilmShortcut(button) {
  button.addEventListener('click', () => {
    input.value = button.dataset.film;
    input.focus();
  });
}

async function loadRandomFilmShortcuts() {
  if (!chainTrack) return;
  try {
    const response = await fetch(`${API_BASE}/movies/random?limit=8`);
    if (!response.ok) throw new Error('Could not load films.');
    const { movies } = await response.json();
    const chainMovies = [...movies, ...movies];
    chainTrack.replaceChildren(...chainMovies.map((movie, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.film = movie;
      button.textContent = movie;
      if (index >= movies.length) button.setAttribute('aria-hidden', 'true');
      attachFilmShortcut(button);
      return button;
    }));
  } catch {
    chainTrack.querySelectorAll('[data-film]').forEach(attachFilmShortcut);
  }
}

loadRandomFilmShortcuts();

const trendingTrack = document.querySelector('#trending-track');

async function loadTrendingMovies() {
  if (!trendingTrack) return;
  try {
    const response = await fetch(`${API_BASE}/movies/trending?limit=10`);
    if (!response.ok) throw new Error('Could not load trending films.');
    const { movies } = await response.json();

    // Render two identical runs so the marquee loops smoothly without a visible reset
    const carouselMovies = [...movies, ...movies];

    trendingTrack.replaceChildren(...carouselMovies.map((film, index) => {
      const card = document.createElement('a');
      card.href = `movie.html?title=${encodeURIComponent(film.title)}`;
      card.className = 'trending-card';
      if (index >= movies.length) card.setAttribute('aria-hidden', 'true');

      const posterMarkup = film.poster_url
        ? `<img src="${film.poster_url}" alt="${film.title}" loading="lazy" />`
        : `<div style="width:100%;height:100%;background:#1a1d25;display:grid;place-content:center;padding:0.5rem;font-size:0.7rem;color:#8792ff;text-align:center;">${film.title}</div>`;

      const ratingBadge = film.rating ? `★ ${film.rating}` : '';
      const yearStr = film.year || '';

      card.innerHTML = `
        ${posterMarkup}
        <div class="trending-card-overlay">
          <div class="trending-card-title">${film.title}</div>
          <div class="trending-card-meta">
            <span>${yearStr}</span>
            <span style="color:#7cd0ff;">${ratingBadge}</span>
          </div>
        </div>
      `;

      return card;
    }));
  } catch (error) {
    console.warn('Trending movies load failed:', error);
  }
}

loadTrendingMovies();

function closeSuggestions() {
  activeSuggestion = -1;
  suggestions.replaceChildren();
  suggestions.classList.remove('is-visible');
  form.classList.remove('has-suggestions');
  input.setAttribute('aria-expanded', 'false');
}

function chooseSuggestion(title) {
  input.value = title;
  closeSuggestions();
  input.focus();
}

function renderSuggestions(movies) {
  suggestions.replaceChildren(...movies.map((movie, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'option';
    button.id = `movie-suggestion-${index}`;
    button.textContent = movie;
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      chooseSuggestion(movie);
    });
    item.append(button);
    return item;
  }));
  suggestions.classList.toggle('is-visible', movies.length > 0);
  form.classList.toggle('has-suggestions', movies.length > 0);
  input.setAttribute('aria-expanded', String(movies.length > 0));
}

async function findMovieSuggestions() {
  const query = input.value.trim();
  if (query.length < 2) return closeSuggestions();
  try {
    const response = await fetch(`${API_BASE}/movies/search?query=${encodeURIComponent(query)}&limit=6`);
    const { movies } = await response.json();
    // Ignore a response for text the person has already changed.
    if (input.value.trim() === query) renderSuggestions(movies);
  } catch {
    closeSuggestions();
  }
}

input.addEventListener('input', () => {
  window.clearTimeout(autocompleteTimer);
  autocompleteTimer = window.setTimeout(findMovieSuggestions, 180);
});

input.addEventListener('keydown', (event) => {
  const options = [...suggestions.querySelectorAll('button')];
  if (!options.length) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    activeSuggestion = (activeSuggestion + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options.forEach((option, index) => option.classList.toggle('is-active', index === activeSuggestion));
    input.setAttribute('aria-activedescendant', options[activeSuggestion].id);
  } else if (event.key === 'Enter' && activeSuggestion >= 0) {
    event.preventDefault();
    chooseSuggestion(options[activeSuggestion].textContent);
  } else if (event.key === 'Escape') {
    closeSuggestions();
  }
});

input.addEventListener('blur', () => window.setTimeout(closeSuggestions, 120));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const movie = input.value.trim();
  if (!movie) return;
  window.location.href = `discover.html?movie=${encodeURIComponent(movie)}`;
});

