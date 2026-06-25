function categoryTitle(state) {
	if (state.category === 'all') return 'All';
	const category = categoryById(state.category, state);
	return category ? category.label : 'Products';
}

function productPrice(state, product) {
	return formatMoney(product.price, state.settings.currency);
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

function renderProducts(state) {
	const products = filteredProducts(state);
	const pageSize = Math.max(1, Number(SHOP_CONFIG.pageSize) || 8);
	const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
	const currentPage = Math.min(Math.max(1, state.page || 1), totalPages);
	const visibleProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	return {
		type: 'stack',
		gap: 'lg',
		children: [
			renderHero(state),
			{
				type: 'section',
				title: categoryTitle(state),
				description: SHOP_CONFIG.tagline,
				children: [
					{
						type: 'buttonRow',
						buttons: allCategories(state).map((category) => ({
							label: category.label,
							variant: state.category === category.id ? 'primary' : 'secondary',
							action: stateAction(state, {
								category: category.id,
								view: 'products',
								page: 1,
								selectedProductId: (category.id === 'all' ? catalogProducts(state)[0] : productsByCategory(category.id, state)[0])?.id || state.selectedProductId
							})
						}))
					},
					...visibleProducts.map((product) => ({
						type: 'section',
						title: product.name,
						description: product.description || product.packLabel || product.vendor || SHOP_CONFIG.name,
						children: [
							{
								type: 'badgeGrid',
								items: [
									{ label: 'Vendor', value: product.vendor || SHOP_CONFIG.name, tone: 'muted' },
									{ label: 'Pack', value: product.packLabel || 'Standard pack', tone: 'muted' },
									{ label: 'Price', value: productPrice(state, product), tone: 'success' },
									...(product.digital ? [{ label: 'Delivery', value: 'Digital', tone: 'success' }] : [])
								]
							},
							{
								type: 'buttonRow',
								buttons: [
									{ label: 'View details', variant: 'secondary', action: productCardNode(state, product).action },
									{ label: 'Add to cart', variant: 'primary', action: productCardNode(state, product).addAction }
								]
							}
						]
					})),
					{
						type: 'buttonRow',
						align: 'between',
						buttons: [
							...(currentPage > 1 ? [{ label: 'Previous', variant: 'secondary', action: stateAction(state, { page: currentPage - 1 }) }] : []),
							...(currentPage < totalPages ? [{ label: 'Next', variant: 'secondary', action: stateAction(state, { page: currentPage + 1 }) }] : [])
						]
					},
					{ type: 'text', tone: 'muted', text: `Page ${currentPage} of ${totalPages}. ${products.length} product${products.length === 1 ? '' : 's'} available.` }
				]
			}
		]
	};
}

function renderProductDetail(state) {
	const product = selectedProduct(state);
	if (!product) return renderProducts(state);
	const related = catalogProducts(state)
		.filter((item) => item.id !== product.id && item.category === product.category)
		.concat(catalogProducts(state).filter((item) => item.id !== product.id && item.category !== product.category))
		.slice(0, 3);
	return {
		type: 'section',
		title: product.name,
		description: product.description,
		children: [
			{
				type: 'badgeGrid',
				items: [
					{ label: 'Vendor', value: product.vendor || SHOP_CONFIG.name, tone: 'muted' },
					{ label: 'Pack', value: product.packLabel || 'Standard pack', tone: 'muted' },
					{ label: 'Price', value: productPrice(state, product), tone: 'success' },
					{ label: 'Quantity', value: String(productQuantity(state, product.id)), tone: 'muted' }
				]
			},
			{
				type: 'buttonRow',
				buttons: [
					{ label: 'Back to products', variant: 'secondary', action: stateAction(state, { view: 'products', category: product.category }) },
					{ label: '-', variant: 'secondary', action: stateAction(decrementProductQuantity(state, product.id), {}) },
					{ label: '+', variant: 'secondary', action: stateAction(incrementProductQuantity(state, product.id), {}) },
					{ label: 'Add to cart', variant: 'primary', action: stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), {}, `${product.name} added to cart`) },
					{ label: 'Buy now', variant: 'primary', action: stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), { view: 'cart' }) }
				]
			},
			...(related.length
				? [
					{
						type: 'section',
						title: 'Related products',
						children: related.map((item) => ({
							type: 'button',
							label: item.name,
							variant: 'secondary',
							action: productCardNode(state, item).action
						}))
					}
				]
				: [])
		]
	};
}
