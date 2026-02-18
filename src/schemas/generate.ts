#!/usr/bin/env bun
import * as path from "node:path";
/**
 * Generate compact JSON schemas from ECharts TypeScript types.
 * Uses the TypeScript compiler API directly to walk types and extract
 * property names + basic type info — no $ref, no transitive resolution.
 */
import * as ts from "typescript";

const TYPES_FILE = path.resolve(import.meta.dir, "echarts-types.ts");
const OUT_DIR = path.resolve(import.meta.dir, "generated");

const SERIES_TYPES: Record<string, string> = {
	bar: "BarSchema",
	line: "LineSchema",
	pie: "PieSchema",
	scatter: "ScatterSchema",
	radar: "RadarSchema",
	funnel: "FunnelSchema",
	gauge: "GaugeSchema",
	treemap: "TreemapSchema",
	boxplot: "BoxplotSchema",
	heatmap: "HeatmapSchema",
	candlestick: "CandlestickSchema",
	sankey: "SankeySchema",
};

const COMPONENT_TYPES: Record<string, string> = {
	title: "TitleSchema",
	tooltip: "TooltipSchema",
	grid: "GridSchema",
	xAxis: "XAxisSchema",
	yAxis: "YAxisSchema",
	legend: "LegendSchema",
	dataZoom: "DataZoomSchema",
	visualMap: "VisualMapSchema",
	toolbox: "ToolboxSchema",
	dataset: "DatasetSchema",
	"radar-coord": "RadarCoordSchema",
	polar: "PolarSchema",
	geo: "GeoSchema",
	full: "FullOptionSchema",
};

interface SimpleSchema {
	type: string;
	description?: string;
	properties?: Record<string, SimpleSchema>;
	items?: SimpleSchema;
	enum?: (string | number)[];
	anyOf?: SimpleSchema[];
}

/** Check if a type is primitive (string, number, boolean) or a string/number literal */
function isPrimitive(type: ts.Type): boolean {
	const flags = type.getFlags();
	return !!(
		flags & ts.TypeFlags.String ||
		flags & ts.TypeFlags.Number ||
		flags & ts.TypeFlags.Boolean ||
		flags & ts.TypeFlags.BooleanLiteral ||
		flags & ts.TypeFlags.StringLiteral ||
		flags & ts.TypeFlags.NumberLiteral ||
		flags & ts.TypeFlags.Undefined ||
		flags & ts.TypeFlags.Null ||
		flags & ts.TypeFlags.Void
	);
}

/** Get the simple type name for a primitive */
function primitiveTypeName(type: ts.Type): string {
	const flags = type.getFlags();
	if (flags & ts.TypeFlags.String || flags & ts.TypeFlags.StringLiteral) return "string";
	if (flags & ts.TypeFlags.Number || flags & ts.TypeFlags.NumberLiteral) return "number";
	if (flags & ts.TypeFlags.Boolean || flags & ts.TypeFlags.BooleanLiteral) return "boolean";
	if (flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)) return "null";
	return "unknown";
}

/** Known wrapper object method names to detect String.prototype, Number.prototype etc. */
const WRAPPER_METHODS = new Set([
	"toString",
	"valueOf",
	"charAt",
	"charCodeAt",
	"concat",
	"indexOf",
	"lastIndexOf",
	"localeCompare",
	"match",
	"replace",
	"search",
	"slice",
	"split",
	"substring",
	"toLowerCase",
	"toUpperCase",
	"trim",
	"toFixed",
	"toPrecision",
	"toExponential",
]);

function isWrapperObject(type: ts.Type): boolean {
	const props = type.getProperties();
	if (props.length < 3) return false;
	let wrapperCount = 0;
	for (const p of props.slice(0, 10)) {
		if (WRAPPER_METHODS.has(p.getName())) wrapperCount++;
	}
	return wrapperCount >= 3;
}

