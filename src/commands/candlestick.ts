import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { readStdin } from "../parsers/stdin.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

interface CandlestickData {
	labels: string[];
	data: [number, number, number, number][]; // [open, close, low, high]
}

function parseCandlestickJSON(input: string): CandlestickData {
	const parsed = JSON.parse(input);

	// Format 1: { labels, data: [[open,close,low,high],...] }
	if (parsed.labels && parsed.data) {
		return { labels: parsed.labels, data: parsed.data };
	}

	// Format 2: [{ date, open, close, low, high }, ...]
	if (Array.isArray(parsed) && parsed[0]?.open !== undefined) {
		const labels = parsed.map((d: { date?: string }, i: number) => d.date ?? String(i + 1));
		const data = parsed.map(
			(d: { open: number; close: number; low: number; high: number }) =>
				[d.open, d.close, d.low, d.high] as [number, number, number, number],
		);
		return { labels, data };
	}

	// Format 3: [[open, close, low, high], ...]
	if (Array.isArray(parsed) && Array.isArray(parsed[0]) && parsed[0].length === 4) {
		const labels = parsed.map((_: number[], i: number) => String(i + 1));
		return { labels, data: parsed };
	}

	throw new Error(
		"Unsupported candlestick format. Expected:\n" +
			"  {labels, data: [[open,close,low,high],...]}\n" +
			"  [{date,open,close,low,high},...]\n" +
			"  [[open,close,low,high],...]",
	);
}

export function registerCandlestick(program: Command): void {
	program
		.command("candlestick")
		.description("Generate a candlestick (OHLC) chart")
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--up-color <color>", "Color for bullish candles", "#ec0000")
		.option("--down-color <color>", "Color for bearish candles", "#00da3c")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (opts) => {
			try {
				const theme = await resolveTheme(opts.theme);

				const stdinData = await readStdin();
				if (!stdinData) {
					throw new Error(
						"Candlestick requires JSON via stdin.\nExample:\n  echo '[[20,34,10,38],[40,35,30,50]]' | charts candlestick",
					);
				}

				const candle = parseCandlestickJSON(stdinData);

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {
						trigger: "axis" as const,
						axisPointer: { type: "cross" as const },
					},
					xAxis: {
						type: "category" as const,
						data: candle.labels,
					},
					yAxis: {
						type: "value" as const,
						scale: true,
					},
					series: [
						{
							type: "candlestick" as const,
							data: candle.data,
							itemStyle: {
								color: opts.upColor,
								color0: opts.downColor,
								borderColor: opts.upColor,
								borderColor0: opts.downColor,
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
