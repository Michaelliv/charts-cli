#!/usr/bin/env bun
import { Command } from "commander";
import { registerBar } from "./commands/bar.js";
import { registerBoxplot } from "./commands/boxplot.js";
import { registerCandlestick } from "./commands/candlestick.js";
import { registerFunnel } from "./commands/funnel.js";
import { registerGauge } from "./commands/gauge.js";
import { registerGrid } from "./commands/grid.js";
import { registerHeatmap } from "./commands/heatmap.js";
import { registerLine } from "./commands/line.js";
import { registerOnboard } from "./commands/onboard.js";
import { registerPie } from "./commands/pie.js";
import { registerRadar } from "./commands/radar.js";
import { registerSankey } from "./commands/sankey.js";
import { registerScatter } from "./commands/scatter.js";
import { registerTreemap } from "./commands/treemap.js";

const program = new Command();

program.name("charts").description("Generate SVG charts from the command line").version("0.1.0");

registerBar(program);
registerLine(program);
registerPie(program);
registerScatter(program);
registerRadar(program);
registerFunnel(program);
registerGauge(program);
registerTreemap(program);
registerBoxplot(program);
registerHeatmap(program);
registerCandlestick(program);
registerSankey(program);
registerGrid(program);
registerOnboard(program);

program.parse();
