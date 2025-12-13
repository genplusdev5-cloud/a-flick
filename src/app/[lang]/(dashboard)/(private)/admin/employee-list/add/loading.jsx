'use client'

import { Box } from '@mui/material'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

export default function Loading() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <ProgressCircularCustomization size={60} thickness={5} />
    </Box>
  )
}
