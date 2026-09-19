/**
 * 地圖相關的所有操作：底圖、圓點標記、彈出視窗、定位。
 */

import {
  DEFAULT_CENTER, DEFAULT_ZOOM, FOCUS_ZOOM, LEVEL_COLORS, LOCATE_ZOOM, MESSAGES,
  LOW_BIKES_THRESHOLD, STORAGE_KEYS, TILE_ATTRIBUTION, TILE_STYLES, TILE_URL_TEMPLATE
} from './youbike-config.js';
import { els, setButtonBusy, showToast } from './youbike-dom.js';
import { state } from './youbike-state.js';
import { bikeLevel, escapeHtml } from './youbike-utils.js';

const THEME_ICONS = {
  dark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  light: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
};

/** 點到圓點時要通知外部（由 youbike-stations.js 註冊）。 */
let onMarkerSelect = () => {};
export function setOnMarkerSelect(handler) {
  onMarkerSelect = handler;
}

const currentTheme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

/** 依目前主題取得分級顏色，切換主題時圓點也會跟著換色。 */
export function getLevelColor(bikes) {
  return LEVEL_COLORS[currentTheme()][bikeLevel(bikes)];
}

export function initMap() {
  state.map = L.map('map', {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true
  });

  state.tileLayer = L.tileLayer(tileUrl(), {
    attribution: TILE_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 19,
    detectRetina: true
  }).addTo(state.map);

  state.markerLayer = L.layerGroup().addTo(state.map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(state.map);
}

function tileUrl() {
  return TILE_URL_TEMPLATE.replace('{style}', TILE_STYLES[currentTheme()]);
}

export function initThemeToggle(onThemeChange) {
  const toggle = els.themeToggle;
  const root = document.documentElement;
  // 主題在 index.html 的行內腳本就決定好了，這裡只要讀回來即可。
  let theme = currentTheme();
  paintToggle(toggle, theme);

  toggle?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // 無痕模式可能寫不進去，忽略即可，不影響切換。
    }
    paintToggle(toggle, theme);
    // setUrl 直接換底圖網址，比「移除圖層再加一層」快也不會閃白。
    state.tileLayer?.setUrl(tileUrl());
    restyleMarkers();
    onThemeChange?.(theme);
  });
}

function paintToggle(toggle, theme) {
  if (!toggle) return;
  const label = theme === 'dark' ? '切換為淺色模式' : '切換為深色模式';
  toggle.innerHTML = THEME_ICONS[theme];
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('title', label);
}

/** 圓點半徑隨可借車輛數成長，但設上限避免車多的站蓋掉整張地圖。 */
export function getCircleStyle(bikes) {
  const color = getLevelColor(bikes);
  if (bikes <= 0) return { color, radius: 6, opacity: 0.9 };
  if (bikes < LOW_BIKES_THRESHOLD) return { color, radius: 7 + bikes, opacity: 0.85 };
  return { color, radius: 9 + Math.min(bikes, 24), opacity: 0.8 };
}

function markerOptions(station) {
  const style = getCircleStyle(station.bikes);
  return {
    radius: style.radius,
    fillColor: style.color,
    color: 'rgba(255,255,255,0.28)',
    weight: 1,
    fillOpacity: style.opacity
  };
}

function createMarker(station) {
  const marker = L.circleMarker([station.lat, station.lng], markerOptions(station));
  marker.station = station;
  // 傳函式給 bindPopup：內容在「真的被點開」時才產生，
  // 不必為上千個站點預先組字串。
  marker.bindPopup(layer => makePopup(layer.station), { maxWidth: 280, autoPanPadding: [24, 24] });
  marker.on('click', () => onMarkerSelect(marker.station.sno));
  return marker;
}

function applyMarkerStyle(marker) {
  const style = getCircleStyle(marker.station.bikes);
  marker.setStyle({ fillColor: style.color, fillOpacity: style.opacity });
  marker.setRadius(style.radius);
  if (marker.isPopupOpen()) marker.setPopupContent(makePopup(marker.station));
}

/**
 * 依最新資料更新標記：已存在的就地更新，新站才建立，消失的才移除。
 * 原本每次更新都把全部標記砍掉重建，除了慢，還會把使用者開著的彈窗關掉。
 */
