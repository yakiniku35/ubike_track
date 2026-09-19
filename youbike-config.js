/**
 * 全站共用設定值。
 * 所有「魔術數字」集中在這裡，之後要調整只需改一個地方。
 */

export const API_URL = 'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json';

/** 側欄一次最多渲染幾筆，避免一次塞上千個 DOM 節點造成卡頓。 */
export const MAX_SIDEBAR_ITEMS = 200;

/** 自動重新整理的間隔。 */
export const REFRESH_INTERVAL_MS = 60_000;

/** 單次 API 請求的逾時上限。 */
export const FETCH_TIMEOUT_MS = 12_000;

export const DEFAULT_CENTER = [25.05, 121.55];
export const DEFAULT_ZOOM = 13;
/** 點選站點後聚焦的縮放層級。 */
export const FOCUS_ZOOM = 17;
/** 定位到使用者位置後的縮放層級。 */
export const LOCATE_ZOOM = 16;

/** 可借車輛數的分級門檻。 */
export const LOW_BIKES_THRESHOLD = 5;
export const ENOUGH_BIKES_THRESHOLD = 10;

/**
 * 地圖圓點顏色。深色與淺色主題各一組，
 * 讓圓點在兩種底圖上都有足夠對比度。
 */
export const LEVEL_COLORS = {
  dark: { ok: '#6daa45', low: '#bb653b', empty: '#d163a7' },
  light: { ok: '#4f8a2e', low: '#964219', empty: '#a12c7b' }
};

export const TILE_STYLES = { dark: 'dark_all', light: 'light_all' };
export const TILE_URL_TEMPLATE = 'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '© OpenStreetMap © CARTO';

/** localStorage 的 key，集中管理避免打錯字。 */
export const STORAGE_KEYS = {
  theme: 'youbike-theme',
  sort: 'youbike-sort'
};

/** 側欄排序模式。 */
export const SORT_MODES = ['bikes', 'spaces', 'name', 'distance'];
export const DEFAULT_SORT = 'bikes';
