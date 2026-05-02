import { API_URL, MAX_SIDEBAR_ITEMS, REFRESH_INTERVAL_MS } from './youbike-config.js';
import { els, hideLoading, setRefreshBusy, showLoadError } from './youbike-dom.js';
import { flyToStation, getDotColor, replaceMarkers, updateMarkers } from './youbike-map-view.js';
import { state } from './youbike-state.js';
import { escapeHtml, normalizeStation } from './youbike-utils.js';

export function filterStations() {
  return state.stations.filter(station => {
    const matchSearch = !state.searchQuery ||
      station.name.includes(state.searchQuery) ||
      station.address.includes(state.searchQuery);
    const matchFilter =
      state.activeFilter === 'all' ? true :
      state.activeFilter === 'ok' ? station.bikes > 0 :
      state.activeFilter === 'empty' ? station.bikes === 0 :
      state.activeFilter === 'full' ? station.spaces === 0 : true;

    return matchSearch && matchFilter;
  });
}

export function applyFilter() {
  const filtered = filterStations();
  renderSidebar(filtered);
  updateMarkers(filtered);
}

export function renderSidebar(filtered) {
  const visible = filtered.slice(0, MAX_SIDEBAR_ITEMS);
  els.sidebarCount.textContent = filtered.length > MAX_SIDEBAR_ITEMS
    ? `${visible.length}/${filtered.length} 站`
    : `${filtered.length} 站`;

  if (filtered.length === 0) {
    els.stationList.innerHTML = `<div class="empty-state"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><p>找不到符合的站點</p></div>`;
    return;
  }

  els.stationList.innerHTML = visible.map(station => {
    const active = station.sno === state.activeStationId ? ' active' : '';
    return `<button class="station-item${active}" type="button" data-sno="${escapeHtml(station.sno)}" aria-label="查看 ${escapeHtml(station.name)}">
      <span class="station-dot" style="background:${getDotColor(station.bikes)}"></span>
      <span class="station-name">${escapeHtml(station.name)}</span>
      <span class="station-count">${station.bikes}輛</span>
    </button>`;
  }).join('');
}

export function selectStation(sno) {
  const station = state.stations.find(item => item.sno === sno);
  if (!station || !state.markers[sno]) return;

  state.activeStationId = sno;
  renderSidebar(filterStations());
  flyToStation(station);
}

export async function loadData({ silent = false } = {}) {
  try {
    setRefreshBusy(true);
    const data = await fetchStations();
    state.stations = data
      .map(normalizeStation)
      .filter(station => station.isActive && station.lat && station.lng)
      .sort((a, b) => b.bikes - a.bikes || a.name.localeCompare(b.name, 'zh-Hant'));

    updateKpis();
    updateTimestamp();
    replaceMarkers(state.stations, sno => {
      state.activeStationId = sno;
      renderSidebar(filterStations());
    });
    applyFilter();
    hideLoading();

    clearInterval(state.refreshTimer);
    state.refreshTimer = setInterval(() => loadData({ silent: true }), REFRESH_INTERVAL_MS);
  } catch (e) {
    if (!silent) showLoadError();
  } finally {
    setRefreshBusy(false);
  }
}

async function fetchStations() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(API_URL, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function updateKpis() {
  const totalBikes = state.stations.reduce((a, station) => a + station.bikes, 0);
  const totalSpace = state.stations.reduce((a, station) => a + station.spaces, 0);
  const totalQty = state.stations.reduce((a, station) => a + station.quantity, 0);
  const emptyCount = state.stations.filter(station => station.bikes === 0).length;

  els.kpiTotal.textContent = state.stations.length.toLocaleString();
  els.kpiBikes.textContent = totalBikes.toLocaleString();
  els.kpiSpace.textContent = totalSpace.toLocaleString();
  els.kpiEmpty.textContent = emptyCount.toLocaleString();
  els.kpiRate.textContent = totalQty > 0 ? Math.round(totalBikes / totalQty * 100) + '%' : '-';
}

function updateTimestamp() {
  const updatedAt = state.stations.find(station => station.updateTime)?.updateTime;
  if (!updatedAt) {
    els.updateTime.textContent = '已更新';
    return;
  }

  const time = updatedAt.split(' ')[1]?.slice(0, 5) || updatedAt;
  els.updateTime.textContent = `更新 ${time}`;
}

