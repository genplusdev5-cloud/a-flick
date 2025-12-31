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

  // Effect 1: Refresh permissions only when route changes
  useEffect(() => {
    refreshPermissions()
  }, [pathname, refreshPermissions])

  // Effect 2: Check access when route changes or permissions finish loading
  useEffect(() => {
    // Check if the current path needs a permission check
    // Normalize path (remove locale)
    const normalizedPath = pathname.replace(/^\/(en|ar|fr)/, '')
    
    // 1. Bypass if not logged in (to prevent loops during logout)
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null
    if (!storedUser) return

    // Find the module name for this path
    const routeKey = Object.keys(MODULE_ROUTES).find(route => normalizedPath.startsWith(route))
    const moduleName = routeKey ? MODULE_ROUTES[routeKey] : null

    if (!isLoading && moduleName) {
      console.log(`🔍 PathGuard: Checking ${normalizedPath} -> Module: ${moduleName}`)
      
      // ✅ Dashboard is common for all
      if (moduleName.toLowerCase() === 'dashboard') {
        console.log(`✅ PathGuard: Dashboard access granted automatically`)
        return
      }

      const hasAccess = canAccess(moduleName, 'view')
      console.log(`📊 PathGuard: hasAccess=${hasAccess} for ${moduleName}`)
      
      if (!hasAccess) {
        console.warn(`🚫 PathGuard: Denied access to ${pathname} (Module: ${moduleName})`)
        router.push('/en/pages/misc/401-not-authorized')
      }
    } else if (!isLoading) {
      console.log(`❓ PathGuard: No module found for ${normalizedPath}`)
    }
  }, [pathname, isLoading, canAccess, router])

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
