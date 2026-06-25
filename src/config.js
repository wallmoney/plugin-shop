const STATE_KEY = 'shop-state';

const SHOP_CONFIG = {
	name: 'WM Shop',
	tagline: 'Decentralized shopping listed as WM plugin.',
	logoSrc: 'icon.svg',
	defaultCatalogProvider: 'remote', // "local", "remote", or "d1"
	defaultCatalogRef: 'ipfs://bafkreiaiwxorbucgdkdjfcpphzobys6ts5lr7v3qpic4icdbj6jlw53dc4',
	catalogD1: {
		apiUrl: 'https://catalog.example.com/catalog'
	},
	defaultMerchantAccount: 'wallmoney-shop',
	collectorAccount: 'wallmoney-shop',
	defaultCurrency: 'USD',
	minimumCheckoutAmount: 50,
	deliveryFee: 0,
	pageSize: 8,
	orderEmail: {
		provider: 'webhook',
		adminEmail: 'admin@example.com',
		sendCustomerReceipt: true,
		webhookUrl: 'https://order-fulfillment.example.com/orders/paid',
		fromName: 'Wall Money Shop',
		subjectPrefix: 'New shop order'
	},
	orderFulfillment: {
		mode: 'email',
		webhookUrl: 'https://order-fulfillment.example.com/orders/paid'
	},
	orderPayment: {
		webhookUrl: 'https://order-fulfillment.example.com/orders/payment-webhook'
	},
	stockManagement: {
		provider: 'none',
		apiUrl: ''
	}
};
