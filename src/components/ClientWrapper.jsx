'use client'

import { GlobalToastContainer } from '@/components/common/Toasts'

export default function ClientWrapper({ children }) {
  return (
    <>
      {children}
      <GlobalToastContainer />
    </>
  )
}
