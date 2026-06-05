function formatMoney(value, currency) {
	const amount = Number(value);
	const safe = Number.isFinite(amount) ? amount : 0;
	const code = currency || SHOP_CONFIG.defaultCurrency;
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: code,
			maximumFractionDigits: safe % 1 === 0 ? 0 : 2
		}).format(safe);
	} catch {
		return `${safe.toFixed(2)} ${code}`;
	}
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

function cartSubtotal(state) {
	return cartItems(state).reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function deliveryFeeAmount(state) {
	const fee = Number(SHOP_CONFIG.deliveryFee);
	if (!Number.isFinite(fee) || fee <= 0) return 0;
	const requiresDelivery = cartItems(state).some((item) => item.product.digital !== true);
	return requiresDelivery ? fee : 0;
}

function cartTotal(state) {
	return cartSubtotal(state) + deliveryFeeAmount(state);
}

function addToCart(state, productId) {
	const product = SHOP_PRODUCTS.find((item) => item.id === productId);
	if (!product) return state;
	const cart = { ...state.cart };
	const current = cart[productId] || 0;
	cart[productId] = current + 1;
	return normalizeState({ ...state, cart, checkoutStatus: 'draft' });
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
