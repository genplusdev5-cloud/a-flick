'use client'

import Button from '@mui/material/Button'

const GlobalButton = ({
  children,
  color = 'primary',
  variant = 'contained',
  fullWidth = false,
  disabled = false,
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
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      href={href}
      onClick={onClick}
      className={className}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        px: 2.5,
        height: 36,
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

export default GlobalButton
