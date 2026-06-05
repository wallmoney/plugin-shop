<script lang="ts">
	import categories from '../../data/categories.json';
	import redTea from '../../data/inventory/red-tea.json';
	import turkishTea from '../../data/inventory/turkish-tea.json';
	import coffee from '../../data/inventory/coffee.json';
	import redRose from '../../data/inventory/red-rose.json';
	import tulip from '../../data/inventory/tulip.json';

	type Category = { id: string; label: string; helper: string; order: number };
	type Product = {
		id: string;
		name: string;
		category: string;
		price: number;
		icon: string;
		cid: string;
		description: string;
		digital?: boolean;
		vendor: string;
		badge: string;
		packLabel: string;
		order: number;
	};
	type View = 'products' | 'product' | 'cart' | 'checkout';

	const shop = {
		title: 'WM Shop',
		subtitle: 'Decentralized shopping listed as WM plugin.',
		currency: 'USD',
		gatewayUrl: 'https://ipf.sk',
		minimumCheckoutAmount: 50,
		deliveryFee: 0
	};
	const productList = [redTea, turkishTea, coffee, redRose, tulip] as Product[];
	const categoryList = [{ id: 'all', label: 'All', helper: 'Every listing', order: 0 }, ...(categories as Category[])].sort((a, b) => a.order - b.order);
	const products = [...productList].sort((a, b) => a.order - b.order);

	let view = $state<View>('products');
	let selectedCategory = $state('all');
	let selectedProductId = $state<string | null>(null);
	let cart = $state<Record<string, number>>({});
	let saveDelivery = $state(true);
	let delivery = $state({ name: '', email: '', phone: '', address: '', city: '', country: '', notes: '' });

	const visibleProducts = $derived(products.filter((product) => selectedCategory === 'all' || product.category === selectedCategory));
	const selectedProduct = $derived(selectedProductId ? products.find((product) => product.id === selectedProductId) ?? null : null);
	const cartItems = $derived(products.map((product) => ({ product, quantity: cart[product.id] ?? 0 })).filter((item) => item.quantity > 0));
	const cartCount = $derived(cartItems.reduce((sum, item) => sum + item.quantity, 0));
	const subtotal = $derived(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
	const deliveryFee = $derived(shop.deliveryFee > 0 && cartItems.some((item) => item.product.digital !== true) ? shop.deliveryFee : 0);
	const total = $derived(subtotal + deliveryFee);
	const minimumCheckoutMessage = $derived(
		shop.minimumCheckoutAmount > 0 && subtotal < shop.minimumCheckoutAmount
			? `Minimum checkout amount is ${money(shop.minimumCheckoutAmount)}. Add ${money(shop.minimumCheckoutAmount - subtotal)} more to continue.`
			: ''
	);

	function imageUrl(product: Product): string {
		return `${shop.gatewayUrl}/ipfs/${product.cid}`;
	}

	function money(value: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: shop.currency, maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
	}

	function selectCategory(categoryId: string) {
		selectedCategory = categoryId;
		selectedProductId = null;
		view = 'products';
	}

	function openProduct(productId: string) {
		selectedProductId = productId;
		view = 'product';
	}

	function addToCart(productId: string) {
		const product = products.find((item) => item.id === productId);
		if (!product) return;
		cart = { ...cart, [productId]: (cart[productId] ?? 0) + 1 };
	}

	function removeOne(productId: string) {
		const next = { ...cart };
		if ((next[productId] ?? 0) <= 1) delete next[productId];
		else next[productId] -= 1;
		cart = next;
	}

	function clearProduct(productId: string) {
		const next = { ...cart };
		delete next[productId];
		cart = next;
	}
</script>

<svelte:head>
	<title>{shop.title} Preview</title>
	<meta name="description" content={shop.subtitle} />
</svelte:head>

{#if view === 'product' && selectedProduct}
	<div class="min-h-screen bg-stone-50 text-stone-950 dark:bg-slate-950 dark:text-white">
		<header class="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
			<button class="text-2xl font-black" type="button" onclick={() => { view = 'products'; selectedCategory = 'all'; }}>{shop.title}</button>
			<button class="rounded-full bg-white px-4 py-2 text-sm font-black shadow dark:bg-slate-800" type="button" onclick={() => (view = 'cart')}>🛒 {cartCount}</button>
		</header>
		<main class="mx-auto grid max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[1fr_0.9fr]">
			<section>
				<button class="mb-5 rounded-full bg-white px-4 py-2 text-sm font-bold shadow dark:bg-slate-800" type="button" onclick={() => (view = 'products')}>← Back to products</button>
				<div class="overflow-hidden rounded-[2rem] bg-white shadow ring-1 ring-stone-200 dark:bg-slate-800 dark:ring-slate-700"><img class="aspect-square w-full object-cover" src={imageUrl(selectedProduct)} alt={selectedProduct.name} /></div>
			</section>
			<section class="lg:pt-14">
				<p class="text-sm font-black text-stone-500 dark:text-slate-400">{selectedProduct.vendor}</p>
				<h1 class="mt-4 text-5xl font-black tracking-tight">{selectedProduct.name}</h1>
				<div class="mt-4 flex gap-3 text-sm font-bold"><span class="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{selectedProduct.badge}</span></div>
				<p class="mt-6 text-3xl font-black">{money(selectedProduct.price)}</p>
				<p class="mt-8 text-sm font-black">Pack</p><p class="mt-2 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800">{selectedProduct.packLabel}</p>
				<p class="mt-6 text-sm font-black">Quantity</p><div class="mt-2 inline-flex items-center rounded-full border border-stone-300 bg-white dark:border-slate-700 dark:bg-slate-800"><button class="px-4 py-2 text-lg font-black" type="button" onclick={() => removeOne(selectedProduct.id)}>−</button><span class="min-w-10 text-center text-sm font-black">{cart[selectedProduct.id] ?? 0}</span><button class="px-4 py-2 text-lg font-black" type="button" onclick={() => addToCart(selectedProduct.id)}>+</button></div>
				<div class="mt-8 flex gap-3"><button class="min-h-12 flex-1 rounded-full border border-stone-950 px-5 text-sm font-black dark:border-slate-600" type="button" onclick={() => addToCart(selectedProduct.id)}>Add to cart</button><button class="min-h-12 flex-1 rounded-full bg-violet-600 px-5 text-sm font-black text-white" type="button" onclick={() => { addToCart(selectedProduct.id); view = 'checkout'; }}>Buy now</button></div>
				<div class="mt-8 border-t border-stone-200 pt-6 dark:border-slate-800"><p class="text-sm font-black">Product description</p><p class="mt-3 leading-8 text-stone-700 dark:text-slate-300">{selectedProduct.description}</p></div>
			</section>
		</main>
	</div>
{:else if view === 'cart'}
	<div class="min-h-screen bg-stone-50 px-5 py-6 text-stone-950 dark:bg-slate-950 dark:text-white">
		<header class="mx-auto flex max-w-5xl items-center justify-between"><button class="text-2xl font-black" type="button" onclick={() => (view = 'products')}>{shop.title}</button></header>
		<section class="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-5 shadow dark:border-slate-800 dark:bg-slate-900">
			<div class="flex justify-between"><div><h1 class="text-2xl font-black">Cart</h1><p class="text-sm font-semibold text-stone-500">{cartCount} items</p></div><p class="text-lg font-black">{money(subtotal)}</p></div>
			{#if cartItems.length}
				<div class="mt-6 space-y-5">{#each cartItems as item}<div class="grid gap-4 sm:grid-cols-[7rem_1fr_auto]"><img class="aspect-square rounded-3xl object-cover" src={imageUrl(item.product)} alt={item.product.name} /><div><p class="text-sm font-semibold text-stone-500">{item.product.vendor}</p><h2 class="text-lg font-black">{item.product.name}</h2><p class="text-sm text-stone-500">{item.product.packLabel}</p><div class="mt-4 inline-flex rounded-full border border-stone-300"><button class="px-3" type="button" onclick={() => clearProduct(item.product.id)}>🗑</button><button class="px-3 py-1.5" type="button" onclick={() => removeOne(item.product.id)}>−</button><span class="min-w-8 text-center">{item.quantity}</span><button class="px-3" type="button" onclick={() => addToCart(item.product.id)}>+</button></div></div><p class="font-black">{money(item.product.price * item.quantity)}</p></div>{/each}</div>
				<div class="mt-8 border-t pt-5"><div class="flex justify-between text-lg font-black"><span>Subtotal</span><span>{money(subtotal)}</span></div><button class="mt-5 min-h-12 w-full rounded-full bg-violet-600 text-sm font-black text-white" type="button" onclick={() => (view = 'checkout')}>Continue to checkout</button></div>
			{:else}<div class="mt-8 rounded-3xl bg-stone-50 p-8 text-center dark:bg-slate-800"><p class="font-black">Your cart is empty.</p><button class="mt-4 rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white" type="button" onclick={() => (view = 'products')}>Browse products</button></div>{/if}
		</section>
	</div>
{:else if view === 'checkout'}
	<div class="min-h-screen bg-stone-50 px-5 py-6 text-stone-950 dark:bg-slate-950 dark:text-white">
		<header class="mx-auto flex max-w-6xl items-center justify-between"><button class="text-2xl font-black" type="button" onclick={() => (view = 'products')}>{shop.title}</button><button class="rounded-full bg-white px-4 py-2 text-sm font-black dark:bg-slate-800" type="button" onclick={() => (view = 'cart')}>🛒 {cartCount}</button></header>
		<main class="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[1fr_24rem]"><section class="rounded-[2rem] bg-white p-5 shadow dark:bg-slate-900"><h1 class="text-2xl font-black">Delivery details</h1><p class="mt-2 text-sm font-semibold text-stone-500">Email is sent to admin after payment succeeds.</p><div class="mt-5 flex gap-2"><button class={`rounded-full px-4 py-2 text-sm font-black ${saveDelivery ? 'bg-violet-600 text-white' : 'bg-stone-100 dark:bg-slate-800'}`} type="button" onclick={() => (saveDelivery = true)}>Save details</button><button class={`rounded-full px-4 py-2 text-sm font-black ${!saveDelivery ? 'bg-violet-600 text-white' : 'bg-stone-100 dark:bg-slate-800'}`} type="button" onclick={() => (saveDelivery = false)}>This order only</button></div><form class="mt-6 grid gap-4 sm:grid-cols-2"><input class="rounded-2xl border bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Full name" bind:value={delivery.name}/><input class="rounded-2xl border bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Email" bind:value={delivery.email}/><input class="rounded-2xl border bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Phone" bind:value={delivery.phone}/><input class="rounded-2xl border bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Country" bind:value={delivery.country}/><input class="rounded-2xl border bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 sm:col-span-2" placeholder="Delivery address" bind:value={delivery.address}/><input class="rounded-2xl border bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 sm:col-span-2" placeholder="Notes" bind:value={delivery.notes}/></form></section><aside class="rounded-[2rem] bg-white p-5 shadow dark:bg-slate-900"><h2 class="text-xl font-black">Order summary</h2>{#each cartItems as item}<div class="mt-3 flex justify-between text-sm"><span>{item.product.name} × {item.quantity}</span><span class="font-black">{money(item.product.price * item.quantity)}</span></div>{/each}<div class="mt-5 border-t pt-5"><div class="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>{#if deliveryFee > 0}<div class="mt-3 flex justify-between"><span>Delivery</span><span>{money(deliveryFee)}</span></div>{/if}<div class="mt-3 flex justify-between text-lg font-black"><span>Total</span><span>{money(total)}</span></div></div>{#if minimumCheckoutMessage}<p class="mt-4 rounded-2xl bg-amber-100 px-3 py-2 text-sm font-black text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">{minimumCheckoutMessage}</p>{/if}<button class="mt-6 min-h-12 w-full rounded-full bg-violet-600 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={Boolean(minimumCheckoutMessage)}>Pay with Wall Money</button></aside></main>
	</div>
{:else}
	<div class="min-h-screen bg-stone-50 text-stone-950 dark:bg-slate-950 dark:text-white">
		<div class="flex min-h-screen flex-col lg:flex-row">
			<aside class="border-b bg-stone-50/95 px-4 py-5 dark:border-slate-800 dark:bg-slate-900/95 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
				<button class="text-left text-2xl font-black" type="button" onclick={() => selectCategory('all')}>{shop.title}</button>
				<p class="mt-2 text-sm font-semibold leading-6 text-stone-500 dark:text-slate-400">{shop.subtitle}</p>
				<nav class="mt-6 flex gap-2 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">{#each categoryList as category}<button class={`shrink-0 rounded-2xl px-4 py-3 text-left text-sm font-black ${selectedCategory === category.id ? 'bg-white shadow dark:bg-slate-50 dark:text-slate-950' : 'text-stone-500 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-white/10'}`} type="button" onclick={() => selectCategory(category.id)}>{category.label}</button>{/each}</nav>
			</aside>
			<main class="flex-1 px-5 py-6 sm:px-8 lg:px-10"><div class="flex items-end justify-between border-b border-stone-200 pb-6 dark:border-slate-800"><div><p class="text-sm font-semibold text-stone-500">Browse category</p><h1 class="mt-1 text-5xl font-black tracking-tight">{categoryList.find((category) => category.id === selectedCategory)?.label}</h1></div><button class="rounded-full bg-white px-4 py-2 text-sm font-black shadow dark:bg-slate-800" type="button" onclick={() => (view = 'cart')}>🛒 Cart <span class="ms-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">{cartCount}</span></button></div><div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">{#each visibleProducts as product}<article><button class="w-full text-left" type="button" onclick={() => openProduct(product.id)}><div class="relative aspect-square overflow-hidden rounded-[1.75rem] bg-white shadow ring-1 ring-stone-200 dark:bg-slate-800 dark:ring-slate-700"><img class="h-full w-full object-cover" src={imageUrl(product)} alt={product.name}/><span class="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black text-stone-900">{product.badge}</span></div><p class="mt-3 truncate text-sm font-semibold text-stone-500">{product.vendor}</p><h2 class="mt-1 min-h-10 text-base font-black leading-5">{product.name}</h2><p class="mt-1 text-sm font-semibold text-stone-500">{product.packLabel}</p><p class="mt-2 text-base font-black">{money(product.price)}</p></button><button class="mt-3 w-full rounded-full bg-stone-950 px-4 py-2.5 text-sm font-black text-white dark:bg-violet-600" type="button" onclick={() => addToCart(product.id)}>Add to cart</button></article>{/each}</div></main>
		</div>
	</div>
{/if}
