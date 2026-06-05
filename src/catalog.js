function categoryById(id) {
	return SHOP_CATEGORIES.find((category) => category.id === id) || SHOP_CATEGORIES[0];
}

function productCategory(product) {
	return categoryById(product.category);
}

function filteredProducts(state) {
	const query = state.query.trim().toLowerCase();
	return SHOP_PRODUCTS.filter((product) => {
		const category = productCategory(product);
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
		SHOP_PRODUCTS.find((product) => product.id === state.selectedProductId) ||
		filteredProducts(state)[0] ||
		SHOP_PRODUCTS[0] ||
		null
	);
}

function productsByCategory(categoryId) {
	return SHOP_PRODUCTS.filter((product) => product.category === categoryId);
}

function categoryProductCount(categoryId) {
	return productsByCategory(categoryId).length;
}

function allCategories() {
	return [
		{ id: 'all', label: 'All', helper: 'Every listing', order: 0 },
		...SHOP_CATEGORIES
	];
}

function catalogUrl(state) {
	const ref = state.settings.catalogRef.trim();
	if (!ref) return state.settings.gatewayUrl;
	if (/^https?:\/\//i.test(ref)) return ref;
	if (ref.startsWith('ipfs://')) {
		return `${state.settings.gatewayUrl}/ipfs/${ref.slice(7).replace(/^\/+/, '')}`;
	}
	if (ref.startsWith('ipns://')) {
		return `${state.settings.gatewayUrl}/ipns/${ref.slice(7).replace(/^\/+/, '')}`;
	}
	if (ref.startsWith('ipns/')) return `${state.settings.gatewayUrl}/${ref}`;
	if (ref.startsWith('ipfs/')) return `${state.settings.gatewayUrl}/${ref}`;
	return `${state.settings.gatewayUrl}/ipfs/${ref.replace(/^\/+/, '')}`;
}

function productUrl(state, product) {
	if (!product.cid) return catalogUrl(state);
	return `${state.settings.gatewayUrl}/ipfs/${product.cid}`;
}

function productImageUrl(state, product) {
	return productUrl(state, product);
}
