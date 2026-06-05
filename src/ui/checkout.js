function renderDeliveryForm(state) {
	const initialDelivery = state.savedDelivery && !state.delivery.name && !state.delivery.address
		? state.savedDelivery
		: state.delivery;
	const hasPhysicalItems = cartItems(state).some((item) => item.product.digital !== true);
	const selectedCountry = initialDelivery.country || countryNameFromCode(state.countryCode) || '';
	const deliveryDraft = {
		...initialDelivery,
		email: initialDelivery.email || state.userEmail || '',
		country: selectedCountry
	};
	const next = normalizeState({
		...state,
		delivery: deliveryDraft,
		savedDelivery: state.saveDelivery ? deliveryDraft : state.savedDelivery,
		view: 'checkout',
		checkoutStatus: 'details_saved'
	});
	const fields = [
		{ name: 'delivery.email', label: 'Email', type: 'email', value: deliveryDraft.email, placeholder: 'marsellus@wallace.pulp', required: true }
	];
	if (hasPhysicalItems) {
		fields.push(
			{ name: 'delivery.name', label: 'Full name', value: deliveryDraft.name, placeholder: 'Marsellus Wallace', required: true },
			{ name: 'delivery.phone', label: 'Phone', value: deliveryDraft.phone, placeholder: '+1' },
			{ name: 'delivery.address', label: 'Street address', value: deliveryDraft.address, placeholder: 'Street and number', required: true },
			{ name: 'delivery.address2', label: 'Street address 2', value: deliveryDraft.address2, placeholder: 'Floor, flat number, …' },
			{ name: 'delivery.city', label: 'City', value: deliveryDraft.city, placeholder: 'Los Angeles', required: true },
			{ name: 'delivery.zip', label: 'ZIP', value: deliveryDraft.zip, placeholder: '90210', required: true },
			{
				name: 'delivery.country',
				label: 'Country',
				type: 'country',
				value: deliveryDraft.country,
				placeholder: 'United States',
				options: COUNTRY_OPTIONS,
				required: true
			}
		);
		if (deliveryDraft.country === 'United States' || deliveryDraft.country === 'US') {
			fields.push({
				name: 'delivery.state',
				label: 'State',
				type: 'select',
				value: deliveryDraft.state,
				placeholder: 'California',
				options: US_STATE_OPTIONS,
				required: true
			});
		}
		fields.push({ name: 'delivery.notes', label: 'Delivery notes', value: deliveryDraft.notes, placeholder: 'Floor, flat number, …' });
	}

	return {
		type: 'form',
		fields,
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

function checkoutRequiredMessage(state, hasPhysicalItems) {
	const delivery = state.delivery || {};
	if (!delivery.email) return 'Enter your email before checkout.';
	if (!hasPhysicalItems) return '';
	const missing = [];
	if (!delivery.name) missing.push('name');
	if (!delivery.address) missing.push('street address');
	if (!delivery.city) missing.push('city');
	if (!delivery.zip) missing.push('ZIP');
	if (!delivery.country) missing.push('country');
	if ((delivery.country === 'United States' || delivery.country === 'US') && !delivery.state) missing.push('state');
	return missing.length ? `Add ${missing.join(', ')} before checkout.` : '';
}

function renderCheckout(state) {
	const subtotal = cartSubtotal(state);
	const deliveryFee = deliveryFeeAmount(state);
	const total = cartTotal(state);
	const items = cartItems(state);
	const hasPhysicalItems = items.some((item) => item.product.digital !== true);
	const minimumMessage = minimumCheckoutMessage(state, subtotal);
	const requiredMessage = checkoutRequiredMessage(state, hasPhysicalItems);
	const paymentRequest = {
		label: `${SHOP_CONFIG.name} order`,
		amount: total.toFixed(2),
		reference: orderReference(state),
		portalTransfer: {
			account: collectorAccount(),
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
		theme: state.theme,
		themeAction: stateAction(state, { theme: state.theme === 'auto' ? 'light' : state.theme === 'light' ? 'dark' : 'auto' }),
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
			collectorAccount: collectorAccount(),
			reference: orderReference(state),
			delivery: deliverySummary(state.delivery),
			status: state.checkoutStatus,
			minimumMessage: minimumMessage || requiredMessage,
			hasPhysicalItems,
			items: items.map((item) => ({
				name: item.product.name,
				quantity: item.quantity,
				lineTotal: formatMoney(item.product.price * item.quantity, state.settings.currency)
			}))
		},
		payAction: minimumMessage
			? { type: 'notify', message: minimumMessage, level: 'warning' }
			: requiredMessage
				? { type: 'notify', message: requiredMessage, level: 'warning' }
			: stockManagedPaymentAction(state, paymentRequest)
	};
}
