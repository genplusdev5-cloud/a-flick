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
          // Use the absolute URL from .env or fallback to the one provided by the user
          let apiUrl = process.env.NEXT_PUBLIC_API_URL

          if (!apiUrl || typeof apiUrl !== 'string') {
            console.warn('NEXT_PUBLIC_API_URL is missing or invalid. Using default.')
            apiUrl = 'https://aflick.genpest360.com/api/'
          }
          if (!apiUrl.endsWith('/')) {
            apiUrl += '/'
          }

          console.log('NextAuth Authorize: Using API URL:', apiUrl)

          const formData = new FormData()
          formData.append('email', email)
          formData.append('password', password)

          const response = await fetch(`${apiUrl}auth/login/`, {
            method: 'POST',
            body: formData
          })

          const data = await response.json()

          if (data.status === 'success' && data.data) {
            // Return user object for next-auth session
            return {
              id: data.data.user_id || data.data.id,
              name: data.data.name,
              email: data.data.email,
              access_token: data.data.access,
              refresh_token: data.data.refresh,
              user_data: data.data // Keep the full data for JWT callback
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
