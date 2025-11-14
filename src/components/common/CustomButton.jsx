'use client'

import Button from '@mui/material/Button'

// 6 COLOR SET
const colorStyles = {
  primary: {
    main: '#8B0000',
    border: '#8B0000',
    hover: 'rgba(139,0,0,0.1)'
  },
  success: {
    main: '#2e7d32',
    border: '#2e7d32',
    hover: 'rgba(46, 125, 50, 0.1)'
  },
  error: {
    main: '#d32f2f',
    border: '#d32f2f',
    hover: 'rgba(211, 47, 47, 0.1)'
  },
  warning: {
    main: '#ed6c02',
    border: '#ed6c02',
    hover: 'rgba(237, 108, 2, 0.1)'
  },
  info: {
    main: '#0288d1',
    border: '#0288d1',
    hover: 'rgba(2, 136, 209, 0.1)'
  },
  purple: {
    main: '#6A1B9A',
    border: '#6A1B9A',
    hover: 'rgba(106, 27, 154, 0.1)'
  }
}

const CustomButton = ({
  children,
  color = 'primary',
  variant = 'outlined',
  size = 'small',
  sx = {},
  ...props
}) => {
  const themeColor = colorStyles[color] || colorStyles.primary

  const baseStyle = {
    borderRadius: '50px',
    fontWeight: 600,
    textTransform: 'none',
    padding: '4px 18px'
  }

  const variants = {
    outlined: {
      borderWidth: '1.8px',
      borderColor: themeColor.border,
      color: themeColor.main,
      '&:hover': {
        backgroundColor: themeColor.hover,
        borderColor: themeColor.border
      }
    },

    contained: {
      backgroundColor: themeColor.main,
      color: '#fff',
      '&:hover': {
        backgroundColor: themeColor.border
      }
    },

    tonal: {
      backgroundColor: themeColor.hover,
      color: themeColor.main,
      '&:hover': {
        backgroundColor: themeColor.hover
      }
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      {...props}
      sx={{
        ...baseStyle,
        ...variants[variant],
        ...sx
      }}
    >
      {children}
    </Button>
  )
}

export default CustomButton
