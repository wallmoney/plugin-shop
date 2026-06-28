// @ts-nocheck
function renderSuccess(state) {
	const actions = {};
	const order = state.lastOrder;
	return pluginFrame('Payment successful', `
		<div class="${pageClass(state)}">
			${renderShopHeader(actions, state)}
			<section class="${cardClass(state, 'mx-auto mt-16 max-w-3xl text-center')}">
				<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-800">${icon('check', 28)}</div>
				<h1 class="${titleClass('mt-5 text-4xl')}">Congratulations</h1>
				<p class="${mutedClass(state)}">Your products have been paid. You will receive an email with order details and next steps.</p>
				${order ? `
					<div class="${cardClass(state, 'mx-auto mt-6 max-w-sm text-left')}">
						<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Total</span><strong>${escapeHtml(formatMoney(order.total, order.currency))}</strong></div>
						${order.paidAt ? `<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Paid</span><strong>${escapeHtml(order.paidAt)}</strong></div>` : ''}
						${order.reference ? `<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Reference</span><strong>${escapeHtml(order.reference)}</strong></div>` : ''}
					</div>
				` : ''}
				<div class="${inlineActionsClass('justify-center')}">
					${frameButton(actions, 'Continue shopping', stateAction(state, { view: 'products', category: 'all', page: 1 }))}
				</div>
			</section>
		</div>
	`, actions);
}

function renderPaymentFailed(state) {
	const actions = {};
	return pluginFrame('Payment could not be processed', `
		<div class="${pageClass(state)}">
			${renderShopHeader(actions, state)}
			<section class="${cardClass(state, 'mx-auto mt-16 max-w-3xl text-center')}">
				<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-800">${icon('x', 28)}</div>
				<h1 class="${titleClass('mt-5 text-4xl')}">Payment cannot be processed</h1>
				<p class="${mutedClass(state)}">The payment was not completed. Your cart is still available, so you can review it and retry checkout.</p>
				${state.checkoutStatus ? `<p class="${warningClass(state)}">Status: ${escapeHtml(state.checkoutStatus)}</p>` : ''}
				<div class="${inlineActionsClass('justify-center')}">
					${frameButton(actions, 'Back to cart', stateAction(state, { view: 'cart' }), 'secondary')}
					${frameButton(actions, 'Retry checkout', stateAction(checkoutReadyState(state), {}))}
				</div>
			</section>
		</div>
	`, actions);
}
