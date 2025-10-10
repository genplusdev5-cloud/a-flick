// Third-party Imports
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),

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

        // ✅ Demo login (no backend required)
        if (email === 'admin@vuexy.com' && password === 'admin') {
          return { id: 1, name: 'Admin', email }
        }

        if (email === 'stark@gmail.com' && password === '123456') {
          return { id: 2, name: 'Stark', email }
        }

        // ❌ If no match, throw error
        throw new Error(JSON.stringify({ message: ['Email or Password is invalid'] }))
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
