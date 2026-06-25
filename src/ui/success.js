function renderSuccess(state) {
	const actions = {};
	const order = state.lastOrder;
	const logo = shopLogoUrl();
	return pluginFrame('Payment successful', `
		<div class="wm-page">
			<header class="wm-header wm-shell">
				<button type="button" class="wm-brand" ${actionAttr(actions, stateAction(state, { view: 'products', category: 'all', page: 1 }))}>
					${logo ? `<img class="wm-logo" src="${escapeHtml(logo)}" alt="" />` : ''}
					<span>${escapeHtml(SHOP_CONFIG.name)}</span>
				</button>
			</header>
			<section class="wm-card wm-success">
				<div class="wm-success-mark">✓</div>
				<h1 class="wm-title" style="font-size:2.25rem;margin-top:1.25rem">Payment successful</h1>
				<p class="wm-muted">Your order was paid and sent to the shop admin.</p>
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
