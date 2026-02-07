export interface ParsedData {
	labels: string[];
	values: number[];
}

export interface ParsedXY {
	x: (string | number)[];
	y: number[];
}

export interface ChartOptions {
	title?: string;
	output?: string;
	width?: number;
	height?: number;
	theme?: string;
}

export interface BarOptions extends ChartOptions {
	horizontal?: boolean;
	stack?: boolean;
}

export interface LineOptions extends ChartOptions {
	smooth?: boolean;
	area?: boolean;
}

export interface PieOptions extends ChartOptions {
	donut?: boolean;
	rose?: boolean;
}

export interface ScatterOptions extends ChartOptions {
	symbolSize?: number;
}

export interface CSVOptions {
	x?: string;
	y?: string;
	csv?: string;
}
