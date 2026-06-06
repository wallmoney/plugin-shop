function defaultState() {
	return {
		view: 'products',
		category: 'all',
		selectedProductId: SHOP_PRODUCTS[0] ? SHOP_PRODUCTS[0].id : '',
		coreId: null,
		userEmail: '',
		emailRequestStatus: 'idle',
		countryCode: '',
		theme: 'auto',
		query: '',
		page: 1,
		productQuantities: {},
		cart: {},
		delivery: {
			name: '',
			email: '',
			phone: '',
			address: '',
			address2: '',
			city: '',
			zip: '',
			state: '',
			country: '',
			notes: ''
		},
		saveDelivery: true,
		savedDelivery: null,
		checkoutStatus: 'draft',
		lastOrder: null,
		settings: {
			merchantAccount: SHOP_CONFIG.defaultMerchantAccount,
			adminEmail: SHOP_CONFIG.orderEmail.adminEmail,
			currency: SHOP_CONFIG.defaultCurrency,
			gatewayUrl: SHOP_CONFIG.defaultGatewayUrl,
			catalogRef: SHOP_CONFIG.defaultCatalogRef
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
	const country = cleanString(value.country, fallback.country);
	const isUnitedStates = country === 'United States' || country === 'US';
	return {
		name: cleanString(value.name, fallback.name),
		email: cleanString(value.email, fallback.email),
		phone: cleanString(value.phone, fallback.phone),
		address: cleanString(value.address, fallback.address),
		address2: cleanString(value.address2, fallback.address2),
		city: cleanString(value.city, fallback.city),
		zip: cleanString(value.zip, fallback.zip),
		state: isUnitedStates ? cleanString(value.state, fallback.state) : '',
		country,
		notes: cleanString(value.notes, fallback.notes)
	};
}

function normalizeSettings(raw) {
	const fallback = defaultState().settings;
	const value = objectValue(raw);
	return {
		merchantAccount: cleanString(value.merchantAccount, fallback.merchantAccount),
		adminEmail: cleanString(value.adminEmail, fallback.adminEmail),
		currency: cleanString(value.currency, fallback.currency).toUpperCase(),
		gatewayUrl: cleanString(value.gatewayUrl, fallback.gatewayUrl).replace(/\/+$/, ''),
		catalogRef: cleanString(value.catalogRef, fallback.catalogRef)
	};
}

function normalizeCategory(raw) {
	const fallback = 'all';
	const value = cleanString(raw, fallback).toLowerCase();
	return value === 'all' || SHOP_CATEGORIES.some((category) => category.id === value) ? value : fallback;
}

function normalizeProductId(raw, category) {
	const fallbackProduct =
		(category === 'all' ? SHOP_PRODUCTS[0] : SHOP_PRODUCTS.find((product) => product.category === category)) ||
		SHOP_PRODUCTS[0] ||
		null;
	const fallback = fallbackProduct ? fallbackProduct.id : '';
	const value = cleanString(raw, fallback);
	return SHOP_PRODUCTS.some((product) => product.id === value) ? value : fallback;
}

function normalizeCart(raw) {
	const cart = {};
	const value = objectValue(raw);
	for (const product of SHOP_PRODUCTS) {
		const quantity = Number(value[product.id]);
		if (Number.isFinite(quantity) && quantity > 0) {
			cart[product.id] = Math.round(quantity);
		}
	}
	return cart;
}

function normalizeQuantities(raw) {
	const quantities = {};
	const value = objectValue(raw);
	for (const product of SHOP_PRODUCTS) {
		const quantity = Number(value[product.id]);
		quantities[product.id] = Number.isFinite(quantity) && quantity > 0 ? Math.max(1, Math.round(quantity)) : 1;
	}
	return quantities;
}

function normalizeTheme(raw) {
	const value = cleanString(raw, 'auto').toLowerCase();
	return ['auto', 'light', 'dark'].includes(value) ? value : 'auto';
}

function normalizeState(raw) {
	const fallback = defaultState();
	const value = objectValue(raw);
	const view = ['products', 'product', 'cart', 'checkout', 'orders', 'success'].includes(value.view)
		? value.view
		: fallback.view;
	const category = normalizeCategory(value.category);
	return {
		...fallback,
		...value,
		view,
		category,
		selectedProductId: normalizeProductId(value.selectedProductId, category),
		coreId: typeof value.coreId === 'string' && value.coreId.trim() ? value.coreId.trim() : null,
		userEmail: cleanString(value.userEmail, fallback.userEmail),
		emailRequestStatus: ['idle', 'requested', 'resolved'].includes(value.emailRequestStatus)
			? value.emailRequestStatus
			: fallback.emailRequestStatus,
		countryCode: cleanString(value.countryCode, fallback.countryCode).toUpperCase(),
		theme: normalizeTheme(value.theme),
		query: typeof value.query === 'string' ? value.query : fallback.query,
		page: Number.isFinite(Number(value.page)) && Number(value.page) > 0 ? Math.floor(Number(value.page)) : fallback.page,
		productQuantities: normalizeQuantities(value.productQuantities),
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
	hostApi.storage.set(STATE_KEY, normalizeState(next));
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
