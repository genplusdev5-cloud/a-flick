'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/usePermission'
import { MODULE_ROUTES } from '@/configs/moduleRoutes'
import { CircularProgress, Box } from '@mui/material'

const PathGuard = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { canAccess, isLoading } = usePermission()

  // Memoized normalization and module lookup
  const currentModule = useMemo(() => {
    const normalizedPath = pathname.replace(/^\/(en|ar|fr)/, '')
    const routeKey = Object.keys(MODULE_ROUTES).find(route => normalizedPath.startsWith(route))
    return {
      normalizedPath,
      name: routeKey ? MODULE_ROUTES[routeKey] : null
    }
  }, [pathname])

  // Effect 2: Check access when route changes or permissions finish loading
  useEffect(() => {
    // 1. Bypass if not logged in (to prevent loops during logout)
    if (typeof window !== 'undefined' && !localStorage.getItem('user_info')) return

    const { name: moduleName } = currentModule

    if (!isLoading && moduleName) {
      // ✅ Dashboard is common for all
      if (moduleName.toLowerCase() === 'dashboard') return

      const hasAccess = canAccess(moduleName, 'view')

      if (!hasAccess) {
        console.warn(`🚫 PathGuard: Denied access to ${pathname} (Module: ${moduleName})`)
        router.push('/en/pages/misc/401-not-authorized')
      }
    }
  }, [currentModule, isLoading, canAccess, router, pathname])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return <>{children}</>
}

export default PathGuard
