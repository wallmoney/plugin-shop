type D1PreparedStatement = {
	all<T = unknown>(): Promise<{ results?: T[] }>;
};

type D1Database = {
	prepare(query: string): D1PreparedStatement;
};

type Env = {
	CATALOG_DB?: D1Database;
	CACHE_CONTROL?: string;
};

type CategoryRow = {
	id: string;
	label: string;
	helper: string | null;
	display_order: number | null;
};

type ProductRow = {
	id: string;
	name: string;
	category: string;
	price: number;
	icon: string | null;
	cid: string | null;
	image_cid: string | null;
	image_url: string | null;
	description: string | null;
	vendor: string | null;
	badge: string | null;
	pack_label: string | null;
	digital: number | null;
	display_order: number | null;
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'GET, OPTIONS',
			'access-control-allow-headers': 'content-type',
			'content-type': 'application/json',
			...(init.headers ?? {})
		}
	});
}

function productFromRow(row: ProductRow) {
	return {
		id: row.id,
		name: row.name,
		category: row.category,
		price: Number(row.price),
		icon: row.icon || '',
		cid: row.cid || '',
		imageCid: row.image_cid || '',
		imageUrl: row.image_url || '',
		description: row.description || '',
		vendor: row.vendor || '',
		badge: row.badge || '',
		packLabel: row.pack_label || '',
		digital: row.digital === 1,
		order: Number(row.display_order ?? 999)
	};
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
		if (request.method !== 'GET') {
			return jsonResponse({ ok: false, message: 'Method not allowed.' }, { status: 405 });
		}
		if (!env.CATALOG_DB) {
			return jsonResponse({ ok: false, message: 'CATALOG_DB binding is not configured.' }, { status: 500 });
		}

		const url = new URL(request.url);
		if (url.pathname !== '/' && url.pathname !== '/catalog') {
			return jsonResponse({ ok: false, message: 'Not found.' }, { status: 404 });
		}

		const [categoriesResult, productsResult] = await Promise.all([
			env.CATALOG_DB.prepare(`
				SELECT id, label, helper, display_order
				FROM categories
				WHERE enabled = 1
				ORDER BY display_order, label
			`).all<CategoryRow>(),
			env.CATALOG_DB.prepare(`
				SELECT id, name, category, price, icon, cid, image_cid, image_url, description, vendor, badge, pack_label, digital, display_order
				FROM products
				WHERE enabled = 1
				ORDER BY display_order, name
			`).all<ProductRow>()
		]);

		return jsonResponse({
			version: 1,
			categories: (categoriesResult.results || []).map((row) => ({
				id: row.id,
				label: row.label,
				helper: row.helper || '',
				order: Number(row.display_order ?? 999)
			})),
			products: (productsResult.results || []).map(productFromRow)
		}, {
			headers: {
				'cache-control': env.CACHE_CONTROL || 'public, max-age=60'
			}
		});
	}
};
