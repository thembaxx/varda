import type {MetadataRoute} from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'Varda — Your place. Your people.', short_name: 'Varda',
    description: 'Your community, shared spaces, and greener everyday. Good things grow here.',
    start_url: '/', scope: '/', display: 'standalone', display_override: ['standalone', 'minimal-ui'],
    background_color: '#f7f7ef', theme_color: '#f7f7ef', lang: 'en-ZA',
    categories: ['lifestyle', 'social', 'utilities'],
    icons: [
      {src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any'},
      {src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
      {src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
      {src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
    ],
    shortcuts: [
      {name: 'Your community', url: '/#community', description: 'Find your next good plan.'},
      {name: 'Your wallet', url: '/#wallet', description: 'Your saved plans, all together.'},
      {name: '3D studio', url: '/#studio', description: 'A little room to imagine.'},
    ],
  };
}
