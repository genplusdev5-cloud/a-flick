'use client'

import React from 'react'
import { Box } from '@mui/material'

/**
 * StickyListLayout
 * Provides a fixed header section, a flexible content area, and a fixed footer section.
 * 
 * @param {React.ReactNode} header - Fixed section (Breadcrumbs, Filters, Action Buttons)
 * @param {React.ReactNode} children - Main content area (usually a Card with a Table)
 * @param {React.ReactNode} footer - Fixed section (Pagination)
 */
const StickyListLayout = ({ header, children, footer }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'visible'
      }}
    >
      <Box sx={{ flexShrink: 0, mb: 1 }}>{header}</Box>
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
      {footer && <Box sx={{ flexShrink: 0, mt: 1 }}>{footer}</Box>}
    </Box>
  )
}

export default StickyListLayout

