// @ts-nocheck
function renderDeliveryForm(state) {
	const initialDelivery = checkoutDelivery(state);
	const hasPhysicalItems = cartItems(state).some((item) => item.product.digital !== true);
	const selectedCountry = countryCodeFromValue(initialDelivery.country) || countryCodeFromValue(state.countryCode) || '';
	const hasUnitedStates = selectedCountry === 'US';
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
				placeholder: 'Country code or name',
				options: COUNTRY_OPTIONS,
				required: true
			}
		);
		if (hasUnitedStates) {
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
	const currentDelivery = checkoutDelivery(state);
	const delivery = normalizeDelivery({
		...currentDelivery,
		email: currentDelivery.email || state.userEmail || '',
		country: countryCodeFromValue(currentDelivery.country) || countryCodeFromValue(state.countryCode) || ''
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
			description: [profile.city, profile.zip, countryNameFromCode(profile.country) || profile.country].filter(Boolean).join(', '),
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
	return /^\+[0-9]{7,24}$/.test(String(value || '').trim());
}

function isUnitedStates(value) {
	return countryCodeFromValue(value) === 'US';
}

function minimumCheckoutMessage(state, total) {
	const minimum = checkoutMinimumAmount();
	if (!minimum || total >= minimum) return '';
	return `Minimum order amount is ${formatMoney(minimum, state.settings.currency)}.`;
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
	if (!countryCodeFromValue(delivery.country)) missing.push('country');
	if (missing.length) return 'Enter delivery details before checkout.';
	if (delivery.name.length < 2) return 'Enter a valid full name.';
	if (!isValidPhone(delivery.phone)) return 'Enter a valid phone number.';
	if (delivery.address.length < 3) return 'Enter a valid street address.';
	if (delivery.city.length < 2) return 'Enter a valid city.';
	if (delivery.zip.length < 2) return 'Enter a valid ZIP/postal code.';
	if (!COUNTRY_OPTIONS.some((country) => country.code === countryCodeFromValue(delivery.country))) return 'Select a valid country.';
	if (isUnitedStates(delivery.country) && !delivery.state) return 'Select a state for United States delivery.';
	if (isUnitedStates(delivery.country) && !US_STATE_OPTIONS.some((stateOption) => stateOption.name === delivery.state)) return 'Select a valid state.';
	return missing.length ? `Add ${missing.join(', ')} before checkout.` : '';
}

function renderCheckoutField(state, field, storageActionId) {
	const value = escapeHtml(field.value || '');
	const required = field.required ? 'required' : '';
	const label = `${escapeHtml(field.label || field.name)}${field.required ? ' <span class="text-red-500">*</span>' : ''}`;
	const common = `class="${inputClass(state)}" name="${escapeHtml(field.name)}" data-plugin-storage-action="${escapeHtml(storageActionId)}" data-plugin-field="${escapeHtml(field.name)}" ${required}`;
	const htmlValidation = {
		'delivery.email': 'inputmode="email" autocomplete="email" pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]+" maxlength="254" title="Enter a valid email address."',
		'delivery.phone': 'inputmode="tel" autocomplete="tel" pattern="\\+[0-9]{7,24}" minlength="8" maxlength="25" title="Enter a phone number in +123456789 format."'
	}[field.name] || '';
	if (field.type === 'select') {
		return `<label>
			<span class="${fieldLabelClass(state)}">${label}</span>
			<select ${common}>
				<option value="">${escapeHtml(field.placeholder || field.label || '')}</option>
				${(field.options || []).map((option) => {
					const optionValue = option.name || option.label || option.value || option.code || '';
					return `<option value="${escapeHtml(optionValue)}" ${optionValue === field.value ? 'selected' : ''}>${escapeHtml(optionValue)}</option>`;
				}).join('')}
			</select>
		</label>`;
	}
	if (field.type === 'country') {
		const countryCode = countryCodeFromValue(field.value);
		const displayValue = countryCode ? countryDisplayValue(countryCode) : '';
		return `<label>
			<span class="${fieldLabelClass(state)}">${label}</span>
			<input ${common} type="text" list="country-options" value="${escapeHtml(displayValue)}" placeholder="${escapeHtml(field.placeholder || field.label || '')}" autocomplete="country-name" />
			<datalist id="country-options">
				${(field.options || []).map((option) => `<option value="${escapeHtml(countryDisplayValue(option.code))}"></option>`).join('')}
			</datalist>
		</label>`;
	}
	return `<label class="${field.name === 'delivery.notes' || field.name === 'delivery.address' || field.name === 'delivery.address2' ? 'col-span-2 max-[900px]:col-span-1' : ''}">
		<span class="${fieldLabelClass(state)}">${label}</span>
		<input ${common} ${htmlValidation} type="${escapeHtml(field.type || 'text')}" value="${value}" placeholder="${escapeHtml(field.placeholder || field.label || '')}" />
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
	const savedAddressPanel = hasPhysicalItems && profiles.length ? `
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<label>
				<span class="${fieldLabelClass(checkoutState)}">Saved addresses</span>
				<select class="${inputClass(checkoutState, 'min-w-[min(100%,18rem)]')}" name="selectedDeliveryProfileId" data-plugin-storage-action="${escapeHtml(storageActionId)}" data-plugin-field="selectedDeliveryProfileId">
					<option value="">Select saved address</option>
					${profiles.map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.selected ? 'selected' : ''}>${escapeHtml(profile.label)}</option>`).join('')}
				</select>
			</label>
		</div>
		<details class="mt-4 overflow-hidden rounded-2xl border border-slate-500/40 bg-slate-500/10">
			<summary class="cursor-pointer px-4 py-3 font-semibold">Manage saved addresses</summary>
			${profiles.map((profile) => `
				<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-slate-500/25 p-3">
					<button type="button" class="${buttonClass('ghost', 'justify-start text-left')}" ${actionAttr(actions, profile.selectAction)}>
						<span>
							<span class="font-semibold">${escapeHtml(profile.label)}</span>
							${profile.description ? `<span class="mt-1 block text-xs ${mutedClass(checkoutState)}">${escapeHtml(profile.description)}</span>` : ''}
						</span>
					</button>
					<button type="button" class="${iconButtonClass(checkoutState)}" title="Delete saved address" ${actionAttr(actions, profile.removeAction)}>${icon('trash', 15)}</button>
				</div>
			`).join('')}
		</details>
	` : '';
	const payAction = blockedMessage ? null : stockManagedPaymentAction(finalCheckoutState, paymentRequest);

	return pluginFrame('Checkout', `
		<div class="${pageClass(state)}">
			${renderShopHeader(actions, state)}
			<main class="mx-auto mt-10 grid max-w-6xl grid-cols-[minmax(0,1fr)_24rem] gap-6 max-[900px]:block max-[900px]:p-5">
				<section class="${cardClass(state)}">
					<h1 class="m-0 text-2xl font-semibold">${hasPhysicalItems ? 'Delivery details' : 'Contact details'}</h1>
					<p class="${mutedClass(state)}">${hasPhysicalItems ? 'These details are sent to the shop admin only after successful payment.' : 'Digital orders only need an email address and Core ID.'}</p>
					${hasPhysicalItems ? `
						<div class="mt-4 flex flex-wrap items-center gap-3">
							<button type="button" class="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-medium text-inherit" role="checkbox" aria-checked="${checkoutState.saveDelivery ? 'true' : 'false'}" ${actionAttr(actions, stateAction(checkoutState, { saveDelivery: !checkoutState.saveDelivery, selectedDeliveryProfileId: checkoutState.saveDelivery ? '' : checkoutState.selectedDeliveryProfileId }))}>
								<input class="h-4 w-4 accent-violet-600" type="checkbox" tabindex="-1" ${checkoutState.saveDelivery ? 'checked' : ''} />
								<span>Save address for next order</span>
							</button>
							${frameButton(actions, 'Clear form', stateAction(state, { delivery: emptyDelivery(), userEmail: '', countryCode: '', selectedDeliveryProfileId: '', checkoutStatus: 'draft', emailRequestStatus: 'resolved' }, 'Delivery form cleared'), 'link')}
						</div>
						${savedAddressPanel}
					` : ''}
					<form class="mt-6 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
						${deliveryForm.fields.map((field) => renderCheckoutField(checkoutState, field, storageActionId)).join('')}
					</form>
					<p class="mt-4 text-xs ${mutedClass(state)}"><span class="text-red-500">*</span> Required fields</p>
				</section>
				<aside class="${cardClass(state, 'max-[900px]:mt-6')}">
					<h2 class="m-0 text-xl font-semibold">Order summary</h2>
					${items.map((item) => `<div class="${summaryLineClass()}"><span class="font-semibold">${escapeHtml(item.product.name)} × ${item.quantity}</span><span class="font-normal">${escapeHtml(formatMoney(item.product.price * item.quantity, state.settings.currency))}</span></div>`).join('')}
					<div class="mt-8 flex justify-between gap-4 border-t border-slate-500/25 pt-5 text-lg"><span class="font-semibold">Total</span><span class="font-normal">${escapeHtml(formatMoney(total, state.settings.currency))}</span></div>
					<p class="mt-4 text-sm leading-6 ${mutedClass(state)}"><span class="font-semibold">Core ID:</span><br><span class="block break-words font-normal tracking-wide">${escapeHtml(state.coreId ? compactCoreId(state.coreId) : 'Not provided')}</span></p>
					<p class="mt-4 text-sm leading-6 ${mutedClass(state)}"><span class="font-semibold">Collector:</span> <span class="font-normal">${escapeHtml(collectorAccount())}</span></p>
					${hasPhysicalItems ? `<p class="mt-4 text-sm leading-6 ${mutedClass(state)}"><span class="font-semibold">Delivery:</span> <span class="font-normal">${escapeHtml(deliverySummary(delivery))}</span></p>` : ''}
					${blockedMessage ? `<p class="${warningClass(state)}">${escapeHtml(blockedMessage)}</p>` : ''}
					<div class="${inlineActionsClass()}">
						${minimumMessage ? frameButton(actions, 'Shop more', stateAction(state, { view: 'products', category: 'all', page: 1 }), 'secondary') : frameButton(actions, 'Back to cart', stateAction(state, { view: 'cart' }), 'secondary')}
						<button type="button" class="${buttonClass('primary')}" ${payAction ? actionAttr(actions, payAction) : 'disabled'}>Pay with Wall Money</button>
					</div>
				</aside>
			</main>
		</div>
	`, actions);
}
