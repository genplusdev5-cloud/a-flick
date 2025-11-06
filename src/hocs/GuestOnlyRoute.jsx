'use client'

// ✅ React Imports
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ✅ Config Imports
import themeConfig from '@configs/themeConfig'

// ✅ Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// 🧩 GuestOnlyRoute
// Allows only unauthenticated users (no token) to access routes like /login
// If user already logged in (token exists), redirect to dashboard
const GuestOnlyRoute = ({ children, lang }) => {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    // ✅ If user is already logged in → redirect to dashboard
    if (token) {
      router.replace(getLocalizedUrl('/admin/dashboards', lang))
    }
  }, [router, lang])

  return <>{children}</>
}

export default GuestOnlyRoute
