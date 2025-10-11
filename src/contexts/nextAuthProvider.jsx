'use client'

// Third-party Imports
import { SessionProvider } from 'next-auth/react'

// SessionProvider wrapper used by the app's Providers component
export const NextAuthProvider = ({ children, ...rest }) => {
  // sanitize basePath if provided (avoid values containing unexpanded ${...})
  const safeRest = { ...rest }
  if (safeRest.basePath && typeof safeRest.basePath === 'string' && safeRest.basePath.includes('${')) {
    delete safeRest.basePath
  }

  return <SessionProvider {...safeRest}>{children}</SessionProvider>
}

export default NextAuthProvider