/** At depth limit, produce a compact summary: basic type + child prop names for objects */
function summarizeType(type: ts.Type, checker: ts.TypeChecker): SimpleSchema {
	if (isPrimitive(type)) return { type: primitiveTypeName(type) };
	if (checker.isArrayType(type)) return { type: "array" };
	if (isWrapperObject(type)) return { type: "string" };

	// Handle unions at summary level
	if (type.isUnion()) {
		const realTypes = type.types.filter(
			(t) => !(t.getFlags() & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)),
		);

		// Literal enums
		const literals = realTypes.filter((t) => t.isStringLiteral() || t.isNumberLiteral());
		if (literals.length === realTypes.length && literals.length > 0) {
			return {
				type: literals[0].isStringLiteral() ? "string" : "number",
				enum: literals.map((t) =>
					t.isStringLiteral() ? t.value : (t as ts.NumberLiteralType).value,
				),
			};
		}

		const typeNames = new Set<string>();
		for (const t of realTypes) {
			if (isPrimitive(t)) typeNames.add(primitiveTypeName(t));
			else if (checker.isArrayType(t)) typeNames.add("array");
			else if (t.getCallSignatures().length > 0) typeNames.add("function");
			else if (isWrapperObject(t)) typeNames.add("string");
			else typeNames.add("object");
		}
		const names = [...typeNames];
		if (names.length === 0) return { type: "any" };
		if (names.length === 1 && names[0] === "object") {
			// Union of objects — get common props
			const props = type.getProperties().filter((p) => !p.getName().startsWith("_"));
			if (props.length > 0) {
				const propNames = props.map((p) => p.getName()).join(", ");
				return { type: "object", description: `Props: ${propNames}` };
			}
		}
		return { type: names.join(" | ") };
	}

	if (checker.isArrayType(type)) return { type: "array" };
	if (type.getCallSignatures().length > 0) return { type: "function" };

	// Object with properties — list prop names in description
	const properties = type
		.getProperties()
		.filter((p) => !p.getName().startsWith("_") && !p.getName().startsWith("$"));
	if (properties.length > 0) {
		const propNames = properties.map((p) => p.getName()).join(", ");
		return { type: "object", description: `Props: ${propNames}` };
	}

	return { type: "object" };
}

function typeToSchema(
	type: ts.Type,
	checker: ts.TypeChecker,
	depth: number,
	seen: Set<number>,
): SimpleSchema {
	const typeId = (type as any).id ?? 0;

	// Prevent infinite recursion
	if (depth > 0 || seen.has(typeId)) {
		return summarizeType(type, checker);
	}
	seen.add(typeId);

	// Primitives first — before anything else
	if (isPrimitive(type)) {
		return { type: primitiveTypeName(type) };
	}

	// Handle union types
	if (type.isUnion()) {
		// Filter out null/undefined from union
		const realTypes = type.types.filter(
			(t) => !(t.getFlags() & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)),
		);

		// Check if it's a string/number literal union (enum-like)
		const literals = realTypes.filter((t) => t.isStringLiteral() || t.isNumberLiteral());
		if (literals.length === realTypes.length && literals.length > 0) {
			return {
				type: literals[0].isStringLiteral() ? "string" : "number",
				enum: literals.map((t) =>
					t.isStringLiteral() ? t.value : (t as ts.NumberLiteralType).value,
				),
			};
		}

		// If the union has common properties (e.g. PlainLegend | ScrollableLegend),
		// treat it as an object and extract the shared properties
		const commonProps = type.getProperties();
		if (
			commonProps.length > 0 &&
			realTypes.every(
				(t) => !isPrimitive(t) && !checker.isArrayType(t) && t.getCallSignatures().length === 0,
			)
		) {
			const props: Record<string, SimpleSchema> = {};
			for (const prop of commonProps) {
				const name = prop.getName();
				if (name.startsWith("_") || name.startsWith("$")) continue;
				const propType = checker.getTypeOfSymbol(prop);
				props[name] = typeToSchema(propType, checker, depth + 1, new Set(seen));
				const jsdoc = ts.displayPartsToString(prop.getDocumentationComment(checker));
				if (jsdoc) {
					const existing = props[name].description;
					props[name].description = existing ? `${jsdoc}. ${existing}` : jsdoc;
				}
			}
			return { type: "object", properties: props };
		}

		// Mixed union — collect basic type names
		const typeNames = new Set<string>();
		for (const t of realTypes) {
			if (isPrimitive(t)) {
				typeNames.add(primitiveTypeName(t));
			} else if (checker.isArrayType(t)) {
				typeNames.add("array");
			} else if (t.getCallSignatures().length > 0) {
				typeNames.add("function");
			} else if (isWrapperObject(t)) {
				// String/Number wrapper — treat as primitive
				const str = checker.typeToString(t);
				if (str.includes("String") || str === "string") typeNames.add("string");
				else if (str.includes("Number") || str === "number") typeNames.add("number");
				else typeNames.add("object");
			} else {
				typeNames.add("object");
			}
		}
		const names = [...typeNames];
		if (names.length === 0) return { type: "any" };
		if (names.length === 1) return { type: names[0] };
		return { type: names.join(" | ") };
	}

	// Handle array types
	if (checker.isArrayType(type)) {
		const typeArgs = (type as ts.TypeReference).typeArguments;
		if (typeArgs?.[0]) {
			return { type: "array", items: typeToSchema(typeArgs[0], checker, depth + 1, new Set(seen)) };
		}
		return { type: "array" };
	}

	// Function types — skip details
	const callSignatures = type.getCallSignatures();
	if (callSignatures.length > 0) {
		return { type: "function" };
	}

	// Detect wrapper objects (String.prototype methods, etc.) and treat as primitive
	if (isWrapperObject(type)) {
		return { type: "string" };
	}

	// Object types — recurse into properties
	const properties = type.getProperties();
	if (properties.length > 0) {
		const props: Record<string, SimpleSchema> = {};
		for (const prop of properties) {
			const name = prop.getName();
			if (name.startsWith("_") || name.startsWith("$")) continue;

			const propType = checker.getTypeOfSymbol(prop);
			props[name] = typeToSchema(propType, checker, depth + 1, new Set(seen));

			const jsdoc = ts.displayPartsToString(prop.getDocumentationComment(checker));
			if (jsdoc) {
				const existing = props[name].description;
				props[name].description = existing ? `${jsdoc}. ${existing}` : jsdoc;
			}
		}
		return { type: "object", properties: props };
	}

	return { type: checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation) };
}

