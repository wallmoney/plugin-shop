import adapter from '@sveltejs/adapter-static';

const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html'
		}),
		files: {
			appTemplate: 'app/app.html',
			routes: 'app/routes',
			lib: 'app/lib'
		},
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
