import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dataDir = join(root, 'data');
const inventoryDir = join(dataDir, 'inventory');
const outputFile = join(root, 'src', 'inventory.js');

function sortByOrderThenLabel(items) {
	return [...items].sort((first, second) => {
		const firstOrder = Number.isFinite(first.order) ? first.order : 999;
		const secondOrder = Number.isFinite(second.order) ? second.order : 999;
		if (firstOrder !== secondOrder) return firstOrder - secondOrder;
		return String(first.label || first.name || first.id).localeCompare(String(second.label || second.name || second.id));
	});
}

const categories = JSON.parse(await readFile(join(dataDir, 'categories.json'), 'utf8'));
const inventoryFiles = (await readdir(inventoryDir)).filter((file) => file.endsWith('.json'));
const products = await Promise.all(
	inventoryFiles.map(async (file) => JSON.parse(await readFile(join(inventoryDir, file), 'utf8')))
);

const source = `// Generated from data/categories.json and data/inventory/*.json. Run npm run build:inventory after edits.\nconst SHOP_CATEGORIES = ${JSON.stringify(sortByOrderThenLabel(categories), null, '\t')};\n\nconst SHOP_PRODUCTS = ${JSON.stringify(sortByOrderThenLabel(products), null, '\t')};\n`;

await writeFile(outputFile, source);
