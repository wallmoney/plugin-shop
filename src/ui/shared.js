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
					{ label: 'Catalog', value: state.settings.catalogRef, tone: 'muted' },
					{ label: 'Gateway', value: state.settings.gatewayUrl, tone: 'success' }
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
	if (state.view === 'product') return renderProductDetail(state);
	if (state.view === 'cart') return renderCart(state);
	if (state.view === 'checkout') return renderCheckout(state);
	if (state.view === 'success') return renderSuccess(state);
	if (state.view === 'orders') return renderOrders(state);
	return renderProducts(state);
}
