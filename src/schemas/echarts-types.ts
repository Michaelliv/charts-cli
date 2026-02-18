/**
 * Wrapper file for extracting ECharts types into JSON schemas.
 * Local aliases to avoid "multiple definitions" errors.
 */
import type {
	BarSeriesOption,
	BoxplotSeriesOption,
	CandlestickSeriesOption,
	DataZoomComponentOption,
	DatasetComponentOption,
	FunnelSeriesOption,
	GaugeSeriesOption,
	GeoComponentOption,
	GridComponentOption,
	HeatmapSeriesOption,
	LegendComponentOption,
	LineSeriesOption,
	PieSeriesOption,
	PolarComponentOption,
	RadarComponentOption,
	RadarSeriesOption,
	SankeySeriesOption,
	ScatterSeriesOption,
	// Components
	TitleComponentOption,
	ToolboxComponentOption,
	TooltipComponentOption,
	TreemapSeriesOption,
	VisualMapComponentOption,
	XAXisComponentOption,
	YAXisComponentOption,
} from "echarts/types/src/export/option.js";

import type { EChartsOption } from "echarts";

// Series types
export type BarSchema = BarSeriesOption;
export type LineSchema = LineSeriesOption;
export type PieSchema = PieSeriesOption;
export type ScatterSchema = ScatterSeriesOption;
export type RadarSchema = RadarSeriesOption;
export type FunnelSchema = FunnelSeriesOption;
export type GaugeSchema = GaugeSeriesOption;
export type TreemapSchema = TreemapSeriesOption;
export type BoxplotSchema = BoxplotSeriesOption;
export type HeatmapSchema = HeatmapSeriesOption;
export type CandlestickSchema = CandlestickSeriesOption;
export type SankeySchema = SankeySeriesOption;

// Component types
export type TitleSchema = TitleComponentOption;
export type TooltipSchema = TooltipComponentOption;
export type GridSchema = GridComponentOption;
export type XAxisSchema = XAXisComponentOption;
export type YAxisSchema = YAXisComponentOption;
export type LegendSchema = LegendComponentOption;
export type DataZoomSchema = DataZoomComponentOption;
export type VisualMapSchema = VisualMapComponentOption;
export type ToolboxSchema = ToolboxComponentOption;
export type DatasetSchema = DatasetComponentOption;
export type RadarCoordSchema = RadarComponentOption;
export type PolarSchema = PolarComponentOption;
export type GeoSchema = GeoComponentOption;

// Full option
export type FullOptionSchema = EChartsOption;
