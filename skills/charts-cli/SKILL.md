---
name: charts
description: Generate SVG/PNG charts (bar, line, pie, scatter, radar, heatmap, funnel, gauge, sankey, etc.) from ECharts JSON configs
---

# Charts CLI

Generate charts from the command line using ECharts. No browser needed.

## Setup (one-time in container)

```bash
npm install -g charts-cli
```

## Usage

### List available chart types

```bash
charts schema --list
```

### Get schema for a chart type

```bash
charts schema bar
charts schema pie
charts schema xAxis
```

### Render a chart

```bash
# Pipe JSON config
echo '<json>' | charts render -o /workspace/scratch/chart.png

# From file
charts render --config option.json -o /workspace/scratch/chart.png
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output path (.svg or .png) |
| `-W, --width <n>` | Width in pixels (default: 800) |
| `-H, --height <n>` | Height in pixels (default: 400) |
| `--theme <name>` | `dark`, `vintage`, or path to JSON |
| `--format <type>` | `svg` or `png` (auto-detected from extension) |

### Supported chart types

bar, line, pie, scatter, radar, funnel, gauge, treemap, boxplot, heatmap, candlestick, sankey

## Visual Style Rules

**Always apply these defaults** to every chart config for clean, modern output.

### Global defaults

- **`backgroundColor: "#ffffff"`** — mandatory; without it PNGs are transparent and unreadable on dark viewers
- **Title**: `left: "center"`, `top: 14`, `fontSize: 16`, `fontWeight: "bold"`, `color: "#111827"`
- **Grid**: `{ left: 60, right: 32, top: 60, bottom: 48 }` — increase `top` to ~80 when using both title and legend
- **Color palette** (use in order): `#4f46e5`, `#0d9488`, `#d97706`, `#dc2626`, `#7c3aed`, `#0891b2`
- **Area fill RGBA** (0.10 opacity): `rgba(79,70,229,0.10)`, `rgba(13,148,136,0.10)`, `rgba(217,119,6,0.10)`, `rgba(220,38,38,0.10)`, `rgba(124,58,237,0.10)`, `rgba(8,145,178,0.10)`

### Axis styling (for charts that use xAxis/yAxis)

- **xAxis (category)**: `axisTick.show: false`, axisLine color `#d1d5db`, axisLabel color `#4b5563` fontSize 13
- **yAxis (value)**: `axisLine.show: false`, `axisTick.show: false`, axisLabel color `#9ca3af` fontSize 12, splitLine dashed `#e5e7eb`

### Bar

- `barWidth: "50%"`, rounded top corners `borderRadius: [5,5,0,0]`
- Value labels on top: `label.show: true`, `position: "top"`, color `#1f2937`, fontSize 13, fontWeight bold

### Line

- `smooth: true` for modern curves; omit for angular data
- `symbol: "circle"`, `symbolSize: 7`, lineStyle width 3
- White-bordered data points: `itemStyle.borderColor: "#ffffff"`, `borderWidth: 2`
- **Single series**: area fill at ~0.15 opacity; `boundaryGap: false` on xAxis
- **Multi-series**: no area fill (overlaps too much), explicit color per series, add legend at `top: 42`
- No value labels — they clutter curves

### Pie / donut

- No `grid`, `xAxis`, `yAxis`. Use `center: ["50%","55%"]`, render with `-W 800 -H 500`
- White borders between segments: `borderColor: "#ffffff"`, `borderWidth: 2`, `borderRadius: 4`
- Labels: `formatter: "{b}  {d}%"`, color `#374151`, fontSize 13; labelLine color `#d1d5db`, length 16/20
- `emphasis.itemStyle.shadowBlur: 0` — flat look, no hover shadow
- Set `color` array on the series directly (no axis to carry it)
- **Donut**: `radius: ["40%","65%"]`, bump `borderWidth: 3`, `borderRadius: 6`
- **Donut center label**: `title` as array; second element with `left/top: "center"`, large fontSize, `subtext` for descriptor
- **Legend layout** (many slices): `orient: "vertical"`, `right: 24`, `top: "middle"`, hide labels, shift `center` to `["38%","55%"]`

### Scatter

- Both axes `type: "value"` (not category)
- `symbolSize: 8`, `itemStyle.opacity: 0.7` to handle overlap
- Use `xAxis.name` / `yAxis.name` to label axes

### Radar

- Uses `radar` component (not xAxis/yAxis) with `indicator` array: `[{name, max}, ...]`
- `shape: "polygon"`, `center: ["50%","55%"]`, `radius: "60%"`
- `areaStyle.opacity: 0.3` for overlapping multi-series comparison
- Render with `-W 800 -H 500`

### Funnel

