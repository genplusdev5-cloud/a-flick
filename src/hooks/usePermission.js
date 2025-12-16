import { usePermission as useBasePermission } from '@/contexts/PermissionContext'

export const usePermission = () => {
    const context = useBasePermission()
    if (!context) {
        throw new Error('usePermission must be used within a PermissionProvider')
    }
    return context
}
