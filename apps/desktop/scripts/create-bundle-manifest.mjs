import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const bundleDir = path.resolve(cwd, process.argv[2] || 'src-tauri/target/release/bundle');
const ignoredFiles = new Set(['bundle-manifest.json', 'SHA256SUMS.txt']);

const toPosix = (value) => value.split(path.sep).join('/');

const walkFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(resolved);
      }
      if (!entry.isFile() || ignoredFiles.has(entry.name)) {
        return [];
      }
      return [resolved];
    }),
  );

  return nested.flat();
};

const sha256 = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return createHash('sha256').update(buffer).digest('hex');
};

const statSafe = async (target) => {
  try {
    return await fs.stat(target);
  } catch {
    return null;
  }
};

const bundleStats = await statSafe(bundleDir);

if (!bundleStats?.isDirectory()) {
  throw new Error(`Bundle directory not found: ${bundleDir}`);
}

const files = (await walkFiles(bundleDir)).sort((left, right) => left.localeCompare(right));

if (!files.length) {
  throw new Error(`No bundle files were found in ${bundleDir}`);
}

const manifestFiles = [];
let totalBytes = 0;

for (const filePath of files) {
  const relativePath = toPosix(path.relative(bundleDir, filePath));
  const fileStats = await fs.stat(filePath);
  const checksum = await sha256(filePath);
  totalBytes += fileStats.size;
  manifestFiles.push({
    path: relativePath,
    size: fileStats.size,
    sha256: checksum,
  });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  bundleDirectory: toPosix(path.relative(cwd, bundleDir)) || '.',
  fileCount: manifestFiles.length,
  totalBytes,
  files: manifestFiles,
};

const manifestPath = path.join(bundleDir, 'bundle-manifest.json');
const checksumsPath = path.join(bundleDir, 'SHA256SUMS.txt');
const checksums = manifestFiles.map((entry) => `${entry.sha256}  ${entry.path}`).join('\n');

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await fs.writeFile(checksumsPath, `${checksums}\n`, 'utf8');

console.log(
  `Generated ${path.basename(manifestPath)} and ${path.basename(checksumsPath)} for ${manifest.fileCount} files in ${manifest.bundleDirectory}.`,
);
