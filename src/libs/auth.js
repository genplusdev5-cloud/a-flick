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

        // normalize email for demo matching
        const normalized = (email || '').toLowerCase().trim()

        // ✅ Demo logins (no backend required)
        if ((normalized === 'admin@a-flick.com.sg' || normalized === 'admin@aflcik.com.sg') && password === '123456') {
          return { id: 1, name: 'Admin', email: normalized }
        }

        if (normalized === 'stark@gmail.com' && password === '123456') {
          return { id: 2, name: 'Stark', email: normalized }
        }

        // ❌ No match => return null
        return null
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
    async jwt({ token, user, account }) {
      if (user) {
        token.name = user.name
        token.email = user.email
        // Add role information to token if needed
        token.role = user.role || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email
        // Add role information to session if needed
        session.user.role = token.role
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
