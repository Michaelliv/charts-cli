import type { ParsedData, ParsedXY } from "../types.js";

function parseCSVRows(text: string): string[][] {
	const lines = text.split(/\r?\n/).filter((l) => l.trim());
	const rows: string[][] = [];

	for (const line of lines) {
		const cells: string[] = [];
		let current = "";
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (inQuotes) {
				if (ch === '"' && line[i + 1] === '"') {
					current += '"';
					i++;
				} else if (ch === '"') {
					inQuotes = false;
				} else {
					current += ch;
				}
			} else {
				if (ch === '"') {
					inQuotes = true;
				} else if (ch === "," || ch === "\t") {
					cells.push(current.trim());
					current = "";
				} else {
					current += ch;
				}
			}
		}
		cells.push(current.trim());
		rows.push(cells);
	}

	return rows;
}

export async function parseCSVFile(
	filePath: string,
	xCol?: string,
	yCol?: string,
): Promise<ParsedData> {
	const text = await Bun.file(filePath).text();
	return parseCSVString(text, xCol, yCol);
}

export function parseCSVString(text: string, xCol?: string, yCol?: string): ParsedData {
	const rows = parseCSVRows(text);
	if (rows.length < 2) throw new Error("CSV must have at least a header row and one data row");

	const headers = rows[0];
	const dataRows = rows.slice(1);

	const xIdx = xCol ? headers.indexOf(xCol) : 0;
	const yIdx = yCol ? headers.indexOf(yCol) : 1;

	if (xCol && xIdx === -1)
		throw new Error(`Column "${xCol}" not found. Available: ${headers.join(", ")}`);
	if (yCol && yIdx === -1)
		throw new Error(`Column "${yCol}" not found. Available: ${headers.join(", ")}`);

	const labels: string[] = [];
	const values: number[] = [];

	for (const row of dataRows) {
		if (row.length <= Math.max(xIdx, yIdx)) continue;
		labels.push(row[xIdx]);
		const val = Number(row[yIdx]);
		if (!Number.isNaN(val)) values.push(val);
		else values.push(0);
	}

	return { labels, values };
}
