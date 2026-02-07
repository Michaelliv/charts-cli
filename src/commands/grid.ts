import type { Command } from "commander";
import { error, info } from "../output.js";

interface SvgDimensions {
	width: number;
	height: number;
	content: string;
}

function extractSvgDimensions(svg: string): SvgDimensions {
	const widthMatch = svg.match(/width="(\d+(?:\.\d+)?)"/);
	const heightMatch = svg.match(/height="(\d+(?:\.\d+)?)"/);
	const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);

	let width = 800;
	let height = 400;

	if (viewBoxMatch) {
		const parts = viewBoxMatch[1].split(/\s+/).map(Number);
		if (parts.length === 4) {
			width = parts[2];
			height = parts[3];
		}
	}

	if (widthMatch) width = Number(widthMatch[1]);
	if (heightMatch) height = Number(heightMatch[1]);

	// Strip the outer <svg> wrapper to get inner content
	const innerContent = svg.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

	return { width, height, content: innerContent };
}

export function registerGrid(program: Command): void {
	program
		.command("grid")
		.description("Tile multiple SVG files into a grid layout")
		.argument("<files...>", "SVG files to tile")
		.requiredOption("--cols <n>", "Number of columns")
		.option("-o, --output <file>", "Output file (default: stdout)")
		.option("-W, --width <n>", "Total width in pixels")
		.option("-H, --height <n>", "Total height in pixels")
		.option("--gap <px>", "Gap between cells in pixels", "20")
		.action(async (files: string[], opts) => {
			try {
				const cols = Number(opts.cols);
				const gap = Number(opts.gap);

				if (cols < 1 || !Number.isInteger(cols)) {
					throw new Error("--cols must be a positive integer");
				}

				// Read all SVG files
				const svgs: SvgDimensions[] = [];
				for (const file of files) {
					const content = await Bun.file(file).text();
					svgs.push(extractSvgDimensions(content));
				}

				if (svgs.length === 0) {
					throw new Error("No SVG files provided.");
				}

				const rows = Math.ceil(svgs.length / cols);

				// Determine cell size
				const maxCellWidth = Math.max(...svgs.map((s) => s.width));
				const maxCellHeight = Math.max(...svgs.map((s) => s.height));

				const totalWidth = opts.width ? Number(opts.width) : maxCellWidth * cols + gap * (cols - 1);
				const totalHeight = opts.height
					? Number(opts.height)
					: maxCellHeight * rows + gap * (rows - 1);

				const cellWidth = (totalWidth - gap * (cols - 1)) / cols;
				const cellHeight = (totalHeight - gap * (rows - 1)) / rows;

				// Build composite SVG
				let inner = "";
				for (let i = 0; i < svgs.length; i++) {
					const col = i % cols;
					const row = Math.floor(i / cols);
					const x = col * (cellWidth + gap);
					const y = row * (cellHeight + gap);
					const svg = svgs[i];

					inner += `<svg x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" viewBox="0 0 ${svg.width} ${svg.height}">\n`;
					inner += svg.content;
					inner += "\n</svg>\n";
				}

				const output = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">\n${inner}</svg>`;

				if (opts.output) {
					await Bun.write(opts.output, output);
					info(`Grid saved to ${opts.output}`);
				} else {
					process.stdout.write(output);
				}
			} catch (e: unknown) {
				error(e instanceof Error ? e.message : String(e));
				process.exit(1);
			}
		});
}
