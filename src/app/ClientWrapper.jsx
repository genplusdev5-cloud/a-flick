'use client'

import { useEffect } from 'react'
import ClientOnly from '@/components/common/ClientOnly'
import runOneSignal from '@/utils/OneSignalInit'


export default function ClientWrapper({ children }) {
  useEffect(() => {
    console.log("ClientWrapper Loaded");
    runOneSignal() // <-- INITIALIZE ONESIGNAL
  }, [])

  return (
    <>
      {children}
    </>
  )
}
