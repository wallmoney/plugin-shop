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
	return catalogProducts(state)
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

function wholeQuantity(value) {
	const quantity = Number(value);
	return Number.isFinite(quantity) && quantity > 0 ? Math.max(1, Math.round(quantity)) : 1;
}

function productQuantity(state, productId) {
	return wholeQuantity(state.productQuantities && state.productQuantities[productId]);
}

function setProductQuantity(state, productId, quantity) {
	const product = catalogProducts(state).find((item) => item.id === productId);
	if (!product) return state;
	return normalizeState({
		...state,
		productQuantities: {
			...state.productQuantities,
			[productId]: wholeQuantity(quantity)
		}
	});
}

function incrementProductQuantity(state, productId) {
	return setProductQuantity(state, productId, productQuantity(state, productId) + 1);
}

function decrementProductQuantity(state, productId) {
	return setProductQuantity(state, productId, Math.max(1, productQuantity(state, productId) - 1));
}

function addQuantityToCart(state, productId, quantity) {
	const product = catalogProducts(state).find((item) => item.id === productId);
	if (!product) return state;
	const cart = { ...state.cart };
	const current = cart[productId] || 0;
	cart[productId] = current + wholeQuantity(quantity);
	return normalizeState({ ...state, cart, checkoutStatus: 'draft' });
}

function addToCart(state, productId) {
	return addQuantityToCart(state, productId, 1);
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
	const cityLine = [delivery.city, delivery.state, delivery.zip, delivery.country].filter(Boolean).join(', ');
	return [delivery.address, delivery.address2, cityLine].filter(Boolean).join(' • ') || 'Not entered';
}

function collectorAccount() {
	return SHOP_CONFIG.collectorAccount || SHOP_CONFIG.defaultMerchantAccount;
}
