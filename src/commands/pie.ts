import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { resolveData } from "../parsers/index.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

export function registerPie(program: Command): void {
	program
		.command("pie")
		.description("Generate a pie chart")
		.argument("[data]", 'Inline data: "Chrome:65 Firefox:20 Safari:15"')
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--csv <file>", "CSV file path")
		.option("--json <file>", "JSON file path (array of objects)")
		.option("--x <column>", "CSV/JSON column for labels")
		.option("--y <column>", "CSV/JSON column for values")
		.option("--donut", "Render as a donut chart")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.option("--rose", "Render as a rose/nightingale chart")
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

				const pieData = parsed.labels.map((name, i) => ({
					name,
					value: parsed.values[i],
				}));

				const radius = opts.donut ? ["40%", "70%"] : opts.rose ? ["20%", "70%"] : "70%";

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {},
					series: [
						{
							type: "pie" as const,
							radius,
							roseType: opts.rose ? ("area" as const) : undefined,
							data: pieData,
							label: {
								show: true,
								formatter: "{b}: {d}%",
							},
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