async function main() {
	console.log("Compiling ECharts types...");

	const program = ts.createProgram([TYPES_FILE], {
		strictNullChecks: false,
		skipLibCheck: true,
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
	});

	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(TYPES_FILE);
	if (!sourceFile) {
		console.error("Could not load types file");
		process.exit(1);
	}

	// Find all exported type aliases
	const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile)!);
	const typeMap = new Map<string, ts.Type>();
	for (const exp of exports) {
		const type = checker.getDeclaredTypeOfSymbol(exp);
		typeMap.set(exp.getName(), type);
	}

	async function generateSchema(
		name: string,
		typeName: string,
		category: "series" | "component" | "full",
	) {
		process.stdout.write(`  ${name}...`);

		const type = typeMap.get(typeName);
		if (!type) {
			console.log(" NOT FOUND");
			return;
		}

		const symbol = checker.getSymbolAtLocation(sourceFile!)!;
		const exportSymbol = checker.getExportsOfModule(symbol).find((s) => s.getName() === typeName);
		let resolvedType = type;
		if (exportSymbol) {
			const declarations = exportSymbol.getDeclarations();
			if (declarations?.[0]) {
				resolvedType = checker.getTypeAtLocation(declarations[0]);
			}
		}

		const schema = typeToSchema(resolvedType, checker, 0, new Set());

		let title: string;
		let description: string;
		if (category === "full") {
			title = "ECharts option";
			description = "Top-level ECharts option. Pass to: charts render --config <file>";
		} else if (category === "series") {
			title = `ECharts ${name} series`;
			description = `${name} series config. Use in: { series: [{ type: "${name}", ... }] }`;
		} else {
			title = `ECharts ${name} component`;
			description = `${name} component config. Use as top-level key in ECharts option.`;
		}

		const output = {
			$schema: "http://json-schema.org/draft-07/schema#",
			title,
			description,
			...schema,
		};

		const json = JSON.stringify(output, null, 2);
		const outPath = path.join(OUT_DIR, `${name}.json`);
		await Bun.write(outPath, json);
		console.log(` ${(Buffer.byteLength(json) / 1024).toFixed(1)}KB`);
	}

	console.log("\nSeries:");
	for (const [name, typeName] of Object.entries(SERIES_TYPES)) {
		await generateSchema(name, typeName, "series");
	}

	console.log("\nComponents:");
	for (const [name, typeName] of Object.entries(COMPONENT_TYPES)) {
		const category = name === "full" ? "full" : "component";
		await generateSchema(name, typeName, category);
	}

	console.log("\nDone!");
}

main();
