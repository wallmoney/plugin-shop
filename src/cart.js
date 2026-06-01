function formatMoney(value, currency) {
	const amount = Number(value);
	const safe = Number.isFinite(amount) ? amount : 0;
	return `${safe.toFixed(2)} ${currency || SHOP_CONFIG.defaultCurrency}`;
}

function cartItems(state) {
	return SHOP_PRODUCTS
		.map((product) => ({
			product,
			quantity: state.cart[product.id] || 0
		}))
		.filter((item) => item.quantity > 0);
}

function cartCount(state) {
	return cartItems(state).reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal(state) {
	return cartItems(state).reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function addToCart(state, productId) {
	const product = SHOP_PRODUCTS.find((item) => item.id === productId);
	if (!product) return state;
	const cart = { ...state.cart };
	const current = cart[productId] || 0;
	cart[productId] = Math.min(product.stock, current + 1);
	return normalizeState({ ...state, cart, view: 'products', checkoutStatus: 'draft' });
}

function removeOneFromCart(state, productId) {
	const cart = { ...state.cart };
	const current = cart[productId] || 0;
	if (current <= 1) {
		delete cart[productId];
	} else {
		cart[productId] = current - 1;
	}
	return normalizeState({ ...state, cart, checkoutStatus: 'draft' });
}

function removeProductFromCart(state, productId) {
	const cart = { ...state.cart };
	delete cart[productId];
	return normalizeState({ ...state, cart, checkoutStatus: 'draft' });
}

function orderReference(state) {
	const ids = cartItems(state).map((item) => `${item.product.id}x${item.quantity}`).join('-');
	return `ipfs-shop-${ids || 'empty'}`;
}

function deliverySummary(delivery) {
	const cityLine = [delivery.city, delivery.country].filter(Boolean).join(', ');
	return [delivery.address, cityLine].filter(Boolean).join(' • ') || 'Not entered';
}
