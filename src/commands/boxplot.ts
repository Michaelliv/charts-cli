import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { readStdin } from "../parsers/stdin.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

function computeBoxplotStats(data: number[]): [number, number, number, number, number] {
	const sorted = [...data].sort((a, b) => a - b);
	const n = sorted.length;

	const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

	const lowerHalf = sorted.slice(0, Math.floor(n / 2));
	const upperHalf = sorted.slice(Math.ceil(n / 2));

	const q1 =
		lowerHalf.length % 2 === 0
			? (lowerHalf[lowerHalf.length / 2 - 1] + lowerHalf[lowerHalf.length / 2]) / 2
			: lowerHalf[Math.floor(lowerHalf.length / 2)];

	const q3 =
		upperHalf.length % 2 === 0
			? (upperHalf[upperHalf.length / 2 - 1] + upperHalf[upperHalf.length / 2]) / 2
			: upperHalf[Math.floor(upperHalf.length / 2)];

	const iqr = q3 - q1;
	const min = Math.max(sorted[0], q1 - 1.5 * iqr);
	const max = Math.min(sorted[n - 1], q3 + 1.5 * iqr);

	return [min, q1, median, q3, max];
}

export function registerBoxplot(program: Command): void {
	program
		.command("boxplot")
		.description("Generate a boxplot chart")
		.argument("[data]", 'Inline data: space-separated numbers "1 2 3 4 5 6 7 8 9 10"')
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--horizontal", "Horizontal boxplot")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (data, opts) => {
			try {
				const theme = await resolveTheme(opts.theme);

				let datasets: number[][] = [];

				if (data) {
					// Single inline dataset
					const nums = data
						.trim()
						.split(/\s+/)
						.map(Number)
						.filter((n: number) => !Number.isNaN(n));
					if (nums.length < 5) throw new Error("Boxplot needs at least 5 data points.");
					datasets = [nums];
				} else {
					// Read from stdin — expect JSON: [[1,2,3,...], [4,5,6,...]] or [1,2,3,...]
					const stdinData = await readStdin();
					if (!stdinData)
						throw new Error("No data provided. Pass inline numbers or pipe JSON via stdin.");
					const parsed = JSON.parse(stdinData);
					if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
						datasets = parsed;
					} else if (Array.isArray(parsed)) {
						datasets = [parsed];
					} else {
						throw new Error("Expected JSON array of numbers or array of arrays.");
					}
				}

				const boxData = datasets.map(computeBoxplotStats);
				const labels = datasets.length === 1 ? ["Data"] : datasets.map((_, i) => `Series ${i + 1}`);

				const isHorizontal = opts.horizontal ?? false;

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {},
					xAxis: isHorizontal
						? { type: "value" as const }
						: { type: "category" as const, data: labels },
					yAxis: isHorizontal
						? { type: "category" as const, data: labels }
						: { type: "value" as const },
					series: [
						{
							type: "boxplot" as const,
							data: boxData,
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
