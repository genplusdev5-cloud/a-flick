'use client'

// React Imports
import { useEffect, useState } from 'react'
import { usePermission } from '@/hooks/usePermission'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import { toast } from 'react-toastify'

const PermissionGuard = props => {
  const { children, permission, action = 'view', fallback = null } = props
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  const { canAccess, isLoading } = usePermission()

  useEffect(() => {
    if (isLoading) return

    // If no permission prop is passed, we assume it's public
    if (!permission) {
      setIsAuthorized(true)
      setLoading(false)
      return
    }

    const authorized = canAccess(permission, action) 

    if (authorized) {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
      
      // ONLY redirect for "view" action on full page guards
      // Button-level guards (action='create', etc.) should just return null/fallback
      if (action === 'view') {
        toast.error("You are not authorized to access this page", {
          toastId: 'auth-error'
        })
        router.push('/en/pages/misc/401-not-authorized')
      }
    }
    setLoading(false)
  }, [permission, action, router, isLoading, canAccess])

  if (loading || isLoading) {
    return (
      <Box className="flex justify-center items-center h-[50vh]">
        <CircularProgress />
      </Box>
    )
  }

  return isAuthorized ? <>{children}</> : fallback
}

export default PermissionGuard