- No axes. `sort: "descending"`, `gap: 2`, `width: "70%"`, `height: "75%"`
- White borders: `borderColor: "#ffffff"`, `borderWidth: 3`
- Labels inside: `position: "inside"`, white text, `formatter: "{b}: {c}"`
- Assign color per data item via `itemStyle.color`
- Render with `-W 800 -H 500`

### Gauge

- No axes. Modern arc style: `progress.show: true`, `pointer.show: false`
- Track: `axisLine.lineStyle.width: 24`, color `[[1, "#e5e7eb"]]`; progress width matches
- Hide ticks, splitLines, axisLabels for clean look
- Center value: `detail.formatter: "{value}%"`, fontSize 48, fontWeight bold, color `#111827`
- Subtitle via `title.offsetCenter: [0, "50%"]`, fontSize 14, color `#6b7280`
- **Multi-range**: `axisLine.lineStyle.color: [[0.3, "#22c55e"], [0.7, "#d97706"], [1, "#dc2626"]]`
- Render with `-W 800 -H 500`

### Heatmap

- Both axes `type: "category"`. Data as `[x, y, value]` triples (indices into axis arrays)
- Requires `visualMap`: `type: "continuous"`, `inRange.color` array of 3–5 colors for gradient (e.g. `["#e0f2fe","#7dd3fc","#0ea5e9","#0369a1","#1e3a8a"]`)
- Cell labels: `label.show: true`, fontSize 11, fontWeight bold
- White borders: `borderColor: "#ffffff"`, `borderWidth: 2`
- Increase `grid.right: 120` to make room for visualMap legend

### Sankey

- No axes. Position with `left/right/top/bottom` on the series
- Data: `data` array (nodes with `name` + `itemStyle.color`) and `links` array (`source`, `target`, `value`)
- `lineStyle.opacity: 0.25` — semi-transparent flows prevent clutter
- `nodeWidth: 20`, `nodeGap: 14`
- Labels: `position: "right"`, color `#374151`, fontSize 13
- Render with `-W 800 -H 500`

### Treemap

- No axes. Position with `width/height/left/top` on the series. `roam: false`, `breadcrumb.show: false`
- Hierarchical data: `[{name, itemStyle.color, children: [{name, value}, ...]}, ...]`
- White borders: `borderWidth: 3`, `gapWidth: 3`
- Use `levels` array for depth-specific styling — wider gaps at top level, smaller borders for leaves
- Labels: white text over colored backgrounds, `formatter: "{b}"`
- Assign color per top-level category; children inherit
- Render with `-W 800 -H 500`

### Boxplot

- Standard category xAxis (group names) + value yAxis
- Data: `[min, Q1, median, Q3, max]` per group
- `boxWidth: ["40%","70%"]`, fill color `#4f46e5`
- Dark borders: `borderColor: "#111827"`, `borderWidth: 1.5`

### Candlestick

- Standard category xAxis (dates) + value yAxis
- Data: `[open, close, low, high]` per candle
- Green up / red down: `color: "#10b981"`, `color0: "#ef4444"`, darker borders `#059669` / `#dc2626`
- **`yAxis.scale: true`** — essential; without it axis starts at 0 and candles become slivers

## Reference example

Shows how the global defaults, axis styling, and bar series rules compose into a complete config:

```json
{
  "backgroundColor": "#ffffff",
  "title": {
    "text": "Monthly Revenue (k$)",
    "textStyle": { "fontSize": 16, "fontWeight": "bold", "color": "#111827" },
    "left": "center",
    "top": 14
  },
  "grid": { "left": 60, "right": 32, "top": 60, "bottom": 48 },
  "xAxis": {
    "type": "category",
    "data": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "axisTick": { "show": false },
    "axisLine": { "lineStyle": { "color": "#d1d5db" } },
    "axisLabel": { "color": "#4b5563", "fontSize": 13 }
  },
  "yAxis": {
    "type": "value",
    "axisLine": { "show": false },
    "axisTick": { "show": false },
    "axisLabel": { "color": "#9ca3af", "fontSize": 12 },
    "splitLine": { "lineStyle": { "type": "dashed", "color": "#e5e7eb" } }
  },
  "series": [{
    "type": "bar",
    "data": [10, 20, 35, 28, 42, 38],
    "barWidth": "50%",
    "itemStyle": { "borderRadius": [5, 5, 0, 0], "color": "#4f46e5" },
    "label": { "show": true, "position": "top", "color": "#1f2937", "fontSize": 13, "fontWeight": "bold" }
  }]
}
```

## Workflow

1. Use `charts schema <type>` to check the config format
2. Build the ECharts JSON option, applying the visual style rules above
3. Pipe it to `charts render -o /workspace/scratch/chart.png`
4. Use the `attach` tool to send the image to Slack
