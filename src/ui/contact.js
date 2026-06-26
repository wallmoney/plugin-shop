function contactSettings(state) {
	return state.settings && state.settings.contact ? state.settings.contact : SHOP_CONFIG.contact || {};
}

function contactMailUrl(email, subject, body) {
	const params = new URLSearchParams();
	if (subject) params.set('subject', subject);
	if (body) params.set('body', body);
	const query = params.toString();
	return `mailto:${encodeURIComponent(email)}${query ? `?${query}` : ''}`;
}

function contactPhoneUrl(phone) {
	return `tel:${String(phone || '').replace(/[^+0-9]/g, '')}`;
}

function renderCompanyDetail(label, value) {
	return value ? `<div class="wm-summary-line"><span class="wm-muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>` : '';
}

function renderContactPage(state) {
	const actions = {};
	const contact = contactSettings(state);
	const email = contact.email || '';
	const mobile = contact.mobile || '';
	const subjects = Array.isArray(contact.subjects) ? contact.subjects : [];
	const company = contact.company || {};

	return pluginFrame('Contact', `
		<div class="wm-page wm-theme-${escapeHtml(state.theme)}">
			${renderShopHeader(actions, state)}
			<main class="wm-checkout">
				<section class="wm-card">
					<p class="wm-kicker">Shop support</p>
					<h1 class="wm-title" style="font-size:2.25rem">Contact</h1>
					<p class="wm-muted">Choose a topic to open your mail client with a prepared subject.</p>
					<div class="wm-inline-actions" style="margin-top:1.5rem">
						${email ? subjects.map((item) => `
							<button type="button" class="wm-btn wm-btn-primary" ${actionAttr(actions, { type: 'navigate', href: contactMailUrl(email, item.subject, item.body) })}>
								${icon('mail', 17)} ${escapeHtml(item.label)}
							</button>
						`).join('') : ''}
						${email ? `
							<button type="button" class="wm-btn wm-btn-secondary" ${actionAttr(actions, { type: 'navigate', href: contactMailUrl(email, 'Shop contact', 'Hello, I would like to contact your shop.') })}>
								${icon('mail', 17)} Email shop
							</button>
						` : ''}
						${mobile ? `
							<button type="button" class="wm-btn wm-btn-secondary" ${actionAttr(actions, { type: 'navigate', href: contactPhoneUrl(mobile) })}>
								${icon('phone', 17)} Call shop
							</button>
						` : ''}
					</div>
					${!email && !mobile ? `<p class="wm-warning">No shop contact is configured.</p>` : ''}
				</section>
				<aside class="wm-card">
					<h2 style="display:flex;align-items:center;gap:.5rem;margin:0;font-size:1.25rem;font-weight:700">${icon('building', 18)} Company details</h2>
					${renderCompanyDetail('Company', company.name)}
					${renderCompanyDetail('Registration number', company.registrationNumber)}
					${renderCompanyDetail('VAT ID', company.vatId)}
					${renderCompanyDetail('Address', company.address)}
					${company.website ? `
						<div class="wm-summary-line">
							<span class="wm-muted">Website</span>
							<button type="button" class="wm-btn wm-btn-link" ${actionAttr(actions, { type: 'navigate', href: company.website })}>${icon('externalLink', 15)} Open</button>
						</div>
					` : ''}
					${email ? `<div class="wm-summary-line"><span class="wm-muted">Email</span><strong>${escapeHtml(email)}</strong></div>` : ''}
					${mobile ? `<div class="wm-summary-line"><span class="wm-muted">Mobile</span><strong>${escapeHtml(mobile)}</strong></div>` : ''}
				</aside>
			</main>
		</div>
	`, actions);
}
