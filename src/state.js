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
		savedDeliveries: [],
		selectedDeliveryProfileId: '',
		checkoutStatus: 'draft',
		lastOrder: null,
		catalog: null,
		catalogStatus: 'idle',
		catalogError: '',
		catalogSource: '',
		settings: {
			merchantAccount: SHOP_CONFIG.defaultMerchantAccount,
			adminEmail: SHOP_CONFIG.orderEmail.adminEmail,
			currency: SHOP_CONFIG.defaultCurrency,
			catalogProvider: SHOP_CONFIG.defaultCatalogProvider || 'local',
			catalogRef: SHOP_CONFIG.defaultCatalogRef,
			catalogD1Url: SHOP_CONFIG.catalogD1 && SHOP_CONFIG.catalogD1.apiUrl ? SHOP_CONFIG.catalogD1.apiUrl : ''
		},
		updatedAt: null
	};
}

function defaultCatalog() {
	return {
		categories: SHOP_CATEGORIES,
		products: SHOP_PRODUCTS
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

function deliveryProfileKey(delivery) {
	const value = normalizeDelivery(delivery);
	return (value.address || value.email || '').trim().toLowerCase();
}

function deliveryProfileId(delivery) {
	const key = deliveryProfileKey(delivery);
	return key
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 64);
}

function hasDeliveryAddress(delivery) {
	const value = normalizeDelivery(delivery);
	return Boolean(value.address && value.city && value.zip && value.country);
}

function deliveryProfileLabel(delivery) {
	const value = normalizeDelivery(delivery);
	return value.address || value.email || 'Saved delivery profile';
}

function normalizeSavedDeliveries(raw, legacy) {
	const profiles = [];
	const seen = new Set();
	const values = Array.isArray(raw) ? [...raw] : [];
	if (legacy) values.unshift(legacy);
	for (const item of values) {
		const delivery = normalizeDelivery(item);
		if (!deliveryProfileKey(delivery) || !hasDeliveryAddress(delivery)) continue;
		const key = deliveryProfileKey(delivery);
		if (seen.has(key)) continue;
		seen.add(key);
		profiles.push(delivery);
	}
	return profiles;
}

function upsertSavedDeliveryProfile(profiles, delivery) {
	const next = normalizeSavedDeliveries(profiles);
	const value = normalizeDelivery(delivery);
	const key = deliveryProfileKey(value);
	if (!key || !hasDeliveryAddress(value)) return next;
	const index = next.findIndex((profile) => deliveryProfileKey(profile) === key);
	if (index >= 0) {
		next[index] = value;
	} else {
		next.push(value);
	}
	return next;
}

function removeSavedDeliveryProfile(profiles, profileId) {
	return normalizeSavedDeliveries(profiles).filter((profile) => deliveryProfileId(profile) !== profileId);
}

function normalizeSettings(raw) {
	const fallback = defaultState().settings;
	const value = objectValue(raw);
	const provider = cleanString(value.catalogProvider, fallback.catalogProvider).toLowerCase();
	return {
		merchantAccount: cleanString(value.merchantAccount, fallback.merchantAccount),
		adminEmail: cleanString(value.adminEmail, fallback.adminEmail),
		currency: cleanString(value.currency, fallback.currency).toUpperCase(),
		catalogProvider: provider === 'remote' || provider === 'd1' ? provider : 'local',
		catalogRef: cleanString(value.catalogRef, fallback.catalogRef),
		catalogD1Url: cleanString(value.catalogD1Url, fallback.catalogD1Url)
	};
}

function normalizeCatalog(raw) {
	const value = objectValue(raw);
	const categories = Array.isArray(value.categories) ? value.categories : [];
	const products = Array.isArray(value.products) ? value.products : [];
	const normalizedCategories = categories
		.map((category) => objectValue(category))
		.map((category) => ({
			id: cleanString(category.id, ''),
			label: cleanString(category.label, ''),
			helper: cleanString(category.helper, ''),
			order: Number(category.order)
		}))
		.filter((category) => category.id && category.label)
		.sort((first, second) => {
			const firstOrder = Number.isFinite(first.order) ? first.order : 999;
			const secondOrder = Number.isFinite(second.order) ? second.order : 999;
			return firstOrder === secondOrder ? first.label.localeCompare(second.label) : firstOrder - secondOrder;
		});
	const categoryIds = new Set(normalizedCategories.map((category) => category.id));
	const normalizedProducts = products
		.map((product) => objectValue(product))
		.map((product) => ({
			id: cleanString(product.id, ''),
			name: cleanString(product.name, ''),
			category: cleanString(product.category, ''),
			price: Number(product.price),
			icon: cleanString(product.icon, ''),
			cid: cleanString(product.cid, ''),
			imageCid: cleanString(product.imageCid, ''),
			imageUrl: cleanString(product.imageUrl, ''),
			description: cleanString(product.description, ''),
			vendor: cleanString(product.vendor, ''),
			badge: cleanString(product.badge, ''),
			packLabel: cleanString(product.packLabel, ''),
			digital: product.digital === true,
			order: Number(product.order)
		}))
		.filter((product) =>
			product.id &&
			product.name &&
			product.category &&
			categoryIds.has(product.category) &&
			Number.isFinite(product.price) &&
			product.price >= 0
		)
		.sort((first, second) => {
			const firstOrder = Number.isFinite(first.order) ? first.order : 999;
			const secondOrder = Number.isFinite(second.order) ? second.order : 999;
			return firstOrder === secondOrder ? first.name.localeCompare(second.name) : firstOrder - secondOrder;
		});

	if (!normalizedCategories.length || !normalizedProducts.length) return null;
	return {
		categories: normalizedCategories,
		products: normalizedProducts
	};
}

function activeCatalog(raw) {
	return normalizeCatalog(raw) || defaultCatalog();
}

function activeProducts(catalog) {
	return activeCatalog(catalog).products;
}

function normalizeCategory(raw, catalog) {
	const fallback = 'all';
	const value = cleanString(raw, fallback).toLowerCase();
	const categories = activeCatalog(catalog).categories;
	return value === 'all' || categories.some((category) => category.id === value) ? value : fallback;
}

function normalizeProductId(raw, category, catalog) {
	const products = activeProducts(catalog);
	const fallbackProduct =
		(category === 'all' ? products[0] : products.find((product) => product.category === category)) ||
		products[0] ||
		null;
	const fallback = fallbackProduct ? fallbackProduct.id : '';
	const value = cleanString(raw, fallback);
	return products.some((product) => product.id === value) ? value : fallback;
}

function normalizeCart(raw, catalog) {
	const cart = {};
	const value = objectValue(raw);
	for (const product of activeCatalog(catalog).products) {
		const quantity = Number(value[product.id]);
		if (Number.isFinite(quantity) && quantity > 0) {
			cart[product.id] = Math.round(quantity);
		}
	}
	return cart;
}

function normalizeQuantities(raw, catalog) {
	const quantities = {};
	const value = objectValue(raw);
	for (const product of activeCatalog(catalog).products) {
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
	const catalog = normalizeCatalog(value.catalog);
	const category = normalizeCategory(value.category, catalog);
	const savedDeliveries = normalizeSavedDeliveries(value.savedDeliveries, value.savedDelivery);
	const selectedDeliveryProfileId = savedDeliveries.some((profile) => deliveryProfileId(profile) === value.selectedDeliveryProfileId)
		? value.selectedDeliveryProfileId
		: '';
	return {
		...fallback,
		...value,
		view,
		category,
		selectedProductId: normalizeProductId(value.selectedProductId, category, catalog),
		coreId: typeof value.coreId === 'string' && value.coreId.trim() ? value.coreId.trim() : null,
		userEmail: cleanString(value.userEmail, fallback.userEmail),
		emailRequestStatus: ['idle', 'requested', 'resolved'].includes(value.emailRequestStatus)
			? value.emailRequestStatus
			: fallback.emailRequestStatus,
		countryCode: cleanString(value.countryCode, fallback.countryCode).toUpperCase(),
		theme: normalizeTheme(value.theme),
		query: typeof value.query === 'string' ? value.query : fallback.query,
		page: Number.isFinite(Number(value.page)) && Number(value.page) > 0 ? Math.floor(Number(value.page)) : fallback.page,
		productQuantities: normalizeQuantities(value.productQuantities, catalog),
		cart: normalizeCart(value.cart, catalog),
		delivery: normalizeDelivery(value.delivery),
		saveDelivery: value.saveDelivery !== false,
		savedDelivery: savedDeliveries[0] || null,
		savedDeliveries,
		selectedDeliveryProfileId,
		checkoutStatus: cleanString(value.checkoutStatus, fallback.checkoutStatus),
		lastOrder: value.lastOrder && typeof value.lastOrder === 'object' ? value.lastOrder : null,
		catalog,
		catalogStatus: ['idle', 'loading', 'loaded', 'error'].includes(value.catalogStatus)
			? value.catalogStatus
			: fallback.catalogStatus,
		catalogError: cleanString(value.catalogError, fallback.catalogError),
		catalogSource: cleanString(value.catalogSource, fallback.catalogSource),
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
