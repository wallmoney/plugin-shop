const COUNTRY_OPTIONS = [
	{ code: 'US', name: 'United States' },
	{ code: 'CA', name: 'Canada' },
	{ code: 'GB', name: 'United Kingdom' },
	{ code: 'AT', name: 'Austria' },
	{ code: 'SK', name: 'Slovakia' },
	{ code: 'CZ', name: 'Czechia' },
	{ code: 'DE', name: 'Germany' },
	{ code: 'FR', name: 'France' },
	{ code: 'IT', name: 'Italy' },
	{ code: 'ES', name: 'Spain' },
	{ code: 'NL', name: 'Netherlands' },
	{ code: 'PL', name: 'Poland' },
	{ code: 'AU', name: 'Australia' },
	{ code: 'NZ', name: 'New Zealand' },
	{ code: 'JP', name: 'Japan' },
	{ code: 'KR', name: 'South Korea' },
	{ code: 'SG', name: 'Singapore' },
	{ code: 'BR', name: 'Brazil' },
	{ code: 'MX', name: 'Mexico' },
	{ code: 'ZA', name: 'South Africa' }
];

const US_STATE_OPTIONS = [
	'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
	'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
	'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
	'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
	'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
	'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
	'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
].map((name) => ({ code: name, name }));

function countryNameFromCode(code) {
	const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
	return COUNTRY_OPTIONS.find((country) => country.code === normalized)?.name || '';
}

function countryCodeFromValue(value) {
	const normalized = typeof value === 'string' ? value.trim() : '';
	if (!normalized) return '';
	const upper = normalized.toUpperCase();
	const lower = normalized.toLowerCase();
	const country = COUNTRY_OPTIONS.find((item) => item.code === upper || item.name.toLowerCase() === lower);
	return country ? country.code : upper.length === 2 ? upper : '';
}
