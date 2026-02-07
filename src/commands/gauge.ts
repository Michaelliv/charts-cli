import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

export function registerGauge(program: Command): void {
	program
		.command("gauge")
		.description("Generate a gauge chart")
		.argument("<value>", "The gauge value (number)")
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--min <n>", "Minimum value", "0")
		.option("--max <n>", "Maximum value", "100")
		.option("--label <text>", "Label shown below the value")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (value, opts) => {
			try {
				const theme = await resolveTheme(opts.theme);
				const numValue = Number(value);

				if (Number.isNaN(numValue)) {
					throw new Error(`Invalid gauge value: "${value}". Must be a number.`);
				}

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					series: [
						{
							type: "gauge" as const,
							min: Number(opts.min),
							max: Number(opts.max),
							detail: {
								formatter: "{value}",
								fontSize: 24,
							},
							data: [
								{
									value: numValue,
									name: opts.label ?? "",
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
