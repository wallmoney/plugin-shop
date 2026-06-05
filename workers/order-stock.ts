type StockItem = {
	id?: unknown;
	name?: unknown;
	quantity?: unknown;
};

type KVNamespace = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { metadata?: Record<string, unknown> }): Promise<void>;
};

type StockPayload = {
	type?: unknown;
	payment?: {
		reference?: unknown;
		sessionId?: unknown;
		paidAt?: unknown;
	};
	items?: StockItem[];
};

type Env = {
	SHOP_STOCK?: KVNamespace;
	STOCK_WEBHOOK_TOKEN?: string;
};

type StockResult = {
	id: string;
	requested: number;
	available?: number;
	before?: number;
	after?: number;
	status: 'available' | 'updated' | 'missing' | 'invalid' | 'insufficient' | 'out_of_stock' | 'unmanaged';
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			'content-type': 'application/json',
			...(init.headers ?? {})
		}
	});
}

function readString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function readQuantity(value: unknown): number {
	const number = Number(value);
	return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

async function checkItemStock(stock: KVNamespace, item: StockItem): Promise<StockResult> {
	const id = readString(item.id);
	const requested = readQuantity(item.quantity);
	if (!id || requested <= 0) return { id: id || 'unknown', requested, status: 'invalid' };

	const key = `stock:${id}`;
	const existing = await stock.get(key);
	if (existing === null) return { id, requested, status: 'missing' };

	const available = Number(existing);
	if (!Number.isFinite(available) || available < 0) return { id, requested, status: 'invalid' };
	if (available <= 0) return { id, requested, available, status: 'out_of_stock' };
	if (available < requested) return { id, requested, available, status: 'insufficient' };
	return { id, requested, available, status: 'available' };
}

async function decrementCheckedItemStock(stock: KVNamespace, result: StockResult): Promise<StockResult> {
	if (result.status !== 'available') return result;

	const before = result.available ?? 0;
	const key = `stock:${result.id}`;
	const requested = result.requested;
	const after = Math.max(0, before - requested);
	await stock.put(key, String(after), {
		metadata: {
			updatedAt: new Date().toISOString(),
			lastDecrement: requested
		}
	});
	return { id: result.id, requested, before, after, status: 'updated' };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return jsonResponse({ ok: false, message: 'Method not allowed.' }, { status: 405 });
		}

		if (!env.STOCK_WEBHOOK_TOKEN) {
			return jsonResponse({ ok: false, message: 'Stock webhook token is not configured.' }, { status: 500 });
		}

		const expected = `Bearer ${env.STOCK_WEBHOOK_TOKEN}`;
		if (request.headers.get('authorization') !== expected) {
			return jsonResponse({ ok: false, message: 'Unauthorized.' }, { status: 401 });
		}

		if (!env.SHOP_STOCK) {
			return jsonResponse({ ok: true, adjusted: false, reason: 'SHOP_STOCK KV binding is not configured.' });
		}

		const payload = await request.json().catch(() => null) as StockPayload | null;
		const items = Array.isArray(payload?.items) ? payload.items : [];
		if (!items.length) {
			return jsonResponse({ ok: false, message: 'No stock items supplied.' }, { status: 400 });
		}

		const isDecrement = payload?.type === 'shop.stock.decrement';
		const isValidate = payload?.type === 'shop.stock.validate';
		if (!isDecrement && !isValidate) {
			return jsonResponse({ ok: false, message: 'Unsupported stock operation.' }, { status: 400 });
		}

		const checked = await Promise.all(items.map((item) => checkItemStock(env.SHOP_STOCK as KVNamespace, item)));
		const blocking = checked.filter((result) =>
			result.status === 'invalid' || result.status === 'insufficient' || result.status === 'out_of_stock'
		);

		if (blocking.length) {
			return jsonResponse({
				ok: false,
				adjusted: false,
				message: 'Some items do not have enough stock.',
				results: checked
			}, { status: 409 });
		}

		if (isValidate) {
			return jsonResponse({
				ok: true,
				adjusted: false,
				results: checked
			});
		}

		const results = await Promise.all(checked.map((result) => decrementCheckedItemStock(env.SHOP_STOCK as KVNamespace, result)));
		const updated = results.filter((result) => result.status === 'updated');
		return jsonResponse({
			ok: true,
			adjusted: updated.length > 0,
			updated: updated.length,
			skipped: results.length - updated.length,
			results
		});
	}
};
