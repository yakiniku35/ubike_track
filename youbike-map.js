/**
 * 進入點：把各模組接起來、綁事件、啟動第一次載入。
 */

import { DEFAULT_SORT, SORT_MODES, STORAGE_KEYS } from './youbike-config.js';
import { els, showLoadError } from './youbike-dom.js';
import { initLocateButton, initMap, initThemeToggle, setOnMarkerSelect } from './youbike-map-view.js';
import { applyFilter, highlightStation, loadData, selectStation, updateDistances } from './youbike-stations.js';
import { state } from './youbike-state.js';
import { debounce } from './youbike-utils.js';
import './youbike-analytics.js';

/** 切回分頁時，資料超過這個秒數才重抓。 */
const STALE_AFTER_MS = 30_000;

function readStoredSort() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.sort);
    // distance 需要定位授權，重新整理後還原它會排不出東西，所以不還原。
    return SORT_MODES.includes(saved) && saved !== 'distance' ? saved : DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

function bindSearch() {
  const runSearch = debounce(value => {
    state.searchQuery = value;
    applyFilter();
  });

  els.searchInput.addEventListener('input', event => runSearch(event.target.value.trim()));

  // 搜尋框按 Esc 直接清空，比用滑鼠點掉整串文字快。
  els.searchInput.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !els.searchInput.value) return;
    els.searchInput.value = '';
    state.searchQuery = '';
    applyFilter();
  });
}

function bindFilterChips() {
  const chips = [...document.querySelectorAll('.chip')];
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(other => {
        const isActive = other === chip;
        other.classList.toggle('active', isActive);
        other.setAttribute('aria-pressed', String(isActive));
      });
      state.activeFilter = chip.dataset.filter;
      applyFilter();
    });
  });
}

function bindSort() {
  state.sortMode = readStoredSort();
  els.sortSelect.value = state.sortMode;

  els.sortSelect.addEventListener('change', () => {
    state.sortMode = els.sortSelect.value;
    try {
      localStorage.setItem(STORAGE_KEYS.sort, state.sortMode);
    } catch {
      // 無痕模式寫不進去也沒關係，只是下次不會記住。
    }
    applyFilter();
  });
}

/** 手機版把側欄收合起來，讓地圖有完整空間。 */
function bindSidebarToggle() {
  els.sidebarToggle?.addEventListener('click', () => {
    const collapsed = document.body.classList.toggle('sidebar-collapsed');
    els.sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    els.sidebarToggle.setAttribute('aria-label', collapsed ? '展開站點列表' : '收合站點列表');
    // 版面高度變了要通知 Leaflet 重算，否則地圖會出現灰白破圖。
    setTimeout(() => state.map?.invalidateSize(), 260);
  });
}

/** 鍵盤捷徑：/ 聚焦搜尋、r 重新整理。輸入中時不攔截。 */
function bindShortcuts() {
  document.addEventListener('keydown', event => {
    const tag = event.target?.tagName;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (event.key === '/') {
      event.preventDefault();
      els.searchInput.focus();
    } else if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      loadData();
    }
  });
}

function bindEvents() {
  bindSearch();
  bindFilterChips();
  bindSort();
  bindSidebarToggle();
  bindShortcuts();

  // 事件委派：列表整批重繪也不用重新綁定每一個按鈕。
  els.stationList.addEventListener('click', event => {
    const item = event.target.closest('[data-sno]');
    if (item) selectStation(item.dataset.sno);
  });

  els.refreshButton.addEventListener('click', () => loadData());

  setOnMarkerSelect(highlightStation);

  initLocateButton(location => {
    state.userLocation = location;
    updateDistances();
    // 定位成功後才開放「離我最近」選項。
    const option = els.sortSelect.querySelector('option[value="distance"]');
    if (option) option.disabled = false;
    applyFilter();
  });

  // 分頁切回前景時補抓一次，避免看到放很久的舊資料。
  // 加上時間門檻，頻繁切分頁才不會一直打 API。
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || state.stations.length === 0) return;
    if (Date.now() - state.lastLoadedAt < STALE_AFTER_MS) return;
    loadData({ silent: true });
  });
}

function init() {
  // Leaflet 是從 CDN 載入的，萬一被擋掉就不會有 window.L，
  // 這時要明確告訴使用者，而不是讓載入動畫一直轉。
  if (typeof L === 'undefined') {
    showLoadError(() => window.location.reload(), {
      status: '地圖載入失敗',
      title: '地圖元件載入失敗',
      hint: '地圖函式庫無法載入，請確認網路或瀏覽器擴充功能是否封鎖了 CDN'
    });
    return;
  }

  initThemeToggle();
  initMap();
  bindEvents();
  loadData();
}

init();
