import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { readStdin } from "../parsers/stdin.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

interface HeatmapData {
	xLabels: string[];
	yLabels: string[];
	data: [number, number, number][];
}

function parseHeatmapJSON(input: string): HeatmapData {
	const parsed = JSON.parse(input);

	// Format 1: { xLabels, yLabels, data: [[x,y,value],...] }
	if (parsed.xLabels && parsed.yLabels && parsed.data) {
		return {
			xLabels: parsed.xLabels,
			yLabels: parsed.yLabels,
			data: parsed.data,
		};
	}

	// Format 2: plain [[x, y, value], ...] — auto-detect labels
	if (Array.isArray(parsed) && Array.isArray(parsed[0]) && parsed[0].length >= 3) {
		const xSet = new Set<number>();
		const ySet = new Set<number>();
		for (const item of parsed) {
			xSet.add(item[0]);
			ySet.add(item[1]);
		}
		const xLabels = [...xSet].sort((a, b) => a - b).map(String);
		const yLabels = [...ySet].sort((a, b) => a - b).map(String);
		return { xLabels, yLabels, data: parsed };
	}

	// Format 3: 2D grid [[1,2,3],[4,5,6]] — rows are y, cols are x
	if (Array.isArray(parsed) && Array.isArray(parsed[0]) && typeof parsed[0][0] === "number") {
		const data: [number, number, number][] = [];
		for (let y = 0; y < parsed.length; y++) {
			for (let x = 0; x < parsed[y].length; x++) {
				data.push([x, y, parsed[y][x]]);
			}
		}
		const xLabels = Array.from({ length: parsed[0].length }, (_, i) => String(i));
		const yLabels = Array.from({ length: parsed.length }, (_, i) => String(i));
		return { xLabels, yLabels, data };
	}

	throw new Error(
		"Unsupported heatmap format. Expected: {xLabels, yLabels, data}, [[x,y,val],...], or 2D grid [[1,2],[3,4]]",
	);
}

export function registerHeatmap(program: Command): void {
	program
		.command("heatmap")
		.description("Generate a heatmap chart")
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--min <n>", "Min value for color scale")
		.option("--max <n>", "Max value for color scale")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (opts) => {
			try {
				const theme = await resolveTheme(opts.theme);

				const stdinData = await readStdin();
				if (!stdinData) {
					throw new Error(
						'Heatmap requires JSON via stdin.\nExamples:\n  echo \'[[1,2],[3,4]]\' | charts heatmap\n  echo \'{"xLabels":["A","B"],"yLabels":["X","Y"],"data":[[0,0,5],[1,0,10]]}\' | charts heatmap',
					);
				}

				const heatmap = parseHeatmapJSON(stdinData);

				const allValues = heatmap.data.map((d) => d[2]);
				const minVal = opts.min !== undefined ? Number(opts.min) : Math.min(...allValues);
				const maxVal = opts.max !== undefined ? Number(opts.max) : Math.max(...allValues);

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {
						position: "top" as const,
					},
					xAxis: {
						type: "category" as const,
						data: heatmap.xLabels,
						splitArea: { show: true },
					},
					yAxis: {
						type: "category" as const,
						data: heatmap.yLabels,
						splitArea: { show: true },
					},
					visualMap: {
						min: minVal,
						max: maxVal,
						calculable: true,
						orient: "horizontal" as const,
						left: "center",
						bottom: 10,
					},
					series: [
						{
							type: "heatmap" as const,
							data: heatmap.data,
							label: { show: true },
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
