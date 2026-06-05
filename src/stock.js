function stockItems(state) {
	return cartItems(state).map((item) => ({
		id: item.product.id,
		name: item.product.name,
		quantity: item.quantity
	}));
}

function stockPayload(state, type, result) {
	const reference = result && result.request && result.request.reference ? result.request.reference : orderReference(state);
	return {
		type,
		shop: {
			name: SHOP_CONFIG.name
		},
		payment: {
			reference,
			sessionId: result && result.sessionId ? result.sessionId : null,
			paidAt: result && result.executedAt ? result.executedAt : null
		},
		items: stockItems(state)
	};
}

function stockWebhookHeaders(config) {
	return config.authHeader ? { authorization: config.authHeader } : undefined;
}

function stockManagedPaymentAction(state, paymentRequest) {
	const config = SHOP_CONFIG.stockManagement || {};
	const provider = config.provider || 'none';
	if (provider === 'none' || provider !== 'webhook' || !config.webhookUrl) {
		return {
			type: 'payment',
			request: paymentRequest
		};
	}

	return {
		type: 'stockCheckedPayment',
		check: {
			url: config.webhookUrl,
			headers: stockWebhookHeaders(config),
			body: stockPayload(state, 'shop.stock.validate')
		},
		storageKey: STATE_KEY,
		cart: state.cart,
		request: paymentRequest
	};
}

async function sendStockAdjustment(hostApi, state, result) {
	const config = SHOP_CONFIG.stockManagement || {};
	const provider = config.provider || 'none';
	if (provider === 'none') return { ok: true, adjusted: false, reason: 'Stock management disabled.' };
	if (provider !== 'webhook') return { ok: true, adjusted: false, reason: `Unsupported stock provider: ${provider}` };
	if (!config.webhookUrl) return { ok: true, adjusted: false, reason: 'Stock webhook is not configured.' };

	const response = await hostApi.network.postJson({
		url: config.webhookUrl,
		headers: stockWebhookHeaders(config),
		body: stockPayload(state, 'shop.stock.decrement', result)
	});
	if (!response.ok) {
		throw new Error(`Stock webhook failed (${response.status}).`);
	}
	return { ok: true, adjusted: true, provider: 'webhook' };
}
