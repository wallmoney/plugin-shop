function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function orderEmailItems(state) {
	return cartItems(state).map((item) => ({
		name: item.product.name,
		quantity: item.quantity,
		unitPrice: formatMoney(item.product.price, item.product.currency || state.settings.currency),
		lineTotal: formatMoney(item.product.price * item.quantity, item.product.currency || state.settings.currency),
		cid: item.product.cid
	}));
}

function orderEmailSubject(state, result) {
	const prefix = SHOP_CONFIG.orderEmail.subjectPrefix || 'New shop order';
	const reference = result.request && result.request.reference ? result.request.reference : orderReference(state);
	return `${prefix}: ${reference}`;
}

function orderEmailText(state, result) {
	const reference = result.request && result.request.reference ? result.request.reference : orderReference(state);
	const delivery = state.delivery || {};
	const items = orderEmailItems(state);
	return [
		`A new ${SHOP_CONFIG.name} order was paid.`,
		'',
		`Reference: ${reference}`,
		`Payment session: ${result.sessionId || 'n/a'}`,
		`Paid at: ${result.executedAt || new Date().toISOString()}`,
		`Total: ${formatMoney(cartTotal(state), state.settings.currency)}`,
		'',
		'Items:',
		...items.map((item) => `- ${item.name} × ${item.quantity}: ${item.lineTotal} (${item.cid})`),
		'',
		'Delivery:',
		`Name: ${delivery.name || 'n/a'}`,
		`Email: ${delivery.email || 'n/a'}`,
		`Phone: ${delivery.phone || 'n/a'}`,
		`Address: ${delivery.address || 'n/a'}`,
		`City / ZIP: ${delivery.city || 'n/a'}`,
		`Country: ${delivery.country || 'n/a'}`,
		`Notes: ${delivery.notes || 'n/a'}`,
		'',
		`Core ID: ${state.coreId || delivery.name || 'n/a'}`
	].join('\n');
}

function orderEmailHtml(state, result) {
	const reference = result.request && result.request.reference ? result.request.reference : orderReference(state);
	const delivery = state.delivery || {};
	const items = orderEmailItems(state);
	return [
		`<h1>New paid ${escapeHtml(SHOP_CONFIG.name)} order</h1>`,
		'<h2>Payment</h2>',
		'<ul>',
		`<li><strong>Reference:</strong> ${escapeHtml(reference)}</li>`,
		`<li><strong>Payment session:</strong> ${escapeHtml(result.sessionId || 'n/a')}</li>`,
		`<li><strong>Paid at:</strong> ${escapeHtml(result.executedAt || new Date().toISOString())}</li>`,
		`<li><strong>Total:</strong> ${escapeHtml(formatMoney(cartTotal(state), state.settings.currency))}</li>`,
		'</ul>',
		'<h2>Items</h2>',
		'<ul>',
		...items.map((item) => `<li><strong>${escapeHtml(item.name)}</strong> × ${escapeHtml(item.quantity)} — ${escapeHtml(item.lineTotal)}<br><small>${escapeHtml(item.cid)}</small></li>`),
		'</ul>',
		'<h2>Delivery</h2>',
		'<ul>',
		`<li><strong>Name:</strong> ${escapeHtml(delivery.name || 'n/a')}</li>`,
		`<li><strong>Email:</strong> ${escapeHtml(delivery.email || 'n/a')}</li>`,
		`<li><strong>Phone:</strong> ${escapeHtml(delivery.phone || 'n/a')}</li>`,
		`<li><strong>Address:</strong> ${escapeHtml(delivery.address || 'n/a')}</li>`,
		`<li><strong>City / ZIP:</strong> ${escapeHtml(delivery.city || 'n/a')}</li>`,
		`<li><strong>Country:</strong> ${escapeHtml(delivery.country || 'n/a')}</li>`,
		`<li><strong>Notes:</strong> ${escapeHtml(delivery.notes || 'n/a')}</li>`,
		'</ul>',
		`<p><strong>Core ID:</strong> ${escapeHtml(state.coreId || delivery.name || 'n/a')}</p>`
	].join('');
}

function mailtoOrderUrl(state, result) {
	const email = SHOP_CONFIG.orderEmail.adminEmail || '';
	const subject = orderEmailSubject(state, result);
	const body = orderEmailText(state, result);
	return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function orderWebhookPayload(state, result) {
	const reference = result.request && result.request.reference ? result.request.reference : orderReference(state);
	return {
		type: 'shop.order.paid',
		shop: {
			name: SHOP_CONFIG.name,
			adminEmail: SHOP_CONFIG.orderEmail.adminEmail || null
		},
		payment: {
			reference,
			sessionId: result.sessionId || null,
			paidAt: result.executedAt || new Date().toISOString(),
			total: cartTotal(state),
			currency: state.settings.currency
		},
		customer: {
			coreId: state.coreId || null,
			replyTo: state.delivery && state.delivery.email ? state.delivery.email : null
		},
		delivery: state.delivery,
		items: orderEmailItems(state),
		email: {
			to: SHOP_CONFIG.orderEmail.adminEmail || '',
			replyTo: state.delivery && state.delivery.email ? state.delivery.email : null,
			subject: orderEmailSubject(state, result),
			text: orderEmailText(state, result),
			html: orderEmailHtml(state, result)
		}
	};
}

async function sendAdminOrderEmail(hostApi, state, result) {
	const config = SHOP_CONFIG.orderEmail || {};
	const provider = config.provider || 'none';
	const adminEmail = config.adminEmail || '';
	if (provider === 'none' || !adminEmail) return { ok: true, sent: false, reason: 'Admin email disabled.' };

	if (provider === 'mailto') {
		await hostApi.ui.navigate(mailtoOrderUrl(state, result));
		return { ok: true, sent: true, provider: 'mailto' };
	}

	if (provider !== 'webhook') return { ok: true, sent: false, reason: `Unsupported email provider: ${provider}` };
	if (!config.webhookUrl) return { ok: true, sent: false, reason: 'Order email webhook is not configured.' };

	const response = await hostApi.network.postJson({
		url: config.webhookUrl,
		headers: config.authHeader ? { authorization: config.authHeader } : undefined,
		body: orderWebhookPayload(state, result)
	});
	if (!response.ok) {
		throw new Error(`Order email webhook failed (${response.status}).`);
	}
	return { ok: true, sent: true, provider: 'webhook' };
}
