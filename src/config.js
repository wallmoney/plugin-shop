const STATE_KEY = 'shop-state';

const SHOP_CONFIG = {
	name: 'WM Shop',
	tagline: 'Decentralized shopping listed as WM plugin.',
	logoUrl: '',
	defaultGatewayUrl: 'https://ipf.sk',
	defaultCatalogRef: 'data/inventory',
	defaultMerchantAccount: 'wallmoney-shop',
	collectorAccount: 'wallmoney-shop',
	defaultCurrency: 'USD',
	minimumCheckoutAmount: 50,
	deliveryFee: 0,
	pageSize: 8,
	orderEmail: {
		provider: 'webhook',
		adminEmail: 'admin@example.com',
		webhookUrl: 'https://shop-email.example.com/orders/paid',
		authHeader: '',
		fromName: 'Wall Money Shop',
		subjectPrefix: 'New shop order'
	},
	stockManagement: {
		provider: 'none',
		webhookUrl: '',
		authHeader: ''
	}
};
