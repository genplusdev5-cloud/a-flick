/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  async redirects() {
    return [
      // Redirect root to default dashboard
      {
        source: '/',
        destination: '/en/dashboards/crm',
        permanent: true,
        locale: false,
      },

      // Redirect language-only paths to dashboard
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/dashboards/crm',
        permanent: true,
        locale: false,
      },

      // ✅ Redirect everything else to /en/*,
      // but do NOT touch _next, api, images, or static assets
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: 'text/html', // only redirect real pages (not assets)
          },
        ],
        destination: '/en/:path*',
        permanent: true,
        locale: false,
      },
    ]
  },
}

export default nextConfig
