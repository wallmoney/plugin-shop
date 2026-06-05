// Generated from data/categories.json and data/inventory/*.json. Run npm run build:inventory after edits.
const SHOP_CATEGORIES = [
	{
		"id": "tea",
		"label": "Tea",
		"helper": "Leafy rituals and warm cups",
		"order": 1
	},
	{
		"id": "coffee",
		"label": "Coffee",
		"helper": "Roasted daily essentials",
		"order": 2
	},
	{
		"id": "flowers",
		"label": "Flowers",
		"helper": "Fresh stems and soft color",
		"order": 3
	}
];

const SHOP_PRODUCTS = [
	{
		"id": "red-tea",
		"name": "Red Tea",
		"category": "tea",
		"price": 12,
		"currency": "USDX",
		"icon": "🍵",
		"cid": "bafybeiev3uiuiwi26zchkmxqpepoaz5rieiivq6yk4tcutjbsixtozriya",
		"description": "A mellow red tea with a ruby cup, gentle tannins, and a naturally sweet finish. Ideal for slow mornings or an afternoon reset.",
		"stock": 42,
		"vendor": "Wall Money Pantry",
		"rating": 4.8,
		"reviews": 184,
		"soldLast30Days": 96,
		"badge": "Popular",
		"packLabel": "80g pouch",
		"order": 1
	},
	{
		"id": "turkish-tea",
		"name": "Turkish Tea",
		"category": "tea",
		"price": 14,
		"currency": "USDX",
		"icon": "🫖",
		"cid": "bafybeidasvv63e3xchk6hbe4vde3grlc652qa6io2s3pw7y5vqrwiohehu",
		"description": "Bold black tea inspired by Turkish tea gardens. Brew it strong, serve it bright, and keep the second glass close.",
		"stock": 36,
		"vendor": "Wall Money Pantry",
		"rating": 4.7,
		"reviews": 139,
		"soldLast30Days": 74,
		"badge": "Fresh",
		"packLabel": "100g tin",
		"order": 2
	},
	{
		"id": "coffee",
		"name": "Coffee",
		"category": "coffee",
		"price": 18,
		"currency": "USDX",
		"icon": "☕",
		"cid": "bafybeibi24hc42onhxq3dqyphnen2aklv4uplbozeifvay7vmw43mmbhzi",
		"description": "A balanced roast with cocoa depth, toasted sugar, and a clean finish. Built for both espresso and quiet filter brews.",
		"stock": 28,
		"vendor": "Wall Money Roasters",
		"rating": 4.9,
		"reviews": 211,
		"soldLast30Days": 128,
		"badge": "Top pick",
		"packLabel": "250g bag",
		"order": 3
	},
	{
		"id": "red-rose",
		"name": "Red Rose",
		"category": "flowers",
		"price": 9,
		"currency": "USDX",
		"icon": "🌹",
		"cid": "bafybeihny5f3zl3ir3423a3eh2zw4emcm3z54r5emm4qgrhtfglumk5wle",
		"description": "A classic red rose selected for deep color and long vase life. Simple, direct, and somehow still undefeated.",
		"stock": 64,
		"vendor": "Wall Money Florist",
		"rating": 4.8,
		"reviews": 167,
		"soldLast30Days": 102,
		"badge": "Giftable",
		"packLabel": "Single stem",
		"order": 4
	},
	{
		"id": "tulip",
		"name": "Tulip",
		"category": "flowers",
		"price": 7,
		"currency": "USDX",
		"icon": "🌷",
		"cid": "bafybeib2xc5krqhdgzfgyfgnc2bjkuanwmsnbco37s735qnkb43mqf6rd4",
		"description": "A bright tulip stem with a clean silhouette and spring energy. Lovely alone, better in a small bunch.",
		"stock": 58,
		"vendor": "Wall Money Florist",
		"rating": 4.6,
		"reviews": 121,
		"soldLast30Days": 88,
		"badge": "Seasonal",
		"packLabel": "Single stem",
		"order": 5
	}
];
