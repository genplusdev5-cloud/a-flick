// src/app/layout.jsx
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
        <InitColorSchemeScript attribute="data" />
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}
