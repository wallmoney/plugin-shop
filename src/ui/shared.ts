// @ts-nocheck
function shopLogoUrl() {
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	if (SHOP_CONFIG.logoSrc && /^https?:\/\//i.test(SHOP_CONFIG.logoSrc)) return SHOP_CONFIG.logoSrc;
	if (SHOP_CONFIG.logoUrl && /^https?:\/\//i.test(SHOP_CONFIG.logoUrl)) return SHOP_CONFIG.logoUrl;
	return (SHOP_CONFIG.logoSrc || SHOP_CONFIG.logoUrl) && context && typeof context.iconUrl === 'string' ? context.iconUrl : '';
}

function shopLogoMarkup() {
	const logo = shopLogoUrl();
	return logo ? `<img class="h-9 w-9 rounded-xl object-cover" src="${escapeHtml(logo)}" alt="" />` : '';
}

function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function addFrameAction(actions, action) {
	const id = `action-${Object.keys(actions).length + 1}`;
	actions[id] = action;
	return id;
}

function actionAttr(actions, action) {
	return `data-plugin-action="${addFrameAction(actions, action)}"`;
}

function bankNavigateAction() {
	return { type: 'navigate', href: '/', target: '_self', sameWindow: true };
}

function kebabizePathSegment(value) {
	return String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function shopUrl(path = '') {
	const cleanPath = kebabizePathSegment(path);
	return `/marketplace/wallmoney/plugin-shop${cleanPath ? `/${encodeURIComponent(cleanPath)}` : ''}`;
}

function shopNavigateAction(path = '') {
	return { type: 'navigate', href: shopUrl(path) };
}

function frameButton(actions, label, action, variant = 'primary', extraClass = '') {
	return `<button type="button" class="${buttonClass(variant, extraClass)}" ${actionAttr(actions, action)}>${escapeHtml(label)}</button>`;
}

function prefixClasses(prefix, classes) {
	return String(classes || '')
		.split(/\s+/)
		.filter(Boolean)
		.map((item) => `${prefix}:${item}`)
		.join(' ');
}

function themeClasses(state, lightClasses, darkClasses) {
	if (state && state.theme === 'light') return lightClasses;
	return darkClasses;
}

function shellClass() {
	return 'mx-auto max-w-[1680px]';
}

function pageClass(state) {
	return `block min-h-[max(100vh,100dvh,100svh,820px)] p-5 ${themeClasses(state, 'bg-stone-100 text-stone-950', 'bg-slate-950 text-slate-50')}`;
}

function shopClass(state) {
	return `min-h-[max(100vh,100dvh,100svh,820px)] ${themeClasses(state, 'bg-stone-100 text-stone-950', 'bg-slate-950 text-slate-50')}`;
}

function cardClass(state, extra = '') {
	return `${themeClasses(state, 'border-stone-200 bg-white text-stone-950 shadow-[0_18px_50px_rgba(28,25,23,.08)]', 'border-slate-700 bg-slate-900 text-slate-50 shadow-none')} rounded-[2rem] border p-5 ${extra}`;
}

function mutedClass(state, extra = '') {
	return `${themeClasses(state, 'text-stone-500', 'text-slate-300')} ${extra}`;
}

function titleClass(extra = '') {
	return `m-0 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-none tracking-normal ${extra}`;
}

function kickerClass(state) {
	return `m-0 text-sm font-medium ${mutedClass(state)}`;
}

function inputClass(state, extra = '') {
	return `w-full rounded-2xl border px-4 py-3 font-normal ${themeClasses(state, 'border-stone-300 bg-stone-50 text-stone-950 placeholder:text-stone-400', 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-500')} ${extra}`;
}

function fieldLabelClass(state) {
	return `mb-1.5 flex items-center gap-1 text-sm font-semibold ${themeClasses(state, 'text-stone-500', 'text-slate-400')}`;
}

function warningClass(state) {
	return `mt-4 rounded-2xl border p-3 font-semibold ${themeClasses(state, 'border-amber-300/70 bg-amber-100 text-amber-950', 'border-amber-500/40 bg-amber-500/15 text-amber-200')}`;
}

function buttonClass(variant = 'primary', extraClass = '') {
	const base = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-normal transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0';
	const variants = {
		primary: 'border-0 bg-violet-700 text-white',
		secondary: 'border border-slate-500/40 bg-transparent text-inherit',
		ghost: 'border-0 bg-transparent text-inherit',
		link: 'min-h-0 rounded-md border-0 bg-transparent px-1.5 py-1 text-sm text-slate-400 hover:text-slate-200'
	};
	return `${base} ${variants[variant] || variants.primary} ${extraClass}`.trim();
}

function iconButtonClass(state, extra = '') {
	return `inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border p-0 ${themeClasses(state, 'border-stone-300 bg-white text-stone-800 shadow-[0_10px_30px_rgba(28,25,23,.08)]', 'border-slate-700 bg-slate-900 text-slate-50 shadow-none')} ${extra}`;
}

function chipClass(state, extra = '') {
	return `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${themeClasses(state, 'border-stone-300 bg-white text-stone-800 shadow-[0_10px_30px_rgba(28,25,23,.08)]', 'border-slate-700 bg-slate-900 text-slate-50 shadow-none')} ${extra}`;
}

function summaryLineClass() {
	return 'mt-3 flex justify-between gap-4';
}

function inlineActionsClass(extra = '') {
	return `mt-4 flex flex-wrap gap-3 ${extra}`;
}

function quantityClass(state, extra = '') {
	return `inline-flex items-center overflow-hidden rounded-full border ${themeClasses(state, 'border-stone-300 bg-stone-100 text-stone-950', 'border-slate-700 bg-slate-800/70 text-slate-50')} ${extra}`;
}

function quantityButtonClass() {
	return 'inline-flex cursor-pointer items-center justify-center px-3 py-2 text-inherit hover:bg-violet-600/20';
}

function productMetaClass(state, extra = '') {
	return `mt-3 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium ${mutedClass(state)} ${extra}`;
}

function productNameClass(extra = '') {
	return `mt-1 min-h-10 text-base font-semibold leading-tight ${extra}`;
}

function productPackClass(state) {
	return `mt-2 text-sm font-medium ${mutedClass(state)}`;
}

function productPriceClass(extra = '') {
	return `mt-2 font-semibold ${extra}`;
}

function mediaBoxClass(state, extra = '') {
	return `relative aspect-square overflow-hidden border ${themeClasses(state, 'border-stone-300/70 bg-white shadow-[0_8px_30px_rgba(28,25,23,.08)]', 'border-slate-700 bg-slate-800 shadow-none')} ${extra}`;
}

function imageClass() {
	return 'block h-full w-full object-cover';
}

function emptyIconClass() {
	return 'flex h-full w-full items-center justify-center text-5xl';
}

function badgeClass(extra = '') {
	return `inline-flex rounded-full px-3 py-1 text-xs font-normal backdrop-blur ${extra}`;
}

function productBadgeClass(index = 0) {
	return badgeClass(`absolute left-3 ${index ? 'top-12 bg-green-200/50 text-green-950' : 'top-3 bg-white/50 text-stone-950'}`);
}

function detailBadgeClass(digital = false) {
	return badgeClass(digital ? 'bg-green-200/50 text-green-950' : 'bg-white/50 text-stone-950');
}

function icon(name, size = 18) {
	const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
	const paths = {
		arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
		cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
		building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		externalLink: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
		mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
		messageCircleQuestionMark: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>',
		monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
		moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
		phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L9 10.5a16 16 0 0 0 4.5 4.5l1.17-1.17a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92Z"/>',
		share2: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
		plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
		minus: '<path d="M5 12h14"/>',
		sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
		trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
		x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
	};
	return `<svg class="inline-block shrink-0" ${attrs}>${paths[name] || paths.cart}</svg>`;
}

function compactCoreId(value) {
	return String(value || '')
		.toUpperCase()
		.replace(/\s+/g, '')
		.replace(/(.{4})/g, '$1 ')
		.trim();
}

function coreIdenticon(coreId) {
	const value = String(coreId || SHOP_CONFIG.name || 'wallmoney-shop').toLowerCase();
	const seed = new Array(4).fill(0);
	for (let index = 0; index < value.length; index += 1) {
		seed[index % 4] = (seed[index % 4] << 5) - seed[index % 4] + value.charCodeAt(index);
	}
	const random = () => {
		const next = seed[0] ^ seed[0] << 11;
		seed[0] = seed[1];
		seed[1] = seed[2];
		seed[2] = seed[3];
		seed[3] = seed[3] ^ seed[3] >> 19 ^ next ^ next >> 8;
		return (seed[3] >>> 0) / 2147483648;
	};
	const color = () => `hsl(${Math.floor(random() * 360)},${Math.floor(40 + random() * 60)}%,${Math.floor((random() + random() + random() + random()) * 25)}%)`;
	const primary = color();
	const background = color();
	const accent = color();
	const cells = [];
	for (let index = 0; index < 32; index += 1) {
		const column = index % 4;
		const row = index / 4 | 0;
		const fill = Math.floor(random() * 2.3);
		if (!fill) continue;
		cells.push([column, row, fill], [7 - column, row, fill]);
	}
	return `<svg class="h-full w-full rounded-full" viewBox="0 0 64 64" role="img" aria-label="Core ID identicon">
		<rect width="64" height="64" rx="16" fill="${background}" />
		${cells.map(([x, y, fill]) => `<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="${fill === 1 ? primary : accent}" />`).join('')}
	</svg>`;
}

function renderThemeSwitcher(actions, state) {
	const options = [
		{ id: 'auto', label: 'Auto', icon: 'monitor' },
		{ id: 'light', label: 'Light', icon: 'sun' },
		{ id: 'dark', label: 'Dark', icon: 'moon' }
	];
	return `<div class="inline-flex items-center gap-0.5 rounded-full border border-slate-500/40 bg-slate-500/10 p-1" role="group" aria-label="Theme">
		${options.map((option) => `<button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-inherit opacity-65 ${state.theme === option.id ? 'bg-white/15 opacity-100' : ''}" title="${escapeHtml(option.label)}" ${actionAttr(actions, stateAction(state, { theme: option.id }))}>${icon(option.icon, 16)}</button>`).join('')}
	</div>`;
}

function renderShopHeader(actions, state, options = {}) {
	const title = escapeHtml(SHOP_CONFIG.name);
	const backAction = options.backAction || shopNavigateAction();
	return `<header class="${shellClass()} flex items-center justify-between gap-4 px-6 py-5">
		<button type="button" class="inline-flex items-center gap-3 border-0 bg-transparent text-2xl font-semibold tracking-normal text-inherit" ${actionAttr(actions, shopNavigateAction())}>
			${shopLogoMarkup()}
			<span>${title}</span>
		</button>
		<div class="flex items-center gap-3">
			${renderThemeSwitcher(actions, state)}
			<button type="button" class="${chipClass(state)}" ${actionAttr(actions, shopNavigateAction('contact'))}>${icon('mail', 17)} <span>Contact</span></button>
			<button type="button" class="${chipClass(state)}" ${actionAttr(actions, shopNavigateAction('cart'))}>${icon('cart', 17)} <span>Cart ${cartCount(state)}</span></button>
			<button type="button" class="${iconButtonClass(state, 'overflow-hidden')}" title="Back to bank" ${actionAttr(actions, bankNavigateAction())}>${coreIdenticon(state.coreId)}</button>
			${options.showBack ? `<button type="button" class="${iconButtonClass(state)}" title="Back" ${actionAttr(actions, backAction)}>${icon('arrowLeft', 18)}</button>` : ''}
		</div>
	</header>`;
}

function pluginFrame(title, body, actions, options = {}) {
	const minHeight = options.minHeight || 820;
	return {
		type: 'pluginFrame',
		title,
		minHeight,
		actions,
		html: `<style>
			/*__WM_TAILWIND_CSS__*/
		</style>${body}`
	};
}

function renderView(state) {
	if (usesRemoteCatalog(state) && state.catalogStatus === 'loading') {
		return {
			type: 'section',
			title: 'Loading catalog',
			description: `Fetching product JSON from ${catalogUrl(state)}.`,
			children: [
				{ type: 'text', tone: 'muted', text: catalogProvider(state) === 'd1' ? 'Loading categories and products from the configured D1 catalog Worker.' : 'IPFS/IPNS gateways can take a moment to resolve new content.' }
			]
		};
	}
	if (usesRemoteCatalog(state) && state.catalogStatus === 'error') {
		return {
			type: 'section',
			title: 'Catalog unavailable',
			description: state.catalogError || 'The remote catalog could not be loaded.',
			children: [
				{ type: 'text', tone: 'muted', text: catalogUrl(state) },
				{
					type: 'buttonRow',
					buttons: [
						{
							label: 'Retry',
							variant: 'primary',
							action: stateAction(state, {
								catalog: null,
								catalogStatus: 'idle',
								catalogError: '',
								catalogSource: '',
								page: 1
							})
						},
						{ label: 'Use local catalog', variant: 'secondary', action: stateAction(state, { settings: { ...state.settings, catalogProvider: 'local', catalogRef: SHOP_CONFIG.defaultCatalogRef }, catalogStatus: 'idle', catalogError: '', catalogSource: '', catalog: null }) }
					]
				}
			]
		};
	}
	if (state.view === 'product') return renderProductDetail(state);
	if (state.view === 'cart') return renderCart(state);
	if (state.view === 'checkout') return renderCheckout(state);
	if (state.view === 'success') return renderSuccess(state);
	if (state.view === 'failed') return renderPaymentFailed(state);
	if (state.view === 'contact') return renderContactPage(state);
	if (state.view === 'orders') return renderOrders(state);
	return renderProducts(state);
}
