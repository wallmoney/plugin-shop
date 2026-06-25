import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function run(command, args) {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: process.platform === 'win32'
	});
	if (result.status !== 0) {
		process.exit(result.status || 1);
	}
}

const wrangler = process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler';

run(wrangler, [
	'd1',
	'migrations',
	'apply',
	'plugin-shop-catalog',
	'--remote',
	'--config',
	'workers/wrangler.catalog-d1.jsonc'
]);

const readline = createInterface({ input, output });
const answer = await readline.question('Inject demo categories and products from seeds/catalog/products.sql? [y/N] ');
readline.close();

if (/^(y|yes)$/i.test(answer.trim())) {
	run(wrangler, [
		'd1',
		'execute',
		'plugin-shop-catalog',
		'--remote',
		'--file',
		'seeds/catalog/products.sql',
		'--config',
		'workers/wrangler.catalog-d1.jsonc'
	]);
}

run(wrangler, ['deploy', '--config', 'workers/wrangler.catalog-d1.jsonc']);
