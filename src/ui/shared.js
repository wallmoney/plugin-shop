function shopLogoUrl() {
	if (SHOP_CONFIG.logoSrc) return SHOP_CONFIG.logoSrc;
	if (SHOP_CONFIG.logoUrl) return SHOP_CONFIG.logoUrl;
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	return context && typeof context.iconUrl === 'string' ? context.iconUrl : '';
}

function renderHero(state) {
	return {
		type: 'section',
		title: 'Open marketplace, IPFS-native listings',
		description: 'A dark, card-driven marketplace flow inspired by Plebeian Market: browse, filter, cart, checkout, and pay through Wall Money.',
		children: [
			{
				type: 'badgeGrid',
				items: [
					{ label: 'Cart', value: `${cartCount(state)} item${cartCount(state) === 1 ? '' : 's'}`, tone: cartCount(state) ? 'success' : 'muted' },
					{ label: 'Catalog', value: catalogProvider(state) === 'd1' ? 'D1 database' : catalogSettings(state).catalogRef, tone: 'muted' }
				]
			},
			{
				type: 'buttonRow',
				buttons: [
					{ label: 'Products', variant: state.view === 'products' ? 'primary' : 'secondary', action: stateAction(state, { view: 'products' }) },
					{ label: `Cart (${cartCount(state)})`, variant: state.view === 'cart' ? 'primary' : 'secondary', action: stateAction(state, { view: 'cart' }) },
					{ label: 'Checkout', variant: state.view === 'checkout' ? 'primary' : 'secondary', action: stateAction(checkoutReadyState(state), {}) },
					{ label: 'Orders', variant: state.view === 'orders' ? 'primary' : 'secondary', action: stateAction(state, { view: 'orders' }) }
				]
			}
		]
	};
}

function renderView(state) {
	if (usesRemoteCatalog(state) && state.catalogStatus === 'loading') {
		return {
			type: 'section',
			title: 'Loading catalog',
			description: `Fetching product JSON from ${catalogUrl(state)}.`,
			children: [
				{ type: 'text', tone: 'muted', text: catalogProvider(state) === 'd1' ? 'Loading categories and products from the configured D1 catalog Worker.' : 'IPFS/IPNS gateways can take a moment to resolve new content.' }
			]
		};
	}
	if (usesRemoteCatalog(state) && state.catalogStatus === 'error') {
		return {
			type: 'section',
			title: 'Catalog unavailable',
			description: state.catalogError || 'The remote catalog could not be loaded.',
			children: [
				{ type: 'text', tone: 'muted', text: catalogUrl(state) },
				{
					type: 'buttonRow',
					buttons: [
						{
							label: 'Retry',
							variant: 'primary',
							action: stateAction(state, {
								catalog: null,
								catalogStatus: 'idle',
								catalogError: '',
								catalogSource: '',
								page: 1
							})
						},
						{ label: 'Use local catalog', variant: 'secondary', action: stateAction(state, { settings: { ...state.settings, catalogProvider: 'local', catalogRef: SHOP_CONFIG.defaultCatalogRef }, catalogStatus: 'idle', catalogError: '', catalogSource: '', catalog: null }) }
					]
				}
			]
		};
	}
	if (state.view === 'product') return renderProductDetail(state);
	if (state.view === 'cart') return renderCart(state);
	if (state.view === 'checkout') return renderCheckout(state);
	if (state.view === 'success') return renderSuccess(state);
	if (state.view === 'orders') return renderOrders(state);
	return renderProducts(state);
}
