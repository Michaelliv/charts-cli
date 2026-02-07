import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { resolveData } from "../parsers/index.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

export function registerScatter(program: Command): void {
	program
		.command("scatter")
		.description("Generate a scatter plot")
		.argument("[data]", 'Inline data: "10 20 35 15 42"')
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--csv <file>", "CSV file path")
		.option("--json <file>", "JSON file path (array of objects)")
		.option("--x <column>", "CSV/JSON column for x-axis")
		.option("--y <column>", "CSV/JSON column for y-axis")
		.option("--symbol-size <n>", "Symbol size in pixels", "10")
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

				// For scatter, create [index, value] pairs
				const scatterData = parsed.values.map((v, i) => [i, v]);

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {},
					xAxis: {
						type: "value" as const,
					},
					yAxis: {
						type: "value" as const,
					},
					series: [
						{
							type: "scatter" as const,
							data: scatterData,
							symbolSize: Number(opts.symbolSize),
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
