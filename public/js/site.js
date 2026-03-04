(() => {
  const STORAGE_KEY = 'naujan:favorites';
  const RATINGS_KEY = 'naujan:ratings';

  function getFavorites() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setFavorites(ids) {
    const unique = Array.from(new Set(ids));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    notifyFavoritesChanged(unique);
  }

  function notifyFavoritesChanged(ids) {
    try {
      const detail = { ids: ids || getFavorites() };
      window.dispatchEvent(new CustomEvent('favorites:changed', { detail }));
    } catch {
      // Fail silently
    }
  }

  function updateFavoriteButtons() {
    const favs = new Set(getFavorites());
    document.querySelectorAll('.favorite-btn[data-favorite-id]').forEach((btn) => {
      const id = btn.getAttribute('data-favorite-id');
      const isFav = favs.has(id);
      btn.classList.toggle('is-favorited', isFav);
      btn.setAttribute('aria-pressed', isFav ? 'true' : 'false');

      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-regular', !isFav);
        icon.classList.toggle('fa-solid', isFav);
      }

      const label = btn.querySelector('.favorite-btn-label') || btn.querySelector('span:not(.badge)');
      if (label) {
        const globalCount = btn.getAttribute('data-global-fav') || '0';
        label.textContent = isFav ? `Saved (${globalCount})` : `Save (${globalCount})`;
      }
    });
  }

  // --- START RATINGS LOGIC ---
  async function submitRatingApi(attractionId, value) {
    try {
      const resp = await fetch(`/api/rate/${attractionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value })
      });
      return await resp.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function setRating(attractionId, value) {
    updateRatingUI(attractionId, value, null);
    const stats = await submitRatingApi(attractionId, value);
    if (stats) {
      updateRatingUI(attractionId, value, stats);
    }
  }

  function updateRatingUI(attractionId, value, stats) {
    const container = document.querySelector(`.rating-container[data-id="${attractionId}"]`);
    if (!container) return;

    if (value) {
      const stars = container.querySelectorAll('.rating-star');
      stars.forEach((star, index) => {
        if (index < value) {
          star.classList.replace('fa-regular', 'fa-solid');
          star.classList.add('text-warning');
        } else {
          star.classList.replace('fa-solid', 'fa-regular');
          star.classList.remove('text-warning');
        }
      });
    }

    const label = container.querySelector('.rating-label');
    if (label && stats) {
      label.textContent = `${stats.avgRating} / 5 (${stats.ratingCount} reviews)`;
    } else if (label && value) {
      label.textContent = `Saving...`;
    }
  }

  function initRatings() {
    // Initialized server-side
  }

  function wireRatingClicks() {
    document.addEventListener('click', (e) => {
      const star = e.target.closest('.rating-star');
      if (!star) return;

      const container = star.closest('.rating-container');
      const attractionId = container.getAttribute('data-id');
      const value = parseInt(star.getAttribute('data-value'));

      setRating(attractionId, value);
    });
  }
  // --- END RATINGS LOGIC ---

  function hidePageLoader() {
    const el = document.getElementById('pageLoader');
    if (!el) return;
    el.classList.add('hidden');
  }

  async function toggleFavoriteApi(id, action) {
    try {
      const resp = await fetch(`/api/favorite/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      return await resp.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function wireFavoriteClicks() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.favorite-btn[data-favorite-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-favorite-id');
      const favs = getFavorites();
      const isAdding = !favs.includes(id);
      const next = isAdding ? [...favs, id] : favs.filter((x) => x !== id);
      setFavorites(next);
      updateFavoriteButtons();

      const stats = await toggleFavoriteApi(id, isAdding ? 'add' : 'remove');
      if (stats) {
        document.querySelectorAll(`.favorite-btn[data-favorite-id="${id}"]`).forEach(b => {
          b.setAttribute('data-global-fav', stats.favoritesCount);
        });
        updateFavoriteButtons();
      }
    });
  }

  function init() {
    hidePageLoader();
    updateFavoriteButtons();
    wireFavoriteClicks();
    initRatings();
    wireRatingClicks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();