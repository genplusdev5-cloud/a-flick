'use client'

import React from 'react'
import { Box } from '@mui/material'

/**
 * StickyListLayout
 * Provides a fixed header section and a scrollable content area.
 * Designed for admin list pages where filters/summaries should stay visible.
 * 
 * @param {React.ReactNode} header - Fixed section (Breadcrumbs, Summary Cards, Filters)
 * @param {React.ReactNode} children - Scrollable section (Table, Grids)
 * @param {React.ReactNode} footer - Fixed section (Pagination, Status indicators)
 */
const StickyListLayout = ({ header, children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--header-height) - 40px)',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ flexShrink: 0, mb: 2 }}>{header}</Box>
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--mui-palette-divider)',
            borderRadius: '10px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--mui-palette-action-disabledBackground)'
          }
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default StickyListLayout
