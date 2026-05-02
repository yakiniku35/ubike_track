export const els = {
  loading: document.getElementById('loading'),
  updateTime: document.getElementById('update-time'),
  stationList: document.getElementById('station-list'),
  sidebarCount: document.getElementById('sidebar-count'),
  searchInput: document.getElementById('search-input'),
  refreshButton: document.getElementById('refresh-button'),
  locateButton: document.getElementById('locate-button'),
  kpiTotal: document.getElementById('kpi-total'),
  kpiBikes: document.getElementById('kpi-bikes'),
  kpiSpace: document.getElementById('kpi-space'),
  kpiEmpty: document.getElementById('kpi-empty'),
  kpiRate: document.getElementById('kpi-rate')
};

export function setRefreshBusy(isBusy) {
  els.refreshButton.setAttribute('aria-busy', String(isBusy));
  els.refreshButton.disabled = isBusy;
}

export function hideLoading() {
  if (!els.loading || !document.body.contains(els.loading)) return;
  els.loading.classList.add('hidden');
  setTimeout(() => els.loading?.remove(), 500);
}

export function showLoadError() {
  els.updateTime.textContent = '更新失敗';
  if (!els.loading || !document.body.contains(els.loading)) return;

  els.loading.innerHTML = `
    <div style="text-align:center;color:var(--color-error)">
      <p style="font-size:var(--text-base);font-weight:600;margin-bottom:8px">無法載入資料</p>
      <p style="font-size:var(--text-xs);color:var(--color-text-muted)">請確認網路連線後重新整理</p>
      <button class="retry-button" type="button" onclick="loadData()">重新載入</button>
    </div>`;
}

