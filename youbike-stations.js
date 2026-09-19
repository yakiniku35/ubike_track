/**
 * 站點資料的取得、篩選、排序與側欄渲染。
 */

import { API_URL, FETCH_TIMEOUT_MS, MAX_SIDEBAR_ITEMS, REFRESH_INTERVAL_MS } from './youbike-config.js';
import { els, hideLoading, setRefreshBusy, showLoadError, showToast } from './youbike-dom.js';
import { flyToStation, syncMarkers, updateMarkers } from './youbike-map-view.js';
import { state } from './youbike-state.js';
import {
  bikeLevel, distanceKm, escapeHtml, formatCount, formatDistance,
  formatUpdateTime, normalizeSearch, normalizeStation
} from './youbike-utils.js';

const FILTERS = {
  all: () => true,
  ok: station => station.bikes > 0,
  empty: station => station.bikes === 0,
  full: station => station.spaces === 0
};

const SORTERS = {
  bikes: (a, b) => b.bikes - a.bikes || compareName(a, b),
  spaces: (a, b) => b.spaces - a.spaces || compareName(a, b),
  name: compareName,
  distance: (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity) || compareName(a, b)
};

function compareName(a, b) {
  return a.name.localeCompare(b.name, 'zh-Hant');
}

export function filterStations() {
  const query = normalizeSearch(state.searchQuery);
  const matchFilter = FILTERS[state.activeFilter] ?? FILTERS.all;

  const filtered = state.stations.filter(station =>
    (!query || station.searchText.includes(query)) && matchFilter(station)
  );

  const sorter = SORTERS[state.sortMode] ?? SORTERS.bikes;
  return filtered.sort(sorter);
}

export function applyFilter() {
  const filtered = filterStations();
  renderSidebar(filtered);
  updateMarkers(filtered);
}

/** 使用者定位後重新算一次距離，讓「離我最近」排序可用。 */
export function updateDistances() {
  if (!state.userLocation) return;
  for (const station of state.stations) {
    station.distance = distanceKm(state.userLocation, { lat: station.lat, lng: station.lng });
  }
}

export function renderSidebar(filtered) {
  const visible = filtered.slice(0, MAX_SIDEBAR_ITEMS);
  els.sidebarCount.textContent = filtered.length > MAX_SIDEBAR_ITEMS
    ? `顯示 ${visible.length} / ${formatCount(filtered.length)} 站`
    : `${formatCount(filtered.length)} 站`;

  if (filtered.length === 0) {
    els.stationList.innerHTML = `
      <div class="empty-state">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <p>找不到符合條件的站點</p>
      </div>`;
    return;
  }

  els.stationList.innerHTML = visible.map(renderStationItem).join('');
}

function renderStationItem(station) {
  const isActive = station.sno === state.activeStationId;
  const distance = Number.isFinite(station.distance) ? ` · ${formatDistance(station.distance)}` : '';

  // aria-current 只在選中時輸出：未選中時省略即可，不必輸出 false。
  const currentAttr = isActive ? ' aria-current="true"' : '';

  return `<button class="station-item${isActive ? ' active' : ''}" type="button"
      data-sno="${escapeHtml(station.sno)}"${currentAttr}
      aria-label="${escapeHtml(station.name)}，可借 ${station.bikes} 輛，可還 ${station.spaces} 位">
    <span class="station-dot" data-level="${bikeLevel(station.bikes)}" aria-hidden="true"></span>
    <span class="station-main">
      <span class="station-name">${escapeHtml(station.name)}</span>
      <span class="station-meta">可還 ${station.spaces}${distance}</span>
    </span>
    <span class="station-count" data-level="${bikeLevel(station.bikes)}">${station.bikes}</span>
  </button>`;
}

export function selectStation(sno) {
  const station = state.stations.find(item => item.sno === sno);
  if (!station) return;

  state.activeStationId = sno;
  renderSidebar(filterStations());
  flyToStation(station);
}

/** 讓地圖圓點被點到時，側欄也跟著標示為選中。 */
export function highlightStation(sno) {
  state.activeStationId = sno;
  renderSidebar(filterStations());
}

