'use client'

import PermissionGuard from '@components/auth/PermissionGuard'

const CustomerAuditPageContent = () => (
  <div className='p-6'>
    <h1 className='text-2xl font-semibold mb-2'>🧍 Customer Audit</h1>
    <p className='text-gray-600'>This is a dummy page for Customer Audit.</p>
  </div>
)

export default function CustomerAuditPage() {
  return (
    <PermissionGuard permission="Customer Audit">
      <CustomerAuditPageContent />
    </PermissionGuard>
  )
}
