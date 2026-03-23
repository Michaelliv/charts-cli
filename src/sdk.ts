import { Resvg } from "@resvg/resvg-js";
import { renderToSVG } from "./render.js";
import { listThemes, resolveTheme } from "./themes/index.js";

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
	};
}
