type EmailSendBinding = {
	send(message: {
		to: string;
		from: { email: string; name?: string };
		replyTo?: string;
		subject: string;
		text?: string;
		html?: string;
	}): Promise<unknown>;
};

type OrderEmail = {
	to?: unknown;
	replyTo?: unknown;
	subject?: unknown;
	text?: unknown;
	html?: unknown;
};

type OrderItem = {
	id?: unknown;
	name?: unknown;
	quantity?: unknown;
	unitPrice?: unknown;
	lineTotal?: unknown;
	cid?: unknown;
};

type OrderPayload = {
	type?: unknown;
	fulfillment?: {
		mode?: unknown;
	};
	shop?: unknown;
	payment?: {
		reference?: unknown;
		sessionId?: unknown;
		transactionId?: unknown;
		paidAt?: unknown;
		total?: unknown;
		currency?: unknown;
	};
	customer?: unknown;
	delivery?: unknown;
	items?: OrderItem[];
	email?: OrderEmail;
	emails?: OrderEmail[];
};

type TransferWebhookEvent = {
	status?: unknown;
	referenceId?: unknown;
	transactionId?: unknown;
	requestId?: unknown;
	amount?: unknown;
	currency?: unknown;
	occurredAt?: unknown;
};

type KVNamespace = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number; metadata?: Record<string, unknown> }): Promise<void>;
	delete(key: string): Promise<void>;
};

type D1PreparedStatement = {
	bind(...values: unknown[]): D1PreparedStatement;
	run(): Promise<unknown>;
};

type D1Database = {
	prepare(query: string): D1PreparedStatement;
	batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
};

type Env = {
	ORDER_DRAFTS?: KVNamespace;
	ORDER_DB?: D1Database;
	EMAIL?: EmailSendBinding;
	EMAIL_PROVIDER?: string;
	EMAIL_API_URL?: string;
	EMAIL_API_TOKEN?: string;
	EMAIL_FROM: string;
	EMAIL_FROM_NAME?: string;
	FULFILLMENT_MODE?: string;
	FULFILLMENT_WEBHOOK_URL?: string;
	FULFILLMENT_WEBHOOK_SECRET?: string;
	STOCK_WEBHOOK_URL?: string;
	STOCK_WEBHOOK_TOKEN?: string;
	COREAPI_WEBHOOK_KEY_URL?: string;
	COREAPI_BASE_URL?: string;
	COREAPI_WEBHOOK_VERIFY_KEY_JWK?: string;
	ORDER_DRAFT_TTL_SECONDS?: string;
	ORDER_STORAGE_PROVIDER?: string;
	REQUIRE_PAYMENT_WEBHOOK?: string;
};

