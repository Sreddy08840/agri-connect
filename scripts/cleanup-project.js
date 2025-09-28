#!/usr/bin/env node
/*
  Safe project cleanup utility
  - Scans recursively from repository root
  - Reports removable files/folders (caches, build artifacts, logs, OS junk)
  - Dry-run by default; pass --delete to actually remove
  - Supports --largest [N] to report N largest files in the repo (default 50)

  Usage examples:
    node scripts/cleanup-project.js           # dry-run cleanup report + largest files
    node scripts/cleanup-project.js --delete  # delete matched junk safely
    node scripts/cleanup-project.js --largest 100
*/
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const DO_DELETE = argv.includes('--delete');
const LARGEST_IDX = Math.max(argv.indexOf('--largest'), argv.indexOf('-l'));
let LARGEST_N = 50;
if (LARGEST_IDX !== -1) {
  const val = argv[LARGEST_IDX + 1];
  if (val && !val.startsWith('-')) {
    const n = Number(val);
    if (!isNaN(n) && n > 0) LARGEST_N = n;
  }
}

const repoRoot = process.cwd();

// Directories we should NEVER touch
const STRICT_EXCLUDE_DIRS = new Set([
  'node_modules', 'uploads', '.git', '.pnpm-store', '.idea', '.vscode', 'prisma'
]);

// Safe-to-delete directory name patterns (typical build artifacts / caches)
const SAFE_DIR_NAMES = new Set([
  'dist', 'build', '.turbo', '.next', '.cache', '.parcel-cache', '.vite', 'coverage', 
  '.eslintcache', '.angular', '.nyc_output', '.svelte-kit', '.docusaurus'
]);

// Safe-to-delete file name patterns (suffixes)
const SAFE_FILE_SUFFIXES = [
  '.log', '.log.0', '.log.1', '.log.2', '.log.old', '.tmp', '.temp', '.map',
];

// Exact files to remove
const SAFE_FILE_NAMES = new Set([
  'npm-debug.log', 'pnpm-debug.log', 'yarn-error.log', '.DS_Store', 'Thumbs.db'
]);

// Additional file patterns (match by RegExp on basename)
const SAFE_FILE_REGEX = [
  /^npm-debug\.log.*$/, /^pnpm-debug\.log.*$/, /^yarn-error\.log.*$/
];

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }

function walk(dir, onEntry) {
  let ents = [];
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return;
  }
  for (const ent of ents) {
    const full = path.join(dir, ent.name);
    onEntry(full, ent);
    if (ent.isDirectory()) walk(full, onEntry);
  }
}

function human(bytes) {
  const units = ['B','KB','MB','GB','TB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

const removeTargets = [];
const largestFiles = [];

function considerForRemoval(fullPath, ent) {
  const base = path.basename(fullPath);
  const parent = path.basename(path.dirname(fullPath));

  // Never traverse into strict excluded directories (handled by caller)

  // Directories to remove
  if (ent.isDirectory()) {
    if (SAFE_DIR_NAMES.has(base)) {
      removeTargets.push({ type: 'dir', path: fullPath });
    }
    return;
  }

  // Files to remove
  if (ent.isFile()) {
    if (SAFE_FILE_NAMES.has(base)) { removeTargets.push({ type: 'file', path: fullPath }); return; }
    if (SAFE_FILE_SUFFIXES.some(suf => base.endsWith(suf))) { removeTargets.push({ type: 'file', path: fullPath }); return; }
    if (SAFE_FILE_REGEX.some(rx => rx.test(base))) { removeTargets.push({ type: 'file', path: fullPath }); return; }
  }
}

function collectLargest(fullPath, ent) {
  if (!ent.isFile()) return;
  try {
    const st = fs.statSync(fullPath);
    largestFiles.push({ path: fullPath, size: st.size });
  } catch {}
}

function rmrf(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      rmrf(path.join(targetPath, entry));
    }
    fs.rmdirSync(targetPath);
  } else {
    fs.unlinkSync(targetPath);
  }
}

function scan(root) {
  walk(root, (full, ent) => {
    const rel = path.relative(repoRoot, full);
    // Skip STRICT_EXCLUDE_DIRS at top-level or nested
    if (ent.isDirectory() && STRICT_EXCLUDE_DIRS.has(ent.name)) {
      return; // do not walk inside (walk continues as we do not stop recursion, but this early return avoids consider/remove)
    }
    considerForRemoval(full, ent);
    collectLargest(full, ent);
  });
}

console.log(`\nScanning repository at: ${repoRoot}`);
scan(repoRoot);

// Sort largest files
largestFiles.sort((a, b) => b.size - a.size);
const largestTop = largestFiles.slice(0, LARGEST_N);

console.log(`\nLargest ${LARGEST_N} files:`);
for (const f of largestTop) {
  console.log(`  ${human(f.size).padStart(10)}  ${path.relative(repoRoot, f.path)}`);
}

// De-duplicate removal targets (child of soon-to-be-removed directory is redundant)
const pruned = [];
const dirsToRemove = new Set(removeTargets.filter(t => t.type === 'dir').map(t => t.path));
for (const t of removeTargets) {
  if (t.type === 'file') {
    // skip files under a removable directory
    const under = Array.from(dirsToRemove).some(d => t.path.startsWith(d + path.sep));
    if (under) continue;
    pruned.push(t);
  } else {
    pruned.push(t);
  }
}

console.log(`\nCleanup candidates (${pruned.length}):`);
for (const t of pruned) {
  console.log(`  [${t.type}] ${path.relative(repoRoot, t.path)}`);
}

if (!DO_DELETE) {
  console.log('\nDry run complete. No files were deleted.');
  console.log('Run with --delete to remove the listed items.');
  process.exit(0);
}

console.log('\nDeleting...');
let deleted = 0;
for (const t of pruned) {
  try { rmrf(t.path); deleted++; }
  catch (e) { console.warn('Failed to delete', t.path, e?.message || e); }
}
console.log(`Deleted ${deleted}/${pruned.length} items.`);
