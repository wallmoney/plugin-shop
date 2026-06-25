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
		submitLabel: '',
		showSubmit: false,
		autoSaveAction: {
			type: 'storage',
			key: STATE_KEY,
			value: checkoutReadyState(state),
			mergeFormValues: true,
			saveValidDeliveryProfile: state.saveDelivery && hasPhysicalItems
		}
	};
}

function checkoutDelivery(state) {
	const delivery = state.delivery || emptyDelivery();
	const profiles = normalizeSavedDeliveries(state.savedDeliveries, state.savedDelivery);
	const selectedProfile = profiles.find((profile) => deliveryProfileId(profile) === state.selectedDeliveryProfileId);
	if (selectedProfile) return selectedProfile;
	if (profiles.length && !delivery.name && !delivery.address) return profiles[0];
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

function checkoutStateWithSavedProfile(state, hasPhysicalItems) {
	const checkoutState = checkoutReadyState(state);
	if (!checkoutState.saveDelivery || !hasPhysicalItems) return checkoutState;
	if (checkoutRequiredMessage(checkoutState, hasPhysicalItems)) return checkoutState;
	const savedDeliveries = upsertSavedDeliveryProfile(checkoutState.savedDeliveries, checkoutState.delivery);
	return normalizeState({
		...checkoutState,
		savedDeliveries,
		savedDelivery: savedDeliveries[0] || null,
		selectedDeliveryProfileId: deliveryProfileId(checkoutState.delivery),
		checkoutStatus: 'details_saved'
	});
}

function savedDeliveryProfileOptions(state) {
	const profiles = normalizeSavedDeliveries(state.savedDeliveries, state.savedDelivery);
	return profiles.map((profile) => {
		const id = deliveryProfileId(profile);
		const nextProfiles = removeSavedDeliveryProfile(profiles, id);
		const selected = id === state.selectedDeliveryProfileId;
		return {
			id,
			label: deliveryProfileLabel(profile),
			description: [profile.city, profile.zip, profile.country].filter(Boolean).join(', '),
			selected,
			selectAction: stateAction(state, {
				delivery: profile,
				selectedDeliveryProfileId: id,
				saveDelivery: true,
				checkoutStatus: 'details_saved'
			}, 'Saved delivery profile loaded'),
			removeAction: stateAction(state, {
				savedDeliveries: nextProfiles,
				savedDelivery: nextProfiles[0] || null,
				selectedDeliveryProfileId: selected ? '' : state.selectedDeliveryProfileId,
				delivery: selected ? { ...emptyDelivery(), email: state.userEmail || state.delivery.email || '' } : state.delivery,
				checkoutStatus: 'draft'
			}, 'Saved delivery profile removed')
		};
	});
}

function checkoutMinimumAmount() {
	const minimum = Number(SHOP_CONFIG.minimumCheckoutAmount);
	return Number.isFinite(minimum) && minimum > 0 ? minimum : 0;
}

function shopDevModeEnabled() {
	const value = SHOP_CONFIG.DEV_MODE;
	if (value === true || value === 1) return true;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
	}
	return false;
}

function isHttpsUrl(value) {
	if (!value) return true;
	try {
		const url = new URL(value);
		return url.protocol === 'https:';
	} catch {
		return false;
	}
}

function productionEndpointMessage() {
	if (shopDevModeEnabled()) return '';
	const fulfillment = SHOP_CONFIG.orderFulfillment || {};
	const email = SHOP_CONFIG.orderEmail || {};
	const payment = SHOP_CONFIG.orderPayment || {};
	const stock = SHOP_CONFIG.stockManagement || {};
	const catalogD1 = SHOP_CONFIG.catalogD1 || {};
	const urls = [
		fulfillment.webhookUrl || email.webhookUrl || '',
		payment.webhookUrl || '',
		stock.provider === 'api' ? stock.apiUrl || '' : '',
		SHOP_CONFIG.defaultCatalogProvider === 'd1' ? catalogD1.apiUrl || '' : ''
	].filter(Boolean);
	const invalid = urls.find((url) => !isHttpsUrl(url));
	return invalid ? 'Worker endpoints must use valid HTTPS URLs in production.' : '';
}

