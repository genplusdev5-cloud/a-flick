'use client'

import Button from '@mui/material/Button'

export default function CustomContainedButton({
  children,
  sx = {},
  color = 'primary',
  variant = 'contained',
  ...props
}) {
  return (
    <Button
      variant={variant}
      color={color}
      disableElevation
      {...props}
      sx={{
        textTransform: 'none',
        borderRadius: 2,
        fontWeight: 600,
        px: 2.5,
        py: 1,
        boxShadow: '0 4px 12px rgba(115, 103, 240, 0.15)',
        '& .MuiButton-startIcon, & .MuiButton-endIcon': { mr: 1 },
        ...(color === 'secondary' && {
          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)'
        }),
        ...(color === 'success' && {
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
        }),
        ...(color === 'error' && {
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
        }),
        ...sx
      }}
    >
      {children}
    </Button>
  )
}
