function renderSuccess(state) {
	const actions = {};
	const order = state.lastOrder;
	return pluginFrame('Payment successful', `
		<div class="wm-page wm-theme-${escapeHtml(state.theme)}">
			${renderShopHeader(actions, state)}
			<section class="wm-card wm-success">
				<div class="wm-success-mark">${icon('check', 28)}</div>
				<h1 class="wm-title" style="font-size:2.25rem;margin-top:1.25rem">Congratulations</h1>
				<p class="wm-muted">Your products have been paid. You will receive an email with order details and next steps.</p>
				${order ? `
					<div class="wm-card" style="max-width:24rem;margin:1.5rem auto 0;text-align:left">
						<div class="wm-summary-line"><span class="wm-muted">Total</span><strong>${escapeHtml(formatMoney(order.total, order.currency))}</strong></div>
						${order.paidAt ? `<div class="wm-summary-line"><span class="wm-muted">Paid</span><strong>${escapeHtml(order.paidAt)}</strong></div>` : ''}
						${order.reference ? `<div class="wm-summary-line"><span class="wm-muted">Reference</span><strong>${escapeHtml(order.reference)}</strong></div>` : ''}
					</div>
				` : ''}
				<div class="wm-inline-actions" style="justify-content:center">
					${frameButton(actions, 'Continue shopping', stateAction(state, { view: 'products', category: 'all', page: 1 }))}
				</div>
			</section>
		</div>
	`, actions);
}

function renderPaymentFailed(state) {
	const actions = {};
	return pluginFrame('Payment could not be processed', `
		<div class="wm-page wm-theme-${escapeHtml(state.theme)}">
			${renderShopHeader(actions, state)}
			<section class="wm-card wm-success">
				<div class="wm-success-mark wm-fail-mark">${icon('x', 28)}</div>
				<h1 class="wm-title" style="font-size:2.25rem;margin-top:1.25rem">Payment cannot be processed</h1>
				<p class="wm-muted">The payment was not completed. Your cart is still available, so you can review it and retry checkout.</p>
				${state.checkoutStatus ? `<p class="wm-warning">Status: ${escapeHtml(state.checkoutStatus)}</p>` : ''}
				<div class="wm-inline-actions" style="justify-content:center">
					${frameButton(actions, 'Back to cart', stateAction(state, { view: 'cart' }), 'secondary')}
					${frameButton(actions, 'Retry checkout', stateAction(checkoutReadyState(state), {}))}
				</div>
			</section>
		</div>
	`, actions);
}
