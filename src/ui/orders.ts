// @ts-nocheck
function renderOrders(state) {
	const actions = {};
	const order = state.lastOrder;
	return pluginFrame('Orders', `
		<div class="wm-page wm-theme-${escapeHtml(state.theme)}">
			${renderShopHeader(actions, state)}
			<section class="wm-card wm-cart">
				<div class="wm-main-head">
					<div>
						<p class="wm-kicker">Local order history</p>
						<h1 class="wm-title" style="font-size:2rem">Orders</h1>
					</div>
				</div>
				${order ? `
					<div class="wm-summary-line"><span class="wm-muted">Status</span><strong>${escapeHtml(order.status || 'unknown')}</strong></div>
					<div class="wm-summary-line"><span class="wm-muted">Total</span><strong>${escapeHtml(formatMoney(order.total, order.currency))}</strong></div>
					${order.deliveryFee ? `<div class="wm-summary-line"><span class="wm-muted">Delivery</span><strong>${escapeHtml(formatMoney(order.deliveryFee, order.currency))}</strong></div>` : ''}
					${order.reference ? `<div class="wm-summary-line"><span class="wm-muted">Reference</span><strong class="wm-coreid">${escapeHtml(order.reference)}</strong></div>` : ''}
					${order.paidAt ? `<div class="wm-summary-line"><span class="wm-muted">Paid at</span><strong>${escapeHtml(order.paidAt)}</strong></div>` : ''}
					${order.delivery ? `<div class="wm-summary-line"><span class="wm-muted">Delivery</span><strong>${escapeHtml(order.delivery)}</strong></div>` : ''}
					<div class="wm-inline-actions">
						${frameButton(actions, 'New order', stateAction(state, { view: 'products', cart: {}, checkoutStatus: 'draft' }, 'Ready for a new order'))}
					</div>
				` : `
					<div style="padding:2rem;text-align:center">
						<p class="wm-muted">No paid order recorded yet on this device.</p>
						${frameButton(actions, 'Browse products', stateAction(state, { view: 'products' }))}
					</div>
				`}
			</section>
		</div>
	`, actions);
}
