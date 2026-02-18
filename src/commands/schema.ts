import type { Command } from "commander";
import * as path from "node:path";
import { error } from "../output.js";

const SCHEMA_DIR = path.resolve(import.meta.dir, "../schemas/generated");

const SERIES_TYPES = [
	"bar", "line", "pie", "scatter", "radar", "funnel",
	"gauge", "treemap", "boxplot", "heatmap", "candlestick", "sankey",
];

const COMPONENT_TYPES = [
	"title", "tooltip", "grid", "xAxis", "yAxis", "legend",
	"dataZoom", "visualMap", "toolbox", "dataset", "radar-coord", "polar", "geo",
];

const ALL_TYPES = [...SERIES_TYPES, ...COMPONENT_TYPES];

export function registerSchema(program: Command): void {
	program
		.command("schema")
		.description("Output JSON schema for a chart type")
		.argument("[type]", "Chart type (bar, line, pie, etc.) or omit for full option schema")
		.option("--list", "List available chart types")
		.action(async (type, opts) => {
			if (opts.list) {
				process.stdout.write("Series:\n");
				for (const t of SERIES_TYPES) {
					process.stdout.write(`  ${t}\n`);
				}
				process.stdout.write("\nComponents:\n");
				for (const t of COMPONENT_TYPES) {
					process.stdout.write(`  ${t}\n`);
				}
				process.stdout.write("\nUse 'charts schema <name>' or 'charts schema' for full option.\n");
				return;
			}

			const name = type ?? "full";

			if (name !== "full" && !ALL_TYPES.includes(name)) {
				error(`Unknown type: "${name}". Use --list to see available types.`);
				process.exit(1);
			}

			const filePath = path.join(SCHEMA_DIR, `${name}.json`);
			const file = Bun.file(filePath);

			if (!(await file.exists())) {
				error(`Schema file not found: ${filePath}. Run the schema generator first.`);
				process.exit(1);
			}

			process.stdout.write(await file.text());
		});
}
