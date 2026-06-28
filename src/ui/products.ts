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
		lastAddedProductId: '',
		productQuantities: {
			...state.productQuantities,
			[product.id]: productQuantity(state, product.id)
		}
	});
}

function productQuestionSubjectIndex(state) {
	const subjects = state.settings && state.settings.contact && Array.isArray(state.settings.contact.subjects)
		? state.settings.contact.subjects
		: [];
	const index = subjects.findIndex((subject) => String(subject.label || '').toLowerCase().includes('product'));
	return String(index >= 0 ? index : 0);
}

function productShareUrl(product) {
	return shopUrl(product.id);
}

function productWasJustAdded(state, product) {
	return state.lastAddedProductId === product.id;
}

function productQuantityInput(actions, state, product) {
	const max = availableToAdd(state, product);
	const value = productQuantity(state, product.id);
	const actionId = addFrameAction(actions, stateAction(setProductQuantity(state, product.id, value)));
	return `<input class="${quantityInputClass()}" type="number" min="1" ${max === null ? '' : `max="${escapeHtml(max || 1)}"`} step="1" inputmode="numeric" value="${escapeHtml(value)}" aria-label="Quantity" data-plugin-storage-action="${escapeHtml(actionId)}" data-plugin-field="productQuantities.${escapeHtml(product.id)}" />`;
}

