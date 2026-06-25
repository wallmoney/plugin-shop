function renderCart(state) {
	const actions = {};
	const items = cartItems(state);
	const logo = shopLogoUrl();
	return pluginFrame('Cart', `
		<div class="wm-page">
			<header class="wm-header wm-shell">
				<button type="button" class="wm-brand" ${actionAttr(actions, stateAction(state, { view: 'products', category: 'all', page: 1 }))}>
					${logo ? `<img class="wm-logo" src="${escapeHtml(logo)}" alt="" />` : ''}
					<span>${escapeHtml(SHOP_CONFIG.name)}</span>
				</button>
			</header>
			<section class="wm-card wm-cart">
				<div class="wm-main-head">
					<div>
						<h1 class="wm-title" style="font-size:2rem">Cart</h1>
						<p class="wm-kicker">${cartCount(state)} item${cartCount(state) === 1 ? '' : 's'}</p>
					</div>
					<strong>${escapeHtml(formatMoney(cartSubtotal(state), state.settings.currency))}</strong>
				</div>
				${items.length ? `
					${items.map((item) => `
						<div class="wm-row">
							<div class="wm-row-media">${renderProductImage(state, item.product)}</div>
							<div>
								<p class="wm-product-meta">${escapeHtml(item.product.vendor || SHOP_CONFIG.name)}</p>
								<h2 class="wm-product-name">${escapeHtml(item.product.name)}</h2>
								<p class="wm-product-pack">${escapeHtml(item.product.packLabel || 'Standard pack')}</p>
								<div class="wm-qty" style="margin-top:.8rem">
									<button type="button" ${actionAttr(actions, stateAction(removeProductFromCart(state, item.product.id), {}))}>×</button>
									<button type="button" ${actionAttr(actions, stateAction(removeOneFromCart(state, item.product.id), {}))}>−</button>
									<span>${item.quantity}</span>
									<button type="button" ${actionAttr(actions, stateAction(addToCart(state, item.product.id), {}))}>+</button>
								</div>
							</div>
							<strong>${escapeHtml(formatMoney(item.product.price * item.quantity, state.settings.currency))}</strong>
						</div>
					`).join('')}
					<div class="wm-total"><span>Subtotal</span><span>${escapeHtml(formatMoney(cartSubtotal(state), state.settings.currency))}</span></div>
					<div class="wm-inline-actions">
						${frameButton(actions, 'Continue shopping', stateAction(state, { view: 'products', category: 'all', page: 1 }), 'secondary')}
						${frameButton(actions, 'Clear cart', stateAction(state, { cart: {}, checkoutStatus: 'draft' }, 'Cart cleared'), 'ghost')}
						${frameButton(actions, 'Continue to checkout', stateAction(checkoutReadyState(state), {}))}
					</div>
				` : `
					<div style="padding:2rem;text-align:center">
						<p style="font-weight:950">Your cart is empty.</p>
						${frameButton(actions, 'Browse products', stateAction(state, { view: 'products', category: 'all', page: 1 }))}
					</div>
				`}
			</section>
		</div>
	`, actions);
}
