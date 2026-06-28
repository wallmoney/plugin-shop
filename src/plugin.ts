// @ts-nocheck
let lastAddedResetTimer = null;
let lastAddedResetProductId = '';

module.exports = {
	default: {
		setup(hostApi) {
			this.hostApi = hostApi;
			const initialRoute = readInitialPluginRoute();
			if (initialRoute) {
				const state = getState(hostApi);
				saveState(hostApi, {
					...state,
					...resolveInitialPluginRoute(initialRoute, state),
					lastAddedProductId: '',
					lastAddedAt: 0
				});
			}
			this.unsubscribe = hostApi.events.onPaymentExecuted((result) => {
				const state = getState(hostApi);
				if (result.status === 'executed') {
					const paidAt = result.executedAt || '';
					const lastOrder = {
						status: 'paid',
						total: cartTotal(state),
						subtotal: cartSubtotal(state),
						deliveryFee: deliveryFeeAmount(state),
						currency: state.settings.currency,
						reference: result.request && result.request.reference ? result.request.reference : orderReference(state),
						sessionId: result.sessionId,
						paidAt,
						delivery: deliverySummary(state.delivery)
					};
					saveState(hostApi, {
						...state,
						view: 'success',
						cart: {},
						checkoutStatus: 'paid',
						lastOrder,
						savedDelivery: state.saveDelivery && hasDeliveryAddress(state.delivery) ? state.delivery : state.savedDelivery,
						savedDeliveries: state.saveDelivery
							? upsertSavedDeliveryProfile(state.savedDeliveries, state.delivery)
							: state.savedDeliveries,
						selectedDeliveryProfileId: state.saveDelivery && hasDeliveryAddress(state.delivery)
							? deliveryProfileId(state.delivery)
							: state.selectedDeliveryProfileId
					});
					hostApi.ui.notify('Order paid. The merchant can fulfill it using the payment reference.', 'success');
					if (SHOP_CONFIG.orderPayment && SHOP_CONFIG.orderPayment.webhookUrl) {
						hostApi.ui.toast('Order fulfillment will continue after payment verification.', 'success');
					} else {
						sendAdminOrderEmail(hostApi, state, result)
							.then((emailResult) => {
								if (emailResult && emailResult.sent) {
									hostApi.ui.toast('Order email sent to shop admin.', 'success');
								}
							})
							.catch((error) => {
								const message = error && error.message ? error.message : 'Unable to send order fulfillment.';
								hostApi.ui.notify(message, 'error');
							});
						sendStockAdjustment(hostApi, state, result)
							.then((stockResult) => {
								if (stockResult && stockResult.adjusted) {
									hostApi.ui.toast('Stock updated.', 'success');
								}
							})
							.catch((error) => {
								const message = error && error.message ? error.message : 'Unable to update stock.';
								hostApi.ui.notify(message, 'warning');
							});
					}
				} else if (result.status === 'opened') {
					saveState(hostApi, {
						...state,
						checkoutStatus: 'payment_opened'
					});
				} else if (result.status === 'failed' || result.status === 'cancelled' || result.status === 'expired') {
					saveState(hostApi, {
						...state,
						view: 'failed',
						checkoutStatus: result.status
					});
				}
			});
			hostApi.user.getProfile({ coreId: true, countryCode: true })
				.then((profile) => {
					if (!profile) return;
					const state = getState(hostApi);
					const country = countryCodeFromValue(state.delivery.country) || countryCodeFromValue(profile.countryCode);
					saveState(hostApi, {
						...state,
						coreId: state.coreId || profile.coreId,
						countryCode: state.countryCode || profile.countryCode || '',
						delivery: {
							...state.delivery,
							country
						}
					});
				})
				.catch(() => {});
			hostApi.user.getCoreId()
				.then((coreId) => {
					if (!coreId) return;
					const state = getState(hostApi);
					saveState(hostApi, {
						...state,
						coreId
					});
				})
				.catch(() => {});
		},

		render() {
			const api = this.hostApi || hostApi;
			const state = getState(api);
			scheduleLastAddedReset(api, state);
			maybeLoadCatalog(api, state);
			maybeRequestCheckoutEmail(api, state);
			return {
				title: SHOP_CONFIG.name,
				nodes: [
					renderView(state)
				]
			};
		},

		dispose() {
			if (typeof this.unsubscribe === 'function') this.unsubscribe();
			if (lastAddedResetTimer) {
				clearTimeout(lastAddedResetTimer);
				lastAddedResetTimer = null;
				lastAddedResetProductId = '';
			}
		}
	}
};

