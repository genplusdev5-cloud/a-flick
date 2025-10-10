export default function AuthGuard({ children }) {
  // Authentication is disabled — always render children
  return <>{children}</>
}
