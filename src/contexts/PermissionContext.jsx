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
    // ⚠️ REVERT: Disabled for now to restore original behavior
    setIsLoading(false)
    setPermissions([])
    setPermissionMap({})
    return

    /* 
    try {
      const storedUser = localStorage.getItem('user_info')
      if (!storedUser) {
        console.warn('⚠️ No user_info in localStorage')
        setPermissions([])
        setPermissionMap({})
        setIsLoading(false)
        return
      }

      const userInfo = JSON.parse(storedUser)
      console.log('👤 User Info:', userInfo)

      let data = []

      // 1. Get current User ID from local storage (this is the only static thing we trust)
      const userId = userInfo.id || userInfo.user_id 
      
      if (!userId) {
        console.warn('⚠️ No user ID found in local storage')
        return
      }

      // 2. Fetch FRESH user details to get the current Role ID
      const userDetails = await getEmployeeDetails(userId)
      // Check response structure: EditPage suggests res.data contains fields like user_role_id
      const freshData = userDetails?.data || userDetails || {}
      
      // Try multiple possible keys for Role ID
      const freshRoleId = freshData.user_role_id || freshData.role_id || freshData.role?.id

      if (!freshRoleId) {
        console.error('❌ Could not find Role ID for user', userId, 'Response:', userDetails)
        return
      }

      console.log('✅ Fresh Role ID fetched:', freshRoleId)

      // 3. Fetch privileges for this FRESH role
      const res = await getUserPrivilegeList(freshRoleId)
      data = res?.results || res?.data?.results || []

      console.log('🔐 Permissions Data to Process:', data)

      console.log('🔐 Permissions fetched Raw:', data)
      if (data.length > 0) {
        console.log('🧐 First item structure:', Object.keys(data[0]))
        console.log('🧐 First item sample:', data[0])
      }

      setPermissions(data)
      const normalizedMap = normalizePermissions(data)
      console.log('🗺️ Permission Map Created with Keys:', Object.keys(normalizedMap))
      
      setPermissionMap(normalizedMap)

    } catch (error) {
      console.error('❌ Failed to fetch permissions:', error)
    } finally {
      setIsLoading(false)
    }
    */
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
    // ⚠️ REVERT: Always allow access
    return true
    
    /* 
    if (!moduleName) return true

    // Normalize lookup to lowercase to avoid casing issues
    const key = moduleName.toLowerCase()
    const perm = permissionMap[key]

    if (!perm) {
       // console.warn(`🚫 Access Denied: Module "${moduleName}" not found in map. Keys avail:`, Object.keys(permissionMap))
       return false // Strict deny if not found
    }

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
