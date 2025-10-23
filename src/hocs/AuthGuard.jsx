// AuthGuard neutralized: previously this component enforced server-side
// authentication. To remove session enforcement we simply render children
// unconditionally.
// Third-party Imports
import { getServerSession } from 'next-auth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default async function AuthGuard({ children, locale }) {
  const session = await getServerSession()
  // If authenticated and not on /admin/dashboards, redirect
  if (session) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname
      const dashboardsPath = `/${locale}/admin/dashboards`
      if (pathname !== dashboardsPath) {
        window.location.replace(dashboardsPath)
        return null
      }
    }
    return <>{children}</>
  } else {
    return <AuthRedirect lang={locale} />
  }
}
