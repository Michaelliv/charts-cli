import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

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
				let jsonStr: string | null = null;

				if (opts.config) {
					const file = Bun.file(opts.config);
					if (!(await file.exists())) {
						error(`File not found: ${opts.config}`);
						process.exit(1);
					}
					jsonStr = await file.text();
				} else if (!process.stdin.isTTY) {
					const chunks: Uint8Array[] = [];
					for await (const chunk of Bun.stdin.stream()) {
						chunks.push(chunk);
					}
					if (chunks.length > 0) {
						jsonStr = new TextDecoder().decode(Buffer.concat(chunks)).trim();
					}
				}

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

				const theme = await resolveTheme(opts.theme);

				const svg = renderToSVG(echartsOption, {
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