export function syncMarkers(stations) {
  const seen = new Set();

  for (const station of stations) {
    seen.add(station.sno);
    const existing = state.markers.get(station.sno);
    if (existing) {
      existing.station = station;
      applyMarkerStyle(existing);
    } else {
      state.markers.set(station.sno, createMarker(station));
    }
  }

  for (const [sno, marker] of state.markers) {
    if (seen.has(sno)) continue;
    state.markerLayer.removeLayer(marker);
    state.markers.delete(sno);
  }
}

/** 套用篩選結果：只加入／移除有變動的標記。 */
export function updateMarkers(filteredStations) {
  const visibleIds = new Set(filteredStations.map(station => station.sno));

  for (const [sno, marker] of state.markers) {
    const shouldShow = visibleIds.has(sno);
    const isShown = state.markerLayer.hasLayer(marker);
    if (shouldShow && !isShown) state.markerLayer.addLayer(marker);
    else if (!shouldShow && isShown) state.markerLayer.removeLayer(marker);
  }
}

export function restyleMarkers() {
  for (const marker of state.markers.values()) applyMarkerStyle(marker);
}

/**
 * 飛到指定站點並打開彈窗。
 * 用 moveend 事件比原本固定等 900ms 的 setTimeout 可靠，
 * 並且會先取消上一次未完成的飛行，避免連點時兩個彈窗搶著開。
 */
let pendingFlyHandler = null;

export function flyToStation(station) {
  const marker = state.markers.get(station?.sno);
  if (!marker) return;

  if (!state.markerLayer.hasLayer(marker)) state.markerLayer.addLayer(marker);
  if (pendingFlyHandler) state.map.off('moveend', pendingFlyHandler);

  pendingFlyHandler = () => {
    pendingFlyHandler = null;
    marker.openPopup();
  };

  state.map.once('moveend', pendingFlyHandler);
  state.map.flyTo([station.lat, station.lng], FOCUS_ZOOM, { duration: 0.8 });
}

export function initLocateButton(onLocated) {
  els.locateButton?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast(MESSAGES.locate.unsupported, 'error');
      return;
    }

    // 非安全連線（不是 https、也不是 localhost）時，瀏覽器會直接回報
    // 權限錯誤。先擋下來給正確的說明，否則使用者只會看到「權限被關閉」，
    // 然後徒勞地去開權限。
    if (!window.isSecureContext) {
      showToast(MESSAGES.locate.insecure, 'error');
      return;
    }

    setButtonBusy(els.locateButton, true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setButtonBusy(els.locateButton, false);
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        showUserLocation(location);
        state.map.flyTo([location.lat, location.lng], LOCATE_ZOOM, { duration: 0.8 });
        showToast(MESSAGES.locate.success);
        onLocated?.(location);
      },
      error => {
        // 原本定位失敗完全沒有回饋，使用者只會覺得按鈕壞掉。
        setButtonBusy(els.locateButton, false);
        showToast(MESSAGES.locate.byCode[error.code] ?? MESSAGES.locate.failed, 'error');
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  });
}

function showUserLocation({ lat, lng }) {
  if (state.userMarker) {
    state.userMarker.setLatLng([lat, lng]);
    return;
  }
  state.userMarker = L.circleMarker([lat, lng], {
    radius: 7,
    fillColor: '#3b82f6',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 1,
    className: 'user-location-marker'
  }).addTo(state.map).bindTooltip('我的位置');
}

function makePopup(station) {
  const rate = station.quantity > 0 ? Math.round(station.bikes / station.quantity * 100) : 0;
  const barColor = getLevelColor(station.bikes);

  return `
    <div class="popup-body">
      <div class="popup-title">${escapeHtml(station.name)}</div>
      <div class="popup-addr">${escapeHtml(station.address)}</div>
      <div class="popup-stats">
        <div class="popup-stat">
          <div class="popup-stat-val" style="color:${barColor}">${station.bikes}</div>
          <div class="popup-stat-label">可借</div>
        </div>
        <div class="popup-stat">
          <div class="popup-stat-val popup-stat-val--accent">${station.spaces}</div>
          <div class="popup-stat-label">可還</div>
        </div>
        <div class="popup-stat">
          <div class="popup-stat-val popup-stat-val--muted">${station.quantity}</div>
          <div class="popup-stat-label">總車位</div>
        </div>
      </div>
      <div class="popup-bar-wrap" role="img" aria-label="可借率 ${rate}%">
        <div class="popup-bar" style="width:${rate}%;background:${barColor}"></div>
      </div>
      <div class="popup-rate">可借率 ${rate}%</div>
    </div>`;
}
