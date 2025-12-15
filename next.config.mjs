/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,   // 🔥 Add this to stop double API calls
  basePath: process.env.BASEPATH,

  async redirects() {
    return [
      {
        source: '/',
        destination: '/en/admin/dashboards', // 🔥 Explicitly include lang
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/en/admin/dashboards', // 🔥 Explicitly include lang
        permanent: true,
        locale: false
      },
      {
        source: '/:prefix*/dashboards/crm/:suffix*',
        destination: '/en/admin/dashboards', // 🔥 Explicitly include lang
        permanent: true,
        locale: false
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: 'text/html'
          }
        ],
        destination: '/en/:path*',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
