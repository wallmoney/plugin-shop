function renderOrders(state) {
	const order = state.lastOrder;
	return {
		type: 'section',
		title: 'Orders',
		description: 'Order history is local and intentionally small. Fulfillment should reconcile the Wall Money payment reference with the merchant catalog/order process.',
		children: order
			? [
				{
					type: 'badgeGrid',
					items: [
						{ label: 'Status', value: order.status || 'unknown', tone: order.status === 'paid' ? 'success' : 'warning' },
						{ label: 'Total', value: formatMoney(order.total, order.currency), tone: 'success' },
						{ label: 'Reference', value: order.reference, tone: 'muted' }
					]
				},
				{
					type: 'list',
					items: [
						{ label: 'Paid at', value: order.paidAt || 'Pending' },
						{ label: 'Delivery', value: order.delivery || 'Not saved' },
						{ label: 'Payment session', value: order.sessionId || 'Not available' }
					]
				},
				{
					type: 'buttonRow',
					buttons: [
						{ label: 'Open catalog', variant: 'secondary', action: { type: 'navigate', href: catalogUrl(state) } },
						{ label: 'New order', variant: 'primary', action: stateAction(state, { view: 'products', cart: {}, checkoutStatus: 'draft' }, 'Ready for a new order') }
					]
				}
			]
			: [
				{ type: 'text', text: 'No paid order recorded yet on this device.', tone: 'muted' },
				{ type: 'button', label: 'Browse products', variant: 'primary', action: stateAction(state, { view: 'products' }) }
			]
	};
}
