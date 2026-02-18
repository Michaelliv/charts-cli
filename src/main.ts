#!/usr/bin/env node
import { Command } from "commander";
import { registerOnboard } from "./commands/onboard.js";
import { registerRender } from "./commands/render.js";
import { registerSchema } from "./commands/schema.js";

const program = new Command();

program.name("charts").description("Generate SVG charts from the command line").version("0.1.0");

registerRender(program);
registerSchema(program);
registerOnboard(program);

program.parse();
