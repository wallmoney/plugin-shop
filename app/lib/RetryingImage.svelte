<script lang="ts">
	type LoadStatus = 'loading' | 'loaded' | 'failed';

	type Props = {
		src: string;
		alt: string;
		class?: string;
		timeoutMs?: number;
		maxAutoRetries?: number;
	};

	let {
		src,
		alt,
		class: imageClass = '',
		timeoutMs = 8000,
		maxAutoRetries = 1
	}: Props = $props();

	let status = $state<LoadStatus>('loading');
	let attempt = $state(0);
	let cacheBuster = $state(0);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const displayedSrc = $derived(cacheBuster > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${cacheBuster}` : src);

	$effect(() => {
		src;
		status = 'loading';
		attempt = 0;
		cacheBuster = 0;
	});

	$effect(() => {
		if (status !== 'loading') return;
		displayedSrc;
		startTimeout();
		return clearTimeout;
	});

	function startTimeout() {
		clearTimeout();
		timeoutId = setTimeout(() => {
			handleFailure();
		}, timeoutMs);
	}

	function clearTimeout() {
		if (!timeoutId) return;
		window.clearTimeout(timeoutId);
		timeoutId = null;
	}

	function retry() {
		status = 'loading';
		attempt += 1;
		cacheBuster += 1;
	}

	function handleFailure() {
		clearTimeout();
		if (attempt < maxAutoRetries) {
			retry();
			return;
		}
		status = 'failed';
	}

	function handleLoad() {
		clearTimeout();
		status = 'loaded';
	}

	function handleManualRetry(event: MouseEvent) {
		event.stopPropagation();
		attempt = 0;
		retry();
	}
</script>

<div class="relative h-full w-full bg-stone-100 dark:bg-slate-800">
	{#if status !== 'failed'}
		<img
			class={`${imageClass} ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
			src={displayedSrc}
			{alt}
			onload={handleLoad}
			onerror={handleFailure}
		/>
	{/if}

	{#if status === 'loading'}
		<div class="absolute inset-0 grid place-items-center bg-stone-100 dark:bg-slate-800" aria-label="Loading image">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-violet-600 dark:border-slate-600 dark:border-t-violet-400"></div>
		</div>
	{:else if status === 'failed'}
		<div class="absolute inset-0 grid place-items-center bg-stone-100 p-4 text-center dark:bg-slate-800">
			<div>
				<p class="text-sm font-black text-stone-700 dark:text-slate-100">Cannot be loaded.</p>
				<button
					class="mt-3 rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white dark:bg-violet-600"
					type="button"
					onclick={handleManualRetry}
				>
					Retry
				</button>
			</div>
		</div>
	{/if}
</div>
