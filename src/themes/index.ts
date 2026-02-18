import { readFileSync } from "node:fs";
import darkTheme from "./dark.json" with { type: "json" };
import vintageTheme from "./vintage.json" with { type: "json" };

const builtInThemes: Record<string, object> = {
	dark: darkTheme,
	vintage: vintageTheme,
};

export async function resolveTheme(name?: string): Promise<object | undefined> {
	if (!name) return undefined;

	// Built-in theme
	if (name in builtInThemes) {
		return builtInThemes[name];
	}

	// Custom theme file
	try {
		const themeData = JSON.parse(readFileSync(name, "utf-8"));
		return themeData;
	} catch {
		throw new Error(
			`Theme "${name}" not found. Built-in themes: ${Object.keys(builtInThemes).join(", ")}. Or pass a path to a JSON theme file.`,
		);
	}
}

export function listThemes(): string[] {
	return Object.keys(builtInThemes);
}
