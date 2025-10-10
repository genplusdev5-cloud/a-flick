// src/components/layout/ContentWrapper.jsx
'use client'

import React from 'react'
import { Box, Card, Typography } from '@mui/material'

/**
 * Universal page wrapper
 *
 * Props:
 * - title (string)    : Title to show in header
 * - actions (node)    : Action buttons (aligned right)
 * - children (node)   : Page specific content (search + table etc.)
 *
 * This ensures consistent header, spacing and card treatment across pages.
 */
const ContentWrapper = ({ title, actions, children }) => {
  return (
    <Card sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      {/* Header (title + actions). Header has underline and spacing to match other pages */}
      {title && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid',
            borderColor: 'divider',
            pb: 2,
            mb: 3
          }}
        >
          <Typography variant='h5'>{title}</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{actions}</Box>
        </Box>
      )}

      {/* Content */}
      <Box>{children}</Box>
    </Card>
  )
}

export default ContentWrapper
