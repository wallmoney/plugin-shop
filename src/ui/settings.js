function renderSettings(state) {
	const next = normalizeState({
		...state,
		view: 'settings'
	});
	return {
		type: 'stack',
		gap: 'lg',
		children: [
			{
				type: 'section',
				title: 'IPFS catalog settings',
				description: 'Use IPFS/IPNS for product data and a merchant-defined upload provider. No external database is required by the plugin.',
				children: [
					{
						type: 'form',
						fields: [
							{ name: 'settings.merchantAccount', label: 'Merchant payment account', value: state.settings.merchantAccount, placeholder: 'merchant-core-id-or-account' },
							{ name: 'settings.currency', label: 'Currency', value: state.settings.currency, placeholder: SHOP_CONFIG.defaultCurrency },
							{ name: 'settings.gatewayUrl', label: 'IPFS gateway URL', value: state.settings.gatewayUrl, placeholder: SHOP_CONFIG.defaultGatewayUrl },
							{ name: 'settings.catalogRef', label: 'Catalog CID / IPNS / URL', value: state.settings.catalogRef, placeholder: SHOP_CONFIG.defaultCatalogRef },
							{ name: 'settings.uploadProviderUrl', label: 'Upload provider URL', value: state.settings.uploadProviderUrl, placeholder: 'https://…' }
						],
						submitLabel: 'Save shop settings',
						action: {
							type: 'storage',
							key: STATE_KEY,
							value: next,
							message: 'Shop settings saved locally',
							level: 'success'
						}
					},
					{
						type: 'buttonRow',
						buttons: [
							{ label: 'Open catalog', variant: 'primary', action: { type: 'navigate', href: catalogUrl(state) } },
							{ label: 'Open upload provider', variant: 'secondary', action: { type: 'navigate', href: state.settings.uploadProviderUrl } },
							{ label: 'Reset local shop data', variant: 'ghost', action: { type: 'storage', key: STATE_KEY, value: defaultState(), message: 'Local shop data reset', level: 'warning' } }
						]
					}
				]
			},
			{
				type: 'section',
				title: 'Merchant-editable categories',
				description: 'Categories and products live in src/config.js. Change that file, run the build script, and the plugin bundle updates.',
				children: [
					{
						type: 'badgeGrid',
						items: SHOP_CATEGORIES.map((category) => ({
							label: `${category.icon} ${category.label}`,
							value: category.id,
							tone: category.id === 'all' ? 'success' : 'muted'
						}))
					}
				]
			},
			{
				type: 'section',
				title: 'Suggested IPFS publishing workflow',
				description: 'A merchant can pin product JSON and images, then publish a mutable catalog reference through IPNS or another pinned catalog CID.',
				children: [
					{
						type: 'list',
						items: [
							{ label: '1. Upload images', value: 'Pin product media to IPFS' },
							{ label: '2. Upload metadata', value: 'One JSON object per listing' },
							{ label: '3. Publish catalog', value: 'CID or IPNS points to product IDs/CIDs' },
							{ label: '4. Configure plugin', value: 'Paste gateway, catalog ref, and merchant account' }
						]
					},
					{
						type: 'text',
						text: 'Portal sandbox note: current plugins cannot fetch arbitrary network JSON yet, so this release stores local sample listings and opens IPFS links. The data model is ready for safe catalog fetch when the host exposes it.',
						tone: 'warning'
					}
				]
			}
		]
	};
}
