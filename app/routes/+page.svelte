<script lang="ts">
	import categories from '../../data/categories.json';
	import redTea from '../../data/inventory/red-tea.json';
	import turkishTea from '../../data/inventory/turkish-tea.json';
	import coffee from '../../data/inventory/coffee.json';
	import redRose from '../../data/inventory/red-rose.json';
	import tulip from '../../data/inventory/tulip.json';

	type Category = {
		id: string;
		label: string;
		helper: string;
		order: number;
	};

	type Product = {
		id: string;
		name: string;
		category: string;
		price: number;
		currency: string;
		icon: string;
		cid: string;
		description: string;
		stock: number;
		vendor: string;
		rating: number;
		reviews: number;
		soldLast30Days: number;
		badge: string;
		packLabel: string;
		order: number;
	};

	const productList = [redTea, turkishTea, coffee, redRose, tulip] as Product[];
	const categoryList = [...(categories as Category[])].sort((a, b) => a.order - b.order);
	const products = [...productList].sort((a, b) => a.order - b.order);
	const gatewayUrl = 'https://ipf.sk';

	let selectedCategory = $state(categoryList[0]?.id ?? 'tea');
	let selectedProductId = $state<string | null>(null);
	let cart = $state<Record<string, number>>({});

	const visibleProducts = $derived(products.filter((product) => product.category === selectedCategory));
	const selectedProduct = $derived(selectedProductId ? products.find((product) => product.id === selectedProductId) ?? null : null);
	const cartCount = $derived(Object.values(cart).reduce((sum, quantity) => sum + quantity, 0));

	function imageUrl(product: Product): string {
		return `${gatewayUrl}/ipfs/${product.cid}`;
	}

	function money(product: Product): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: product.currency,
			maximumFractionDigits: 0
		}).format(product.price);
	}

	function selectCategory(categoryId: string) {
		selectedCategory = categoryId;
		selectedProductId = null;
	}

	function addToCart(productId: string) {
		cart = {
			...cart,
			[productId]: (cart[productId] ?? 0) + 1
		};
	}
</script>

<svelte:head>
	<title>Wall Money Shop Preview</title>
	<meta name="description" content="SvelteKit preview for the Wall Money Shop marketplace plugin." />
</svelte:head>

