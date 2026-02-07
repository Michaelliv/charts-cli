import type { ParsedData } from "../types.js";
import { parseCSVFile, parseCSVString } from "./csv.js";
import { parseInline } from "./inline.js";
import { parseJSON, parseJSONFile } from "./json.js";
import { readStdin } from "./stdin.js";

interface ResolveOptions {
	data?: string;
	csv?: string;
	json?: string;
	x?: string;
	y?: string;
}

export async function resolveData(opts: ResolveOptions): Promise<ParsedData> {
	// 1. Inline positional data
	if (opts.data) {
		return parseInline(opts.data);
	}

	// 2. CSV file via --csv flag
	if (opts.csv) {
		return parseCSVFile(opts.csv, opts.x, opts.y);
	}

	// 3. JSON file via --json flag
	if (opts.json) {
		return parseJSONFile(opts.json, opts.x, opts.y);
	}

	// 4. Stdin
	const stdinData = await readStdin();
	if (!stdinData) {
		throw new Error(
			"No data provided. Pass inline data, --csv <file>, --json <file>, or pipe via stdin.",
		);
	}

	// Try JSON first
	if (stdinData.startsWith("[") || stdinData.startsWith("{")) {
		try {
			return parseJSON(stdinData);
		} catch {
			// fall through to CSV
		}
	}

	// Try CSV (has header + rows)
	if (stdinData.includes(",") || stdinData.includes("\t")) {
		return parseCSVString(stdinData, opts.x, opts.y);
	}

	// Last resort: treat as inline
	return parseInline(stdinData);
}
