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

function checkoutMinimumAmount() {
	const minimum = Number(SHOP_CONFIG.minimumCheckoutAmount);
	return Number.isFinite(minimum) && minimum > 0 ? minimum : 0;
}

function minimumCheckoutMessage(state, total) {
	const minimum = checkoutMinimumAmount();
	if (!minimum || total >= minimum) return '';
	return `Minimum checkout amount is ${formatMoney(minimum, state.settings.currency)}. Add ${formatMoney(minimum - total, state.settings.currency)} more to continue.`;
}

function renderCheckout(state) {
	const subtotal = cartSubtotal(state);
	const deliveryFee = deliveryFeeAmount(state);
	const total = cartTotal(state);
	const items = cartItems(state);
	const minimumMessage = minimumCheckoutMessage(state, subtotal);
	const paymentRequest = {
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
	};
	if (!items.length) {
		return renderCart(state);
	}

	return {
		type: 'shopCheckout',
		shopTitle: SHOP_CONFIG.name,
		coreId: state.coreId,
		cartCount: cartCount(state),
		portalAction: { type: 'navigate', href: '/' },
		homeAction: stateAction(state, { view: 'products', category: 'all', page: 1 }),
		cartAction: stateAction(state, { view: 'cart' }),
		deliveryForm: renderDeliveryForm(state),
		useSavedDeliveryAction: state.savedDelivery
			? stateAction(state, { delivery: state.savedDelivery, checkoutStatus: 'details_saved' }, 'Saved delivery profile loaded')
			: null,
		saveDeliveryAction: stateAction(state, { saveDelivery: true }),
		oneOrderAction: stateAction(state, { saveDelivery: false }),
		saveDelivery: state.saveDelivery,
		summary: {
			subtotal: formatMoney(subtotal, state.settings.currency),
			deliveryFee: formatMoney(deliveryFee, state.settings.currency),
			deliveryFeeApplied: deliveryFee > 0,
			total: formatMoney(total, state.settings.currency),
			merchantAccount: state.settings.merchantAccount,
			reference: orderReference(state),
			delivery: deliverySummary(state.delivery),
			status: state.checkoutStatus,
			minimumMessage,
			items: items.map((item) => ({
				name: item.product.name,
				quantity: item.quantity,
				lineTotal: formatMoney(item.product.price * item.quantity, state.settings.currency)
			}))
		},
		payAction: minimumMessage
			? { type: 'notify', message: minimumMessage, level: 'warning' }
			: stockManagedPaymentAction(state, paymentRequest)
	};
}
