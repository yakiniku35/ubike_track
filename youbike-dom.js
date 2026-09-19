/**
 * 所有直接操作 DOM 的程式碼集中在這裡，
 * 其他模組只呼叫這些函式，不必自己去 querySelector。
 */

import { escapeHtml } from './youbike-utils.js';

const $ = id => document.getElementById(id);

export const els = {
  loading: $('loading'),
  updateTime: $('update-time'),
  stationList: $('station-list'),
  sidebarCount: $('sidebar-count'),
  searchInput: $('search-input'),
  sortSelect: $('sort-select'),
  sidebarToggle: $('sidebar-toggle'),
  refreshButton: $('refresh-button'),
  locateButton: $('locate-button'),
  themeToggle: document.querySelector('[data-theme-toggle]'),
  toastStack: $('toast-stack'),
  kpiTotal: $('kpi-total'),
  kpiBikes: $('kpi-bikes'),
  kpiSpace: $('kpi-space'),
  kpiEmpty: $('kpi-empty'),
  kpiRate: $('kpi-rate')
};

/** 把按鈕切成「忙碌中」，CSS 會讓圖示轉圈。 */
export function setButtonBusy(button, isBusy) {
  if (!button) return;
  button.setAttribute('aria-busy', String(isBusy));
  button.disabled = isBusy;
}

export function setRefreshBusy(isBusy) {
  setButtonBusy(els.refreshButton, isBusy);
}

export function hideLoading() {
  const overlay = els.loading;
  if (!overlay?.isConnected) return;
  overlay.classList.add('hidden');
  // 等淡出動畫跑完再移除，否則畫面會突然消失。
  setTimeout(() => overlay.remove(), 400);
}

/**
 * 首次載入失敗時的整頁錯誤畫面。
 * 用 addEventListener 綁定重試，不再依賴 inline onclick 與 window 全域函式。
 * 文案可覆寫，因為「資料抓不到」和「地圖函式庫載不進來」是兩種不同的失敗。
 */
export function showLoadError(onRetry, {
  status = '更新失敗',
  title = '無法載入資料',
  hint = '請確認網路連線後再試一次'
} = {}) {
  els.updateTime.textContent = status;

  const overlay = els.loading;
  if (!overlay?.isConnected) return;

  overlay.innerHTML = `
    <div class="load-error">
      <p class="load-error-title">${escapeHtml(title)}</p>
      <p class="load-error-hint">${escapeHtml(hint)}</p>
      <button class="retry-button" type="button">重新載入</button>
    </div>`;

  overlay.querySelector('.retry-button')?.addEventListener('click', () => {
    overlay.innerHTML = '<div class="spinner"></div><p class="loading-text">正在載入即時資料…</p>';
    onRetry();
  });
}

const TOAST_DURATION_MS = 3200;

/** 右下角的輕量提示，取代原本「失敗了但畫面毫無反應」的狀況。 */
export function showToast(message, type = 'info') {
  if (!els.toastStack) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  els.toastStack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--out');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // 若使用者關閉動畫，transitionend 不會觸發，這裡兜底移除。
    setTimeout(() => toast.remove(), 400);
  }, TOAST_DURATION_MS);
}
