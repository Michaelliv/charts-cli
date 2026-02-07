import type { ParsedData } from "../types.js";

export function parseInline(input: string): ParsedData {
	const tokens = input.trim().split(/\s+/);

	// Check if tokens are key:value pairs
	const hasLabels = tokens.some((t) => t.includes(":"));

	if (hasLabels) {
		const labels: string[] = [];
		const values: number[] = [];
		for (const token of tokens) {
			const colonIdx = token.indexOf(":");
			if (colonIdx === -1) continue;
			const label = token.slice(0, colonIdx);
			const value = Number(token.slice(colonIdx + 1));
			if (label && !Number.isNaN(value)) {
				labels.push(label);
				values.push(value);
			}
		}
		return { labels, values };
	}

	// Plain numbers — generate index labels
	const values = tokens.map(Number).filter((n) => !Number.isNaN(n));
	const labels = values.map((_, i) => String(i + 1));
	return { labels, values };
}
