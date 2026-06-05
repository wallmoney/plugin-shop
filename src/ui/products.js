function categoryTitle(state) {
	const category = categoryById(state.category);
	return category ? category.label : 'Products';
}

function productPrice(state, product) {
	return formatMoney(product.price, product.currency || state.settings.currency);
}

function vendorInitials(product) {
	return (product.vendor || SHOP_CONFIG.name)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('') || 'WM';
}

function productCardNode(state, product) {
	return {
		id: product.id,
		name: product.name,
		vendor: product.vendor || SHOP_CONFIG.name,
		icon: product.icon,
		imageUrl: productImageUrl(state, product),
		badge: product.badge,
		rating: product.rating,
		reviews: String(product.reviews || 0),
		price: productPrice(state, product),
		action: stateAction(state, {
			view: 'product',
			category: product.category,
			selectedProductId: product.id
		}),
		addAction: stateAction(addToCart(state, product.id), {}, `${product.name} added to cart`)
	};
}

function productDetailNode(state, product) {
	return {
		...productCardNode(state, product),
		vendorInitials: vendorInitials(product),
		description: product.description,
		cid: product.cid,
		packLabel: product.packLabel || 'Standard pack',
		soldLabel: `${product.soldLast30Days || 0} sold in the last 30 days`
	};
}

function renderProducts(state) {
	const products = filteredProducts(state);
	return {
		type: 'shopCatalog',
		title: categoryTitle(state),
		subtitle: SHOP_CONFIG.tagline,
		coreId: state.coreId,
		cartCount: cartCount(state),
		portalAction: { type: 'navigate', href: '/' },
		cartAction: stateAction(state, { view: 'cart' }),
		settingsAction: stateAction(state, { view: 'settings' }),
		categories: SHOP_CATEGORIES.map((category) => ({
			id: category.id,
			label: category.label,
			count: categoryProductCount(category.id),
			selected: state.category === category.id,
			action: stateAction(state, {
				category: category.id,
				view: 'products',
				selectedProductId: productsByCategory(category.id)[0]?.id || state.selectedProductId
			})
		})),
		products: products.map((product) => productCardNode(state, product))
	};
}

function renderProductDetail(state) {
	const product = selectedProduct(state);
	if (!product) return renderProducts(state);
	const related = SHOP_PRODUCTS
		.filter((item) => item.id !== product.id && item.category === product.category)
		.concat(SHOP_PRODUCTS.filter((item) => item.id !== product.id && item.category !== product.category))
		.slice(0, 3);
	return {
		type: 'shopProductDetail',
		coreId: state.coreId,
		product: productDetailNode(state, product),
		quantity: state.cart[product.id] || 0,
		backAction: stateAction(state, { view: 'products', category: product.category }),
		portalAction: { type: 'navigate', href: '/' },
		addAction: stateAction(addToCart(state, product.id), {}, `${product.name} added to cart`),
		removeAction: stateAction(removeOneFromCart(state, product.id), {}),
		buyAction: stateAction(addToCart(state, product.id), { view: 'checkout' }),
		related: related.map((item) => productCardNode(state, item))
	};
}
