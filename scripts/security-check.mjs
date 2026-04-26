// scripts/security-check.mjs
import fs from "fs";
import path from "path";
import url from "url";

const root = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");

// ---- Config -----------------------------------------------------------------

// Directories we never scan
const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".hg", ".svn",
  "dist", "build", "coverage", ".next", "out",
  ".turbo", ".parcel-cache", ".cache", ".vercel",
  ".vscode", ".idea", "vendor", "public", "dist-public",
  "tmp", "logs", ".pnpm",
  // Project-specific: we usually don't want to report on our own checker or tests
  "scripts", "tests", "__tests__", "test"
]);

// Files we explicitly ignore (server-only configs etc.)
const IGNORE_FILES = new Set([
  "drizzle.config.ts" // server-only; still reviewed manually
]);

// Only scan these top-level areas by default
const SCAN_ROOTS = [
  "server",
  "shared",
  "drizzle.config.ts", // keep a quick eye on it even if we ignore some patterns
  "vite.config.ts"     // sanity-check it isn't leaking secrets to client
];

// File extensions to scan
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"]);

// Patterns to flag
const RULES = [
  {
    id: "PROCESS_ENV",
    re: /\bprocess\.env\b/,
    msg: "process.env reference (verify not shipped to client)",
    severity: "medium",
  },
  {
    id: "OPENAI_KEY_LITERAL",
    re: /OPENAI_API_KEY/i,
    msg: "OPENAI_API_KEY referenced",
    severity: "high",
  },
  {
    id: "TLS_REJECT_FALSE",
    re: /rejectUnauthorized:\s*false/,
    msg: "TLS cert verification disabled",
    severity: "high",
  },
  {
    id: "CONSOLE_REQ_BODY",
    re: /console\.(log|dir)\s*\(\s*req\.body/i,
    msg: "console logging of request body",
    severity: "high",
  },
  {
    id: "SESSION_SECRET_LITERAL",
    re: /SESSION_SECRET[^=]*=\s*["'`](?!\$\{)/,
    msg: "Hard-coded SESSION_SECRET",
    severity: "high",
  },
];

// Rule-level allowlist by filename (simple contains match)
// Use this if certain rules are expected in specific files.
const RULE_ALLOWLIST = [
  // Example:
  // { fileIncludes: "drizzle.config.ts", ruleId: "PROCESS_ENV" }
];

// Severity sort order
const SEV_ORDER = { high: 0, medium: 1, low: 2 };

// ---- Helpers ----------------------------------------------------------------

function shouldScanFile(absPath) {
  const rel = path.relative(projectRoot, absPath);
  const base = path.basename(absPath);
  if (IGNORE_FILES.has(base)) return false;

  // Only scan selected roots
  const inScanRoots = SCAN_ROOTS.some(root => {
    const r = path.normalize(root);
    return rel === r || rel.startsWith(`${r}${path.sep}`);
  });
  if (!inScanRoots) return false;

  const ext = path.extname(base).toLowerCase();
  return ALLOWED_EXT.has(ext);
}

function shouldSkipDir(name) {
  return IGNORE_DIRS.has(name);
}

async function listFiles(startDir) {
  /** @type {string[]} */
  const files = [];
  const stack = [startDir];
  while (stack.length) {
    const dir = stack.pop();
    let ents = [];
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of ents) {
      if (ent.isDirectory()) {
        if (!shouldSkipDir(ent.name)) {
          stack.push(path.join(dir, ent.name));
        }
      } else if (ent.isFile()) {
        const p = path.join(dir, ent.name);
        if (shouldScanFile(p)) files.push(p);
      }
    }
  }
  return files;
}

function isAllowed(ruleId, filePath) {
  const rel = path.relative(projectRoot, filePath);
  return RULE_ALLOWLIST.some(a =>
    rel.includes(a.fileIncludes) && a.ruleId === ruleId
  );
}

function scanText(filePath, text) {
  /** @type {{id:string,severity:"high"|"medium"|"low",file:string,line:number,msg:string,code:string}[]} */
  const hits = [];
  const lines = text.split(/\r?\n/);

  RULES.forEach(rule => {
    // Quick pre-check
    if (!rule.re.test(text)) return;

    // Reset regex index if global
    const re = new RegExp(rule.re.source, rule.re.flags);
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        if (isAllowed(rule.id, filePath)) continue;
        hits.push({
          id: rule.id,
          severity: rule.severity,
          file: path.relative(projectRoot, filePath),
          line: i + 1,
          msg: rule.msg,
          code: lines[i].trim().slice(0, 160),
        });
      }
    }
  });

  return hits;
}

// ---- Main -------------------------------------------------------------------

async function main() {
  const roots = SCAN_ROOTS
    .map(p => path.resolve(projectRoot, p))
    .filter(p => fs.existsSync(p));

  /** @type {ReturnType<typeof scanText>[number][]} */
  let findings = [];

  for (const rootDir of roots) {
    const files = (fs.statSync(rootDir).isFile()) ? [rootDir] : await listFiles(rootDir);
    for (const file of files) {
      try {
        const text = fs.readFileSync(file, "utf8");
        findings.push(...scanText(file, text));
      } catch {
        // ignore unreadable files
      }
    }
  }

  findings.sort((a, b) => {
    const s = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    if (s !== 0) return s;
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  if (findings.length === 0) {
    console.log("No obvious security issues found.");
    process.exit(0);
  }

  console.log("\nPotential issues found:\n");
  for (const f of findings) {
    console.log(`[${f.severity.toUpperCase()}] ${f.id}`);
    console.log(`  File: ${f.file}:${f.line}`);
    console.log(`  Msg : ${f.msg}`);
    console.log(`  Code: ${f.code}\n`);
  }

  // Non-zero exit so CI can fail on issues
  process.exit(1);
}

main().catch(err => {
  console.error("security-check failed:", err);
  process.exit(2);
});