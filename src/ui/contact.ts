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
	return value ? `<div class="${summaryLineClass()}"><span class="font-semibold">${escapeHtml(label)}</span><span class="font-normal">${escapeHtml(value)}</span></div>` : '';
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
	const body = state.contactSku
		? `I have a question about product SKU: ${state.contactSku}`
		: selectedSubject.body;
	const contactSelectActionId = addFrameAction(actions, stateAction(state, { contactSubjectIndex: String(selectedSubjectIndex) }));
	const company = contact.company || {};

	return pluginFrame('Contact', `
		<div class="${pageClass(state)}">
			${renderShopHeader(actions, state)}
			<main class="mx-auto mt-10 grid max-w-6xl grid-cols-[minmax(0,1fr)_24rem] gap-6 max-[900px]:block max-[900px]:p-5">
				<section class="${cardClass(state)}">
					<p class="${kickerClass(state)}">Shop support</p>
					<h1 class="${titleClass('text-4xl')}">Contact</h1>
					<p class="${mutedClass(state)}">Choose a topic to open your mail client with a prepared subject.</p>
					<label class="mt-6 block max-w-md">
						<span class="${fieldLabelClass(state)}">Topic</span>
						<span class="relative block cursor-[context-menu]">
							<span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${mutedClass(state)}">${icon('contextMenu', 17)}</span>
							<select class="${neutralInputClass(state, 'cursor-[context-menu] pl-11')}" name="contactSubjectIndex" data-plugin-storage-action="${escapeHtml(contactSelectActionId)}" data-plugin-field="contactSubjectIndex">
								${subjects.length ? subjects.map((item, index) => `<option value="${escapeHtml(String(index))}" ${index === selectedSubjectIndex ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('') : '<option value="0">Shop contact</option>'}
							</select>
						</span>
					</label>
					${email ? `
						<button type="button" class="${buttonClass('primary', 'mt-4 w-full max-w-72 gap-3 max-[900px]:max-w-none')}" ${actionAttr(actions, { type: 'navigate', href: contactMailUrl(email, selectedSubject.subject, body) })}>
							${icon('mail', 17)} Compose via Email
						</button>
					` : ''}
					${!email && !mobile ? `<p class="${warningClass(state)}">No shop contact is configured.</p>` : ''}
				</section>
				<aside class="${cardClass(state, 'max-[900px]:mt-6')}">
					<h2 class="m-0 flex items-center gap-2 text-xl font-semibold">${icon('building', 18)} Company details</h2>
					${renderCompanyDetail('Company', company.name)}
					${renderCompanyDetail('Registration number', company.registrationNumber)}
					${renderCompanyDetail('VAT ID', company.vatId)}
					${renderCompanyDetail('Address', company.address)}
					${company.website ? `
						<div class="${summaryLineClass()}">
							<span class="font-semibold">Website</span>
							<button type="button" class="${buttonClass('link', 'gap-1')}" ${actionAttr(actions, { type: 'navigate', href: company.website })}>${icon('externalLink', 15)} Open</button>
						</div>
					` : ''}
					${email ? `<div class="${summaryLineClass()} items-center"><span class="font-semibold">Email</span><button type="button" class="inline-flex cursor-pointer items-center justify-end gap-2 border-0 bg-transparent p-0 text-right font-normal text-inherit hover:underline" ${actionAttr(actions, { type: 'navigate', href: contactMailUrl(email, 'Shop contact', 'Hello, I would like to contact your shop.') })}><span>${escapeHtml(email)}</span>${icon('mail', 15)}</button></div>` : ''}
					${mobile ? `<div class="${summaryLineClass()} items-center"><span class="font-semibold">Phone</span><button type="button" class="inline-flex cursor-pointer items-center justify-end gap-2 border-0 bg-transparent p-0 text-right font-normal text-inherit hover:underline" ${actionAttr(actions, { type: 'navigate', href: contactPhoneUrl(mobile) })}><span>${escapeHtml(formattedMobile || mobile)}</span>${icon('phone', 15)}</button></div>` : ''}
				</aside>
			</main>
		</div>
	`, actions);
}
