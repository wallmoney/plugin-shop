// @ts-nocheck
function contactSettings(state) {
	return state.settings && state.settings.contact ? state.settings.contact : SHOP_CONFIG.contact || {};
}

function contactMailUrl(email, subject, body) {
	const params = [];
	if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
	if (body) params.push(`body=${encodeURIComponent(body)}`);
	const query = params.join('&');
	return `mailto:${encodeURIComponent(email)}${query ? `?${query}` : ''}`;
}

function contactPhoneUrl(phone) {
	return `tel:${String(phone || '').replace(/[^+0-9]/g, '')}`;
}

function formatContactPhone(phone) {
	const raw = String(phone || '').trim();
	const normalized = raw.replace(/[^+0-9]/g, '');
	if (!normalized) return '';
	const hasPlus = normalized.startsWith('+');
	const digits = normalized.replace(/\D/g, '');
	if (!digits) return raw;
	if (hasPlus && digits.length > 9) {
		const countryLength = digits.length > 11 ? digits.length - 9 : digits.length > 10 ? digits.length - 10 : 1;
		const country = digits.slice(0, countryLength);
		const national = digits.slice(countryLength);
		return `+${country} ${national.replace(/(\d{3})(?=\d)/g, '$1 ').trim()}`;
	}
	return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

function renderCompanyDetail(label, value) {
	return value ? `<div class="wm-summary-line"><span class="wm-muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>` : '';
}

function contactSubjectIndex(state, subjects) {
	const index = Number(state.contactSubjectIndex);
	return Number.isFinite(index) && index >= 0 && index < subjects.length ? Math.floor(index) : 0;
}

function renderContactPage(state) {
	const actions = {};
	const contact = contactSettings(state);
	const email = contact.email || '';
	const mobile = contact.mobile || '';
	const formattedMobile = formatContactPhone(mobile);
	const subjects = Array.isArray(contact.subjects) ? contact.subjects : [];
	const selectedSubjectIndex = contactSubjectIndex(state, subjects);
	const selectedSubject = subjects[selectedSubjectIndex] || {
		label: 'Shop contact',
		subject: 'Shop contact',
		body: 'Hello, I would like to contact your shop.'
	};
	const contactSelectActionId = addFrameAction(actions, stateAction(state, { contactSubjectIndex: String(selectedSubjectIndex) }));
	const company = contact.company || {};

	return pluginFrame('Contact', `
		<div class="wm-page wm-theme-${escapeHtml(state.theme)}">
			${renderShopHeader(actions, state)}
			<main class="wm-checkout wm-contact-layout">
				<section class="wm-card">
					<p class="wm-kicker">Shop support</p>
					<h1 class="wm-title" style="font-size:2.25rem">Contact</h1>
					<p class="wm-muted">Choose a topic to open your mail client with a prepared subject.</p>
					<label class="wm-contact-topic">
						<span class="wm-field-label">Topic</span>
						<select class="wm-input" name="contactSubjectIndex" data-plugin-storage-action="${escapeHtml(contactSelectActionId)}" data-plugin-field="contactSubjectIndex">
							${subjects.length ? subjects.map((item, index) => `<option value="${escapeHtml(String(index))}" ${index === selectedSubjectIndex ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('') : '<option value="0">Shop contact</option>'}
						</select>
					</label>
					${email ? `
						<button type="button" class="wm-btn wm-btn-primary wm-contact-compose" ${actionAttr(actions, { type: 'navigate', href: contactMailUrl(email, selectedSubject.subject, selectedSubject.body) })}>
							${icon('mail', 17)} Compose via Email
						</button>
					` : ''}
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
					${email ? `<div class="wm-summary-line"><span class="wm-muted">Email</span><span class="wm-contact-value"><strong>${escapeHtml(email)}</strong><button type="button" class="wm-icon-btn" title="Email shop" ${actionAttr(actions, { type: 'navigate', href: contactMailUrl(email, 'Shop contact', 'Hello, I would like to contact your shop.') })}>${icon('mail', 15)}</button></span></div>` : ''}
					${mobile ? `<div class="wm-summary-line"><span class="wm-muted">Mobile</span><span class="wm-contact-value"><strong>${escapeHtml(formattedMobile || mobile)}</strong><button type="button" class="wm-icon-btn" title="Call shop" ${actionAttr(actions, { type: 'navigate', href: contactPhoneUrl(mobile) })}>${icon('phone', 15)}</button></span></div>` : ''}
				</aside>
			</main>
		</div>
	`, actions);
}
