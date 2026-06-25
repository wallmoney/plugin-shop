function shopLogoUrl() {
	const context = typeof pluginContext === 'object' && pluginContext ? pluginContext : null;
	if (SHOP_CONFIG.logoSrc && /^https?:\/\//i.test(SHOP_CONFIG.logoSrc)) return SHOP_CONFIG.logoSrc;
	if (SHOP_CONFIG.logoUrl && /^https?:\/\//i.test(SHOP_CONFIG.logoUrl)) return SHOP_CONFIG.logoUrl;
	return context && typeof context.iconUrl === 'string' ? context.iconUrl : '';
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

function frameButton(actions, label, action, variant = 'primary', extraClass = '') {
	return `<button type="button" class="wm-btn wm-btn-${variant} ${extraClass}" ${actionAttr(actions, action)}>${escapeHtml(label)}</button>`;
}

function pluginFrame(title, body, actions, options = {}) {
	return {
		type: 'pluginFrame',
		title,
		minHeight: options.minHeight || 820,
		actions,
		html: `<style>
			:root{color-scheme:dark light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
			*{box-sizing:border-box}body{margin:0;background:#f6f4ee;color:#0c0a09}button,input,select{font:inherit}
			.wm-shop{min-height:100vh;background:#f6f4ee;color:#0c0a09}.wm-shell{max-width:1680px;margin:0 auto}.wm-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.25rem 1.5rem}.wm-brand{display:inline-flex;align-items:center;gap:.65rem;border:0;background:transparent;color:inherit;font-size:1.5rem;font-weight:900;letter-spacing:-.03em;cursor:pointer}.wm-logo{width:2rem;height:2rem;border-radius:.75rem;object-fit:cover}.wm-actions{display:flex;align-items:center;gap:.75rem}.wm-icon-btn,.wm-chip{border:1px solid rgba(120,113,108,.25);background:#fff;color:#292524;border-radius:999px;box-shadow:0 10px 30px rgba(28,25,23,.08);font-weight:800}.wm-chip{padding:.6rem 1rem}.wm-layout{display:flex;min-height:100vh}.wm-sidebar{width:15rem;flex:0 0 15rem;border-right:1px solid #e7e5e4;background:rgba(251,250,247,.96);padding:1.25rem}.wm-subtitle{margin:.5rem 0 0;color:#57534e;font-size:.9rem;font-weight:650;line-height:1.55}.wm-nav{display:flex;flex-direction:column;gap:.5rem;margin-top:1.5rem}.wm-nav button{border:0;border-radius:1rem;background:transparent;color:#57534e;text-align:left;padding:.85rem 1rem;font-weight:900;cursor:pointer}.wm-nav button.is-active{background:#fff;color:#0c0a09;box-shadow:0 18px 40px rgba(28,25,23,.12)}.wm-main{min-width:0;flex:1;padding:1.5rem 2.5rem}.wm-main-head{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;border-bottom:1px solid #e7e5e4;padding-bottom:1.5rem}.wm-kicker{margin:0;color:#78716c;font-size:.9rem;font-weight:750}.wm-title{margin:.25rem 0 0;font-size:clamp(2rem,4vw,3.5rem);line-height:.95;font-weight:950;letter-spacing:-.045em}.wm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem 1rem;margin-top:2rem}.wm-product{text-align:left}.wm-product-media{position:relative;aspect-ratio:1;overflow:hidden;border-radius:1.75rem;background:#fff;box-shadow:0 8px 30px rgba(28,25,23,.08);border:1px solid rgba(214,211,209,.7)}.wm-product-media img{width:100%;height:100%;object-fit:cover;display:block}.wm-empty-icon{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:3rem}.wm-badge{position:absolute;left:.75rem;top:.75rem;border-radius:999px;background:#fff;color:#1c1917;padding:.3rem .75rem;font-size:.75rem;font-weight:900}.wm-product button.wm-product-open{display:block;width:100%;border:0;background:transparent;text-align:left;color:inherit;cursor:pointer}.wm-product-meta{margin:.75rem 0 0;color:#78716c;font-size:.85rem;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wm-product-name{margin:.25rem 0 0;min-height:2.5rem;font-size:1rem;line-height:1.25;font-weight:950}.wm-product-pack,.wm-product-price{margin:.3rem 0 0}.wm-product-pack{color:#78716c;font-size:.85rem;font-weight:750}.wm-product-price{font-weight:950}.wm-btn{min-height:2.65rem;border-radius:999px;padding:.65rem 1rem;border:0;font-size:.9rem;font-weight:950;cursor:pointer;transition:transform .15s ease,background .15s ease}.wm-btn:hover{transform:translateY(-1px)}.wm-btn-primary{background:#6d28d9;color:#fff}.wm-btn-secondary{background:#fff;color:#292524;border:1px solid #d6d3d1}.wm-btn-ghost{background:transparent;color:#57534e}.wm-product>.wm-btn{width:100%;margin-top:.75rem}.wm-page{min-height:100vh;background:#f6f4ee;padding:1.25rem}.wm-card{background:#fff;border:1px solid #e7e5e4;border-radius:2rem;box-shadow:0 18px 50px rgba(28,25,23,.08);padding:1.25rem}.wm-cart{max-width:48rem;margin:2.5rem auto 0}.wm-row{display:grid;grid-template-columns:7rem minmax(0,1fr) auto;gap:1rem;margin-top:1.25rem}.wm-row-media{aspect-ratio:1;overflow:hidden;border-radius:1.5rem;background:#f5f5f4}.wm-row-media img{width:100%;height:100%;object-fit:cover}.wm-muted{color:#78716c}.wm-total{display:flex;justify-content:space-between;gap:1rem;border-top:1px solid #e7e5e4;margin-top:2rem;padding-top:1.25rem;font-size:1.1rem;font-weight:950}.wm-inline-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem}.wm-qty{display:inline-flex;align-items:center;border:1px solid #d6d3d1;border-radius:999px;background:#fff}.wm-qty button{border:0;background:transparent;padding:.45rem .75rem;font-weight:950;cursor:pointer}.wm-qty span{min-width:2rem;text-align:center;font-weight:900}.wm-detail{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(24rem,.95fr);gap:2rem;max-width:80rem;margin:0 auto;padding:1.5rem}.wm-detail-media{overflow:hidden;border-radius:2.25rem;background:#fff;box-shadow:0 8px 30px rgba(28,25,23,.08);border:1px solid #e7e5e4}.wm-detail-media img{width:100%;aspect-ratio:1;object-fit:cover;display:block}.wm-detail-copy{padding-top:3rem}.wm-price{font-size:2rem;font-weight:950}.wm-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1.5rem}.wm-input{width:100%;border:1px solid #d6d3d1;background:#fafaf9;border-radius:1rem;padding:.85rem 1rem;font-weight:750;color:#0c0a09}.wm-span-2{grid-column:span 2}.wm-checkout{display:grid;grid-template-columns:minmax(0,1fr) 24rem;gap:1.5rem;max-width:72rem;margin:2.5rem auto 0}.wm-summary-line{display:flex;justify-content:space-between;gap:1rem;margin-top:.75rem}.wm-warning{border:1px solid rgba(245,158,11,.35);background:#fef3c7;color:#78350f;border-radius:1rem;padding:.75rem;margin-top:1rem;font-weight:850}.wm-success{text-align:center;max-width:48rem;margin:4rem auto 0}.wm-success-mark{display:flex;align-items:center;justify-content:center;width:3.5rem;height:3.5rem;margin:0 auto;border-radius:999px;background:#dcfce7;color:#166534;font-size:2rem;font-weight:950}
			@media (min-width:640px){.wm-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width:1280px){.wm-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (min-width:1536px){.wm-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
			@media (prefers-color-scheme:dark){body,.wm-shop,.wm-page{background:#020617;color:#f8fafc}.wm-sidebar{background:rgba(15,23,42,.96);border-right-color:#1e293b}.wm-subtitle,.wm-kicker,.wm-product-meta,.wm-product-pack,.wm-muted{color:#cbd5e1}.wm-main-head,.wm-total{border-color:#1e293b}.wm-nav button{color:#cbd5e1}.wm-nav button.is-active{background:#f8fafc;color:#020617}.wm-card,.wm-chip,.wm-icon-btn,.wm-btn-secondary,.wm-qty{background:#0f172a;color:#f8fafc;border-color:#334155;box-shadow:none}.wm-product-media,.wm-detail-media,.wm-row-media{background:#1e293b;border-color:#334155}.wm-input{background:#0f172a;border-color:#334155;color:#fff}.wm-warning{background:rgba(245,158,11,.14);color:#fde68a}}
			@media (max-width:900px){.wm-layout{display:block}.wm-sidebar{width:auto;border-right:0;border-bottom:1px solid #e7e5e4}.wm-nav{flex-direction:row;overflow-x:auto}.wm-main{padding:1.25rem}.wm-main-head{align-items:flex-start;flex-direction:column}.wm-detail,.wm-checkout{display:block;padding:1.25rem}.wm-detail-copy,.wm-checkout aside{margin-top:1.5rem;padding-top:0}.wm-row{grid-template-columns:5.5rem minmax(0,1fr)}.wm-row>strong{grid-column:2}.wm-form-grid{grid-template-columns:1fr}.wm-span-2{grid-column:auto}}
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
	if (state.view === 'orders') return renderOrders(state);
	return renderProducts(state);
}
