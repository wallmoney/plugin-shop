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
					const paidAt = result.executedAt || new Date().toISOString();
					saveState(hostApi, {
						...state,
						view: 'orders',
						cart: {},
						checkoutStatus: 'paid',
						lastOrder: {
							status: 'paid',
							total: cartTotal(state),
							currency: state.settings.currency,
							reference: result.request && result.request.reference ? result.request.reference : orderReference(state),
							sessionId: result.sessionId,
							paidAt,
							delivery: deliverySummary(state.delivery)
						},
						savedDelivery: state.saveDelivery ? state.delivery : state.savedDelivery
					});
					hostApi.ui.notify('Order paid. The merchant can fulfill it using the payment reference.', 'success');
				} else if (result.status === 'opened') {
					saveState(hostApi, {
						...state,
						checkoutStatus: 'payment_opened'
					});
				} else if (result.status === 'failed' || result.status === 'cancelled' || result.status === 'expired') {
					saveState(hostApi, {
						...state,
						checkoutStatus: result.status
					});
				}
			});
			hostApi.user.getCoreId()
				.then((coreId) => {
					if (!coreId) return;
					const state = getState(hostApi);
					if (state.delivery.name) return;
					saveState(hostApi, {
						...state,
						delivery: {
							...state.delivery,
							name: coreId
						}
					});
				})
				.catch(() => {});
		},

		render() {
			const api = this.hostApi || hostApi;
			const state = getState(api);
			return {
				title: SHOP_CONFIG.name,
				description: `${SHOP_CONFIG.tagline} with categories, cart, checkout, saved delivery details, and Wall Money payments.`,
				nodes: [
					{
						type: 'stack',
						gap: 'lg',
						children: [
							renderHero(state),
							renderView(state)
						]
					}
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
	return ['products', 'cart', 'checkout', 'settings', 'orders'].includes(view) ? view : null;
}
