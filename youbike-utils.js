export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function cleanStationName(name = '') {
  return String(name).replace(/^YouBike2\.0_/, '');
}

export function normalizeStation(s) {
  return {
    ...s,
    sno: String(s.sno),
    name: cleanStationName(s.sna),
    address: s.ar || '',
    lat: toNumber(s.latitude),
    lng: toNumber(s.longitude),
    bikes: toNumber(s.available_rent_bikes),
    spaces: toNumber(s.available_return_bikes),
    quantity: toNumber(s.Quantity),
    isActive: s.act === '1'
  };
}

export function debounce(fn, wait = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

