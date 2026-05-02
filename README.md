# YouBike 2.0 Taipei Live Map

[中文 README](README.zh-TW.md)

An interactive Taipei YouBike 2.0 real-time station map built with Leaflet. The page reads Taipei City's public live YouBike data and shows available bikes, return slots, high-level KPIs, a station list, and filtering tools.

## Features

- Displays Taipei YouBike 2.0 stations in real time
- Uses marker color and size to represent available bike counts
- Shows total stations, available bikes, return slots, empty stations, and overall bike availability rate
- Supports station name and address search
- Supports filters for all stations, stations with bikes, empty stations, and full stations
- Opens the station popup and moves the map when a station is selected from the list
- Supports dark/light theme switching and remembers the preference
- Supports current-location positioning
- Refreshes data automatically every 60 seconds, with manual refresh support
- Keeps both the map and station search list usable on mobile screens

## Quick Start

This is a static frontend project with no package installation required. Because it uses ES modules, run it through a local HTTP server instead of opening it directly with `file://`.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/youbike-map.html
```

## Project Structure

```text
.
├── README.md
├── README.zh-TW.md
├── LICENSE
├── youbike-map.html       # Page structure
├── youbike-map.css        # Visual styles and responsive layout
├── youbike-map.js         # App entry point, initialization, and event binding
├── youbike-config.js      # API URL, refresh interval, and initial map settings
├── youbike-state.js       # Shared application state
├── youbike-utils.js       # Data cleanup, number conversion, HTML escaping, debounce
├── youbike-dom.js         # DOM references, loading state, and error state
├── youbike-map-view.js    # Leaflet map, layers, markers, popups, location, theme
└── youbike-stations.js    # Station loading, filtering, list rendering, KPIs, refresh
```

## Data Source

Live station data comes from Taipei City's public YouBike 2.0 JSON endpoint:

```text
https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json
```

Map rendering uses:

- Leaflet
- OpenStreetMap
- CARTO basemap

## Development Notes

- `youbike-map.js` is the entry point and the best place to start when tracing event flow.
- Map behavior is grouped in `youbike-map-view.js`.
- Station data and KPI logic are grouped in `youbike-stations.js`.
- Change refresh frequency or the default map center in `youbike-config.js`.
- Change layout, visual style, or mobile behavior in `youbike-map.css`.

