function renderCart(state) {
	const items = cartItems(state);
	return {
		type: 'section',
		title: 'Shopping cart',
		description: 'Cart state is local to this portal device. Product data remains IPFS-addressed.',
		children: items.length
			? [
				{
					type: 'stat',
					label: 'Subtotal',
					value: formatMoney(cartTotal(state), state.settings.currency),
					helper: `${cartCount(state)} item${cartCount(state) === 1 ? '' : 's'} before shipping or merchant adjustments`
				},
				{
					type: 'list',
					items: items.map((item) => ({
						label: `${item.product.icon} ${item.product.name} × ${item.quantity}`,
						value: formatMoney(item.product.price * item.quantity, state.settings.currency)
					}))
				}
			].concat(items.map((item) => ({
				type: 'buttonRow',
				buttons: [
					{ label: `+ ${item.product.name}`, variant: 'secondary', action: stateAction(addToCart(state, item.product.id), {}) },
					{ label: `− ${item.product.name}`, variant: 'secondary', action: stateAction(removeOneFromCart(state, item.product.id), {}) },
					{ label: 'Remove', variant: 'ghost', action: stateAction(removeProductFromCart(state, item.product.id), {}) }
				]
			}))).concat([
				{
					type: 'buttonRow',
					align: 'between',
					buttons: [
						{ label: 'Continue shopping', variant: 'secondary', action: stateAction(state, { view: 'products' }) },
						{ label: 'Checkout', variant: 'primary', action: stateAction(state, { view: 'checkout' }) },
						{ label: 'Clear cart', variant: 'ghost', action: stateAction(state, { cart: {}, checkoutStatus: 'draft' }, 'Cart cleared') }
					]
				}
			])
			: [
				{ type: 'text', text: 'Your cart is empty. Add a few products, little digital basket goblin.', tone: 'muted' },
				{ type: 'button', label: 'Browse products', variant: 'primary', action: stateAction(state, { view: 'products' }) }
			]
	};
}
