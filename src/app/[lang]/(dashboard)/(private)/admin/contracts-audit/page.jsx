'use client'

import PermissionGuard from '@/components/PermissionGuard'

const ContractsAuditPageContent = () => (
  <div className='p-6'>
    <h1 className='text-2xl font-semibold mb-2'>📜 Contracts Audit</h1>
    <p className='text-gray-600'>This is a dummy page for Contracts Audit.</p>
  </div>
)

export default function ContractsAuditPage() {
  return (
    <PermissionGuard permission="Contracts Audit">
      <ContractsAuditPageContent />
    </PermissionGuard>
  )
}
