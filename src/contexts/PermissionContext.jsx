'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { getUserPrivilegeList } from '@/api/employee/userPrivilege'
import { getEmployeeDetails } from '@/api/employee'
import { useParams, usePathname } from 'next/navigation'
import { PERMISSION_ALIASES } from '@/constants/permissionAliases'

// Create Context
const PermissionContext = createContext({
  permissions: [],
  isLoading: true,
  canAccess: (module, action) => false,
  refreshPermissions: () => {},
  triggerPrivilegeUpdate: () => {}, // New helper to broadcast update
  permissionMap: {}
})

// Custom Event Name
const PRIVILEGE_UPDATE_EVENT = 'privilege-update'

export const PermissionProvider = ({ children }) => {
  const [state, setState] = useState({
    permissions: [],
    permissionMap: {},
    isLoading: true,
    isLoggedIn: typeof window !== 'undefined' ? !!localStorage.getItem('user_info') : false
  })

  const pathname = usePathname()

  // Helper: Convert list to map for O(1) access
  const normalizePermissions = useCallback(list => {
    const map = {}
    list.forEach(item => {
      const backendName = (item.module_name || item.module || item.name)?.trim()

      if (backendName) {
        const frontendKey = PERMISSION_ALIASES[backendName] || backendName

        const getBool = val => {
          if (val === true || val === 'true') return true
          if (val === 1 || val === '1') return true
          return false
        }

        const permObj = {
          view: getBool(item.is_read ?? item.view ?? item.can_view ?? item.read),
          create: getBool(item.is_create ?? item.create ?? item.can_create),
          update: getBool(item.is_update ?? item.update ?? item.can_update ?? item.edit ?? item.can_edit),
          delete: getBool(item.is_delete ?? item.delete ?? item.can_delete),
          ...item
        }

        map[frontendKey.toLowerCase().trim()] = permObj

        if (frontendKey !== backendName) {
          map[backendName.toLowerCase().trim()] = permObj
        }
      }
    })
    return map
  }, [])

  const fetchPermissions = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user_info')
      if (!storedUser) {
        setState(prev => ({ ...prev, permissions: [], permissionMap: {}, isLoading: false, isLoggedIn: false }))
        return
      }

      const userInfo = JSON.parse(storedUser)
      const userId = userInfo.id || userInfo.user_id

      if (!userId) {
        setState(prev => ({ ...prev, isLoading: false, isLoggedIn: true }))
        return
      }

      const userDetails = await getEmployeeDetails(userId)
      const freshData = userDetails?.data || userDetails || {}

      const freshRoleId =
        freshData.role_id ||
        freshData.user_role_id ||
        freshData.role?.id ||
        (freshData.user_roles && freshData.user_roles[0]?.id) ||
        userInfo.role_id ||
        userInfo.user_role_id

      if (!freshRoleId) {
        setState(prev => ({ ...prev, isLoading: false, isLoggedIn: true }))
        return
      }

      const res = await getUserPrivilegeList(freshRoleId)
      const data = res?.results || res?.data?.results || res?.data || []

      const normalizedMap = normalizePermissions(data)

      setState({
        permissions: data,
        permissionMap: normalizedMap,
        isLoading: false,
        isLoggedIn: true
      })
    } catch (error) {
      console.error('❌ Failed to fetch permissions:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [normalizePermissions])

  // Initial Fetch & Listener
  useEffect(() => {
    fetchPermissions()

    const handleRemoteUpdate = () => {
      fetchPermissions()
    }

    const handleUserInfoUpdate = () => {
      setState(prev => ({ ...prev, isLoggedIn: !!localStorage.getItem('user_info') }))
      fetchPermissions()
    }

    window.addEventListener(PRIVILEGE_UPDATE_EVENT, handleRemoteUpdate)
    window.addEventListener('user-info-update', handleUserInfoUpdate)

    return () => {
      window.removeEventListener(PRIVILEGE_UPDATE_EVENT, handleRemoteUpdate)
      window.removeEventListener('user-info-update', handleUserInfoUpdate)
    }
  }, [fetchPermissions])

  // Helper to check access - HIGH PERFORMANCE (No localStorage hits)
  const canAccess = useCallback(
    (moduleName, action = 'view') => {
      if (!state.isLoggedIn) return true
      if (!moduleName) return true

      if (moduleName.toLowerCase() === 'dashboard') return true

      if (state.isLoading && state.permissions.length === 0) return true

      const key = moduleName.toLowerCase().trim()
      const perm = state.permissionMap[key]

      if (!perm) {
        const hasPermissionsLoaded = !state.isLoading && Object.keys(state.permissionMap).length > 0
        return hasPermissionsLoaded ? false : true
      }

      if (action === 'view') return perm.view
      if (action === 'create') return perm.create
      if (action === 'update' || action === 'edit') return perm.update
      if (action === 'delete') return perm.delete

      return false
    },
    [state.isLoggedIn, state.isLoading, state.permissions.length, state.permissionMap]
  )

  const triggerPrivilegeUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PRIVILEGE_UPDATE_EVENT))
    }
  }

  const value = useMemo(
    () => ({
      permissions: state.permissions,
      permissionMap: state.permissionMap,
      isLoading: state.isLoading,
      isLoggedIn: state.isLoggedIn,
      canAccess,
      refreshPermissions: fetchPermissions,
      triggerPrivilegeUpdate
    }),
    [state.permissions, state.permissionMap, state.isLoading, state.isLoggedIn, canAccess, fetchPermissions]
  )

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export const usePermission = () => useContext(PermissionContext)
