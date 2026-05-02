# YouBike 2.0 台北即時地圖

[English README](README.md)

一個使用 Leaflet 建立的台北市 YouBike 2.0 即時站點地圖。頁面會讀取台北市公開即時資料，顯示站點可借車輛、可還空位、整體 KPI、站點列表與篩選工具。

## 功能

- 即時顯示台北市 YouBike 2.0 站點
- 依可借車輛數用不同顏色與圓點大小標示
- 顯示總站點、可借車輛、可還空位、無車站數、整體可借率
- 支援站名與地址搜尋
- 支援全部、有車、無車、無位篩選
- 點選列表站點後自動移動地圖並開啟 popup
- 支援深色/淺色主題切換，並記住偏好
- 支援目前位置定位
- 每 60 秒自動刷新資料，也可手動重新整理
- 手機版保留地圖與搜尋列表，方便在小螢幕操作

## 快速開始

這個專案是純前端靜態頁面，不需要安裝套件。因為使用 ES modules，建議透過本機 HTTP 伺服器開啟，不要直接用 `file://`。

```bash
python3 -m http.server 8000
```

接著開啟：

```text
http://127.0.0.1:8000/youbike-map.html
```

## 專案結構

```text
.
├── README.md
├── README.zh-TW.md
├── LICENSE
├── youbike-map.html       # 頁面結構
├── youbike-map.css        # 視覺樣式與響應式版面
├── youbike-map.js         # 應用入口、初始化與事件綁定
├── youbike-config.js      # API、刷新間隔、地圖初始設定
├── youbike-state.js       # 共用狀態
├── youbike-utils.js       # 資料清理、數字轉換、HTML escaping、debounce
├── youbike-dom.js         # DOM 節點、載入狀態、錯誤狀態
├── youbike-map-view.js    # Leaflet 地圖、圖層、marker、popup、定位、主題
└── youbike-stations.js    # 站點資料載入、篩選、列表、KPI、刷新
```

## 資料來源

即時站點資料來自台北市 YouBike 2.0 公開 JSON：

```text
https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json
```

地圖底圖使用：

- Leaflet
- OpenStreetMap
- CARTO basemap

## 開發備註

- `youbike-map.js` 是入口檔，新增功能時通常先從這裡看事件流程。
- 地圖相關行為集中在 `youbike-map-view.js`。
- 站點資料與 KPI 邏輯集中在 `youbike-stations.js`。
- 若要調整刷新頻率或預設地圖中心，修改 `youbike-config.js`。
- 若要調整版面或手機顯示，修改 `youbike-map.css`。
