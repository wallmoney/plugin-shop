function renderDeliveryForm(state) {
	const initialDelivery = checkoutDelivery(state);
	const hasPhysicalItems = cartItems(state).some((item) => item.product.digital !== true);
	const selectedCountry = initialDelivery.country || countryNameFromCode(state.countryCode) || '';
	const hasUnitedStates = selectedCountry === 'United States' || selectedCountry === 'US' || state.countryCode === 'US';
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
			{ name: 'delivery.phone', label: 'Phone', type: 'tel', value: deliveryDraft.phone, placeholder: '+1', required: true },
			{ name: 'delivery.address', label: 'Street address', value: deliveryDraft.address, placeholder: 'Street and number', required: true },
			{ name: 'delivery.address2', label: 'Street address 2', value: deliveryDraft.address2, placeholder: '' },
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
		fields.push({
			name: 'delivery.state',
			label: 'State',
			type: 'select',
			value: deliveryDraft.state,
			placeholder: 'California',
			options: US_STATE_OPTIONS,
			required: hasUnitedStates,
			visibleWhenCountry: 'United States'
		});
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

function checkoutDelivery(state) {
	const delivery = state.delivery || emptyDelivery();
	if (state.saveDelivery && state.savedDelivery) return state.savedDelivery;
	if (state.savedDelivery && !delivery.name && !delivery.address) return state.savedDelivery;
	return delivery;
}

function checkoutReadyState(state) {
	const delivery = normalizeDelivery({
		...checkoutDelivery(state),
		email: checkoutDelivery(state).email || state.userEmail || '',
		country: checkoutDelivery(state).country || countryNameFromCode(state.countryCode) || ''
	});
	return normalizeState({
		...state,
		view: 'checkout',
		delivery
	});
}

function checkoutMinimumAmount() {
	const minimum = Number(SHOP_CONFIG.minimumCheckoutAmount);
	return Number.isFinite(minimum) && minimum > 0 ? minimum : 0;
}

function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isValidPhone(value) {
	return /^\+?[0-9][0-9\s().-]{5,24}$/.test(String(value || '').trim());
}

function isUnitedStates(value) {
	return value === 'United States' || value === 'US';
}

function minimumCheckoutMessage(state, total) {
	const minimum = checkoutMinimumAmount();
	if (!minimum || total >= minimum) return '';
	return `Minimum checkout amount is ${formatMoney(minimum, state.settings.currency)}. Add ${formatMoney(minimum - total, state.settings.currency)} more to continue.`;
}

function checkoutRequiredMessage(state, hasPhysicalItems) {
	const delivery = state.delivery || {};
	if (!delivery.email) return hasPhysicalItems ? 'Enter delivery details before checkout.' : 'Enter email address before checkout.';
	if (!isValidEmail(delivery.email)) return 'Enter a valid email before checkout.';
	if (!hasPhysicalItems) return '';
	const missing = [];
	if (!delivery.name) missing.push('name');
	if (!delivery.phone) missing.push('phone');
	if (!delivery.address) missing.push('street address');
	if (!delivery.city) missing.push('city');
	if (!delivery.zip) missing.push('ZIP');
	if (!delivery.country) missing.push('country');
	if (missing.length) return 'Enter delivery details before checkout.';
	if (delivery.name.length < 2) return 'Enter a valid full name.';
	if (!isValidPhone(delivery.phone)) return 'Enter a valid phone number.';
	if (delivery.address.length < 3) return 'Enter a valid street address.';
	if (delivery.city.length < 2) return 'Enter a valid city.';
	if (delivery.zip.length < 2) return 'Enter a valid ZIP/postal code.';
	if (!COUNTRY_OPTIONS.some((country) => country.name === delivery.country || country.code === delivery.country)) return 'Select a valid country.';
	if (isUnitedStates(delivery.country) && !delivery.state) return 'Select a state for United States delivery.';
	if (isUnitedStates(delivery.country) && !US_STATE_OPTIONS.some((stateOption) => stateOption.name === delivery.state)) return 'Select a valid state.';
	return missing.length ? `Add ${missing.join(', ')} before checkout.` : '';
}

function emptyDelivery() {
	return defaultState().delivery;
}

function renderCheckout(state) {
	const subtotal = cartSubtotal(state);
	const deliveryFee = deliveryFeeAmount(state);
	const total = cartTotal(state);
	const items = cartItems(state);
	const hasPhysicalItems = items.some((item) => item.product.digital !== true);
	const checkoutState = checkoutReadyState(state);
	const delivery = checkoutState.delivery;
	const minimumMessage = minimumCheckoutMessage(state, subtotal);
	const requiredMessage = checkoutRequiredMessage(checkoutState, hasPhysicalItems);
	const blockedMessage = minimumMessage || requiredMessage;
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
		shopLogoUrl: SHOP_CONFIG.logoUrl,
		coreId: state.coreId,
		cartCount: cartCount(state),
		theme: state.theme,
		themeAction: stateAction(state, { theme: state.theme === 'auto' ? 'dark' : state.theme === 'dark' ? 'light' : 'auto' }),
		portalAction: { type: 'navigate', href: '/' },
		homeAction: stateAction(state, { view: 'products', category: 'all', page: 1 }),
		cartAction: stateAction(state, { view: 'cart' }),
		deliveryForm: renderDeliveryForm(checkoutState),
		useSavedDeliveryAction: state.savedDelivery
			? stateAction(state, { delivery: state.savedDelivery, checkoutStatus: 'details_saved' }, 'Saved delivery profile loaded')
			: null,
		clearDeliveryAction: stateAction(state, { delivery: { ...emptyDelivery(), email: state.userEmail || '' }, checkoutStatus: 'draft' }, 'Delivery form cleared'),
		removeSavedDeliveryAction: state.savedDelivery
			? stateAction(state, { savedDelivery: null, saveDelivery: false, checkoutStatus: 'draft' }, 'Saved delivery profile removed')
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
			customerCoreId: state.coreId || 'Not provided',
			reference: orderReference(state),
			delivery: deliverySummary(delivery),
			status: state.checkoutStatus,
			minimumMessage: blockedMessage,
			hasPhysicalItems,
			items: items.map((item) => ({
				name: item.product.name,
				quantity: item.quantity,
				lineTotal: formatMoney(item.product.price * item.quantity, state.settings.currency)
			}))
		},
		payDisabled: Boolean(blockedMessage),
		payDisabledMessage: blockedMessage,
		payAction: minimumMessage
			? { type: 'notify', message: minimumMessage, level: 'warning' }
			: requiredMessage
				? { type: 'notify', message: requiredMessage, level: 'warning' }
			: stockManagedPaymentAction(checkoutState, paymentRequest)
	};
}
