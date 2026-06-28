// @ts-nocheck
function renderCart(state) {
	const actions = {};
	const items = cartItems(state);
	return pluginFrame('Cart', `
		<div class="${pageClass(state)}">
			${renderShopHeader(actions, state)}
			<section class="${cardClass(state, 'mx-auto mt-10 max-w-3xl')}">
				<div class="flex items-end justify-between gap-4 border-b border-slate-500/25 pb-6">
					<div>
						<h1 class="${titleClass('text-3xl')}">Cart</h1>
						<p class="${kickerClass(state)} mt-2">${cartCount(state)} item${cartCount(state) === 1 ? '' : 's'}</p>
					</div>
					<strong>${escapeHtml(formatMoney(cartSubtotal(state), state.settings.currency))}</strong>
				</div>
				${items.length ? `
					<div class="mt-4 flex items-center justify-between gap-4 max-[900px]:justify-stretch">
						<div></div>
						<div class="flex flex-wrap justify-end gap-3 max-[900px]:w-full max-[900px]:justify-stretch [&>button]:max-[900px]:flex-1">
							${frameButton(actions, 'Shop more', stateAction(state, { view: 'products', category: 'all', page: 1 }), 'secondary')}
							${frameButton(actions, 'Checkout', stateAction(checkoutReadyState(state), {}))}
						</div>
					</div>
					${items.map((item) => `
						<div class="mt-5 grid grid-cols-[7rem_minmax(0,1fr)_auto] gap-4 max-[900px]:grid-cols-[5.5rem_minmax(0,1fr)]">
							<div class="${mediaBoxClass(state, 'rounded-3xl')}">${renderProductImage(state, item.product)}</div>
							<div>
								<p class="${productMetaClass(state, 'mt-0')}">${escapeHtml(item.product.vendor || SHOP_CONFIG.name)}</p>
								<h2 class="${productNameClass()}">${escapeHtml(item.product.name)}</h2>
								${item.product.packLabel ? `<p class="${productPackClass(state)}">${escapeHtml(item.product.packLabel)}</p>` : ''}
								<div class="${quantityClass(state, 'mt-3')}">
									<button type="button" class="${quantityButtonClass()}" title="Remove item" ${actionAttr(actions, stateAction(removeProductFromCart(state, item.product.id), {}))}>${icon('x', 14)}</button>
									<button type="button" class="${quantityButtonClass()}" title="Decrease" ${actionAttr(actions, stateAction(removeOneFromCart(state, item.product.id), {}))}>${icon('minus', 14)}</button>
									<span class="min-w-8 text-center font-semibold">${item.quantity}</span>
									<button type="button" class="${quantityButtonClass()}" title="Increase" ${actionAttr(actions, stateAction(addToCart(state, item.product.id), {}))}>${icon('plus', 14)}</button>
								</div>
							</div>
							<strong class="max-[900px]:col-start-2">${escapeHtml(formatMoney(item.product.price * item.quantity, state.settings.currency))}</strong>
						</div>
					`).join('')}
					<div class="mt-8 flex justify-between gap-4 border-t border-slate-500/25 pt-5 text-lg font-semibold"><span>Subtotal</span><span>${escapeHtml(formatMoney(cartSubtotal(state), state.settings.currency))}</span></div>
					<div class="mt-4 flex items-center justify-between gap-4">
						<div class="flex justify-start">${frameButton(actions, 'Clear cart', stateAction(state, { cart: {}, checkoutStatus: 'draft' }, 'Cart cleared'), 'link')}</div>
						<div class="flex flex-wrap justify-end gap-3">
							${frameButton(actions, 'Shop more', stateAction(state, { view: 'products', category: 'all', page: 1 }), 'secondary')}
							${frameButton(actions, 'Checkout', stateAction(checkoutReadyState(state), {}))}
						</div>
					</div>
				` : `
					<div class="p-8 text-center">
						<p class="font-semibold">Your cart is empty.</p>
						${frameButton(actions, 'Browse products', stateAction(state, { view: 'products', category: 'all', page: 1 }))}
					</div>
				`}
			</section>
		</div>
	`, actions);
}
