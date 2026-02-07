import type { ParsedData } from "../types.js";

export async function parseJSONFile(
	filePath: string,
	xField?: string,
	yField?: string,
): Promise<ParsedData> {
	const data = await Bun.file(filePath).json();

	if (!Array.isArray(data)) {
		throw new Error("JSON file must contain an array of objects.");
	}

	if (xField && yField) {
		const labels = data.map((item: Record<string, unknown>) => String(item[xField]));
		const values = data.map((item: Record<string, unknown>) => Number(item[yField]));
		return { labels, values };
	}

	// Fall back to existing parseJSON logic with stringified data
	return parseJSON(JSON.stringify(data));
}

export function parseJSON(input: string): ParsedData {
	const data = JSON.parse(input);

	// Simple array of numbers: [10, 20, 35]
	if (Array.isArray(data) && data.every((v) => typeof v === "number")) {
		return {
			labels: data.map((_: number, i: number) => String(i + 1)),
			values: data,
		};
	}

	// Array of {name, value} objects: [{name: "Jan", value: 10}, ...]
	if (
		Array.isArray(data) &&
		data.every((v) => typeof v === "object" && v !== null && "name" in v && "value" in v)
	) {
		return {
			labels: data.map((d: { name: string }) => String(d.name)),
			values: data.map((d: { value: number }) => Number(d.value)),
		};
	}

	// Object map: {"Jan": 10, "Feb": 20}
	if (typeof data === "object" && data !== null && !Array.isArray(data)) {
		const labels = Object.keys(data);
		const values = labels.map((k) => Number(data[k]));
		return { labels, values };
	}

	throw new Error("Unsupported JSON format. Expected: number[], {name,value}[], or {key: number}");
}