/** 同一時間只允許一個請求在跑，見 loadData 內的說明。 */
let isLoading = false;

export async function loadData({ silent = false } = {}) {
  // 鍵盤捷徑、分頁切回前景、定時刷新、重試按鈕都可能同時觸發 loadData。
  // 沒有這道閘門的話：較早送出但較晚回來的請求會覆寫較新的資料，
  // 而且先完成的那個會在其他請求還在跑時就把按鈕的忙碌狀態清掉。
  if (isLoading) return;
  isLoading = true;

  try {
    setRefreshBusy(true);
    const raw = await fetchStations();

    state.stations = raw
      .map(normalizeStation)
      .filter(station => station.sno && station.isActive && station.lat && station.lng);

    updateDistances();
    updateKpis();
    updateTimestamp();
    syncMarkers(state.stations);
    applyFilter();
    hideLoading();
    state.lastLoadedAt = Date.now();

    if (state.hasReportedError) {
      showToast('已重新連線，資料更新完成');
      state.hasReportedError = false;
    }
  } catch (error) {
    reportFailure(error, silent);
  } finally {
    isLoading = false;
    setRefreshBusy(false);
    // 不論成功或失敗都重新排程，否則一次斷線就再也不會自動更新了。
    scheduleRefresh();
  }
}

function reportFailure(error, silent) {
  const isTimeout = error?.name === 'AbortError';
  if (silent || state.stations.length > 0) {
    // 已經有資料在畫面上，用輕量提示就好，不要蓋掉整張地圖。
    if (!state.hasReportedError) {
      showToast(isTimeout ? '更新逾時，稍後會自動重試' : '更新失敗，稍後會自動重試', 'error');
    }
    els.updateTime.textContent = '更新失敗';
    state.hasReportedError = true;
    return;
  }
  state.hasReportedError = true;
  showLoadError(() => loadData());
}

function scheduleRefresh() {
  clearTimeout(state.refreshTimer);
  state.refreshTimer = setTimeout(() => loadData({ silent: true }), REFRESH_INTERVAL_MS);
}

async function fetchStations() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    // API 正常回傳陣列，但偶爾會包成物件，兩種都接住。
    const items = Array.isArray(data) ? data
      : (data && typeof data === 'object') ? Object.values(data)
      : null;
    if (!items) throw new Error('資料格式不正確');

    // 維護期間 API 可能以 HTTP 200 回傳 { message: '...' } 這類內容。
    // 若不檢查，這些資料會被正規化成無效站點、再被篩掉變成空陣列，
    // 結果是地圖上的標記全被清空卻完全不會進入錯誤處理。
    const stations = items.filter(item => item && typeof item === 'object' && item.sno != null);
    if (stations.length === 0) throw new Error('資料格式不正確');
    return stations;
  } finally {
    clearTimeout(timeout);
  }
}

function updateKpis() {
  let totalBikes = 0;
  let totalSpace = 0;
  let totalQuantity = 0;
  let emptyCount = 0;

  // 一次走訪就算完四個指標，取代原本四次 reduce/filter。
  for (const station of state.stations) {
    totalBikes += station.bikes;
    totalSpace += station.spaces;
    totalQuantity += station.quantity;
    if (station.bikes === 0) emptyCount += 1;
  }

  els.kpiTotal.textContent = formatCount(state.stations.length);
  els.kpiBikes.textContent = formatCount(totalBikes);
  els.kpiSpace.textContent = formatCount(totalSpace);
  els.kpiEmpty.textContent = formatCount(emptyCount);
  els.kpiRate.textContent = totalQuantity > 0
    ? `${Math.round(totalBikes / totalQuantity * 100)}%`
    : '–';
}

function updateTimestamp() {
  const raw = state.stations.find(station => station.updatedAt)?.updatedAt;
  const time = formatUpdateTime(raw);
  els.updateTime.textContent = time ? `更新 ${time}` : '已更新';
  els.updateTime.title = raw || '';
}

