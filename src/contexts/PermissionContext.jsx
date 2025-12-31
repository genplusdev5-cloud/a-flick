'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUserPrivilegeList } from '@/api/userPrivilege'
import { getEmployeeDetails } from '@/api/employee'
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
      // Robustly get the module name
      const backendName = (item.module_name || item.module || item.name)?.trim()

      if (backendName) {
        // 1. Try to find an alias
        // 2. Fallback to the backend name itself
        const frontendKey = PERMISSION_ALIASES[backendName] || backendName

        // Handle various boolean/integer formats from API (0/1, true/false, "0"/"1")
        const getBool = (val) => {
          if (val === true || val === 'true') return true
          if (val === 1 || val === '1') return true
          return false
        }

        // Store standard object with fallbacks
        const permObj = {
          view: getBool(item.is_read ?? item.view ?? item.can_view ?? item.read),
          create: getBool(item.is_create ?? item.create ?? item.can_create),
          update: getBool(item.is_update ?? item.update ?? item.can_update ?? item.edit ?? item.can_edit),
          delete: getBool(item.is_delete ?? item.delete ?? item.can_delete),
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
        console.warn('⚠️ No user_info in localStorage')
        // Only update if not already in initial/cleared state
        if (permissions.length > 0) setPermissions([])
        if (Object.keys(permissionMap).length > 0) setPermissionMap({})
        return
      }

      const userInfo = JSON.parse(storedUser)
      console.log('👤 User Info:', userInfo)

      let data = []

      // 1. Get current User ID from local storage (this is the only static thing we trust)
      const userId = userInfo.id || userInfo.user_id 
      
      if (!userId) {
        console.warn('⚠️ No user ID found in local storage')
        setIsLoading(false)
        return
      }

      // 2. Fetch FRESH user details to get the current Role ID
      const userDetails = await getEmployeeDetails(userId)
      const freshData = userDetails?.data || userDetails || {}
      
      // Try multiple possible keys for Role ID or Name
      const freshRoleId = 
        freshData.role_id || 
        freshData.user_role_id || 
        freshData.role?.id || 
        (freshData.user_roles && freshData.user_roles[0]?.id) ||
        userInfo.role_id || 
        userInfo.user_role_id // Fallback to localStorage

      if (!freshRoleId) {
        console.error('❌ RBAC: Could not find Role ID for user', userId, 'Response:', userDetails)
        setIsLoading(false)
        return
      }

      console.log('👤 RBAC: User ID:', userId, 'Email:', userInfo.email)
      console.log('✅ RBAC: freshRoleId detected:', freshRoleId)

      // 3. Fetch privileges for this FRESH role
      const res = await getUserPrivilegeList(freshRoleId)
      data = res?.results || res?.data?.results || res?.data || []
      
      console.log(`🔐 RBAC: Fetched ${data.length} privileges from backend for role ${freshRoleId}`)

      setPermissions(data)
      const normalizedMap = normalizePermissions(data)
      
      console.log('🗺️ RBAC: Permission map keys (normalized):', Object.keys(normalizedMap))
      
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
    // 1. Critical: Bypass all checks if user is not logged in (to prevent loops during logout)
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user_info')
      if (!storedUser) return true // Allow if no user, so auth guards can handle redirect cleanly
    }

    if (!moduleName) return true
    
    // ✅ Dashboard is common for all
    if (moduleName.toLowerCase() === 'dashboard') return true

    if (isLoading && permissions.length === 0) return true 

    // Normalize lookup to lowercase to avoid casing issues
    const key = moduleName.toLowerCase().trim()
    
    // Check if the module exists in our map
    const perm = permissionMap[key]

    if (!perm) {
       // If permissions are loaded and the map has data, but this key is missing, it's denied
       const hasPermissionsLoaded = !isLoading && Object.keys(permissionMap).length > 0
       if (hasPermissionsLoaded) {
         return false
       }
       return true // Default allow while initial loading is in progress
    }

    if (action === 'view') return perm.view
    if (action === 'create') return perm.create
    if (action === 'update' || action === 'edit') return perm.update
    if (action === 'delete') return perm.delete

    return false
  }, [permissionMap, isLoading, permissions])

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
