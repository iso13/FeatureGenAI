/**
 * prepareDeposit.js
 * ----------------------------------------
 * Concatenates all original source files into one plain-text file
 * with clear headers for each source path.
 *
 * Run with:  node prepareDeposit.js
 *
 * Output: FeatureGenAI_Deposit.txt
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, "FeatureGenAI_Deposit.txt");

// Directories to include (adjust if needed)
const INCLUDE_DIRS = [
  "client/src",
  "server",
  "shared",
];

// Optional extra single files at project root
const EXTRA_FILES = [
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "drizzle.config.ts",
  "README.md",
  "LICENSE",
];

// Extensions of files we want to include
const ALLOWED_EXT = [".ts", ".tsx", ".js", ".json", ".md"];

// Patterns to skip (node_modules, dist, build, etc.)
const EXCLUDE_PATTERNS = [
  "node_modules",
  "dist",
  "build",
  ".vite",
  ".env",
];

// ---- Helper: Recursively walk directories ----
function collectFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const relPath = path.relative(ROOT, fullPath);
    const stat = fs.statSync(fullPath);

    if (EXCLUDE_PATTERNS.some(p => relPath.includes(p))) continue;

    if (stat.isDirectory()) {
      result.push(...collectFiles(fullPath));
    } else if (
      ALLOWED_EXT.includes(path.extname(entry).toLowerCase())
    ) {
      result.push(relPath);
    }
  }
  return result;
}

// ---- Build the deposit file ----
function buildDeposit() {
  const allFiles = [];

  // Collect from source directories
  for (const dir of INCLUDE_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (fs.existsSync(fullDir)) {
      allFiles.push(...collectFiles(fullDir));
    }
  }

  // Add extra single files if they exist
  for (const file of EXTRA_FILES) {
    const fullPath = path.join(ROOT, file);
    if (fs.existsSync(fullPath)) {
      allFiles.push(file);
    }
  }

  console.log(`📂 Including ${allFiles.length} files...`);

  const output = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });

  // Optional header at top of file
  output.write(
`FeatureGenAI – Copyright Deposit
Copyright (c) 2024–2025 David Tran
Licensed under the Business Source License 1.1
See LICENSE for full terms
Change Date: January 1, 2029 (license converts to MIT)
Contact: davidtran@featuregen.ai

==============================================
\n`
  );

  for (const file of allFiles) {
    output.write(`// ===== FILE: ${file} =====\n\n`);
    const content = fs.readFileSync(path.join(ROOT, file), "utf8");
    output.write(content + "\n\n\n");
  }

  output.end();
  console.log(`✅ Deposit created at ${OUTPUT_FILE}`);
}

buildDeposit();