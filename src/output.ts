import chalk from "chalk";

export function info(msg: string): void {
	process.stderr.write(`${chalk.blue("ℹ")} ${msg}\n`);
}

export function error(msg: string): void {
	process.stderr.write(`${chalk.red("✖")} ${msg}\n`);
}
