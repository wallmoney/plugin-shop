function renderCart(state) {
	const items = cartItems(state);
	return {
		type: 'shopCart',
		shopTitle: SHOP_CONFIG.name,
		shopLogoUrl: SHOP_CONFIG.logoUrl,
		coreId: state.coreId,
		cartCount: cartCount(state),
		theme: state.theme,
		themeAction: stateAction(state, { theme: state.theme === 'auto' ? 'dark' : state.theme === 'dark' ? 'light' : 'auto' }),
		portalAction: { type: 'navigate', href: '/' },
		homeAction: stateAction(state, { view: 'products', category: 'all', page: 1 }),
		checkoutAction: stateAction(state, { view: 'checkout' }),
		clearAction: stateAction(state, { cart: {}, checkoutStatus: 'draft' }, 'Cart cleared'),
		subtotal: formatMoney(cartSubtotal(state), state.settings.currency),
		items: items.map((item) => ({
			id: item.product.id,
			name: item.product.name,
			vendor: item.product.vendor || SHOP_CONFIG.name,
			imageUrl: productImageUrl(state, item.product),
			icon: item.product.icon,
			packLabel: item.product.packLabel || 'Standard pack',
			quantity: item.quantity,
			price: formatMoney(item.product.price, state.settings.currency),
			lineTotal: formatMoney(item.product.price * item.quantity, state.settings.currency),
			productAction: stateAction(state, {
				view: 'product',
				category: item.product.category,
				selectedProductId: item.product.id,
				productQuantities: {
					...state.productQuantities,
					[item.product.id]: Math.max(1, item.quantity)
				}
			}),
			addAction: stateAction(addToCart(state, item.product.id), {}),
			removeAction: stateAction(removeOneFromCart(state, item.product.id), {}),
			deleteAction: stateAction(removeProductFromCart(state, item.product.id), {})
		}))
	};
}
