const GuestOnlyRoute = async ({ children }) => {
  // Authentication is disabled: always render children (guest routes)
  return <>{children}</>
}

export default GuestOnlyRoute
