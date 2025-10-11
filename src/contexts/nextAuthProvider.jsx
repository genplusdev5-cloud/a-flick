'use client'
// Third-party Imports
import { SessionProvider } from 'next-auth/react'

// SessionProvider wrapper used by the app's Providers component
export const NextAuthProvider = ({ children, ...rest }) => {
  return <SessionProvider {...rest}>{children}</SessionProvider>
}

export default NextAuthProvider
