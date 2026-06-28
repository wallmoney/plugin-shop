// @ts-nocheck
function shopLogoUrl() {
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	if (SHOP_CONFIG.logoSrc && /^https?:\/\//i.test(SHOP_CONFIG.logoSrc)) return SHOP_CONFIG.logoSrc;
	if (SHOP_CONFIG.logoUrl && /^https?:\/\//i.test(SHOP_CONFIG.logoUrl)) return SHOP_CONFIG.logoUrl;
	return (SHOP_CONFIG.logoSrc || SHOP_CONFIG.logoUrl) && context && typeof context.iconUrl === 'string' ? context.iconUrl : '';
}

function shopLogoMarkup() {
	const logo = shopLogoUrl();
	return logo ? `<img class="wm-logo" src="${escapeHtml(logo)}" alt="" />` : '';
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

function frameButton(actions, label, action, variant = 'primary', extraClass = '') {
	return `<button type="button" class="wm-btn wm-btn-${variant} ${extraClass}" ${actionAttr(actions, action)}>${escapeHtml(label)}</button>`;
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
		monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
		moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
		phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L9 10.5a16 16 0 0 0 4.5 4.5l1.17-1.17a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92Z"/>',
		plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
		minus: '<path d="M5 12h14"/>',
		sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
		trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
		x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
	};
	return `<svg class="wm-svg" ${attrs}>${paths[name] || paths.cart}</svg>`;
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
	return `<svg class="wm-identicon" viewBox="0 0 64 64" role="img" aria-label="Core ID identicon">
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
	return `<div class="wm-theme-switch" role="group" aria-label="Theme">
		${options.map((option) => `<button type="button" class="${state.theme === option.id ? 'is-active' : ''}" title="${escapeHtml(option.label)}" ${actionAttr(actions, stateAction(state, { theme: option.id }))}>${icon(option.icon, 16)}</button>`).join('')}
	</div>`;
}

function renderShopHeader(actions, state, options = {}) {
	const title = escapeHtml(SHOP_CONFIG.name);
	const backAction = options.backAction || stateAction(state, { view: 'products', category: 'all', page: 1 });
	return `<header class="wm-header wm-shell">
		<button type="button" class="wm-brand" ${actionAttr(actions, stateAction(state, { view: 'products', category: 'all', page: 1 }))}>
			${shopLogoMarkup()}
			<span>${title}</span>
		</button>
		<div class="wm-actions">
			${renderThemeSwitcher(actions, state)}
			<button type="button" class="wm-chip" ${actionAttr(actions, stateAction(state, { view: 'contact' }))}>${icon('mail', 17)} <span>Contact</span></button>
			<button type="button" class="wm-chip" ${actionAttr(actions, stateAction(state, { view: 'cart' }))}>${icon('cart', 17)} <span>Cart ${cartCount(state)}</span></button>
			<button type="button" class="wm-icon-btn wm-user-btn" title="Back to bank" ${actionAttr(actions, bankNavigateAction())}>${coreIdenticon(state.coreId)}</button>
			${options.showBack ? `<button type="button" class="wm-icon-btn" title="Back" ${actionAttr(actions, backAction)}>${icon('arrowLeft', 18)}</button>` : ''}
		</div>
	</header>`;
}

function pluginFrame(title, body, actions, options = {}) {
	return {
		type: 'pluginFrame',
		title,
		minHeight: options.minHeight || 1200,
		actions,
		html: `<style>
			:root{color-scheme:dark light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
			*{box-sizing:border-box}html,body{margin:0;width:100%;min-width:100%;min-height:100%;background:#f6f4ee;color:#0c0a09}html{height:100%}body{overflow-x:hidden;min-height:100vh;min-height:100dvh}button,input,select{font:inherit}button,a[href],select{cursor:pointer}button:disabled{cursor:not-allowed}
			.wm-shop{min-height:100vh;min-height:100dvh;background:#f6f4ee;color:#0c0a09}.wm-shell{max-width:1680px;margin:0 auto}.wm-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.25rem 1.5rem}.wm-brand{display:inline-flex;align-items:center;gap:.65rem;border:0;background:transparent;color:inherit;font-size:1.5rem;font-weight:900;letter-spacing:-.03em;cursor:pointer}.wm-logo{width:2rem;height:2rem;border-radius:.75rem;object-fit:cover}.wm-actions{display:flex;align-items:center;gap:.75rem}.wm-icon-btn,.wm-chip{border:1px solid rgba(120,113,108,.25);background:#fff;color:#292524;border-radius:999px;box-shadow:0 10px 30px rgba(28,25,23,.08);font-weight:800}.wm-chip{padding:.6rem 1rem}.wm-layout{display:flex;min-height:100vh;min-height:100dvh}.wm-sidebar{width:15rem;flex:0 0 15rem;border-right:1px solid #e7e5e4;background:rgba(251,250,247,.96);padding:1.25rem}.wm-subtitle{margin:.5rem 0 0;color:#57534e;font-size:.9rem;font-weight:650;line-height:1.55}.wm-nav{display:flex;flex-direction:column;gap:.5rem;margin-top:1.5rem}.wm-nav button{border:0;border-radius:1rem;background:transparent;color:#57534e;text-align:left;padding:.85rem 1rem;font-weight:900;cursor:pointer}.wm-nav button.is-active{background:#fff;color:#0c0a09;box-shadow:0 18px 40px rgba(28,25,23,.12)}.wm-main{min-width:0;flex:1;padding:1.5rem 2.5rem}.wm-main-head{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;border-bottom:1px solid #e7e5e4;padding-bottom:1.5rem}.wm-kicker{margin:0;color:#78716c;font-size:.9rem;font-weight:750}.wm-title{margin:.25rem 0 0;font-size:clamp(2rem,4vw,3.5rem);line-height:.95;font-weight:950;letter-spacing:-.045em}.wm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem 1rem;margin-top:2rem}.wm-product{text-align:left}.wm-product-media{position:relative;aspect-ratio:1;overflow:hidden;border-radius:1.75rem;background:#fff;box-shadow:0 8px 30px rgba(28,25,23,.08);border:1px solid rgba(214,211,209,.7)}.wm-product-media img{width:100%;height:100%;object-fit:cover;display:block}.wm-empty-icon{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:3rem}.wm-badge{position:absolute;left:.75rem;top:.75rem;border-radius:999px;background:rgba(255,255,255,.82);color:#1c1917;padding:.3rem .75rem;font-size:.75rem;font-weight:400;backdrop-filter:blur(8px)}.wm-badge-digital{top:2.75rem;background:rgba(187,247,208,.82);color:#14532d}.wm-product button.wm-product-open{display:block;width:100%;border:0;background:transparent;text-align:left;color:inherit;cursor:pointer}.wm-product-meta{margin:.75rem 0 0;color:#78716c;font-size:.85rem;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wm-product-name{margin:.25rem 0 0;min-height:2.5rem;font-size:1rem;line-height:1.25;font-weight:950}.wm-product-pack,.wm-product-price{margin:.3rem 0 0}.wm-product-pack{color:#78716c;font-size:.85rem;font-weight:750}.wm-product-price{font-weight:950}.wm-btn{min-height:2.65rem;border-radius:999px;padding:.65rem 1rem;border:0;font-size:.9rem;font-weight:950;cursor:pointer;transition:transform .15s ease,background .15s ease}.wm-btn:hover{transform:translateY(-1px)}.wm-btn-primary{background:#6d28d9;color:#fff}.wm-btn-secondary{background:#fff;color:#292524;border:1px solid #d6d3d1}.wm-btn-ghost{background:transparent;color:#57534e}.wm-product>.wm-btn{width:100%;margin-top:.75rem}.wm-page{min-height:100vh;min-height:100dvh;background:#f6f4ee;padding:1.25rem}.wm-card{background:#fff;border:1px solid #e7e5e4;border-radius:2rem;box-shadow:0 18px 50px rgba(28,25,23,.08);padding:1.25rem}.wm-cart{max-width:48rem;margin:2.5rem auto 0}.wm-row{display:grid;grid-template-columns:7rem minmax(0,1fr) auto;gap:1rem;margin-top:1.25rem}.wm-row-media{aspect-ratio:1;overflow:hidden;border-radius:1.5rem;background:#f5f5f4}.wm-row-media img{width:100%;height:100%;object-fit:cover}.wm-muted{color:#78716c}.wm-total{display:flex;justify-content:space-between;gap:1rem;border-top:1px solid #e7e5e4;margin-top:2rem;padding-top:1.25rem;font-size:1.1rem;font-weight:950}.wm-inline-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem}.wm-qty{display:inline-flex;align-items:center;border:1px solid #d6d3d1;border-radius:999px;background:#fff}.wm-qty button{border:0;background:transparent;padding:.45rem .75rem;font-weight:950;cursor:pointer}.wm-qty span{min-width:2rem;text-align:center;font-weight:900}.wm-detail{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(24rem,.95fr);gap:2rem;max-width:80rem;margin:0 auto;padding:1.5rem}.wm-detail-media{overflow:hidden;border-radius:2.25rem;background:#fff;box-shadow:0 8px 30px rgba(28,25,23,.08);border:1px solid #e7e5e4}.wm-detail-media img{width:100%;aspect-ratio:1;object-fit:cover;display:block}.wm-detail-copy{padding-top:3rem}.wm-price{font-size:2rem;font-weight:950}.wm-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1.5rem}.wm-input{width:100%;border:1px solid #d6d3d1;background:#fafaf9;border-radius:1rem;padding:.85rem 1rem;font-weight:400;color:#0c0a09}.wm-span-2{grid-column:span 2}.wm-checkout{display:grid;grid-template-columns:minmax(0,1fr) 24rem;gap:1.5rem;max-width:72rem;margin:2.5rem auto 0}.wm-summary-line{display:flex;justify-content:space-between;gap:1rem;margin-top:.75rem}.wm-warning{border:1px solid rgba(245,158,11,.35);background:#fef3c7;color:#78350f;border-radius:1rem;padding:.75rem;margin-top:1rem;font-weight:850}.wm-success{text-align:center;max-width:48rem;margin:4rem auto 0}.wm-success-mark{display:flex;align-items:center;justify-content:center;width:3.5rem;height:3.5rem;margin:0 auto;border-radius:999px;background:#dcfce7;color:#166534;font-size:2rem;font-weight:950}
			@media (min-width:640px){.wm-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width:1280px){.wm-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (min-width:1536px){.wm-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
			@media (prefers-color-scheme:dark){html,body,.wm-shop,.wm-page{background:#020617;color:#f8fafc}.wm-sidebar{background:rgba(15,23,42,.96);border-right-color:#1e293b}.wm-subtitle,.wm-kicker,.wm-product-meta,.wm-product-pack,.wm-muted{color:#cbd5e1}.wm-main-head,.wm-total{border-color:#1e293b}.wm-nav button{color:#cbd5e1}.wm-nav button.is-active{background:#f8fafc;color:#020617}.wm-card,.wm-chip,.wm-icon-btn,.wm-btn-secondary,.wm-qty{background:#0f172a;color:#f8fafc;border-color:#334155;box-shadow:none}.wm-product-media,.wm-detail-media,.wm-row-media{background:#1e293b;border-color:#334155}.wm-input{background:#0f172a;border-color:#334155;color:#fff}.wm-warning{background:rgba(245,158,11,.14);color:#fde68a}}
			@media (max-width:900px){.wm-layout{display:block}.wm-sidebar{width:auto;border-right:0;border-bottom:1px solid #e7e5e4}.wm-nav{flex-direction:row;overflow-x:auto}.wm-main{padding:1.25rem}.wm-main-head{align-items:flex-start;flex-direction:column}.wm-detail,.wm-checkout{display:block;padding:1.25rem}.wm-detail-copy,.wm-checkout aside{margin-top:1.5rem;padding-top:0}.wm-row{grid-template-columns:5.5rem minmax(0,1fr)}.wm-row>strong{grid-column:2}.wm-form-grid{grid-template-columns:1fr}.wm-span-2{grid-column:auto}}
			html:has(.wm-theme-light),body:has(.wm-theme-light){background:#f6f4ee;color:#0c0a09}html:has(.wm-theme-dark),body:has(.wm-theme-dark){background:#020617;color:#f8fafc}
			.wm-theme-light{background:#f6f4ee!important;color:#0c0a09!important}.wm-theme-dark{background:#020617!important;color:#f8fafc!important}.wm-theme-light .wm-sidebar{background:rgba(251,250,247,.96)!important;border-color:#e7e5e4!important}.wm-theme-light .wm-card,.wm-theme-light .wm-chip,.wm-theme-light .wm-icon-btn,.wm-theme-light .wm-btn-secondary,.wm-theme-light .wm-qty{background:#fff!important;color:#292524!important;border-color:#d6d3d1!important}.wm-theme-light .wm-product-media,.wm-theme-light .wm-detail-media,.wm-theme-light .wm-row-media,.wm-theme-light .wm-input{background:#fafaf9!important;color:#0c0a09!important;border-color:#d6d3d1!important}.wm-theme-light .wm-muted,.wm-theme-light .wm-subtitle,.wm-theme-light .wm-kicker,.wm-theme-light .wm-product-meta,.wm-theme-light .wm-product-pack{color:#6b7280!important}.wm-theme-dark .wm-sidebar{background:rgba(15,23,42,.96)!important;border-color:#1e293b!important}.wm-theme-dark .wm-card,.wm-theme-dark .wm-chip,.wm-theme-dark .wm-icon-btn,.wm-theme-dark .wm-btn-secondary,.wm-theme-dark .wm-qty{background:#0f172a!important;color:#f8fafc!important;border-color:#334155!important}.wm-theme-dark .wm-product-media,.wm-theme-dark .wm-detail-media,.wm-theme-dark .wm-row-media,.wm-theme-dark .wm-input{background:#1e293b!important;color:#fff!important;border-color:#334155!important}.wm-theme-dark .wm-muted,.wm-theme-dark .wm-subtitle,.wm-theme-dark .wm-kicker,.wm-theme-dark .wm-product-meta,.wm-theme-dark .wm-product-pack{color:#cbd5e1!important}.wm-svg{display:inline-block;flex:0 0 auto}.wm-identicon{width:100%;height:100%;border-radius:999px}.wm-user-btn{overflow:hidden;border-radius:999px}.wm-brand,.wm-title,.wm-product-name,.wm-btn,.wm-chip,.wm-icon-btn,.wm-nav button,.wm-product-price,.wm-price,.wm-total,.wm-qty span{font-weight:650;letter-spacing:0}.wm-title{font-weight:750}.wm-product-meta,.wm-product-pack,.wm-muted,.wm-subtitle,.wm-kicker{font-weight:500}.wm-product-card{display:block;width:100%;padding:0;border:0;background:transparent;color:inherit;text-align:left;transition:transform .16s ease}.wm-product-card:hover{transform:translateY(-3px)}.wm-product-card:hover .wm-product-media{border-color:#7c3aed!important;box-shadow:0 18px 44px rgba(15,23,42,.2)}.wm-product-media,.wm-detail-media{cursor:pointer}.wm-product-media{transition:border-color .16s ease,box-shadow .16s ease}.wm-theme-switch{display:inline-flex;align-items:center;gap:.15rem;border:1px solid rgba(148,163,184,.35);background:rgba(148,163,184,.12);border-radius:999px;padding:.2rem}.wm-theme-switch button{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border:0;border-radius:999px;background:transparent;color:inherit;opacity:.65;cursor:pointer}.wm-theme-switch button.is-active{background:rgba(255,255,255,.14);opacity:1}.wm-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:2.7rem;height:2.7rem;padding:0}.wm-chip{display:inline-flex;align-items:center;gap:.45rem;cursor:pointer}.wm-qty{background:rgba(148,163,184,.11)}.wm-qty button{display:inline-flex;align-items:center;justify-content:center;color:inherit;cursor:pointer}.wm-qty button:hover{background:rgba(124,58,237,.16)}.wm-btn-link{min-height:auto;padding:.2rem .35rem;border-radius:.45rem;background:transparent!important;color:#94a3b8!important;font-size:.85rem}.wm-btn-success{background:#059669!important;color:#fff!important}.wm-product-add{display:flex;align-items:center;justify-content:center;position:relative;text-align:center}.wm-add-added{display:none}.wm-is-added{animation:wm-added-bg 1.6s ease both}.wm-is-added .wm-add-default{animation:wm-added-default-text 1.6s ease both}.wm-is-added .wm-add-added{display:inline;position:absolute;inset:auto;animation:wm-added-text 1.6s ease both}@keyframes wm-added-bg{0%,72%{background:#059669;color:#fff}100%{background:#6d28d9;color:#fff}}@keyframes wm-added-text{0%,72%{opacity:1}100%{opacity:0}}@keyframes wm-added-default-text{0%,72%{opacity:0}100%{opacity:1}}.wm-detail-badges{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0 0}.wm-detail-badges .wm-badge{position:static;display:inline-flex}.wm-detail-badges .wm-badge-digital{top:auto}.wm-cart-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1rem}.wm-cart-right{display:flex;flex-wrap:wrap;gap:.65rem;justify-content:flex-end}.wm-pay-btn[disabled]{opacity:.55;transform:none!important}.wm-field-label{display:flex;align-items:center;gap:.25rem;margin-bottom:.4rem;color:#94a3b8;font-size:.85rem;font-weight:600}.wm-required{color:#ef4444}.wm-required-note{margin:1rem 0 0;color:#94a3b8;font-size:.82rem}.wm-coreid{overflow-wrap:anywhere;word-break:break-word;letter-spacing:.03em}.wm-checkbox{display:inline-flex;align-items:center;gap:.5rem;color:inherit;font-weight:500}.wm-checkbox input{width:1rem;height:1rem;accent-color:#7c3aed}.wm-form-actions-top{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;margin-top:1rem}.wm-saved-select{min-width:min(100%,18rem)}.wm-saved{margin-top:1rem;border:1px solid rgba(148,163,184,.35);border-radius:1rem;background:rgba(148,163,184,.1);overflow:hidden}.wm-saved summary{padding:.85rem 1rem;cursor:pointer;font-weight:650}.wm-saved-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem;align-items:center;border-top:1px solid rgba(148,163,184,.25);padding:.65rem}.wm-saved-title{font-weight:650}.wm-saved-sub{display:block;margin:.15rem 0 0;color:#94a3b8;font-size:.8rem}.wm-summary-core{max-width:100%;overflow-wrap:anywhere}.wm-fail-mark{background:#fee2e2;color:#991b1b}.wm-form-grid label[hidden]{display:none}
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
