'use client'

import PermissionGuard from '@/components/auth/PermissionGuard'
const ScdfReportPageContent = () => (
  <div className='p-6'>
    <h1 className='text-2xl font-semibold mb-2'>📘 SCDF Report</h1>
    <p className='text-gray-600'>This is a dummy page for SCDF Report.</p>
  </div>
)

export default function ScdfReportPage() {
  return (
    <PermissionGuard permission="SCDF Report">
      <ScdfReportPageContent />
    </PermissionGuard>
  )
}
