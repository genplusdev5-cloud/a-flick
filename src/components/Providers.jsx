// Context Imports
import { NextAuthProvider } from '@/contexts/nextAuthProvider'
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import ReduxProvider from '@/redux-store/ReduxProvider'
import { PermissionProvider } from '@/contexts/PermissionContext'
import GlobalLoader from '@/components/common/GlobalLoader'

// Styled Component Imports
import AppReactToastify from '@/libs/styles/AppReactToastify'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

const Providers = async props => {
  // Props
  const { children, direction } = props

  // Vars
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()

  // Protect against unexpanded env values like '${BASEPATH}' which can
  // produce malformed URLs when used by NextAuth. Use a sensible default
  // of '/api/auth' when NEXTAUTH_BASEPATH is missing or contains '${'.
  const nextAuthBasePath =
    process.env.NEXTAUTH_BASEPATH && !process.env.NEXTAUTH_BASEPATH.includes('${')
      ? process.env.NEXTAUTH_BASEPATH
      : '/api/auth'

  return (
    <NextAuthProvider basePath={nextAuthBasePath}>
      <PermissionProvider>
        <VerticalNavProvider>
          <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
            <ThemeProvider direction={direction} systemMode={systemMode}>
              <ReduxProvider>
                <GlobalLoader />
                {children}
              </ReduxProvider>
              <AppReactToastify direction={direction} hideProgressBar />
            </ThemeProvider>
          </SettingsProvider>
        </VerticalNavProvider>
      </PermissionProvider>
    </NextAuthProvider>
  )
}

export default Providers
