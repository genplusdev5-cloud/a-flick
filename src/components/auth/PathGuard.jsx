'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/usePermission'
import { MODULE_ROUTES } from '@/configs/moduleRoutes'
import { CircularProgress, Box } from '@mui/material'

const PathGuard = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { canAccess, isLoading, refreshPermissions } = usePermission()

  useEffect(() => {
    // Force refresh permissions when route changes to ensure real-time updates apply
    // This meets the "real-time" requirement during navigation.
    refreshPermissions()
    
    // Check if the current path needs a permission check
    // Normalize path (remove locale)
    const normalizedPath = pathname.replace(/^\/(en|ar|fr)/, '')
    
    // Find the module name for this path
    const routeKey = Object.keys(MODULE_ROUTES).find(route => normalizedPath.startsWith(route))
    const moduleName = routeKey ? MODULE_ROUTES[routeKey] : null

    if (!isLoading && moduleName) {
      // ✅ Dashboard is common for all
      if (moduleName.toLowerCase() === 'dashboard') return

      const hasAccess = canAccess(moduleName, 'view')
      if (!hasAccess) {
        console.warn(`🚫 PathGuard: Denied access to ${pathname} (Module: ${moduleName})`)
        router.push('/en/pages/misc/401-not-authorized')
      }
    }
  }, [pathname, isLoading, canAccess, router, refreshPermissions])

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
