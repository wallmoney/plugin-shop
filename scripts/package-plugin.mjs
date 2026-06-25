import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const ignoreFile = join(root, '.pluginignore');
const outputDir = join(root, 'build', 'plugin-package');

function normalizePath(path) {
	return path.split('\\').join('/').replace(/^\/+/, '');
}

function globToRegExp(pattern) {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/\*\*/g, '\u0000')
		.replace(/\*/g, '[^/]*')
		.replace(/\u0000/g, '.*');
	return new RegExp(`^${escaped}$`);
}

function parseIgnoreRules(source) {
	return source
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'))
		.map((line) => {
			const directory = line.endsWith('/');
			const pattern = normalizePath(directory ? line.slice(0, -1) : line);
			const basenameOnly = !pattern.includes('/');
			return {
				directory,
				basenameOnly,
				pattern,
				regexp: globToRegExp(pattern)
			};
		});
}

function pathParts(path) {
	return normalizePath(path).split('/').filter(Boolean);
}

function isIgnored(path, isDirectory, rules) {
	const normalized = normalizePath(path);
	const parts = pathParts(normalized);
	for (const rule of rules) {
		const candidates = rule.basenameOnly ? parts : [normalized];
		if (rule.directory) {
			if (!parts.some((part, index) => {
				const candidate = rule.basenameOnly ? part : parts.slice(0, index + 1).join('/');
				return rule.regexp.test(candidate);
			})) {
				continue;
			}
			return true;
		}
		if (candidates.some((candidate) => rule.regexp.test(candidate))) return true;
	}
	return false;
}

async function walk(dir, rules, files = []) {
	const entries = await import('node:fs/promises').then((fs) => fs.readdir(dir, { withFileTypes: true }));
	for (const entry of entries) {
		const absolute = join(dir, entry.name);
		const path = normalizePath(relative(root, absolute));
		if (!path || isIgnored(path, entry.isDirectory(), rules)) continue;
		if (entry.isDirectory()) {
			await walk(absolute, rules, files);
		} else if (entry.isFile()) {
			files.push(path);
		}
	}
	return files.sort();
}

const ignoreSource = await readFile(ignoreFile, 'utf8');
const rules = parseIgnoreRules(ignoreSource);
const files = await walk(root, rules);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of files) {
	const from = join(root, file);
	const to = join(outputDir, file);
	await mkdir(join(to, '..'), { recursive: true });
	await cp(from, to);
}

console.log(`Prepared ${files.length} plugin files in ${normalizePath(relative(root, outputDir))}:`);
for (const file of files) {
	const size = (await stat(join(root, file))).size;
	console.log(`- ${file} (${size} bytes)`);
}
