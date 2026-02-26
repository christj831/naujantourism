(() => {
  const STORAGE_KEY = 'naujan:favorites';

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
      // Fail silently if CustomEvent/window is not available
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

      const label =
        btn.querySelector('.favorite-btn-label') ||
        btn.querySelector('span:not(.badge)');
      if (label) label.textContent = isFav ? 'Saved' : 'Save';
    });
  }

  function hidePageLoader() {
    const el = document.getElementById('pageLoader');
    if (!el) return;
    el.classList.add('hidden');
  }

  function wireFavoriteClicks() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.favorite-btn[data-favorite-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-favorite-id');
      const favs = getFavorites();
      const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
      setFavorites(next);
      updateFavoriteButtons();
    });
  }

  function init() {
    hidePageLoader();
    updateFavoriteButtons();
    wireFavoriteClicks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
