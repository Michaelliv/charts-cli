import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { resolveData } from "../parsers/index.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

export function registerFunnel(program: Command): void {
	program
		.command("funnel")
		.description("Generate a funnel chart")
		.argument("[data]", 'Inline data: "Visit:100 Cart:80 Checkout:60 Purchase:40"')
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--csv <file>", "CSV file path")
		.option("--json <file>", "JSON file path (array of objects)")
		.option("--x <column>", "CSV/JSON column for stage names")
		.option("--y <column>", "CSV/JSON column for values")
		.option("--sort <order>", "Sort order: descending, ascending, or none", "descending")
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

				const funnelData = parsed.labels.map((name, i) => ({
					name,
					value: parsed.values[i],
				}));

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {
						trigger: "item" as const,
						formatter: "{b}: {c}",
					},
					series: [
						{
							type: "funnel" as const,
							left: "10%",
							top: opts.title ? 60 : 20,
							bottom: 20,
							width: "80%",
							sort: opts.sort as "descending" | "ascending" | "none",
							gap: 2,
							label: {
								show: true,
								position: "inside" as const,
							},
							data: funnelData,
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
