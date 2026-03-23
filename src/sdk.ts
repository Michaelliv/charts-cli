import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { renderToSVG } from "./render.js";
import {
	COMPONENT_TYPES,
	type ComponentType,
	SERIES_TYPES,
	type SchemaType,
	type SeriesType,
} from "./schemas/types.js";
import { listThemes, resolveTheme } from "./themes/index.js";

export type { SchemaType, SeriesType, ComponentType } from "./schemas/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.resolve(__dirname, "schemas/generated");

export interface ChartOptions {
	/** SVG width in pixels (default: 800) */
	width?: number;
	/** SVG height in pixels (default: 400) */
	height?: number;
	/** Theme name ("dark", "vintage") or a theme object */
	theme?: string | object;
}

export interface Charts {
	/** Render an ECharts option to SVG string. */
	toSVG(option: Record<string, unknown>, opts?: ChartOptions): Promise<string>;
	/** Render an ECharts option to PNG buffer. */
	toPNG(option: Record<string, unknown>, opts?: ChartOptions): Promise<Buffer>;
	/** List built-in theme names. */
	themes(): string[];
	/** Get JSON schema for a chart type, component, or "full" for the complete EChartsOption. */
	getSchema(type: SchemaType): object;
	/** List available schema types grouped by series and components. */
	listSchemaTypes(): { series: SeriesType[]; components: ComponentType[] };
}

async function resolveThemeOption(theme?: string | object): Promise<object | undefined> {
	if (!theme) return undefined;
	if (typeof theme === "object") return theme;
	return resolveTheme(theme);
}

/**
 * Create a Charts instance.
 *
 * ```ts
 * import { createCharts } from "charts-cli";
 * const charts = createCharts();
 * const svg = await charts.toSVG({ xAxis: {...}, series: [...] });
 * const png = await charts.toPNG({ xAxis: {...}, series: [...] }, { width: 1200 });
 * ```
 */
export function createCharts(): Charts {
	return {
		async toSVG(option, opts = {}) {
			const theme = await resolveThemeOption(opts.theme);
			return renderToSVG(option, {
				width: opts.width,
				height: opts.height,
				theme,
			});
		},

		async toPNG(option, opts = {}) {
			const theme = await resolveThemeOption(opts.theme);
			const svg = renderToSVG(option, {
				width: opts.width,
				height: opts.height,
				theme,
			});
			const resvg = new Resvg(svg);
			const pngData = resvg.render();
			return Buffer.from(pngData.asPng());
		},

		themes() {
			return listThemes();
		},

		getSchema(type) {
			const filePath = path.join(SCHEMA_DIR, `${type}.json`);
			if (!existsSync(filePath)) {
				const all = [...SERIES_TYPES, ...COMPONENT_TYPES, "full"];
				throw new Error(`Unknown schema type: "${type}". Available: ${all.join(", ")}`);
			}
			return JSON.parse(readFileSync(filePath, "utf-8"));
		},

		listSchemaTypes() {
			return { series: [...SERIES_TYPES], components: [...COMPONENT_TYPES] };
		},
	};
}
