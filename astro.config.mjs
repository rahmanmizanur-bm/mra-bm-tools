import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Project page: https://rahmanmizanur-bm.github.io/mra-bm-tools/
// `base` must match the repo name so assets/routes resolve under the subpath.
export default defineConfig({
  site: 'https://rahmanmizanur-bm.github.io',
  base: '/mra-bm-tools',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
