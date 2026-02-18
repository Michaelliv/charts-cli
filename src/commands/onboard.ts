import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import chalk from "chalk";

const INSTRUCTIONS = `
<charts>
Render any ECharts configuration to SVG/PNG. You provide raw ECharts JSON, the CLI renders it. No browser needed.

<workflow>
1. \`charts schema <type>\` - Get the JSON schema for a chart type (bar, line, pie, etc.)
2. Build a valid ECharts JSON option using the schema
3. \`charts render\` - Render the option to SVG/PNG via stdin or --config file
</workflow>

<commands>
- \`charts schema --list\` - List available schema types (series + components)
- \`charts schema bar\` - JSON schema for bar series options
- \`charts schema xAxis\` - JSON schema for xAxis component
- \`charts schema\` - Full EChartsOption schema (top-level keys)
- \`charts render --config option.json -o chart.svg\` - Render from file
- \`echo '{"xAxis":{...},"series":[...]}' | charts render -o chart.png\` - Render from stdin
</commands>

<render-options>
\`-o <file>\` output path (default: stdout), \`-W <n>\` width (default: 800), \`-H <n>\` height (default: 400), \`--theme <name>\` (dark, vintage, or JSON path), \`--format <svg|png>\` (auto-detected from extension).
</render-options>

<output>
- No \`-o\` sends SVG to stdout (pipeable)
- \`-o file.svg\` writes SVG file
- \`-o file.png\` or \`--format png\` writes PNG file
</output>

<example>
echo '{
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [120, 200, 150] }]
}' | charts render -o chart.png
</example>
</charts>
`.trim();

const MARKER = "<charts>";

export function registerOnboard(program: Command): void {
	program
		.command("onboard")
		.description("Add charts-cli instructions to your agent config")
		.action(() => {
			const cwd = process.cwd();
			const claudeDir = join(cwd, ".claude");
			const claudeMd = join(claudeDir, "CLAUDE.md");
			const agentsMd = join(cwd, "AGENTS.md");

			// Find target: prefer existing AGENTS.md, then .claude/CLAUDE.md
			let targetFile: string;
			if (existsSync(agentsMd)) {
				targetFile = agentsMd;
			} else if (existsSync(claudeMd)) {
				targetFile = claudeMd;
			} else {
				targetFile = claudeMd;
			}

			let existingContent = "";
			if (existsSync(targetFile)) {
				existingContent = readFileSync(targetFile, "utf-8");
			}

			// Idempotent
			if (existingContent.includes(MARKER)) {
				console.log(chalk.green("✓"), "Already onboarded");
				console.log(chalk.dim(`  ${targetFile}`));
				return;
			}

			// Ensure directory exists
			const targetDir = join(targetFile, "..");
			if (!existsSync(targetDir)) {
				mkdirSync(targetDir, { recursive: true });
			}

			if (existingContent) {
				writeFileSync(targetFile, `${existingContent.trimEnd()}\n\n${INSTRUCTIONS}\n`);
			} else {
				writeFileSync(targetFile, `${INSTRUCTIONS}\n`);
			}

			console.log(chalk.green("✓"), `Added charts-cli instructions to ${chalk.bold(targetFile)}`);
			console.log();
			console.log(chalk.dim("Your agent now knows how to use charts!"));
		});
}