{#if selectedProduct}
	<main class="detail-shell">
		<section>
			<button class="back-button" type="button" onclick={() => (selectedProductId = null)}>← Back to products</button>
			<div class="hero-image">
				<img src={imageUrl(selectedProduct)} alt={selectedProduct.name} />
			</div>
		</section>
		<section class="detail-copy">
			<div class="vendor-row">
				<div class="vendor-mark">{selectedProduct.vendor.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</div>
				<div>
					<p class="vendor-name">{selectedProduct.vendor}</p>
					<p class="muted">Visit store</p>
				</div>
			</div>
			<h1>{selectedProduct.name}</h1>
			<p class="meta">{selectedProduct.rating.toFixed(1)} ({selectedProduct.reviews}) · {selectedProduct.soldLast30Days} sold in the last 30 days</p>
			<p class="price">{money(selectedProduct)}</p>
			<div class="option-pill">{selectedProduct.packLabel}</div>
			<div class="actions">
				<button class="secondary" type="button" onclick={() => addToCart(selectedProduct.id)}>Add to cart</button>
				<button class="primary" type="button" onclick={() => addToCart(selectedProduct.id)}>Buy now</button>
			</div>
			<div class="description">
				<h2>Product description</h2>
				<p>{selectedProduct.description}</p>
				<p class="cid">IPFS CID: {selectedProduct.cid}</p>
			</div>
		</section>
	</main>
{:else}
	<div class="catalog-shell">
		<aside>
			<div>
				<p class="brand">Shop</p>
				<p class="muted">Tea, coffee, and flowers</p>
			</div>
			<nav aria-label="Categories">
				{#each categoryList as category (category.id)}
					<button class:active={selectedCategory === category.id} type="button" onclick={() => selectCategory(category.id)}>
						<span>{category.label}</span>
						<span>{products.filter((product) => product.category === category.id).length}</span>
					</button>
				{/each}
			</nav>
			<div class="dock-note">Cart · {cartCount}</div>
		</aside>
		<main>
			<header>
				<div>
					<p class="muted">Browse category</p>
					<h1>{categoryList.find((category) => category.id === selectedCategory)?.label}</h1>
				</div>
				<p class="count">{visibleProducts.length} products</p>
			</header>
			<div class="grid">
				{#each visibleProducts as product (product.id)}
					<article>
						<button class="image-button" type="button" onclick={() => (selectedProductId = product.id)}>
							<img src={imageUrl(product)} alt={product.name} />
							<span>{product.badge}</span>
						</button>
						<p class="vendor">{product.vendor}</p>
						<h2>{product.name}</h2>
						<p class="muted">{product.rating.toFixed(1)} ({product.reviews})</p>
						<p class="card-price">{money(product)}</p>
						<button class="add" type="button" onclick={() => addToCart(product.id)}>Add to cart</button>
					</article>
				{/each}
			</div>
		</main>
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		background: #f6f4ee;
		color: #1c1917;
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	}

	button {
		font: inherit;
	}

	.catalog-shell {
		display: flex;
		min-height: 100svh;
	}

	aside {
		position: sticky;
		top: 0;
		display: flex;
		width: 18rem;
		height: 100svh;
		box-sizing: border-box;
		flex-direction: column;
		border-right: 1px solid #e7e5e4;
		background: rgba(251, 250, 247, 0.92);
		padding: 1.25rem;
	}

	.brand {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 950;
		letter-spacing: -0.05em;
	}

	.muted {
		margin: 0;
		color: #78716c;
		font-size: 0.9rem;
		font-weight: 650;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 2rem;
	}

	nav button,
	.dock-note {
		display: flex;
		justify-content: space-between;
		border: 0;
		border-radius: 1rem;
		background: white;
		padding: 0.9rem 1rem;
		color: #44403c;
		font-weight: 850;
	}

	nav button.active {
		background: #1c1917;
		color: white;
		box-shadow: 0 14px 30px rgba(28, 25, 23, 0.18);
	}

	.dock-note {
		margin-top: auto;
	}

	main {
		min-width: 0;
		flex: 1;
		padding: 2.5rem;
	}

	header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		border-bottom: 1px solid #e7e5e4;
		padding-bottom: 1.5rem;
	}

	h1 {
		margin: 0.25rem 0 0;
		font-size: clamp(2.5rem, 5vw, 4.75rem);
		font-weight: 950;
		letter-spacing: -0.07em;
	}

	.count,
	.option-pill {
		border-radius: 999px;
		background: white;
		padding: 0.55rem 1rem;
		font-weight: 850;
		box-shadow: 0 1px 2px rgba(28, 25, 23, 0.06);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 2rem 1rem;
		margin-top: 2rem;
	}

	article {
		min-width: 0;
	}

	.image-button {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 1;
		overflow: hidden;
		border: 0;
		border-radius: 1.75rem;
		background: white;
		box-shadow: 0 1px 2px rgba(28, 25, 23, 0.06);
		transition: 180ms ease;
	}

	.image-button:hover {
		transform: translateY(-0.25rem);
		box-shadow: 0 20px 40px rgba(28, 25, 23, 0.14);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.image-button span {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		border-radius: 999px;
		background: white;
		padding: 0.3rem 0.7rem;
		font-size: 0.75rem;
		font-weight: 950;
	}

	.vendor {
		margin: 0.85rem 0 0;
		color: #78716c;
		font-size: 0.9rem;
		font-weight: 700;
	}

	h2 {
		margin: 0.25rem 0;
		font-size: 1rem;
		line-height: 1.25;
	}

	.card-price,
	.price {
		margin: 0.6rem 0 0;
		font-weight: 950;
	}

	.add,
	.primary,
	.secondary,
	.back-button {
		border-radius: 999px;
		padding: 0.8rem 1rem;
		font-weight: 950;
		cursor: pointer;
	}

	.add,
	.primary {
		border: 0;
		background: #1c1917;
		color: white;
	}

	.add {
		width: 100%;
		margin-top: 0.75rem;
	}

	.secondary,
	.back-button {
		border: 1px solid #1c1917;
		background: transparent;
		color: #1c1917;
	}

	.detail-shell {
		display: grid;
		min-height: 100svh;
		max-width: 80rem;
		box-sizing: border-box;
		grid-template-columns: minmax(0, 1.05fr) minmax(24rem, 0.95fr);
		gap: 3rem;
		margin: 0 auto;
		padding: 2.5rem;
	}

	.hero-image {
		overflow: hidden;
		border-radius: 2.25rem;
		background: white;
		box-shadow: 0 1px 2px rgba(28, 25, 23, 0.06);
	}

	.detail-copy {
		padding-top: 4rem;
	}

	.vendor-row,
	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.vendor-mark {
		display: flex;
		width: 2.75rem;
		height: 2.75rem;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: #1c1917;
		color: white;
		font-weight: 950;
	}

	.vendor-name,
	.meta {
		margin: 0;
		font-weight: 850;
	}

	.price {
		font-size: 2rem;
	}

	.actions {
		margin-top: 1.5rem;
	}

	.actions button {
		min-height: 3rem;
		flex: 1;
	}

	.description {
		margin-top: 2rem;
		border-top: 1px solid #e7e5e4;
		padding-top: 1.5rem;
		color: #57534e;
		line-height: 1.75;
	}

	.cid {
		word-break: break-all;
		font-size: 0.8rem;
		font-weight: 700;
	}

	@media (max-width: 900px) {
		.catalog-shell,
		.detail-shell {
			display: block;
		}

		aside {
			position: static;
			width: auto;
			height: auto;
			border-right: 0;
			border-bottom: 1px solid #e7e5e4;
		}

		nav {
			flex-direction: row;
			overflow-x: auto;
		}

		nav button {
			flex: 0 0 auto;
		}

		.dock-note {
			margin-top: 1rem;
		}

		main,
		.detail-shell {
			padding: 1.25rem;
		}

		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.detail-copy {
			padding-top: 1.5rem;
		}
	}
</style>
