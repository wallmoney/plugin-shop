// @ts-nocheck
function renderOrders(state) {
	const actions = {};
	const order = state.lastOrder;
	return pluginFrame('Orders', `
		<div class="${pageClass(state)}">
			${renderShopHeader(actions, state)}
			<section class="${cardClass(state, 'mx-auto mt-10 max-w-3xl')}">
				<div class="flex items-end justify-between gap-4 border-b border-slate-500/25 pb-6">
					<div>
						<p class="${kickerClass(state)}">Local order history</p>
						<h1 class="${titleClass('text-3xl')}">Orders</h1>
					</div>
				</div>
				${order ? `
					<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Status</span><strong>${escapeHtml(order.status || 'unknown')}</strong></div>
					<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Total</span><strong>${escapeHtml(formatMoney(order.total, order.currency))}</strong></div>
					${order.deliveryFee ? `<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Delivery</span><strong>${escapeHtml(formatMoney(order.deliveryFee, order.currency))}</strong></div>` : ''}
					${order.reference ? `<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Reference</span><strong class="break-words tracking-wide">${escapeHtml(order.reference)}</strong></div>` : ''}
					${order.paidAt ? `<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Paid at</span><strong>${escapeHtml(order.paidAt)}</strong></div>` : ''}
					${order.delivery ? `<div class="${summaryLineClass()}"><span class="${mutedClass(state)}">Delivery</span><strong>${escapeHtml(order.delivery)}</strong></div>` : ''}
					<div class="${inlineActionsClass()}">
						${frameButton(actions, 'New order', stateAction(state, { view: 'products', cart: {}, checkoutStatus: 'draft' }, 'Ready for a new order'))}
					</div>
				` : `
					<div class="p-8 text-center">
						<p class="${mutedClass(state)}">No paid order recorded yet on this device.</p>
						${frameButton(actions, 'Browse products', stateAction(state, { view: 'products' }))}
					</div>
				`}
			</section>
		</div>
	`, actions);
}
