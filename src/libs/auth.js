// Third-party Imports
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
// Prisma adapter is optional; enable only if you want to persist users
// import { PrismaAdapter } from '@auth/prisma-adapter'
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      type: 'credentials',

      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },

      async authorize(credentials) {
        const { email, password } = credentials ?? {}

        if (!email || !password) return null

        try {
          const apiUrl = 'https://aflick.genpest360.com/api/auth/login/'
          console.log('NextAuth Authorize: Login attempt to', apiUrl)

          const formData = new FormData()
          formData.append('email', email)
          formData.append('password', password)

          const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
          })

          const data = await response.json()

          if (data.status === 'success' && data.data) {
            // Return user object for next-auth session
            // We map the API response exactly as requested to match Postman output
            return {
              id: data.data.user_id || data.data.id,
              // Some systems need 'id' as a string for NextAuth.
              user_id: data.data.user_id,
              auth_id: data.data.auth_id,
              name: data.data.name,
              email: data.data.email,
              access_token: data.data.access,
              refresh_token: data.data.refresh,
              user_privileges: data.data.user_privileges || [], // Explicitly expose privileges
              user_data: data.data // Keep the full data for JWT callback as fallback
            }
          }

          return null
        } catch (error) {
          console.error('Auth Error:', error)
          return null
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  pages: {
    signIn: '/admin/login'
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.email = user.email
        token.id = user.id
        token.access_token = user.access_token
        token.refresh_token = user.refresh_token
        token.user_data = user.user_data

        // Match Postman response fields
        token.auth_id = user.auth_id
        token.user_id = user.user_id
        token.user_privileges = user.user_privileges
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email
        session.user.id = token.id
        session.access_token = token.access_token
        session.refresh_token = token.refresh_token
        session.user_data = token.user_data

        // Match Postman response fields
        session.user.auth_id = token.auth_id
        session.user.user_id = token.user_id
        session.user.user_privileges = token.user_privileges
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle the redirect URL
      if (url.startsWith(baseUrl)) {
        // If it's an internal URL, allow it
        return url
      } else if (url.startsWith('/')) {
        // If it's a relative URL, make it absolute
        return `${baseUrl}${url}`
      }
      // Default redirect
      return '/en/admin/dashboards'
    }
  }
}
