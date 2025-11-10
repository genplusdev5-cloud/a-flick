// src/app/layout.jsx
// SERVER COMPONENT – NO 'use client'

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import 'react-perfect-scrollbar/dist/css/styles.css'
import 'react-toastify/dist/ReactToastify.css'
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

import ClientWrapper from './ClientWrapper'

export const metadata = {
  title: 'A-Flick Pest Control Management',
  description: 'A-Flick - Admin Dashboard',
  viewport: 'initial-scale=1, width=device-width'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex is-full min-bs-full flex-auto flex-col">

        {/* MUI Theme Script */}
        <InitColorSchemeScript attribute="data" />

        {/* Global Client Wrapper — Toast Container + Client Components */}
        <ClientWrapper>
          {children}
        </ClientWrapper>

      </body>
    </html>
  )
}
