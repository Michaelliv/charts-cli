import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Command } from "commander";

const INSTRUCTIONS = `
<charts>
Use \`charts\` to generate SVG/PNG charts from the command line. No browser needed — outputs clean SVG to stdout or file.

<commands>
- \`charts bar "Jan:10 Feb:20 Mar:35"\` - Bar chart
- \`charts line "10 20 35" --smooth --area\` - Line chart
- \`charts pie "Chrome:65 Firefox:20" --donut\` - Pie chart
- \`charts scatter "5 12 28 15 42"\` - Scatter plot
- \`charts radar "Speed:80 Def:90" --fill\` - Radar chart
- \`charts funnel "Visit:100 Cart:60"\` - Funnel chart
- \`charts gauge 73 --label "CPU %"\` - Gauge chart
- \`charts treemap "JS:40 Go:15"\` - Treemap
- \`charts boxplot "2 5 7 12 20 35"\` - Boxplot
- \`echo '[[1,2],[3,4]]' | charts heatmap\` - Heatmap (JSON stdin)
- \`echo '[[20,34,10,38]]' | charts candlestick\` - Candlestick (JSON stdin)
- \`echo '[{"source":"A","target":"B","value":10}]' | charts sankey\` - Sankey (JSON stdin)
- \`charts grid --cols 2 a.svg b.svg -o grid.svg\` - Tile SVGs into a grid
</commands>

<data-input>
- Inline key:value: \`"Jan:10 Feb:20 Mar:35"\`
- Inline numbers: \`"10 20 35"\` (auto-indexed)
- CSV file: \`--csv data.csv --x date --y revenue\`
- JSON file: \`--json data.json --x name --y value\`
- Stdin pipe: \`cat data.csv | charts line --x date --y revenue\`
- JSON stdin: \`echo '[10, 20, 35]' | charts line\`
</data-input>

<common-options>
All commands support: \`-o <file>\`, \`-t <title>\`, \`-W <width>\`, \`-H <height>\`, \`--theme <name>\`, \`--format <svg|png>\`.
</common-options>

<advanced-options>
- Multi-series grouped bars: \`--series "Name:Label1:val1,Label2:val2"\` (repeatable)
- Stacked bars/lines: \`--stack\`
- Value labels: \`--labels\` (bar and line)
- Reference lines: \`--ref "value:label"\` (repeatable, bar and line)
- Conditional coloring (bar): \`--color-above "threshold:color"\` \`--color-below "threshold:color"\`
- Grid/small multiples: \`charts grid --cols 2 --gap 20 a.svg b.svg c.svg d.svg -o dashboard.svg\`
</advanced-options>

<output>
- No \`-o\` flag → SVG to stdout (pipeable: \`charts bar "..." | pbcopy\`)
- \`-o file.svg\` → writes SVG to file
- \`-o file.png\` or \`--format png\` → writes PNG to file
- Built-in themes: \`dark\`, \`vintage\`, or pass a path to a custom JSON theme
</output>
</charts>
`.trim();

const MARKER = "<charts>";
const MARKER_END = "</charts>";

export function registerOnboard(program: Command): void {
	program
		.command("onboard")
		.description("Add charts-cli instructions to ~/.claude/CLAUDE.md")
		.action(() => {
			const claudeDir = join(homedir(), ".claude");
			const claudeMd = join(claudeDir, "CLAUDE.md");

			if (!existsSync(claudeDir)) {
				mkdirSync(claudeDir, { recursive: true });
			}

			let existingContent = "";
			if (existsSync(claudeMd)) {
				existingContent = readFileSync(claudeMd, "utf-8");
			}

			// Also check for legacy markdown marker
			const legacyMarker = "## Charts CLI (charts)";
			const hasLegacy = existingContent.includes(legacyMarker);
			const hasNew = existingContent.includes(MARKER);

			if (hasNew) {
				// Replace existing <charts>...</charts> block
				const startIdx = existingContent.indexOf(MARKER);
				const endIdx = existingContent.indexOf(MARKER_END);
				if (endIdx !== -1) {
					const before = existingContent.slice(0, startIdx).trimEnd();
					const after = existingContent.slice(endIdx + MARKER_END.length);
					const newContent = before
						? `${before}\n\n${INSTRUCTIONS}\n${after}`
						: `${INSTRUCTIONS}\n${after}`;
					writeFileSync(claudeMd, newContent);
				}
				console.log(`✓ Updated charts-cli instructions in ${claudeMd}`);
				console.log();
				console.log("Your agent is up to date!");
				return;
			}

			if (hasLegacy) {
				// Replace legacy ## Charts CLI block with new <charts> format
				const markerIdx = existingContent.indexOf(legacyMarker);
				const afterMarker = existingContent.indexOf("\n## ", markerIdx + legacyMarker.length);
				const before = existingContent.slice(0, markerIdx).trimEnd();
				const after = afterMarker !== -1 ? existingContent.slice(afterMarker) : "";
				const newContent = before
					? `${before}\n\n${INSTRUCTIONS}\n${after}`
					: `${INSTRUCTIONS}\n${after}`;
				writeFileSync(claudeMd, newContent);
				console.log(`✓ Migrated charts-cli instructions to new format in ${claudeMd}`);
				console.log();
				console.log("Your agent is up to date!");
				return;
			}

			if (existingContent) {
				const newContent = `${existingContent.trimEnd()}\n\n${INSTRUCTIONS}\n`;
				writeFileSync(claudeMd, newContent);
			} else {
				writeFileSync(claudeMd, `${INSTRUCTIONS}\n`);
			}

			console.log(`✓ Added charts-cli instructions to ${claudeMd}`);
			console.log();
			console.log("Your agent now knows how to use charts!");
			console.log();
		});
}
