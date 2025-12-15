// ✅ FIXED VERSION (Vuexy Calendar Support Enabled)

import { headers } from 'next/headers'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// ✅ Import Global Styles (Add this 👇)

import 'react-perfect-scrollbar/dist/css/styles.css'
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

// ✅ Vuexy theme & translation imports
import TranslationWrapper from '@/hocs/TranslationWrapper'
import { i18n } from '@configs/i18n'
import { getSystemMode } from '@core/utils/serverHelpers'

// ✅ Import ClientWrapper
import ClientWrapper from '@/app/ClientWrapper'

export const metadata = {
  title: 'A-flick Pest Control Management'
}

export const viewport = {
  initialScale: 1,
  width: 'device-width'
}

const RootLayout = async props => {
  const params = await props.params
  const { children } = props

  const headersList = await headers()
  const systemMode = await getSystemMode()
  const direction = i18n.langDirection[params.lang]

  return (
    <html id='__next' lang={params.lang} dir={direction} suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        
        {/* ✅ Wrapped in ClientWrapper */}
        <ClientWrapper>
          <TranslationWrapper headersList={headersList} lang={params.lang}>
            {children}
          </TranslationWrapper>
        </ClientWrapper>
      </body>
    </html>
  )
}

export default RootLayout
