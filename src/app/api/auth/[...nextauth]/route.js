// Authentication removed: NextAuth API endpoints disabled.
// Export simple handlers that return 404 so signIn/signOut endpoints are inactive.
export async function GET() {
  return new Response('Not Found', { status: 404 })
}

export async function POST() {
  return new Response('Not Found', { status: 404 })
}
