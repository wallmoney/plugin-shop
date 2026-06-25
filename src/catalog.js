function catalogProducts(state) {
	return state && state.catalog && Array.isArray(state.catalog.products) && state.catalog.products.length
		? state.catalog.products
		: SHOP_PRODUCTS;
}

function catalogCategories(state) {
	return state && state.catalog && Array.isArray(state.catalog.categories) && state.catalog.categories.length
		? state.catalog.categories
		: SHOP_CATEGORIES;
}

function categoryById(id, state) {
	return catalogCategories(state).find((category) => category.id === id) || catalogCategories(state)[0];
}

function productCategory(product, state) {
	return categoryById(product.category, state);
}

function filteredProducts(state) {
	const query = state.query.trim().toLowerCase();
	return catalogProducts(state).filter((product) => {
		const category = productCategory(product, state);
		const categoryMatch = state.category === 'all' || product.category === state.category;
		const queryMatch = !query || [
			product.name,
			category.label,
			product.description
		].join(' ').toLowerCase().includes(query);
		return categoryMatch && queryMatch;
	});
}

function selectedProduct(state) {
	return (
		catalogProducts(state).find((product) => product.id === state.selectedProductId) ||
		filteredProducts(state)[0] ||
		catalogProducts(state)[0] ||
		null
	);
}

function productsByCategory(categoryId, state) {
	return catalogProducts(state).filter((product) => product.category === categoryId);
}

function categoryProductCount(categoryId, state) {
	return productsByCategory(categoryId, state).length;
}

function allCategories(state) {
	return [
		{ id: 'all', label: 'All', helper: 'Every listing', order: 0 },
		...catalogCategories(state)
	];
}

function catalogSettings(state) {
	const fallback = defaultState().settings;
	const settings = state && state.settings && typeof state.settings === 'object' ? state.settings : {};
	return normalizeSettings({
		...fallback,
		...settings
	});
}

function catalogProvider(state) {
	const settings = catalogSettings(state);
	const provider = settings.catalogProvider;
	if (provider === 'd1' && settings.catalogD1Url) return 'd1';
	if (provider === 'remote') return 'remote';
	const ref = settings.catalogRef.trim();
	if (provider !== 'local' && ref && !ref.startsWith('data/')) return 'remote';
	return 'local';
}

function catalogUrl(state) {
	const settings = catalogSettings(state);
	if (catalogProvider(state) === 'd1') return settings.catalogD1Url;
	const ref = settings.catalogRef.trim();
	if (!ref) return 'https://ipf.sk';
	if (/^https?:\/\//i.test(ref)) return ref;
	if (ref.startsWith('ipfs://')) {
		return `https://ipf.sk/ipfs/${ref.slice(7).replace(/^\/+/, '')}`;
	}
	if (ref.startsWith('ipns://')) {
		return `https://ipf.sk/ipns/${ref.slice(7).replace(/^\/+/, '')}`;
	}
	if (ref.startsWith('ipns/')) return `https://ipf.sk/${ref}`;
	if (ref.startsWith('ipfs/')) return `https://ipf.sk/${ref}`;
	return `https://ipf.sk/ipfs/${ref.replace(/^\/+/, '')}`;
}

function productUrl(state, product) {
	if (product.imageUrl && /^https?:\/\//i.test(product.imageUrl)) return product.imageUrl;
	const cid = product.imageCid || product.cid;
	if (!cid) return catalogUrl(state);
	return `https://ipf.sk/ipfs/${cid}`;
}

function productImageUrl(state, product) {
	return productUrl(state, product);
}

function usesRemoteCatalog(state) {
	return catalogProvider(state) !== 'local';
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRemoteCatalogPayload(payload) {
	const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
	const categories = Array.isArray(value.categories) ? value.categories : [];
	const products = Array.isArray(value.products) ? value.products : Array.isArray(value.items) ? value.items : [];
	return normalizeCatalog({ categories, products });
}

async function loadCatalogJson(hostApi, state) {
	const url = catalogUrl(state);
	let lastError = 'Unable to load catalog.';
	for (let attempt = 0; attempt < 3; attempt += 1) {
		if (attempt > 0) await sleep(attempt * 1500);
		const response = await hostApi.network.getJson({
			url,
			timeoutMs: 12000
		}).catch((error) => {
			lastError = error && error.message ? error.message : 'Catalog request failed.';
			return null;
		});
		if (!response) continue;
		if (!response.ok) {
			lastError = `Catalog request failed (${response.status}).`;
			continue;
		}
		const catalog = normalizeRemoteCatalogPayload(response.body);
		if (catalog) return { catalog, source: url };
		lastError = 'Catalog JSON is missing valid categories or products.';
	}
	throw new Error(lastError);
}

function maybeLoadCatalog(hostApi, state) {
	if (!usesRemoteCatalog(state)) return;
	const source = catalogUrl(state);
	if (state.catalogStatus === 'loading') return;
	if (state.catalogStatus === 'loaded' && state.catalogSource === source && state.catalog) return;
	if (state.catalogStatus === 'error' && state.catalogSource === source) return;

	saveState(hostApi, {
		...state,
		catalogStatus: 'loading',
		catalogError: '',
		catalogSource: source
	});

	loadCatalogJson(hostApi, state)
		.then((result) => {
			const nextState = getState(hostApi);
			saveState(hostApi, {
				...nextState,
				catalog: result.catalog,
				catalogStatus: 'loaded',
				catalogError: '',
				catalogSource: result.source,
				category: 'all',
				selectedProductId: result.catalog.products[0] ? result.catalog.products[0].id : nextState.selectedProductId,
				page: 1
			});
		})
		.catch((error) => {
			const nextState = getState(hostApi);
			saveState(hostApi, {
				...nextState,
				catalog: null,
				catalogStatus: 'error',
				catalogError: error && error.message ? error.message : 'Unable to load catalog.',
				catalogSource: source
			});
		});
}
