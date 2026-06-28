// @ts-nocheck
function renderCart(state) {
	const actions = {};
	const items = cartItems(state);
	function cartQuantityInput(item) {
		const max = productStock(item.product);
		const actionId = addFrameAction(actions, stateAction(setCartProductQuantity(state, item.product.id, item.quantity)));
		return `<input class="${quantityInputClass()}" type="number" min="1" ${max === null ? '' : `max="${escapeHtml(max || 1)}"`} step="1" inputmode="numeric" value="${escapeHtml(item.quantity)}" aria-label="${escapeHtml(item.product.name)} quantity" data-plugin-storage-action="${escapeHtml(actionId)}" data-plugin-field="cart.${escapeHtml(item.product.id)}" />`;
	}
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
						<div class="mt-5 grid grid-cols-[7rem_minmax(0,1fr)_auto] items-start gap-4 max-[900px]:grid-cols-[5.5rem_minmax(0,1fr)]">
							<button type="button" class="block cursor-pointer border-0 bg-transparent p-0 text-inherit" ${actionAttr(actions, shopNavigateAction(item.product.id))}>
								<div class="${mediaBoxClass(state, 'rounded-3xl')}">${renderProductImage(state, item.product)}</div>
							</button>
							<div class="min-w-0">
								<button type="button" class="block cursor-pointer border-0 bg-transparent p-0 text-left text-inherit hover:underline" ${actionAttr(actions, shopNavigateAction(item.product.id))}>
									<h2 class="m-0 text-base font-semibold leading-tight">${escapeHtml(item.product.name)}</h2>
								</button>
								<button type="button" class="mt-1 block cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-medium ${mutedClass(state)} hover:underline" ${actionAttr(actions, stateAction(state, { view: 'products', category: item.product.category, page: 1, selectedProductId: item.product.id }))}>
									${escapeHtml(productCategory(item.product, state).label)}
								</button>
								${item.product.packLabel ? `<p class="${productPackClass(state)}">${escapeHtml(item.product.packLabel)}</p>` : ''}
								<div class="${quantityClass(state, 'mt-2')}">
									<button type="button" class="${quantityButtonClass()}" title="Remove item" ${actionAttr(actions, stateAction(removeProductFromCart(state, item.product.id), {}))}>${icon('x', 14)}</button>
									<button type="button" class="${quantityButtonClass()}" title="Decrease" ${actionAttr(actions, stateAction(removeOneFromCart(state, item.product.id), {}))}>${icon('minus', 14)}</button>
									${cartQuantityInput(item)}
									<button type="button" class="${quantityButtonClass()}" title="Increase" ${actionAttr(actions, stateAction(addToCart(state, item.product.id), {}))}>${icon('plus', 14)}</button>
								</div>
							</div>
							<strong class="pt-0.5 font-semibold max-[900px]:col-start-2">${escapeHtml(formatMoney(item.product.price * item.quantity, state.settings.currency))}</strong>
						</div>
					`).join('')}
					<div class="mt-8 flex justify-between gap-4 border-t border-slate-500/25 pt-5 text-lg font-semibold"><span>Subtotal</span><span>${escapeHtml(formatMoney(cartSubtotal(state), state.settings.currency))}</span></div>
					<div class="mt-4 flex items-center justify-between gap-4">
						<div class="flex justify-start">${frameButton(actions, 'Clear cart', stateAction(state, { cart: {}, checkoutStatus: 'draft' }, 'Cart cleared'), 'link', 'px-0')}</div>
						<div class="flex flex-wrap justify-end gap-3">
							${frameButton(actions, 'Shop more', stateAction(state, { view: 'products', category: 'all', page: 1 }), 'secondary')}
							${frameButton(actions, 'Checkout', stateAction(checkoutReadyState(state), {}))}
						</div>
					</div>
				` : `
					<div class="p-8 text-center">
						<p class="mb-4 font-semibold">Your cart is empty.</p>
						${frameButton(actions, 'Browse products', stateAction(state, { view: 'products', category: 'all', page: 1 }))}
					</div>
				`}
			</section>
		</div>
	`, actions);
}
