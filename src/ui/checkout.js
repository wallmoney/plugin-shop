function renderDeliveryForm(state) {
	const initialDelivery = state.savedDelivery && !state.delivery.name && !state.delivery.address
		? state.savedDelivery
		: state.delivery;
	const next = normalizeState({
		...state,
		delivery: initialDelivery,
		savedDelivery: state.saveDelivery ? initialDelivery : state.savedDelivery,
		view: 'checkout',
		checkoutStatus: 'details_saved'
	});

	return {
		type: 'form',
		fields: [
			{ name: 'delivery.name', label: 'Full name', value: initialDelivery.name, placeholder: 'Ada Lovelace' },
			{ name: 'delivery.email', label: 'Email', type: 'email', value: initialDelivery.email, placeholder: 'ada@example.com' },
			{ name: 'delivery.phone', label: 'Phone', value: initialDelivery.phone, placeholder: '+421…' },
			{ name: 'delivery.address', label: 'Delivery address', value: initialDelivery.address, placeholder: 'Street and number' },
			{ name: 'delivery.city', label: 'City / ZIP', value: initialDelivery.city, placeholder: 'Bratislava 811 01' },
			{ name: 'delivery.country', label: 'Country', value: initialDelivery.country, placeholder: 'Slovakia' },
			{ name: 'delivery.notes', label: 'Delivery notes', value: initialDelivery.notes, placeholder: 'Door code, pickup preference…' }
		],
		submitLabel: state.saveDelivery ? 'Save delivery details locally' : 'Use for this order only',
		action: {
			type: 'storage',
			key: STATE_KEY,
			value: next,
			message: state.saveDelivery ? 'Delivery details saved for future orders' : 'Delivery details saved for this checkout',
			level: 'success'
		}
	};
}

function renderCheckout(state) {
	const total = cartTotal(state);
	const items = cartItems(state);
	if (!items.length) {
		return {
			type: 'section',
			title: 'Checkout',
			description: 'Add products before starting checkout.',
			children: [
				{ type: 'text', text: 'Nothing to pay yet — your cart is currently empty.', tone: 'warning' },
				{ type: 'button', label: 'Browse products', variant: 'primary', action: stateAction(state, { view: 'products' }) }
			]
		};
	}

	return {
		type: 'stack',
		gap: 'lg',
		children: [
			{
				type: 'section',
				title: 'Checkout',
				description: 'No login is needed here because the portal already knows the user. Delivery details can be saved locally for future orders.',
				children: [
					{
						type: 'stat',
						label: 'Order total',
						value: formatMoney(total, state.settings.currency),
						helper: `${items.length} line item${items.length === 1 ? '' : 's'} paid through Wall Money`
					},
					{
						type: 'choiceGroup',
						columns: 'two',
						options: [
							{
								label: 'Save details',
								icon: '💾',
								selected: state.saveDelivery,
								helper: 'Store delivery profile in portal plugin storage',
								action: stateAction(state, { saveDelivery: true })
							},
							{
								label: 'This order only',
								icon: '📦',
								selected: !state.saveDelivery,
								helper: 'Keep details only in the current checkout draft',
								action: stateAction(state, { saveDelivery: false })
							}
						]
					},
					state.savedDelivery
						? {
							type: 'button',
							label: 'Use saved delivery profile',
							variant: 'secondary',
							action: stateAction(state, { delivery: state.savedDelivery, checkoutStatus: 'details_saved' }, 'Saved delivery profile loaded')
						}
						: { type: 'text', text: 'No saved delivery profile yet.', tone: 'muted' },
					renderDeliveryForm(state)
				]
			},
			{
				type: 'section',
				title: 'Review and pay',
				description: 'The plugin opens a prefilled portal transfer. Payment completion events update the order status after returning.',
				children: [
					{
						type: 'list',
						items: [
							{ label: 'Merchant account', value: state.settings.merchantAccount },
							{ label: 'Reference', value: orderReference(state) },
							{ label: 'Delivery', value: deliverySummary(state.delivery) },
							{ label: 'Status', value: state.checkoutStatus }
						]
					},
					{
						type: 'buttonRow',
						align: 'between',
						buttons: [
							{ label: 'Back to cart', variant: 'secondary', action: stateAction(state, { view: 'cart' }) },
							{
								label: 'Pay with Wall Money',
								variant: 'primary',
								action: {
									type: 'payment',
									request: {
										label: `${SHOP_CONFIG.name} order`,
										amount: total.toFixed(2),
										reference: orderReference(state),
										portalTransfer: {
											account: state.settings.merchantAccount,
											currency: state.settings.currency,
											amount: total.toFixed(2),
											platform: 'platform',
											description: `${SHOP_CONFIG.name} order (${cartCount(state)} items)`,
											descriptionExp: orderReference(state)
										}
									}
								}
							}
						]
					}
				]
			}
		]
	};
}
