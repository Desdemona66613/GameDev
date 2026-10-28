#!/usr/bin/env node
/**
 * One-command project setup. Cross-platform: plain Node, no shell assumptions,
 * works the same in PowerShell, cmd and bash.
 *
 *   npm run setup
 *
 * Checks the toolchain, installs dependencies, creates .env.local from the
 * example, generates Next's route types, and reports what still needs doing.
 * Safe to run repeatedly — it never overwrites an existing .env.local.
 */

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Windows needs shell:true so `npm` resolves to npm.cmd.
const isWindows = process.platform === "win32";

const c = {
  reset: "\u001b[0m",
  dim: "\u001b[2m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
};

let failed = false;

function step(label) {
  process.stdout.write(`\n${label}\n`);
}

function ok(msg) {
  process.stdout.write(`  ${c.green}✓${c.reset} ${msg}\n`);
}

function warn(msg) {
  process.stdout.write(`  ${c.yellow}!${c.reset} ${msg}\n`);
}

function fail(msg) {
  process.stdout.write(`  ${c.red}✗${c.reset} ${msg}\n`);
  failed = true;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWindows,
  });
  return result.status === 0;
}

// --- 1. Toolchain -----------------------------------------------------------

step("Checking your toolchain");

const required = readFileSync(join(root, ".nvmrc"), "utf8").trim();
const [reqMajor, reqMinor = "0"] = required.split(".");
const [major, minor] = process.versions.node.split(".");

const nodeOk =
  Number(major) > Number(reqMajor) ||
  (Number(major) === Number(reqMajor) && Number(minor) >= Number(reqMinor));

if (nodeOk) {
  ok(`Node ${process.versions.node} (need >= ${required})`);
} else {
  fail(
    `Node ${process.versions.node} is too old. Install >= ${required} from https://nodejs.org`,
  );
}

const pnpmVersion = spawnSync("pnpm", ["--version"], {
  encoding: "utf8",
  shell: isWindows,
});
if (pnpmVersion.status === 0) {
  ok(`pnpm ${pnpmVersion.stdout.trim()}`);
} else {
  fail(
    "pnpm not found on PATH. Install it with:  npm install -g pnpm\n" +
      "    (or `corepack enable pnpm` if you prefer corepack)",
  );
}

if (failed) {
  process.stdout.write(`\n${c.red}Fix the above and run again.${c.reset}\n`);
  process.exit(1);
}

// --- 2. Dependencies --------------------------------------------------------

step("Installing dependencies");

// --frozen-lockfile is the reproducible install: it follows pnpm-lock.yaml
// exactly and fails if the lockfile has drifted from package.json.
if (!run("pnpm", ["install", "--frozen-lockfile"])) {
  fail(
    "pnpm install failed. If the lockfile is out of date, run `pnpm install`.",
  );
  process.exit(1);
}
ok("Dependencies installed from pnpm-lock.yaml");

// --- 3. Environment ---------------------------------------------------------

step("Setting up environment");

const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  ok(".env.local already exists, leaving it alone");
} else {
  copyFileSync(join(root, ".env.example"), envPath);
  warn(".env.local created from .env.example — fill in your Supabase values");
}

const envText = readFileSync(envPath, "utf8");
const placeholders = envText
  .split("\n")
  .filter(
    (line) =>
      line.includes("your-project-ref") || line.includes("your-anon-key"),
  )
  .map((line) => line.split("=")[0]);

if (placeholders.length > 0) {
  warn(`Still placeholder: ${placeholders.join(", ")}`);
}

// --- 4. Generated types -----------------------------------------------------

step("Generating types");

if (run("pnpm", ["exec", "next", "typegen"])) {
  ok("Next route types generated");
} else {
  warn("next typegen failed — run `pnpm exec next typegen` manually");
}

const dbTypes = readFileSync(join(root, "lib/database.types.ts"), "utf8");
if (dbTypes.includes("PLACEHOLDER")) {
  warn(
    "lib/database.types.ts is still the placeholder stub. After linking your\n" +
      "    Supabase project, run: pnpm run db:types",
  );
} else {
  ok("Database types present");
}

// --- Done -------------------------------------------------------------------

process.stdout.write(`
${c.green}Setup complete.${c.reset}

Next steps:
  ${c.dim}1.${c.reset} Fill in .env.local with your Supabase URL and anon key
  ${c.dim}2.${c.reset} pnpm dev          ${c.dim}# http://localhost:3000${c.reset}
  ${c.dim}3.${c.reset} pnpm check      ${c.dim}# run before every commit${c.reset}

In VS Code, press F5 to start the dev server with the debugger attached.
`);
