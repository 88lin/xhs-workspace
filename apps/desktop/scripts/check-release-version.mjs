import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();

const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.resolve(cwd, relativePath), 'utf8'));

const readCargoVersion = (relativePath) => {
  const file = readFileSync(path.resolve(cwd, relativePath), 'utf8');
  const match = file.match(/^version\s*=\s*"([^"]+)"\s*$/m);

  if (!match) {
    throw new Error(`Unable to find a package version in ${relativePath}.`);
  }

  return match[1];
};

const packageVersion = readJson('./package.json').version;
const tauriVersion = readJson('./src-tauri/tauri.conf.json').version;
const cargoVersion = readCargoVersion('./src-tauri/Cargo.toml');
const resolvedVersions = {
  'apps/desktop/package.json': packageVersion,
  'apps/desktop/src-tauri/tauri.conf.json': tauriVersion,
  'apps/desktop/src-tauri/Cargo.toml': cargoVersion,
};

const uniqueVersions = [...new Set(Object.values(resolvedVersions))];

if (uniqueVersions.length !== 1) {
  const details = Object.entries(resolvedVersions)
    .map(([file, version]) => `- ${file}: ${version}`)
    .join('\n');

  throw new Error(`Desktop release version mismatch detected.\n${details}`);
}

const desktopVersion = uniqueVersions[0];
const expectedTag = `desktop-v${desktopVersion}`;
const releaseName = `XHS Atelier Desktop v${desktopVersion}`;
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!semverPattern.test(desktopVersion)) {
  throw new Error(
    `Desktop version "${desktopVersion}" is not valid semver. Use values like 0.1.0 or 0.1.0-beta.1.`,
  );
}

const refType = process.env.GITHUB_REF_TYPE ?? '';
const refName = process.env.GITHUB_REF_NAME ?? '';
const ref = process.env.GITHUB_REF ?? '';
const currentTag =
  refType === 'tag' ? refName : ref.startsWith('refs/tags/') ? ref.slice('refs/tags/'.length) : '';

if (currentTag) {
  if (!currentTag.startsWith('desktop-v')) {
    throw new Error(
      `Unexpected desktop release tag "${currentTag}". Desktop release tags must start with "desktop-v".`,
    );
  }

  if (currentTag !== expectedTag) {
    throw new Error(
      `Release tag "${currentTag}" does not match the desktop version "${desktopVersion}". Expected "${expectedTag}".`,
    );
  }
}

if (process.argv.includes('--github-output')) {
  if (!process.env.GITHUB_OUTPUT) {
    throw new Error('GITHUB_OUTPUT is not available in the current environment.');
  }

  appendFileSync(process.env.GITHUB_OUTPUT, `desktop_version=${desktopVersion}\n`, 'utf8');
  appendFileSync(process.env.GITHUB_OUTPUT, `expected_tag=${expectedTag}\n`, 'utf8');
  appendFileSync(process.env.GITHUB_OUTPUT, `release_name=${releaseName}\n`, 'utf8');
}

console.log(
  [
    `Desktop version metadata is aligned at ${desktopVersion}.`,
    `Expected release tag: ${expectedTag}.`,
    currentTag ? `Validated current tag: ${currentTag}.` : 'No release tag check was required in this run.',
  ].join(' '),
);
