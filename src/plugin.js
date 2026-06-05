module.exports = {
	default: {
		setup(hostApi) {
			this.hostApi = hostApi;
			const initialView = readInitialPluginView();
			if (initialView) {
				saveState(hostApi, {
					...getState(hostApi),
					view: initialView
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
						savedDelivery: state.saveDelivery ? state.delivery : state.savedDelivery
					});
					hostApi.ui.notify('Order paid. The merchant can fulfill it using the payment reference.', 'success');
					sendAdminOrderEmail(hostApi, state, result)
						.then((emailResult) => {
							if (emailResult && emailResult.sent) {
								hostApi.ui.toast('Order email sent to shop admin.', 'success');
							}
						})
						.catch((error) => {
							const message = error && error.message ? error.message : 'Unable to send order email.';
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
				} else if (result.status === 'opened') {
					saveState(hostApi, {
						...state,
						checkoutStatus: 'payment_opened'
					});
				} else if (result.status === 'failed' || result.status === 'cancelled' || result.status === 'expired') {
					saveState(hostApi, {
						...state,
						view: 'cart',
						checkoutStatus: result.status
					});
				}
			});
			hostApi.user.getProfile({ coreId: true, email: true, countryCode: true })
				.then((profile) => {
					if (!profile) return;
					const state = getState(hostApi);
					const country = state.delivery.country || countryNameFromCode(profile.countryCode);
					saveState(hostApi, {
						...state,
						coreId: state.coreId || profile.coreId,
						userEmail: state.userEmail || profile.email || '',
						countryCode: state.countryCode || profile.countryCode || '',
						delivery: {
							...state.delivery,
							email: state.delivery.email || profile.email || '',
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

function readInitialPluginView() {
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	const view = context && typeof context.initialView === 'string'
		? context.initialView.trim().toLowerCase()
		: '';
	return ['products', 'product', 'cart', 'checkout', 'orders', 'success'].includes(view) ? view : null;
}
