const STATE_KEY = 'shop-state';

const SHOP_CONFIG = {
	name: 'IPFS Shop',
	tagline: 'Decentralized marketplace for IPFS-hosted listings',
	defaultGatewayUrl: 'https://ipf.sk',
	defaultUploadProviderUrl: 'https://web3.storage',
	defaultCatalogRef: 'ipns/shop.example',
	defaultMerchantAccount: 'wallmoney-shop',
	defaultCurrency: 'USDX'
};

const SHOP_CATEGORIES = [
	{ id: 'all', label: 'All', icon: '🧺', helper: 'Everything' },
	{ id: 'pantry', label: 'Pantry', icon: '☕', helper: 'Food and drinks' },
	{ id: 'home', label: 'Home', icon: '🏠', helper: 'Objects and decor' },
	{ id: 'garden', label: 'Garden', icon: '🌱', helper: 'Seeds and growing' },
	{ id: 'electronics', label: 'Electronics', icon: '💡', helper: 'Useful devices' },
	{ id: 'stationery', label: 'Stationery', icon: '📓', helper: 'Paper goods' }
];

const SHOP_PRODUCTS = [
	{
		id: 'artisan-coffee',
		name: 'Artisan Coffee Beans',
		category: 'pantry',
		price: 18,
		icon: '☕',
		cid: 'bafybeicoffeeexample',
		description: 'Small-batch roasted coffee with tasting notes stored as IPFS metadata.',
		stock: 24
	},
	{
		id: 'linen-tote',
		name: 'Linen Market Tote',
		category: 'home',
		price: 32,
		icon: '🛍️',
		cid: 'bafybeitoteexample',
		description: 'Reusable everyday tote inspired by open-air markets.',
		stock: 15
	},
	{
		id: 'ceramic-cup',
		name: 'Handmade Ceramic Cup',
		category: 'home',
		price: 41,
		icon: '🏺',
		cid: 'bafybeiceramicexample',
		description: 'Wheel-thrown cup with glaze photos pinned to IPFS.',
		stock: 8
	},
	{
		id: 'seed-kit',
		name: 'Balcony Herb Seed Kit',
		category: 'garden',
		price: 14,
		icon: '🌱',
		cid: 'bafybeiseedexample',
		description: 'Basil, mint, and thyme starter kit with growing guide CID.',
		stock: 30
	},
	{
		id: 'desk-lamp',
		name: 'Modular Desk Lamp',
		category: 'electronics',
		price: 76,
		icon: '💡',
		cid: 'bafybeilampexample',
		description: 'Repair-friendly lamp with parts list and instructions on IPFS.',
		stock: 7
	},
	{
		id: 'field-notes',
		name: 'Field Notes Pack',
		category: 'stationery',
		price: 9,
		icon: '📓',
		cid: 'bafybeinotesexample',
		description: 'Three pocket notebooks with IPFS-hosted printable templates.',
		stock: 50
	}
];
