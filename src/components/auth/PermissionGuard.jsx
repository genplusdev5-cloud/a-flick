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
  const { children, permission, action = 'view', fallbackPath = '/pages/misc/401-not-authorized' } = props
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  const { canAccess, isLoading } = usePermission()

  useEffect(() => {
    if (isLoading) return

    // If no permission prop is passed, we assume it's public or basic auth is enough
    if (!permission) {
      setIsAuthorized(true)
      setLoading(false)
      return
    }

    // 🔴 ROLLBACK: Always allow access
    const authorized = true
    // const authorized = canAccess(permission, action) 

    if (authorized) {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
      toast.error("You are not authorized to access this page", {
        toastId: 'auth-error'
      })
      router.push(fallbackPath)
    }
    setLoading(false)
  }, [permission, fallbackPath, router, isLoading, canAccess])

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-[50vh]">
        <CircularProgress />
      </Box>
    )
  }

  // If we are done loading and authorized, render children.
  // If not authorized, we already triggered redirect in useEffect, 
  // but we return null here to avoid flashing content.
  return isAuthorized ? <>{children}</> : null
}

export default PermissionGuard
