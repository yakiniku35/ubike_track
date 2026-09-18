/**
 * 純函式工具箱：不碰 DOM、不碰全域狀態，所以很好測試也很好重用。
 */

import { ENOUGH_BIKES_THRESHOLD } from './youbike-config.js';

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
};

/** 把字串放進 innerHTML 前一定要先跳脫，避免站名含特殊字元時破壞版面。 */
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => HTML_ESCAPES[char]);
}

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 依序嘗試多個欄位名稱，回傳第一個是有效數字的值。
 * YouBike API 同一個資料有新舊兩種欄位名（例如 available_rent_bikes / sbi），
 * 用這個函式就不必擔心官方哪天換掉其中一個。
 */
export function pickNumber(source, keys) {
  for (const key of keys) {
    const n = Number(source?.[key]);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** 依序嘗試多個欄位名稱，回傳第一個非空字串。 */
export function pickText(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function cleanStationName(name = '') {
  return String(name).replace(/^YouBike2\.0_/, '');
}

/** 統一大小寫與空白，讓搜尋不分大小寫也不受空格影響。 */
export function normalizeSearch(text = '') {
  return String(text).toLowerCase().replace(/\s+/g, '');
}

/** 可借車輛數分級，決定圓點顏色與大小。 */
export function bikeLevel(bikes) {
  if (bikes <= 0) return 'empty';
  if (bikes < ENOUGH_BIKES_THRESHOLD) return 'low';
  return 'ok';
}

/**
 * 把 API 原始資料轉成畫面好用的格式。
 * searchText 先算好存起來，搜尋時就不必每次按鍵都重新轉小寫（上千筆會有感）。
 */
export function normalizeStation(raw) {
  const name = cleanStationName(pickText(raw, ['sna', 'sname']));
  const nameEn = cleanStationName(pickText(raw, ['snaen', 'sarea_en']));
  const address = pickText(raw, ['ar', 'address']);

  return {
    sno: String(raw.sno ?? ''),
    name,
    nameEn,
    area: pickText(raw, ['sarea']),
    address,
    lat: pickNumber(raw, ['latitude', 'lat']),
    lng: pickNumber(raw, ['longitude', 'lng']),
    bikes: pickNumber(raw, ['available_rent_bikes', 'sbi']),
    spaces: pickNumber(raw, ['available_return_bikes', 'bemp']),
    quantity: pickNumber(raw, ['Quantity', 'total', 'tot']),
    updatedAt: pickText(raw, ['updateTime', 'srcUpdateTime', 'mday', 'infoTime']),
    isActive: String(raw.act ?? '1') === '1',
    searchText: normalizeSearch(`${name}${nameEn}${address}`)
  };
}

/** 連續觸發時只執行最後一次，用於搜尋輸入避免每個字都重繪列表。 */
export function debounce(fn, wait = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function formatCount(value) {
  return toNumber(value).toLocaleString('zh-Hant');
}

/**
 * 從 API 的時間字串抓出 HH:MM。
 * 用正則比 split(' ')[1] 穩，因為格式可能是 "2024-01-01 12:00:00" 或 ISO 字串。
 */
export function formatUpdateTime(raw) {
  const match = String(raw ?? '').match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

const EARTH_RADIUS_KM = 6371;
const toRad = deg => deg * Math.PI / 180;

/** Haversine 公式：計算兩個經緯度之間的直線距離（公里）。 */
export function distanceKm(from, to) {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return '';
  return km < 1 ? `${Math.round(km * 1000)} 公尺` : `${km.toFixed(1)} 公里`;
}

