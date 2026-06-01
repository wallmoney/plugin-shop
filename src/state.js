function defaultState() {
	return {
		view: 'products',
		category: 'all',
		query: '',
		cart: {},
		delivery: {
			name: '',
			email: '',
			phone: '',
			address: '',
			city: '',
			country: '',
			notes: ''
		},
		saveDelivery: true,
		savedDelivery: null,
		checkoutStatus: 'draft',
		lastOrder: null,
		settings: {
			merchantAccount: SHOP_CONFIG.defaultMerchantAccount,
			currency: SHOP_CONFIG.defaultCurrency,
			gatewayUrl: SHOP_CONFIG.defaultGatewayUrl,
			catalogRef: SHOP_CONFIG.defaultCatalogRef,
			uploadProviderUrl: SHOP_CONFIG.defaultUploadProviderUrl
		},
		updatedAt: null
	};
}

function objectValue(value) {
	return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function cleanString(value, fallback) {
	if (typeof value !== 'string') return fallback || '';
	const trimmed = value.trim();
	return trimmed || fallback || '';
}

function normalizeDelivery(raw) {
	const fallback = defaultState().delivery;
	const value = objectValue(raw);
	return {
		name: cleanString(value.name, fallback.name),
		email: cleanString(value.email, fallback.email),
		phone: cleanString(value.phone, fallback.phone),
		address: cleanString(value.address, fallback.address),
		city: cleanString(value.city, fallback.city),
		country: cleanString(value.country, fallback.country),
		notes: cleanString(value.notes, fallback.notes)
	};
}

function normalizeSettings(raw) {
	const fallback = defaultState().settings;
	const value = objectValue(raw);
	return {
		merchantAccount: cleanString(value.merchantAccount, fallback.merchantAccount),
		currency: cleanString(value.currency, fallback.currency).toUpperCase(),
		gatewayUrl: cleanString(value.gatewayUrl, fallback.gatewayUrl).replace(/\/+$/, ''),
		catalogRef: cleanString(value.catalogRef, fallback.catalogRef),
		uploadProviderUrl: cleanString(value.uploadProviderUrl, fallback.uploadProviderUrl)
	};
}

function normalizeCategory(raw) {
	const value = cleanString(raw, 'all').toLowerCase();
	return SHOP_CATEGORIES.some((category) => category.id === value) ? value : 'all';
}

function normalizeCart(raw) {
	const cart = {};
	const value = objectValue(raw);
	for (const product of SHOP_PRODUCTS) {
		const quantity = Number(value[product.id]);
		if (Number.isFinite(quantity) && quantity > 0) {
			cart[product.id] = Math.min(product.stock, Math.round(quantity));
		}
	}
	return cart;
}

function normalizeState(raw) {
	const fallback = defaultState();
	const value = objectValue(raw);
	const view = ['products', 'cart', 'checkout', 'settings', 'orders'].includes(value.view)
		? value.view
		: fallback.view;
	return {
		...fallback,
		...value,
		view,
		category: normalizeCategory(value.category),
		query: typeof value.query === 'string' ? value.query : fallback.query,
		cart: normalizeCart(value.cart),
		delivery: normalizeDelivery(value.delivery),
		saveDelivery: value.saveDelivery !== false,
		savedDelivery: value.savedDelivery ? normalizeDelivery(value.savedDelivery) : null,
		checkoutStatus: cleanString(value.checkoutStatus, fallback.checkoutStatus),
		lastOrder: value.lastOrder && typeof value.lastOrder === 'object' ? value.lastOrder : null,
		settings: normalizeSettings(value.settings),
		updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null
	};
}

function getState(hostApi) {
	return normalizeState(hostApi.storage.get(STATE_KEY));
}

function saveState(hostApi, next) {
	hostApi.storage.set(STATE_KEY, normalizeState({
		...next,
		updatedAt: new Date().toISOString()
	}));
}

function stateAction(state, patch, message) {
	return {
		type: 'storage',
		key: STATE_KEY,
		value: normalizeState({
			...state,
			...patch
		}),
		message,
		level: message ? 'success' : undefined
	};
}