function scheduleLastAddedReset(api, state) {
	if (!state.lastAddedProductId) return;
	if (typeof setTimeout !== 'function') return;
	if (lastAddedResetTimer) clearTimeout(lastAddedResetTimer);
	lastAddedResetProductId = state.lastAddedProductId;
	lastAddedResetTimer = setTimeout(() => {
		const nextState = getState(api);
		lastAddedResetTimer = null;
		lastAddedResetProductId = '';
		if (!nextState.lastAddedProductId) return;
		saveState(api, {
			...nextState,
			lastAddedProductId: '',
			lastAddedAt: 0
		});
	}, 1200);
}

function maybeRequestCheckoutEmail(api, state) {
	if (state.view !== 'checkout') return;
	if (state.userEmail || state.delivery.email || state.emailRequestStatus !== 'idle') return;
	saveState(api, {
		...state,
		emailRequestStatus: 'requested'
	});
	api.user.getProfile({ email: true })
		.then((profile) => {
			const nextState = getState(api);
			const email = profile && profile.email ? profile.email : '';
			saveState(api, {
				...nextState,
				userEmail: nextState.userEmail || email,
				emailRequestStatus: 'resolved',
				delivery: {
					...nextState.delivery,
					email: nextState.delivery.email || email
				}
			});
		})
		.catch(() => {
			const nextState = getState(api);
			saveState(api, {
				...nextState,
				emailRequestStatus: 'resolved'
			});
		});
}

function readInitialPluginView() {
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	const view = context && typeof context.initialView === 'string'
		? context.initialView.trim().toLowerCase()
		: '';
	return ['products', 'product', 'cart', 'checkout', 'orders', 'success', 'failed', 'contact'].includes(view) ? view : null;
}

function readInitialPluginPath() {
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	const path = context && typeof context.initialPath === 'string'
		? context.initialPath.trim()
		: '';
	return path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).map((part) => {
		try {
			return decodeURIComponent(part);
		} catch {
			return part;
		}
	});
}

function readInitialPluginRoute() {
	const pathParts = readInitialPluginPath();
	if (pathParts.length) return { type: 'path', value: pathParts };
	const view = readInitialPluginView();
	return view ? { type: 'view', value: view } : { type: 'default' };
}

function productByPathPart(pathPart, state) {
	const slug = kebabizePathSegment(pathPart);
	return catalogProducts(state).find((product) => {
		return kebabizePathSegment(product.id) === slug;
	}) || null;
}

function resolveInitialPluginRoute(route, state) {
	if (route.type === 'default') {
		return { view: 'products', category: 'all', page: 1 };
	}
	if (route.type === 'view') {
		return { view: route.value };
	}

	const pathPart = route.value[0] || '';
	const product = productByPathPart(pathPart, state);
	if (product) {
		return {
			view: 'product',
			category: product.category,
			selectedProductId: product.id,
			page: 1
		};
	}

	const routeSlug = kebabizePathSegment(pathPart);
	if (['cart', 'checkout', 'orders', 'success', 'failed', 'contact'].includes(routeSlug)) {
		return { view: routeSlug };
	}
	if (routeSlug === 'products' || routeSlug === 'shop') {
		return { view: 'products', category: 'all', page: 1 };
	}

	return { view: 'products', category: 'all', page: 1 };
}
