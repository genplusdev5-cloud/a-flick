'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardCRM from '@views/dashboards/crm/DashboardCRM'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardCRM />
    </ProtectedRoute>
  )
}
