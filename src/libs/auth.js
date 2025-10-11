// Third-party Imports
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
// Prisma adapter is optional; enable only if you want to persist users
// import { PrismaAdapter } from '@auth/prisma-adapter'
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

export const authOptions = {
  // adapter: PrismaAdapter(prisma), // uncomment if using Prisma

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
        // Accept both variants the user mentioned and the original demo email.
        if ((normalized === 'admin@a-flick.com.sg' || normalized === 'admin@aflcik.com.sg') && password === '123456') {
          return { id: 1, name: 'Admin', email: normalized }
        }

        if (normalized === 'stark@gmail.com' && password === '123456') {
          return { id: 2, name: 'Stark', email: normalized }
        }

        // ❌ No match => return null (NextAuth will return 401)
        // Throwing an Error with JSON was previously used; returning null is cleaner.
        return null
      }
    }),

    // Google login (optional, works if env vars set)
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
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email
      }
      return session
    }
  }
}
