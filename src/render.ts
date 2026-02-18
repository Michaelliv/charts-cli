// @ts-ignore - echarts CJS/ESM interop
import * as echarts from "echarts";

const THEME_REGISTRY_KEY = "__charts_cli_registered__";
const registeredThemes = new Set<string>();

interface RenderOptions {
	width?: number;
	height?: number;
	theme?: object;
}

export function renderToSVG(
	echartsOption: echarts.EChartsOption,
	opts: RenderOptions = {},
): string {
	const width = opts.width ?? 800;
	const height = opts.height ?? 400;

	let themeName: string | undefined;
	if (opts.theme) {
		themeName = `${THEME_REGISTRY_KEY}_${registeredThemes.size}`;
		if (!registeredThemes.has(themeName)) {
			echarts.registerTheme(themeName, opts.theme);
			registeredThemes.add(themeName);
		}
	}

	const chart = echarts.init(null, themeName, {
		renderer: "svg",
		ssr: true,
		width,
		height,
	});

	chart.setOption({
		animation: false,
		...echartsOption,
	});

	const svg = chart.renderToSVGString();
	chart.dispose();

	return svg;
}