function renderProductImage(state, product) {
	const image = productImageUrl(state, product);
	return image
		? `<img class="${imageClass()}" src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
		: `<div class="${emptyIconClass()}">${escapeHtml(product.icon || '•')}</div>`;
}

function productBadges(product) {
	const badges = [
		product.badge ? `<span class="${productBadgeClass(0)}">${escapeHtml(product.badge)}</span>` : '',
		product.digital === true ? `<span class="${productBadgeClass(1)}">Digital</span>` : ''
	].filter(Boolean).join('');
	return badges;
}

function productDetailBadges(product) {
	return [
		product.badge ? `<span class="${detailBadgeClass(false)}">${escapeHtml(product.badge)}</span>` : '',
		product.digital === true ? `<span class="${detailBadgeClass(true)}">Digital</span>` : ''
	].filter(Boolean).join('');
}

function addButtonClass(isAdded, extraClass = '') {
	return buttonClass('primary', `relative w-full overflow-hidden ${isAdded ? '!bg-emerald-600 !text-white' : ''} ${extraClass}`);
}

function addToCartButton(actions, state, product, extraClass = '') {
	const isAdded = productWasJustAdded(state, product);
	return `<button type="button" class="${addButtonClass(isAdded, extraClass)}" ${actionAttr(actions, stateAction(addToCart(state, product.id), {}, `${product.name} added to cart`, { resetMs: 1200, resetIf: { lastAddedProductId: product.id }, resetPatch: { lastAddedProductId: '' } }))}>
		<span>${isAdded ? 'Added' : 'Add to cart'}</span>
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
		<div class="${shopClass(state)}">
			<div class="${shellClass()} flex h-[max(100vh,100dvh,100svh,820px)] min-h-[max(100vh,100dvh,100svh,820px)] overflow-hidden max-[900px]:block max-[900px]:h-auto max-[900px]:overflow-visible">
				<aside class="h-full w-60 shrink-0 overflow-y-auto overscroll-contain border-r p-5 max-[900px]:h-auto max-[900px]:w-auto max-[900px]:border-b max-[900px]:border-r-0 ${themeClasses(state, 'border-stone-200 bg-stone-50/95', 'border-slate-800 bg-slate-900/95')}">
					<button type="button" class="inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent text-2xl font-semibold tracking-normal text-inherit" ${actionAttr(actions, shopNavigateAction())}>
						${shopLogoMarkup()}
						<span>${escapeHtml(SHOP_CONFIG.name)}</span>
					</button>
					<p class="mt-2 text-sm font-medium leading-6 ${mutedClass(state)}">${escapeHtml(SHOP_CONFIG.tagline || '')}</p>
					<nav class="mt-6 flex flex-col gap-2 max-[900px]:flex-row max-[900px]:overflow-x-auto" aria-label="Shop categories">
						${allCategories(state).map((category) => `
							<button type="button" class="cursor-pointer rounded-2xl px-4 py-3 text-left font-semibold ${state.category === category.id ? themeClasses(state, 'bg-white text-stone-950 shadow-[0_18px_40px_rgba(28,25,23,.12)]', 'bg-slate-50 text-slate-950') : mutedClass(state)}" ${actionAttr(actions, stateAction(state, {
								category: category.id,
								view: 'products',
								page: 1,
								selectedProductId: (category.id === 'all' ? catalogProducts(state)[0] : productsByCategory(category.id, state)[0])?.id || state.selectedProductId
							}))}>${escapeHtml(category.label)}</button>
						`).join('')}
					</nav>
				</aside>
				<main class="h-full min-w-0 flex-1 overflow-y-auto overscroll-contain px-10 py-6 max-[900px]:h-auto max-[900px]:overflow-visible max-[900px]:p-5">
					<div class="flex items-end justify-between gap-4 border-b pb-6 max-[900px]:flex-col max-[900px]:items-start ${themeClasses(state, 'border-stone-200', 'border-slate-800')}">
						<div>
							<p class="${kickerClass(state)}">Browse category</p>
							<h1 class="${titleClass()}">${escapeHtml(categoryTitle(state))}</h1>
						</div>
						<div class="flex items-center gap-3">
							${renderThemeSwitcher(actions, state)}
							<button type="button" class="${chipClass(state)}" ${actionAttr(actions, shopNavigateAction('contact'))}>${icon('mail', 17)} <span>Contact</span></button>
							<button type="button" class="${chipClass(state)}" ${actionAttr(actions, shopNavigateAction('cart'))}>${icon('cart', 17)} <span>Cart ${cartCount(state)}</span></button>
							<button type="button" class="${iconButtonClass(state, 'overflow-hidden')}" title="Back to bank" ${actionAttr(actions, bankNavigateAction())}>${coreIdenticon(state.coreId)}</button>
						</div>
					</div>
					<div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
						${visibleProducts.map((product) => `
							<article class="text-left">
								<button type="button" class="block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-inherit transition hover:-translate-y-1" ${actionAttr(actions, shopNavigateAction(product.id))}>
									<div class="${mediaBoxClass(state, 'rounded-[1.75rem] transition hover:border-violet-600 hover:shadow-[0_18px_44px_rgba(15,23,42,.2)]')}">
										${renderProductImage(state, product)}
										${productBadges(product)}
									</div>
									<h2 class="${productNameClass()}">${escapeHtml(product.name)}</h2>
									${product.packLabel ? `<p class="${productPackClass(state)}">${escapeHtml(product.packLabel)}</p>` : ''}
									<p class="${productPriceClass()}">${escapeHtml(productPrice(state, product))}</p>
								</button>
								${addToCartButton(actions, state, product, 'mt-3')}
							</article>
						`).join('')}
					</div>
					${totalPages > 1 ? `
						<div class="${inlineActionsClass()}">
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
	const packLabel = String(product.packLabel || '').trim();
	const isAdded = productWasJustAdded(state, product);
	return pluginFrame(product.name, `
		<div class="${pageClass(state)}">
			${renderShopHeader(actions, state)}
			<main class="mx-auto grid max-w-7xl grid-cols-[minmax(0,1.05fr)_minmax(24rem,.95fr)] gap-8 p-6 max-[900px]:block max-[900px]:p-5">
				<section>
					${frameButton(actions, 'Back to products', shopNavigateAction(), 'secondary')}
					<div class="${mediaBoxClass(state, 'mt-4 rounded-[2.25rem]')}">${renderProductImage(state, product)}</div>
				</section>
				<section class="pt-12 max-[900px]:mt-6 max-[900px]:pt-0">
					<button type="button" class="inline-flex cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-inherit hover:underline" ${actionAttr(actions, stateAction(state, { view: 'products', category: product.category, page: 1, lastAddedProductId: '' }))}>${escapeHtml(product.vendor || SHOP_CONFIG.name)}</button>
					<h1 class="${titleClass()}">${escapeHtml(product.name)}</h1>
					<p class="mt-4 flex flex-wrap gap-2">${productDetailBadges(product)}</p>
					<p class="my-8 text-3xl font-semibold">${escapeHtml(productPrice(state, product))}</p>
					${packLabel ? `
						<div class="mb-4">
							<p class="mb-2 text-sm font-semibold ${mutedClass(state)}">Pack</p>
							<p class="m-0 text-base font-medium">${escapeHtml(packLabel)}</p>
						</div>
					` : ''}
					<div class="mb-4">
						<p class="mb-2 text-sm font-semibold ${mutedClass(state)}">Quantity</p>
						<div class="${quantityClass(state)}">
							<button type="button" class="${quantityButtonClass()}" ${actionAttr(actions, stateAction(decrementProductQuantity(state, product.id), {}))}>${icon('minus', 15)}</button>
							${productQuantityInput(actions, state, product)}
							<button type="button" class="${quantityButtonClass()}" ${actionAttr(actions, stateAction(incrementProductQuantity(state, product.id), {}))}>${icon('plus', 15)}</button>
						</div>
					</div>
					<div class="${inlineActionsClass()}">
						<button type="button" class="${buttonClass('secondary', `relative min-w-[7rem] overflow-hidden ${isAdded ? '!border-emerald-600 !bg-emerald-600 !text-white' : ''}`)}" ${actionAttr(actions, stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), {}, `${product.name} added to cart`, { resetMs: 1200, resetIf: { lastAddedProductId: product.id }, resetPatch: { lastAddedProductId: '' } }))}>
							<span>${isAdded ? 'Added' : 'Add to cart'}</span>
						</button>
						${frameButton(actions, 'Buy now', stateAction(addQuantityToCart(state, product.id, productQuantity(state, product.id)), { view: 'cart' }))}
					</div>
					<div class="mt-8 border-t border-slate-500/25 pt-6">
						${product.skuid ? `
							<div class="mb-4 flex flex-wrap items-center gap-3 max-[900px]:flex-col max-[900px]:items-start">
								<span class="text-xs font-normal tracking-normal ${mutedClass(state)}">SKU:</span>
								<button type="button" class="cursor-pointer border-0 bg-transparent p-0 text-xs font-normal tracking-normal ${mutedClass(state)} hover:underline" title="Copy SKU" ${actionAttr(actions, { type: 'copy', text: product.skuid, message: 'SKU copied.' })}>${escapeHtml(product.skuid)}</button>
								<button type="button" class="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-normal tracking-normal ${mutedClass(state)} hover:underline" ${actionAttr(actions, stateAction(state, {
									view: 'contact',
									contactSku: product.skuid,
									contactSubjectIndex: productQuestionSubjectIndex(state),
									lastAddedProductId: ''
								}))}>${icon('messageCircleQuestionMark', 15)} Ask about this product</button>
								<button type="button" class="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-normal tracking-normal ${mutedClass(state)} hover:underline" ${actionAttr(actions, {
									type: 'share',
									text: product.name,
									url: productShareUrl(product)
								})}>${icon('share2', 15)} Share this product</button>
							</div>
						` : `
							<div class="mb-4 flex flex-wrap items-center gap-3 max-[900px]:flex-col max-[900px]:items-start">
								<button type="button" class="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-normal tracking-normal ${mutedClass(state)} hover:underline" ${actionAttr(actions, {
									type: 'share',
									text: product.name,
									url: productShareUrl(product)
								})}>${icon('share2', 15)} Share this product</button>
							</div>
						`}
						<p class="${productMetaClass(state)}">Product description</p>
						<p class="leading-8">${escapeHtml(product.description || '')}</p>
					</div>
				</section>
			</main>
		</div>
	`, actions);
}
