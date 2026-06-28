// @ts-nocheck
function categoryTitle(state) {
	if (state.category === 'all') return 'All';
	const category = categoryById(state.category, state);
	return category ? category.label : 'Products';
}

function productPrice(state, product) {
	return formatMoney(product.price, state.settings.currency);
}

function productOpenAction(state, product) {
	return stateAction(state, {
		view: 'product',
		category: product.category,
		selectedProductId: product.id,
		productQuantities: {
			...state.productQuantities,
			[product.id]: productQuantity(state, product.id)
		}
	});
}

function renderProductImage(state, product) {
	const image = productImageUrl(state, product);
	return image
		? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
		: `<div class="wm-empty-icon">${escapeHtml(product.icon || '•')}</div>`;
}

function productBadges(product) {
	return [
		product.badge ? `<span class="wm-badge">${escapeHtml(product.badge)}</span>` : '',
		product.digital === true ? '<span class="wm-badge wm-badge-digital">Digital</span>' : ''
	].filter(Boolean).join('');
}

function addToCartButton(actions, state, product, extraClass = 'wm-btn-primary') {
	const isAdded = state.lastAddedProductId === product.id;
	return `<button type="button" class="wm-btn ${extraClass} wm-product-add ${isAdded ? 'wm-is-added' : ''}" ${actionAttr(actions, stateAction(addToCart(state, product.id), {}, `${product.name} added to cart`))}>
		<span class="wm-add-default">Add to cart</span>
		<span class="wm-add-added">Added</span>
	</button>`;
}

function renderProducts(state) {
	const actions = {};
	const products = filteredProducts(state);
	const pageSize = Math.max(1, Number(SHOP_CONFIG.pageSize) || 8);
	const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
	const currentPage = Math.min(Math.max(1, state.page || 1), totalPages);
	const visibleProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	return pluginFrame(SHOP_CONFIG.name, `
		<div class="wm-shop wm-theme-${escapeHtml(state.theme)}">
			<div class="wm-shell wm-layout">
				<aside class="wm-sidebar">
					<button type="button" class="wm-brand" ${actionAttr(actions, stateAction(state, { view: 'products', category: 'all', page: 1 }))}>
						${shopLogoMarkup()}
						<span>${escapeHtml(SHOP_CONFIG.name)}</span>
					</button>
					<p class="wm-subtitle">${escapeHtml(SHOP_CONFIG.tagline || '')}</p>
					<nav class="wm-nav" aria-label="Shop categories">
						${allCategories(state).map((category) => `
							<button type="button" class="${state.category === category.id ? 'is-active' : ''}" ${actionAttr(actions, stateAction(state, {
								category: category.id,
								view: 'products',
								page: 1,
								selectedProductId: (category.id === 'all' ? catalogProducts(state)[0] : productsByCategory(category.id, state)[0])?.id || state.selectedProductId
							}))}>${escapeHtml(category.label)}</button>
						`).join('')}
						<button type="button" class="${state.view === 'contact' ? 'is-active' : ''}" ${actionAttr(actions, stateAction(state, { view: 'contact' }))}>Contact</button>
					</nav>
				</aside>
				<main class="wm-main">
					<div class="wm-main-head">
						<div>
							<p class="wm-kicker">Browse category</p>
							<h1 class="wm-title">${escapeHtml(categoryTitle(state))}</h1>
						</div>
						<div class="wm-actions">
							${renderThemeSwitcher(actions, state)}
							<button type="button" class="wm-chip" ${actionAttr(actions, stateAction(state, { view: 'contact' }))}>${icon('mail', 17)} <span>Contact</span></button>
							<button type="button" class="wm-chip" ${actionAttr(actions, stateAction(state, { view: 'cart' }))}>${icon('cart', 17)} <span>Cart ${cartCount(state)}</span></button>
							<button type="button" class="wm-icon-btn wm-user-btn" title="Back to bank" ${actionAttr(actions, bankNavigateAction())}>${coreIdenticon(state.coreId)}</button>
						</div>
					</div>
					<div class="wm-grid">
						${visibleProducts.map((product) => `
							<article class="wm-product">
								<button type="button" class="wm-product-card" ${actionAttr(actions, productOpenAction(state, product))}>
									<div class="wm-product-media">
										${renderProductImage(state, product)}
										${productBadges(product)}
									</div>
									<p class="wm-product-meta">${escapeHtml(product.vendor || SHOP_CONFIG.name)}</p>
									<h2 class="wm-product-name">${escapeHtml(product.name)}</h2>
									<p class="wm-product-pack">${escapeHtml(product.packLabel || 'Standard pack')}</p>
									<p class="wm-product-price">${escapeHtml(productPrice(state, product))}</p>
								</button>
								${addToCartButton(actions, state, product)}
							</article>
						`).join('')}
					</div>
					${totalPages > 1 ? `
						<div class="wm-inline-actions">
							${currentPage > 1 ? frameButton(actions, 'Previous', stateAction(state, { page: currentPage - 1 }), 'secondary') : ''}
							${currentPage < totalPages ? frameButton(actions, 'Next', stateAction(state, { page: currentPage + 1 }), 'secondary') : ''}
						</div>
					` : ''}
				</main>
			</div>
		</div>
	`, actions);
}

function renderProductDetail(state) {
	const product = selectedProduct(state);
	if (!product) return renderProducts(state);
	const actions = {};
	return pluginFrame(product.name, `
		<div class="wm-page wm-theme-${escapeHtml(state.theme)}">
			${renderShopHeader(actions, state)}
			<main class="wm-detail">
				<section>
					${frameButton(actions, 'Back to products', stateAction(state, { view: 'products', category: product.category }), 'secondary')}
					<div class="wm-detail-media" style="margin-top:1rem">${renderProductImage(state, product)}</div>
				</section>
				<section class="wm-detail-copy">
					<p class="wm-product-meta">${escapeHtml(product.vendor || SHOP_CONFIG.name)}</p>
					<h1 class="wm-title">${escapeHtml(product.name)}</h1>
					<p class="wm-detail-badges">${productBadges(product)}</p>
					<p class="wm-price">${escapeHtml(productPrice(state, product))}</p>
					<p class="wm-product-meta">Pack</p>
					<p><span class="wm-btn wm-btn-secondary">${escapeHtml(product.packLabel || 'Standard pack')}</span></p>
					<p class="wm-product-meta">Quantity</p>
					<div class="wm-qty">
						<button type="button" ${actionAttr(actions, stateAction(decrementProductQuantity(state, product.id), {}))}>${icon('minus', 15)}</button>
						<span>${productQuantity(state, product.id)}</span>
						<button type="button" ${actionAttr(actions, stateAction(incrementProductQuantity(state, product.id), {}))}>${icon('plus', 15)}</button>
					</div>
					<div class="wm-inline-actions">
						<button type="button" class="wm-btn wm-btn-secondary wm-product-add ${state.lastAddedProductId === product.id ? 'wm-is-added' : ''}" ${actionAttr(actions, stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), {}, `${product.name} added to cart`))}>
							<span class="wm-add-default">Add to cart</span>
							<span class="wm-add-added">Added</span>
						</button>
						${frameButton(actions, 'Buy now', stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), { view: 'cart' }))}
					</div>
					<div style="margin-top:2rem;border-top:1px solid rgba(148,163,184,.25);padding-top:1.5rem">
						<p class="wm-product-meta">Product description</p>
						<p style="line-height:1.8">${escapeHtml(product.description || '')}</p>
					</div>
				</section>
			</main>
		</div>
	`, actions);
}