type StockResult = {
	id?: unknown;
	status?: unknown;
	available?: unknown;
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

function isValidEmail(value: unknown): value is string {
	return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function readString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number | null {
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function fulfillmentMode(payload: OrderPayload, env: Env): 'email' | 'webhook' | 'both' | 'storage' | 'none' {
	const value = readString(env.FULFILLMENT_MODE || payload.fulfillment?.mode).toLowerCase();
	return value === 'webhook' || value === 'both' || value === 'storage' || value === 'none' ? value : 'email';
}

function emailProvider(env: Env): 'cloudflare' | 'http' | 'none' {
	const value = readString(env.EMAIL_PROVIDER).toLowerCase();
	if (value === 'http' || value === 'none') return value;
	return 'cloudflare';
}

function orderStorageProvider(env: Env): 'd1' | 'none' {
	return readString(env.ORDER_STORAGE_PROVIDER).toLowerCase() === 'd1' ? 'd1' : 'none';
}

function emailMessages(payload: OrderPayload): OrderEmail[] {
	const emails = Array.isArray(payload.emails) ? payload.emails : [];
	return emails.length ? emails : payload.email ? [payload.email] : [];
}

function draftTtlSeconds(env: Env): number {
	const value = Number(env.ORDER_DRAFT_TTL_SECONDS);
	return Number.isFinite(value) && value > 0 ? Math.round(value) : 86_400;
}

function orderReference(payload: OrderPayload): string {
	return readString(payload.payment?.reference);
}

function orderTotal(payload: OrderPayload): number | null {
	return readNumber(payload.payment?.total);
}

function orderCurrency(payload: OrderPayload): string {
	return readString(payload.payment?.currency).toLowerCase();
}

function orderDraftKey(reference: string): string {
	return `order:${reference.toLowerCase()}`;
}

function processedPaymentKey(event: TransferWebhookEvent): string {
	const id = readString(event.transactionId) || readString(event.requestId) || readString(event.referenceId);
	return `processed:${id.toLowerCase()}`;
}

function stockItems(payload: OrderPayload): OrderItem[] {
	return Array.isArray(payload.items) ? payload.items : [];
}

function objectValue(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function jsonString(value: unknown): string {
	return JSON.stringify(value ?? null);
}

async function collectOrderInD1(payload: OrderPayload, env: Env): Promise<boolean> {
	if (orderStorageProvider(env) !== 'd1') return false;
	if (!env.ORDER_DB) throw new Error('ORDER_DB D1 binding is not configured.');

	const reference = orderReference(payload);
	if (!reference) throw new Error('Missing payment reference.');

	const payment = objectValue(payload.payment);
	const customer = objectValue(payload.customer);
	const delivery = objectValue(payload.delivery);
	const items = stockItems(payload);
	const paidAt = readString(payment.paidAt) || new Date().toISOString();
	const transactionId = readString(payment.transactionId) || null;
	const sessionId = readString(payment.sessionId) || null;
	const total = orderTotal(payload);
	const currency = orderCurrency(payload) || null;
	const customerName = readString(customer.name) || readString(delivery.name) || null;
	const customerEmail = readString(customer.email) || readString(delivery.email) || null;
	const now = new Date().toISOString();

	const statements = [
		env.ORDER_DB.prepare(`
			INSERT INTO orders (
				reference, status, transaction_id, session_id, total, currency,
				customer_name, customer_email, paid_at, payment_json, customer_json,
				delivery_json, payload_json, created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(reference) DO UPDATE SET
				status = excluded.status,
				transaction_id = excluded.transaction_id,
				session_id = excluded.session_id,
				total = excluded.total,
				currency = excluded.currency,
				customer_name = excluded.customer_name,
				customer_email = excluded.customer_email,
				paid_at = excluded.paid_at,
				payment_json = excluded.payment_json,
				customer_json = excluded.customer_json,
				delivery_json = excluded.delivery_json,
				payload_json = excluded.payload_json,
				updated_at = excluded.updated_at
		`).bind(
			reference,
			'paid',
			transactionId,
			sessionId,
			total,
			currency,
			customerName,
			customerEmail,
			paidAt,
			jsonString(payload.payment),
			jsonString(payload.customer),
			jsonString(payload.delivery),
			jsonString(payload),
			now,
			now
		),
		env.ORDER_DB.prepare('DELETE FROM order_items WHERE order_reference = ?').bind(reference),
		...items.map((item, index) =>
			(env.ORDER_DB as D1Database).prepare(`
				INSERT INTO order_items (
					order_reference, line_index, product_id, name, quantity,
					unit_price, line_total, cid, payload_json, created_at
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				reference,
				index,
				readString(item.id) || null,
				readString(item.name) || null,
				readNumber(item.quantity),
				readString(item.unitPrice) || null,
				readString(item.lineTotal) || null,
				readString(item.cid) || null,
				jsonString(item),
				now
			)
		)
	];

	await env.ORDER_DB.batch(statements);
	return true;
}

function stockPayload(payload: OrderPayload, type: 'shop.stock.validate' | 'shop.stock.decrement', event?: TransferWebhookEvent) {
	return {
		type,
		payment: {
			reference: orderReference(payload),
			transactionId: event ? readString(event.transactionId) || null : null,
			paidAt: event ? readString(event.occurredAt) || null : readString(payload.payment?.paidAt) || null
		},
		items: stockItems(payload).map((item) => ({
			id: item.id,
			name: item.name,
			quantity: item.quantity
		}))
	};
}

async function sendCloudflareEmail(email: OrderEmail, env: Env): Promise<void> {
	if (!env.EMAIL) throw new Error('EMAIL binding is not configured.');
	const to = readString(email.to);
	const replyTo = readString(email.replyTo);
	const subject = readString(email.subject);
	const text = readString(email.text);
	const html = readString(email.html);

	if (!isValidEmail(to)) throw new Error('Recipient email is invalid.');
	if (!isValidEmail(env.EMAIL_FROM)) throw new Error('EMAIL_FROM is invalid.');
	if (!subject) throw new Error('Subject is required.');
	if (!text && !html) throw new Error('Email body is required.');

	await env.EMAIL.send({
		to,
		from: {
			email: env.EMAIL_FROM,
			name: env.EMAIL_FROM_NAME || 'Wall Money Shop'
		},
		...(isValidEmail(replyTo) ? { replyTo } : {}),
		subject,
		...(text ? { text } : {}),
		...(html ? { html } : {})
	});
}

async function sendHttpEmail(email: OrderEmail, env: Env): Promise<void> {
	if (!env.EMAIL_API_URL) throw new Error('EMAIL_API_URL is not configured.');
	const response = await fetch(env.EMAIL_API_URL, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(env.EMAIL_API_TOKEN ? { authorization: `Bearer ${env.EMAIL_API_TOKEN}` } : {})
		},
		body: JSON.stringify({
			...email,
			from: {
				email: env.EMAIL_FROM,
				name: env.EMAIL_FROM_NAME || 'Wall Money Shop'
			}
		})
	});
	if (!response.ok) throw new Error(`Email API failed (${response.status}).`);
}

async function sendEmails(payload: OrderPayload, env: Env): Promise<number> {
	const provider = emailProvider(env);
	if (provider === 'none') return 0;
	const messages = emailMessages(payload);
	for (const email of messages) {
		if (provider === 'http') {
			await sendHttpEmail(email, env);
		} else {
			await sendCloudflareEmail(email, env);
		}
	}
	return messages.length;
}

async function callStockWorker(
	payload: OrderPayload,
	env: Env,
	type: 'shop.stock.validate' | 'shop.stock.decrement',
	event?: TransferWebhookEvent
): Promise<{ ok: boolean; status: number; body: unknown; results: StockResult[] }> {
	if (!env.STOCK_WEBHOOK_URL) {
		return { ok: true, status: 200, body: { ok: true, adjusted: false }, results: [] };
	}

	const response = await fetch(env.STOCK_WEBHOOK_URL, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(env.STOCK_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.STOCK_WEBHOOK_TOKEN}` } : {})
		},
		body: JSON.stringify(stockPayload(payload, type, event))
	});
	const body = await response.json().catch(() => null) as { results?: StockResult[] } | null;
	return {
		ok: response.ok,
		status: response.status,
		body,
		results: Array.isArray(body?.results) ? body.results : []
	};
}

function base64UrlDecode(value: string): Uint8Array {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

function bytesBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function signatureParts(header: string | null): { protectedHeader: string; signature: Uint8Array } | null {
	if (!header) return null;
	const parts = header.trim().split('.');
	if (parts.length !== 3 || parts[1] !== '') return null;
	if (!parts[0] || !parts[2]) return null;
	return {
		protectedHeader: parts[0],
		signature: base64UrlDecode(parts[2])
	};
}

async function publicJwks(env: Env): Promise<Array<JsonWebKey & { kid?: string }>> {
	if (env.COREAPI_WEBHOOK_VERIFY_KEY_JWK) {
		const jwk = JSON.parse(env.COREAPI_WEBHOOK_VERIFY_KEY_JWK) as JsonWebKey & { kid?: string };
		return [jwk];
	}

	const keyUrl = env.COREAPI_WEBHOOK_KEY_URL ||
		(env.COREAPI_BASE_URL ? `${env.COREAPI_BASE_URL.replace(/\/+$/, '')}/obp/v6.0.0/transactions/key` : '');
	if (!keyUrl) return [];

	const response = await fetch(keyUrl, {
		headers: { accept: 'application/json' }
	});
	if (!response.ok) return [];
	const body = await response.json().catch(() => null) as { keys?: Array<JsonWebKey & { kid?: string }> } | null;
	return Array.isArray(body?.keys) ? body.keys : [];
}

async function verifyCoreapiWebhook(request: Request, rawBody: string, env: Env): Promise<boolean> {
	const parts = signatureParts(request.headers.get('x-signature'));
	if (!parts) return false;

	const protectedJson = new TextDecoder().decode(base64UrlDecode(parts.protectedHeader));
	const protectedHeader = JSON.parse(protectedJson) as { alg?: unknown; kid?: unknown; b64?: unknown };
	if (protectedHeader.alg !== 'EdDSA' || protectedHeader.b64 !== false) return false;
	const kid = readString(protectedHeader.kid);
	const keys = await publicJwks(env);
	const candidates = keys.filter((key) => !kid || key.kid === kid);
	const signed = new TextEncoder().encode(`${parts.protectedHeader}.${rawBody}`);

	for (const jwk of candidates) {
		try {
			const key = await crypto.subtle.importKey(
				'jwk',
				jwk,
				{ name: 'Ed25519' },
				false,
				['verify']
			);
			if (await crypto.subtle.verify('Ed25519', key, bytesBuffer(parts.signature), signed)) {
				return true;
			}
		} catch {
			/* try next key */
		}
	}
	return false;
}

async function hmacSignature(secret: string, timestamp: string, body: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`));
	return [...new Uint8Array(signature)]
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

async function sendSignedWebhook(payload: OrderPayload, env: Env): Promise<boolean> {
	if (!env.FULFILLMENT_WEBHOOK_URL) throw new Error('FULFILLMENT_WEBHOOK_URL is not configured.');
	const body = JSON.stringify(payload);
	const timestamp = new Date().toISOString();
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		'x-signature-timestamp': timestamp
	};
	if (env.FULFILLMENT_WEBHOOK_SECRET) {
		headers['x-signature'] = `sha256=${await hmacSignature(env.FULFILLMENT_WEBHOOK_SECRET, timestamp, body)}`;
	}

	const response = await fetch(env.FULFILLMENT_WEBHOOK_URL, {
		method: 'POST',
		headers,
		body
	});
	if (!response.ok) throw new Error(`Fulfillment webhook failed (${response.status}).`);
	return true;
}

async function fulfillPaidOrder(payload: OrderPayload, env: Env): Promise<{
	mode: string;
	storedOrder: boolean;
	sentEmailCount: number;
	sentWebhook: boolean;
	emailProvider: string;
}> {
	const mode = fulfillmentMode(payload, env);
	const storedOrder = await collectOrderInD1(payload, env);
	const sentEmailCount = mode === 'email' || mode === 'both'
		? await sendEmails(payload, env)
		: 0;
	const sentWebhook = mode === 'webhook' || mode === 'both'
		? await sendSignedWebhook(payload, env)
		: false;

	return {
		mode,
		storedOrder,
		sentEmailCount,
		sentWebhook,
		emailProvider: emailProvider(env)
	};
}

async function prepareOrder(payload: OrderPayload, env: Env): Promise<Response> {
	if (!env.ORDER_DRAFTS) {
		return jsonResponse({ ok: false, message: 'ORDER_DRAFTS KV binding is not configured.' }, { status: 500 });
	}
	const reference = orderReference(payload);
	if (!reference) {
		return jsonResponse({ ok: false, message: 'Missing payment reference.' }, { status: 400 });
	}

	const stock = await callStockWorker(payload, env, 'shop.stock.validate');
	if (!stock.ok) {
		return jsonResponse({
			ok: false,
			message: 'Unable to verify stock before payment.',
			results: stock.results
		}, { status: stock.status });
	}

	await env.ORDER_DRAFTS.put(orderDraftKey(reference), JSON.stringify({
		...payload,
		type: 'shop.order.paid'
	}), {
		expirationTtl: draftTtlSeconds(env),
		metadata: {
			reference,
			preparedAt: new Date().toISOString()
		}
	});

	return jsonResponse({
		ok: true,
		prepared: true,
		results: stock.results
	});
}

function paymentMatchesOrder(event: TransferWebhookEvent, payload: OrderPayload): string {
	const reference = readString(event.referenceId);
	if (!reference || reference.toLowerCase() !== orderReference(payload).toLowerCase()) {
		return 'Payment reference does not match prepared order.';
	}

	const expectedTotal = orderTotal(payload);
	const paidAmount = readNumber(event.amount);
	if (expectedTotal !== null && paidAmount !== null && Math.abs(expectedTotal - paidAmount) > 0.000001) {
		return 'Payment amount does not match prepared order.';
	}

	const expectedCurrency = orderCurrency(payload);
	const paidCurrency = readString(event.currency).toLowerCase();
	if (expectedCurrency && paidCurrency && expectedCurrency !== paidCurrency) {
		return 'Payment currency does not match prepared order.';
	}

	return '';
}

async function handlePaymentWebhook(request: Request, rawBody: string, env: Env): Promise<Response> {
	if (!env.ORDER_DRAFTS) {
		return jsonResponse({ ok: false, message: 'ORDER_DRAFTS KV binding is not configured.' }, { status: 500 });
	}
	if (!await verifyCoreapiWebhook(request, rawBody, env)) {
		return jsonResponse({ ok: false, message: 'Invalid payment webhook signature.' }, { status: 401 });
	}

	const event = JSON.parse(rawBody) as TransferWebhookEvent;
	const status = readString(event.status).toLowerCase();
	if (status !== 'executed') {
		return jsonResponse({ ok: true, ignored: true, status });
	}

	const reference = readString(event.referenceId);
	if (!reference) {
		return jsonResponse({ ok: false, message: 'Missing payment reference.' }, { status: 400 });
	}

	const draft = await env.ORDER_DRAFTS.get(orderDraftKey(reference));
	if (!draft) {
		return jsonResponse({ ok: false, message: 'Prepared order was not found.' }, { status: 404 });
	}

	const processedKey = processedPaymentKey(event);
	if (await env.ORDER_DRAFTS.get(processedKey)) {
		return jsonResponse({ ok: true, duplicate: true });
	}

	const payload = JSON.parse(draft) as OrderPayload;
	const mismatch = paymentMatchesOrder(event, payload);
	if (mismatch) {
		return jsonResponse({ ok: false, message: mismatch }, { status: 409 });
	}

	const stock = await callStockWorker(payload, env, 'shop.stock.decrement', event);
	if (!stock.ok) {
		return jsonResponse({
			ok: false,
			message: 'Unable to update stock after payment.',
			results: stock.results
		}, { status: stock.status });
	}

	const paidPayload = {
		...payload,
		payment: {
			...(payload.payment || {}),
			transactionId: readString(event.transactionId) || null,
			paidAt: readString(event.occurredAt) || new Date().toISOString()
		} as OrderPayload['payment']
	};
	const fulfilled = await fulfillPaidOrder(paidPayload, env);

	await env.ORDER_DRAFTS.put(processedKey, JSON.stringify({
		reference,
		transactionId: readString(event.transactionId) || null,
		processedAt: new Date().toISOString()
	}), {
		expirationTtl: draftTtlSeconds(env)
	});
	await env.ORDER_DRAFTS.delete(orderDraftKey(reference));

	return jsonResponse({
		ok: true,
		verified: true,
		stockAdjusted: stock.results.some((result) => result.status === 'updated'),
		...fulfilled
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return jsonResponse({ ok: false, message: 'Method not allowed.' }, { status: 405 });
		}

		const rawBody = await request.text();
		let payload: OrderPayload | null = null;
		try {
			payload = JSON.parse(rawBody) as OrderPayload | null;
		} catch {
			return jsonResponse({ ok: false, message: 'Invalid JSON body.' }, { status: 400 });
		}
		if (payload?.type === 'shop.order.prepare') {
			return prepareOrder(payload, env);
		}
		if (!payload || payload.type !== 'shop.order.paid') {
			return handlePaymentWebhook(request, rawBody, env);
		}
		if (readString(env.REQUIRE_PAYMENT_WEBHOOK).toLowerCase() === 'true') {
			return jsonResponse({ ok: false, message: 'Unsupported order payload.' }, { status: 400 });
		}

		return jsonResponse({
			ok: true,
			legacy: true,
			...await fulfillPaidOrder(payload, env)
		});
	}
};
