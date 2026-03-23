export const SERIES_TYPES = [
	"bar",
	"line",
	"pie",
	"scatter",
	"radar",
	"funnel",
	"gauge",
	"treemap",
	"boxplot",
	"heatmap",
	"candlestick",
	"sankey",
] as const;

export const COMPONENT_TYPES = [
	"title",
	"tooltip",
	"grid",
	"xAxis",
	"yAxis",
	"legend",
	"dataZoom",
	"visualMap",
	"toolbox",
	"dataset",
	"radar-coord",
	"polar",
	"geo",
] as const;

export type SeriesType = (typeof SERIES_TYPES)[number];
export type ComponentType = (typeof COMPONENT_TYPES)[number];
export type SchemaType = SeriesType | ComponentType | "full";
