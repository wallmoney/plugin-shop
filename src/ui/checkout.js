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
			label: 'State (US only)',
			type: 'select',
			value: deliveryDraft.state,
			placeholder: 'California',
			options: US_STATE_OPTIONS,
			required: hasUnitedStates
		});
		fields.push({ name: 'delivery.notes', label: 'Delivery notes', value: deliveryDraft.notes, placeholder: 'Floor, flat number, …' });
	}

	return {
		type: 'form',
		fields,
		action: {
			type: 'storage',
			key: STATE_KEY,
			value: checkoutReadyState(state)
		},
		autoSaveAction: {
			type: 'storage',
			key: STATE_KEY,
			value: checkoutReadyState(state)
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

function renderCheckoutField(field, storageActionId) {
	const value = escapeHtml(field.value || '');
	const required = field.required ? 'required' : '';
	const common = `class="wm-input" name="${escapeHtml(field.name)}" data-plugin-storage-action="${escapeHtml(storageActionId)}" data-plugin-field="${escapeHtml(field.name)}" ${required}`;
	if (field.type === 'select') {
		return `<label>
			<span class="wm-product-meta">${escapeHtml(field.label || field.name)}</span>
			<select ${common}>
				<option value="">${escapeHtml(field.placeholder || field.label || '')}</option>
				${(field.options || []).map((option) => {
					const optionValue = option.name || option.label || option.value || option.code || '';
					return `<option value="${escapeHtml(optionValue)}" ${optionValue === field.value ? 'selected' : ''}>${escapeHtml(optionValue)}</option>`;
				}).join('')}
			</select>
		</label>`;
	}
	return `<label class="${field.name === 'delivery.notes' || field.name === 'delivery.address' || field.name === 'delivery.address2' ? 'wm-span-2' : ''}">
		<span class="wm-product-meta">${escapeHtml(field.label || field.name)}</span>
		<input ${common} type="${escapeHtml(field.type || 'text')}" value="${value}" placeholder="${escapeHtml(field.placeholder || field.label || '')}" />
	</label>`;
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

	const actions = {};
	const deliveryForm = renderDeliveryForm(checkoutState);
	const storageActionId = addFrameAction(actions, deliveryForm.autoSaveAction || deliveryForm.action);
	const profiles = savedDeliveryProfileOptions(checkoutState);
	const payAction = developmentMessage
		? { type: 'notify', message: developmentMessage, level: 'error' }
		: workerDomainMessage
			? { type: 'notify', message: workerDomainMessage, level: 'error' }
		: collectionMessage
			? { type: 'notify', message: collectionMessage, level: 'error' }
		: minimumMessage
			? { type: 'notify', message: minimumMessage, level: 'warning' }
		: requiredMessage
			? { type: 'notify', message: requiredMessage, level: 'warning' }
		: stockManagedPaymentAction(finalCheckoutState, paymentRequest);

	return pluginFrame('Checkout', `
		<div class="wm-page">
			<header class="wm-header wm-shell">
				<button type="button" class="wm-brand" ${actionAttr(actions, stateAction(state, { view: 'products', category: 'all', page: 1 }))}>
					${shopLogoUrl() ? `<img class="wm-logo" src="${escapeHtml(shopLogoUrl())}" alt="" />` : ''}
					<span>${escapeHtml(SHOP_CONFIG.name)}</span>
				</button>
				<button type="button" class="wm-chip" ${actionAttr(actions, stateAction(state, { view: 'cart' }))}>Cart ${cartCount(state)}</button>
			</header>
			<main class="wm-checkout">
				<section class="wm-card">
					<h1 style="margin:0;font-size:1.5rem;font-weight:950">${hasPhysicalItems ? 'Delivery details' : 'Contact details'}</h1>
					<p class="wm-muted">${hasPhysicalItems ? 'These details are sent to the shop admin only after successful payment.' : 'Digital orders only need an email address and Core ID.'}</p>
					${hasPhysicalItems && profiles.length ? `
						<label>
							<span class="wm-product-meta">Saved address</span>
							<select class="wm-input">
								<option value="">Select saved address</option>
								${profiles.map((profile) => `<option value="${escapeHtml(profile.id)}" data-plugin-action="${addFrameAction(actions, profile.selectAction)}" ${profile.id === checkoutState.selectedDeliveryProfileId ? 'selected' : ''}>${escapeHtml(profile.description ? `${profile.label} - ${profile.description}` : profile.label)}</option>`).join('')}
							</select>
						</label>
					` : ''}
					<form class="wm-form-grid">
						${deliveryForm.fields.map((field) => renderCheckoutField(field, storageActionId)).join('')}
					</form>
					${hasPhysicalItems ? `
						<div class="wm-inline-actions">
							${frameButton(actions, checkoutState.saveDelivery ? 'Saving delivery' : 'Save delivery', stateAction(checkoutState, { saveDelivery: true }), checkoutState.saveDelivery ? 'primary' : 'secondary')}
							${frameButton(actions, 'This order only', stateAction(checkoutState, { saveDelivery: false, selectedDeliveryProfileId: '' }), checkoutState.saveDelivery ? 'secondary' : 'primary')}
							${frameButton(actions, 'Clear form', stateAction(state, { delivery: { ...emptyDelivery(), email: state.userEmail || '' }, checkoutStatus: 'draft' }, 'Delivery form cleared'), 'ghost')}
							${checkoutState.savedDelivery ? frameButton(actions, 'Remove saved delivery', stateAction(checkoutState, {
								savedDelivery: null,
								savedDeliveries: [],
								selectedDeliveryProfileId: '',
								saveDelivery: false,
								checkoutStatus: 'draft'
							}, 'Saved delivery profile removed'), 'ghost') : ''}
						</div>
					` : ''}
				</section>
				<aside class="wm-card">
					<h2 style="margin:0;font-size:1.25rem;font-weight:950">Order summary</h2>
					${items.map((item) => `<div class="wm-summary-line"><span>${escapeHtml(item.product.name)} × ${item.quantity}</span><strong>${escapeHtml(formatMoney(item.product.price * item.quantity, state.settings.currency))}</strong></div>`).join('')}
					<div class="wm-total"><span>Total</span><span>${escapeHtml(formatMoney(total, state.settings.currency))}</span></div>
					<p class="wm-muted">Core ID: ${escapeHtml(state.coreId || 'Not provided')}</p>
					<p class="wm-muted">Collector: ${escapeHtml(collectorAccount())}</p>
					${hasPhysicalItems ? `<p class="wm-muted">Delivery: ${escapeHtml(deliverySummary(delivery))}</p>` : ''}
					${blockedMessage ? `<p class="wm-warning">${escapeHtml(blockedMessage)}</p>` : ''}
					<div class="wm-inline-actions">
						${frameButton(actions, 'Back to cart', stateAction(state, { view: 'cart' }), 'secondary')}
						${frameButton(actions, blockedMessage ? 'Cannot pay yet' : 'Pay with Wall Money', payAction)}
					</div>
				</aside>
			</main>
		</div>
	`, actions);
}
