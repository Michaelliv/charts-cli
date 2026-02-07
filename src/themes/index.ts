import darkTheme from "./dark.json";
import vintageTheme from "./vintage.json";

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
		const themeData = await Bun.file(name).json();
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
