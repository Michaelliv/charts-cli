import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { resolveData } from "../parsers/index.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

export function registerTreemap(program: Command): void {
	program
		.command("treemap")
		.description("Generate a treemap chart")
		.argument("[data]", 'Inline data: "JS:40 Python:30 Go:15 Rust:15"')
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--csv <file>", "CSV file path")
		.option("--json <file>", "JSON file path (array of objects)")
		.option("--x <column>", "CSV/JSON column for names")
		.option("--y <column>", "CSV/JSON column for values")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (data, opts) => {
			try {
				const parsed = await resolveData({
					data,
					csv: opts.csv,
					json: opts.json,
					x: opts.x,
					y: opts.y,
				});
				const theme = await resolveTheme(opts.theme);

				const treemapData = parsed.labels.map((name, i) => ({
					name,
					value: parsed.values[i],
				}));

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {
						formatter: "{b}: {c}",
					},
					series: [
						{
							type: "treemap" as const,
							top: opts.title ? 40 : 10,
							left: 10,
							right: 10,
							bottom: 10,
							data: treemapData,
							label: {
								show: true,
								formatter: "{b}\n{c}",
								fontSize: 14,
							},
							breadcrumb: { show: false },
						},
					],
				};

				const svg = renderToSVG(option, {
					width: Number(opts.width),
					height: Number(opts.height),
					theme,
				});

				await writeSVG(svg, opts.output, opts.format);
			} catch (e: unknown) {
				error(e instanceof Error ? e.message : String(e));
				process.exit(1);
			}
		});
}