function devModeMessage() {
	return shopDevModeEnabled() ? 'Dev mode is enabled, disable it for production.' : '';
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
	if (!state.coreId) return 'Core ID is required before checkout.';
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
	const collectionMessage = orderCollectionMessage(checkoutState);
	const developmentMessage = devModeMessage();
	const workerDomainMessage = productionEndpointMessage();
	const requiredMessage = checkoutRequiredMessage(checkoutState, hasPhysicalItems);
	const blockedMessage = developmentMessage || workerDomainMessage || collectionMessage || minimumMessage || requiredMessage;
	const finalCheckoutState = checkoutStateWithSavedProfile(checkoutState, hasPhysicalItems);
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
			descriptionExp: orderReference(state),
			referenceId: orderReference(state),
			webhookUrl: SHOP_CONFIG.orderPayment && SHOP_CONFIG.orderPayment.webhookUrl
				? SHOP_CONFIG.orderPayment.webhookUrl
				: undefined
		}
	};
	if (!items.length) {
		return renderCart(state);
	}

	return {
		type: 'shopCheckout',
		shopTitle: SHOP_CONFIG.name,
		shopLogoUrl: shopLogoUrl(),
		coreId: state.coreId,
		cartCount: cartCount(state),
		theme: state.theme,
		themeAction: stateAction(state, { theme: state.theme === 'auto' ? 'dark' : state.theme === 'dark' ? 'light' : 'auto' }),
		portalAction: { type: 'navigate', href: '/' },
		homeAction: stateAction(state, { view: 'products', category: 'all', page: 1 }),
		cartAction: stateAction(state, { view: 'cart' }),
		deliveryForm: renderDeliveryForm(checkoutState),
		useSavedDeliveryAction: checkoutState.savedDelivery
			? stateAction(checkoutState, {
				delivery: checkoutState.savedDelivery,
				selectedDeliveryProfileId: deliveryProfileId(checkoutState.savedDelivery),
				saveDelivery: true,
				checkoutStatus: 'details_saved'
			}, 'Saved delivery profile loaded')
			: null,
		clearDeliveryAction: stateAction(state, { delivery: { ...emptyDelivery(), email: state.userEmail || '' }, checkoutStatus: 'draft' }, 'Delivery form cleared'),
		removeSavedDeliveryAction: checkoutState.savedDelivery
			? stateAction(checkoutState, {
				savedDelivery: null,
				savedDeliveries: [],
				selectedDeliveryProfileId: '',
				saveDelivery: false,
				checkoutStatus: 'draft'
			}, 'Saved delivery profile removed')
			: null,
		saveDeliveryAction: stateAction(checkoutState, { saveDelivery: true }),
		oneOrderAction: stateAction(checkoutState, { saveDelivery: false, selectedDeliveryProfileId: '' }),
		saveDelivery: checkoutState.saveDelivery,
		savedProfiles: savedDeliveryProfileOptions(checkoutState),
		savedProfileOptions: savedDeliveryProfileOptions(checkoutState),
		selectedDeliveryProfileId: checkoutState.selectedDeliveryProfileId,
		saveMode: checkoutState.saveDelivery ? 'save' : 'one-time',
		saveModeOptions: [
			{ label: 'One-time', value: 'one-time', selected: !checkoutState.saveDelivery, action: stateAction(checkoutState, { saveDelivery: false, selectedDeliveryProfileId: '' }) },
			{ label: 'Save delivery', value: 'save', selected: checkoutState.saveDelivery, action: stateAction(checkoutState, { saveDelivery: true }) }
		],
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
		payAction: developmentMessage
			? { type: 'notify', message: developmentMessage, level: 'error' }
			: workerDomainMessage
				? { type: 'notify', message: workerDomainMessage, level: 'error' }
			: collectionMessage
			? { type: 'notify', message: collectionMessage, level: 'error' }
			: minimumMessage
				? { type: 'notify', message: minimumMessage, level: 'warning' }
			: requiredMessage
				? { type: 'notify', message: requiredMessage, level: 'warning' }
			: stockManagedPaymentAction(finalCheckoutState, paymentRequest)
	};
}
