import type { Command } from "commander";
import { error, writeSVG } from "../output.js";
import { readStdin } from "../parsers/stdin.js";
import { renderToSVG } from "../render.js";
import { resolveTheme } from "../themes/index.js";

interface SankeyData {
	nodes: { name: string }[];
	links: { source: string; target: string; value: number }[];
}

function parseSankeyJSON(input: string): SankeyData {
	const parsed = JSON.parse(input);

	// Format 1: { nodes, links } — direct ECharts format
	if (parsed.nodes && parsed.links) {
		return parsed;
	}

	// Format 2: [{ source, target, value }, ...] — auto-extract nodes
	if (Array.isArray(parsed) && parsed[0]?.source !== undefined) {
		const nodeSet = new Set<string>();
		for (const link of parsed) {
			nodeSet.add(String(link.source));
			nodeSet.add(String(link.target));
		}
		return {
			nodes: [...nodeSet].map((name) => ({ name })),
			links: parsed,
		};
	}

	throw new Error(
		"Unsupported sankey format. Expected:\n" +
			"  {nodes: [{name},...], links: [{source,target,value},...]}\n" +
			"  [{source,target,value},...]",
	);
}

export function registerSankey(program: Command): void {
	program
		.command("sankey")
		.description("Generate a sankey flow diagram")
		.option("-o, --output <file>", "Output SVG file (default: stdout)")
		.option("-t, --title <title>", "Chart title")
		.option("-W, --width <n>", "SVG width in pixels", "800")
		.option("-H, --height <n>", "SVG height in pixels", "400")
		.option("--theme <name>", "Theme name or path to JSON theme")
		.option("--orient <dir>", "Orientation: horizontal or vertical", "horizontal")
		.option("--node-width <n>", "Node width in pixels", "20")
		.option("--node-gap <n>", "Gap between nodes in pixels", "8")
		.option("--format <type>", "Output format: svg or png (auto-detected from extension)")
		.action(async (opts) => {
			try {
				const theme = await resolveTheme(opts.theme);

				const stdinData = await readStdin();
				if (!stdinData) {
					throw new Error(
						'Sankey requires JSON via stdin.\nExample:\n  echo \'[{"source":"A","target":"B","value":10},{"source":"B","target":"C","value":8}]\' | charts sankey',
					);
				}

				const sankey = parseSankeyJSON(stdinData);

				const option = {
					title: opts.title ? { text: opts.title } : undefined,
					tooltip: {
						trigger: "item" as const,
						triggerOn: "mousemove" as const,
					},
					series: [
						{
							type: "sankey" as const,
							orient: opts.orient as "horizontal" | "vertical",
							nodeWidth: Number(opts.nodeWidth),
							nodeGap: Number(opts.nodeGap),
							layoutIterations: 32,
							emphasis: { focus: "adjacency" as const },
							data: sankey.nodes,
							links: sankey.links,
							label: {
								show: true,
								fontSize: 12,
							},
							lineStyle: {
								color: "gradient" as const,
								curveness: 0.5,
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
