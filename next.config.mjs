/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,   // 🔥 Add this to stop double API calls
  basePath: process.env.BASEPATH,

  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/dashboards',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/admin/dashboards',
        permanent: true,
        locale: false
      },
      {
        source: '/:prefix*/dashboards/crm/:suffix*',
        destination: '/admin/dashboards',
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
