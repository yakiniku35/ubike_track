/**
 * 全站共用的可變狀態。
 * 集中在一個物件，方便追蹤資料流向，也避免各模組各自存一份而不同步。
 */

import { DEFAULT_SORT } from './youbike-config.js';

export const state = {
  /** 正規化後的站點陣列（已過濾停用站）。 */
  stations: [],
  /** sno -> Leaflet marker。用 Map 才能安全地邊走訪邊刪除。 */
  markers: new Map(),
  map: null,
  tileLayer: null,
  /** 所有站點圓點都掛在這個圖層群組，篩選時只需加入／移除，不必重建。 */
  markerLayer: null,
  userMarker: null,

  activeFilter: 'all',
  searchQuery: '',
  sortMode: DEFAULT_SORT,
  activeStationId: '',
  /** 使用者定位結果 { lat, lng }，用於「離我最近」排序。 */
  userLocation: null,

  refreshTimer: null,
  /** 上一次成功載入的時間戳，用來避免切換分頁時過度重抓。 */
  lastLoadedAt: 0,
  /** 記錄上一次自動更新是否失敗，避免連續跳出重複的提示。 */
  hasReportedError: false
};
