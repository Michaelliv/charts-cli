import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Command } from "commander";
import { error, info } from "../output.js";
import { createCharts } from "../sdk.js";

export function registerRender(program: Command): void {
	program
		.command("render")
		.description("Render a chart from raw ECharts JSON option")
		.option("--config <file>", "Path to JSON file containing ECharts option")
		.option("-o, --output <file>", "Output file (default: stdout)")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (opts) => {
			try {
				const jsonStr = await readInput(opts.config);
				if (!jsonStr) {
					error("No input provided. Use --config <file> or pipe JSON to stdin.");
					process.exit(1);
				}

				let echartsOption: Record<string, unknown>;
				try {
					echartsOption = JSON.parse(jsonStr);
				} catch {
					error("Invalid JSON input.");
					process.exit(1);
				}

				const charts = createCharts();
				const chartOpts = {
					width: Number(opts.width),
					height: Number(opts.height),
					theme: opts.theme,
				};

				const isPng = opts.format === "png" || opts.output?.endsWith(".png");

				if (isPng) {
					const png = await charts.toPNG(echartsOption, chartOpts);
					if (opts.output) {
						writeFileSync(opts.output, png);
						info(`Chart saved to ${opts.output}`);
					} else {
						process.stdout.write(png);
					}
				} else {
					const svg = await charts.toSVG(echartsOption, chartOpts);
					if (opts.output) {
						writeFileSync(opts.output, svg);
						info(`Chart saved to ${opts.output}`);
					} else {
						process.stdout.write(svg);
					}
				}
			} catch (e: unknown) {
				error(e instanceof Error ? e.message : String(e));
				process.exit(1);
			}
		});
}

async function readInput(configPath?: string): Promise<string | null> {
	if (configPath) {
		if (!existsSync(configPath)) {
			error(`File not found: ${configPath}`);
			process.exit(1);
		}
		return readFileSync(configPath, "utf-8");
	}

	if (!process.stdin.isTTY) {
		const chunks: Buffer[] = [];
		for await (const chunk of process.stdin) {
			chunks.push(Buffer.from(chunk));
		}
		if (chunks.length > 0) {
			return Buffer.concat(chunks).toString("utf-8").trim();
		}
	}

	return null;
}
