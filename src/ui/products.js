function categoryTitle(state) {
	if (state.category === 'all') return 'All';
	const category = categoryById(state.category);
	return category ? category.label : 'Products';
}

function productPrice(state, product) {
	return formatMoney(product.price, state.settings.currency);
}

function vendorInitials(product) {
	return (product.vendor || SHOP_CONFIG.name)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('') || 'WM';
}

function shopThemeAction(state) {
	return stateAction(state, { theme: state.theme === 'auto' ? 'dark' : state.theme === 'dark' ? 'light' : 'auto' });
}

function productCardNode(state, product) {
	return {
		id: product.id,
		name: product.name,
		vendor: product.vendor || SHOP_CONFIG.name,
		icon: product.icon,
		imageUrl: productImageUrl(state, product),
		badge: product.badge,
		packLabel: product.packLabel || 'Standard pack',
		price: productPrice(state, product),
		digital: product.digital === true,
		action: stateAction(state, {
			view: 'product',
			category: product.category,
			selectedProductId: product.id,
			productQuantities: {
				...state.productQuantities,
				[product.id]: productQuantity(state, product.id)
			}
		}),
		addAction: stateAction(addToCart(state, product.id), {}, `${product.name} added to cart`)
	};
}

function productDetailNode(state, product) {
	return {
		...productCardNode(state, product),
		vendorInitials: vendorInitials(product),
		description: product.description,
		packLabel: product.packLabel || 'Standard pack'
	};
}

function renderProducts(state) {
	const products = filteredProducts(state);
	const pageSize = Math.max(1, Number(SHOP_CONFIG.pageSize) || 8);
	const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
	const currentPage = Math.min(Math.max(1, state.page || 1), totalPages);
	const visibleProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	return {
		type: 'shopCatalog',
		shopTitle: SHOP_CONFIG.name,
		shopSubtitle: SHOP_CONFIG.tagline,
		shopLogoUrl: SHOP_CONFIG.logoUrl,
		title: categoryTitle(state),
		subtitle: SHOP_CONFIG.tagline,
		coreId: state.coreId,
		cartCount: cartCount(state),
		theme: state.theme,
		themeAction: shopThemeAction(state),
		portalAction: { type: 'navigate', href: '/' },
		homeAction: stateAction(state, { view: 'products', category: 'all', page: 1 }),
		cartAction: stateAction(state, { view: 'cart' }),
		categories: allCategories().map((category) => ({
			id: category.id,
			label: category.label,
			selected: state.category === category.id,
			action: stateAction(state, {
				category: category.id,
				view: 'products',
				page: 1,
				selectedProductId: (category.id === 'all' ? SHOP_PRODUCTS[0] : productsByCategory(category.id)[0])?.id || state.selectedProductId
			})
		})),
		products: visibleProducts.map((product) => productCardNode(state, product)),
		pagination: {
			currentPage,
			totalPages,
			totalItems: products.length,
			prevAction: currentPage > 1 ? stateAction(state, { page: currentPage - 1 }) : null,
			nextAction: currentPage < totalPages ? stateAction(state, { page: currentPage + 1 }) : null
		}
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
		shopTitle: SHOP_CONFIG.name,
		shopLogoUrl: SHOP_CONFIG.logoUrl,
		coreId: state.coreId,
		cartCount: cartCount(state),
		theme: state.theme,
		themeAction: shopThemeAction(state),
		product: productDetailNode(state, product),
		quantity: productQuantity(state, product.id),
		backAction: stateAction(state, { view: 'products', category: product.category }),
		portalAction: { type: 'navigate', href: '/' },
		homeAction: stateAction(state, { view: 'products', category: 'all', page: 1 }),
		cartAction: stateAction(state, { view: 'cart' }),
		addAction: stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), {}, `${product.name} added to cart`),
		increaseQuantityAction: stateAction(incrementProductQuantity(state, product.id), {}),
		decreaseQuantityAction: stateAction(decrementProductQuantity(state, product.id), {}),
		buyAction: stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), { view: 'cart' }),
		related: related.map((item) => productCardNode(state, item))
	};
}
