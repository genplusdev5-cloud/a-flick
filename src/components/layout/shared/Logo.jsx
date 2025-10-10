'use client'

import Image from 'next/image'
import { useTheme } from '@mui/material/styles'
import useVerticalNav from '@menu/hooks/useVerticalNav'

const Logo = (props) => {
  const { isCollapsed, isHovered } = useVerticalNav()
  const theme = useTheme()

  // collapsed but hovered → treat as expanded
  const isMini = isCollapsed && !isHovered

  let logoSrc
  if (isMini) {
    // Only icon
    logoSrc = theme.palette.mode === 'dark'
      ? '/aflick-icon-light.png'
      : '/aflick-icon.png'
  } else {
    // Full logo
    logoSrc = theme.palette.mode === 'dark'
      ? '/aflick-logo-light.png'
      : '/aflick-logo.png'
  }

  const size = isMini
    ? { width: 36, height: 36 }
    : { width: 160, height: 60 }

  return (
    <Image
      key={`${theme.palette.mode}-${isMini ? 'mini' : 'full'}`}
      src={logoSrc}
      alt="Aflick Logo"
      width={size.width}
      height={size.height}
      priority
      {...props}
    />
  )
}

export default Logo
