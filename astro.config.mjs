import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Served from the custom domain https://mra.bro.bd/ (see public/CNAME, which has to
// ship inside the dist artifact because this deploys via upload-pages-artifact).
// No `base`: on a custom apex the site lives at /, not /<repo>. Adding one back
// would prefix every route and asset and 404 the whole site.
export default defineConfig({
  site: 'https://mra.bro.bd',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
