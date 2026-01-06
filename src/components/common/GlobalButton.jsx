'use client'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

const GlobalButton = ({
  children,
  color = 'primary',
  variant = 'contained',
  fullWidth = false,
  disabled = false,
  loading = false, // ✅ Destructure to fix React warning
  startIcon,
  endIcon,
  href,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      disabled={disabled || loading} // ✅ Disable when loading
      startIcon={loading ? null : startIcon} // ✅ Hide icons when loading
      endIcon={loading ? null : endIcon}
      href={href}
      onClick={onClick}
      className={className}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        px: 2.5,
        height: 36
      }}
      {...props}
    >
      {loading ? <CircularProgress size={20} color='inherit' /> : children}
    </Button>
  )
}

export default GlobalButton
