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

/**
 * 使用者看得到的狀態與錯誤文案，集中在這裡管理。
 *
 * 撰寫原則（四組訊息共用，方便一起檢視是否一致）：
 * - 結構固定為「發生什麼，該怎麼辦」，讓使用者知道下一步能做什麼
 * - 用日常說法，不出現「函式庫」「CDN」「API」這類技術名詞
 * - 不用「你」當主詞去指責——權限未必是使用者自己關掉的
 * - 以全形逗號分隔，句尾不加句號
 */
export const MESSAGES = {
  /** 載入中（index.html 裡也有同一句，修改時要一起改）。 */
  loading: '正在載入即時資料…',

  /** 整頁錯誤畫面上的重試按鈕，錯誤文案會直接引用這個名稱。 */
  retryButton: '重新載入',

  /** 資料載入失敗（整頁錯誤畫面）。 */
  dataError: {
    status: '更新失敗',
    title: '無法載入資料',
    // 不只講網路：資料來源維護或沒回應時也會走到這裡。
    hint: '網路不穩或資料來源沒有回應，請按「重新載入」再試一次'
  },

  /** 地圖元件載入失敗（整頁錯誤畫面）。 */
  mapError: {
    status: '地圖載入失敗',
    title: '無法載入地圖',
    hint: '可能被廣告攔截器或網路限制擋住，請關閉後按「重新載入」'
  },

  /** 自動更新的浮動提示。 */
  refresh: {
    timeout: '更新逾時，稍後會自動重試',
    failed: '更新失敗，稍後會自動重試',
    recovered: '已重新連線，資料已更新'
  },

  /** 定位的浮動提示。 */
  locate: {
    success: '已定位到目前位置',
    // navigator.geolocation 在非 HTTPS 頁面也會不存在，所以不說「不支援」。
    unsupported: '這個瀏覽器無法使用定位功能，請改用其他瀏覽器',
    failed: '定位失敗，請再試一次',
    /** 對應 GeolocationPositionError.code：1 權限、2 取不到、3 逾時。 */
    byCode: {
      1: '定位權限被關閉，請在網址列的圖示中重新開啟',
      2: '抓不到目前位置，請確認裝置的定位服務已開啟',
      3: '定位太久沒有回應，請移到空曠處再試一次'
    }
  }
};
