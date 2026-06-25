function renderCart(state) {
	const items = cartItems(state);
	return {
		type: 'section',
		title: 'Cart',
		description: `${cartCount(state)} item${cartCount(state) === 1 ? '' : 's'} • ${formatMoney(cartSubtotal(state), state.settings.currency)}`,
		children: items.length
			? [
				...items.map((item) => ({
					type: 'section',
					title: item.product.name,
					description: item.product.packLabel || item.product.vendor || SHOP_CONFIG.name,
					children: [
						{
							type: 'badgeGrid',
							items: [
								{ label: 'Quantity', value: String(item.quantity), tone: 'muted' },
								{ label: 'Price', value: formatMoney(item.product.price, state.settings.currency), tone: 'muted' },
								{ label: 'Line total', value: formatMoney(item.product.price * item.quantity, state.settings.currency), tone: 'success' }
							]
						},
						{
							type: 'buttonRow',
							buttons: [
								{
									label: 'View',
									variant: 'secondary',
									action: stateAction(state, {
										view: 'product',
										category: item.product.category,
										selectedProductId: item.product.id,
										productQuantities: {
											...state.productQuantities,
											[item.product.id]: Math.max(1, item.quantity)
										}
									})
								},
								{ label: '-', variant: 'secondary', action: stateAction(removeOneFromCart(state, item.product.id), {}) },
								{ label: '+', variant: 'secondary', action: stateAction(addToCart(state, item.product.id), {}) },
								{ label: 'Remove', variant: 'ghost', action: stateAction(removeProductFromCart(state, item.product.id), {}) }
							]
						}
					]
				})),
				{
					type: 'buttonRow',
					buttons: [
						{ label: 'Continue shopping', variant: 'secondary', action: stateAction(state, { view: 'products', category: 'all', page: 1 }) },
						{ label: 'Clear cart', variant: 'ghost', action: stateAction(state, { cart: {}, checkoutStatus: 'draft' }, 'Cart cleared') },
						{ label: 'Checkout', variant: 'primary', action: stateAction(checkoutReadyState(state), {}) }
					]
				}
			]
			: [
				{ type: 'text', tone: 'muted', text: 'Your cart is empty.' },
				{ type: 'button', label: 'Browse products', variant: 'primary', action: stateAction(state, { view: 'products', category: 'all', page: 1 }) }
			]
	};
}
