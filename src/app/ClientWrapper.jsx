'use client'

// src/app/ClientWrapper.jsx
import { GlobalToastContainer } from '@/components/common/Toasts'
import ClientOnly from '@/components/common/ClientOnly'

export default function ClientWrapper({ children }) {
  return (
    <>
      {children}
      <ClientOnly>
        <GlobalToastContainer />
      </ClientOnly>
    </>
  )
}
