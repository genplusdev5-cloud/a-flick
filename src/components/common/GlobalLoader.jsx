'use client'

import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

const GlobalLoader = () => {
  const loadingCount = useSelector(state => state.loadingReducer.loadingCount)

  if (loadingCount === 0) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 4, // Thin bar at the top
        zIndex: 99999,
        pointerEvents: 'none' // Don't block interaction
      }}
    >
      <ProgressCircularCustomization size={40} thickness={4} />
    </Box>
  )
}

export default GlobalLoader
