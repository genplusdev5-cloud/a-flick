'use client'

// Authentication removed: do not use next-auth client provider.
// This provider is a noop wrapper so components that import it continue to work.
export const NextAuthProvider = ({ children }) => {
  return <>{children}</>
}

export default NextAuthProvider
