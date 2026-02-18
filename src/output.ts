import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import chalk from "chalk";

export async function writeSVG(svg: string, outputPath?: string, format?: string): Promise<void> {
	const isPng = format === "png" || outputPath?.endsWith(".png");

	if (isPng) {
		const resvg = new Resvg(svg);
		const pngData = resvg.render();
		const pngBuffer = pngData.asPng();

		if (outputPath) {
			writeFileSync(outputPath, pngBuffer);
			info(`Chart saved to ${outputPath}`);
		} else {
			process.stdout.write(pngBuffer);
		}
		return;
	}

	if (outputPath) {
		writeFileSync(outputPath, svg);
		info(`Chart saved to ${outputPath}`);
	} else {
		process.stdout.write(svg);
	}
}

export function info(msg: string): void {
	process.stderr.write(`${chalk.blue("ℹ")} ${msg}\n`);
}

export function success(msg: string): void {
	process.stderr.write(`${chalk.green("✔")} ${msg}\n`);
}

export function warn(msg: string): void {
	process.stderr.write(`${chalk.yellow("⚠")} ${msg}\n`);
}

export function error(msg: string): void {
	process.stderr.write(`${chalk.red("✖")} ${msg}\n`);
}
