import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { resolveData } from "../parsers/index.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

function parseRefLines(
	specs: string[],
): { yAxis: number; name: string; label: { formatter: string } }[] {
	return specs.map((spec) => {
		const colonIdx = spec.indexOf(":");
		if (colonIdx === -1) {
			throw new Error(`Invalid --ref format: "${spec}". Expected "value:label"`);
		}
		const value = Number(spec.slice(0, colonIdx));
		const label = spec.slice(colonIdx + 1);
		return { yAxis: value, name: label, label: { formatter: label } };
	});
}

function collect(val: string, prev: string[]): string[] {
	prev.push(val);
	return prev;
}

export function registerLine(program: Command): void {
	program
		.command("line")
		.description("Generate a line chart")
		.argument("[data]", 'Inline data: "Jan:10 Feb:20 Mar:35" or "10 20 35"')
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--csv <file>", "CSV file path")
		.option("--json <file>", "JSON file path (array of objects)")
		.option("--x <column>", "CSV/JSON column for x-axis labels")
		.option("--y <column>", "CSV/JSON column for y-axis values")
		.option("--smooth", "Smooth the line")
		.option("--area", "Fill area under the line")
		.option("--stack", "Stack series (for area charts)")
		.option("--labels", "Show value labels on points")
		.option("--ref <spec>", 'Reference line: "value:label"', collect, [])
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
				const refSpecs: string[] = opts.ref;

				// biome-ignore lint/suspicious/noExplicitAny: ECharts series config is complex
				const series: any = {
					type: "line" as const,
					data: parsed.values,
					smooth: opts.smooth ?? false,
					areaStyle: opts.area ? {} : undefined,
					stack: opts.stack ? "total" : undefined,
				};

				if (opts.labels) {
					series.label = { show: true, position: "top" };
				}

				if (refSpecs.length > 0) {
					series.markLine = {
						data: parseRefLines(refSpecs),
					};
				}

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {},
					xAxis: {
						type: "category" as const,
						data: parsed.labels,
					},
					yAxis: {
						type: "value" as const,
					},
					series: [series],
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
