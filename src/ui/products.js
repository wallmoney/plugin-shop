function renderCategoryFilters(state) {
	return {
		type: 'choiceGroup',
		columns: 'five',
		options: SHOP_CATEGORIES.map((category) => ({
			label: category.label,
			icon: category.icon,
			selected: state.category === category.id,
			helper: category.helper,
			action: stateAction(state, { category: category.id, view: 'products' })
		}))
	};
}

function renderProductCard(state, product) {
	const category = productCategory(product);
	return {
		type: 'section',
		title: `${product.icon} ${product.name}`,
		description: product.description,
		children: [
			{
				type: 'badgeGrid',
				items: [
					{ label: 'Category', value: category.label, tone: 'muted' },
					{ label: 'Price', value: formatMoney(product.price, state.settings.currency), tone: 'success' },
					{ label: 'Stock', value: `${product.stock} available`, tone: product.stock > 0 ? 'success' : 'danger' }
				]
			},
			{
				type: 'list',
				items: [
					{ label: 'IPFS CID', value: product.cid },
					{ label: 'In cart', value: `${state.cart[product.id] || 0}` }
				]
			},
			{
				type: 'buttonRow',
				buttons: [
					{ label: 'Add to cart', variant: 'primary', action: stateAction(addToCart(state, product.id), {}, `${product.name} added to cart`) },
					{ label: 'Open metadata', variant: 'secondary', action: { type: 'navigate', href: productUrl(state, product) } }
				]
			}
		]
	};
}

function renderProducts(state) {
	const products = filteredProducts(state);
	return {
		type: 'stack',
		gap: 'lg',
		children: [
			{
				type: 'section',
				title: 'Products overview',
				description: 'Category browsing, searchable listings, IPFS references, and local cart state — all inside the portal plugin UI.',
				children: [
					renderCategoryFilters(state),
					{
						type: 'search',
						label: 'Search products',
						value: state.query,
						placeholder: 'Coffee, home, CID…',
						buttonLabel: 'Search',
						field: 'query',
						action: stateAction(state, { view: 'products' })
					}
				]
			},
			{
				type: 'section',
				title: `${products.length} product${products.length === 1 ? '' : 's'}`,
				description: 'Each card behaves like a marketplace listing and can open immutable IPFS metadata through the configured gateway.',
				children: products.length
					? products.map((product) => renderProductCard(state, product))
					: [
						{
							type: 'text',
							text: 'No products match this filter yet. Try All categories or clear the search query.',
							tone: 'warning'
						}
					]
			}
		]
	};
}
