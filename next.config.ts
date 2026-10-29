import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'pg'],
  experimental: {optimizePackageImports: ['@phosphor-icons/react', 'lucide-react']},
  async headers() {
    return [
      {source: '/sw.js', headers: [{key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate'}, {key: 'Service-Worker-Allowed', value: '/'}, {key: 'X-Content-Type-Options', value: 'nosniff'}]},
      {source: '/sw-assets.json', headers: [{key: 'Cache-Control', value: 'no-cache'}]},
      {source: '/api/:path*', headers: [{key: 'Cache-Control', value: 'no-store'}]},
      {source: '/(.*)', headers: [{key: 'X-Content-Type-Options', value: 'nosniff'}, {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'}]},
    ];
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
