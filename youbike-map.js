import { els } from './youbike-dom.js';
import { initLocateButton, initMap, initThemeToggle } from './youbike-map-view.js';
import { applyFilter, loadData, selectStation } from './youbike-stations.js';
import { state } from './youbike-state.js';
import { debounce } from './youbike-utils.js';
import './youbike-analytics.js';

function bindEvents() {
  els.searchInput.addEventListener('input', debounce(e => {
    state.searchQuery = e.target.value.trim();
    applyFilter();
  }));

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      applyFilter();
    });
  });

  els.stationList.addEventListener('click', e => {
    const item = e.target.closest('[data-sno]');
    if (item) selectStation(item.dataset.sno);
  });

  els.refreshButton.addEventListener('click', () => loadData());
  initLocateButton();
}

function init() {
  initThemeToggle();
  initMap();
  bindEvents();
  window.loadData = loadData;
  loadData();
}

init();
