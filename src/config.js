const STATE_KEY = 'shop-state';

const SHOP_CONFIG = {
	name: 'Wall Money Shop',
	tagline: 'A small IPFS-backed shop for tea, coffee, and flowers',
	defaultGatewayUrl: 'https://ipf.sk',
	defaultUploadProviderUrl: 'https://web3.storage',
	defaultCatalogRef: 'data/inventory',
	defaultMerchantAccount: 'wallmoney-shop',
	defaultCurrency: 'USDX',
	orderEmail: {
		provider: 'webhook',
		adminEmail: 'admin@example.com',
		webhookUrl: 'https://shop-email.example.com/orders/paid',
		authHeader: '',
		fromName: 'Wall Money Shop',
		subjectPrefix: 'New shop order'
	}
};
