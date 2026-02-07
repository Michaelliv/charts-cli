import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { resolveData } from "../parsers/index.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

export function registerRadar(program: Command): void {
	program
		.command("radar")
		.description("Generate a radar/spider chart")
		.argument("[data]", 'Inline data: "Speed:80 Strength:70 Defense:90 Magic:60"')
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--csv <file>", "CSV file path")
		.option("--json <file>", "JSON file path (array of objects)")
		.option("--x <column>", "CSV/JSON column for indicator names")
		.option("--y <column>", "CSV/JSON column for values")
		.option("--max <n>", "Max value for all indicators (auto-detected if omitted)")
		.option("--shape <type>", "Radar shape: polygon or circle", "polygon")
		.option("--fill", "Fill the radar area")
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

				const maxVal = opts.max ? Number(opts.max) : Math.ceil(Math.max(...parsed.values) * 1.2);

				const indicators = parsed.labels.map((name) => ({
					name,
					max: maxVal,
				}));

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {},
					radar: {
						indicator: indicators,
						shape: opts.shape as "polygon" | "circle",
					},
					series: [
						{
							type: "radar" as const,
							data: [
								{
									value: parsed.values,
									areaStyle: opts.fill ? {} : undefined,
								},
							],
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
