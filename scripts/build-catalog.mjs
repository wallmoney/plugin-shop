import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const catalogFile = join(root, 'data', 'catalog.json');
const outputFile = join(root, 'src', 'inventory.ts');

function sortByOrderThenLabel(items) {
	return [...items].sort((first, second) => {
		const firstOrder = Number.isFinite(first.order) ? first.order : 999;
		const secondOrder = Number.isFinite(second.order) ? second.order : 999;
		if (firstOrder !== secondOrder) return firstOrder - secondOrder;
		return String(first.label || first.name || first.id).localeCompare(String(second.label || second.name || second.id));
	});
}

function assertArray(value, label) {
	if (Array.isArray(value)) return value;
	throw new Error(`Catalog ${label} must be an array.`);
}

function assertString(value, label) {
	if (typeof value === 'string' && value.trim()) return value;
	throw new Error(`Catalog ${label} must be a non-empty string.`);
}

function assertOptionalString(value, label) {
	if (value === undefined || value === null || value === '') return '';
	if (typeof value === 'string' && value.trim()) return value;
	throw new Error(`Catalog ${label} must be a string when provided.`);
}

let catalogText = '';
try {
	catalogText = await readFile(catalogFile, 'utf8');
} catch (error) {
	if (error && error.code === 'ENOENT') {
		console.log('No data/catalog.json found; keeping existing src/inventory.ts bundled fallback.');
		process.exit(0);
	}
	throw error;
}

const catalog = JSON.parse(catalogText);
const categories = sortByOrderThenLabel(assertArray(catalog.categories, 'categories'));
const products = sortByOrderThenLabel(assertArray(catalog.products, 'products'));

const categoryIds = new Set();
for (const category of categories) {
	categoryIds.add(assertString(category.id, 'category.id'));
	assertString(category.label, `category ${category.id}.label`);
}

for (const product of products) {
	assertString(product.id, 'product.id');
	assertOptionalString(product.skuid, `product ${product.id}.skuid`);
	assertString(product.name, `product ${product.id}.name`);
	const category = assertString(product.category, `product ${product.id}.category`);
	if (!categoryIds.has(category)) throw new Error(`Product ${product.id} references unknown category ${category}.`);
	if (!Number.isFinite(product.price) || product.price < 0) {
		throw new Error(`Product ${product.id}.price must be a non-negative number.`);
	}
}

const source = `// @ts-nocheck\n// Generated from data/catalog.json. Run npm run build:catalog after edits.\nconst SHOP_CATEGORIES = ${JSON.stringify(categories, null, '\t')};\n\nconst SHOP_PRODUCTS = ${JSON.stringify(products, null, '\t')};\n`;

await writeFile(outputFile, source);
