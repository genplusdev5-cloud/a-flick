'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUserPrivilegeList } from '@/api/userPrivilege'
import { useParams, usePathname } from 'next/navigation'
import { PERMISSION_ALIASES } from '@/constants/permissionAliases'

// Create Context
const PermissionContext = createContext({
  permissions: [],
  isLoading: true,
  canAccess: (module, action) => false,
  refreshPermissions: () => { },
  triggerPrivilegeUpdate: () => { }, // New helper to broadcast update
  permissionMap: {}
})

// Custom Event Name
const PRIVILEGE_UPDATE_EVENT = 'privilege-update'

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([])
  const [permissionMap, setPermissionMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // Helper: Convert list to map for O(1) access
  const normalizePermissions = (list) => {
    const map = {}
    list.forEach(item => {
      // API returns: { module_name: "Chemicals", is_read: 1, is_create: 0, ... }
      const backendName = item.module_name?.trim()

      if (backendName) {
        // 1. Try to find an alias
        // 2. Fallback to the backend name itself
        const frontendKey = PERMISSION_ALIASES[backendName] || backendName

        // Store standard object
        const permObj = {
          view: Number(item.is_read) === 1,
          create: Number(item.is_create) === 1,
          update: Number(item.is_update) === 1,
          delete: Number(item.is_delete) === 1,
          ...item
        }

        // Store by Frontend Key (Primary)
        map[frontendKey.toLowerCase()] = permObj

        // Store by Backend Name (Secondary/Fallback) - lowercase for easier lookup by ID/string
        if (frontendKey !== backendName) {
          map[backendName.toLowerCase()] = permObj
        }
      }
    })
    return map
  }

  const fetchPermissions = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user_info')
      if (!storedUser) {
        setPermissions([])
        setPermissionMap({})
        setIsLoading(false)
        return
      }

      const userInfo = JSON.parse(storedUser)
      const roleId = userInfo.role_id || userInfo.role?.id

      if (!roleId) {
        console.warn('⚠️ No Role ID found for logged in user.')
        setPermissions([])
        setPermissionMap({})
        setIsLoading(false)
        return
      }

      // Fetch from API
      const res = await getUserPrivilegeList(roleId)
      const data = res?.results || res?.data?.results || []

      console.log('🔐 Permissions fetched:', data.length, 'items')

      setPermissions(data)
      const normalizedMap = normalizePermissions(data)
      console.log('🗺️ Permission Map Keys:', Object.keys(normalizedMap))
      setPermissionMap(normalizedMap)

    } catch (error) {
      console.error('❌ Failed to fetch permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial Fetch & Listener
  useEffect(() => {
    fetchPermissions()

    // Listen for custom event to trigger refresh from anywhere
    const handleRemoteUpdate = () => {
      console.log('🔄 Permission refresh triggered by event')
      fetchPermissions()
    }

    window.addEventListener(PRIVILEGE_UPDATE_EVENT, handleRemoteUpdate)
    window.addEventListener('focus', handleRemoteUpdate) // Auto-refresh on tab focus

    return () => {
      window.removeEventListener(PRIVILEGE_UPDATE_EVENT, handleRemoteUpdate)
      window.removeEventListener('focus', handleRemoteUpdate)
    }
  }, [fetchPermissions])


  // Helper to check access
  const canAccess = useCallback((moduleName, action = 'view') => {
    // 🔴 ROLLBACK: Always allow access
    return true

    /* ORIGINAL LOGIC DISABLED
    if (!moduleName) return true

    // Normalize lookup to lowercase to avoid casing issues
    const key = moduleName.toLowerCase()
    const perm = permissionMap[key]

    // Debug helper (uncomment if stuck)
    // if (!perm) console.log(`🚫 Access denied or missing module: ${moduleName}`)

    if (!perm) return false // Strict deny if not found

    if (action === 'view') return perm.view
    if (action === 'create') return perm.create
    if (action === 'update' || action === 'edit') return perm.update
    if (action === 'delete') return perm.delete

    return false
    */
  }, [permissionMap])

  const triggerPrivilegeUpdate = () => {
    // Dispatch event so all tabs/components know to update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PRIVILEGE_UPDATE_EVENT))
    }
  }

  const value = {
    permissions,
    permissionMap,
    isLoading,
    canAccess,
    refreshPermissions: fetchPermissions,
    triggerPrivilegeUpdate
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export const usePermission = () => useContext(PermissionContext)
