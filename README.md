# charts-cli

Generate SVG/PNG charts from the command line. No browser needed.

```bash
bun add -g charts-cli
```

## Quick Start

```bash
charts bar "Jan:10 Feb:20 Mar:35" -o chart.svg
charts line "10 20 35 28 42" --smooth --area -o trend.png
charts pie "Chrome:65 Firefox:20 Safari:15" --donut -o browsers.svg
```

## Charts

| Command | Example |
|---------|---------|
| `bar` | `charts bar "Jan:10 Feb:20 Mar:35"` |
| `line` | `charts line "10 20 35" --smooth --area` |
| `pie` | `charts pie "Chrome:65 Firefox:20" --donut` |
| `scatter` | `charts scatter "5 12 28 15 42"` |
| `radar` | `charts radar "Speed:80 Def:90" --fill` |
| `funnel` | `charts funnel "Visit:100 Cart:60"` |
| `gauge` | `charts gauge 73 --label "CPU %"` |
| `treemap` | `charts treemap "JS:40 Go:15"` |
| `boxplot` | `charts boxplot "2 5 7 12 20 35"` |
| `heatmap` | `echo '[[1,2],[3,4]]' \| charts heatmap` |
| `candlestick` | `echo '[[20,34,10,38]]' \| charts candlestick` |
| `sankey` | `echo '[{"source":"A","target":"B","value":10}]' \| charts sankey` |
| `grid` | `charts grid --cols 2 a.svg b.svg -o dash.svg` |

## Data Input

```bash
# Inline key:value pairs
charts bar "Jan:10 Feb:20 Mar:35"

# Inline numbers (auto-indexed)
charts line "10 20 35"

# CSV file
charts bar --csv data.csv --x date --y revenue

# JSON file
charts bar --json results.json --x model --y score

# Stdin
cat data.csv | charts line --x date --y revenue
echo '[10, 20, 35]' | charts line
```

## Advanced Features

### Multi-series Grouped Bars

```bash
charts bar \
  --series "2024:React:47,Vue:28,Svelte:18" \
  --series "2025:React:42,Vue:25,Svelte:26" \
  --title "Framework Adoption"
```

### Stacked Bars

```bash
charts bar \
  --series "Critical:AWS:2,GCP:5,Azure:8" \
  --series "High:AWS:7,GCP:12,Azure:15" \
  --stack --labels
```

### Reference Lines

```bash
charts bar "Opus:0 Sonnet:1 Haiku:3" --ref "0:Perfect Score"
charts line "10 25 18 30 22 35" --ref "20:Average"
```

### Value Labels

```bash
charts bar "A:10 B:20 C:30" --labels
charts line "10 20 35" --labels --smooth
```

### Conditional Coloring

```bash
charts bar "Claude:98 GPT:91 Gemini:87 Llama:72" \
  --color-above "89:#4ade80" \
  --color-below "75:#f87171" \
  --labels
```

### Grid / Small Multiples

Generate charts separately, then tile them:

```bash
charts bar "A:10 B:20" -o left.svg
charts line "10 20 30" -o right.svg
charts grid --cols 2 --gap 20 left.svg right.svg -o dashboard.svg
```

## Output

```bash
# SVG to stdout (pipeable)
charts bar "A:10 B:20" | pbcopy

# SVG to file
charts bar "A:10 B:20" -o chart.svg

# PNG to file (auto-detected from extension)
charts bar "A:10 B:20" -o chart.png

# PNG with explicit format
charts bar "A:10 B:20" --format png -o chart.png
```

## Common Options

All commands support:

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file (default: stdout) |
| `-t, --title <title>` | Chart title |
| `-W, --width <n>` | Width in pixels (default: 800) |
| `-H, --height <n>` | Height in pixels (default: 400) |
| `--theme <name>` | `dark`, `vintage`, or path to JSON theme |
| `--format <type>` | `svg` or `png` (auto-detected from extension) |
| `--csv <file>` | CSV file input |
| `--json <file>` | JSON file input |
| `--x <column>` | Column for labels |
| `--y <column>` | Column for values |

## Claude Code Integration

```bash
charts onboard
```

Adds charts-cli instructions to `~/.claude/CLAUDE.md` so your AI agent knows how to generate charts.

## License

MIT
