function renderSuccess(state) {
	const order = state.lastOrder;
	return {
		type: 'shopSuccess',
		shopTitle: SHOP_CONFIG.name,
		shopLogoUrl: SHOP_CONFIG.logoUrl,
		coreId: state.coreId,
		theme: state.theme,
		themeAction: stateAction(state, { theme: state.theme === 'auto' ? 'dark' : state.theme === 'dark' ? 'light' : 'auto' }),
		portalAction: { type: 'navigate', href: '/' },
		homeAction: stateAction(state, { view: 'products', category: 'all', page: 1 }),
		order: order
			? {
				status: order.status || 'paid',
				total: formatMoney(order.total, order.currency),
				paidAt: order.paidAt || '',
				delivery: order.delivery || ''
			}
			: null
	};
}
