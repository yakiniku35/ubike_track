import { DEFAULT_CENTER, DEFAULT_ZOOM } from './youbike-config.js';
import { els } from './youbike-dom.js';
import { state } from './youbike-state.js';
import { escapeHtml } from './youbike-utils.js';

const themeIcons = {
  dark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  light: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
};

export function initMap() {
  state.map = L.map('map', {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true
  });
  addTileLayer();
}

export function initThemeToggle() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = localStorage.getItem('youbike-theme') || root.getAttribute('data-theme') || 'dark';

  root.setAttribute('data-theme', theme);
  toggle.innerHTML = themeIcons[theme];
  toggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('youbike-theme', theme);
    toggle.innerHTML = themeIcons[theme];
    refreshTileLayer();
  });
}

export function addTileLayer() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tile = dark ? 'dark_all' : 'light_all';
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tile}/{z}/{x}/{y}{r}.png`, {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.map);
}

function refreshTileLayer() {
  if (!state.map) return;
  state.map.eachLayer(layer => {
    if (layer._url) state.map.removeLayer(layer);
  });
  addTileLayer();
}

export function getCircleStyle(bikes) {
  if (bikes === 0) return { color: '#a12c7b', radius: 7, opacity: 0.9 };
  if (bikes < 5) return { color: '#bb653b', radius: 8 + bikes, opacity: 0.85 };
  if (bikes < 10) return { color: '#bb653b', radius: 10 + bikes, opacity: 0.8 };
  return { color: '#6daa45', radius: 10 + Math.min(bikes, 30), opacity: 0.8 };
}

export function getDotColor(bikes) {
  if (bikes === 0) return '#a12c7b';
  if (bikes < 5) return '#bb653b';
  return '#6daa45';
}

export function replaceMarkers(stations, onMarkerClick) {
  Object.values(state.markers).forEach(marker => marker.remove());
  state.markers = {};

  stations.forEach(station => {
    const style = getCircleStyle(station.bikes);
    const marker = L.circleMarker([station.lat, station.lng], {
      radius: style.radius,
      fillColor: style.color,
      color: 'rgba(255,255,255,0.25)',
      weight: 1,
      fillOpacity: style.opacity
    }).bindPopup(makePopup(station), { maxWidth: 260 });

    marker.on('click', () => onMarkerClick(station.sno));
    state.markers[station.sno] = marker;
  });
}

export function updateMarkers(filteredStations) {
  const ids = new Set(filteredStations.map(station => station.sno));
  Object.entries(state.markers).forEach(([id, marker]) => {
    if (ids.has(id) && !state.map.hasLayer(marker)) marker.addTo(state.map);
    if (!ids.has(id) && state.map.hasLayer(marker)) state.map.removeLayer(marker);
  });
}

export function flyToStation(station) {
  if (!station || !state.markers[station.sno]) return;
  state.map.flyTo([station.lat, station.lng], 17, { duration: 0.8 });
  setTimeout(() => state.markers[station.sno].openPopup(), 900);
}

export function initLocateButton() {
  els.locateButton.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      state.map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 0.8 });
    });
  });
}

function makePopup(station) {
  const rate = station.quantity > 0 ? Math.round(station.bikes / station.quantity * 100) : 0;
  const barColor = rate >= 50 ? '#6daa45' : rate > 0 ? '#bb653b' : '#a12c7b';

  return `
    <div class="popup-body">
      <div class="popup-title">${escapeHtml(station.name)}</div>
      <div class="popup-addr">${escapeHtml(station.address)}</div>
      <div class="popup-stats">
        <div class="popup-stat">
          <div class="popup-stat-val" style="color:#6daa45">${station.bikes}</div>
          <div class="popup-stat-label">可借</div>
        </div>
        <div class="popup-stat">
          <div class="popup-stat-val" style="color:#4f98a3">${station.spaces}</div>
          <div class="popup-stat-label">可還</div>
        </div>
        <div class="popup-stat">
          <div class="popup-stat-val" style="color:var(--color-text-muted)">${station.quantity}</div>
          <div class="popup-stat-label">總車位</div>
        </div>
      </div>
      <div class="popup-bar-wrap">
        <div class="popup-bar" style="width:${rate}%;background:${barColor}"></div>
      </div>
      <div style="text-align:right;font-size:var(--text-xs);color:var(--color-text-muted);margin-top:4px">可借率 ${rate}%</div>
    </div>`;
}

