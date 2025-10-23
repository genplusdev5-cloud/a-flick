'use client'

// Next Imports
import { redirect, usePathname } from 'next/navigation'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const AuthRedirect = ({ lang }) => {
  const pathname = usePathname()

  // ℹ️ Bring me `lang`
  const login = `/${lang}/login`

  // If already on login page, stay. Otherwise always send to localized login.
  return redirect(pathname === login ? login : login)
}

export default AuthRedirect
