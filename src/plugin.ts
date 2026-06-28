// @ts-nocheck
module.exports = {
	default: {
		setup(hostApi) {
			this.hostApi = hostApi;
			const initialView = readInitialPluginView();
			if (initialView) {
				const state = getState(hostApi);
				const initialProductId = readInitialProductId(state);
				saveState(hostApi, {
					...state,
					view: initialView,
					selectedProductId: initialProductId || state.selectedProductId,
					lastAddedProductId: ''
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
		}
	}
};

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

function readInitialProductId(state) {
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	const productId = context && typeof context.initialProductId === 'string'
		? context.initialProductId.trim()
		: '';
	return catalogProducts(state).some((product) => product.id === productId) ? productId : '';
}
