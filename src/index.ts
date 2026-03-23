// SDK — primary public API
export { createCharts } from "./sdk.js";
export type { Charts, ChartOptions } from "./sdk.js";

// Core — for advanced use
export { renderToSVG } from "./render.js";
export { resolveTheme, listThemes } from "./themes/index.js";
