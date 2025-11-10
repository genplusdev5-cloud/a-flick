// ✅ FIXED VERSION

import { headers } from 'next/headers'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import 'react-perfect-scrollbar/dist/css/styles.css'
import TranslationWrapper from '@/hocs/TranslationWrapper'
import { i18n } from '@configs/i18n'
import { getSystemMode } from '@core/utils/serverHelpers'
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'A-flick Pest Control Management'
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
        {/* ✅ Move TranslationWrapper inside body */}
        <TranslationWrapper headersList={headersList} lang={params.lang}>
          {children}
        </TranslationWrapper>
      </body>
    </html>
  )
}

export default RootLayout
