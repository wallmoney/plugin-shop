function renderSuccess(state) {
	const order = state.lastOrder;
	return {
		type: 'section',
		title: 'Payment successful',
		description: 'Your order was paid and sent to the shop admin.',
		children: [
			...(order
				? [
					{
						type: 'badgeGrid',
						items: [
							{ label: 'Status', value: order.status || 'paid', tone: 'success' },
							{ label: 'Total', value: formatMoney(order.total, order.currency), tone: 'success' },
							{ label: 'Paid', value: order.paidAt || 'Recorded', tone: 'muted' }
						]
					},
					{
						type: 'list',
						items: [
							{ label: 'Delivery', value: order.delivery || 'Not saved' },
							{ label: 'Reference', value: order.reference || 'Not available' }
						]
					}
				]
				: []),
			{ type: 'button', label: 'Continue shopping', variant: 'primary', action: stateAction(state, { view: 'products', category: 'all', page: 1 }) }
		]
	};
}
