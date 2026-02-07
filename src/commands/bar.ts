import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { resolveData } from "../parsers/index.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

interface SeriesSpec {
	name: string;
	data: Map<string, number>;
}

function parseSeries(specs: string[]): { categories: string[]; series: SeriesSpec[] } {
	const allLabels = new Set<string>();
	const seriesList: SeriesSpec[] = [];

	for (const spec of specs) {
		const firstColon = spec.indexOf(":");
		if (firstColon === -1) {
			throw new Error(
				`Invalid --series format: "${spec}". Expected "Name:Label1:val1,Label2:val2"`,
			);
		}
		const name = spec.slice(0, firstColon);
		const remainder = spec.slice(firstColon + 1);
		const data = new Map<string, number>();

		for (const token of remainder.split(",")) {
			const colonIdx = token.indexOf(":");
			if (colonIdx === -1) {
				throw new Error(`Invalid token in --series: "${token}". Expected "Label:value"`);
			}
			const label = token.slice(0, colonIdx);
			const value = Number(token.slice(colonIdx + 1));
			if (Number.isNaN(value)) {
				throw new Error(`Invalid value in --series: "${token}"`);
			}
			data.set(label, value);
			allLabels.add(label);
		}

		seriesList.push({ name, data });
	}

	const categories = [...allLabels];
	return { categories, series: seriesList };
}

interface ColorRule {
	threshold: number;
	color: string;
}

function parseColorRules(specs: string[]): ColorRule[] {
	return specs.map((spec) => {
		const colonIdx = spec.indexOf(":");
		if (colonIdx === -1) {
			throw new Error(`Invalid color spec: "${spec}". Expected "threshold:color"`);
		}
		return {
			threshold: Number(spec.slice(0, colonIdx)),
			color: spec.slice(colonIdx + 1),
		};
	});
}

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

export function registerBar(program: Command): void {
	program
		.command("bar")
		.description("Generate a bar chart")
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
		.option("--horizontal", "Horizontal bar chart")
		.option("--series <spec>", 'Multi-series: "Name:Label1:val1,Label2:val2"', collect, [])
		.option("--stack", "Stack series")
		.option("--labels", "Show value labels on bars")
		.option("--ref <spec>", 'Reference line: "value:label"', collect, [])
		.option("--color-above <spec>", 'Color above threshold: "threshold:color"', collect, [])
		.option("--color-below <spec>", 'Color below threshold: "threshold:color"', collect, [])
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (data, opts) => {
			try {
				const theme = await resolveTheme(opts.theme);
				const isHorizontal = opts.horizontal ?? false;
				const seriesSpecs: string[] = opts.series;
				const refSpecs: string[] = opts.ref;
				const colorAboveSpecs: string[] = opts.colorAbove;
				const colorBelowSpecs: string[] = opts.colorBelow;

				let categories: string[];
				// biome-ignore lint/suspicious/noExplicitAny: ECharts series config is complex
				let seriesData: any[];

				if (seriesSpecs.length > 0) {
					// Multi-series mode
					const multi = parseSeries(seriesSpecs);
					categories = multi.categories;
					seriesData = multi.series.map((s) => ({
						type: "bar" as const,
						name: s.name,
						data: categories.map((label) => s.data.get(label) ?? 0),
						stack: opts.stack ? "total" : undefined,
					}));
				} else {
					// Single-series mode
					const parsed = await resolveData({
						data,
						csv: opts.csv,
						json: opts.json,
						x: opts.x,
						y: opts.y,
					});
					categories = parsed.labels;

					let barData: (number | { value: number; itemStyle: { color: string } })[] = parsed.values;

					// Conditional coloring
					if (colorBelowSpecs.length > 0 || colorAboveSpecs.length > 0) {
						const belowRules = parseColorRules(colorBelowSpecs);
						const aboveRules = parseColorRules(colorAboveSpecs);

						barData = parsed.values.map((v) => {
							let color: string | undefined;
							for (const rule of belowRules) {
								if (v < rule.threshold) color = rule.color;
							}
							for (const rule of aboveRules) {
								if (v > rule.threshold) color = rule.color;
							}
							if (color) {
								return { value: v, itemStyle: { color } };
							}
							return v;
						});
					}

					seriesData = [
						{
							type: "bar" as const,
							data: barData,
							stack: opts.stack ? "total" : undefined,
						},
					];
				}

				// Value labels
				if (opts.labels) {
					for (const s of seriesData) {
						s.label = {
							show: true,
							position: isHorizontal ? "right" : "top",
						};
					}
				}

				// Reference lines on first series
				if (refSpecs.length > 0) {
					seriesData[0].markLine = {
						data: parseRefLines(refSpecs),
					};
				}

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {},
					legend: seriesSpecs.length > 0 ? {} : undefined,
					xAxis: isHorizontal
						? { type: "value" as const }
						: { type: "category" as const, data: categories },
					yAxis: isHorizontal
						? { type: "category" as const, data: categories }
						: { type: "value" as const },
					series: seriesData,
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
