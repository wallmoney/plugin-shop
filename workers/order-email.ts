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

type Env = {
	EMAIL: EmailSendBinding;
	EMAIL_FROM: string;
	EMAIL_FROM_NAME?: string;
	ORDER_WEBHOOK_TOKEN?: string;
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

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return jsonResponse({ ok: false, message: 'Method not allowed.' }, { status: 405 });
		}

		if (env.ORDER_WEBHOOK_TOKEN) {
			const expected = `Bearer ${env.ORDER_WEBHOOK_TOKEN}`;
			if (request.headers.get('authorization') !== expected) {
				return jsonResponse({ ok: false, message: 'Unauthorized.' }, { status: 401 });
			}
		}

		const payload = await request.json().catch(() => null) as { email?: Record<string, unknown> } | null;
		const email = payload?.email ?? {};
		const to = readString(email.to);
		const replyTo = readString(email.replyTo);
		const subject = readString(email.subject);
		const text = readString(email.text);
		const html = readString(email.html);

		if (!isValidEmail(to)) return jsonResponse({ ok: false, message: 'Recipient email is invalid.' }, { status: 400 });
		if (!subject) return jsonResponse({ ok: false, message: 'Subject is required.' }, { status: 400 });
		if (!text && !html) return jsonResponse({ ok: false, message: 'Email body is required.' }, { status: 400 });
		if (!isValidEmail(env.EMAIL_FROM)) return jsonResponse({ ok: false, message: 'EMAIL_FROM is invalid.' }, { status: 500 });

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

		return jsonResponse({ ok: true, sent: true, provider: 'cloudflare-email-service' });
	}
};
