// @ts-nocheck
function stockItems(state) {
	return cartItems(state).map((item) => ({
		id: item.product.id,
		skuid: item.product.skuid || '',
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

function stockManagedPaymentAction(state, paymentRequest) {
	const config = SHOP_CONFIG.stockManagement || {};
	const provider = config.provider || 'none';
	const paymentConfig = SHOP_CONFIG.orderPayment || {};
	const paymentWebhookUrl = paymentConfig.webhookUrl || '';
	if (!paymentWebhookUrl && (provider === 'none' || provider !== 'api' || !config.apiUrl)) {
		return {
			type: 'payment',
			request: paymentRequest
		};
	}

	return {
		type: 'stockCheckedPayment',
		check: {
			url: paymentWebhookUrl || config.apiUrl,
			body: paymentWebhookUrl
				? orderPreparePayload(state, {
					request: paymentRequest,
					sessionId: null,
					executedAt: null
				})
				: stockPayload(state, 'shop.stock.validate')
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
	if (provider !== 'api') return { ok: true, adjusted: false, reason: `Unsupported stock provider: ${provider}` };
	if (!config.apiUrl) return { ok: true, adjusted: false, reason: 'Stock API endpoint is not configured.' };

	const response = await hostApi.network.postJson({
		url: config.apiUrl,
		body: stockPayload(state, 'shop.stock.decrement', result)
	});
	if (!response.ok) {
		throw new Error(`Stock API failed (${response.status}).`);
	}
	return { ok: true, adjusted: true, provider: 'api' };
}
